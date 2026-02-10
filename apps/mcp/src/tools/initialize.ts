/**
 * Initialize Tool - Copy copilot configuration to user's working directory
 *
 * This tool copies the Claude Code copilot configuration from the VCK templates
 * to the directory where the user is running Claude Code. This sets up the
 * project with the proper rules, skills, and settings for agent development.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type MCPToolResponse, markdownResponse } from './response-utils.js';
import type { ToolContext } from './types.js';

/**
 * Tool definition for MCP registration.
 */
export const initializeToolDefinition = {
  name: 'kahuna_initialize',
  description: `Initialize a new project with Kahuna copilot configuration.

This tool copies the Claude Code copilot configuration from Kahuna's VCK templates
to the specified directory. It sets up:
- .claude/settings.json - Permissions and default mode
- .claude/rules/ - Project rules and guidelines
- .claude/skills/ - Skills
- .claude/agents/ - Subagents
- .claude/context/, .claude/plans/ - Empty directories for context and plan files
- .claude/CLAUDE.md - Main copilot instructions

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
 * Get the absolute path to the VCK templates directory.
 */
function getTemplatesPath(): string {
  // Get the directory of this file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Navigate from apps/mcp/src/tools/ to packages/vck-templates/templates/copilot-configs/claude-code/
  const templatesPath = path.resolve(
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

  return templatesPath;
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

    // Build markdown response
    const copiedRelative = copiedFiles.map((f) => path.relative(absoluteTargetPath, f));
    const skippedRelative = skippedFiles.map((f) => path.relative(absoluteTargetPath, f));

    let markdown = `# Initialized

Kahuna copilot configuration copied to: \`${absoluteTargetPath}\`

**Files copied:** ${copiedFiles.length}`;

    if (skippedFiles.length > 0) {
      markdown += `\n**Files skipped (already exist):** ${skippedFiles.length}`;
      markdown += `\n\nSkipped files:\n${skippedRelative.map((f) => `- ${f}`).join('\n')}`;
    }

    if (copiedFiles.length > 0) {
      markdown += `\n\nCopied files:\n${copiedRelative.map((f) => `- ${f}`).join('\n')}`;
    }

    markdown += `\n\n<hints>
- Stop the current Claude Code instance with Ctrl+C and restart to pick up new config
${skippedFiles.length > 0 ? `- To overwrite existing files: kahuna_initialize(targetPath="${targetPath}", overwrite=true)\n` : ''}</hints>`;

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
