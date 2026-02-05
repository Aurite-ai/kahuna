/**
 * Error Handling Patterns
 *
 * Custom error types for Kahuna MCP tools with user-friendly messages.
 * All errors include hints to help the copilot (and user) recover.
 *
 * USAGE:
 * ```ts
 * import { ToolError, ValidationError, FileNotFoundError } from "../lib/errors.js";
 *
 * // In a tool handler:
 * if (!args.project_name) {
 *   throw new ValidationError("project_name is required", {
 *     hints: ["Provide a project name", "Example: kahuna_setup({ project_name: 'my-agent' })"]
 *   });
 * }
 * ```
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Options for error formatting.
 */
export interface ErrorOptions {
  /** Hints for recovery - helps the copilot fix the issue */
  hints?: string[];

  /** Additional context about what went wrong */
  context?: Record<string, unknown>;
}

/**
 * Base error class for all Kahuna tool errors.
 * Provides consistent formatting with hints for recovery.
 */
export class ToolError extends Error {
  public readonly hints: string[];
  public readonly context: Record<string, unknown>;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.name = 'ToolError';
    this.hints = options.hints ?? [];
    this.context = options.context ?? {};
  }

  /**
   * Format this error as an MCP tool result.
   */
  toToolResult(): CallToolResult {
    const parts: string[] = [];

    parts.push(`# Error: ${this.name}`);
    parts.push('');
    parts.push(this.message);

    if (Object.keys(this.context).length > 0) {
      parts.push('');
      parts.push('## Context');
      for (const [key, value] of Object.entries(this.context)) {
        parts.push(`- **${key}:** ${JSON.stringify(value)}`);
      }
    }

    if (this.hints.length > 0) {
      parts.push('');
      parts.push('<hints>');
      for (const hint of this.hints) {
        parts.push(`- ${hint}`);
      }
      parts.push('</hints>');
    }

    return {
      content: [
        {
          type: 'text',
          text: parts.join('\n'),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Validation error - input doesn't meet requirements.
 */
export class ValidationError extends ToolError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

/**
 * File not found error - requested file/path doesn't exist.
 */
export class FileNotFoundError extends ToolError {
  constructor(path: string, options: ErrorOptions = {}) {
    super(`File not found: ${path}`, {
      ...options,
      context: { ...options.context, path },
    });
    this.name = 'FileNotFoundError';
  }
}

/**
 * Permission error - can't read/write to a path.
 */
export class PermissionError extends ToolError {
  constructor(path: string, operation: 'read' | 'write', options: ErrorOptions = {}) {
    super(`Permission denied: Cannot ${operation} ${path}`, {
      ...options,
      context: { ...options.context, path, operation },
    });
    this.name = 'PermissionError';
  }
}

/**
 * Configuration error - missing or invalid configuration.
 */
export class ConfigurationError extends ToolError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, options);
    this.name = 'ConfigurationError';
  }
}

/**
 * Knowledge base error - issues with ~/.kahuna operations.
 */
export class KnowledgeBaseError extends ToolError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, options);
    this.name = 'KnowledgeBaseError';
  }
}

/**
 * Format any error (including standard Error) as an MCP tool result.
 * Use this in catch blocks to ensure consistent error responses.
 *
 * @example
 * ```ts
 * try {
 *   // tool logic
 * } catch (error) {
 *   return formatErrorResult(error);
 * }
 * ```
 */
export function formatErrorResult(error: unknown): CallToolResult {
  // If it's our custom error, use its formatter
  if (error instanceof ToolError) {
    return error.toToolResult();
  }

  // For standard errors, wrap them
  if (error instanceof Error) {
    return new ToolError(error.message, {
      hints: [
        'Check the error message for details',
        'This may be an unexpected error - report if it persists',
      ],
      context: { originalError: error.name },
    }).toToolResult();
  }

  // For unknown errors
  return new ToolError('An unexpected error occurred', {
    hints: ['Try the operation again', 'Report this error if it persists'],
    context: { error: String(error) },
  }).toToolResult();
}
