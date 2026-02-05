/**
 * Content splitter for hybrid files
 * Intelligently splits files containing both business and technical information
 */

import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { categorizeFile } from './categorizer.js';
import {
  BinaryContentError,
  EmptyContentError,
  InsufficientContentError,
  NestedHybridError,
  SplitSizeError,
  SplitValidationError,
  TooManySegmentsError,
  UnsplittableHybridError,
} from './errors.js';
import type { CategorizationOptions, ContentSplit, SplitOptions, SplitResult } from './types.js';
import { estimateTokenCount } from './utils.js';

const DEFAULT_SPLIT_OPTIONS: Required<SplitOptions> = {
  minSectionSize: 100,
  maxSections: 5,
  preserveContext: true,
  maxSplitDepth: 2,
};

/**
 * Validate input content before attempting to split
 */
function validateSplitInput(filename: string, content: string, options: Required<SplitOptions>) {
  // Check for empty content
  if (!content || content.trim().length === 0) {
    throw new EmptyContentError();
  }

  // Check for minimum content length
  if (content.length < 200) {
    throw new InsufficientContentError(content.length, 200);
  }

  // Check for binary content
  const binaryCharCount = content.split('').filter((c) => {
    const code = c.charCodeAt(0);
    // Count control characters except common ones (newline, tab, carriage return)
    return code < 32 && c !== '\n' && c !== '\r' && c !== '\t';
  }).length;

  const binaryRatio = binaryCharCount / content.length;
  if (binaryRatio > 0.3) {
    throw new BinaryContentError(filename, binaryRatio);
  }
}

/**
 * Call Claude to intelligently split hybrid content into sections
 */
async function performContentSplit(
  filename: string,
  content: string,
  apiKey: string
): Promise<
  Array<{
    sectionTitle: string;
    content: string;
    startLine: number;
    endLine: number;
  }>
> {
  const anthropic = new Anthropic({ apiKey });

  const prompt = `You are an expert content analyzer. This file contains HYBRID content - a mix of different content types (business information, technical documentation, and/or source code).

Your task: Split this file into distinct sections where each section is primarily ONE category.

**Categories:**
- **business-info**: Business context, policies, requirements, goals, strategies
- **technical-info**: Technical documentation, API specs, architecture, configs
- **code**: Source code, scripts, code blocks

**Guidelines:**
1. Identify natural boundaries (headings, code blocks, topic changes, etc.)
2. Each section should be 100+ characters
3. Aim for 2-5 sections maximum
4. Preserve section context (don't split mid-paragraph or mid-code-block)
5. For code sections: preserve entire code blocks, don't split syntax
6. Include descriptive section titles

**File to split:**
Filename: ${filename}

Content:
\`\`\`
${content}
\`\`\`

Use the 'split_content' tool to provide the sections.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
    tools: [
      {
        name: 'split_content',
        description: 'Split the hybrid file into distinct sections',
        input_schema: {
          type: 'object',
          properties: {
            sections: {
              type: 'array',
              description: 'Array of content sections',
              items: {
                type: 'object',
                properties: {
                  sectionTitle: {
                    type: 'string',
                    description: 'Descriptive title for this section',
                  },
                  content: {
                    type: 'string',
                    description: 'The actual content of this section',
                  },
                  startLine: {
                    type: 'number',
                    description: 'Approximate starting line number in original file',
                  },
                  endLine: {
                    type: 'number',
                    description: 'Approximate ending line number in original file',
                  },
                },
                required: ['sectionTitle', 'content', 'startLine', 'endLine'],
              },
            },
            reasoning: {
              type: 'string',
              description: 'Brief explanation of how you split the content',
            },
          },
          required: ['sections', 'reasoning'],
        },
      },
    ],
    tool_choice: {
      type: 'tool',
      name: 'split_content',
    },
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('No tool use found in Claude response');
  }

  const result = toolUse.input as {
    sections: Array<{
      sectionTitle: string;
      content: string;
      startLine: number;
      endLine: number;
    }>;
    reasoning: string;
  };

  console.log(`Split reasoning: ${result.reasoning}`);

  return result.sections;
}

/**
 * Validate the quality of split results
 */
function validateSplitResults(
  filename: string,
  splits: Array<{ content: string }>,
  originalContent: string,
  options: Required<SplitOptions>
) {
  // Check if splitting actually happened
  if (splits.length === 1 && splits[0].content.trim() === originalContent.trim()) {
    throw new UnsplittableHybridError(
      filename,
      'Content could not be separated into distinct sections'
    );
  }

  // Check for too many sections
  if (splits.length > options.maxSections) {
    throw new TooManySegmentsError(splits.length, options.maxSections);
  }

  // Check for sections that are too small
  const tooSmall = splits.filter((s) => s.content.length < options.minSectionSize);
  if (tooSmall.length > 0) {
    throw new SplitValidationError(
      `${tooSmall.length} section(s) are below minimum size of ${options.minSectionSize} characters`,
      { smallSectionCount: tooSmall.length, minSize: options.minSectionSize }
    );
  }

  // Check for sections that exceed token limits
  splits.forEach((split, i) => {
    const tokens = estimateTokenCount(split.content);
    // Use soft limit for individual sections
    if (tokens > 50000) {
      // ~200k chars
      throw new SplitSizeError(i + 1, tokens, 50000);
    }
  });
}

/**
 * Merge adjacent sections that are too small
 */
function mergeTinySection(
  splits: Array<{
    sectionTitle: string;
    content: string;
    startLine: number;
    endLine: number;
  }>,
  minSectionSize: number
): Array<{
  sectionTitle: string;
  content: string;
  startLine: number;
  endLine: number;
}> {
  const merged: typeof splits = [];

  for (let i = 0; i < splits.length; i++) {
    const current = splits[i];

    // Validate current section has required properties
    if (!current || !current.content) {
      console.warn(`[Splitter] Skipping invalid section at index ${i}`);
      continue;
    }

    if (current.content.length < minSectionSize && merged.length > 0) {
      // Merge with previous section
      const previous = merged[merged.length - 1];
      previous.content += `\n\n${current.content}`;
      previous.endLine = current.endLine;
      previous.sectionTitle = `${previous.sectionTitle} + ${current.sectionTitle}`;
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

/**
 * Calculate category distribution from splits
 */
function calculateCategoryDistribution(splits: ContentSplit[]): {
  distribution: Record<string, number>;
  maxCategory: string;
  maxRatio: number;
} {
  const totalChars = splits.reduce((sum, s) => sum + s.content.length, 0);
  const distribution: Record<string, number> = {};

  for (const split of splits) {
    const category = split.category;
    if (!distribution[category]) {
      distribution[category] = 0;
    }
    distribution[category] += split.content.length / totalChars;
  }

  let maxCategory = '';
  let maxRatio = 0;
  for (const [category, ratio] of Object.entries(distribution)) {
    if (ratio > maxRatio) {
      maxRatio = ratio;
      maxCategory = category;
    }
  }

  return { distribution, maxCategory, maxRatio };
}

/**
 * Split a hybrid file into separate sections and re-classify each
 *
 * @param filename - Name of the file
 * @param content - File content
 * @param options - Split options
 * @param depth - Current recursion depth (for nested hybrid handling)
 * @returns Split result with categorized sections
 */
export async function splitHybridFile(
  filename: string,
  content: string,
  options: CategorizationOptions & SplitOptions = {},
  depth = 0
): Promise<SplitResult> {
  // Merge with defaults
  const splitOpts: Required<SplitOptions> = {
    ...DEFAULT_SPLIT_OPTIONS,
    ...options,
  };

  // Validation Layer 1: Input validation
  validateSplitInput(filename, content, splitOpts);

  // Get API key
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  // Perform the split using Claude
  console.log(`[Splitter] Splitting hybrid file: ${filename}`);
  let rawSplits = await performContentSplit(filename, content, apiKey);

  // Merge tiny sections
  rawSplits = mergeTinySection(rawSplits, splitOpts.minSectionSize);

  // Validation Layer 2: Quality checks
  validateSplitResults(filename, rawSplits, content, splitOpts);

  console.log(`[Splitter] Split into ${rawSplits.length} sections`);

  // Re-classify each split individually
  const categorizedSplits: ContentSplit[] = [];
  const warnings: SplitResult['warnings'] = [];

  for (let i = 0; i < rawSplits.length; i++) {
    const split = rawSplits[i];
    const sectionFilename = `${filename}-section-${i + 1}`;

    try {
      const classification = await categorizeFile(sectionFilename, split.content, options);

      // Validation Layer 3: Check for nested hybrid
      if (classification.category === 'hybrid') {
        if (depth >= splitOpts.maxSplitDepth) {
          // Max recursion depth reached - throw error
          throw new NestedHybridError(filename, i + 1, depth);
        }

        // Try splitting recursively
        console.log(`[Splitter] Section ${i + 1} is still hybrid, splitting recursively...`);
        const nestedResult = await splitHybridFile(
          sectionFilename,
          split.content,
          options,
          depth + 1
        );

        // Add all nested splits
        for (const nestedSplit of nestedResult.splits) {
          categorizedSplits.push({
            ...nestedSplit,
            originalFilename: filename, // Keep original filename
            sectionIndex: categorizedSplits.length + 1,
          });
        }

        // Merge warnings
        if (nestedResult.warnings) {
          warnings.push(...nestedResult.warnings);
        }

        continue;
      }

      // Add successfully classified split
      categorizedSplits.push({
        splitId: randomUUID(),
        originalFilename: filename,
        sectionIndex: i + 1,
        content: split.content,
        category: classification.category,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        sectionTitle: split.sectionTitle,
        startLine: split.startLine,
        endLine: split.endLine,
        metadata: classification.metadata,
      });
    } catch (error) {
      // If classification fails for a section, that's a problem
      if (error instanceof NestedHybridError) {
        throw error; // Propagate nested hybrid errors
      }

      throw new SplitValidationError(`Failed to classify section ${i + 1} of ${filename}`, {
        sectionIndex: i + 1,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Check for false hybrid (one category dominates)
  const categoryDist = calculateCategoryDistribution(categorizedSplits);
  if (categoryDist.maxRatio > 0.85) {
    warnings.push({
      code: 'FALSE_HYBRID_DETECTED',
      message: `File appears to be primarily ${categoryDist.maxCategory} (${Math.round(categoryDist.maxRatio * 100)}%)`,
      details: {
        distribution: categoryDist.distribution,
        recommendedCategory: categoryDist.maxCategory,
      },
    });
  }

  return {
    splits: categorizedSplits,
    warnings: warnings.length > 0 ? warnings : undefined,
    originalClassification: {
      category: 'hybrid',
      confidence: 1.0,
      reasoning: 'File was classified as hybrid and successfully split',
    },
  };
}
