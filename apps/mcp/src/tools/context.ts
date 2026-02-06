/**
 * Context Tool - MCP wrapper for context file management with AI categorization
 *
 * This tool provides intelligent file management by:
 * 1. Automatically categorizing files using the @kahuna/file-router package
 * 2. Storing files with categorization metadata (category, confidence, reasoning)
 * 3. Managing CRUD operations for context files
 *
 * PATTERN:
 * - Uses the file-router's categorizeFile() for AI-powered categorization
 * - Wraps the context tRPC router for storage/retrieval
 * - Provides a simple interface for users to upload files with automatic organization
 */

import { FileSizeError, categorizeFile } from '@kahuna/file-router';
import type { KahunaClient } from '../client.js';

/**
 * Tool definition for MCP registration.
 */
export const contextToolDefinition = {
  name: 'manage_context_files',
  description: `Manage context files with automatic AI categorization. Context files are the knowledge base for your Kahuna project.

Available actions:
- create: Upload a new file with automatic categorization (requires: projectId, filename, content)
- list: List all context files for a project (requires: projectId)
- get: Get a specific context file by ID (requires: id)
- update: Update a context file (requires: id, optional: filename, content)
- delete: Delete a context file (requires: id)

**Smart Categorization on Create:**
When you create a file, Kahuna automatically analyzes the content and categorizes it:
- business-info: Business rules, policies, domain knowledge, goals
- technical-info: API specs, architecture docs, deployment configs
- code: Source code in any programming language

The categorization uses AI to understand your content and returns:
- category: The determined category
- confidence: 0-1 score indicating how confident the categorization is
- reasoning: Human-readable explanation of why this category was chosen

**File Size Limits:**
- Maximum: 400KB (~100k tokens)
- Larger files will be rejected with a helpful error message

**Examples:**

Create a file (auto-categorization):
{
  "action": "create",
  "projectId": "clxxx...",
  "filename": "api-specification.yaml",
  "content": "openapi: 3.0.0\\ninfo:\\n  title: My API..."
}

List all files in a project:
{
  "action": "list",
  "projectId": "clxxx..."
}

Get a specific file:
{
  "action": "get",
  "id": "clyyy..."
}

Update a file:
{
  "action": "update",
  "id": "clyyy...",
  "filename": "new-name.yaml"
}

Delete a file:
{
  "action": "delete",
  "id": "clyyy..."
}`,

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
        description: 'Context file ID (required for get, update, delete)',
      },
      projectId: {
        type: 'string',
        description: 'Project ID (required for create, list)',
      },
      filename: {
        type: 'string',
        description: 'Filename (required for create, optional for update)',
      },
      content: {
        type: 'string',
        description: 'File content (required for create, optional for update)',
      },
    },
    required: ['action'],
  },
};

/**
 * Input type for the tool.
 */
interface ContextToolInput {
  action: 'create' | 'list' | 'get' | 'update' | 'delete';
  id?: string;
  projectId?: string;
  filename?: string;
  content?: string;
}

/**
 * MCP tool response format.
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
 * Handle the manage_context_files tool call.
 *
 * This function:
 * 1. Validates the action and required parameters
 * 2. For create: Uses AI to categorize the file content
 * 3. Calls the appropriate API client method
 * 4. Returns a formatted response with categorization metadata
 *
 * @param args - Tool arguments from MCP client
 * @param client - Kahuna API client instance
 * @returns MCP tool response
 */
export async function contextToolHandler(
  args: Record<string, unknown>,
  client: KahunaClient
): Promise<MCPToolResponse> {
  const input = args as unknown as ContextToolInput;
  const { action, id, projectId, filename, content } = input;

  try {
    switch (action) {
      // =========================================================================
      // CREATE - Create a new context file with AI categorization
      // =========================================================================
      case 'create': {
        if (!projectId) {
          return errorResponse('Missing required parameter: projectId');
        }
        if (!filename) {
          return errorResponse('Missing required parameter: filename');
        }
        if (!content) {
          return errorResponse('Missing required parameter: content');
        }

        // Use the file-router to categorize the content with AI
        let categorization: {
          category: string;
          confidence: number;
          reasoning: string;
        };
        try {
          categorization = await categorizeFile(filename, content);
        } catch (error: unknown) {
          // Handle categorization errors (e.g., file too large)
          if (error instanceof FileSizeError) {
            return errorResponse('File too large for categorization', {
              filename,
              fileSize: (error as FileSizeError).fileSize,
              limit: (error as FileSizeError).limit,
              hint: 'Please split this file into smaller files',
            });
          }

          if (error instanceof Error && (error as Error).message.includes('ANTHROPIC_API_KEY')) {
            return errorResponse(
              'AI categorization unavailable: Anthropic API key not configured',
              {
                hint: 'Set the ANTHROPIC_API_KEY environment variable in your MCP server configuration',
              }
            );
          }

          throw error; // Re-throw unexpected errors
        }

        // Store the file with categorization metadata
        const contextFile = await client.contextCreate({
          projectId,
          filename,
          content,
          category: categorization.category,
          confidence: categorization.confidence,
          reasoning: categorization.reasoning,
        });

        return successResponse({
          message: `File '${filename}' created and categorized successfully`,
          file: contextFile,
          categorization: {
            category: categorization.category,
            confidence: categorization.confidence,
            reasoning: categorization.reasoning,
          },
        });
      }

      // =========================================================================
      // LIST - List all context files for a project
      // =========================================================================
      case 'list': {
        if (!projectId) {
          return errorResponse('Missing required parameter: projectId');
        }

        const files = await client.contextList({ projectId });

        return successResponse({
          message: `Found ${files.length} file(s)`,
          files,
        });
      }

      // =========================================================================
      // GET - Get a specific context file by ID
      // =========================================================================
      case 'get': {
        if (!id) {
          return errorResponse('Missing required parameter: id');
        }

        const file = await client.contextGet({ id });

        if (!file) {
          return errorResponse(`Context file not found: ${id}`);
        }

        return successResponse({
          message: 'File retrieved successfully',
          file,
        });
      }

      // =========================================================================
      // UPDATE - Update an existing context file
      // =========================================================================
      case 'update': {
        if (!id) {
          return errorResponse('Missing required parameter: id');
        }

        if (!filename && !content) {
          return errorResponse(
            'At least one field (filename or content) must be provided for update'
          );
        }

        const file = await client.contextUpdate({
          id,
          filename,
          content,
        });

        return successResponse({
          message: 'File updated successfully',
          file,
        });
      }

      // =========================================================================
      // DELETE - Delete a context file
      // =========================================================================
      case 'delete': {
        if (!id) {
          return errorResponse('Missing required parameter: id');
        }

        await client.contextDelete({ id });

        return successResponse({
          message: `File ${id} deleted successfully`,
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
 */
export const contextTool = {
  definition: contextToolDefinition,
  handler: contextToolHandler,
};
