/**
 * Shared test utilities for MCP tool tests
 *
 * Common mock factories used across all tool test files.
 */

import { vi } from 'vitest';
import type { KnowledgeEntry, KnowledgeStorageService } from '../../storage/index.js';
import type { ToolContext } from '../types.js';

/**
 * Create a mock storage service for testing.
 */
export function createMockStorage(
  overrides?: Partial<KnowledgeStorageService>
): KnowledgeStorageService {
  return {
    save: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
    exists: vi.fn(),
    delete: vi.fn(),
    healthCheck: vi.fn(),
    ...overrides,
  };
}

/**
 * Create a mock KnowledgeEntry for testing.
 */
export function createMockEntry(overrides?: Partial<KnowledgeEntry>): KnowledgeEntry {
  const now = new Date().toISOString();
  return {
    slug: 'test-entry',
    type: 'knowledge',
    title: 'Test Entry',
    summary: 'A test entry for the knowledge base',
    created_at: now,
    updated_at: now,
    source: {
      file: 'test.md',
      project: 'test-project',
      path: null,
    },
    classification: {
      category: 'reference',
      confidence: 0.9,
      reasoning: 'Test reasoning',
      tags: ['test', 'example'],
      topics: ['testing'],
      entities: {
        technologies: ['TypeScript'],
        frameworks: [],
        libraries: [],
        apis: [],
      },
    },
    status: 'active',
    content: '# Test Content\n\nThis is test content about testing.',
    ...overrides,
  };
}

/**
 * Create a mock ToolContext for testing.
 */
export function createMockContext(
  storageOverrides?: Partial<KnowledgeStorageService>
): ToolContext {
  return {
    storage: createMockStorage(storageOverrides),
  };
}
