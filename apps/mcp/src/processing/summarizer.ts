/**
 * Stage 2: Summary Agent
 *
 * Uses Sonnet 4.5 to generate structured summaries from clean conversation markdown.
 */

import Anthropic from "@anthropic-ai/sdk";
import { ConversationSummarySchema } from "./schemas.js";
import { getConversationSummaryJsonSchema } from "./schemas.js";
import type { ConversationSummary } from "./types.js";

/**
 * Simple token estimation based on character count.
 * Claude uses roughly 4 characters per token on average.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split markdown at message boundaries for chunking.
 */
export function chunkConversation(markdown: string, maxTokens: number): string[] {
  const estimatedTotal = estimateTokens(markdown);

  if (estimatedTotal <= maxTokens) {
    return [markdown];
  }

  const chunks: string[] = [];

  // Extract frontmatter to include in each chunk
  const frontmatterMatch = markdown.match(/^---\n[\s\S]*?\n---\n/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[0] : "";
  const content = frontmatter ? markdown.slice(frontmatter.length) : markdown;

  // Split by top-level headings (## User, ## Assistant)
  const sections = content.split(/(?=^## )/m);

  let currentChunk = frontmatter;
  let currentTokens = estimateTokens(frontmatter);

  for (const section of sections) {
    const sectionTokens = estimateTokens(section);

    if (currentTokens + sectionTokens > maxTokens && currentChunk !== frontmatter) {
      // Save current chunk and start new one
      chunks.push(currentChunk);
      currentChunk = frontmatter;
      currentTokens = estimateTokens(frontmatter);
    }

    currentChunk += section;
    currentTokens += sectionTokens;
  }

  // Don't forget the last chunk
  if (currentChunk !== frontmatter) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * The prompt template for summarization.
 */
const SUMMARIZATION_PROMPT = `You are a technical documentation agent. Your task is to read a coding copilot conversation and produce a structured summary.

The conversation is between a user and an AI coding assistant. Extract:
- What the user was trying to accomplish
- Key decisions made and why
- Files that were created or modified
- The outcome of the conversation

**Voice and Perspective:**
Write in third person, objective voice. Refer to the participants as "the user"
and "the copilot" (or "the AI assistant"). Do not use first person.

Good: "The copilot created a design document after gathering requirements."
Bad: "I created a design document after gathering requirements."

Good: "The user requested a new authentication system."
Bad: "You requested a new authentication system."

Be concise but capture the important context that would help someone understand what happened without reading the full conversation.

Focus on:
- WHY decisions were made, not just what
- Problems encountered and how they were resolved
- The final state of the work

Conversation:
`;

/**
 * Initialize the Anthropic client.
 */
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  return new Anthropic({ apiKey });
}

/**
 * Summarize a single chunk of conversation.
 */
async function summarizeChunk(
  client: Anthropic,
  markdown: string,
  priorSummary?: string
): Promise<ConversationSummary> {
  let prompt = SUMMARIZATION_PROMPT + markdown;

  if (priorSummary) {
    prompt = `Previous chunk summary for context:\n${priorSummary}\n\n${prompt}`;
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    tools: [
      {
        name: "create_summary",
        description: "Create a structured summary of the conversation",
        input_schema: getConversationSummaryJsonSchema() as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "create_summary" },
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract the tool use result
  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("No tool use in response");
  }

  // Validate the result against our schema
  const result = ConversationSummarySchema.parse(toolUse.input);

  return result;
}

/**
 * Format cumulative context for chunk chaining.
 * Includes all important information from previous chunks.
 */
function formatCumulativeContext(
  summary: ConversationSummary,
  cumulativeDecisions: string[],
  cumulativeFilesCreated: string[],
  cumulativeFilesModified: string[]
): string {
  const parts: string[] = [
    "Previous chunks summary:",
    `- Title: ${summary.title}`,
    `- Summary so far: ${summary.summary}`,
  ];

  if (cumulativeDecisions.length > 0) {
    parts.push(`- Decisions made: ${cumulativeDecisions.join("; ")}`);
  }

  if (cumulativeFilesCreated.length > 0) {
    parts.push(`- Files created: ${cumulativeFilesCreated.join(", ")}`);
  }

  if (cumulativeFilesModified.length > 0) {
    parts.push(`- Files modified: ${cumulativeFilesModified.join(", ")}`);
  }

  parts.push(
    "",
    "Continue summarizing from where we left off. The final chunk should produce",
    "a consolidated summary that covers the entire conversation."
  );

  return parts.join("\n");
}

/**
 * Main summarization function with chunking support.
 */
export async function summarizeConversation(
  markdown: string,
  maxChunkTokens = 100000 // Leave room for prompt and response (Sonnet has 200k context)
): Promise<ConversationSummary> {
  const client = getAnthropicClient();
  const chunks = chunkConversation(markdown, maxChunkTokens);

  if (chunks.length === 1) {
    // Single chunk - straightforward summarization
    return summarizeChunk(client, chunks[0]);
  }

  // Multiple chunks - chain summaries with cumulative context
  console.log(`Processing ${chunks.length} chunks...`);

  let priorSummary: string | undefined;
  let cumulativeDecisions: string[] = [];
  let cumulativeFilesCreated: string[] = [];
  let cumulativeFilesModified: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`  Processing chunk ${i + 1}/${chunks.length}...`);

    const summary = await summarizeChunk(client, chunks[i], priorSummary);

    // Accumulate context from this chunk
    const newDecisions = summary.decisions.map((d) => d.decision);
    cumulativeDecisions = [...new Set([...cumulativeDecisions, ...newDecisions])];
    cumulativeFilesCreated = [...new Set([...cumulativeFilesCreated, ...summary.filesCreated])];
    cumulativeFilesModified = [...new Set([...cumulativeFilesModified, ...summary.filesModified])];

    if (i < chunks.length - 1) {
      // Not the last chunk - create cumulative context for next chunk
      priorSummary = formatCumulativeContext(
        summary,
        cumulativeDecisions,
        cumulativeFilesCreated,
        cumulativeFilesModified
      );
    } else {
      // Last chunk - return the final summary
      return summary;
    }
  }

  // This shouldn't happen, but TypeScript needs it
  throw new Error("No chunks to process");
}

/**
 * Retry wrapper for API calls.
 */
export async function summarizeWithRetry(
  markdown: string,
  maxRetries = 3
): Promise<ConversationSummary> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await summarizeConversation(markdown);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a retryable error
      const isRetryable =
        lastError.message.includes("rate_limit") ||
        lastError.message.includes("overloaded") ||
        lastError.message.includes("timeout");

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = 2 ** attempt * 1000;
      console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
