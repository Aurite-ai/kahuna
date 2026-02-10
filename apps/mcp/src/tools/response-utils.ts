/**
 * Shared MCP Tool Response Utilities
 *
 * Common response formatting helpers used by all Kahuna MCP tools.
 * Provides consistent success and error response structures.
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
 * Helper to create a success response.
 *
 * @deprecated Will be removed in Subtask 2. Use markdownResponse() for new code.
 * @param data - Response data to include (will be JSON stringified)
 * @returns Formatted MCP success response
 */
export function successResponse(data: unknown): MCPToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: true, data }, null, 2),
      },
    ],
  };
}

/**
 * Helper to create an error response.
 *
 * @param message - Error message
 * @param details - Optional additional details (hints, context, etc.)
 * @returns Formatted MCP error response
 */
export function errorResponse(message: string, details?: unknown): MCPToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: false, error: message, details }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Build an MCP tool response from markdown text.
 * All new tools return markdown with <hints>.
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
