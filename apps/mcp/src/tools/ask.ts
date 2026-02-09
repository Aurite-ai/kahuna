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
import type {
  ContentBlock,
  Tool,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/messages';
import type { KnowledgeStorageService } from '../storage/index.js';

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
 * Input type for the tool.
 */
interface AskToolInput {
  question: string;
}

/**
 * MCP tool response format.
 */
interface MCPToolResponse {
  [key: string]: unknown;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Helper to create a success response.
 */
function successResponse(data: unknown): MCPToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: true, data }, null, 2),
      },
    ],
  };
}

/**
 * Helper to create an error response.
 */
function errorResponse(message: string, details?: unknown): MCPToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: false, error: message, details }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Internal tools for the agent to explore the knowledge base
 */
const agentTools: Tool[] = [
  {
    name: 'list_knowledge_files',
    description:
      'List all files in the knowledge base. Returns file names (slugs) and titles to help you decide which files to read.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'read_knowledge_file',
    description:
      'Read the full content of a specific knowledge base file. Use this after listing files to read ones that seem relevant to the question.',
    input_schema: {
      type: 'object' as const,
      properties: {
        slug: {
          type: 'string',
          description: 'The file slug (filename without extension) to read',
        },
      },
      required: ['slug'],
    },
  },
];

/**
 * Execute an agent tool call
 */
async function executeAgentTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  storage: KnowledgeStorageService
): Promise<string> {
  switch (toolName) {
    case 'list_knowledge_files': {
      const entries = await storage.list({ status: 'active' });
      if (entries.length === 0) {
        return 'No files in knowledge base.';
      }
      const fileList = entries.map((e) => `- ${e.slug}: "${e.title}"`).join('\n');
      return `Knowledge base files:\n${fileList}`;
    }

    case 'read_knowledge_file': {
      const slug = toolInput.slug as string;
      const entry = await storage.get(slug);
      if (!entry) {
        return `File not found: ${slug}`;
      }
      return `# ${entry.title}\n\n${entry.content}`;
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

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
  const maxIterations = 10;
  for (let i = 0; i < maxIterations; i++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      tools: agentTools,
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
        const result = await executeAgentTool(
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
  const input = args as unknown as AskToolInput;
  const { question } = input;

  // Validate input
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return errorResponse('Missing or empty question', {
      hint: 'Provide a clear question about the project',
    });
  }

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
