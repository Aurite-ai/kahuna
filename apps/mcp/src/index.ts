#!/usr/bin/env node
// Load environment variables from .env file
import 'dotenv/config';

/**
 * Kahuna MCP Server
 *
 * This is the main entry point for the Kahuna MCP server.
 * It wraps the existing Kahuna tRPC API as MCP tools, allowing
 * AI assistants like Claude to interact with Kahuna programmatically.
 *
 * USAGE:
 * 1. Set environment variables:
 *    - KAHUNA_API_URL: Base URL of the Kahuna API (default: http://localhost:3000)
 *    - KAHUNA_SESSION_TOKEN: Session token for authentication
 *
 * 2. Run the server:
 *    - npx kahuna-mcp (if installed globally)
 *    - pnpm --filter @kahuna/mcp-server start (from monorepo root)
 *
 * 3. Configure in Claude Desktop:
 *    {
 *      "mcpServers": {
 *        "kahuna": {
 *          "command": "npx",
 *          "args": ["kahuna-mcp"],
 *          "env": {
 *            "KAHUNA_API_URL": "http://localhost:3000",
 *            "KAHUNA_SESSION_TOKEN": "your-session-token"
 *          }
 *        }
 *      }
 *    }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { type KahunaClient, createClientFromEnv } from './client.js';
import { FileKnowledgeStorageService, type KnowledgeStorageService } from './storage/index.js';
import { initializeTool } from './tools/initialize.js';
import { learnTool } from './tools/learn.js';
import { prepareContextTool } from './tools/prepare-context.js';

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

const SERVER_NAME = 'kahuna-mcp-server';
const SERVER_VERSION = '0.0.1';

/**
 * Health check tool - useful for verifying MCP server is working
 * without needing the Kahuna API to be running.
 */
const healthCheckTool = {
  name: 'health_check',
  description: `Check if the Kahuna MCP server is running correctly.

This tool helps verify the MCP connection is working. It can optionally
ping the Kahuna API to verify end-to-end connectivity.

Actions:
- ping: Just confirm MCP server is alive (no API needed)
- api: Ping the Kahuna API to verify connectivity (API must be running)`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['ping', 'api'],
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
  // Future tools:
  // setupTool.definition,
  // askTool.definition,
  // reviewTool.definition,
  // syncTool.definition,
];

/**
 * Route a tool call to its handler.
 * This is the central dispatch for all tool invocations.
 */
async function routeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  client: KahunaClient,
  storage: KnowledgeStorageService
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

      if (action === 'api') {
        try {
          const result = await client.healthPing();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: 'Kahuna API is reachable!',
                    apiResponse: result,
                    mcpServer: {
                      name: SERVER_NAME,
                      version: SERVER_VERSION,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    message: 'MCP server is running, but cannot reach Kahuna API',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    hint: 'Make sure the Kahuna API is running (pnpm --filter @kahuna/api dev)',
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: `Unknown action: ${action}`,
                validActions: ['ping', 'api'],
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    case 'initialize':
      return initializeTool.handler(args);

    case 'kahuna_learn':
      return learnTool.handler(args, storage);

    case 'kahuna_prepare_context':
      return prepareContextTool.handler(args, storage);

    // Future tool handlers:
    // case 'kahuna_setup':
    //   return setupTool.handler(args, storage);
    // case 'kahuna_ask':
    //   return askTool.handler(args, storage);
    // case 'kahuna_review':
    //   return reviewTool.handler(args, storage);
    // case 'kahuna_sync':
    //   return syncTool.handler(args, storage);

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
// RESOURCES (Read-only data exposed to LLMs)
// =============================================================================

/**
 * Resource definitions for read-only data.
 * Resources allow LLMs to read data without needing to call tools.
 *
 * Current resources:
 * - kahuna://projects - List of user's projects (read-only view)
 *
 * Add more resources as needed for commonly accessed read-only data.
 */
const resources = [
  {
    uri: 'kahuna://projects',
    name: 'My Projects',
    description: 'List of all your Kahuna projects',
    mimeType: 'application/json',
  },
  // Add more resources here:
  // {
  //   uri: 'kahuna://project/{id}/context',
  //   name: 'Project Context Files',
  //   description: 'Context files for a specific project',
  //   mimeType: 'application/json',
  // },
];

/**
 * Handle resource read requests.
 */
async function readResource(uri: string, client: KahunaClient): Promise<string> {
  if (uri === 'kahuna://projects') {
    const projects = await client.projectList();
    return JSON.stringify(projects, null, 2);
  }

  // Add more resource handlers here
  // if (uri.startsWith('kahuna://project/') && uri.endsWith('/context')) {
  //   const projectId = uri.replace('kahuna://project/', '').replace('/context', '');
  //   const files = await client.contextList({ projectId });
  //   return JSON.stringify(files, null, 2);
  // }

  throw new Error(`Unknown resource: ${uri}`);
}

// =============================================================================
// MAIN SERVER
// =============================================================================

async function main() {
  // Create API client from environment
  const client = createClientFromEnv();

  // Create local knowledge storage service
  const storage = new FileKnowledgeStorageService();

  // Create MCP server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
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
    return routeToolCall(name, args ?? {}, client, storage);
  });

  // ---------------------------------------------------------------------------
  // RESOURCE HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * List all available resources.
   */
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources };
  });

  /**
   * Read a specific resource.
   */
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const content = await readResource(uri, client);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: content,
        },
      ],
    };
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
