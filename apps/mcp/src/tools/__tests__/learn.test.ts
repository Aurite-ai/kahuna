import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  KnowledgeEntry,
  KnowledgeStorageService,
} from '../../storage/index.js';
import { KnowledgeStorageError } from '../../storage/index.js';
import { learnToolDefinition, learnToolHandler } from '../learn.js';

// Mock the file-router module
vi.mock('@kahuna/file-router', () => ({
  categorizeFile: vi.fn(),
  FileSizeError: class FileSizeError extends Error {
    constructor(
      public fileSize: number,
      public limit: number
    ) {
      super(
        `File too large for categorization (${Math.round(fileSize / 1024)}KB). Maximum allowed: ${Math.round(limit / 1024)}KB.`
      );
      this.name = 'FileSizeError';
    }
  },
}));

import { FileSizeError, categorizeFile } from '@kahuna/file-router';

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
    summary: 'A test entry',
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
      tags: ['test'],
      topics: ['testing'],
      entities: {
        technologies: [],
        frameworks: [],
        libraries: [],
        apis: [],
      },
    },
    status: 'active',
    content: '# Test Content',
    ...overrides,
  };
}

describe('learnToolDefinition', () => {
  it('has the correct name', () => {
    expect(learnToolDefinition.name).toBe('kahuna_learn');
  });

  it('requires projectId and files', () => {
    expect(learnToolDefinition.inputSchema.required).toContain('projectId');
    expect(learnToolDefinition.inputSchema.required).toContain('files');
  });

  it('defines file schema with filename and content', () => {
    const fileSchema = learnToolDefinition.inputSchema.properties.files.items;
    expect(fileSchema.required).toContain('filename');
    expect(fileSchema.required).toContain('content');
  });
});

describe('learnToolHandler', () => {
  let mockStorage: KnowledgeStorageService;
  const mockCategorizeFile = vi.mocked(categorizeFile);

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = createMockStorage();

    // Default categorization response (using AI categorizer categories)
    mockCategorizeFile.mockResolvedValue({
      category: 'technical-info',
      confidence: 0.9,
      reasoning: 'Test categorization',
      metadata: {
        tags: ['api', 'documentation'],
        topics: ['rest-api'],
        entities: {
          technologies: ['REST'],
          frameworks: [],
          libraries: [],
          apis: ['REST API'],
        },
        summary: 'API documentation',
      },
    });
  });

  describe('input validation', () => {
    it('returns error when projectId is missing', async () => {
      const result = await learnToolHandler({ files: [{ filename: 'test.md', content: 'test' }] }, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('projectId');
    });

    it('returns error when files array is missing', async () => {
      const result = await learnToolHandler({ projectId: 'test-project' }, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('files');
    });

    it('returns error when files array is empty', async () => {
      const result = await learnToolHandler({ projectId: 'test-project', files: [] }, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('files');
    });

    it('handles file with missing filename', async () => {
      const result = await learnToolHandler(
        { projectId: 'test-project', files: [{ content: 'test' }] },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.results[0].success).toBe(false);
      expect(response.data.results[0].error).toContain('filename');
    });

    it('handles file with missing content', async () => {
      const result = await learnToolHandler(
        { projectId: 'test-project', files: [{ filename: 'test.md' }] },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.results[0].success).toBe(false);
      expect(response.data.results[0].error).toContain('content');
    });
  });

  describe('successful save (new entry)', () => {
    it('creates a new knowledge entry', async () => {
      const now = new Date().toISOString();
      const savedEntry = createMockEntry({
        slug: 'api-guidelines',
        title: 'API Guidelines',
        created_at: now,
        updated_at: now, // Same timestamp indicates new entry
      });

      vi.mocked(mockStorage.save).mockResolvedValue(savedEntry);

      const result = await learnToolHandler(
        {
          projectId: 'test-project',
          files: [{ filename: 'api-guidelines.md', content: '# API Guidelines\n\nUse REST.' }],
        },
        mockStorage
      );

      expect(result.isError).toBeUndefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.results[0].success).toBe(true);
      expect(response.data.results[0].slug).toBe('api-guidelines');
      expect(response.data.results[0].created).toBe(true);
      expect(response.data.summary.created).toBe(1);
    });

    it('calls storage.save with correct input', async () => {
      vi.mocked(mockStorage.save).mockResolvedValue(createMockEntry());

      await learnToolHandler(
        {
          projectId: 'my-project',
          files: [{ filename: 'test-file.md', content: 'Test content' }],
        },
        mockStorage
      );

      expect(mockStorage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test File',
          content: 'Test content',
          sourceFile: 'test-file.md',
          projectId: 'my-project',
          category: 'technical-info',
          confidence: 0.9,
          reasoning: 'Test categorization',
        })
      );
    });

    it('converts filename to title correctly', async () => {
      vi.mocked(mockStorage.save).mockResolvedValue(createMockEntry());

      // Test various filename formats
      const testCases = [
        { filename: 'api-guidelines.md', expectedTitle: 'Api Guidelines' },
        { filename: 'README.txt', expectedTitle: 'README' },
        { filename: 'my_config_file.yaml', expectedTitle: 'My Config File' },
      ];

      for (const { filename, expectedTitle } of testCases) {
        await learnToolHandler(
          { projectId: 'test', files: [{ filename, content: 'test' }] },
          mockStorage
        );

        expect(mockStorage.save).toHaveBeenLastCalledWith(
          expect.objectContaining({ title: expectedTitle })
        );
      }
    });
  });

  describe('successful save (update)', () => {
    it('updates an existing knowledge entry', async () => {
      const createdAt = '2026-02-06T10:00:00.000Z';
      const updatedAt = '2026-02-06T12:00:00.000Z';
      const savedEntry = createMockEntry({
        slug: 'api-guidelines',
        title: 'API Guidelines',
        created_at: createdAt,
        updated_at: updatedAt, // Different timestamp indicates update
      });

      vi.mocked(mockStorage.save).mockResolvedValue(savedEntry);

      const result = await learnToolHandler(
        {
          projectId: 'test-project',
          files: [{ filename: 'api-guidelines.md', content: '# Updated API Guidelines' }],
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.results[0].success).toBe(true);
      expect(response.data.results[0].created).toBe(false);
      expect(response.data.summary.updated).toBe(1);
    });
  });

  describe('multiple files', () => {
    it('processes multiple files successfully', async () => {
      const now = new Date().toISOString();
      vi.mocked(mockStorage.save)
        .mockResolvedValueOnce(createMockEntry({ slug: 'file-one', created_at: now, updated_at: now }))
        .mockResolvedValueOnce(createMockEntry({ slug: 'file-two', created_at: now, updated_at: now }))
        .mockResolvedValueOnce(
          createMockEntry({
            slug: 'file-three',
            created_at: '2026-02-06T10:00:00.000Z',
            updated_at: now,
          })
        );

      const result = await learnToolHandler(
        {
          projectId: 'test-project',
          files: [
            { filename: 'file-one.md', content: 'Content 1' },
            { filename: 'file-two.md', content: 'Content 2' },
            { filename: 'file-three.md', content: 'Content 3' },
          ],
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.summary.total).toBe(3);
      expect(response.data.summary.successful).toBe(3);
      expect(response.data.summary.created).toBe(2);
      expect(response.data.summary.updated).toBe(1);
    });

    it('handles partial failures', async () => {
      const now = new Date().toISOString();
      vi.mocked(mockStorage.save)
        .mockResolvedValueOnce(createMockEntry({ slug: 'good-file', created_at: now, updated_at: now }))
        .mockRejectedValueOnce(new KnowledgeStorageError('Write failed', 'WRITE_ERROR'));

      const result = await learnToolHandler(
        {
          projectId: 'test-project',
          files: [
            { filename: 'good-file.md', content: 'Good content' },
            { filename: 'bad-file.md', content: 'Bad content' },
          ],
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true); // Overall request succeeded
      expect(response.data.summary.successful).toBe(1);
      expect(response.data.summary.failed).toBe(1);
      expect(response.data.results[0].success).toBe(true);
      expect(response.data.results[1].success).toBe(false);
      expect(response.data.results[1].error).toContain('WRITE_ERROR');
    });
  });

  describe('error handling', () => {
    it('handles FileSizeError from categorization', async () => {
      mockCategorizeFile.mockRejectedValueOnce(new FileSizeError(500000, 400000));

      const result = await learnToolHandler(
        {
          projectId: 'test-project',
          files: [{ filename: 'large-file.md', content: 'x'.repeat(500000) }],
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.results[0].success).toBe(false);
      expect(response.data.results[0].error).toContain('File too large');
      expect(response.data.results[0].error).toContain('500000');
    });

    it('handles missing Anthropic API key', async () => {
      mockCategorizeFile.mockRejectedValueOnce(new Error('ANTHROPIC_API_KEY is not set'));

      const result = await learnToolHandler(
        {
          projectId: 'test-project',
          files: [{ filename: 'test.md', content: 'test' }],
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.results[0].success).toBe(false);
      expect(response.data.results[0].error).toContain('AI categorization unavailable');
      expect(response.data.results[0].error).toContain('Anthropic API key');
    });

    it('handles KnowledgeStorageError', async () => {
      mockCategorizeFile.mockResolvedValue({
        category: 'technical-info',
        confidence: 0.9,
        reasoning: 'Test',
      });
      vi.mocked(mockStorage.save).mockRejectedValue(
        new KnowledgeStorageError('Directory not accessible', 'DIR_ERROR')
      );

      const result = await learnToolHandler(
        {
          projectId: 'test-project',
          files: [{ filename: 'test.md', content: 'test' }],
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.results[0].success).toBe(false);
      expect(response.data.results[0].error).toContain('Storage error');
      expect(response.data.results[0].error).toContain('DIR_ERROR');
    });

    it('handles unexpected errors', async () => {
      mockCategorizeFile.mockRejectedValueOnce(new Error('Unexpected network error'));

      const result = await learnToolHandler(
        {
          projectId: 'test-project',
          files: [{ filename: 'test.md', content: 'test' }],
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.results[0].success).toBe(false);
      expect(response.data.results[0].error).toContain('Unexpected network error');
    });
  });

  describe('response format', () => {
    it('includes message summary', async () => {
      const now = new Date().toISOString();
      vi.mocked(mockStorage.save).mockResolvedValue(
        createMockEntry({ created_at: now, updated_at: now })
      );

      const result = await learnToolHandler(
        {
          projectId: 'test-project',
          files: [{ filename: 'test.md', content: 'test' }],
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.message).toContain('Processed 1 file(s)');
      expect(response.data.message).toContain('✅ 1 successful');
    });

    it('includes category counts in summary', async () => {
      const now = new Date().toISOString();
      vi.mocked(mockStorage.save)
        .mockResolvedValueOnce(
          createMockEntry({
            classification: {
              category: 'reference',
              confidence: 0.9,
              reasoning: 'Test',
              tags: [],
              topics: [],
              entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
            },
            created_at: now,
            updated_at: now,
          })
        )
        .mockResolvedValueOnce(
          createMockEntry({
            classification: {
              category: 'policy',
              confidence: 0.8,
              reasoning: 'Test',
              tags: [],
              topics: [],
              entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
            },
            created_at: now,
            updated_at: now,
          })
        );

      const result = await learnToolHandler(
        {
          projectId: 'test-project',
          files: [
            { filename: 'ref.md', content: 'reference content' },
            { filename: 'policy.md', content: 'policy content' },
          ],
        },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.message).toContain('reference');
      expect(response.data.message).toContain('policy');
    });
  });
});
