/**
 * Initialize Tool - Copy copilot configuration and seed knowledge base
 *
 * This tool copies the Claude Code copilot configuration from the VCK templates
 * to the directory where the user is running Claude Code, and seeds the knowledge
 * base with starter content from the VCK templates.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkOnboardingStatus } from './onboarding-check.js';
import { type MCPToolResponse, type ToolContext, markdownResponse } from './types.js';

/**
 * Tool definition for MCP registration.
 */
export const initializeToolDefinition = {
  name: 'kahuna_initialize',
  description: `Initialize a new project with Kahuna copilot configuration and seed the knowledge base.

This tool copies the Claude Code copilot configuration from Kahuna's VCK templates
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
 * Get the absolute path to the VCK copilot config templates directory.
 */
function getTemplatesPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Navigate from apps/mcp/src/tools/ to packages/vck-templates/templates/copilot-configs/claude-code/
  return path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'vck-templates',
    'templates',
    'copilot-configs',
    'claude-code'
  );
}

/**
 * Get the absolute path to the KB seed templates directory.
 */
function getSeedTemplatesPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Navigate from apps/mcp/src/tools/ to packages/vck-templates/templates/knowledge-base/
  return path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'vck-templates',
    'templates',
    'knowledge-base'
  );
}

/**
 * Get the knowledge base directory path.
 * Uses KAHUNA_KNOWLEDGE_DIR env var if set, otherwise defaults to ~/.kahuna/knowledge/
 */
function getKnowledgeBaseDir(): string {
  return process.env.KAHUNA_KNOWLEDGE_DIR || path.join(os.homedir(), '.kahuna', 'knowledge');
}

/**
 * Recursively copy a directory.
 */
async function copyDirectoryRecursive(
  source: string,
  target: string,
  overwrite: boolean,
  copiedFiles: string[],
  skippedFiles: string[]
): Promise<void> {
  // Create target directory if it doesn't exist
  if (!(await pathExists(target))) {
    await fs.mkdir(target, { recursive: true });
  }

  // Read all items in source directory
  const items = await fs.readdir(source);

  for (const item of items) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);
    const stat = await fs.stat(sourcePath);

    if (stat.isDirectory()) {
      // Recursively copy subdirectories
      await copyDirectoryRecursive(sourcePath, targetPath, overwrite, copiedFiles, skippedFiles);
    } else {
      // Copy file
      if ((await pathExists(targetPath)) && !overwrite) {
        skippedFiles.push(targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
        copiedFiles.push(targetPath);
      }
    }
  }
}

/**
 * Seed the knowledge base with .mdc files from the seed templates directory.
 *
 * Scans the seed templates directory for .mdc files and copies them to the
 * KB directory. Skips files that already exist unless overwrite is true.
 *
 * @returns Object with arrays of seeded and skipped file names
 */
async function seedKnowledgeBase(
  overwrite: boolean
): Promise<{ seeded: string[]; skipped: string[]; kbDir: string }> {
  const seeded: string[] = [];
  const skipped: string[] = [];

  const kbDir = getKnowledgeBaseDir();
  const seedDir = getSeedTemplatesPath();

  // If seed templates directory doesn't exist, return empty results
  if (!(await pathExists(seedDir))) {
    return { seeded, skipped, kbDir };
  }

  // Create KB directory if it doesn't exist
  if (!(await pathExists(kbDir))) {
    await fs.mkdir(kbDir, { recursive: true });
  }

  // Read seed directory for .mdc files (flat scan, no recursion)
  const items = await fs.readdir(seedDir);
  const mdcFiles = items.filter((item) => item.endsWith('.mdc'));

  for (const file of mdcFiles) {
    const sourcePath = path.join(seedDir, file);
    const targetPath = path.join(kbDir, file);

    if ((await pathExists(targetPath)) && !overwrite) {
      skipped.push(file);
    } else {
      await fs.copyFile(sourcePath, targetPath);
      seeded.push(file);
    }
  }

  return { seeded, skipped, kbDir };
}

/**
 * Handle the kahuna_initialize tool call.
 */
export async function initializeToolHandler(
  args: Record<string, unknown>,
  ctx: ToolContext
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

    // Get source template path
    const sourcePath = getTemplatesPath();

    // Verify source exists
    if (!(await pathExists(sourcePath))) {
      return markdownResponse(
        `VCK templates not found at: ${sourcePath}\n\n<hints>\n- Make sure you are running this from the Kahuna monorepo\n</hints>`,
        true
      );
    }

    // Track copied and skipped files
    const copiedFiles: string[] = [];
    const skippedFiles: string[] = [];

    // Copy .claude directory
    const claudeSourcePath = path.join(sourcePath, '.claude');
    const claudeTargetPath = path.join(absoluteTargetPath, '.claude');

    if (await pathExists(claudeSourcePath)) {
      await copyDirectoryRecursive(
        claudeSourcePath,
        claudeTargetPath,
        overwrite,
        copiedFiles,
        skippedFiles
      );
    }

    // Copy CLAUDE.md
    const claudeMdSource = path.join(sourcePath, 'CLAUDE.md');
    const claudeMdTarget = path.join(absoluteTargetPath, 'CLAUDE.md');

    if (await pathExists(claudeMdSource)) {
      if ((await pathExists(claudeMdTarget)) && !overwrite) {
        skippedFiles.push(claudeMdTarget);
      } else {
        await fs.copyFile(claudeMdSource, claudeMdTarget);
        copiedFiles.push(claudeMdTarget);
      }
    }

    // Seed knowledge base
    const seedResult = await seedKnowledgeBase(overwrite);

    // Check onboarding status to tailor next steps
    const onboardingStatus = await checkOnboardingStatus(ctx.storage);

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

    // Next Steps section - tailored based on onboarding status
    markdown += '\n\n## Next Steps\n\n';

    if (!onboardingStatus.hasOrgContext) {
      // No org context - start there
      markdown += `Let's start by capturing your organization context. Say **"set up org context"** to begin.`;
    } else if (!onboardingStatus.hasProjectContext) {
      // Org exists but no project context
      markdown += `I found your organization context. Now let's set up this project.\nSay **"set up project context"** to describe what you're building.`;
    } else {
      // Both contexts exist - ready to go!
      markdown +=
        'Context is ready! Use **kahuna_prepare_context** with your task description to get started.';
    }

    markdown += `\n\n<hints>
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
