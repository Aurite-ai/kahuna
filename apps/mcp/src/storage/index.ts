/**
 * Storage module for local knowledge base
 *
 * Provides types and utilities for managing .mdc files in ~/.kahuna/knowledge/
 */

// Types
export type {
  KnowledgeCategory,
  KnowledgeStatus,
  KnowledgeEntities,
  KnowledgeClassification,
  KnowledgeSource,
  KnowledgeEntryFrontmatter,
  KnowledgeEntry,
  SaveKnowledgeEntryInput,
  KnowledgeEntryFilter,
  HealthCheckResult,
  KnowledgeStorageErrorCode,
  KnowledgeStorageService,
} from './types.js';

export { KnowledgeStorageError } from './types.js';

// Utilities
export {
  generateSlug,
  mapCategory,
  parseMdcFile,
  generateMdcFile,
  type ParsedMdcFile,
} from './utils.js';
