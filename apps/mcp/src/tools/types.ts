/**
 * Shared tool types and response utilities
 *
 * Defines the ToolContext interface, ToolHandler type, MCPToolResponse interface,
 * and markdownResponse() helper used by all tool handlers.
 * Ensures consistent signatures across all MCP tools.
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { KnowledgeStorageService } from '../knowledge/index.js';
import type { UsageTracker } from '../usage/index.js';

/**
 * MCP tool response format.
 * All MCP tool handlers return this structure.
 */
export interface MCPToolResponse {
  [key: string]: unknown;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Build an MCP tool response from markdown text.
 * All tools return markdown with <hints>.
 *
 * @param markdown - Markdown text to return to the copilot
 * @param isError - Whether this response represents an error state
 * @returns Formatted MCP tool response
 */
export function markdownResponse(markdown: string, isError?: boolean): MCPToolResponse {
  return {
    content: [{ type: 'text', text: markdown }],
    ...(isError && { isError: true }),
  };
}

/**
 * Context object passed to all tool handlers.
 * Provides access to shared services and configuration.
 */
export interface ToolContext {
  storage: KnowledgeStorageService;
  anthropic: Anthropic;
  /** Usage tracker for cost and token tracking */
  usageTracker: UsageTracker;
}

/**
 * Standard tool handler function signature.
 * All MCP tool handlers should conform to this type.
 */
export type ToolHandler = (
  args: Record<string, unknown>,
  ctx: ToolContext
) => Promise<MCPToolResponse>;

/**
 * Build an MCP tool response with usage information appended.
 * Use this for tools that make LLM calls and want to show usage stats.
 *
 * @param markdown - Markdown text to return to the copilot
 * @param usageTracker - Usage tracker with recorded calls
 * @param isError - Whether this response represents an error state
 * @returns Formatted MCP tool response with usage summary
 */
export function markdownResponseWithUsage(
  markdown: string,
  usageTracker: UsageTracker,
  isError?: boolean
): MCPToolResponse {
  const display = usageTracker.getLastCallDisplay();

  // Append usage summary if available and tracking is enabled
  const finalMarkdown =
    display && usageTracker.shouldIncludeInResponses()
      ? `${markdown}\n\n${display.markdown}`
      : markdown;

  return {
    content: [{ type: 'text', text: finalMarkdown }],
    ...(isError && { isError: true }),
  };
}
