#!/usr/bin/env node
// Load environment variables from .env file
import 'dotenv/config';

/**
 * Kahuna MCP Server
 *
 * Main entry point for the Kahuna MCP server.
 * Provides tools for AI assistants to interact with the Kahuna knowledge base.
 *
 * Tools:
 * - health_check: Verify MCP server connectivity
 * - kahuna_initialize: Set up a new Kahuna knowledge base
 * - kahuna_learn: Categorize and store knowledge files
 * - kahuna_prepare_context: Retrieve relevant context for a task
 * - kahuna_ask: Ask questions about the knowledge base
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { SERVER_NAME, SERVER_VERSION } from './config.js';
import { FileKnowledgeStorageService } from './storage/index.js';
import { askTool } from './tools/ask.js';
import { initializeTool } from './tools/initialize.js';
import { learnTool } from './tools/learn.js';
import { prepareContextTool } from './tools/prepare-context.js';
import type { ToolContext } from './tools/types.js';

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

/**
 * Health check tool - useful for verifying MCP server is working.
 */
const healthCheckTool = {
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
 * All registered tools.
 * Add new tool imports here as they are created.
 */
const allTools = [
  healthCheckTool,
  initializeTool.definition,
  learnTool.definition,
  prepareContextTool.definition,
  askTool.definition,
];

/**
 * Route a tool call to its handler.
 * This is the central dispatch for all tool invocations.
 */
async function routeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<CallToolResult> {
  switch (toolName) {
    case 'health_check': {
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
                  availableTools: allTools.map((t) => t.name),
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

    case 'kahuna_initialize':
      return initializeTool.handler(args, ctx);

    case 'kahuna_learn':
      return learnTool.handler(args, ctx);

    case 'kahuna_prepare_context':
      return prepareContextTool.handler(args, ctx);

    case 'kahuna_ask':
      return askTool.handler(args, ctx);

    default:
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Unknown tool: ${toolName}`,
              availableTools: allTools.map((t) => t.name),
            }),
          },
        ],
        isError: true,
      };
  }
}

// =============================================================================
// MAIN SERVER
// =============================================================================

async function main() {
  // Create local knowledge storage service
  const storage = new FileKnowledgeStorageService();

  // Build the shared tool context
  const ctx: ToolContext = { storage };

  // Create MCP server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ---------------------------------------------------------------------------
  // TOOL HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * List all available tools.
   * Called by MCP clients to discover what tools are available.
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  /**
   * Handle tool calls.
   * Routes the call to the appropriate tool handler.
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return routeToolCall(name, args ?? {}, ctx);
  });

  // ---------------------------------------------------------------------------
  // START SERVER
  // ---------------------------------------------------------------------------

  // Connect via stdio (standard for MCP servers)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log startup (to stderr so it doesn't interfere with MCP protocol on stdout)
  console.error(`[${SERVER_NAME}] Server started successfully`);
  console.error(`[${SERVER_NAME}] Tools available: ${allTools.map((t) => t.name).join(', ')}`);
}

// Run the server
main().catch((error) => {
  console.error('[kahuna-mcp-server] Fatal error:', error);
  process.exit(1);
});
