/**
 * Type definitions for knowledge storage
 *
 * Simplified types — no tags, no entities.
 * See: docs/internal/designs/context-management-system.md
 */

/**
 * Categories aligned with docs/design/knowledge-architecture.md
 */
export type KnowledgeCategory =
  | 'policy'
  | 'requirement'
  | 'reference'
  | 'decision'
  | 'pattern'
  | 'context'
  | 'integration';

/**
 * Integration metadata for data sources, tools, and external services.
 * This helps vibe coders make informed decisions when building agents.
 */
export interface IntegrationMetadata {
  /** External services mentioned (e.g., Gmail, HubSpot, PostgreSQL, Slack) */
  connectedServices?: string[];
  /** What triggers the integration (e.g., webhook, schedule, manual, event, api-call) */
  triggers?: string[];
  /** Where data comes from (e.g., database, api, crm, spreadsheet, email) */
  dataSources?: string[];
  /** Where results/actions go (e.g., email, notification, api-call, database-write) */
  outputs?: string[];
  /** What AI tasks are involved (e.g., generate-email, analyze-sentiment, classify-ticket) */
  aiTasks?: string[];
  /** Authentication methods (e.g., oauth2, api-key, basic-auth, jwt) */
  authentication?: string[];
}

/**
 * Entry status for soft delete support
 */
export type KnowledgeStatus = 'active' | 'archived';

/**
 * Simplified classification data from AI categorization.
 * Reduced from 8 fields (tags, entities, etc.) to 4.
 */
export interface KnowledgeClassification {
  category: KnowledgeCategory;
  confidence: number;
  reasoning: string;
  topics: string[];
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
  type: 'knowledge';
  title: string;
  summary: string;
  created_at: string;
  updated_at: string;

  source: KnowledgeSource;
  classification: KnowledgeClassification;
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
 * Simplified input for saving a knowledge entry.
 * Flat fields — no metadata wrapper. source.project set automatically via process.cwd().
 */
export interface SaveKnowledgeEntryInput {
  title: string;
  summary: string;
  content: string;
  sourceFile: string;
  sourcePath?: string;
  category: KnowledgeCategory;
  confidence: number;
  reasoning: string;
  topics: string[];
  /** Optional subdirectory within the knowledge base (e.g., project hash for project-specific storage) */
  subdirectory?: string;
}

/**
 * Filter criteria for listing entries.
 * Tags filter removed (tags no longer exist).
 */
export interface KnowledgeEntryFilter {
  /** Filter by project (exact match on source.project) */
  project?: string;
  /** Filter by category */
  category?: KnowledgeCategory | KnowledgeCategory[];
  /** Filter by status */
  status?: KnowledgeStatus;
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
export type KnowledgeStorageErrorCode = 'NOT_FOUND' | 'PARSE_ERROR' | 'WRITE_ERROR' | 'DIR_ERROR';

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
 * Storage service interface for knowledge entries.
 */
export interface KnowledgeStorageService {
  /**
   * Create or update a knowledge entry.
   * If a file with the same slug exists, it will be updated.
   */
  save(entry: SaveKnowledgeEntryInput): Promise<KnowledgeEntry>;

  /**
   * List all knowledge entries (with optional filtering).
   * @param filter - Optional filter criteria
   * @param subdirectories - Optional array of subdirectories to include. If null/undefined, scans ALL subdirectories. Pass empty array [] to scan only base directory.
   */
  list(filter?: KnowledgeEntryFilter, subdirectories?: string[] | null): Promise<KnowledgeEntry[]>;

  /**
   * Get a single entry by slug.
   * @param slug - The entry slug
   * @param subdirectory - Optional subdirectory within the knowledge base
   */
  get(slug: string, subdirectory?: string): Promise<KnowledgeEntry | null>;

  /**
   * Check if an entry exists.
   * @param slug - The entry slug
   * @param subdirectory - Optional subdirectory within the knowledge base
   */
  exists(slug: string, subdirectory?: string): Promise<boolean>;

  /**
   * Delete an entry (or mark as archived).
   * @param slug - The entry slug
   * @param subdirectory - Optional subdirectory within the knowledge base
   * @param permanent - If true, delete file; if false, set status to archived
   */
  delete(slug: string, subdirectory?: string, permanent?: boolean): Promise<void>;

  /**
   * Check if the knowledge base directory exists and is accessible.
   */
  healthCheck(): Promise<HealthCheckResult>;
}

/**
 * Hard file size limit for categorization (400KB ≈ 100k tokens)
 */
export const FILE_SIZE_LIMIT = 400_000;
