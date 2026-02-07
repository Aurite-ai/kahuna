import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeEntry, KnowledgeStorageService } from '../../storage/index.js';
import { prepareContextToolDefinition, prepareContextToolHandler } from '../prepare-context.js';

/**
 * Create a mock storage service for testing
 */
function createMockStorage(overrides?: Partial<KnowledgeStorageService>): KnowledgeStorageService {
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
 * Create a mock KnowledgeEntry for testing
 */
function createMockEntry(overrides?: Partial<KnowledgeEntry>): KnowledgeEntry {
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
    content: '# Test Content\n\nThis is test content.',
    ...overrides,
  };
}

describe('prepareContextToolDefinition', () => {
  it('has the correct name', () => {
    expect(prepareContextToolDefinition.name).toBe('kahuna_prepare_context');
  });

  it('requires task', () => {
    expect(prepareContextToolDefinition.inputSchema.required).toContain('task');
  });

  it('does not require files', () => {
    expect(prepareContextToolDefinition.inputSchema.required).not.toContain('files');
  });

  it('has files as optional array parameter', () => {
    const filesSchema = prepareContextToolDefinition.inputSchema.properties.files;
    expect(filesSchema.type).toBe('array');
    expect(filesSchema.items.type).toBe('string');
  });

  it('does not have projectId, categories, maxFiles, or minRelevanceScore parameters', () => {
    const props = prepareContextToolDefinition.inputSchema.properties;
    expect(props).not.toHaveProperty('projectId');
    expect(props).not.toHaveProperty('categories');
    expect(props).not.toHaveProperty('maxFiles');
    expect(props).not.toHaveProperty('minRelevanceScore');
  });
});

describe('prepareContextToolHandler', () => {
  let mockStorage: KnowledgeStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = createMockStorage();
  });

  describe('input validation', () => {
    it('returns error when task is missing', async () => {
      const result = await prepareContextToolHandler({}, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('task');
    });

    it('accepts empty files array (optional parameter)', async () => {
      vi.mocked(mockStorage.list).mockResolvedValue([createMockEntry()]);

      const result = await prepareContextToolHandler({ task: 'test task', files: [] }, mockStorage);

      expect(result.isError).toBeUndefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
    });
  });

  describe('basic functionality', () => {
    it('returns all active entries when task provided', async () => {
      const entries = [
        createMockEntry({ slug: 'entry-1', title: 'Entry 1' }),
        createMockEntry({ slug: 'entry-2', title: 'Entry 2' }),
        createMockEntry({ slug: 'entry-3', title: 'Entry 3' }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler({ task: 'general task' }, mockStorage);

      expect(mockStorage.list).toHaveBeenCalledWith({ status: 'active' });
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.summary.totalFiles).toBe(3);
    });

    it('handles empty knowledge base gracefully', async () => {
      vi.mocked(mockStorage.list).mockResolvedValue([]);

      const result = await prepareContextToolHandler({ task: 'test task' }, mockStorage);

      expect(result.isError).toBeUndefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.message).toContain('No files found');
      expect(response.data.hint).toContain('kahuna_learn');
      expect(response.data.selectedFiles).toEqual([]);
    });
  });

  describe('with files parameter', () => {
    it('uses file paths to boost relevance', async () => {
      const entries = [
        createMockEntry({
          slug: 'auth-guide',
          title: 'Authentication Guide',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['authentication', 'security'],
            topics: ['auth'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
        createMockEntry({
          slug: 'unrelated',
          title: 'Unrelated Document',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['database', 'sql'],
            topics: ['data'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        {
          task: 'fix a bug',
          files: ['src/auth/login.ts'],
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      // Auth guide should be ranked higher due to 'auth' keyword from file path
      expect(response.data.selectedFiles[0].slug).toBe('auth-guide');
    });
  });

  describe('relevance ranking', () => {
    it('ranks entries with matching tags higher', async () => {
      const entries = [
        createMockEntry({
          slug: 'auth-guide',
          title: 'Authentication Guide',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['authentication', 'security', 'oauth'],
            topics: ['auth'],
            entities: { technologies: ['OAuth2'], frameworks: [], libraries: [], apis: [] },
          },
        }),
        createMockEntry({
          slug: 'unrelated',
          title: 'Unrelated Document',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['database', 'sql'],
            topics: ['data'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        { task: 'implement authentication using oauth' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      // Auth guide should be ranked first due to tag matches
      expect(response.data.selectedFiles[0].slug).toBe('auth-guide');
      expect(response.data.selectedFiles[0].matchedTags).toContain('authentication');
      expect(response.data.selectedFiles[0].matchedTags).toContain('oauth');
    });

    it('scores topic matches', async () => {
      const entries = [
        createMockEntry({
          slug: 'topic-entry',
          title: 'Topic Entry',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: [],
            topics: ['authentication'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        { task: 'implement authentication' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.selectedFiles[0].matchedTopics).toContain('authentication');
    });

    it('scores entity matches', async () => {
      const entries = [
        createMockEntry({
          slug: 'tech-entry',
          title: 'Tech Entry',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: [],
            topics: [],
            entities: {
              technologies: ['TypeScript'],
              frameworks: [],
              libraries: [],
              apis: [],
            },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        { task: 'write typescript code' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.selectedFiles[0].matchedEntities).toContain('TypeScript');
    });

    it('sorts entries by relevance score descending', async () => {
      const entries = [
        createMockEntry({
          slug: 'low-relevance',
          title: 'Low Relevance',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['api'], // Has at least one matching tag to pass threshold
            topics: [],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
        createMockEntry({
          slug: 'high-relevance',
          title: 'High Relevance',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['api', 'rest', 'implementation'],
            topics: ['api-design'],
            entities: { technologies: ['REST'], frameworks: [], libraries: [], apis: ['REST API'] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler({ task: 'implement rest api' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.selectedFiles.length).toBe(2);
      expect(response.data.selectedFiles[0].slug).toBe('high-relevance');
      expect(response.data.selectedFiles[1].slug).toBe('low-relevance');
    });
  });

  describe('response format', () => {
    it('includes summary with statistics', async () => {
      const entries = [
        createMockEntry({
          slug: 'entry-1',
          classification: { ...createMockEntry().classification, category: 'reference' },
        }),
        createMockEntry({
          slug: 'entry-2',
          classification: { ...createMockEntry().classification, category: 'policy' },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler({ task: 'test task' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.summary).toBeDefined();
      expect(response.data.summary.totalFiles).toBe(2);
      expect(response.data.summary.categories).toBeDefined();
    });

    it('includes formatted context for direct use', async () => {
      const entries = [
        createMockEntry({
          slug: 'api-guide',
          title: 'API Guide',
          content: '# API Guide\n\nThis is the API guide.',
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler({ task: 'test task' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.formattedContext).toBeDefined();
      expect(response.data.formattedContext).toContain('# Context Ready');
      expect(response.data.formattedContext).toContain('API Guide');
    });

    it('includes selected files with content', async () => {
      const entries = [
        createMockEntry({
          slug: 'test-entry',
          title: 'Test Entry',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['test'],
            topics: ['testing'],
            entities: { technologies: ['TypeScript'], frameworks: [], libraries: [], apis: [] },
          },
          content: 'Test content',
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler({ task: 'test task' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      const selectedFile = response.data.selectedFiles[0];
      expect(selectedFile.title).toBe('Test Entry');
      expect(selectedFile.slug).toBe('test-entry');
      expect(selectedFile.category).toBe('reference');
      expect(selectedFile.relevanceScore).toBeDefined();
      expect(selectedFile.reasoning).toBeDefined();
      expect(selectedFile.content).toBe('Test content');
    });

    it('limits to 10 files by default', async () => {
      const entries = Array.from({ length: 20 }, (_, i) =>
        createMockEntry({ slug: `entry-${i}`, title: `Entry ${i}` })
      );
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler({ task: 'test task' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.selectedFiles.length).toBe(10);
    });
  });

  describe('error handling', () => {
    it('handles storage errors gracefully', async () => {
      vi.mocked(mockStorage.list).mockRejectedValue(new Error('Storage unavailable'));

      const result = await prepareContextToolHandler({ task: 'test task' }, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Failed to prepare context');
      expect(response.error).toContain('Storage unavailable');
      expect(response.details.hint).toContain('knowledge base directory');
    });
  });

  describe('empty results handling', () => {
    it('handles no entries matching relevance threshold', async () => {
      const entries = [
        createMockEntry({
          slug: 'unrelated',
          title: 'Unrelated Document',
          summary: 'Something completely unrelated',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['other'],
            topics: ['other'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      // With default threshold, unrelated entries with no matches should still appear
      // but with very low scores. If all entries have score < 1, they won't show.
      const result = await prepareContextToolHandler(
        { task: 'implement authentication with jwt tokens' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      // The entry has no matching tags/topics/entities, so it should be below threshold
      expect(response.data.message).toContain('No files met');
    });
  });
});
