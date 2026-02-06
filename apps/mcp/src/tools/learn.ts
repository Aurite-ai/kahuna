/**
 * Kahuna Learn Tool - Intelligent file ingestion
 *
 * This tool allows users to "throw files" at Kahuna's knowledge base.
 * Kahuna automatically:
 * 1. Categorizes each file using AI
 * 2. Extracts rich metadata (tags, topics, technologies, etc.)
 * 3. Stores files in the knowledge base
 *
 * The "learn" terminology emphasizes the fire-and-forget nature:
 * - Users don't need to think about how to categorize
 * - Copilot doesn't need to consider where files go
 * - Just "learn from these files" and Kahuna handles the rest
 */

import { FileSizeError, categorizeFile } from '@kahuna/file-router';
import type { KahunaClient } from '../client.js';

/**
 * Tool definition for MCP registration.
 */
export const learnToolDefinition = {
  name: 'kahuna_learn',
  description: `Feed files to Kahuna's knowledge base. Just throw your files at Kahuna - it will automatically categorize and organize them.

**What Kahuna Does Automatically:**
- Categorizes files (business-info, technical-info, or code)
- Extracts metadata: tags, topics, technologies, frameworks
- Generates summaries
- Identifies code elements (functions, classes, imports)
- Detects document structure

**You can upload:**
- Single files
- Multiple files at once (batch upload)

**Usage Pattern:**
"Learn from this API documentation"
"Add these configuration files to the knowledge base"
"Here are the project files - learn from them"

**Response:**
Returns a summary of what was learned, including:
- Number of files processed
- Categories assigned
- Any errors encountered

**File Size Limit:** 400KB per file (~100k tokens)`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to add files to',
      },
      files: {
        type: 'array',
        description: 'Files to learn from (can be single or multiple)',
        items: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Name of the file (helps with categorization)',
            },
            content: {
              type: 'string',
              description: 'File content to analyze and store',
            },
          },
          required: ['filename', 'content'],
        },
        minItems: 1,
      },
    },
    required: ['projectId', 'files'],
  },
};

/**
 * Input type for the tool.
 */
interface LearnToolInput {
  projectId: string;
  files: Array<{
    filename: string;
    content: string;
  }>;
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
 * Result for a single file learning process
 */
interface FileLearnResult {
  filename: string;
  success: boolean;
  category?: string;
  confidence?: number;
  error?: string;
  fileId?: string;
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
 * Generate a human-readable summary of learning results
 */
function generateLearningSummary(results: FileLearnResult[]): string {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  const categoryCounts: Record<string, number> = {};
  for (const result of successful) {
    if (result.category) {
      categoryCounts[result.category] = (categoryCounts[result.category] || 0) + 1;
    }
  }

  const parts: string[] = [];
  parts.push(`Processed ${results.length} file(s)`);
  parts.push(`✅ ${successful.length} successful`);

  if (Object.keys(categoryCounts).length > 0) {
    const categoryStrings = Object.entries(categoryCounts).map(([cat, count]) => `${count} ${cat}`);
    parts.push(`Categories: ${categoryStrings.join(', ')}`);
  }

  if (failed.length > 0) {
    parts.push(`❌ ${failed.length} failed`);
  }

  return parts.join(' | ');
}

/**
 * Handle the kahuna_learn tool call.
 *
 * Process flow:
 * 1. Validate input
 * 2. For each file:
 *    a. Use AI to categorize and extract metadata
 *    b. Store in knowledge base via API
 *    c. Track success/failure
 * 3. Return summary of results
 *
 * @param args - Tool arguments from MCP client
 * @param client - Kahuna API client instance
 * @returns MCP tool response
 */
export async function learnToolHandler(
  args: Record<string, unknown>,
  client: KahunaClient
): Promise<MCPToolResponse> {
  const input = args as unknown as LearnToolInput;
  const { projectId, files } = input;

  // Validate input
  if (!projectId) {
    return errorResponse('Missing required parameter: projectId');
  }

  if (!files || !Array.isArray(files) || files.length === 0) {
    return errorResponse('Missing or empty files array', {
      hint: 'Provide at least one file with filename and content',
    });
  }

  // Process each file
  const results: FileLearnResult[] = [];

  for (const file of files) {
    if (!file.filename || !file.content) {
      results.push({
        filename: file.filename || 'unknown',
        success: false,
        error: 'Missing filename or content',
      });
      continue;
    }

    try {
      // Step 1: Use AI to categorize and extract metadata
      let categorization: {
        category: string;
        confidence: number;
        reasoning: string;
        metadata?: Record<string, unknown>;
      };

      try {
        categorization = await categorizeFile(file.filename, file.content);
      } catch (error: unknown) {
        // Handle categorization errors
        if (error instanceof FileSizeError) {
          results.push({
            filename: file.filename,
            success: false,
            error: `File too large: ${error.fileSize} bytes (limit: ${error.limit})`,
          });
          continue;
        }

        if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
          results.push({
            filename: file.filename,
            success: false,
            error: 'AI categorization unavailable: Anthropic API key not configured',
          });
          continue;
        }

        throw error; // Re-throw unexpected errors
      }

      // Step 2: Store in knowledge base
      const storedFile = await client.contextCreate({
        projectId,
        filename: file.filename,
        content: file.content,
        category: categorization.category,
        confidence: categorization.confidence,
        reasoning: categorization.reasoning,
        metadata: categorization.metadata,
      });

      results.push({
        filename: file.filename,
        success: true,
        category: categorization.category,
        confidence: categorization.confidence,
        fileId: storedFile.id,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        filename: file.filename,
        success: false,
        error: errorMessage,
      });
    }
  }

  // Generate summary
  const summary = generateLearningSummary(results);
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return successResponse({
    message: summary,
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
    },
    results: results.map((r) => ({
      filename: r.filename,
      success: r.success,
      category: r.category,
      confidence: r.confidence,
      fileId: r.fileId,
      error: r.error,
    })),
  });
}

/**
 * Export the tool definition and handler together.
 */
export const learnTool = {
  definition: learnToolDefinition,
  handler: learnToolHandler,
};
