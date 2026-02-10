/**
 * Shared MCP Tool Response Utilities
 *
 * All tools return markdown with <hints> via markdownResponse().
 */

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
