/**
 * Initialize Tool - Copy copilot configuration and seed knowledge base
 *
 * This tool writes the Claude Code copilot configuration from the VCK templates
 * to the directory where the user is running Claude Code, and seeds the knowledge
 * base with starter content from the VCK templates.
 *
 * All templates are embedded as strings for bundler compatibility.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  getClaudeCodeFiles,
  getKnowledgeBaseFiles,
} from '@kahuna/vck-templates';
import { type MCPToolResponse, type ToolContext, markdownResponse } from './types.js';

/**
 * Tool definition for MCP registration.
 */
export const initializeToolDefinition = {
  name: 'kahuna_initialize',
  description: `Initialize a new project with Kahuna copilot configuration and seed the knowledge base.

This tool writes the Claude Code copilot configuration from Kahuna's VCK templates
to the specified directory and seeds the knowledge base with starter content. It sets up:
- .claude/settings.json - Permissions and default mode
- .claude/rules/ - Project rules and guidelines
- .claude/skills/ - Skills
- .claude/agents/ - Subagents
- .claude/plans/ - Empty directory for plan files
- .claude/CLAUDE.md - Main copilot instructions
- Knowledge base seed files (e.g., framework best practices)

The configuration includes the orchestrator workflow that guides Claude through
proper architect → code → test cycles for agent development.

<examples>
### Initialize a project
kahuna_initialize(targetPath="/path/to/project")

### Overwrite existing config
kahuna_initialize(targetPath="/path/to/project", overwrite=true)
</examples>

<hints>
- targetPath must be an existing directory
- Set overwrite=true to replace existing files
- Restart Claude Code after initialization to pick up new config
- Knowledge base seed files are only copied if they don't already exist (unless overwrite=true)
</hints>`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      targetPath: {
        type: 'string',
        description: 'Target directory to initialize',
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing files (defaults to false)',
      },
    },
    required: ['targetPath'],
  },
};

/**
 * Input type for the initialize tool.
 */
interface InitializeToolInput {
  targetPath: string;
  overwrite?: boolean;
}

/**
 * Check if a path exists (async replacement for fs.existsSync).
 */
async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the knowledge base directory path.
 * Uses KAHUNA_KNOWLEDGE_DIR env var if set, otherwise defaults to ~/.kahuna/knowledge/
 */
function getKnowledgeBaseDir(): string {
  return process.env.KAHUNA_KNOWLEDGE_DIR || path.join(os.homedir(), '.kahuna', 'knowledge');
}

/**
 * Write a file from embedded template content.
 * Creates parent directories if needed.
 */
async function writeTemplateFile(
  targetPath: string,
  content: string,
  overwrite: boolean,
  copiedFiles: string[],
  skippedFiles: string[]
): Promise<void> {
  if ((await pathExists(targetPath)) && !overwrite) {
    skippedFiles.push(targetPath);
  } else {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content, 'utf-8');
    copiedFiles.push(targetPath);
  }
}

/**
 * Seed the knowledge base with .mdc files from embedded templates.
 *
 * @returns Object with arrays of seeded and skipped file names
 */
async function seedKnowledgeBase(
  overwrite: boolean
): Promise<{ seeded: string[]; skipped: string[]; kbDir: string }> {
  const seeded: string[] = [];
  const skipped: string[] = [];

  const kbDir = getKnowledgeBaseDir();
  const kbFiles = getKnowledgeBaseFiles();

  // Create KB directory if it doesn't exist
  if (!(await pathExists(kbDir))) {
    await fs.mkdir(kbDir, { recursive: true });
  }

  for (const file of kbFiles) {
    const targetPath = path.join(kbDir, file.path);

    if ((await pathExists(targetPath)) && !overwrite) {
      skipped.push(file.path);
    } else {
      await fs.writeFile(targetPath, file.content, 'utf-8');
      seeded.push(file.path);
    }
  }

  return { seeded, skipped, kbDir };
}

/**
 * Handle the kahuna_initialize tool call.
 */
export async function initializeToolHandler(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<MCPToolResponse> {
  const input = args as unknown as InitializeToolInput;
  const targetPath = input.targetPath;
  const overwrite = input.overwrite ?? false;

  try {
    // Resolve target path to absolute
    const absoluteTargetPath = path.resolve(targetPath);

    // Verify target directory exists
    if (!(await pathExists(absoluteTargetPath))) {
      return markdownResponse(
        `Target directory does not exist: ${absoluteTargetPath}\n\n<hints>\n- Create the directory first or provide a valid path\n</hints>`,
        true
      );
    }

    // Verify target is a directory
    const targetStat = await fs.stat(absoluteTargetPath);
    if (!targetStat.isDirectory()) {
      return markdownResponse(`Target path is not a directory: ${absoluteTargetPath}`, true);
    }

    // Track copied and skipped files
    const copiedFiles: string[] = [];
    const skippedFiles: string[] = [];

    // Get embedded Claude Code templates
    const claudeCodeFiles = getClaudeCodeFiles();

    // Write all template files
    for (const file of claudeCodeFiles) {
      const filePath = path.join(absoluteTargetPath, file.path);
      await writeTemplateFile(filePath, file.content, overwrite, copiedFiles, skippedFiles);
    }

    // Create empty directories for context and plans
    const emptyDirs = [
      path.join(absoluteTargetPath, '.claude', 'context'),
      path.join(absoluteTargetPath, '.claude', 'plans'),
    ];
    for (const dir of emptyDirs) {
      if (!(await pathExists(dir))) {
        await fs.mkdir(dir, { recursive: true });
      }
    }

    // Seed knowledge base
    const seedResult = await seedKnowledgeBase(overwrite);

    // Build markdown response
    const copiedRelative = copiedFiles.map((f) => path.relative(absoluteTargetPath, f));
    const skippedRelative = skippedFiles.map((f) => path.relative(absoluteTargetPath, f));

    let markdown = `# Initialized

Kahuna copilot configuration copied to: \`${absoluteTargetPath}\`

## Copilot Configuration

**Files copied:** ${copiedFiles.length}`;

    if (skippedFiles.length > 0) {
      markdown += `\n**Files skipped (already exist):** ${skippedFiles.length}`;
      markdown += `\n\nSkipped files:\n${skippedRelative.map((f) => `- ${f}`).join('\n')}`;
    }

    if (copiedFiles.length > 0) {
      markdown += `\n\nCopied files:\n${copiedRelative.map((f) => `- ${f}`).join('\n')}`;
    }

    // Knowledge Base section
    markdown += `\n\n## Knowledge Base

**KB directory:** \`${seedResult.kbDir}\`
**Files seeded:** ${seedResult.seeded.length}`;

    if (seedResult.skipped.length > 0) {
      markdown += `\n**Files skipped (already exist):** ${seedResult.skipped.length}`;
      markdown += `\n\nSkipped seed files:\n${seedResult.skipped.map((f) => `- ${f}`).join('\n')}`;
    }

    if (seedResult.seeded.length > 0) {
      markdown += `\n\nSeeded files:\n${seedResult.seeded.map((f) => `- ${f}`).join('\n')}`;
    }

    // Next Steps section with onboarding hint
    markdown += `\n\n## Next Steps

To help me understand your project goals, say **"set up project context"** or just describe what you're building.`;

    markdown += `\n\n<hints>
- Setting up project context helps me make better recommendations
- Stop the current Claude Code instance with Ctrl+C and restart to pick up new config
${skippedFiles.length > 0 || seedResult.skipped.length > 0 ? `- To overwrite existing files: kahuna_initialize(targetPath="${targetPath}", overwrite=true)\n` : ''}</hints>`;

    return markdownResponse(markdown);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return markdownResponse(
      `Failed to initialize: ${errorMessage}\n\n<hints>\n- Check that the target path is accessible\n</hints>`,
      true
    );
  }
}

/**
 * Export the tool definition and handler together.
 */
export const initializeTool = {
  definition: initializeToolDefinition,
  handler: initializeToolHandler,
};
