/**
 * Type definitions and Zod schemas for file categorization
 *
 * Categories align with the knowledge base storage structure.
 * See: docs/design/knowledge-architecture.md
 */

import { z } from 'zod';

/**
 * Knowledge categories used for both AI categorization and storage.
 * Single taxonomy — no mapping layer needed.
 */
export const FILE_CATEGORIES = ['policy', 'requirement', 'reference', 'decision', 'pattern', 'context'] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];

/**
 * Enhanced metadata extracted from files
 */
export const FileMetadataSchema = z.object({
	// Auto-detected entities
	entities: z
		.object({
			technologies: z.array(z.string()).optional(),
			frameworks: z.array(z.string()).optional(),
			languages: z.array(z.string()).optional(),
			apis: z.array(z.string()).optional(),
			databases: z.array(z.string()).optional(),
			libraries: z.array(z.string()).optional(),
		})
		.optional(),

	// Auto-generated tags (truncate to 10 if LLM over-generates)
	tags: z
		.array(z.string())
		.optional()
		.transform((arr) => arr?.slice(0, 10)),

	// Key topics/concepts (truncate to 5 if LLM over-generates)
	topics: z
		.array(z.string())
		.optional()
		.transform((arr) => arr?.slice(0, 5)),

	// Brief summary (3-5 sentences)
	summary: z.string().optional(),

	// For code files: key functions/classes
	codeElements: z
		.object({
			functions: z.array(z.string()).optional(),
			classes: z.array(z.string()).optional(),
			imports: z.array(z.string()).optional(),
			exports: z.array(z.string()).optional(),
		})
		.optional(),

	// For documentation: key sections
	sections: z.array(z.string()).optional(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

/**
 * Zod schema for categorization result from LLM (enhanced with metadata)
 */
export const CategorizationResultSchema = z.object({
	category: z.enum(FILE_CATEGORIES),
	confidence: z.number().min(0).max(1),
	reasoning: z.string(),
	metadata: FileMetadataSchema.optional(),
});

export type CategorizationResult = z.infer<typeof CategorizationResultSchema>;

/**
 * Options for file categorization
 */
export interface CategorizationOptions {
	/** Maximum file size in characters (default: 400000 ~100k tokens) */
	maxFileSize?: number;
	/** Anthropic API key (defaults to ANTHROPIC_API_KEY env var) */
	apiKey?: string;
}

/**
 * File size limits
 */
export const FILE_SIZE_LIMITS = {
	/** Soft limit - show warning but allow */
	SOFT_LIMIT: 200_000, // ~50k tokens
	/** Hard limit - reject file */
	HARD_LIMIT: 400_000, // ~100k tokens
} as const;
