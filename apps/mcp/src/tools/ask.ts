/**
 * Kahuna Ask Tool - Quick Q&A with AI agent
 *
 * Mid-task question answering. An LLM agent searches the knowledge base,
 * reads relevant files, and synthesizes an answer. Does not modify context/.
 *
 * See: docs/internal/designs/context-management-system.md
 */

import * as path from 'node:path';
import { z } from 'zod';
import { MODELS } from '../config.js';
import { buildQASystemPrompt, listContextFiles, qaTools, runAgent } from '../knowledge/index.js';
import { type MCPToolResponse, markdownResponse } from './response-utils.js';
import type { ToolContext } from './types.js';

/**
 * Tool definition for MCP registration.
 */
export const askToolDefinition = {
  name: 'kahuna_ask',
  description: `Quick Q&A using the project knowledge base.

USE THIS TOOL WHEN:
- Mid-task and need specific information
- User asks a direct question about the project
- Need clarification on a decision or pattern
- Context folder doesn't have what you need

Searches the knowledge base and synthesizes an answer with source citations.

<examples>
### Direct question
kahuna_ask(question="Why did we choose keyword search over embeddings?")

### Clarification
kahuna_ask(question="What's our error handling pattern for API calls?")

### Check if exists
kahuna_ask(question="Do we have rate limiting requirements documented?")
</examples>

<hints>
- Searches knowledge base with AI-powered answer synthesis
- Use for quick questions mid-task
- For comprehensive context setup, use kahuna_prepare_context instead
- Returns answer with source citations
</hints>`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      question: {
        type: 'string',
        description: 'What you want to know',
      },
    },
    required: ['question'],
  },
};

/**
 * Zod schema for validating ask tool input.
 */
const askInputSchema = z.object({
  question: z
    .string({ error: 'Missing or empty question' })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Missing or empty question' }),
});

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle the kahuna_ask tool call.
 *
 * Pipeline:
 * 1. Validate input
 * 2. Scan context/ directory for already-surfaced files
 * 3. Build Q&A system prompt (includes context file info)
 * 4. Run Q&A agent with list + read tools
 * 5. Return markdown response with answer
 */
export async function askToolHandler(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<MCPToolResponse> {
  const { storage, anthropic } = ctx;

  // Validate input
  const parseResult = askInputSchema.safeParse(args);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => i.message).join(', ');
    return markdownResponse(
      `Invalid input: ${issues}\n\n<hints>\n- Provide a clear question about the project\n</hints>`,
      true
    );
  }

  const { question } = parseResult.data;

  try {
    // Scan context/ directory
    const contextDir = path.join(process.cwd(), 'context');
    const contextFiles = await listContextFiles(contextDir);

    // Build system prompt with context file awareness
    const systemPrompt = buildQASystemPrompt(contextFiles);

    // Run Q&A agent
    const agentResult = await runAgent(
      {
        model: MODELS.ask,
        systemPrompt,
        tools: qaTools,
        maxTokens: 2000,
      },
      question,
      storage,
      anthropic
    );

    // Build markdown response
    const answer =
      agentResult.textResponse || "I couldn't find information about this in the knowledge base.";

    const markdown = `# Answer

**Question:** ${question}

${answer}

<hints>
- Full details may be in the cited knowledge base entries
- Use kahuna_prepare_context if you need broader context for a task
- Use kahuna_learn to add new information to the knowledge base
</hints>`;

    return markdownResponse(markdown);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return markdownResponse(
      `Failed to answer question: ${errorMessage}\n\n<hints>\n- Check if the knowledge base is accessible and try again\n</hints>`,
      true
    );
  }
}

/**
 * Export the tool definition and handler together.
 */
export const askTool = {
  definition: askToolDefinition,
  handler: askToolHandler,
};
