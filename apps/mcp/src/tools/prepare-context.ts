/**
 * Kahuna Prepare Context Tool - Agentic context retrieval
 *
 * Searches the knowledge base for files relevant to a task using an LLM agent,
 * then writes their file paths to the project's context-guide.md.
 * Can also scaffold framework boilerplate when the agent selects a framework.
 *
 * See: docs/internal/designs/context-management-system.md
 */

import { z } from 'zod';
import { MODELS } from '../config.js';
import {
  type AgentResult,
  type FrameworkCopyResult,
  type KBFileReference,
  RETRIEVAL_PROMPT,
  type ReferencedFile,
  buildRetrievalUserMessage,
  clearContextDir,
  copyFrameworkBoilerplate,
  generateFileTree,
  getKBPath,
  getLocalSourcePath,
  hasLocalSource,
  retrievalTools,
  runAgent,
  writeContextReadme,
} from '../knowledge/index.js';
import { type MCPToolResponse, type ToolContext, markdownResponse } from './types.js';

/**
 * Tool definition for MCP registration.
 */
export const prepareContextToolDefinition = {
  name: 'kahuna_prepare_context',
  description: `Prepare the context-guide.md with relevant knowledge for a task.

USE THIS TOOL WHEN:
- Starting any new task or feature
- User describes what they want to build
- Before beginning implementation work
- User asks "what do we know about X"

This is the PRIMARY context retrieval tool. Call it ONCE at task start, then work from context-guide.md.

<examples>
### Starting a task
kahuna_prepare_context(task="Add rate limiting to the search tool")

### With files you'll touch
kahuna_prepare_context(task="Refactor error handling in tools", files=["src/agent/tools.py"])

### Exploring a topic
kahuna_prepare_context(task="Understand our API design patterns")
</examples>

<hints>
- Call ONCE at task start, then read the files referenced in context-guide.md
- Natural language task description works best
- After calling, read context-guide.md for navigation
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
      includeBoilerplate: {
        type: 'boolean',
        description:
          'Whether to copy framework boilerplate to src/. Defaults to true. Set false if you already have project structure.',
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
  includeBoilerplate: z.boolean().optional().default(true),
});

/**
 * Selection from the retrieval agent's select_files_for_context tool call.
 */
interface FileSelection {
  slug: string;
  reason: string;
}

/**
 * Framework selection from the retrieval agent's select_framework tool call.
 */
interface FrameworkSelection {
  framework: string;
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

/**
 * Extract framework selection from agent tool results.
 */
function extractFrameworkSelection(agentResult: AgentResult): FrameworkSelection | null {
  const frameworkResult = agentResult.toolResults.find(
    (r) => (r as Record<string, unknown>).tool === 'select_framework'
  );
  if (!frameworkResult) return null;
  const r = frameworkResult as Record<string, unknown>;
  return {
    framework: r.framework as string,
    reason: r.reason as string,
  };
}

// =============================================================================
// MARKDOWN RESPONSE BUILDERS
// =============================================================================

function buildContextReadyMarkdown(
  task: string,
  kbFiles: KBFileReference[],
  referencedFiles?: ReferencedFile[],
  frameworkResult?: FrameworkCopyResult
): string {
  const parts: string[] = [];

  parts.push('# Context Ready\n');
  parts.push(`**Task:** ${task}\n`);

  // Framework section (if scaffolded)
  if (frameworkResult && frameworkResult.copiedFiles.length > 0) {
    parts.push(`## Framework Scaffolded: ${frameworkResult.displayName}\n`);
    parts.push('**Files copied:**');
    for (const file of frameworkResult.copiedFiles) {
      parts.push(`- ${file}`);
    }
    if (frameworkResult.skippedFiles.length > 0) {
      parts.push('\n**Files skipped (already exist):**');
      for (const file of frameworkResult.skippedFiles) {
        parts.push(`- ${file}`);
      }
    }
    parts.push('');
  } else if (frameworkResult && frameworkResult.skippedFiles.length > 0) {
    parts.push(`## Framework: ${frameworkResult.displayName}\n`);
    parts.push('All framework files already exist in your project. No files copied.\n');
  }

  // KB files (referenced by path, not copied)
  if (kbFiles.length > 0) {
    parts.push('## Knowledge Base Files\n');
    parts.push('| Topic | KB Path | Why Relevant |');
    parts.push('|-------|---------|--------------|');

    for (const file of kbFiles) {
      const title = file.title || file.slug;
      parts.push(`| ${title} | ${file.kbPath} | ${file.reason} |`);
    }
    parts.push('');
  }

  // Local project files (referenced, not copied)
  if (referencedFiles && referencedFiles.length > 0) {
    parts.push('## Local Project Files\n');
    parts.push('These files are in your project:\n');
    parts.push('| Topic | Location | Why Relevant |');
    parts.push('|-------|----------|--------------|');

    for (const ref of referencedFiles) {
      parts.push(`| ${ref.slug} | ${ref.localPath} | ${ref.reason} |`);
    }
    parts.push('');
  }

  // Start Here section
  parts.push('## Start Here\n');
  let stepNum = 1;

  // If framework was scaffolded, mention it first
  if (frameworkResult && frameworkResult.copiedFiles.length > 0) {
    parts.push(`${stepNum}. **Explore scaffolded code** — Check src/ for framework structure`);
    stepNum++;
  }

  parts.push(`${stepNum}. **Read README.md** — Full navigation`);
  stepNum++;

  // Include top KB files
  const topKBFiles = kbFiles.slice(0, 2);
  for (const file of topKBFiles) {
    const title = file.title || file.slug;
    parts.push(`${stepNum}. **Review ${file.kbPath}** — ${title}`);
    stepNum++;
  }

  // Include referenced files in start here too (if room)
  if (referencedFiles && referencedFiles.length > 0 && stepNum <= 4) {
    const remaining = Math.min(4 - stepNum + 1, referencedFiles.length);
    for (let i = 0; i < remaining; i++) {
      const ref = referencedFiles[i];
      parts.push(`${stepNum}. **Review ${ref.localPath}** — ${ref.slug}`);
      stepNum++;
    }
  }

  parts.push('\n<hints>');
  parts.push('- context-guide.md contains file references');
  parts.push('- KB files are referenced by their knowledge base paths');
  if (referencedFiles && referencedFiles.length > 0) {
    parts.push('- Some entries reference local project files');
  }
  if (frameworkResult?.copiedFiles.length) {
    parts.push('- Framework boilerplate is in src/ — start from there');
  }
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
 * 5. Write file to project directory
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

  const { task, files, includeBoilerplate } = parseResult.data;

  try {
    // Check if KB is empty
    const allEntries = await storage.list({ status: 'active' });

    if (allEntries.length === 0) {
      return markdownResponse(buildEmptyKBMarkdown());
    }

    // Generate project file tree for the retrieval agent
    const fileTree = await generateFileTree({ maxDepth: 4, maxEntries: 200 });

    // Run retrieval agent
    const userMessage = buildRetrievalUserMessage(task, files, fileTree);
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

    // Extract file selections and framework selection
    const selections = extractSelections(agentResult);
    const frameworkSelection = extractFrameworkSelection(agentResult);

    if (selections.length === 0 && !frameworkSelection) {
      return markdownResponse(buildNoRelevantFilesMarkdown(task, allEntries.length));
    }

    // Write to project directory
    const contextDir = process.cwd();
    await clearContextDir(contextDir);

    // Build KB file references and local project file references
    const kbFiles: KBFileReference[] = [];
    const referencedFiles: ReferencedFile[] = [];

    for (const sel of selections) {
      const entry = await storage.get(sel.slug);
      if (entry) {
        // Check if this entry has a local source file in the project
        const hasLocal = await hasLocalSource(entry);
        if (hasLocal) {
          const localPath = getLocalSourcePath(entry);
          referencedFiles.push({
            slug: sel.slug,
            reason: sel.reason,
            localPath,
          });
        } else {
          // Reference by KB path
          kbFiles.push({
            slug: sel.slug,
            reason: sel.reason,
            kbPath: getKBPath(sel.slug),
            title: entry.title,
          });
        }
      }
    }

    // Copy framework boilerplate if includeBoilerplate is true
    // Default to langgraph if agent didn't select a specific framework
    let frameworkResult: FrameworkCopyResult | undefined;
    if (includeBoilerplate) {
      try {
        const framework = frameworkSelection?.framework ?? 'langgraph';
        frameworkResult = await copyFrameworkBoilerplate(framework);

        // Auto-surface the framework's KB doc
        const kbDocSlug = frameworkResult?.kbDocSlug ?? `framework-${framework}`;
        const alreadyInKB = kbFiles.some((f) => f.slug === kbDocSlug);
        const alreadyReferenced = referencedFiles.some((ref) => ref.slug === kbDocSlug);

        if (!alreadyInKB && !alreadyReferenced) {
          const kbEntry = await storage.get(kbDocSlug);
          if (kbEntry) {
            const displayName = frameworkResult?.displayName ?? framework;
            // Add to kbFiles for README and response
            kbFiles.push({
              slug: kbDocSlug,
              reason: `Framework best practices for ${displayName}`,
              kbPath: getKBPath(kbDocSlug),
              title: kbEntry.title,
            });
          }
        }
      } catch (error) {
        // Log but don't fail the whole operation
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Framework copy failed: ${errorMsg}`);
      }
    }

    // Write context-guide.md with KB file references, local file references, and framework result
    await writeContextReadme(
      contextDir,
      task,
      kbFiles,
      referencedFiles.length > 0 ? referencedFiles : undefined,
      frameworkResult
    );

    return markdownResponse(
      buildContextReadyMarkdown(
        task,
        kbFiles,
        referencedFiles.length > 0 ? referencedFiles : undefined,
        frameworkResult
      )
    );
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
