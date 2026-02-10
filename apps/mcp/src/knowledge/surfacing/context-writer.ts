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
import { stripFrontmatter } from '../storage/utils.js';

/**
 * Selection entry from the retrieval agent.
 */
export interface ContextSelection {
  slug: string;
  reason: string;
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
 */
export async function writeContextReadme(
  contextDir: string,
  task: string,
  selections: ContextSelection[]
): Promise<void> {
  const date = new Date().toISOString().split('T')[0];

  // Build file table
  const tableRows = selections
    .map((s) => `| [${s.slug}.md](./${s.slug}.md) | ${s.reason} |`)
    .join('\n');

  // Build "Start Here" section from first 2-3 selections
  const startHere = selections
    .slice(0, 3)
    .map((s, i) => `${i + 1}. Review ${s.slug}.md — ${s.reason}`)
    .join('\n');

  const readme = `# Context for: ${task}

Surfaced from Kahuna knowledge base on ${date}.

| File | Why Relevant |
|------|--------------|
${tableRows}

## Start Here

${startHere}

---

*Prepared by Kahuna | Use \`kahuna_ask\` for additional questions*
`;

  await fs.writeFile(path.join(contextDir, 'README.md'), readme, 'utf-8');
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
