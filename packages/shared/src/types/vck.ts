/**
 * VCK (Vibe Code Kit) type definitions
 *
 * A VCK is a downloadable package containing everything a coding copilot needs:
 * - Copilot configuration (rules, settings)
 * - Business context (from user's context files)
 * - Framework boilerplate (starting code)
 */

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
 * Phase 1 uses JSON format for simplicity.
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

/**
 * VCK generation record - tracks when VCKs were generated.
 * Provides history of exports for a project.
 */
export interface VCKGeneration {
  id: string;
  projectId: string;
  /** Snapshot of context file IDs at generation time */
  contextSnapshot: string[];
  /** Framework used (e.g., 'langgraph') */
  framework: string;
  /** Copilot configuration used (e.g., 'claude-code') */
  copilot: string;
  createdAt: Date;
}

/**
 * Options for VCK generation.
 */
export interface VCKGenerationOptions {
  /** Target framework (default: 'langgraph') */
  framework?: string;
  /** Copilot configuration (default: 'claude-code') */
  copilot?: string;
}

/**
 * Supported frameworks for VCK generation.
 */
export const SUPPORTED_FRAMEWORKS = ['langgraph'] as const;
export type SupportedFramework = (typeof SUPPORTED_FRAMEWORKS)[number];

/**
 * Supported copilot configurations.
 */
export const SUPPORTED_COPILOTS = ['claude-code'] as const;
export type SupportedCopilot = (typeof SUPPORTED_COPILOTS)[number];
