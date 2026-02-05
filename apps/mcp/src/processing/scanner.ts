/**
 * Project Scanner
 *
 * Discovers conversation files in the Claude Code projects directory.
 * Handles nested project directory structure.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { computeFileHash } from "./state.js";

/**
 * Information about a discovered conversation file.
 */
export interface ConversationFile {
  sessionId: string; // UUID from filename
  path: string; // Absolute path to JSONL file
  hash: string; // MD5 hash for change detection
}

/**
 * Extract session ID from a JSONL filename.
 * Expected format: {uuid}.jsonl
 */
function extractSessionId(filename: string): string | null {
  // Match UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.jsonl
  const match = filename.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.jsonl$/i);
  return match ? match[1] : null;
}

/**
 * Scan a single directory for JSONL files.
 */
function scanDirectory(dirPath: string): ConversationFile[] {
  const files: ConversationFile[] = [];

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath);

  for (const entry of entries) {
    if (!entry.endsWith(".jsonl")) {
      continue;
    }

    const sessionId = extractSessionId(entry);
    if (!sessionId) {
      // Skip files that don't match expected naming
      continue;
    }

    const filePath = path.join(dirPath, entry);
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
      continue;
    }

    files.push({
      sessionId,
      path: filePath,
      hash: computeFileHash(filePath),
    });
  }

  return files;
}

/**
 * Scan the Claude Code conversations directory for all JSONL files.
 *
 * Claude Code stores conversations in:
 *   ~/.claude/projects/{project-path}/*.jsonl
 *
 * Where {project-path} is the encoded path to the project directory
 * (e.g., -home-user-workspace-project).
 *
 * @param conversationsDir - Base directory containing project subdirectories
 * @returns Array of discovered conversation files with metadata
 */
export function scanConversationDirectory(conversationsDir: string): ConversationFile[] {
  const absoluteDir = path.resolve(conversationsDir);
  const allFiles: ConversationFile[] = [];

  if (!fs.existsSync(absoluteDir)) {
    console.warn(`Conversations directory not found: ${absoluteDir}`);
    return allFiles;
  }

  // Scan the base directory itself (in case there are files at root level)
  allFiles.push(...scanDirectory(absoluteDir));

  // Scan each subdirectory (project directories)
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const projectDir = path.join(absoluteDir, entry.name);
    const projectFiles = scanDirectory(projectDir);

    allFiles.push(...projectFiles);
  }

  return allFiles;
}

/**
 * Get the default Claude Code conversations directory.
 * Can be overridden via CLAUDE_CONVERSATIONS_DIR env var.
 */
export function getDefaultConversationsDir(): string {
  const envDir = process.env.CLAUDE_CONVERSATIONS_DIR;
  if (envDir) {
    return path.resolve(envDir);
  }

  // Default: ~/.claude/projects/
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(home, ".claude", "projects");
}
