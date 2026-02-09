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

import { z } from 'zod';
import type { KnowledgeEntry } from '../storage/index.js';
import { type MCPToolResponse, errorResponse, successResponse } from './response-utils.js';
import type { ToolContext } from './types.js';

/**
 * Tool definition for MCP registration.
 */
export const prepareContextToolDefinition = {
  name: 'kahuna_prepare_context',
  description: `Prepare the context/ folder with relevant knowledge for a task.

USE THIS TOOL WHEN:
- Starting any new task or feature
- User describes what they want to build
- Before beginning implementation work
- User asks "what do we know about X"

This is the PRIMARY context retrieval tool. Call it ONCE at task start, then work from context/ files.

**Examples:**
- Starting a task: task="Add rate limiting to the search tool"
- With files you'll touch: task="Refactor error handling in tools", files=["src/agent/tools.py"]
- Exploring a topic: task="Understand our API design patterns"

**Hints:**
- Call ONCE at task start, then work from context/ files
- Natural language task description works best
- After calling, read context/README.md for navigation
- If you need more context mid-task, use kahuna_ask instead`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      task: {
        type: 'string',
        description: 'What you are trying to do. Be specific for better results.',
      },
      files: {
        type: 'array',
        description: 'Optional: Files you will be working with (helps with relevance)',
        items: {
          type: 'string',
        },
      },
    },
    required: ['task'],
  },
};

/**
 * Zod schema for validating prepare context tool input.
 */
const prepareContextInputSchema = z.object({
  task: z
    .string({ error: 'Missing or empty task' })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Missing or empty task' }),
  files: z.array(z.string()).optional(),
});

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
 * Extract keywords from file paths for relevance matching
 */
function extractFileKeywords(files: string[]): string[] {
  const keywords: string[] = [];
  for (const file of files) {
    // Extract filename and path components
    const parts = file.split(/[/\\]/).filter(Boolean);
    for (const part of parts) {
      // Remove extension and split by separators
      const baseName = part.replace(/\.[^.]+$/, '');
      const words = baseName.split(/[-_.]/).filter((w) => w.length > 2);
      keywords.push(...words.map((w) => w.toLowerCase()));
    }
  }
  return [...new Set(keywords)];
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
 * - File keyword match: 2 points per keyword match from working files
 */
function rankEntriesByMetadata(
  entries: KnowledgeEntry[],
  taskDescription: string,
  fileKeywords: string[] = []
): RankedEntry[] {
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
          // Also check against file keywords
          if (fileKeywords.includes(tag.toLowerCase())) {
            score += 2;
            if (!matchedTags.includes(tag)) matchedTags.push(tag);
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
          // Also check against file keywords
          if (fileKeywords.includes(topic.toLowerCase())) {
            score += 2;
            if (!matchedTopics.includes(topic)) matchedTopics.push(topic);
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
          // Also check against file keywords
          if (fileKeywords.includes(entity.toLowerCase())) {
            score += 2;
            if (!matchedEntities.includes(entity)) matchedEntities.push(entity);
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
function formatContextForCopilot(entries: RankedEntry[], task: string): string {
  const lines: string[] = [];

  lines.push('# Context Ready\n');
  lines.push(`**Task:** ${task}\n`);

  if (entries.length === 0) {
    lines.push('No relevant context found in the knowledge base.\n');
    lines.push('<hints>');
    lines.push('- Use kahuna_learn to add files to the knowledge base');
    lines.push('- Try rephrasing the task description');
    lines.push('</hints>');
    return lines.join('\n');
  }

  lines.push('## Relevant Context Surfaced\n');
  lines.push('| Topic | File | Why Relevant |');
  lines.push('|-------|------|--------------|');

  for (const entry of entries) {
    const file = `context/${entry.slug}.md`;
    lines.push(`| ${entry.title} | ${file} | ${entry.relevanceReasoning} |`);
  }

  lines.push('\n## Start Here\n');

  for (let i = 0; i < Math.min(3, entries.length); i++) {
    const entry = entries[i];
    lines.push(`${i + 1}. **Read ${entry.slug}.md** - ${entry.summary || entry.title}`);
  }

  lines.push('\n<hints>');
  lines.push('- Context folder is ready - read files directly');
  lines.push('- If you need more context mid-task, use kahuna_ask');
  lines.push('- After completing work, use kahuna_learn to capture learnings');
  lines.push('</hints>');

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
 * 3. Extract keywords from working files (if provided)
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
  ctx: ToolContext
): Promise<MCPToolResponse> {
  const { storage } = ctx;
  // Validate input with Zod
  const parseResult = prepareContextInputSchema.safeParse(args);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => i.message).join(', ');
    return errorResponse(`Invalid input: ${issues}`, {
      hint: 'Provide a clear task description',
    });
  }

  const { task, files = [] } = parseResult.data;

  // Internal defaults (not exposed to user)
  const maxFiles = 10;
  const minRelevanceScore = 1;

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
        formattedContext: formatContextForCopilot([], task),
      });
    }

    // Step 2: Extract keywords from working files
    const fileKeywords = extractFileKeywords(files);

    // Optionally read content from working files to boost relevance
    // (future enhancement - for now just use path keywords)

    // Step 3: Rank by relevance
    const rankedEntries = rankEntriesByMetadata(allEntries, task, fileKeywords);

    // Step 4: Apply minimum relevance threshold
    const relevantEntries = rankedEntries.filter((e) => e.relevanceScore >= minRelevanceScore);

    // Step 5: Take top N entries
    const selectedEntries = relevantEntries.slice(0, maxFiles);

    if (selectedEntries.length === 0) {
      return successResponse({
        message: 'No files met the minimum relevance threshold',
        hint: 'Try rephrasing your task description or use kahuna_learn to add more context',
        selectedFiles: [],
        summary: {
          totalFiles: allEntries.length,
          selectedFiles: 0,
          categories: {},
        },
        formattedContext: formatContextForCopilot([], task),
      });
    }

    // Step 6: Format for copilot
    const formattedContext = formatContextForCopilot(selectedEntries, task);

    return successResponse({
      message: `Prepared ${selectedEntries.length} relevant file(s) for: "${task}"`,
      summary: {
        totalFiles: allEntries.length,
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
