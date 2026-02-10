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
  /** Model used for the ask tool's agentic Q&A loop */
  ask: 'claude-sonnet-4-20250514',
} as const;

/**
 * MCP server identity.
 */
export const SERVER_NAME = 'kahuna-mcp-server';
export const SERVER_VERSION = '0.0.1';
