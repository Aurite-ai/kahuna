/**
 * Kahuna Ask Tool - Enterprise Q&A with AI synthesis
 *
 * This tool provides intelligent question answering using the knowledge base.
 * It searches for relevant entries, synthesizes answers using Claude,
 * and provides source attribution with confidence scoring.
 *
 * Features:
 * - LLM-powered answer synthesis
 * - Source attribution with relevance scoring
 * - Confidence indicators (high/medium/low)
 * - Follow-up suggestions
 * - Knowledge gap detection
 */

import Anthropic from '@anthropic-ai/sdk';
import type { KnowledgeEntry, KnowledgeStorageService } from '../storage/index.js';

/**
 * Tool definition for MCP registration.
 */
export const askToolDefinition = {
  name: 'kahuna_ask',
  description: `Quick Q&A using the project knowledge base.

USE THIS TOOL WHEN:
- Mid-task and need specific information
- User asks a direct question about the project
- Need clarification on a decision or pattern
- Context folder doesn't have what you need

Searches the knowledge base and synthesizes an answer with source citations.

**Examples:**
- Direct question: question="Why did we choose keyword search over embeddings?"
- Clarification: question="What's our error handling pattern for API calls?"
- Check if exists: question="Do we have rate limiting requirements documented?"

**Hints:**
- Searches knowledge base with AI-powered answer synthesis
- Use for quick questions mid-task
- For comprehensive context setup, use kahuna_prepare_context instead
- Returns answer with source citations and confidence level`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      question: {
        type: 'string',
        description: 'What you want to know',
      },
    },
    required: ['question'],
  },
};

/**
 * Input type for the tool.
 */
interface AskToolInput {
  question: string;
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
 * Source information for an answer
 */
interface AnswerSource {
  title: string;
  slug: string;
  relevanceScore: number;
  excerpt: string;
  category: string;
}

/**
 * Structured answer result
 */
interface AnswerResult {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources: AnswerSource[];
  suggestedFollowups: string[];
  gapDetection?: {
    hasGap: boolean;
    missingInfo?: string;
    suggestion?: string;
  };
}

/**
 * Ranked entry with relevance information
 */
interface RankedEntry extends KnowledgeEntry {
  relevanceScore: number;
  matchedTerms: string[];
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
 * Extract keywords from a question for searching
 */
function extractKeywords(question: string): string[] {
  // Remove common question words and punctuation
  const stopWords = new Set([
    'what',
    'why',
    'how',
    'when',
    'where',
    'who',
    'which',
    'is',
    'are',
    'was',
    'were',
    'do',
    'does',
    'did',
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'into',
    'through',
    'about',
    'our',
    'we',
    'i',
    'you',
    'it',
    'this',
    'that',
    'have',
    'has',
    'had',
    'be',
    'been',
    'being',
    'can',
    'could',
    'should',
    'would',
    'may',
    'might',
    'must',
    'will',
    'shall',
  ]);

  return question
    .toLowerCase()
    .replace(/[?!.,;:'"()[\]{}]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate relevance score for an entry based on question keywords
 */
function calculateRelevance(entry: KnowledgeEntry, keywords: string[]): RankedEntry {
  let score = 0;
  const matchedTerms: string[] = [];

  const titleLower = entry.title.toLowerCase();
  const summaryLower = entry.summary.toLowerCase();
  const contentLower = entry.content.toLowerCase();

  for (const keyword of keywords) {
    // Title match (highest weight)
    if (titleLower.includes(keyword)) {
      score += 5;
      matchedTerms.push(`title:${keyword}`);
    }

    // Summary match (high weight)
    if (summaryLower.includes(keyword)) {
      score += 3;
      if (!matchedTerms.includes(`title:${keyword}`)) {
        matchedTerms.push(`summary:${keyword}`);
      }
    }

    // Content match (medium weight)
    if (contentLower.includes(keyword)) {
      score += 2;
      if (!matchedTerms.some((t) => t.endsWith(keyword))) {
        matchedTerms.push(`content:${keyword}`);
      }
    }

    // Tag match (high weight)
    if (entry.classification.tags.some((tag) => tag.toLowerCase().includes(keyword))) {
      score += 4;
      matchedTerms.push(`tag:${keyword}`);
    }

    // Topic match (high weight)
    if (entry.classification.topics.some((topic) => topic.toLowerCase().includes(keyword))) {
      score += 3;
      matchedTerms.push(`topic:${keyword}`);
    }

    // Entity match (high weight)
    const entities = entry.classification.entities;
    const allEntities = [
      ...entities.technologies,
      ...entities.frameworks,
      ...entities.libraries,
      ...entities.apis,
    ];
    if (allEntities.some((e) => e.toLowerCase().includes(keyword))) {
      score += 4;
      matchedTerms.push(`entity:${keyword}`);
    }
  }

  return {
    ...entry,
    relevanceScore: score,
    matchedTerms: [...new Set(matchedTerms)],
  };
}

/**
 * Extract a relevant excerpt from content
 */
function extractExcerpt(content: string, keywords: string[], maxLength = 200): string {
  const lines = content.split('\n').filter((line) => line.trim());

  // Find lines containing keywords
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    if (keywords.some((kw) => lineLower.includes(kw))) {
      if (line.length <= maxLength) {
        return line.trim();
      }
      return `${line.substring(0, maxLength - 3).trim()}...`;
    }
  }

  // Fallback to first meaningful line
  for (const line of lines) {
    if (line.length > 20 && !line.startsWith('#')) {
      if (line.length <= maxLength) {
        return line.trim();
      }
      return `${line.substring(0, maxLength - 3).trim()}...`;
    }
  }

  return `${content.substring(0, maxLength - 3).trim()}...`;
}

/**
 * Determine confidence level based on source relevance
 */
function determineConfidence(sources: AnswerSource[]): 'high' | 'medium' | 'low' {
  if (sources.length === 0) return 'low';

  const topScore = sources[0].relevanceScore;
  const avgScore = sources.reduce((sum, s) => sum + s.relevanceScore, 0) / sources.length;

  if (topScore >= 10 && avgScore >= 5) return 'high';
  if (topScore >= 5 || avgScore >= 3) return 'medium';
  return 'low';
}

/**
 * Format the answer for display
 */
function formatAnswer(result: AnswerResult, question: string): string {
  const lines: string[] = [];

  // Confidence indicator
  const confidenceEmoji = {
    high: '🟢 High',
    medium: '🟡 Medium',
    low: '🔴 Low',
  }[result.confidence];

  lines.push('# Answer\n');
  lines.push(`**Question:** ${question}\n`);
  lines.push(`**Confidence:** ${confidenceEmoji}\n`);

  // Main answer
  lines.push(result.answer);
  lines.push('');

  // Sources
  if (result.sources.length > 0) {
    lines.push('## Sources\n');
    for (let i = 0; i < result.sources.length; i++) {
      const source = result.sources[i];
      const badge =
        i === 0 ? '✓ Primary' : source.relevanceScore >= 5 ? '✓ Supporting' : '○ Related';
      lines.push(
        `${i + 1}. **${source.title}** (\`${source.slug}.mdc\`) - ${badge} (score: ${source.relevanceScore.toFixed(1)})`
      );
      lines.push(`   > ${source.excerpt}`);
    }
    lines.push('');
  }

  // Gap detection
  if (result.gapDetection?.hasGap) {
    lines.push('## ⚠️ Knowledge Gap Detected\n');
    if (result.gapDetection.missingInfo) {
      lines.push(`- ${result.gapDetection.missingInfo}`);
    }
    if (result.gapDetection.suggestion) {
      lines.push(`- **Suggestion:** ${result.gapDetection.suggestion}`);
    }
    lines.push('');
  }

  // Follow-up suggestions
  if (result.suggestedFollowups.length > 0) {
    lines.push('<hints>');
    lines.push('**Related questions you might ask:**');
    for (const followup of result.suggestedFollowups) {
      lines.push(`- "${followup}"`);
    }
    lines.push('- If you need broader context, use kahuna_prepare_context');
    lines.push('</hints>');
  } else {
    lines.push('<hints>');
    lines.push('- If you need broader context, use kahuna_prepare_context');
    lines.push('- Use kahuna_learn to add more knowledge to the base');
    lines.push('</hints>');
  }

  return lines.join('\n');
}

/**
 * Synthesize answer using Claude
 */
async function synthesizeAnswer(
  question: string,
  relevantEntries: RankedEntry[],
  _keywords: string[]
): Promise<{
  answer: string;
  suggestedFollowups: string[];
  gapDetection?: { hasGap: boolean; missingInfo?: string; suggestion?: string };
}> {
  const client = new Anthropic();

  // Format context from entries
  const contextParts = relevantEntries.map((entry, i) => {
    return `## Source ${i + 1}: ${entry.title} (relevance: ${entry.relevanceScore.toFixed(1)})
Category: ${entry.classification.category}
Tags: ${entry.classification.tags.join(', ') || 'none'}

${entry.content}`;
  });

  const prompt = `You are a knowledge assistant for an enterprise codebase. Answer the question based ONLY on the provided context.

Question: ${question}

Available Knowledge:
${contextParts.join('\n\n---\n\n')}

Instructions:
1. Answer based ONLY on the provided context - do not make up information
2. If information is incomplete, clearly state what's missing
3. Cite sources by name (e.g., "According to the API Standards document...")
4. If the context doesn't contain the answer, say so clearly
5. Format for technical users (use bullet points, code blocks if relevant)
6. Be concise but complete

Respond with a JSON object:
{
  "answer": "Your synthesized answer here",
  "suggestedFollowups": ["Follow-up question 1", "Follow-up question 2"],
  "hasKnowledgeGap": true/false,
  "missingInfo": "What information is missing (if any)",
  "suggestion": "What should be documented (if gap exists)"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  // Parse the response
  const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

  // Try to parse as JSON
  try {
    // Extract JSON from response (it might be wrapped in markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        answer: parsed.answer || responseText,
        suggestedFollowups: parsed.suggestedFollowups || [],
        gapDetection: parsed.hasKnowledgeGap
          ? {
              hasGap: true,
              missingInfo: parsed.missingInfo,
              suggestion: parsed.suggestion,
            }
          : undefined,
      };
    }
  } catch {
    // JSON parsing failed, use raw response
  }

  // Fallback: use raw response
  return {
    answer: responseText,
    suggestedFollowups: [],
  };
}

/**
 * Handle the kahuna_ask tool call.
 *
 * Process flow:
 * 1. Validate input
 * 2. Extract keywords from question
 * 3. Search and rank knowledge base entries
 * 4. Synthesize answer using Claude
 * 5. Return formatted answer
 *
 * @param args - Tool arguments from MCP client
 * @param storage - Knowledge storage service instance
 * @returns MCP tool response
 */
export async function askToolHandler(
  args: Record<string, unknown>,
  storage: KnowledgeStorageService
): Promise<MCPToolResponse> {
  const input = args as unknown as AskToolInput;
  const { question } = input;

  // Validate input
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return errorResponse('Missing or empty question', {
      hint: 'Provide a clear question about the project',
    });
  }

  try {
    // Step 1: Get all active entries
    const allEntries = await storage.list({ status: 'active' });

    if (allEntries.length === 0) {
      return successResponse({
        message: 'No knowledge base entries found',
        answer: formatAnswer(
          {
            answer:
              'The knowledge base is empty. No information is available to answer your question.',
            confidence: 'low',
            sources: [],
            suggestedFollowups: [],
            gapDetection: {
              hasGap: true,
              missingInfo: 'Knowledge base is empty',
              suggestion: 'Use kahuna_learn to add files to the knowledge base',
            },
          },
          question
        ),
      });
    }

    // Step 2: Extract keywords from question
    const keywords = extractKeywords(question);

    if (keywords.length === 0) {
      return errorResponse('Could not extract meaningful keywords from question', {
        hint: 'Try asking a more specific question with clear keywords',
      });
    }

    // Step 3: Rank entries by relevance
    const rankedEntries = allEntries
      .map((entry) => calculateRelevance(entry, keywords))
      .filter((entry) => entry.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Take top entries for synthesis
    const topEntries = rankedEntries.slice(0, 5);

    // Step 4: Build sources
    const sources: AnswerSource[] = topEntries.map((entry) => ({
      title: entry.title,
      slug: entry.slug,
      relevanceScore: entry.relevanceScore,
      excerpt: extractExcerpt(entry.content, keywords),
      category: entry.classification.category,
    }));

    // Step 5: Determine confidence
    const confidence = determineConfidence(sources);

    // Step 6: Synthesize answer using LLM
    const synthesis = await synthesizeAnswer(question, topEntries, keywords);

    // Build result
    const result: AnswerResult = {
      answer: synthesis.answer,
      confidence,
      sources,
      suggestedFollowups: synthesis.suggestedFollowups,
      gapDetection: synthesis.gapDetection,
    };

    // Step 7: Return formatted response
    return successResponse({
      message: `Answer synthesized with ${confidence} confidence from ${sources.length} source(s)`,
      answer: formatAnswer(result, question),
      confidence: result.confidence,
      sources: result.sources,
      suggestedFollowups: result.suggestedFollowups,
      gapDetection: result.gapDetection,
      keywords,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to answer question: ${errorMessage}`, {
      hint: 'Check if the knowledge base is accessible and try again',
    });
  }
}

/**
 * Export the tool definition and handler together.
 */
export const askTool = {
  definition: askToolDefinition,
  handler: askToolHandler,
};
