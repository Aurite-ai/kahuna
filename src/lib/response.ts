/**
 * Response Formatting Utility
 *
 * Standard markdown response builder for Kahuna MCP tools.
 * All tool responses should use this builder to ensure consistent formatting.
 *
 * RESPONSE FORMAT (from tool-specifications.md):
 * ```markdown
 * # Clear Title
 *
 * [Brief summary of what happened]
 *
 * ## Structured Content
 * [Tables, lists, details]
 *
 * <hints>
 * - [Specific actionable suggestion]
 * - [Another suggestion]
 * </hints>
 * ```
 *
 * The `<hints>` section is KEY - it steers the copilot toward productive next actions.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Options for building a tool response.
 */
export interface ResponseOptions {
  /** Main title for the response (shown as # heading) */
  title: string;

  /** Brief summary of what happened */
  summary?: string;

  /** Main content body (markdown) */
  body: string;

  /** Hints for what the copilot should do next - these steer behavior */
  hints?: string[];
}

/**
 * Build a formatted markdown response for an MCP tool.
 *
 * @example
 * ```ts
 * return formatResponse({
 *   title: "Project Initialized: my-project",
 *   summary: "Created LangGraph agent project structure with Kahuna integration.",
 *   body: "## What's Ready\n\n- **CLAUDE.md** - Project instructions",
 *   hints: [
 *     "Read CLAUDE.md for project-specific instructions",
 *     "Use `kahuna_prepare_context` before beginning implementation"
 *   ]
 * });
 * ```
 */
export function formatResponse(options: ResponseOptions): CallToolResult {
  const { title, summary, body, hints } = options;

  const parts: string[] = [];

  // Title
  parts.push(`# ${title}`);

  // Summary (optional)
  if (summary) {
    parts.push('');
    parts.push(summary);
  }

  // Body
  parts.push('');
  parts.push(body);

  // Hints section (critical for steering the copilot)
  if (hints && hints.length > 0) {
    parts.push('');
    parts.push('<hints>');
    for (const hint of hints) {
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
  };
}

/**
 * Build a simple text response (for cases where full formatting isn't needed).
 */
export function textResponse(text: string): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

/**
 * Build a JSON response (for programmatic data, not typical).
 */
export function jsonResponse(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}
