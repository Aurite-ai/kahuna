/**
 * MCP Tool: sync_conversations
 *
 * Exposes the conversation sync functionality as an MCP tool.
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { syncConversations } from "../processing/sync.js";

/**
 * Tool definition for sync_conversations.
 */
export const syncTool = {
  definition: {
    name: "sync_conversations",
    description: `Sync Claude Code conversation logs to the knowledge base.

Scans the configured conversation source directory for new or modified
conversation logs and processes them into structured summaries.

Use this tool to:
- Update the knowledge base with recent conversations
- Process conversations after completing work sessions
- Ensure context is available for future queries

Returns a summary of what was processed.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        force: {
          type: "boolean",
          description: "Reprocess all conversations, even if already processed (default: false)",
        },
      },
      required: [] as string[],
    },
  },

  /**
   * Handle sync_conversations tool calls.
   */
  async handler(args: Record<string, unknown>): Promise<CallToolResult> {
    const force = Boolean(args.force);

    try {
      const result = await syncConversations({ force });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                hint: "Make sure ANTHROPIC_API_KEY is set and the conversations directory exists.",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  },
};
