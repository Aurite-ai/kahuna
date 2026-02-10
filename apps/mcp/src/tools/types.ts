/**
 * Shared tool types
 *
 * Defines the ToolContext interface and ToolHandler type used by all tool handlers.
 * Ensures consistent signatures across all MCP tools.
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { KnowledgeStorageService } from '../storage/index.js';
import type { MCPToolResponse } from './response-utils.js';

/**
 * Context object passed to all tool handlers.
 * Provides access to shared services and configuration.
 *
 * Note: `anthropic` is optional during the transition period.
 * New tools (Subtask 2) will require it; old tools don't use it yet.
 */
export interface ToolContext {
  storage: KnowledgeStorageService;
  anthropic?: Anthropic;
}

/**
 * Standard tool handler function signature.
 * All MCP tool handlers should conform to this type.
 */
export type ToolHandler = (
  args: Record<string, unknown>,
  ctx: ToolContext
) => Promise<MCPToolResponse>;
