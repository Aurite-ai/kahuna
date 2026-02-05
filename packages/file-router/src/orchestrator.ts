/**
 * Orchestration for file categorization with hybrid support
 * This is the main entry point for the complete classification workflow
 */

import { categorizeFile } from './categorizer.js';
import {
  HybridSplitError,
  ManualReviewRequiredError,
  NestedHybridError,
  UnsplittableHybridError,
} from './errors.js';
import { splitHybridFile } from './splitter.js';
import type {
  CategorizationOptions,
  CategorizationResult,
  ContentSplit,
  SplitOptions,
  SplitResult,
} from './types.js';

/**
 * Result type that can be either a single classification or multiple splits
 */
export type CategorizeWithHybridResult =
  | { type: 'single'; result: CategorizationResult }
  | { type: 'split'; result: SplitResult };

/**
 * Options for hybrid-aware categorization
 */
export interface HybridCategorizationOptions extends CategorizationOptions, SplitOptions {
  /** Whether to automatically split hybrid files (default: true) */
  autoSplitHybrid?: boolean;
  /** Whether to throw errors or return fallback results (default: false) */
  throwOnSplitError?: boolean;
}

/**
 * Categorize a file with automatic hybrid detection and splitting
 *
 * This is the main entry point for file categorization. It will:
 * 1. Classify the file into one of: business-info, technical-info, code, or hybrid
 * 2. If hybrid and autoSplitHybrid is true, automatically split into sections
 * 3. Re-classify each section independently
 * 4. Return either a single result or multiple split results
 *
 * @param filename - Name of the file
 * @param content - File content
 * @param options - Configuration options
 * @returns Either a single classification or split results
 *
 * @example
 * ```typescript
 * // Simple classification
 * const result = await categorizeWithHybridSupport('readme.md', content);
 * if (result.type === 'single') {
 *   console.log(result.result.category); // 'technical-info'
 * }
 *
 * // Hybrid file that gets split
 * const result = await categorizeWithHybridSupport('spec.md', hybridContent);
 * if (result.type === 'split') {
 *   console.log(result.result.splits.length); // 3 sections
 *   for (const split of result.result.splits) {
 *     console.log(split.category, split.sectionTitle);
 *   }
 * }
 * ```
 */
export async function categorizeWithHybridSupport(
  filename: string,
  content: string,
  options: HybridCategorizationOptions = {}
): Promise<CategorizeWithHybridResult> {
  const { autoSplitHybrid = true, throwOnSplitError = false, ...restOptions } = options;

  try {
    // Stage 1: Initial classification
    console.log(`[Orchestrator] Classifying file: ${filename}`);
    const classification = await categorizeFile(filename, content, restOptions);

    console.log(
      `[Orchestrator] Initial classification: ${classification.category} (confidence: ${classification.confidence})`
    );

    // Not hybrid? Return as-is
    if (classification.category !== 'hybrid') {
      return {
        type: 'single',
        result: classification,
      };
    }

    // Hybrid detected - check if we should split
    if (!autoSplitHybrid) {
      console.log('[Orchestrator] Hybrid detected but autoSplitHybrid is false, returning as-is');
      return {
        type: 'single',
        result: classification,
      };
    }

    // Validate hybrid confidence
    if (classification.confidence < 0.5) {
      console.warn(
        `[Orchestrator] Low confidence hybrid classification (${classification.confidence}), proceeding anyway`
      );
    }

    // Stage 2: Split hybrid content
    console.log('[Orchestrator] Hybrid file detected, initiating split...');
    const splitResult = await splitHybridFile(filename, content, restOptions);

    console.log(`[Orchestrator] Successfully split into ${splitResult.splits.length} sections`);

    // Log any warnings
    if (splitResult.warnings && splitResult.warnings.length > 0) {
      for (const warning of splitResult.warnings) {
        console.warn(`[Orchestrator] Warning: ${warning.code} - ${warning.message}`);
      }
    }

    return {
      type: 'split',
      result: splitResult,
    };
  } catch (error) {
    // Comprehensive error handling
    if (error instanceof HybridSplitError) {
      console.error(`[Orchestrator] Hybrid split error: ${error.code} - ${error.message}`);

      // Should we throw or provide fallback?
      if (throwOnSplitError) {
        throw error;
      }

      // Provide fallback based on error type
      return handleSplitError(error, filename, content, restOptions);
    }

    // Unknown error - propagate
    throw error;
  }
}

/**
 * Handle split errors gracefully with fallback strategies
 */
async function handleSplitError(
  error: HybridSplitError,
  filename: string,
  content: string,
  options: CategorizationOptions
): Promise<CategorizeWithHybridResult> {
  // For unsplittable hybrids, return as single file with dual tags
  if (error instanceof UnsplittableHybridError) {
    console.warn(
      '[Orchestrator] File is unsplittable hybrid, returning as single file with warning'
    );
    return {
      type: 'single',
      result: {
        category: 'technical-info', // Default to technical
        confidence: 0.5,
        reasoning: `Hybrid file that could not be split: ${error.message}. Defaulting to technical-info.`,
        metadata: {
          tags: ['hybrid-content', 'unsplittable', 'needs-review'],
        },
      },
    };
  }

  // For nested hybrids, flag for manual review
  if (error instanceof NestedHybridError || error instanceof ManualReviewRequiredError) {
    console.error('[Orchestrator] Manual review required for file:', filename);
    // This should be propagated to a review queue in production
    throw error; // Re-throw these - they need human intervention
  }

  // For other errors, provide generic fallback
  console.error('[Orchestrator] Split failed, providing fallback classification');
  return {
    type: 'single',
    result: {
      category: 'technical-info', // Safe default
      confidence: 0.5,
      reasoning: `Hybrid split failed (${error.code}): ${error.message}. Defaulting to technical-info.`,
      metadata: {
        tags: ['split-failed', 'needs-review'],
      },
    },
  };
}

/**
 * Helper function to extract all content from a categorization result
 * Useful for downstream processing where you need all text regardless of type
 */
export function extractAllContent(result: CategorizeWithHybridResult): ContentSplit[] {
  if (result.type === 'single') {
    // Convert single result to split format for consistent handling
    return [
      {
        splitId: 'original',
        originalFilename: 'unknown',
        sectionIndex: 1,
        content: '', // Content not stored in CategorizationResult
        category: result.result.category === 'hybrid' ? 'technical-info' : result.result.category,
        confidence: result.result.confidence,
        reasoning: result.result.reasoning,
        metadata: result.result.metadata,
      },
    ];
  }

  return result.result.splits;
}

/**
 * Get summary statistics from a categorization result
 */
export function getCategorizeStats(result: CategorizeWithHybridResult): {
  type: 'single' | 'split';
  categories: Record<string, number>;
  totalSections: number;
  averageConfidence: number;
  hasWarnings: boolean;
  warningCodes?: string[];
} {
  if (result.type === 'single') {
    return {
      type: 'single',
      categories: { [result.result.category]: 1 },
      totalSections: 1,
      averageConfidence: result.result.confidence,
      hasWarnings: false,
    };
  }

  const splits = result.result.splits;
  const categories: Record<string, number> = {};

  for (const split of splits) {
    categories[split.category] = (categories[split.category] || 0) + 1;
  }

  const totalConfidence = splits.reduce((sum, s) => sum + s.confidence, 0);
  const warnings = result.result.warnings || [];

  return {
    type: 'split',
    categories,
    totalSections: splits.length,
    averageConfidence: totalConfidence / splits.length,
    hasWarnings: warnings.length > 0,
    warningCodes: warnings.map((w) => w.code),
  };
}
