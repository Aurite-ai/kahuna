/**
 * Type definitions for local knowledge storage
 *
 * These types define the structure of .mdc files stored in ~/.kahuna/knowledge/
 * See: docs/internal/tasks/mcp-mvp/design/local-storage-design.md
 */

/**
 * Categories aligned with knowledge-architecture.md
 */
export type KnowledgeCategory =
  | 'policy'
  | 'requirement'
  | 'reference'
  | 'decision'
  | 'pattern'
  | 'context';

/**
 * Entry status for soft delete support
 */
export type KnowledgeStatus = 'active' | 'archived';

/**
 * Named entities extracted from content
 */
export interface KnowledgeEntities {
  technologies: string[];
  frameworks: string[];
  libraries: string[];
  apis: string[];
}

/**
 * Classification data from AI categorization
 */
export interface KnowledgeClassification {
  category: KnowledgeCategory;
  confidence: number;
  reasoning: string;
  tags: string[];
  topics: string[];
  entities: KnowledgeEntities;
}

/**
 * Source information for provenance tracking
 */
export interface KnowledgeSource {
  file: string;
  project: string | null;
  path: string | null;
}

/**
 * YAML frontmatter structure for .mdc files
 */
export interface KnowledgeEntryFrontmatter {
  // Required fields
  type: 'knowledge';
  title: string; // Source of truth for display name; slug derived from this
  summary: string; // Brief description (AI-generated, used for ranking/preview)
  created_at: string;
  updated_at: string;

  // Source information
  source: KnowledgeSource;

  // Classification
  classification: KnowledgeClassification;

  // Status
  status: KnowledgeStatus;
}

/**
 * Complete knowledge entry (frontmatter + content)
 * The filename (slug) serves as the identifier
 */
export interface KnowledgeEntry extends KnowledgeEntryFrontmatter {
  /** Derived from filename (e.g., "api-design-guidelines" from "api-design-guidelines.mdc") */
  slug: string;
  content: string;
}

/**
 * Input for saving (create or update) a knowledge entry
 * Maps from current contextCreate() parameters
 */
export interface SaveKnowledgeEntryInput {
  // Title determines the filename slug
  title: string;

  // Content body
  content: string;

  // Source information
  sourceFile: string;
  projectId?: string;
  sourcePath?: string;

  // From AI categorization
  category: string;
  confidence: number;
  reasoning: string;
  metadata?: {
    tags?: string[];
    topics?: string[];
    entities?: {
      technologies?: string[];
      frameworks?: string[];
      libraries?: string[];
      apis?: string[];
    };
    summary?: string;
  };
}

/**
 * Filter criteria for listing entries
 */
export interface KnowledgeEntryFilter {
  /** Filter by project (exact match on source.project) */
  project?: string;

  /** Filter by category */
  category?: KnowledgeCategory | KnowledgeCategory[];

  /** Filter by status */
  status?: KnowledgeStatus;

  /** Filter by tags (entries must have at least one matching tag) */
  tags?: string[];

  /** Full-text search in content (simple substring match) */
  contentSearch?: string;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  ok: boolean;
  path: string;
  entryCount: number;
}

/**
 * Error codes for storage operations
 */
export type KnowledgeStorageErrorCode =
  | 'NOT_FOUND'
  | 'PARSE_ERROR'
  | 'WRITE_ERROR'
  | 'DIR_ERROR';

/**
 * Custom error class for storage operations
 */
export class KnowledgeStorageError extends Error {
  constructor(
    message: string,
    public code: KnowledgeStorageErrorCode,
    public cause?: Error
  ) {
    super(message);
    this.name = 'KnowledgeStorageError';
  }
}

/**
 * Storage service for knowledge entries
 *
 * Handles all file I/O operations for the ~/.kahuna/knowledge/ directory.
 * Designed for ~1000 entries scale with on-demand file scanning.
 *
 * Files are identified by their slug (filename without extension).
 * Creating an entry with an existing slug updates the existing entry.
 */
export interface KnowledgeStorageService {
  /**
   * Create or update a knowledge entry
   * If a file with the same slug exists, it will be updated
   * @returns The created/updated entry
   */
  save(entry: SaveKnowledgeEntryInput): Promise<KnowledgeEntry>;

  /**
   * List all knowledge entries (with optional filtering)
   * @param filter - Optional filter criteria
   * @returns Array of entries matching filter
   */
  list(filter?: KnowledgeEntryFilter): Promise<KnowledgeEntry[]>;

  /**
   * Get a single entry by slug
   * @param slug - Filename without extension (e.g., "api-design-guidelines")
   * @returns Entry or null if not found
   */
  get(slug: string): Promise<KnowledgeEntry | null>;

  /**
   * Check if an entry exists
   * @param slug - Filename without extension
   */
  exists(slug: string): Promise<boolean>;

  /**
   * Delete an entry (or mark as archived)
   * @param slug - Filename without extension
   * @param permanent - If true, delete file; if false, set status to archived
   */
  delete(slug: string, permanent?: boolean): Promise<void>;

  /**
   * Check if the knowledge base directory exists and is accessible
   */
  healthCheck(): Promise<HealthCheckResult>;
}
