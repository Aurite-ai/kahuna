/**
 * Kahuna Ask Tool - Simple Q&A with AI agent
 *
 * This tool provides intelligent question answering using the knowledge base.
 * An internal agent explores the knowledge base files to find and synthesize answers.
 *
 * Flow:
 * 1. Copilot calls ask tool with question
 * 2. Question goes to internal agent
 * 3. Agent sees file names in knowledge base
 * 4. Agent reads files as needed to answer the question
 * 5. Agent responds with answer
 * 6. Answer returned to Copilot
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import { z } from 'zod';
import { executeKnowledgeTool, knowledgeTools } from '../agents/index.js';
import type { KnowledgeStorageService } from '../storage/index.js';
import { type MCPToolResponse, errorResponse, successResponse } from './response-utils.js';

/**
 * Agent configuration constants
 */
const AGENT_MAX_ITERATIONS = 10;
const AGENT_MAX_TOKENS = 2000;

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

**Examples:**
- Direct question: question="Why did we choose keyword search over embeddings?"
- Clarification: question="What's our error handling pattern for API calls?"
- Check if exists: question="Do we have rate limiting requirements documented?"

**Hints:**
- Searches knowledge base with AI-powered answer synthesis
- Use for quick questions mid-task
- For comprehensive context setup, use kahuna_prepare_context instead
- Returns answer with source citations`,

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

/**
 * Synthesize answer using an agentic Claude loop
 *
 * The agent has tools to explore the knowledge base and will
 * read files as needed to answer the question.
 */
async function synthesizeAnswer(
  question: string,
  storage: KnowledgeStorageService
): Promise<string> {
  const client = new Anthropic();

  const systemPrompt = `You are a knowledge assistant for an enterprise codebase. Your job is to answer questions using the knowledge base.

You have tools to:
1. List all files in the knowledge base (see their names/titles)
2. Read specific files that seem relevant

Process:
1. First, list the knowledge base files to see what's available
2. Based on the file names/titles, read the ones that might help answer the question
3. Synthesize an answer from what you find
4. If you can't find the answer, say so clearly

Guidelines:
- Only answer based on what you find in the knowledge base
- Cite your sources (mention which files you found the info in)
- Be concise but complete
- If the knowledge base doesn't have the answer, say "I couldn't find information about this in the knowledge base"`;

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: question,
    },
  ];

  // Agentic loop - let Claude use tools until it has an answer
  for (let i = 0; i < AGENT_MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: AGENT_MAX_TOKENS,
      system: systemPrompt,
      tools: knowledgeTools,
      messages,
    });

    // Check if we're done (no more tool use)
    if (response.stop_reason === 'end_turn') {
      // Extract the final text response
      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock?.type === 'text' ? textBlock.text : 'No answer generated.';
    }

    // Process tool uses
    const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');

    if (toolUseBlocks.length === 0) {
      // No tool use and not end_turn - extract any text
      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock?.type === 'text' ? textBlock.text : 'No answer generated.';
    }

    // Add assistant's response to messages
    messages.push({
      role: 'assistant',
      content: response.content,
    });

    // Execute tools and add results
    const toolResults: ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      if (block.type === 'tool_use') {
        const result = await executeKnowledgeTool(
          block.name,
          block.input as Record<string, unknown>,
          storage
        );
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    messages.push({
      role: 'user',
      content: toolResults,
    });
  }

  return 'Agent reached maximum iterations without completing the answer.';
}

/**
 * Handle the kahuna_ask tool call.
 *
 * @param args - Tool arguments from MCP client
 * @param storage - Knowledge storage service instance
 * @returns MCP tool response
 */
export async function askToolHandler(
  args: Record<string, unknown>,
  storage: KnowledgeStorageService
): Promise<MCPToolResponse> {
  // Validate input with Zod
  const parseResult = askInputSchema.safeParse(args);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => i.message).join(', ');
    return errorResponse(`Invalid input: ${issues}`, {
      hint: 'Provide a clear question about the project',
    });
  }

  const { question } = parseResult.data;

  try {
    // Let the agent answer the question
    const answer = await synthesizeAnswer(question, storage);

    return successResponse({
      question,
      answer,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to answer question: ${errorMessage}`, {
      hint: 'Check if the knowledge base is accessible and try again',
    });
  }
}

/**
 * Export the tool definition and handler together.
 */
export const askTool = {
  definition: askToolDefinition,
  handler: askToolHandler,
};
