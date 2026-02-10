/**
 * Kahuna Prepare Context Tool - Agentic context retrieval
 *
 * Searches the knowledge base for files relevant to a task using an LLM agent,
 * then writes them as clean markdown to the project's context/ folder.
 *
 * See: docs/internal/designs/context-management-system.md
 */

import * as path from 'node:path';
import { z } from 'zod';
import { MODELS } from '../config.js';
import {
  type AgentResult,
  type KnowledgeEntry,
  RETRIEVAL_PROMPT,
  buildRetrievalUserMessage,
  clearContextDir,
  generateMdcFile,
  retrievalTools,
  runAgent,
  writeContextFile,
  writeContextReadme,
} from '../knowledge/index.js';
import { type MCPToolResponse, type ToolContext, markdownResponse } from './types.js';

/**
 * Tool definition for MCP registration.
 */
export const prepareContextToolDefinition = {
  name: 'kahuna_prepare_context',
  description: `Prepare the context/ folder with relevant knowledge for a task.

USE THIS TOOL WHEN:
- Starting any new task or feature
- User describes what they want to build
- Before beginning implementation work
- User asks "what do we know about X"

This is the PRIMARY context retrieval tool. Call it ONCE at task start, then work from context/ files.

<examples>
### Starting a task
kahuna_prepare_context(task="Add rate limiting to the search tool")

### With files you'll touch
kahuna_prepare_context(task="Refactor error handling in tools", files=["src/agent/tools.py"])

### Exploring a topic
kahuna_prepare_context(task="Understand our API design patterns")
</examples>

<hints>
- Call ONCE at task start, then read context/ files directly
- Natural language task description works best
- After calling, read context/README.md for navigation
- If you need more context mid-task, use kahuna_ask instead
</hints>`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      task: {
        type: 'string',
        description: 'What you are trying to do. Be specific for better results.',
      },
      files: {
        type: 'array',
        description: 'Optional: Files you will be working with (helps with relevance)',
        items: {
          type: 'string',
        },
      },
    },
    required: ['task'],
  },
};

/**
 * Zod schema for validating prepare context tool input.
 */
const prepareContextInputSchema = z.object({
  task: z
    .string({ error: 'Missing or empty task' })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Missing or empty task' }),
  files: z.array(z.string()).optional(),
});

/**
 * Selection from the retrieval agent's select_files_for_context tool call.
 */
interface FileSelection {
  slug: string;
  reason: string;
}

/**
 * Extract file selections from agent tool results.
 */
function extractSelections(agentResult: AgentResult): FileSelection[] {
  const selectResult = agentResult.toolResults.find(
    (r) => (r as Record<string, unknown>).tool === 'select_files_for_context'
  );
  if (!selectResult) return [];
  const r = selectResult as Record<string, unknown>;
  const selections = r.selections as FileSelection[] | undefined;
  return selections || [];
}

// =============================================================================
// MARKDOWN RESPONSE BUILDERS
// =============================================================================

function buildContextReadyMarkdown(
  task: string,
  selections: FileSelection[],
  entries: Map<string, KnowledgeEntry>
): string {
  const parts: string[] = [];

  parts.push('# Context Ready\n');
  parts.push(`**Task:** ${task}\n`);
  parts.push('## Relevant Context Surfaced\n');
  parts.push('| Topic | File | Why Relevant |');
  parts.push('|-------|------|--------------|');

  for (const sel of selections) {
    const entry = entries.get(sel.slug);
    const title = entry?.title || sel.slug;
    parts.push(`| ${title} | context/${sel.slug}.md | ${sel.reason} |`);
  }

  // Start Here section
  parts.push('\n## Start Here\n');
  parts.push('1. **Read context/README.md** — Full navigation');
  const topSelections = selections.slice(0, 2);
  for (let i = 0; i < topSelections.length; i++) {
    const sel = topSelections[i];
    const entry = entries.get(sel.slug);
    const title = entry?.title || sel.slug;
    parts.push(`${i + 2}. **Check ${sel.slug}.md** — ${title}`);
  }

  parts.push('\n<hints>');
  parts.push('- Context folder is ready — read files directly');
  parts.push('- If you need more context mid-task, use kahuna_ask');
  parts.push('- After completing work, use kahuna_learn to capture learnings');
  parts.push('</hints>');

  return parts.join('\n');
}

function buildEmptyKBMarkdown(): string {
  return `# No Context Available

The knowledge base is empty. No files to surface for this task.

<hints>
- Use kahuna_learn to add files to the knowledge base first
- Share policy docs, specs, or reference materials
- Then call kahuna_prepare_context again
</hints>`;
}

function buildNoRelevantFilesMarkdown(task: string, totalFiles: number): string {
  return `# No Relevant Context

The knowledge base has ${totalFiles} files, but none are relevant to: "${task}"

<hints>
- Try rephrasing the task description
- Use kahuna_learn to add files related to this task
- Use kahuna_ask to check if the knowledge base has related information
</hints>`;
}

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle the kahuna_prepare_context tool call.
 *
 * Pipeline:
 * 1. Validate input
 * 2. Check if KB is empty → return "no knowledge" markdown
 * 3. Run retrieval agent with list + read + select_files tools
 * 4. Extract selections from agent result
 * 5. Write files to context/ directory
 * 6. Return markdown response
 */
export async function prepareContextToolHandler(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<MCPToolResponse> {
  const { storage, anthropic } = ctx;

  // Validate input
  const parseResult = prepareContextInputSchema.safeParse(args);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => i.message).join(', ');
    return markdownResponse(
      `Invalid input: ${issues}\n\n<hints>\n- Provide a clear task description\n</hints>`,
      true
    );
  }

  const { task, files } = parseResult.data;

  try {
    // Check if KB is empty
    const allEntries = await storage.list({ status: 'active' });

    if (allEntries.length === 0) {
      return markdownResponse(buildEmptyKBMarkdown());
    }

    // Run retrieval agent
    const userMessage = buildRetrievalUserMessage(task, files);
    const agentResult = await runAgent(
      {
        model: MODELS.retrieval,
        systemPrompt: RETRIEVAL_PROMPT,
        tools: retrievalTools,
      },
      userMessage,
      storage,
      anthropic
    );

    // Extract file selections
    const selections = extractSelections(agentResult);

    if (selections.length === 0) {
      return markdownResponse(buildNoRelevantFilesMarkdown(task, allEntries.length));
    }

    // Write to context/ directory
    const contextDir = path.join(process.cwd(), 'context');
    await clearContextDir(contextDir);

    // Build entry lookup for selected files
    const entryMap = new Map<string, KnowledgeEntry>();
    for (const sel of selections) {
      const entry = await storage.get(sel.slug);
      if (entry) {
        entryMap.set(sel.slug, entry);
        // Generate .mdc content and write stripped version to context/
        const mdcContent = generateMdcFile(entry, entry.content);
        await writeContextFile(contextDir, sel.slug, mdcContent);
      }
    }

    // Write README.md
    await writeContextReadme(contextDir, task, selections);

    return markdownResponse(buildContextReadyMarkdown(task, selections, entryMap));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return markdownResponse(
      `Failed to prepare context: ${errorMessage}\n\n<hints>\n- Check if the knowledge base directory is accessible (~/.kahuna/knowledge/)\n</hints>`,
      true
    );
  }
}

/**
 * Export the tool definition and handler together.
 */
export const prepareContextTool = {
  definition: prepareContextToolDefinition,
  handler: prepareContextToolHandler,
};
