#!/usr/bin/env node
/**
 * Kahuna MCP Server
 *
 * MCP server providing context management tools for AI coding assistants.
 * This server runs via stdio and provides tools for managing knowledge bases
 * and project context.
 *
 * USAGE:
 * Configure in Claude Desktop (or other MCP client):
 *    {
 *      "mcpServers": {
 *        "kahuna": {
 *          "command": "node",
 *          "args": ["/path/to/kahuna/dist/index.js"]
 *        }
 *      }
 *    }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Import the tool registry
import { allToolDefinitions, getToolNames, routeToolCall } from './tools/index.js';

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

const SERVER_NAME = 'kahuna-mcp-server';
const SERVER_VERSION = '0.1.0';

// =============================================================================
// MAIN SERVER
// =============================================================================

async function main() {
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
   * Tools are registered in src/tools/index.ts
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allToolDefinitions };
  });

  /**
   * Handle tool calls.
   * Routing is handled by src/tools/index.ts
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return routeToolCall(name, args ?? {});
  });

  // ---------------------------------------------------------------------------
  // START SERVER
  // ---------------------------------------------------------------------------

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log startup (to stderr so it doesn't interfere with MCP protocol on stdout)
  console.error(`[${SERVER_NAME}] Server started successfully`);
  console.error(`[${SERVER_NAME}] Tools available: ${getToolNames().join(', ')}`);
}

// Run the server
main().catch((error) => {
  console.error('[kahuna-mcp-server] Fatal error:', error);
  process.exit(1);
});
