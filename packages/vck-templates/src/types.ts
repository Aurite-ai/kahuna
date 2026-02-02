/**
 * VCK Template types
 *
 * Types specific to template management and VCK generation.
 */

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
