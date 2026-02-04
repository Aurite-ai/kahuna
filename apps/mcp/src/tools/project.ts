/**
 * Project Tool - MCP wrapper for the project tRPC router
 *
 * This file demonstrates the pattern for wrapping tRPC routers as MCP tools.
 * It serves as a template for wrapping other routers (context, vck, results, etc.)
 *
 * PATTERN OVERVIEW:
 * 1. Define tool definitions (name, description, input schema)
 * 2. Create handler that routes actions to API client methods
 * 3. Export both for registration in the MCP server
 *
 * BEST PRACTICES:
 * - Use a single tool with an "action" parameter for CRUD operations
 * - Return JSON responses for consistent parsing by LLMs
 * - Include helpful error messages
 * - Document each action clearly in the tool description
 */

import type { KahunaClient } from '../client.js';

/**
 * Tool definition for MCP registration.
 *
 * This follows the MCP tool schema format:
 * - name: Unique identifier for the tool
 * - description: Human-readable description (shown to LLMs)
 * - inputSchema: JSON Schema defining expected arguments
 */
export const projectToolDefinition = {
  name: 'manage_projects',
  description: `Manage Kahuna projects. Projects are containers for context files and VCK generations.

Available actions:
- create: Create a new project (requires: name, optional: description)
- list: List all your projects (no parameters)
- get: Get a specific project by ID (requires: id)
- update: Update a project (requires: id, optional: name, description)
- delete: Delete a project (requires: id)

Examples:
- Create: { "action": "create", "name": "My AI Agent" }
- List: { "action": "list" }
- Get: { "action": "get", "id": "clxxx..." }
- Update: { "action": "update", "id": "clxxx...", "name": "New Name" }
- Delete: { "action": "delete", "id": "clxxx..." }`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'list', 'get', 'update', 'delete'],
        description: 'The action to perform',
      },
      id: {
        type: 'string',
        description: 'Project ID (required for get, update, delete)',
      },
      name: {
        type: 'string',
        description: 'Project name (required for create, optional for update)',
      },
      description: {
        type: 'string',
        description: 'Project description (optional)',
      },
    },
    required: ['action'],
  },
};

/**
 * Input type derived from the tool schema.
 * Helps with type safety in the handler.
 */
interface ProjectToolInput {
  action: 'create' | 'list' | 'get' | 'update' | 'delete';
  id?: string;
  name?: string;
  description?: string;
}

/**
 * MCP tool response format.
 * All tools should return content in this structure.
 * Using index signature to match MCP SDK's CallToolResult type.
 */
interface MCPToolResponse {
  [key: string]: unknown;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Helper to create a success response.
 * Formats data as pretty-printed JSON for LLM readability.
 */
function successResponse(data: unknown): MCPToolResponse {
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
 * Includes isError flag for MCP client handling.
 */
function errorResponse(message: string, details?: unknown): MCPToolResponse {
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
 * Handle the manage_projects tool call.
 *
 * This function:
 * 1. Validates the action and required parameters
 * 2. Calls the appropriate API client method
 * 3. Returns a formatted response
 *
 * @param args - Tool arguments from MCP client
 * @param client - Kahuna API client instance
 * @returns MCP tool response
 *
 * @example
 * ```typescript
 * // In MCP server request handler:
 * if (toolName === 'manage_projects') {
 *   return projectToolHandler(args, kahunaClient);
 * }
 * ```
 */
export async function projectToolHandler(
  args: Record<string, unknown>,
  client: KahunaClient,
): Promise<MCPToolResponse> {
  const input = args as unknown as ProjectToolInput;
  const { action, id, name, description } = input;

  try {
    switch (action) {
      // =========================================================================
      // CREATE - Create a new project
      // =========================================================================
      case 'create': {
        if (!name) {
          return errorResponse('Missing required parameter: name');
        }

        const project = await client.projectCreate({
          name,
          description,
        });

        return successResponse({
          message: 'Project created successfully',
          project,
        });
      }

      // =========================================================================
      // LIST - List all projects for the authenticated user
      // =========================================================================
      case 'list': {
        const projects = await client.projectList();

        return successResponse({
          message: `Found ${projects.length} project(s)`,
          projects,
        });
      }

      // =========================================================================
      // GET - Get a specific project by ID
      // =========================================================================
      case 'get': {
        if (!id) {
          return errorResponse('Missing required parameter: id');
        }

        const project = await client.projectGet({ id });

        if (!project) {
          return errorResponse(`Project not found: ${id}`);
        }

        return successResponse({
          message: 'Project retrieved successfully',
          project,
        });
      }

      // =========================================================================
      // UPDATE - Update an existing project
      // =========================================================================
      case 'update': {
        if (!id) {
          return errorResponse('Missing required parameter: id');
        }

        if (!name && description === undefined) {
          return errorResponse(
            'At least one field (name or description) must be provided for update',
          );
        }

        const project = await client.projectUpdate({
          id,
          name,
          description,
        });

        return successResponse({
          message: 'Project updated successfully',
          project,
        });
      }

      // =========================================================================
      // DELETE - Delete a project
      // =========================================================================
      case 'delete': {
        if (!id) {
          return errorResponse('Missing required parameter: id');
        }

        await client.projectDelete({ id });

        return successResponse({
          message: `Project ${id} deleted successfully`,
        });
      }

      // =========================================================================
      // UNKNOWN ACTION
      // =========================================================================
      default:
        return errorResponse(`Unknown action: ${action}`, {
          validActions: ['create', 'list', 'get', 'update', 'delete'],
        });
    }
  } catch (error) {
    // Handle API errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return errorResponse(`API error: ${errorMessage}`, {
      action,
      hint: 'Check if the API server is running and you have valid authentication',
    });
  }
}

/**
 * Export the tool definition and handler together.
 * This makes it easy to register in the MCP server.
 *
 * @example
 * ```typescript
 * import { projectTool } from './tools/project.js';
 *
 * // Register definition
 * server.setRequestHandler(ListToolsRequestSchema, () => ({
 *   tools: [projectTool.definition, ...otherTools],
 * }));
 *
 * // Handle calls
 * server.setRequestHandler(CallToolRequestSchema, (request) => {
 *   if (request.params.name === projectTool.definition.name) {
 *     return projectTool.handler(request.params.arguments, kahunaClient);
 *   }
 * });
 * ```
 */
export const projectTool = {
  definition: projectToolDefinition,
  handler: projectToolHandler,
};
