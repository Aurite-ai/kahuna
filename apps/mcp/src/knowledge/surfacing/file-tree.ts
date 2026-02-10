/**
 * File tree utility for generating project directory structure.
 *
 * Used to give the retrieval agent visibility into the project's file structure,
 * helping it make better decisions about what context is relevant.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Directories to exclude from the file tree (common noise directories).
 */
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '__pycache__',
  '.venv',
  'venv',
  '.env',
  '.tox',
  '.pytest_cache',
  '.mypy_cache',
  '.ruff_cache',
  '.cache',
  'coverage',
  '.nyc_output',
  '.next',
  '.nuxt',
  '.output',
  '.turbo',
  '.vercel',
  '.netlify',
  'target', // Rust
  'vendor', // Go, PHP
  'Pods', // iOS
  '.gradle', // Java/Android
  '.idea',
  '.vscode',
  '.DS_Store',
]);

/**
 * File extensions to exclude (binary/generated files).
 */
const EXCLUDED_EXTENSIONS = new Set([
  '.pyc',
  '.pyo',
  '.so',
  '.dylib',
  '.dll',
  '.exe',
  '.o',
  '.a',
  '.class',
  '.jar',
  '.war',
  '.lock',
  '.log',
  '.map',
]);

/**
 * Options for generating a file tree.
 */
export interface FileTreeOptions {
  /** Maximum depth to traverse (default: 4) */
  maxDepth?: number;
  /** Maximum total entries to include (default: 200) */
  maxEntries?: number;
  /** Root directory to scan (default: process.cwd()) */
  rootDir?: string;
}

interface TreeEntry {
  name: string;
  isDirectory: boolean;
  children?: TreeEntry[];
}

/**
 * Check if a path should be excluded from the tree.
 */
function shouldExclude(name: string): boolean {
  // Exclude hidden files/dirs (except specific ones we might want)
  if (name.startsWith('.') && name !== '.env.example') {
    return true;
  }

  // Exclude known noise directories
  if (EXCLUDED_DIRS.has(name)) {
    return true;
  }

  // Exclude known binary/generated extensions
  const ext = path.extname(name).toLowerCase();
  if (EXCLUDED_EXTENSIONS.has(ext)) {
    return true;
  }

  return false;
}

/**
 * Recursively scan a directory and build a tree structure.
 */
async function scanDirectory(
  dirPath: string,
  currentDepth: number,
  maxDepth: number,
  entryCount: { count: number },
  maxEntries: number
): Promise<TreeEntry[]> {
  if (currentDepth > maxDepth || entryCount.count >= maxEntries) {
    return [];
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const result: TreeEntry[] = [];

    // Sort: directories first, then alphabetically
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      if (entryCount.count >= maxEntries) {
        break;
      }

      if (shouldExclude(entry.name)) {
        continue;
      }

      entryCount.count++;

      if (entry.isDirectory()) {
        const children = await scanDirectory(
          path.join(dirPath, entry.name),
          currentDepth + 1,
          maxDepth,
          entryCount,
          maxEntries
        );
        result.push({
          name: entry.name,
          isDirectory: true,
          children: children.length > 0 ? children : undefined,
        });
      } else {
        result.push({
          name: entry.name,
          isDirectory: false,
        });
      }
    }

    return result;
  } catch {
    // Directory not readable, return empty
    return [];
  }
}

/**
 * Format tree entries as an ASCII tree string.
 */
function formatTree(entries: TreeEntry[], prefix = ''): string {
  const lines: string[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    const displayName = entry.isDirectory ? `${entry.name}/` : entry.name;
    lines.push(`${prefix}${connector}${displayName}`);

    if (entry.children && entry.children.length > 0) {
      lines.push(formatTree(entry.children, prefix + childPrefix));
    }
  }

  return lines.join('\n');
}

/**
 * Generate a tree-like representation of the project directory.
 *
 * @param options - Configuration options
 * @returns ASCII tree string, or null if the directory doesn't exist/is empty
 */
export async function generateFileTree(options: FileTreeOptions = {}): Promise<string | null> {
  const { maxDepth = 4, maxEntries = 200, rootDir = process.cwd() } = options;

  try {
    // Check if directory exists
    const stats = await fs.stat(rootDir);
    if (!stats.isDirectory()) {
      return null;
    }

    const entryCount = { count: 0 };
    const entries = await scanDirectory(rootDir, 0, maxDepth, entryCount, maxEntries);

    if (entries.length === 0) {
      return null;
    }

    const rootName = path.basename(rootDir);
    const treeContent = formatTree(entries);

    let result = `${rootName}/\n${treeContent}`;

    // Add truncation notice if we hit the limit
    if (entryCount.count >= maxEntries) {
      result += `\n... (truncated at ${maxEntries} entries)`;
    }

    return result;
  } catch {
    return null;
  }
}
