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
import { type MCPToolResponse, errorResponse, successResponse } from './response-utils.js';
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

Parameters:
- targetPath: (required) Directory to initialize.
- overwrite: (optional) Whether to overwrite existing files. Defaults to false.

Examples:
- Initialize: { "targetPath": "/path/to/project" }
- Overwrite existing: { "targetPath": "/path/to/project", "overwrite": true }`,

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
      return errorResponse(`Target directory does not exist: ${absoluteTargetPath}`, {
        hint: 'Create the directory first or provide a valid path',
      });
    }

    // Verify target is a directory
    const targetStat = await fs.stat(absoluteTargetPath);
    if (!targetStat.isDirectory()) {
      return errorResponse(`Target path is not a directory: ${absoluteTargetPath}`);
    }

    // Get source template path
    const sourcePath = getTemplatesPath();

    // Verify source exists
    if (!(await pathExists(sourcePath))) {
      return errorResponse('VCK templates not found', {
        expectedPath: sourcePath,
        hint: 'Make sure you are running this from the Kahuna monorepo',
      });
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

    // Build response message
    const message = [
      `Initialized Kahuna copilot configuration in: ${absoluteTargetPath}`,
      '',
      `Files copied: ${copiedFiles.length}`,
    ];

    if (skippedFiles.length > 0) {
      message.push(
        `Files skipped (already exist): ${skippedFiles.length}`,
        '',
        `To overwrite existing files, use: { "targetPath": "${targetPath}", "overwrite": true }`
      );
    }

    message.push(
      'Next steps: Advise the user to stop the current Claude Code instance with Ctrl+C and restart it in order to refresh the conversation to use the new files'
    );

    return successResponse({
      message: message.join('\n'),
      targetPath: absoluteTargetPath,
      copiedFiles: copiedFiles.map((f) => path.relative(absoluteTargetPath, f)),
      skippedFiles: skippedFiles.map((f) => path.relative(absoluteTargetPath, f)),
      stats: {
        copied: copiedFiles.length,
        skipped: skippedFiles.length,
        total: copiedFiles.length + skippedFiles.length,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return errorResponse(`Failed to initialize: ${errorMessage}`, {
      targetPath,
      overwrite,
    });
  }
}

/**
 * Export the tool definition and handler together.
 */
export const initializeTool = {
  definition: initializeToolDefinition,
  handler: initializeToolHandler,
};
