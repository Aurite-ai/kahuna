/**
 * Kahuna Learn Tool - Intelligent file ingestion
 *
 * This tool allows users to "throw files" at Kahuna's knowledge base.
 * Kahuna automatically:
 * 1. Reads files from disk (supports files and folders)
 * 2. Categorizes each file using AI
 * 3. Extracts rich metadata (tags, topics, technologies, etc.)
 * 4. Stores files in the local knowledge base (~/.kahuna/knowledge/)
 *
 * The "learn" terminology emphasizes the fire-and-forget nature:
 * - Users don't need to think about how to categorize
 * - Copilot doesn't need to read file contents first
 * - Just "learn from these paths" and Kahuna handles the rest
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { FileSizeError, categorizeFile } from '../categorization/index.js';
import type { SaveKnowledgeEntryInput } from '../storage/index.js';
import { KnowledgeStorageError } from '../storage/index.js';
import { type MCPToolResponse, errorResponse, successResponse } from './response-utils.js';
import type { ToolContext } from './types.js';

/**
 * Tool definition for MCP registration.
 */
export const learnToolDefinition = {
  name: 'kahuna_learn',
  description: `Send files or folders to Kahuna to learn from and add to the knowledge base.

USE THIS TOOL WHEN:
- User shares files/folders and wants Kahuna to "learn" from them
- User provides policy documents, specs, or reference materials
- User says "here's our...", "learn this", "add this to context"
- After completing work the user wants preserved as knowledge

Kahuna's agents will:
1. Read files from the provided paths
2. Classify what kind of knowledge each file contains
3. Store in ~/.kahuna knowledge base with metadata
4. Files will be available for future context surfacing

**Examples:**
- Single file: paths=["docs/api-guidelines.md"]
- Entire folder: paths=["docs/"]
- Multiple paths: paths=["docs/api-guidelines.md", "specs/"]

**Hints:**
- Accepts both files AND folders - folders are processed recursively
- Description helps classification but isn't required
- Files go to ~/.kahuna knowledge base, NOT directly to context/
- Use kahuna_prepare_context to surface learned knowledge

**File Size Limit:** 400KB per file (~100k tokens)`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      paths: {
        type: 'array',
        description: 'File or folder paths to process (relative or absolute)',
        items: {
          type: 'string',
        },
        minItems: 1,
      },
      description: {
        type: 'string',
        description: 'Optional description of what these files contain / why they matter',
      },
    },
    required: ['paths'],
  },
};

/**
 * Zod schema for validating learn tool input.
 */
const learnInputSchema = z.object({
  paths: z
    .array(z.string(), { error: 'Missing or empty paths array' })
    .min(1, { message: 'paths array cannot be empty' }),
  description: z.string().optional(),
});

/**
 * Result for a single file learning process
 */
interface FileLearnResult {
  filename: string;
  success: boolean;
  category?: string;
  confidence?: number;
  error?: string;
  slug?: string;
  created?: boolean;
}

/**
 * Convert a filename to a human-readable title.
 * e.g., "api-guidelines.md" → "API Guidelines"
 */
function filenameToTitle(filename: string): string {
  // Remove extension
  const base = path.basename(filename).replace(/\.[^.]+$/, '');

  // Replace separators with spaces and capitalize words
  return base
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
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

  const created = successful.filter((r) => r.created).length;
  const updated = successful.length - created;

  const parts: string[] = [];
  parts.push(`Processed ${results.length} file(s)`);
  parts.push(`✅ ${successful.length} successful (${created} created, ${updated} updated)`);

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
 * Check if a path is a directory
 */
async function isDirectory(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get all files in a directory recursively
 */
async function getFilesRecursively(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Skip hidden files and common non-content directories
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await walk(dirPath);
  return files;
}

/**
 * Resolve paths to a list of files (expanding directories)
 */
async function resolvePaths(paths: string[]): Promise<{ files: string[]; errors: string[] }> {
  const files: string[] = [];
  const errors: string[] = [];

  for (const inputPath of paths) {
    try {
      // Check if path exists
      await fs.access(inputPath);

      if (await isDirectory(inputPath)) {
        // Recursively get all files in directory
        const dirFiles = await getFilesRecursively(inputPath);
        files.push(...dirFiles);
      } else {
        files.push(inputPath);
      }
    } catch (error) {
      errors.push(`Path not accessible: ${inputPath}`);
    }
  }

  return { files, errors };
}

/**
 * Read file content from disk
 */
async function readFileContent(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Handle the kahuna_learn tool call.
 *
 * Process flow:
 * 1. Validate input
 * 2. Resolve paths (expand directories)
 * 3. For each file:
 *    a. Read content from disk
 *    b. Use AI to categorize and extract metadata
 *    c. Store in local knowledge base
 *    d. Track success/failure
 * 4. Return summary of results
 *
 * @param args - Tool arguments from MCP client
 * @param storage - Knowledge storage service instance
 * @returns MCP tool response
 */
export async function learnToolHandler(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<MCPToolResponse> {
  const { storage } = ctx;
  // Validate input with Zod
  const parseResult = learnInputSchema.safeParse(args);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => i.message).join(', ');
    return errorResponse(`Invalid input: ${issues}`, {
      hint: 'Provide at least one file or folder path',
    });
  }

  const { paths, description } = parseResult.data;

  // Resolve paths to files
  const { files, errors: pathErrors } = await resolvePaths(paths);

  if (files.length === 0) {
    return errorResponse('No accessible files found in provided paths', {
      pathErrors,
      hint: 'Check that the paths exist and are accessible',
    });
  }

  // Process each file
  const results: FileLearnResult[] = [];

  // Add path errors as failed results
  for (const pathError of pathErrors) {
    results.push({
      filename: pathError,
      success: false,
      error: pathError,
    });
  }

  for (const filePath of files) {
    const filename = path.basename(filePath);

    try {
      // Step 1: Read file content from disk
      let content: string;
      try {
        content = await readFileContent(filePath);
      } catch (error) {
        results.push({
          filename: filePath,
          success: false,
          error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        continue;
      }

      // Step 2: Use AI to categorize and extract metadata
      let categorization: {
        category: string;
        confidence: number;
        reasoning: string;
        metadata?: Record<string, unknown>;
      };

      try {
        categorization = await categorizeFile(filename, content);
      } catch (error: unknown) {
        // Handle categorization errors
        if (error instanceof FileSizeError) {
          results.push({
            filename: filePath,
            success: false,
            error: `File too large: ${error.fileSize} bytes (limit: ${error.limit})`,
          });
          continue;
        }

        if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
          results.push({
            filename: filePath,
            success: false,
            error: 'AI categorization unavailable: Anthropic API key not configured',
          });
          continue;
        }

        throw error; // Re-throw unexpected errors
      }

      // Step 3: Build input for storage service
      const title = filenameToTitle(filename);
      const saveInput: SaveKnowledgeEntryInput = {
        title,
        content,
        sourceFile: filename,
        sourcePath: filePath,
        category: categorization.category,
        confidence: categorization.confidence,
        reasoning: description
          ? `${categorization.reasoning} (User note: ${description})`
          : categorization.reasoning,
        metadata: categorization.metadata as SaveKnowledgeEntryInput['metadata'],
      };

      // Step 4: Store in local knowledge base
      const entry = await storage.save(saveInput);

      // Determine if this was a create or update based on timestamps
      const wasCreated = entry.created_at === entry.updated_at;

      results.push({
        filename: filePath,
        success: true,
        category: entry.classification.category,
        confidence: entry.classification.confidence,
        slug: entry.slug,
        created: wasCreated,
      });
    } catch (error) {
      let errorMessage: string;
      if (error instanceof KnowledgeStorageError) {
        errorMessage = `Storage error (${error.code}): ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unknown error';
      }
      results.push({
        filename: filePath,
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
      created: successful.filter((r) => r.created).length,
      updated: successful.filter((r) => !r.created).length,
    },
    results: results.map((r) => ({
      filename: r.filename,
      success: r.success,
      category: r.category,
      confidence: r.confidence,
      slug: r.slug,
      created: r.created,
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
