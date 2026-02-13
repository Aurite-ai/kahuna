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

import Anthropic from '@anthropic-ai/sdk';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { SERVER_NAME, SERVER_VERSION } from './config.js';
import { FileKnowledgeStorageService } from './knowledge/index.js';
import { askTool } from './tools/ask.js';
import { healthCheckTool } from './tools/health-check.js';
import { initializeTool } from './tools/initialize.js';
import { learnTool } from './tools/learn.js';
import { listIntegrationsTool } from './tools/list-integrations.js';
import { prepareContextTool } from './tools/prepare-context.js';
import type { ToolContext } from './tools/types.js';
import { useIntegrationTool } from './tools/use-integration.js';
import { verifyIntegrationTool } from './tools/verify-integration.js';

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

/**
 * All registered tools.
 * Add new tool imports here as they are created.
 */
const allTools = [
  healthCheckTool.definition,
  initializeTool.definition,
  learnTool.definition,
  prepareContextTool.definition,
  askTool.definition,
  // Integration tools
  listIntegrationsTool.definition,
  useIntegrationTool.definition,
  verifyIntegrationTool.definition,
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
    case 'health_check':
      return healthCheckTool.handler(args, ctx);

    case 'kahuna_initialize':
      return initializeTool.handler(args, ctx);

    case 'kahuna_learn':
      return learnTool.handler(args, ctx);

    case 'kahuna_prepare_context':
      return prepareContextTool.handler(args, ctx);

    case 'kahuna_ask':
      return askTool.handler(args, ctx);

    // Integration tools
    case 'kahuna_list_integrations':
      return listIntegrationsTool.handler(args, ctx);

    case 'kahuna_use_integration':
      return useIntegrationTool.handler(args, ctx);

    case 'kahuna_verify_integration':
      return verifyIntegrationTool.handler(args, ctx);

    default:
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${toolName}`,
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

  // Create shared Anthropic client (used by agent-based tools)
  const anthropic = new Anthropic();

  // Build the shared tool context
  const ctx: ToolContext = { storage, anthropic };

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
