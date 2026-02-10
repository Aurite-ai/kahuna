/**
 * Framework Boilerplate Copier
 *
 * Copies framework template files to the project directory.
 * Also copies shared project files (project-env → .env, project-gitignore → .gitignore).
 * Used by prepare_context when the agent selects a framework.
 *
 * See: docs/internal/plans/02-10_framework-selection.md
 */

import * as fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { FRAMEWORKS } from '../../config.js';

/**
 * Mapping of template filenames to their destination names.
 * Used for files that need renaming (e.g., project-env → .env to avoid tooling conflicts).
 */
const FILE_RENAME_MAP: Record<string, string> = {
  'project-env': '.env',
  'project-gitignore': '.gitignore',
};

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
  /** KB doc slug to auto-surface (e.g., 'langgraph-best-practices') */
  kbDocSlug: string;
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
 * Resolve the path to the vck-templates directory.
 * Uses package resolution to locate @kahuna/vck-templates.
 *
 * @returns Absolute path to the vck-templates package root
 */
function resolveVckTemplatesDir(): string {
  const require = createRequire(import.meta.url);
  const vckPackagePath = require.resolve('@kahuna/vck-templates/package.json');
  return path.dirname(vckPackagePath);
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

  const vckDir = resolveVckTemplatesDir();
  return path.join(vckDir, 'templates', 'frameworks', frameworkId);
}

/**
 * Get the destination filename, applying renaming rules if needed.
 *
 * @param filename - Original template filename
 * @returns Destination filename (renamed if in FILE_RENAME_MAP)
 */
function getDestFilename(filename: string): string {
  return FILE_RENAME_MAP[filename] ?? filename;
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
 * Copy a single file from source to destination, with optional renaming.
 * Skips if destination already exists.
 *
 * @param srcPath - Source file path
 * @param destPath - Destination file path (after any renaming)
 * @param displayPath - Path to show in results (for user feedback)
 * @param copiedFiles - Array to push copied file paths to
 * @param skippedFiles - Array to push skipped file paths to
 * @throws FrameworkError if copy fails
 */
async function copyFileIfNotExists(
  srcPath: string,
  destPath: string,
  displayPath: string,
  copiedFiles: string[],
  skippedFiles: string[]
): Promise<void> {
  try {
    await fs.access(destPath);
    // File exists, skip it
    skippedFiles.push(displayPath);
  } catch {
    // File doesn't exist, copy it
    try {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(srcPath, destPath);
      copiedFiles.push(displayPath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      throw new FrameworkError(`Failed to copy ${displayPath}: ${errorMsg}`, 'COPY_FAILED');
    }
  }
}

/**
 * Copy framework boilerplate to the project directory.
 * Also copies shared project files (project-env → .env, project-gitignore → .gitignore).
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

  const copiedFiles: string[] = [];
  const skippedFiles: string[] = [];

  // 1. Copy shared project files (with renaming)
  const vckDir = resolveVckTemplatesDir();
  const sharedTemplatesDir = path.join(vckDir, 'templates');

  for (const [srcFilename, destFilename] of Object.entries(FILE_RENAME_MAP)) {
    const srcPath = path.join(sharedTemplatesDir, srcFilename);
    const destPath = path.join(projectDir, destFilename);

    // Check if source file exists before trying to copy
    try {
      await fs.access(srcPath);
      await copyFileIfNotExists(srcPath, destPath, destFilename, copiedFiles, skippedFiles);
    } catch {
      // Source file doesn't exist, skip silently (not all shared files may be present)
    }
  }

  // 2. Copy framework-specific files
  const templateFiles = await getAllFiles(templateDir, templateDir);

  for (const relPath of templateFiles) {
    const srcPath = path.join(templateDir, relPath);
    // Apply renaming for any files in the framework dir that need it
    const filename = path.basename(relPath);
    const destFilename = getDestFilename(filename);
    const destRelPath =
      destFilename !== filename ? path.join(path.dirname(relPath), destFilename) : relPath;
    const destPath = path.join(projectDir, destRelPath);

    await copyFileIfNotExists(srcPath, destPath, destRelPath, copiedFiles, skippedFiles);
  }

  return {
    framework: frameworkId,
    displayName: frameworkConfig.displayName,
    copiedFiles,
    skippedFiles,
    success: copiedFiles.length > 0 || skippedFiles.length > 0,
    kbDocSlug: frameworkConfig.kbDocSlug,
  };
}
