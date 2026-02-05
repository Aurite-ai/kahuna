/**
 * Tool Registry
 *
 * Central registry for all Kahuna MCP tools. This module:
 *   1. Imports all tool definitions and handlers
 *   2. Exports them for the MCP server to register
 *   3. Provides routing for tool calls
 *
 * ============================================================================
 * ADDING A NEW TOOL
 * ============================================================================
 *
 * 1. Create your tool file in src/tools/ (use example.ts as a template)
 * 2. Import the definition and handler here
 * 3. Add the definition to `allToolDefinitions`
 * 4. Add the handler to the switch in `routeToolCall`
 *
 * Example:
 * ```ts
 * // 1. Import at the top
 * import * as setupTool from "./setup.js";
 *
 * // 2. Add to allToolDefinitions
 * export const allToolDefinitions = [
 *   exampleTool.definition,
 *   setupTool.definition,  // <-- Add here
 * ];
 *
 * // 3. Add case to routeToolCall
 * case "kahuna_setup":
 *   return setupTool.handler(args);
 * ```
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// =============================================================================
// TOOL IMPORTS
// =============================================================================
// Import each tool module. Each module exports `definition` and `handler`.

import * as exampleTool from './example.js';

// Future tool imports:
// import * as setupTool from "./setup.js";
// import * as learnTool from "./learn.js";
// import * as prepareTool from "./prepare.js";
// import * as askTool from "./ask.js";
// import * as reviewTool from "./review.js";

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

/**
 * All tool definitions for the MCP server.
 * The server uses this to respond to ListToolsRequest.
 */
export const allToolDefinitions = [
  exampleTool.definition,
  // Add new tool definitions here:
  // setupTool.definition,
  // learnTool.definition,
  // prepareTool.definition,
  // askTool.definition,
  // reviewTool.definition,
];

// =============================================================================
// TOOL ROUTING
// =============================================================================

/**
 * Route a tool call to its handler.
 *
 * @param toolName - The name of the tool to call
 * @param args - The arguments passed to the tool
 * @returns The tool's response
 */
export async function routeToolCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  switch (toolName) {
    case 'example_tool':
      return exampleTool.handler(args);

    // Add new tool handlers here:
    // case "kahuna_setup":
    //   return setupTool.handler(args);
    // case "kahuna_learn":
    //   return learnTool.handler(args);
    // case "kahuna_prepare_context":
    //   return prepareTool.handler(args);
    // case "kahuna_ask":
    //   return askTool.handler(args);
    // case "kahuna_review":
    //   return reviewTool.handler(args);

    default:
      return {
        content: [
          {
            type: 'text',
            text: `# Error: Unknown Tool

The tool "${toolName}" is not registered.

## Available Tools

${allToolDefinitions.map((t) => `- \`${t.name}\``).join('\n')}

<hints>
- Check the tool name for typos
- Use one of the available tools listed above
</hints>`,
          },
        ],
        isError: true,
      };
  }
}

/**
 * Get the list of all tool names.
 * Useful for health checks and debugging.
 */
export function getToolNames(): string[] {
  return allToolDefinitions.map((t) => t.name);
}
