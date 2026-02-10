/**
 * Centralized configuration
 *
 * Model names, server constants, and other configuration values
 * that were previously scattered as string literals.
 */

/**
 * Anthropic model identifiers used throughout the application.
 */
export const MODELS = {
  /** Model used for file categorization (fast, cheap) */
  categorization: 'claude-3-haiku-20240307',
  /** Model used for KB retrieval agent (prepare_context tool) */
  retrieval: 'claude-3-haiku-20240307',
  /** Model used for the ask tool's agentic Q&A loop */
  ask: 'claude-sonnet-4-20250514',
} as const;

/**
 * MCP server identity.
 */
export const SERVER_NAME = 'kahuna-mcp-server';
export const SERVER_VERSION = '0.2.0';

// =============================================================================
// FRAMEWORK CONFIGURATION
// =============================================================================

/**
 * Configuration for a supported framework scaffold.
 */
export interface FrameworkConfig {
  /** Framework identifier (matches template subdirectory name) */
  id: string;
  /** Human-readable display name */
  displayName: string;
  /** KB doc slug for prompt hints (agent should look for this doc) */
  kbDocSlug: string;
}

/**
 * Registry of supported frameworks for prepare_context.
 * The framework ID maps to the template subdirectory in vck-templates.
 */
export const FRAMEWORKS: Record<string, FrameworkConfig> = {
  langgraph: {
    id: 'langgraph',
    displayName: 'LangGraph',
    kbDocSlug: 'langgraph-best-practices',
  },
} as const;

/**
 * Get the list of valid framework IDs for tool schema enum.
 */
export function getFrameworkIds(): string[] {
  return Object.keys(FRAMEWORKS);
}
