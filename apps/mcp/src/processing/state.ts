/**
 * State Management for Conversation Sync
 *
 * Tracks which conversations have been processed and their hashes
 * to enable incremental syncing.
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import type { ConversationState, SyncState } from "./types.js";

const STATE_FILENAME = ".sync-state.json";
const STATE_VERSION = 1;

/**
 * Load sync state from the knowledge directory.
 * Creates a new state object if the file doesn't exist.
 */
export function loadSyncState(knowledgeDir: string): SyncState {
  const statePath = path.join(knowledgeDir, STATE_FILENAME);

  if (!fs.existsSync(statePath)) {
    return createEmptyState();
  }

  try {
    const content = fs.readFileSync(statePath, "utf-8");
    const state = JSON.parse(content) as SyncState;

    // Validate version - if different, return empty state (force reprocess)
    if (state.version !== STATE_VERSION) {
      console.warn(
        `State file version mismatch (found ${state.version}, expected ${STATE_VERSION}). Will reprocess all.`
      );
      return createEmptyState();
    }

    return state;
  } catch (error) {
    console.warn(
      `Failed to load sync state: ${error instanceof Error ? error.message : error}. Will reprocess all.`
    );
    return createEmptyState();
  }
}

/**
 * Save sync state to the knowledge directory.
 */
export function saveSyncState(knowledgeDir: string, state: SyncState): void {
  const statePath = path.join(knowledgeDir, STATE_FILENAME);

  // Ensure directory exists
  if (!fs.existsSync(knowledgeDir)) {
    fs.mkdirSync(knowledgeDir, { recursive: true });
  }

  // Update lastSync timestamp
  state.lastSync = new Date().toISOString();

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
}

/**
 * Compute MD5 hash of a file for change detection.
 */
export function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(content).digest("hex");
}

/**
 * Create an empty sync state object.
 */
function createEmptyState(): SyncState {
  return {
    version: STATE_VERSION,
    lastSync: new Date().toISOString(),
    conversations: {},
  };
}

/**
 * Get conversation state for a specific session ID.
 */
export function getConversationState(
  state: SyncState,
  sessionId: string
): ConversationState | undefined {
  return state.conversations[sessionId];
}

/**
 * Update conversation state after processing.
 */
export function updateConversationState(
  state: SyncState,
  sessionId: string,
  convState: ConversationState
): void {
  state.conversations[sessionId] = convState;
}

/**
 * Check if a conversation needs processing based on hash comparison.
 * Returns true if:
 * - Conversation is not in state (new)
 * - Hash doesn't match (changed)
 */
export function needsProcessing(
  state: SyncState,
  sessionId: string,
  currentHash: string
): boolean {
  const existing = state.conversations[sessionId];
  if (!existing) {
    return true; // New conversation
  }
  return existing.sourceHash !== currentHash; // Changed
}
