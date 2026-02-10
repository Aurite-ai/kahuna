/**
 * Context Writer — manages the project's context/ folder
 *
 * Writes knowledge base files as clean markdown (frontmatter stripped)
 * to the project's context/ directory for direct copilot access.
 *
 * See: docs/internal/designs/context-management-system.md
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { KnowledgeEntry } from '../storage/types.js';
import { stripFrontmatter } from '../storage/utils.js';
import type { FrameworkCopyResult } from './framework-copier.js';

/**
 * Selection entry from the retrieval agent.
 */
export interface ContextSelection {
  slug: string;
  reason: string;
}

/**
 * A KB entry that should be referenced locally (not copied to context/).
 */
export interface ReferencedFile {
  slug: string;
  reason: string;
  localPath: string;
}

/**
 * Clear all files from the context/ directory.
 * Creates the directory if it doesn't exist.
 *
 * @param contextDir - Path to the context directory
 */
export async function clearContextDir(contextDir: string): Promise<void> {
  // Ensure directory exists
  await fs.mkdir(contextDir, { recursive: true });

  // Remove all files in the directory
  const files = await fs.readdir(contextDir);
  await Promise.all(files.map((file) => fs.unlink(path.join(contextDir, file))));
}

/**
 * Write a knowledge base file to context/ as clean markdown.
 * Strips YAML frontmatter from .mdc content.
 *
 * @param contextDir - Path to the context directory
 * @param slug - File slug (used as filename without extension)
 * @param mdcContent - Raw .mdc file content (with frontmatter)
 */
export async function writeContextFile(
  contextDir: string,
  slug: string,
  mdcContent: string
): Promise<void> {
  const cleanContent = stripFrontmatter(mdcContent);
  const filepath = path.join(contextDir, `${slug}.md`);
  await fs.writeFile(filepath, cleanContent, 'utf-8');
}

/**
 * Generate and write a README.md index file for the context/ directory.
 *
 * @param contextDir - Path to the context directory
 * @param task - The task description that triggered context surfacing
 * @param selections - Files selected by the retrieval agent with reasons
 * @param referencedFiles - Optional: Local project files to reference instead of copy
 * @param frameworkResult - Optional: Framework boilerplate copy result
 */
export async function writeContextReadme(
  contextDir: string,
  task: string,
  selections: ContextSelection[],
  referencedFiles?: ReferencedFile[],
  frameworkResult?: FrameworkCopyResult
): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const parts: string[] = [];

  parts.push(`# Context for: ${task}`);
  parts.push('');
  parts.push(`Surfaced from Kahuna knowledge base on ${date}.`);
  parts.push('');

  // Framework section (if boilerplate was copied)
  if (frameworkResult && frameworkResult.copiedFiles.length > 0) {
    parts.push('## Framework');
    parts.push('');
    parts.push(`Framework: **${frameworkResult.displayName}**`);
    parts.push(
      'Boilerplate files added to your project. See [README.md](../README.md) for structure and usage.'
    );
    parts.push('');
  }

  // Build file table for copied files
  if (selections.length > 0) {
    const tableRows = selections
      .map((s) => `| [${s.slug}.md](./${s.slug}.md) | ${s.reason} |`)
      .join('\n');

    parts.push('| File | Why Relevant |');
    parts.push('|------|--------------|');
    parts.push(tableRows);
    parts.push('');
  }

  // Local project files section (referenced, not copied)
  if (referencedFiles && referencedFiles.length > 0) {
    parts.push('## Local Project Files');
    parts.push('');
    parts.push('These KB entries originated from files in your project. Read them directly:');
    parts.push('');
    parts.push('| Topic | Location |');
    parts.push('|-------|----------|');
    for (const ref of referencedFiles) {
      parts.push(`| ${ref.slug} | [${ref.localPath}](../${ref.localPath}) |`);
    }
    parts.push('');
  }

  // Build "Start Here" section
  // Combine selections and referenced files for start here
  const allItems = [
    ...selections.map((s) => ({ slug: s.slug, reason: s.reason, isLocal: false })),
    ...(referencedFiles || []).map((r) => ({
      slug: r.slug,
      reason: r.reason,
      isLocal: true,
      localPath: r.localPath,
    })),
  ];

  if (allItems.length > 0) {
    parts.push('## Start Here');
    parts.push('');

    const startHere = allItems.slice(0, 3).map((item, i) => {
      if ('localPath' in item && item.localPath) {
        return `${i + 1}. Review ${item.localPath} — ${item.reason}`;
      }
      return `${i + 1}. Review ${item.slug}.md — ${item.reason}`;
    });
    parts.push(startHere.join('\n'));
    parts.push('');
  }

  parts.push('---');
  parts.push('');
  parts.push('*Prepared by Kahuna | Use `kahuna_ask` for additional questions*');
  parts.push('');

  await fs.writeFile(path.join(contextDir, 'README.md'), parts.join('\n'), 'utf-8');
}

/**
 * Check if a KB entry should be referenced locally instead of copied.
 * Returns true if the entry originated from a file in the current project
 * and that file still exists.
 *
 * @param entry - The knowledge entry to check
 * @returns Promise<boolean> - True if entry should be referenced locally
 */
export async function shouldReferenceLocally(entry: KnowledgeEntry): Promise<boolean> {
  // Check if entry has source info and came from the current project
  if (!entry.source?.project || !entry.source?.file) {
    return false;
  }

  // Check if source project matches current working directory
  if (entry.source.project !== process.cwd()) {
    return false;
  }

  // Check if the source file still exists
  try {
    await fs.access(entry.source.file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the relative path from context/ to the source file.
 * Assumes contextDir is a direct child of process.cwd().
 *
 * @param sourceFile - Absolute or project-relative path to the source file
 * @returns Relative path suitable for markdown links from context/README.md
 */
export function getRelativeLocalPath(sourceFile: string): string {
  // If the path is already relative, just use it
  if (!path.isAbsolute(sourceFile)) {
    return sourceFile;
  }

  // Get path relative to cwd
  const relativeToCwd = path.relative(process.cwd(), sourceFile);
  return relativeToCwd;
}

/**
 * List .md filenames in the context/ directory.
 * Returns empty array if the directory doesn't exist.
 *
 * @param contextDir - Path to the context directory
 * @returns Array of .md filenames (e.g., ["api-guidelines.md", "README.md"])
 */
export async function listContextFiles(contextDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(contextDir);
    return files.filter((f) => f.endsWith('.md'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
