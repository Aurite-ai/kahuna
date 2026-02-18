/**
 * Knowledge module — top-level exports
 *
 * Re-exports from storage, agents, and surfacing submodules.
 * This is the primary import point for the knowledge domain.
 */

// Storage
export {
  // Types
  type KnowledgeCategory,
  type KnowledgeStatus,
  type KnowledgeClassification,
  type KnowledgeSource,
  type KnowledgeEntryFrontmatter,
  type KnowledgeEntry,
  type SaveKnowledgeEntryInput,
  type KnowledgeEntryFilter,
  type HealthCheckResult,
  type KnowledgeStorageErrorCode,
  type KnowledgeStorageService,
  KnowledgeStorageError,
  FILE_SIZE_LIMIT,
  // Utilities
  generateSlug,
  validateCategory,
  parseMdcFile,
  generateMdcFile,
  stripFrontmatter,
  type ParsedMdcFile,
  // Service
  FileKnowledgeStorageService,
} from './storage/index.js';

// Agents
export {
  // Prompts
  CATEGORIZATION_PROMPT,
  RETRIEVAL_PROMPT,
  QA_PROMPT_TEMPLATE,
  buildCategorizationUserMessage,
  buildRetrievalUserMessage,
  buildQASystemPrompt,
  // Tools
  listKnowledgeFilesTool,
  readKnowledgeFileTool,
  selectFilesForContextTool,
  categorizeFileTool,
  selectFrameworkTool,
  retrievalTools,
  qaTools,
  categorizationTools,
  executeKnowledgeTool,
  // Runner
  runAgent,
  type AgentConfig,
  type AgentResult,
  type AgentUsageStats,
} from './agents/index.js';

// Surfacing
export {
  clearContextDir,
  writeContextReadme,
  getKBPath,
  hasLocalSource,
  getLocalSourcePath,
  type KBFileReference,
  type ReferencedFile,
  // Framework
  copyFrameworkBoilerplate,
  resolveFrameworkTemplateDir,
  FrameworkError,
  type FrameworkCopyResult,
  // File tree
  generateFileTree,
  type FileTreeOptions,
} from './surfacing/index.js';
