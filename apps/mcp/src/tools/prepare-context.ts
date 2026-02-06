/**
 * Kahuna Prepare Context Tool - Smart context retrieval
 *
 * This tool intelligently selects and prepares relevant context files
 * before the copilot starts working on a task.
 *
 * The "prepare" terminology emphasizes:
 * - This should be called FIRST, before starting any task
 * - It's proactive context gathering, not reactive searching
 * - Files are formatted and ready to use immediately
 *
 * IMPLEMENTATION: Metadata-based ranking (MVP)
 * - Uses existing metadata (tags, topics, summary, entities)
 * - Fast and explainable
 * - No infrastructure required
 * - Upgradeable to embeddings later
 */

import type { ContextFile, KahunaClient } from '../client.js';

/**
 * Tool definition for MCP registration.
 */
export const prepareContextToolDefinition = {
  name: 'kahuna_prepare_context',
  description: `Prepare relevant context BEFORE starting a task. Call this FIRST to gather the knowledge you need.

**What This Tool Does:**
Analyzes your task description and intelligently selects the most relevant files from the knowledge base.

**Smart Selection:**
- Matches task keywords with file tags
- Identifies related topics and concepts
- Finds files mentioning relevant technologies
- Considers file summaries for semantic matches
- Ranks by relevance score

**When to Use:**
- At the start of ANY task
- Before implementing features
- When troubleshooting issues
- To understand project context

**Usage Pattern:**
"Prepare context for implementing user authentication"
"Get ready to work on payment integration"
"I need context for debugging the API"

**Response:**
Returns the most relevant files with:
- File content ready to use
- Relevance scores and reasoning
- Category breakdown
- Formatted for immediate consumption`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to retrieve context from',
      },
      taskDescription: {
        type: 'string',
        description: 'Describe what you are about to do. Be specific for better results.',
      },
      maxFiles: {
        type: 'number',
        description: 'Maximum number of files to return (default: 10)',
        default: 10,
      },
      categories: {
        type: 'array',
        description: 'Filter by specific categories (optional)',
        items: {
          type: 'string',
          enum: ['business-info', 'technical-info', 'code'],
        },
      },
      minRelevanceScore: {
        type: 'number',
        description: 'Minimum relevance score (0-10, default: 1)',
        default: 1,
      },
    },
    required: ['projectId', 'taskDescription'],
  },
};

/**
 * Input type for the tool.
 */
interface PrepareContextInput {
  projectId: string;
  taskDescription: string;
  maxFiles?: number;
  categories?: Array<'business-info' | 'technical-info' | 'code'>;
  minRelevanceScore?: number;
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
 * Ranked file with relevance information
 */
interface RankedFile extends ContextFile {
  relevanceScore: number;
  matchedTags?: string[];
  matchedTopics?: string[];
  matchedEntities?: string[];
  relevanceReasoning: string;
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
 * Parse metadata JSON string to object
 */
function parseMetadata(metadataString?: string): Record<string, unknown> | null {
  if (!metadataString) return null;
  try {
    return JSON.parse(metadataString) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Calculate text similarity between two strings (simple word overlap)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));

  if (set1.size === 0 || set2.size === 0) return 0;

  return (intersection.size * 2) / (set1.size + set2.size);
}

/**
 * Rank files by relevance to task description using metadata
 *
 * Scoring weights:
 * - Tag match: 3 points per matching tag
 * - Topic match: 2 points per matching topic
 * - Entity match: 2 points per matching entity (technology, framework, library, API)
 * - Summary similarity: 0-3 points based on text overlap
 * - Filename match: 1 point if task mentions filename
 */
function rankFilesByMetadata(files: ContextFile[], taskDescription: string): RankedFile[] {
  const taskLower = taskDescription.toLowerCase();
  const taskWords = taskLower.split(/\s+/);

  return files
    .map((file) => {
      let score = 0;
      const matchedTags: string[] = [];
      const matchedTopics: string[] = [];
      const matchedEntities: string[] = [];
      const reasons: string[] = [];

      const metadata = parseMetadata(file.metadata);

      // 1. Tag matching (weight: 3)
      if (metadata?.tags && Array.isArray(metadata.tags)) {
        for (const tag of metadata.tags as string[]) {
          if (taskLower.includes(tag.toLowerCase()) || taskWords.includes(tag.toLowerCase())) {
            score += 3;
            matchedTags.push(tag);
          }
        }
      }

      // 2. Topic matching (weight: 2)
      if (metadata?.topics && Array.isArray(metadata.topics)) {
        for (const topic of metadata.topics as string[]) {
          if (taskLower.includes(topic.toLowerCase())) {
            score += 2;
            matchedTopics.push(topic);
          }
        }
      }

      // 3. Entity matching (weight: 2)
      if (metadata?.entities && typeof metadata.entities === 'object') {
        const entities = metadata.entities as Record<string, unknown>;
        const allEntities: string[] = [];

        // Collect all entity types
        for (const value of Object.values(entities)) {
          if (Array.isArray(value)) {
            allEntities.push(...(value as string[]));
          }
        }

        for (const entity of allEntities) {
          if (taskLower.includes(entity.toLowerCase())) {
            score += 2;
            matchedEntities.push(entity);
          }
        }
      }

      // 4. Summary similarity (weight: 0-3)
      if (metadata?.summary && typeof metadata.summary === 'string') {
        const similarity = calculateSimilarity(metadata.summary, taskDescription);
        const summaryScore = Math.round(similarity * 3);
        if (summaryScore > 0) {
          score += summaryScore;
          reasons.push(`summary similarity: ${Math.round(similarity * 100)}%`);
        }
      }

      // 5. Filename match (weight: 1)
      if (taskLower.includes(file.filename.toLowerCase())) {
        score += 1;
        reasons.push('filename mentioned');
      }

      // 6. Category relevance (small boost)
      if (file.category) {
        if (
          (file.category === 'code' && /implement|build|create|write|code/.test(taskLower)) ||
          (file.category === 'business-info' &&
            /policy|rule|business|requirement/.test(taskLower)) ||
          (file.category === 'technical-info' &&
            /api|architecture|integration|spec/.test(taskLower))
        ) {
          score += 0.5;
          reasons.push(`${file.category} category relevant`);
        }
      }

      // Generate reasoning
      let reasoning = '';
      if (matchedTags.length > 0) {
        reasons.unshift(`tags: ${matchedTags.join(', ')}`);
      }
      if (matchedTopics.length > 0) {
        reasons.unshift(`topics: ${matchedTopics.join(', ')}`);
      }
      if (matchedEntities.length > 0) {
        reasons.unshift(`entities: ${matchedEntities.join(', ')}`);
      }

      reasoning = reasons.length > 0 ? reasons.join(' | ') : 'no direct matches';

      return {
        ...file,
        relevanceScore: score,
        matchedTags,
        matchedTopics,
        matchedEntities,
        relevanceReasoning: reasoning,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Format context for copilot consumption
 */
function formatContextForCopilot(files: RankedFile[]): string {
  const lines: string[] = [];

  lines.push('# Prepared Context for Task\n');

  for (const file of files) {
    lines.push(`## ${file.filename}`);
    lines.push(`**Category:** ${file.category || 'unknown'}`);
    lines.push(`**Relevance:** ${file.relevanceScore.toFixed(1)}/10`);
    if (file.relevanceReasoning) {
      lines.push(`**Why relevant:** ${file.relevanceReasoning}`);
    }
    lines.push('');
    lines.push('```');
    lines.push(file.content);
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Count files by category
 */
function countByCategory(files: RankedFile[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const file of files) {
    const cat = file.category || 'unknown';
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

/**
 * Handle the kahuna_prepare_context tool call.
 *
 * Process flow:
 * 1. Validate input
 * 2. Fetch all files from project
 * 3. Filter by category if specified
 * 4. Rank files by relevance using metadata
 * 5. Apply minimum relevance threshold
 * 6. Take top N files
 * 7. Format for copilot consumption
 *
 * @param args - Tool arguments from MCP client
 * @param client - Kahuna API client instance
 * @returns MCP tool response
 */
export async function prepareContextToolHandler(
  args: Record<string, unknown>,
  client: KahunaClient
): Promise<MCPToolResponse> {
  const input = args as unknown as PrepareContextInput;
  const { projectId, taskDescription, maxFiles = 10, categories, minRelevanceScore = 1 } = input;

  // Validate input
  if (!projectId) {
    return errorResponse('Missing required parameter: projectId');
  }

  if (!taskDescription) {
    return errorResponse('Missing required parameter: taskDescription');
  }

  try {
    // Step 1: Fetch all files
    const allFiles = await client.contextList({ projectId });

    if (allFiles.length === 0) {
      return successResponse({
        message: 'No files found in knowledge base',
        hint: 'Use kahuna_learn to add files to the knowledge base first',
        selectedFiles: [],
        summary: {
          totalFiles: 0,
          selectedFiles: 0,
          categories: {},
        },
      });
    }

    // Step 2: Filter by category if specified
    let candidates = allFiles;
    if (categories && categories.length > 0) {
      candidates = allFiles.filter(
        (f) =>
          f.category &&
          categories.includes(f.category as 'business-info' | 'technical-info' | 'code')
      );
    }

    // Step 3: Rank by relevance
    const rankedFiles = rankFilesByMetadata(candidates, taskDescription);

    // Step 4: Apply minimum relevance threshold
    const relevantFiles = rankedFiles.filter((f) => f.relevanceScore >= minRelevanceScore);

    // Step 5: Take top N files
    const selectedFiles = relevantFiles.slice(0, maxFiles);

    if (selectedFiles.length === 0) {
      return successResponse({
        message: `No files met the minimum relevance score of ${minRelevanceScore}`,
        hint: 'Try lowering minRelevanceScore or rephrasing your task description',
        selectedFiles: [],
        summary: {
          totalFiles: allFiles.length,
          selectedFiles: 0,
          categories: {},
        },
      });
    }

    // Step 6: Format for copilot
    const formattedContext = formatContextForCopilot(selectedFiles);

    return successResponse({
      message: `Prepared ${selectedFiles.length} relevant file(s) for: "${taskDescription}"`,
      summary: {
        totalFiles: allFiles.length,
        candidateFiles: candidates.length,
        selectedFiles: selectedFiles.length,
        avgRelevanceScore: (
          selectedFiles.reduce((sum, f) => sum + f.relevanceScore, 0) / selectedFiles.length
        ).toFixed(2),
        categories: countByCategory(selectedFiles),
      },
      selectedFiles: selectedFiles.map((f) => ({
        filename: f.filename,
        fileId: f.id,
        category: f.category,
        relevanceScore: f.relevanceScore.toFixed(1),
        reasoning: f.relevanceReasoning,
        matchedTags: f.matchedTags,
        matchedTopics: f.matchedTopics,
        matchedEntities: f.matchedEntities,
        // Include content for direct use
        content: f.content,
      })),
      formattedContext, // Ready-to-use formatted context
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to prepare context: ${errorMessage}`, {
      hint: 'Check if the API server is running and you have valid authentication',
    });
  }
}

/**
 * Export the tool definition and handler together.
 */
export const prepareContextTool = {
  definition: prepareContextToolDefinition,
  handler: prepareContextToolHandler,
};
