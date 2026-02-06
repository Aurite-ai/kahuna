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

  it('requires taskDescription', () => {
    expect(prepareContextToolDefinition.inputSchema.required).toContain('taskDescription');
  });

  it('does not require projectId', () => {
    expect(prepareContextToolDefinition.inputSchema.required).not.toContain('projectId');
  });

  it('defines valid categories', () => {
    const categoriesSchema = prepareContextToolDefinition.inputSchema.properties.categories;
    expect(categoriesSchema.items.enum).toContain('policy');
    expect(categoriesSchema.items.enum).toContain('requirement');
    expect(categoriesSchema.items.enum).toContain('reference');
    expect(categoriesSchema.items.enum).toContain('decision');
    expect(categoriesSchema.items.enum).toContain('pattern');
    expect(categoriesSchema.items.enum).toContain('context');
  });
});

describe('prepareContextToolHandler', () => {
  let mockStorage: KnowledgeStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = createMockStorage();
  });

  describe('input validation', () => {
    it('returns error when taskDescription is missing', async () => {
      const result = await prepareContextToolHandler({}, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('taskDescription');
    });

    it('accepts empty projectId (optional parameter)', async () => {
      vi.mocked(mockStorage.list).mockResolvedValue([createMockEntry()]);

      const result = await prepareContextToolHandler({ taskDescription: 'test task' }, mockStorage);

      expect(result.isError).toBeUndefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
    });
  });

  describe('with no filters (returns all)', () => {
    it('returns all active entries when no filters provided', async () => {
      const entries = [
        createMockEntry({ slug: 'entry-1', title: 'Entry 1' }),
        createMockEntry({ slug: 'entry-2', title: 'Entry 2' }),
        createMockEntry({ slug: 'entry-3', title: 'Entry 3' }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        { taskDescription: 'general task' },
        mockStorage
      );

      expect(mockStorage.list).toHaveBeenCalledWith({ status: 'active' });
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.summary.totalFiles).toBe(3);
    });

    it('handles empty knowledge base gracefully', async () => {
      vi.mocked(mockStorage.list).mockResolvedValue([]);

      const result = await prepareContextToolHandler({ taskDescription: 'test task' }, mockStorage);

      expect(result.isError).toBeUndefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.message).toContain('No files found');
      expect(response.data.hint).toContain('kahuna_learn');
      expect(response.data.selectedFiles).toEqual([]);
    });
  });

  describe('with category filter', () => {
    it('filters entries by single category', async () => {
      const entries = [
        createMockEntry({
          slug: 'policy-1',
          title: 'Security Policy',
          classification: {
            category: 'policy',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['security', 'policy'], // Include 'policy' tag for relevance match
            topics: ['security'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
        createMockEntry({
          slug: 'reference-1',
          title: 'API Reference',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['api'],
            topics: ['api'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        {
          taskDescription: 'review policy',
          categories: ['policy'],
          minRelevanceScore: 0, // Allow all entries to pass relevance filter
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.summary.candidateFiles).toBe(1);
      expect(response.data.selectedFiles[0].category).toBe('policy');
    });

    it('filters entries by multiple categories', async () => {
      const entries = [
        createMockEntry({
          slug: 'policy-1',
          title: 'Company Policy',
          classification: {
            category: 'policy',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['policy'],
            topics: [],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
        createMockEntry({
          slug: 'decision-1',
          title: 'Architecture Decision',
          classification: {
            category: 'decision',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['decision'],
            topics: [],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
        createMockEntry({
          slug: 'reference-1',
          title: 'API Reference',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: [],
            topics: [],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        {
          taskDescription: 'review policies and decisions',
          categories: ['policy', 'decision'],
          minRelevanceScore: 0, // Allow all entries to pass relevance filter
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.summary.candidateFiles).toBe(2);
    });
  });

  describe('with tags filter (via relevance ranking)', () => {
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
        { taskDescription: 'implement authentication using oauth' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      // Auth guide should be ranked first due to tag matches
      expect(response.data.selectedFiles[0].slug).toBe('auth-guide');
      expect(response.data.selectedFiles[0].matchedTags).toContain('authentication');
      expect(response.data.selectedFiles[0].matchedTags).toContain('oauth');
    });
  });

  describe('with searchText filter (via relevance ranking)', () => {
    it('ranks entries with matching content higher via summary similarity', async () => {
      const entries = [
        createMockEntry({
          slug: 'payment-api',
          title: 'Payment API',
          summary: 'Documentation for the payment processing API with Stripe integration',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['payment'],
            topics: ['payments'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: ['Stripe'] },
          },
        }),
        createMockEntry({
          slug: 'user-api',
          title: 'User API',
          summary: 'Documentation for user management and profile endpoints',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['user'],
            topics: ['users'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        { taskDescription: 'integrate stripe payment processing' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      // Payment API should be ranked first
      expect(response.data.selectedFiles[0].slug).toBe('payment-api');
      expect(response.data.selectedFiles[0].matchedEntities).toContain('Stripe');
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

      const result = await prepareContextToolHandler(
        {
          taskDescription: 'implement authentication',
          minRelevanceScore: 5, // High threshold
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.message).toContain('No files met the minimum relevance score');
      expect(response.data.hint).toContain('minRelevanceScore');
      expect(response.data.selectedFiles).toEqual([]);
    });

    it('handles empty category filter results', async () => {
      const entries = [
        createMockEntry({
          slug: 'reference-1',
          title: 'Reference Doc',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['reference'],
            topics: [],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        {
          taskDescription: 'find policies',
          categories: ['policy'], // No policies exist
          minRelevanceScore: 0, // Allow any relevance
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      // With no candidates matching category, we get 0 selected files
      // The response message indicates no files met the threshold (since candidateFiles=0)
      expect(response.data.message).toContain('No files met the minimum relevance score');
      expect(response.data.selectedFiles).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('handles storage errors gracefully', async () => {
      vi.mocked(mockStorage.list).mockRejectedValue(new Error('Storage unavailable'));

      const result = await prepareContextToolHandler({ taskDescription: 'test task' }, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Failed to prepare context');
      expect(response.error).toContain('Storage unavailable');
      expect(response.details.hint).toContain('knowledge base directory');
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

      const result = await prepareContextToolHandler({ taskDescription: 'test task' }, mockStorage);

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

      const result = await prepareContextToolHandler({ taskDescription: 'test task' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.formattedContext).toBeDefined();
      expect(response.data.formattedContext).toContain('# Prepared Context for Task');
      expect(response.data.formattedContext).toContain('## API Guide');
      expect(response.data.formattedContext).toContain('# API Guide');
    });

    it('includes selected files with all metadata', async () => {
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

      const result = await prepareContextToolHandler({ taskDescription: 'test task' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      const selectedFile = response.data.selectedFiles[0];
      expect(selectedFile.title).toBe('Test Entry');
      expect(selectedFile.slug).toBe('test-entry');
      expect(selectedFile.category).toBe('reference');
      expect(selectedFile.relevanceScore).toBeDefined();
      expect(selectedFile.reasoning).toBeDefined();
      expect(selectedFile.content).toBe('Test content');
    });

    it('respects maxFiles limit', async () => {
      const entries = Array.from({ length: 20 }, (_, i) =>
        createMockEntry({ slug: `entry-${i}`, title: `Entry ${i}` })
      );
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        {
          taskDescription: 'test task',
          maxFiles: 5,
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.selectedFiles.length).toBe(5);
    });

    it('uses default maxFiles of 10', async () => {
      const entries = Array.from({ length: 20 }, (_, i) =>
        createMockEntry({ slug: `entry-${i}`, title: `Entry ${i}` })
      );
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler({ taskDescription: 'test task' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.selectedFiles.length).toBe(10);
    });
  });

  describe('relevance ranking', () => {
    it('scores tag matches with weight 3', async () => {
      const entries = [
        createMockEntry({
          slug: 'tagged',
          title: 'Tagged Entry',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['authentication'], // Direct match
            topics: [],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        { taskDescription: 'implement authentication' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      // Should have relevance score of at least 3 (from tag match)
      expect(
        Number.parseFloat(response.data.selectedFiles[0].relevanceScore)
      ).toBeGreaterThanOrEqual(3);
      expect(response.data.selectedFiles[0].matchedTags).toContain('authentication');
    });

    it('scores topic matches with weight 2', async () => {
      const entries = [
        createMockEntry({
          slug: 'topic-entry',
          title: 'Topic Entry',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: [],
            topics: ['authentication'], // Direct match
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        { taskDescription: 'implement authentication' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(
        Number.parseFloat(response.data.selectedFiles[0].relevanceScore)
      ).toBeGreaterThanOrEqual(2);
      expect(response.data.selectedFiles[0].matchedTopics).toContain('authentication');
    });

    it('scores entity matches with weight 2', async () => {
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
              technologies: ['TypeScript'], // Direct match
              frameworks: [],
              libraries: [],
              apis: [],
            },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await prepareContextToolHandler(
        { taskDescription: 'write typescript code' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(
        Number.parseFloat(response.data.selectedFiles[0].relevanceScore)
      ).toBeGreaterThanOrEqual(2);
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
            tags: ['other'],
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

      const result = await prepareContextToolHandler(
        {
          taskDescription: 'implement rest api',
          minRelevanceScore: 0, // Allow low relevance entries too
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.selectedFiles.length).toBe(2);
      expect(response.data.selectedFiles[0].slug).toBe('high-relevance');
      expect(response.data.selectedFiles[1].slug).toBe('low-relevance');
    });
  });
});
