/**
 * Categorization module - File categorization using AI
 *
 * Provides LLM-based file categorization for the Kahuna knowledge base.
 * Analyzes file content to determine category and extract rich metadata.
 */

// Core categorization
export { categorizeFile } from './categorizer.js';

// Prompts
export { buildCategorizationPrompt } from './prompts.js';

// Types and schemas
export {
	FILE_CATEGORIES,
	FILE_SIZE_LIMITS,
	CategorizationResultSchema,
	FileMetadataSchema,
	type CategorizationOptions,
	type CategorizationResult,
	type FileCategory,
	type FileMetadata,
	type PrimaryFileCategory,
} from './types.js';

// Utilities
export {
	FileSizeError,
	estimateTokenCount,
	exceedsSoftLimit,
	formatFileSize,
	validateFileSize,
} from './utils.js';
