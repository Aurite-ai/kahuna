/**
 * Zod schemas for conversation processing validation.
 */

import { z } from "zod";

/**
 * Schema for a decision made during the conversation.
 */
export const DecisionSchema = z.object({
  decision: z.string().describe("What was decided"),
  rationale: z.string().optional().describe("Why this choice was made"),
});

/**
 * Schema for the conversation summary output.
 * Used for structured output validation from the LLM.
 */
export const ConversationSummarySchema = z.object({
  title: z
    .string()
    .describe("Brief descriptive title for this conversation (5-10 words)"),

  summary: z
    .string()
    .describe("2-3 paragraph summary of what happened and why it matters"),

  taskType: z
    .enum(["design", "implementation", "debugging", "research", "refactoring", "other"])
    .describe("Primary type of work done in this conversation"),

  outcome: z
    .enum(["completed", "in-progress", "blocked", "abandoned"])
    .describe("Final state of the task"),

  decisions: z
    .array(DecisionSchema)
    .describe("Key decisions made during this conversation"),

  filesCreated: z
    .array(z.string())
    .describe("Paths of files created during this conversation"),

  filesModified: z
    .array(z.string())
    .describe("Paths of files modified during this conversation"),

  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("How confident the agent is in this summary (0-1)"),
});

export type ConversationSummarySchemaType = z.infer<typeof ConversationSummarySchema>;

/**
 * Convert the schema to a JSON Schema representation for tool use.
 */
export function getConversationSummaryJsonSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Brief descriptive title for this conversation (5-10 words)",
      },
      summary: {
        type: "string",
        description: "2-3 paragraph summary of what happened and why it matters",
      },
      taskType: {
        type: "string",
        enum: ["design", "implementation", "debugging", "research", "refactoring", "other"],
        description: "Primary type of work done in this conversation",
      },
      outcome: {
        type: "string",
        enum: ["completed", "in-progress", "blocked", "abandoned"],
        description: "Final state of the task",
      },
      decisions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            decision: {
              type: "string",
              description: "What was decided",
            },
            rationale: {
              type: "string",
              description: "Why this choice was made",
            },
          },
          required: ["decision"],
        },
        description: "Key decisions made during this conversation",
      },
      filesCreated: {
        type: "array",
        items: { type: "string" },
        description: "Paths of files created during this conversation",
      },
      filesModified: {
        type: "array",
        items: { type: "string" },
        description: "Paths of files modified during this conversation",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "How confident the agent is in this summary (0-1)",
      },
    },
    required: [
      "title",
      "summary",
      "taskType",
      "outcome",
      "decisions",
      "filesCreated",
      "filesModified",
      "confidence",
    ],
  };
}
