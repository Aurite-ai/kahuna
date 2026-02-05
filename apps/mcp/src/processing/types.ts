/**
 * Type definitions for conversation log processing.
 */

/**
 * Raw JSONL message types from Claude Code logs.
 */

export interface BaseJsonlMessage {
  type: string;
  uuid?: string;
  parentUuid?: string | null;
  sessionId?: string;
  timestamp?: string;
}

export interface UserJsonlMessage extends BaseJsonlMessage {
  type: "user";
  message: {
    role: "user";
    content: string | ContentBlock[];
  };
  cwd?: string;
  gitBranch?: string;
}

export interface AssistantJsonlMessage extends BaseJsonlMessage {
  type: "assistant";
  message: {
    role: "assistant";
    model?: string;
    id?: string;
    content: ContentBlock[];
    stop_reason?: string | null;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };
  requestId?: string;
}

export interface ProgressJsonlMessage extends BaseJsonlMessage {
  type: "progress";
  data: {
    message: {
      type: string;
      timestamp?: string;
      message?: {
        role: string;
        content: ContentBlock[];
      };
      uuid?: string;
    };
    normalizedMessages?: unknown[];
    type: string;
    prompt?: string;
  };
}

export interface FileHistorySnapshotMessage extends BaseJsonlMessage {
  type: "file-history-snapshot";
  messageId?: string;
  snapshot?: unknown;
}

export interface SystemMessage extends BaseJsonlMessage {
  type: "system";
  subtype?: string;
  durationMs?: number;
}

/**
 * Content block types within messages.
 */
export interface TextContentBlock {
  type: "text";
  text: string;
}

export interface ThinkingContentBlock {
  type: "thinking";
  thinking: string;
  signature?: string;
}

export interface ToolUseContentBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultContentBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock =
  | TextContentBlock
  | ThinkingContentBlock
  | ToolUseContentBlock
  | ToolResultContentBlock;

/**
 * Union type for all raw JSONL message types.
 */
export type RawJsonlMessage =
  | UserJsonlMessage
  | AssistantJsonlMessage
  | ProgressJsonlMessage
  | FileHistorySnapshotMessage
  | SystemMessage;

/**
 * Session metadata extracted from the first message.
 */
export interface SessionMetadata {
  sessionId: string;
  project: string;
  timestamp: string;
  gitBranch?: string;
  cwd?: string;
}

/**
 * A cleaned message ready for markdown formatting.
 */
export interface CleanMessage {
  role: "user" | "assistant" | "tool_result" | "skill_start" | "skill_result";
  content: string;
  toolName?: string;
  skillName?: string;
  timestamp?: string;
  depth: number; // 0 for top-level, 1+ for nested skills
}

/**
 * The output of Stage 1 preprocessing.
 */
export interface CleanConversation {
  metadata: SessionMetadata;
  messages: CleanMessage[];
  markdown: string;
}

/**
 * A decision made during the conversation.
 */
export interface Decision {
  decision: string;
  rationale?: string;
}

/**
 * The final summary output from Stage 2.
 */
export interface ConversationSummary {
  title: string;
  summary: string;
  taskType: "design" | "implementation" | "debugging" | "research" | "refactoring" | "other";
  outcome: "completed" | "in-progress" | "blocked" | "abandoned";
  decisions: Decision[];
  filesCreated: string[];
  filesModified: string[];
  confidence: number;
}
