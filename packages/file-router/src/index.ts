/**
 * File Router - File categorization and routing for Kahuna
 *
 * This package provides LLM-based file categorization for the Kahuna platform.
 * It analyzes file content and categorizes it into:
 * - business-info: Business context, policies, rules
 * - technical-info: Technical docs, APIs, integrations
 * - code: Source code files
 * - hybrid: Mixed content (automatically split into separate sections)
 *
 * ## Basic Usage
 *
 * ```typescript
 * import { categorizeWithHybridSupport } from '@kahuna/file-router';
 *
 * const result = await categorizeWithHybridSupport('myfile.md', fileContent);
 *
 * if (result.type === 'single') {
 *   // Normal file
 *   console.log(result.result.category); // 'technical-info'
 * } else {
 *   // Hybrid file that was split
 *   for (const split of result.result.splits) {
 *     console.log(split.category, split.sectionTitle);
 *   }
 * }
 * ```
 */

// Main exports (orchestrator is the recommended entry point)
export {
  categorizeWithHybridSupport,
  extractAllContent,
  getCategorizeStats,
  type CategorizeWithHybridResult,
  type HybridCategorizationOptions,
} from './orchestrator.js';

// Core categorization (lower-level API)
export { categorizeFile } from './categorizer.js';

// Hybrid splitting (lower-level API)
export { splitHybridFile } from './splitter.js';

// Prompts
export { buildCategorizationPrompt } from './prompts.js';

// Types
export {
  FILE_CATEGORIES,
  FILE_SIZE_LIMITS,
  CategorizationResultSchema,
  ContentSplitSchema,
  type FileCategory,
  type PrimaryFileCategory,
  type CategorizationResult,
  type CategorizationOptions,
  type FileMetadata,
  type ContentSplit,
  type SplitOptions,
  type SplitResult,
} from './types.js';

// Utilities
export {
  FileSizeError,
  validateFileSize,
  exceedsSoftLimit,
  formatFileSize,
  estimateTokenCount,
} from './utils.js';

// Errors
export {
  HybridSplitError,
  ManualReviewRequiredError,
  NestedHybridError,
  EmptyContentError,
  BinaryContentError,
  InsufficientContentError,
  TooManySegmentsError,
  SplitSizeError,
  UnsplittableHybridError,
  SplitValidationError,
} from './errors.js';
