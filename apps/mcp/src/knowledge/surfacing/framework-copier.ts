/**
 * Framework Boilerplate Copier
 *
 * Copies framework template files to the project's src/ directory.
 * Used by prepare_context when the agent selects a framework.
 *
 * See: docs/internal/plans/02-10_framework-selection.md
 */

import * as fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { FRAMEWORKS } from '../../config.js';

/**
 * Result of a boilerplate copy operation.
 */
export interface FrameworkCopyResult {
  /** Framework ID that was copied */
  framework: string;
  /** Framework display name */
  displayName: string;
  /** Files that were successfully copied */
  copiedFiles: string[];
  /** Files that were skipped (already exist) */
  skippedFiles: string[];
  /** Whether any files were copied */
  success: boolean;
}

/**
 * Error thrown when framework operations fail.
 */
export class FrameworkError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_FRAMEWORK' | 'TEMPLATE_NOT_FOUND' | 'COPY_FAILED'
  ) {
    super(message);
    this.name = 'FrameworkError';
  }
}

/**
 * Resolve the path to a framework's template directory.
 * Uses package resolution to locate @kahuna/vck-templates.
 *
 * @param frameworkId - Framework identifier (e.g., 'langgraph')
 * @returns Absolute path to the framework's template directory
 * @throws FrameworkError if framework is invalid or template not found
 */
export function resolveFrameworkTemplateDir(frameworkId: string): string {
  // Validate framework ID
  if (!FRAMEWORKS[frameworkId]) {
    throw new FrameworkError(
      `Unknown framework: ${frameworkId}. Valid frameworks: ${Object.keys(FRAMEWORKS).join(', ')}`,
      'INVALID_FRAMEWORK'
    );
  }

  // Locate vck-templates package
  const require = createRequire(import.meta.url);
  const vckPackagePath = require.resolve('@kahuna/vck-templates/package.json');
  const vckDir = path.dirname(vckPackagePath);

  return path.join(vckDir, 'templates', 'frameworks', frameworkId);
}

/**
 * Recursively get all files in a directory.
 *
 * @param dir - Directory to scan
 * @param baseDir - Base directory for relative paths
 * @returns Array of relative file paths
 */
async function getAllFiles(dir: string, baseDir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Copy framework boilerplate to the project directory.
 * Skips files that already exist (no overwriting).
 *
 * @param frameworkId - Framework identifier (e.g., 'langgraph')
 * @param projectDir - Project root directory (defaults to cwd)
 * @returns Copy result with lists of copied and skipped files
 * @throws FrameworkError if framework is invalid or template not found
 */
export async function copyFrameworkBoilerplate(
  frameworkId: string,
  projectDir: string = process.cwd()
): Promise<FrameworkCopyResult> {
  const frameworkConfig = FRAMEWORKS[frameworkId];
  if (!frameworkConfig) {
    throw new FrameworkError(
      `Unknown framework: ${frameworkId}. Valid frameworks: ${Object.keys(FRAMEWORKS).join(', ')}`,
      'INVALID_FRAMEWORK'
    );
  }

  const templateDir = resolveFrameworkTemplateDir(frameworkId);

  // Check if template directory exists
  try {
    await fs.access(templateDir);
  } catch {
    throw new FrameworkError(
      `Framework template directory not found: ${templateDir}`,
      'TEMPLATE_NOT_FOUND'
    );
  }

  // Get all template files
  const templateFiles = await getAllFiles(templateDir, templateDir);

  const copiedFiles: string[] = [];
  const skippedFiles: string[] = [];

  for (const relPath of templateFiles) {
    const srcPath = path.join(templateDir, relPath);
    const destPath = path.join(projectDir, relPath);

    // Check if destination exists
    try {
      await fs.access(destPath);
      // File exists, skip it
      skippedFiles.push(relPath);
    } catch {
      // File doesn't exist, copy it
      try {
        // Ensure destination directory exists
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(srcPath, destPath);
        copiedFiles.push(relPath);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        throw new FrameworkError(`Failed to copy ${relPath}: ${errorMsg}`, 'COPY_FAILED');
      }
    }
  }

  return {
    framework: frameworkId,
    displayName: frameworkConfig.displayName,
    copiedFiles,
    skippedFiles,
    success: copiedFiles.length > 0 || skippedFiles.length > 0,
  };
}
