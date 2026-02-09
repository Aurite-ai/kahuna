/**
 * Type definitions and Zod schemas for file categorization
 */

import { z } from 'zod';

/**
 * Top-level file categories (Stage 1 classification)
 */
export const FILE_CATEGORIES = [
  'business-info',
  'technical-info',
  'code',
  'integration-spec',
  'hybrid',
] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];

/**
 * Non-hybrid categories (used for split results)
 */
export type PrimaryFileCategory = Exclude<FileCategory, 'hybrid'>;

/**
 * Integration trigger types
 */
export const TRIGGER_TYPES = [
  'webhook',
  'schedule',
  'event',
  'manual',
  'api-call',
  'file-upload',
  'database-trigger',
] as const;

/**
 * Data source types
 */
export const DATA_SOURCE_TYPES = [
  'database',
  'api',
  'file',
  'crm',
  'spreadsheet',
  'email',
  'cloud-storage',
  'other',
] as const;

/**
 * Output/action types
 */
export const OUTPUT_TYPES = [
  'email',
  'notification',
  'api-call',
  'file',
  'database-write',
  'webhook',
  'message',
  'other',
] as const;

/**
 * Authentication methods
 */
export const AUTH_METHODS = ['oauth2', 'api-key', 'basic-auth', 'jwt', 'none', 'other'] as const;

/**
 * Integration metadata schema for workflow/connector specifications
 */
export const IntegrationMetadataSchema = z.object({
  // What triggers the workflow
  triggers: z
    .array(
      z.object({
        type: z.enum(TRIGGER_TYPES),
        source: z.string().optional(),
        description: z.string(),
      })
    )
    .optional(),

  // Where data comes from
  dataSources: z
    .array(
      z.object({
        type: z.enum(DATA_SOURCE_TYPES),
        name: z.string(),
        description: z.string(),
      })
    )
    .optional(),

  // Where results/actions go
  outputs: z
    .array(
      z.object({
        type: z.enum(OUTPUT_TYPES),
        provider: z.string().optional(),
        description: z.string(),
      })
    )
    .optional(),

  // What AI tasks are needed
  aiTasks: z
    .array(
      z.object({
        task: z.string(),
        description: z.string(),
      })
    )
    .optional(),

  // Authentication requirements
  authentication: z
    .array(
      z.object({
        system: z.string(),
        method: z.enum(AUTH_METHODS),
      })
    )
    .optional(),

  // Connected services/tools (for quick reference)
  connectedServices: z.array(z.string()).optional(),
});

export type IntegrationMetadata = z.infer<typeof IntegrationMetadataSchema>;

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

  // For integration-spec files: workflow integrations
  integrations: IntegrationMetadataSchema.optional(),
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

/**
 * Content split for hybrid files
 */
export interface ContentSplit {
  /** Unique identifier for this split */
  splitId: string;
  /** Original filename */
  originalFilename: string;
  /** Which section (1-indexed) */
  sectionIndex: number;
  /** Extracted content */
  content: string;
  /** Re-classified category (never 'hybrid') */
  category: PrimaryFileCategory;
  /** Confidence of re-classification */
  confidence: number;
  /** Reasoning for the category */
  reasoning: string;
  /** Optional section title */
  sectionTitle?: string;
  /** Starting line in original file */
  startLine?: number;
  /** Ending line in original file */
  endLine?: number;
  /** Metadata for this section */
  metadata?: FileMetadata;
}

/**
 * Options for content splitting
 */
export interface SplitOptions {
  /** Minimum section size in characters (default: 100) */
  minSectionSize?: number;
  /** Maximum number of sections allowed (default: 5) */
  maxSections?: number;
  /** Preserve some context overlap between sections (default: true) */
  preserveContext?: boolean;
  /** Maximum split recursion depth (default: 2) */
  maxSplitDepth?: number;
}

/**
 * Result of splitting operation
 */
export interface SplitResult {
  /** Successfully split sections */
  splits: ContentSplit[];
  /** Any warnings during splitting */
  warnings?: Array<{
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }>;
  /** Original classification result */
  originalClassification: CategorizationResult;
}

/**
 * Non-hybrid categories for content splits (array version for Zod)
 */
export const PRIMARY_CATEGORIES = [
  'business-info',
  'technical-info',
  'code',
  'integration-spec',
] as const;

/**
 * Zod schema for content split validation
 */
export const ContentSplitSchema = z.object({
  splitId: z.string(),
  originalFilename: z.string(),
  sectionIndex: z.number().int().positive(),
  content: z.string().min(1),
  category: z.enum(PRIMARY_CATEGORIES),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  sectionTitle: z.string().optional(),
  startLine: z.number().int().nonnegative().optional(),
  endLine: z.number().int().nonnegative().optional(),
  metadata: FileMetadataSchema.optional(),
});
