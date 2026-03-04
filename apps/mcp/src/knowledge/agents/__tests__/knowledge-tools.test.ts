/**
 * Tests for knowledge agent tools
 *
 * Tests enriched list_knowledge_files format, read_knowledge_file,
 * select_files_for_context, and categorize_file tool execution.
 * Uses mock storage (no Anthropic calls).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeEntry, KnowledgeStorageService } from '../../storage/types.js';
import { executeKnowledgeTool } from '../knowledge-tools.js';

/**
 * Create a mock storage service with configurable entries.
 */
function createMockStorage(entries: KnowledgeEntry[] = []): KnowledgeStorageService {
  return {
    save: vi.fn(),
    list: vi.fn().mockResolvedValue(entries),
    get: vi.fn().mockImplementation(async (slug: string) => {
      return entries.find((e) => e.slug === slug) ?? null;
    }),
    exists: vi.fn(),
    delete: vi.fn(),
    healthCheck: vi.fn(),
  };
}

/**
 * Create a mock knowledge entry with simplified types.
 */
function createMockEntry(overrides: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return {
    type: 'knowledge',
    title: 'Test Entry',
    summary: 'A test entry for testing.',
    slug: 'test-entry',
    content: '# Test Content\n\nBody text.',
    created_at: '2026-02-10T00:00:00.000Z',
    updated_at: '2026-02-10T00:00:00.000Z',
    source: {
      file: 'test.md',
      project: '/test/project',
      path: '/test/project/test.md',
    },
    classification: {
      category: 'reference',
      confidence: 0.9,
      reasoning: 'Test reasoning',
      topics: ['Testing', 'Documentation'],
    },
    status: 'active',
    ...overrides,
  };
}

describe('executeKnowledgeTool', () => {
  describe('list_knowledge_files', () => {
    it('returns enriched listing with category, summary, and topics', async () => {
      const entries = [
        createMockEntry({
          slug: 'api-guidelines',
          title: 'API Guidelines',
          summary: 'REST API design standards.',
          classification: {
            category: 'policy',
            confidence: 0.92,
            reasoning: 'Contains rules',
            topics: ['API Design', 'REST'],
          },
        }),
        createMockEntry({
          slug: 'error-patterns',
          title: 'Error Handling Patterns',
          summary: 'Standard error patterns.',
          classification: {
            category: 'pattern',
            confidence: 0.85,
            reasoning: 'Contains patterns',
            topics: ['Error Handling', 'Circuit Breaker'],
          },
        }),
      ];
      const storage = createMockStorage(entries);

      const result = await executeKnowledgeTool('list_knowledge_files', {}, storage);

      expect(result).toContain('Knowledge base files (2 entries)');
      expect(result).toContain('api-guidelines [policy]');
      expect(result).toContain('"REST API design standards."');
      expect(result).toContain('Topics: API Design, REST');
      expect(result).toContain('error-patterns [pattern]');
      expect(result).toContain('"Standard error patterns."');
      expect(result).toContain('Topics: Error Handling, Circuit Breaker');
    });

    it('returns message for empty knowledge base', async () => {
      const storage = createMockStorage([]);

      const result = await executeKnowledgeTool('list_knowledge_files', {}, storage);

      expect(result).toBe('No files in knowledge base.');
    });

    it('filters by active status', async () => {
      const storage = createMockStorage();

      await executeKnowledgeTool('list_knowledge_files', {}, storage);

      // Now includes project hash as second parameter
      expect(storage.list).toHaveBeenCalledWith({ status: 'active' }, expect.any(Array));
    });

    it('handles entry with empty topics', async () => {
      const entries = [
        createMockEntry({
          slug: 'no-topics',
          title: 'No Topics Entry',
          summary: 'An entry without topics.',
          classification: {
            category: 'context',
            confidence: 0.5,
            reasoning: 'General',
            topics: [],
          },
        }),
      ];
      const storage = createMockStorage(entries);

      const result = await executeKnowledgeTool('list_knowledge_files', {}, storage);

      expect(result).toContain('no-topics [context]');
      expect(result).not.toContain('Topics:');
    });
  });

  describe('read_knowledge_file', () => {
    it('returns title + content for existing entry', async () => {
      const entries = [
        createMockEntry({
          slug: 'api-guidelines',
          title: 'API Guidelines',
          content: '# API Design\n\nGuidelines here.',
        }),
      ];
      const storage = createMockStorage(entries);

      const result = await executeKnowledgeTool(
        'read_knowledge_file',
        { slug: 'api-guidelines' },
        storage
      );

      expect(result).toBe('# API Guidelines\n\n# API Design\n\nGuidelines here.');
    });

    it('returns not found message for missing entry', async () => {
      const storage = createMockStorage([]);

      const result = await executeKnowledgeTool(
        'read_knowledge_file',
        { slug: 'nonexistent' },
        storage
      );

      expect(result).toBe('File not found: nonexistent');
    });

    it('returns error for empty slug', async () => {
      const storage = createMockStorage([]);

      const result = await executeKnowledgeTool('read_knowledge_file', { slug: '' }, storage);

      expect(result).toContain('Invalid input');
    });
  });

  describe('select_files_for_context', () => {
    it('parses and returns selections array', async () => {
      const storage = createMockStorage();

      const result = await executeKnowledgeTool(
        'select_files_for_context',
        {
          selections: [
            { slug: 'api-guidelines', reason: 'Contains rate limiting rules' },
            { slug: 'error-patterns', reason: 'Error handling for rate limits' },
          ],
        },
        storage
      );

      const parsed = JSON.parse(result);
      expect(parsed.selections).toHaveLength(2);
      expect(parsed.selections[0].slug).toBe('api-guidelines');
      expect(parsed.selections[0].reason).toBe('Contains rate limiting rules');
      expect(parsed.selections[1].slug).toBe('error-patterns');
    });

    it('handles empty selections', async () => {
      const storage = createMockStorage();

      const result = await executeKnowledgeTool(
        'select_files_for_context',
        { selections: [] },
        storage
      );

      const parsed = JSON.parse(result);
      expect(parsed.selections).toEqual([]);
    });

    it('returns error for invalid input', async () => {
      const storage = createMockStorage();

      const result = await executeKnowledgeTool(
        'select_files_for_context',
        { invalid: 'input' },
        storage
      );

      expect(result).toContain('Invalid input');
    });
  });

  describe('categorize_file', () => {
    it('parses and returns categorization result', async () => {
      const storage = createMockStorage();

      const result = await executeKnowledgeTool(
        'categorize_file',
        {
          category: 'policy',
          confidence: 0.92,
          reasoning: 'Contains organizational rules',
          title: 'API Design Guidelines',
          summary: 'REST API design standards and naming conventions.',
          topics: ['API Design', 'REST', 'Authentication'],
        },
        storage
      );

      const parsed = JSON.parse(result);
      expect(parsed.category).toBe('policy');
      expect(parsed.confidence).toBe(0.92);
      expect(parsed.reasoning).toBe('Contains organizational rules');
      expect(parsed.title).toBe('API Design Guidelines');
      expect(parsed.summary).toBe('REST API design standards and naming conventions.');
      expect(parsed.topics).toEqual(['API Design', 'REST', 'Authentication']);
    });

    it('returns error for invalid input', async () => {
      const storage = createMockStorage();

      const result = await executeKnowledgeTool(
        'categorize_file',
        { category: 'policy' }, // Missing required fields
        storage
      );

      expect(result).toContain('Invalid input');
    });
  });

  describe('unknown tool', () => {
    it('returns error for unknown tool name', async () => {
      const storage = createMockStorage();

      const result = await executeKnowledgeTool('unknown_tool', {}, storage);

      expect(result).toBe('Unknown tool: unknown_tool');
    });
  });

  describe('subdirectory filtering', () => {
    it('list_knowledge_files only includes base directory and current project subdirectory', async () => {
      const storage = createMockStorage();
      const mockList = vi.mocked(storage.list);

      await executeKnowledgeTool('list_knowledge_files', {}, storage);

      // Verify that list was called with project hash subdirectory
      expect(storage.list).toHaveBeenCalledWith(
        { status: 'active' },
        expect.arrayContaining([expect.any(String)])
      );

      // Verify the subdirectory array has exactly one element (the project hash)
      const callArgs = mockList.mock.calls[0];
      expect(callArgs[1]).toHaveLength(1);
      expect(typeof callArgs[1]?.[0]).toBe('string');
    });

    it('read_knowledge_file checks base directory first, then project subdirectory', async () => {
      const storage = createMockStorage();
      const mockGet = vi.mocked(storage.get);
      // Mock get to return null on first call (base dir), then return entry on second call (project dir)
      mockGet.mockResolvedValueOnce(null).mockResolvedValueOnce(
        createMockEntry({
          slug: 'test-file',
          title: 'Test File',
          content: 'Test content',
        })
      );

      const result = await executeKnowledgeTool(
        'read_knowledge_file',
        { slug: 'test-file' },
        storage
      );

      // Verify get was called twice - once for base dir, once for project dir
      expect(storage.get).toHaveBeenCalledTimes(2);
      expect(storage.get).toHaveBeenNthCalledWith(1, 'test-file');
      expect(storage.get).toHaveBeenNthCalledWith(2, 'test-file', expect.any(String));

      // Verify result contains the file content
      expect(result).toContain('Test File');
      expect(result).toContain('Test content');
    });

    it('read_knowledge_file returns base directory file if found', async () => {
      const storage = createMockStorage();
      const mockGet = vi.mocked(storage.get);
      // Mock get to return entry on first call (base dir)
      mockGet.mockResolvedValueOnce(
        createMockEntry({
          slug: 'base-file',
          title: 'Base File',
          content: 'Base content',
        })
      );

      const result = await executeKnowledgeTool(
        'read_knowledge_file',
        { slug: 'base-file' },
        storage
      );

      // Verify get was only called once for base dir
      expect(storage.get).toHaveBeenCalledTimes(1);
      expect(storage.get).toHaveBeenCalledWith('base-file');

      // Verify result contains the file content
      expect(result).toContain('Base File');
      expect(result).toContain('Base content');
    });

    it('read_knowledge_file returns not found if file not in base or project subdirectory', async () => {
      const storage = createMockStorage();
      const mockGet = vi.mocked(storage.get);
      // Mock get to return null for both calls
      mockGet.mockResolvedValue(null);

      const result = await executeKnowledgeTool(
        'read_knowledge_file',
        { slug: 'missing-file' },
        storage
      );

      // Verify get was called twice
      expect(storage.get).toHaveBeenCalledTimes(2);

      // Verify result is not found message
      expect(result).toBe('File not found: missing-file');
    });
  });
});
