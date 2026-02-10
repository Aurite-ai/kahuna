/**
 * VCK Template types
 *
 * Types specific to template management and VCK generation.
 */

// ── VCK structure types (moved from @kahuna/shared) ──

/**
 * VCK metadata - tracking information for the generated kit.
 */
export interface VCKMetadata {
  /** Project this VCK was generated for */
  projectId: string;
  /** ISO timestamp when VCK was generated */
  generatedAt: string;
  /** VCK format version (for compatibility) */
  version: string;
}

/**
 * VCK context - business information from user's context files.
 */
export interface VCKContext {
  /** Summary of the user's business/project */
  businessSummary: string;
  /** Additional context files as key-value pairs (filename -> content) */
  files: Record<string, string>;
}

/**
 * VCK structure - the complete kit returned to users.
 */
export interface VCK {
  /** Tracking and version information */
  metadata: VCKMetadata;
  /** User's business context */
  context: VCKContext;
  /** Copilot rules and guidelines */
  rules: string[];
  /** Boilerplate files (filename -> content) */
  boilerplate: Record<string, string>;
}

// ── Template types ──

/**
 * Template metadata for a framework template.
 */
export interface FrameworkTemplate {
  /** Unique identifier for the framework (e.g., 'langgraph') */
  id: string;
  /** Display name */
  name: string;
  /** Brief description */
  description: string;
  /** Relative path to template files */
  path: string;
}

/**
 * Template metadata for a copilot configuration.
 */
export interface CopilotConfigTemplate {
  /** Unique identifier for the copilot (e.g., 'claude-code') */
  id: string;
  /** Display name */
  name: string;
  /** Brief description */
  description: string;
  /** Relative path to config files */
  path: string;
}

/**
 * Input for VCK generation.
 */
export interface VCKGeneratorInput {
  /** Project ID for tracking */
  projectId: string;
  /** User's context files (filename -> content) */
  contextFiles: Record<string, string>;
  /** Business summary text */
  businessSummary: string;
  /** Framework to use (default: 'langgraph') */
  framework?: string;
  /** Copilot config to use (default: 'claude-code') */
  copilot?: string;
}

/**
 * Template file content.
 */
export interface TemplateFile {
  /** Relative path within the template */
  path: string;
  /** File content */
  content: string;
}
