/**
 * Stage 1: JSONL Preprocessor
 *
 * Converts Claude Code conversation logs (JSONL) into clean markdown.
 * This is deterministic preprocessing - no LLM involved.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type {
  AssistantJsonlMessage,
  CleanMessage,
  ContentBlock,
  ProgressJsonlMessage,
  RawJsonlMessage,
  SessionMetadata,
  TextContentBlock,
  ToolResultContentBlock,
  ToolUseContentBlock,
  UserJsonlMessage,
} from "./types.js";

/**
 * Read and parse a JSONL file into raw messages.
 */
export function readJsonlFile(filePath: string): RawJsonlMessage[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  return lines.map((line, index) => {
    try {
      return JSON.parse(line) as RawJsonlMessage;
    } catch (error) {
      console.warn(`Warning: Failed to parse line ${index + 1}: ${error}`);
      return { type: "system" } as RawJsonlMessage;
    }
  });
}

/**
 * Extract session metadata from the first user message.
 */
export function extractMetadata(
  messages: RawJsonlMessage[],
  filePath: string
): SessionMetadata {
  // Extract session ID from filename (UUID pattern)
  const filename = path.basename(filePath, ".jsonl");
  const sessionId = filename;

  // Find first user message for metadata
  const firstUser = messages.find(
    (m): m is UserJsonlMessage => m.type === "user"
  );

  // Extract project name from cwd
  let project = "unknown";
  if (firstUser?.cwd) {
    const parts = firstUser.cwd.split("/");
    project = parts[parts.length - 1] || "unknown";
  }

  return {
    sessionId,
    project,
    timestamp: firstUser?.timestamp || new Date().toISOString(),
    gitBranch: firstUser?.gitBranch,
    cwd: firstUser?.cwd,
  };
}

/**
 * Check if a content block is a text block.
 */
function isTextBlock(block: ContentBlock): block is TextContentBlock {
  return block.type === "text";
}

/**
 * Check if a content block is a tool use block.
 */
function isToolUseBlock(block: ContentBlock): block is ToolUseContentBlock {
  return block.type === "tool_use";
}

/**
 * Check if a content block is a tool result block.
 */
function isToolResultBlock(block: ContentBlock): block is ToolResultContentBlock {
  return block.type === "tool_result";
}

/**
 * Extract text content from content blocks, filtering out thinking blocks.
 */
function extractTextContent(content: string | ContentBlock[]): string {
  if (typeof content === "string") {
    return content;
  }

  const textParts: string[] = [];

  for (const block of content) {
    if (isTextBlock(block)) {
      textParts.push(block.text);
    } else if (isToolUseBlock(block)) {
      // Format tool use as readable text
      const inputStr =
        typeof block.input === "string"
          ? block.input
          : JSON.stringify(block.input, null, 2);
      textParts.push(`**Tool: ${block.name}**\n\`\`\`json\n${inputStr}\n\`\`\``);
    } else if (isToolResultBlock(block)) {
      // Truncate long tool results
      let resultContent = block.content;
      if (resultContent.length > 1000) {
        resultContent = `${resultContent.slice(0, 1000)}\n... (truncated)`;
      }
      textParts.push(`**Tool Result:**\n\`\`\`\n${resultContent}\n\`\`\``);
    }
    // Skip thinking blocks entirely
  }

  return textParts.join("\n\n");
}

/**
 * Process a user message.
 */
function processUserMessage(msg: UserJsonlMessage, depth: number): CleanMessage {
  return {
    role: "user",
    content: extractTextContent(msg.message.content),
    timestamp: msg.timestamp,
    depth,
  };
}

/**
 * Process an assistant message.
 */
function processAssistantMessage(
  msg: AssistantJsonlMessage,
  depth: number
): CleanMessage[] {
  const messages: CleanMessage[] = [];
  const content = msg.message.content;

  // Check for skill invocations
  for (const block of content) {
    if (isToolUseBlock(block) && block.name === "Skill") {
      // This is a skill invocation
      const skillName =
        typeof block.input === "object" && "skill" in block.input
          ? String(block.input.skill)
          : "unknown";

      messages.push({
        role: "skill_start",
        content: "",
        skillName,
        timestamp: msg.timestamp,
        depth,
      });
    }
  }

  // Extract regular content (text, non-skill tool uses)
  const textContent = extractTextContent(content);
  if (textContent.trim()) {
    messages.push({
      role: "assistant",
      content: textContent,
      timestamp: msg.timestamp,
      depth,
    });
  }

  return messages;
}

/**
 * Process a progress message (nested skill content).
 */
function processProgressMessage(
  msg: ProgressJsonlMessage,
  depth: number
): CleanMessage[] {
  const messages: CleanMessage[] = [];
  const data = msg.data;

  if (!data?.message?.message) {
    return messages;
  }

  const innerMessage = data.message.message;
  const role = innerMessage.role;

  if (role === "user") {
    // Tool result within skill
    const content = extractTextContent(innerMessage.content);
    if (content.trim()) {
      messages.push({
        role: "tool_result",
        content,
        timestamp: data.message.timestamp,
        depth,
      });
    }
  } else if (role === "assistant") {
    // Assistant message within skill
    const content = extractTextContent(innerMessage.content);
    if (content.trim()) {
      messages.push({
        role: "assistant",
        content,
        timestamp: data.message.timestamp,
        depth,
      });
    }
  }

  return messages;
}

/**
 * Filter and flatten messages from raw JSONL.
 */
export function filterMessages(rawMessages: RawJsonlMessage[]): CleanMessage[] {
  const cleanMessages: CleanMessage[] = [];
  let currentDepth = 0;
  let inSkill = false;

  for (const raw of rawMessages) {
    switch (raw.type) {
      case "user": {
        // Check if this is a skill result
        const userMsg = raw as UserJsonlMessage;
        const content = userMsg.message.content;

        if (Array.isArray(content)) {
          // Check for tool_result indicating skill completion
          for (const block of content) {
            if (isToolResultBlock(block) && block.content.includes("Skill")) {
              // Skill completed
              if (inSkill && currentDepth > 0) {
                currentDepth--;
                inSkill = currentDepth > 0;

                // Extract skill result summary
                const resultContent = block.content;
                const resultMatch = resultContent.match(/Result:\s*([\s\S]*)/);
                if (resultMatch) {
                  cleanMessages.push({
                    role: "skill_result",
                    content: resultMatch[1].trim(),
                    timestamp: userMsg.timestamp,
                    depth: currentDepth,
                  });
                }
              }
            }
          }
        }

        cleanMessages.push(processUserMessage(userMsg, currentDepth));
        break;
      }

      case "assistant": {
        const assistantMsgs = processAssistantMessage(
          raw as AssistantJsonlMessage,
          currentDepth
        );

        for (const msg of assistantMsgs) {
          if (msg.role === "skill_start") {
            inSkill = true;
            currentDepth++;
          }
          cleanMessages.push(msg);
        }
        break;
      }

      case "progress": {
        const progressMsgs = processProgressMessage(
          raw as ProgressJsonlMessage,
          currentDepth
        );
        cleanMessages.push(...progressMsgs);
        break;
      }

      // Discard: file-history-snapshot, system (turn_duration)
      default:
        break;
    }
  }

  return cleanMessages;
}

/**
 * Format clean messages as markdown.
 */
export function formatAsMarkdown(
  messages: CleanMessage[],
  metadata: SessionMetadata
): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push("---");
  lines.push(`session_id: ${metadata.sessionId}`);
  lines.push(`project: ${metadata.project}`);
  lines.push(`timestamp: ${metadata.timestamp}`);
  if (metadata.gitBranch) {
    lines.push(`git_branch: ${metadata.gitBranch}`);
  }
  if (metadata.cwd) {
    lines.push(`cwd: ${metadata.cwd}`);
  }
  lines.push("---");
  lines.push("");
  lines.push("# Conversation");
  lines.push("");

  let currentSkillName = "";

  for (const msg of messages) {
    const headingLevel = "#".repeat(Math.min(msg.depth + 2, 6));

    switch (msg.role) {
      case "user":
        lines.push(`${headingLevel} User`);
        lines.push("");
        lines.push(msg.content);
        lines.push("");
        break;

      case "assistant":
        lines.push(`${headingLevel} Assistant`);
        lines.push("");
        lines.push(msg.content);
        lines.push("");
        break;

      case "skill_start":
        currentSkillName = msg.skillName || "unknown";
        lines.push(`${headingLevel} Skill: ${currentSkillName}`);
        lines.push("");
        break;

      case "skill_result":
        lines.push(`${"#".repeat(Math.min(msg.depth + 3, 6))} Skill Result`);
        lines.push("");
        lines.push(msg.content);
        lines.push("");
        break;

      case "tool_result":
        lines.push(`${headingLevel} Tool Result`);
        lines.push("");
        lines.push(msg.content);
        lines.push("");
        break;
    }
  }

  return lines.join("\n");
}

/**
 * Main preprocessing function.
 * Takes a JSONL file path and returns clean markdown + metadata.
 */
export function preprocessJsonl(filePath: string): {
  markdown: string;
  metadata: SessionMetadata;
} {
  const rawMessages = readJsonlFile(filePath);
  const metadata = extractMetadata(rawMessages, filePath);
  const cleanMessages = filterMessages(rawMessages);
  const markdown = formatAsMarkdown(cleanMessages, metadata);

  return { markdown, metadata };
}
