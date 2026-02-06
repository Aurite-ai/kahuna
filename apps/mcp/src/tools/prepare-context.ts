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

import type { KnowledgeEntry, KnowledgeStorageService } from '../storage/index.js';

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
        description: 'Project ID (optional, for filtering by source project)',
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
          enum: ['policy', 'requirement', 'reference', 'decision', 'pattern', 'context'],
        },
      },
      minRelevanceScore: {
        type: 'number',
        description: 'Minimum relevance score (0-10, default: 1)',
        default: 1,
      },
    },
    required: ['taskDescription'],
  },
};

/**
 * Input type for the tool.
 */
interface PrepareContextInput {
  projectId?: string;
  taskDescription: string;
  maxFiles?: number;
  categories?: Array<'policy' | 'requirement' | 'reference' | 'decision' | 'pattern' | 'context'>;
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
interface RankedEntry extends KnowledgeEntry {
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
 * Rank entries by relevance to task description using metadata
 *
 * Scoring weights:
 * - Tag match: 3 points per matching tag
 * - Topic match: 2 points per matching topic
 * - Entity match: 2 points per matching entity (technology, framework, library, API)
 * - Summary similarity: 0-3 points based on text overlap
 * - Title match: 1 point if task mentions title
 * - Category relevance: 0.5 points for category keyword match
 */
function rankEntriesByMetadata(entries: KnowledgeEntry[], taskDescription: string): RankedEntry[] {
  const taskLower = taskDescription.toLowerCase();
  const taskWords = taskLower.split(/\s+/);

  return entries
    .map((entry) => {
      let score = 0;
      const matchedTags: string[] = [];
      const matchedTopics: string[] = [];
      const matchedEntities: string[] = [];
      const reasons: string[] = [];

      const classification = entry.classification;

      // 1. Tag matching (weight: 3)
      if (classification.tags && classification.tags.length > 0) {
        for (const tag of classification.tags) {
          if (taskLower.includes(tag.toLowerCase()) || taskWords.includes(tag.toLowerCase())) {
            score += 3;
            matchedTags.push(tag);
          }
        }
      }

      // 2. Topic matching (weight: 2)
      if (classification.topics && classification.topics.length > 0) {
        for (const topic of classification.topics) {
          if (taskLower.includes(topic.toLowerCase())) {
            score += 2;
            matchedTopics.push(topic);
          }
        }
      }

      // 3. Entity matching (weight: 2)
      if (classification.entities) {
        const entities = classification.entities;
        const allEntities: string[] = [
          ...(entities.technologies || []),
          ...(entities.frameworks || []),
          ...(entities.libraries || []),
          ...(entities.apis || []),
        ];

        for (const entity of allEntities) {
          if (taskLower.includes(entity.toLowerCase())) {
            score += 2;
            matchedEntities.push(entity);
          }
        }
      }

      // 4. Summary similarity (weight: 0-3)
      if (entry.summary) {
        const similarity = calculateSimilarity(entry.summary, taskDescription);
        const summaryScore = Math.round(similarity * 3);
        if (summaryScore > 0) {
          score += summaryScore;
          reasons.push(`summary similarity: ${Math.round(similarity * 100)}%`);
        }
      }

      // 5. Title match (weight: 1)
      if (taskLower.includes(entry.title.toLowerCase())) {
        score += 1;
        reasons.push('title mentioned');
      }

      // 6. Category relevance (small boost)
      const category = classification.category;
      if (
        (category === 'pattern' && /implement|build|create|write|code/.test(taskLower)) ||
        (category === 'policy' && /policy|rule|business|requirement/.test(taskLower)) ||
        (category === 'reference' && /api|architecture|integration|spec/.test(taskLower)) ||
        (category === 'requirement' && /requirement|spec|must|should/.test(taskLower)) ||
        (category === 'decision' && /decision|why|rationale|chose/.test(taskLower)) ||
        (category === 'context' && /context|background|overview/.test(taskLower))
      ) {
        score += 0.5;
        reasons.push(`${category} category relevant`);
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
        ...entry,
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
function formatContextForCopilot(entries: RankedEntry[]): string {
  const lines: string[] = [];

  lines.push('# Prepared Context for Task\n');

  for (const entry of entries) {
    lines.push(`## ${entry.title}`);
    lines.push(`**Category:** ${entry.classification.category}`);
    lines.push(`**Relevance:** ${entry.relevanceScore.toFixed(1)}/10`);
    if (entry.relevanceReasoning) {
      lines.push(`**Why relevant:** ${entry.relevanceReasoning}`);
    }
    lines.push('');
    lines.push('```');
    lines.push(entry.content);
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Count entries by category
 */
function countByCategory(entries: RankedEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const cat = entry.classification.category || 'unknown';
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

/**
 * Handle the kahuna_prepare_context tool call.
 *
 * Process flow:
 * 1. Validate input
 * 2. Fetch all active entries from local storage
 * 3. Filter by category if specified
 * 4. Rank entries by relevance using metadata
 * 5. Apply minimum relevance threshold
 * 6. Take top N entries
 * 7. Format for copilot consumption
 *
 * @param args - Tool arguments from MCP client
 * @param storage - Knowledge storage service instance
 * @returns MCP tool response
 */
export async function prepareContextToolHandler(
  args: Record<string, unknown>,
  storage: KnowledgeStorageService
): Promise<MCPToolResponse> {
  const input = args as unknown as PrepareContextInput;
  const { taskDescription, maxFiles = 10, categories, minRelevanceScore = 1 } = input;

  // Validate input
  if (!taskDescription) {
    return errorResponse('Missing required parameter: taskDescription');
  }

  try {
    // Step 1: Fetch all active entries from local storage
    const allEntries = await storage.list({ status: 'active' });

    if (allEntries.length === 0) {
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
    let candidates = allEntries;
    if (categories && categories.length > 0) {
      candidates = allEntries.filter((entry) => {
        const entryCategory = entry.classification.category;
        return categories.includes(
          entryCategory as
            | 'policy'
            | 'requirement'
            | 'reference'
            | 'decision'
            | 'pattern'
            | 'context'
        );
      });
    }

    // Step 3: Rank by relevance
    const rankedEntries = rankEntriesByMetadata(candidates, taskDescription);

    // Step 4: Apply minimum relevance threshold
    const relevantEntries = rankedEntries.filter((e) => e.relevanceScore >= minRelevanceScore);

    // Step 5: Take top N entries
    const selectedEntries = relevantEntries.slice(0, maxFiles);

    if (selectedEntries.length === 0) {
      return successResponse({
        message: `No files met the minimum relevance score of ${minRelevanceScore}`,
        hint: 'Try lowering minRelevanceScore or rephrasing your task description',
        selectedFiles: [],
        summary: {
          totalFiles: allEntries.length,
          selectedFiles: 0,
          categories: {},
        },
      });
    }

    // Step 6: Format for copilot
    const formattedContext = formatContextForCopilot(selectedEntries);

    return successResponse({
      message: `Prepared ${selectedEntries.length} relevant file(s) for: "${taskDescription}"`,
      summary: {
        totalFiles: allEntries.length,
        candidateFiles: candidates.length,
        selectedFiles: selectedEntries.length,
        avgRelevanceScore: (
          selectedEntries.reduce((sum, e) => sum + e.relevanceScore, 0) / selectedEntries.length
        ).toFixed(2),
        categories: countByCategory(selectedEntries),
      },
      selectedFiles: selectedEntries.map((e) => ({
        title: e.title,
        slug: e.slug,
        category: e.classification.category,
        relevanceScore: e.relevanceScore.toFixed(1),
        reasoning: e.relevanceReasoning,
        matchedTags: e.matchedTags,
        matchedTopics: e.matchedTopics,
        matchedEntities: e.matchedEntities,
        // Include content for direct use
        content: e.content,
      })),
      formattedContext, // Ready-to-use formatted context
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to prepare context: ${errorMessage}`, {
      hint: 'Check if the knowledge base directory is accessible (~/.kahuna/knowledge/)',
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
