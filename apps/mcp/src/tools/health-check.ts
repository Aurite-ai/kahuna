/**
 * Health Check Tool - Verify MCP server connectivity
 *
 * A simple diagnostic tool that confirms the Kahuna MCP server is running
 * and responsive. Returns server identity and available tools.
 */

import { SERVER_NAME, SERVER_VERSION } from '../config.js';
import type { MCPToolResponse } from './response-utils.js';
import type { ToolContext } from './types.js';

/**
 * Tool definition for MCP registration.
 */
export const healthCheckToolDefinition = {
  name: 'health_check',
  description: `Check if the Kahuna MCP server is running correctly.

This tool verifies the MCP connection is working.

Actions:
- ping: Confirm MCP server is alive`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['ping'],
        description: 'Type of health check',
      },
    },
    required: ['action'],
  },
};

/**
 * Handle the health_check tool call.
 *
 * @param args - Tool arguments from MCP client
 * @param _ctx - Tool context (unused for health check)
 * @returns MCP tool response with server status
 */
export async function healthCheckToolHandler(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<MCPToolResponse> {
  const action = (args as { action?: string }).action || 'ping';

  if (action === 'ping') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Kahuna MCP server is running!',
              server: SERVER_NAME,
              version: SERVER_VERSION,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: false,
            error: `Unknown action: ${action}`,
            validActions: ['ping'],
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}

/**
 * Export the tool definition and handler together.
 */
export const healthCheckTool = {
  definition: healthCheckToolDefinition,
  handler: healthCheckToolHandler,
};
