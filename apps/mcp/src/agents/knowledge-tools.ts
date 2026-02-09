/**
 * Knowledge Base Agent Tools
 *
 * Internal tools for agents to explore and read from the knowledge base.
 * These tools are used by agentic loops (like kahuna_ask, kahuna_prepare_context)
 * to access KB content when answering questions or preparing context.
 *
 * To add a new agent tool:
 * 1. Add the Tool definition to this file
 * 2. Add the tool to the knowledgeTools array
 * 3. Add a case in executeKnowledgeTool() to handle the tool
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import { z } from 'zod';
import type { KnowledgeStorageService } from '../storage/index.js';

/**
 * Tool definition for listing knowledge base files.
 * Returns file slugs and titles to help agents decide which files to read.
 */
export const listKnowledgeFilesTool: Tool = {
  name: 'list_knowledge_files',
  description:
    'List all files in the knowledge base. Returns file names (slugs) and titles to help you decide which files to read.',
  input_schema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

/**
 * Tool definition for reading a specific knowledge base file.
 * Returns the full content of the file.
 */
export const readKnowledgeFileTool: Tool = {
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
};

/**
 * All knowledge base tools available to agents.
 * Use this array when configuring Claude with tools for KB access.
 */
export const knowledgeTools: Tool[] = [listKnowledgeFilesTool, readKnowledgeFileTool];

/**
 * Schema for validating read_knowledge_file tool input.
 */
const readKnowledgeFileInputSchema = z.object({
  slug: z.string().min(1, 'Slug cannot be empty'),
});

/**
 * Execute a knowledge base agent tool call.
 *
 * @param toolName - Name of the tool to execute
 * @param toolInput - Input parameters for the tool
 * @param storage - Knowledge storage service instance
 * @returns String result from the tool execution
 */
export async function executeKnowledgeTool(
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
      const parseResult = readKnowledgeFileInputSchema.safeParse(toolInput);
      if (!parseResult.success) {
        const issues = parseResult.error.issues.map((i) => i.message).join(', ');
        return `Invalid input: ${issues}`;
      }
      const { slug } = parseResult.data;
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
