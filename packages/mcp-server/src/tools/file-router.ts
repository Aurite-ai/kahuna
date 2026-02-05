/**
 * File Router Tool - MCP wrapper for file categorization
 *
 * This tool provides AI-powered file categorization using the @kahuna/file-router package.
 * It analyzes file content and categorizes it into:
 * - business-info: Business context, policies, rules
 * - technical-info: Technical docs, APIs, integrations
 * - code: Source code files
 */

import { FileSizeError, categorizeFile } from '@kahuna/file-router';
import type { KahunaClient } from '../client.js';

/**
 * Tool definition for MCP registration
 */
export const fileRouterToolDefinition = {
  name: 'categorize_file',
  description: `Categorize a file into business-info, technical-info, or code.

This is Stage 1 of the file routing pipeline. It analyzes file content using Claude
and determines the top-level category for organization in the knowledge base.

**Categories:**
- business-info: Business context, policies, rules, domain knowledge, goals, strategies
- technical-info: Technical docs, API specs, integrations, architecture, deployment configs
- code: Source code files in any programming language

**Parameters:**
- filename: Name of the file (helps with categorization context)
- content: File content to analyze
- projectId: Project ID to associate this file with

**Returns:**
- category: The determined category
- confidence: 0-1 score indicating categorization confidence
- reasoning: Explanation of why this category was chosen
- contextFile: The created database record

**File Size Limits:**
- Maximum: 400KB (~100k tokens)
- Files larger than this will be rejected

**Example:**
{ "filename": "api-spec.yaml", "content": "...", "projectId": "clxxx..." }`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      filename: {
        type: 'string',
        description: 'Name of the file being categorized',
      },
      content: {
        type: 'string',
        description: 'File content to analyze',
      },
      projectId: {
        type: 'string',
        description: 'Project ID to associate this file with',
      },
    },
    required: ['filename', 'content', 'projectId'],
  },
};

/**
 * Input type for the tool
 */
interface FileRouterToolInput {
  filename: string;
  content: string;
  projectId: string;
}

/**
 * MCP tool response format
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
 * Helper to create a success response
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
 * Helper to create an error response
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
 * Handle the categorize_file tool call
 *
 * This function:
 * 1. Validates file size
 * 2. Calls the categorization agent (Claude)
 * 3. Creates a context file with the categorization result
 * 4. Returns a formatted response
 *
 * @param args - Tool arguments from MCP client
 * @param client - Kahuna API client instance
 * @returns MCP tool response
 */
export async function fileRouterToolHandler(
  args: Record<string, unknown>,
  client: KahunaClient
): Promise<MCPToolResponse> {
  const input = args as unknown as FileRouterToolInput;
  const { filename, content, projectId } = input;

  try {
    // Validate required parameters
    if (!filename || typeof filename !== 'string') {
      return errorResponse('Missing or invalid required parameter: filename');
    }
    if (!content || typeof content !== 'string') {
      return errorResponse('Missing or invalid required parameter: content');
    }
    if (!projectId || typeof projectId !== 'string') {
      return errorResponse('Missing or invalid required parameter: projectId');
    }

    // Call the categorization agent
    const result = await categorizeFile(filename, content);

    // Store the file with categorization metadata via API
    const contextFile = await client.contextCreate({
      projectId,
      filename,
      content,
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning,
    });

    return successResponse({
      message: `File '${filename}' categorized successfully`,
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning,
      contextFile,
    });
  } catch (error) {
    // Handle specific errors with helpful messages
    if (error instanceof FileSizeError) {
      return errorResponse('File too large for categorization', {
        filename,
        fileSize: error.fileSize,
        limit: error.limit,
        hint: 'Please split this file into smaller files or use chunking',
      });
    }

    if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
      return errorResponse('Anthropic API key not configured', {
        hint: 'Set the ANTHROPIC_API_KEY environment variable in your MCP server configuration',
      });
    }

    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return errorResponse(`Categorization failed: ${errorMessage}`, {
      filename,
      hint: 'Check the error message for details. Ensure the API server is running and you have valid authentication.',
    });
  }
}

/**
 * Export the tool definition and handler together
 */
export const fileRouterTool = {
  definition: fileRouterToolDefinition,
  handler: fileRouterToolHandler,
};
