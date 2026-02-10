import * as fs from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeStorageService } from '../../storage/index.js';
import { KnowledgeStorageError } from '../../storage/index.js';
import { learnToolDefinition, learnToolHandler } from '../learn.js';
import type { ToolContext } from '../types.js';
import { createMockContext, createMockEntry } from './test-utils.js';

// Mock the categorization module
vi.mock('../../categorization/index.js', () => ({
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

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  stat: vi.fn(),
  readdir: vi.fn(),
  readFile: vi.fn(),
  access: vi.fn(),
}));

import { FileSizeError, categorizeFile } from '../../categorization/index.js';

describe('learnToolDefinition', () => {
  it('has the correct name', () => {
    expect(learnToolDefinition.name).toBe('kahuna_learn');
  });

  it('requires paths', () => {
    expect(learnToolDefinition.inputSchema.required).toContain('paths');
    expect(learnToolDefinition.inputSchema.required).not.toContain('projectId');
    expect(learnToolDefinition.inputSchema.required).not.toContain('files');
  });

  it('has optional description', () => {
    expect(learnToolDefinition.inputSchema.properties.description).toBeDefined();
    expect(learnToolDefinition.inputSchema.required).not.toContain('description');
  });

  it('defines paths as array of strings', () => {
    const pathsSchema = learnToolDefinition.inputSchema.properties.paths;
    expect(pathsSchema.type).toBe('array');
    expect(pathsSchema.items.type).toBe('string');
  });
});

describe('learnToolHandler', () => {
  let ctx: ToolContext;
  let mockStorage: KnowledgeStorageService;
  const mockCategorizeFile = vi.mocked(categorizeFile);
  const mockFsStat = vi.mocked(fs.stat);
  const mockFsReaddir = vi.mocked(fs.readdir);
  const mockFsReadFile = vi.mocked(fs.readFile);
  const mockFsAccess = vi.mocked(fs.access);

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    mockStorage = ctx.storage;

    // Default categorization response (using unified knowledge categories)
    mockCategorizeFile.mockResolvedValue({
      category: 'reference',
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

    // Default file system mocks
    mockFsAccess.mockResolvedValue(undefined);
    mockFsStat.mockResolvedValue({
      isDirectory: () => false,
      isFile: () => true,
    } as unknown as Awaited<ReturnType<typeof fs.stat>>);
    mockFsReadFile.mockResolvedValue('# Test Content\n\nSome content here.');
  });

  describe('input validation', () => {
    it('returns error when paths is missing', async () => {
      const result = await learnToolHandler({}, ctx);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('paths');
    });

    it('returns error when paths array is empty', async () => {
      const result = await learnToolHandler({ paths: [] }, ctx);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('paths');
    });

    it('returns error when no accessible files found', async () => {
      mockFsAccess.mockRejectedValue(new Error('ENOENT'));

      const result = await learnToolHandler({ paths: ['/nonexistent/file.md'] }, ctx);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('No accessible files');
    });
  });

  describe('file reading from disk', () => {
    it('reads file content from provided path', async () => {
      vi.mocked(mockStorage.save).mockResolvedValue(createMockEntry());

      await learnToolHandler({ paths: ['docs/api-guidelines.md'] }, ctx);

      expect(mockFsAccess).toHaveBeenCalledWith('docs/api-guidelines.md');
      expect(mockFsReadFile).toHaveBeenCalledWith('docs/api-guidelines.md', 'utf-8');
    });

    it('handles file read errors gracefully', async () => {
      mockFsReadFile.mockRejectedValue(new Error('Permission denied'));

      const result = await learnToolHandler({ paths: ['docs/protected.md'] }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.results[0].success).toBe(false);
      expect(response.data.results[0].error).toContain('Failed to read file');
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

      const result = await learnToolHandler({ paths: ['docs/api-guidelines.md'] }, ctx);

      expect(result.isError).toBeUndefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.results[0].success).toBe(true);
      expect(response.data.results[0].slug).toBe('api-guidelines');
      expect(response.data.results[0].created).toBe(true);
      expect(response.data.summary.created).toBe(1);
    });

    it('calls storage.save with correct input including sourcePath', async () => {
      vi.mocked(mockStorage.save).mockResolvedValue(createMockEntry());

      await learnToolHandler({ paths: ['src/test-file.md'] }, ctx);

      expect(mockStorage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test File',
          sourceFile: 'test-file.md',
          sourcePath: 'src/test-file.md',
          category: 'reference',
          confidence: 0.9,
          reasoning: 'Test categorization',
        })
      );
    });

    it('includes description in reasoning when provided', async () => {
      vi.mocked(mockStorage.save).mockResolvedValue(createMockEntry());

      await learnToolHandler(
        {
          paths: ['docs/api.md'],
          description: 'Our API design standards',
        },
        ctx
      );

      expect(mockStorage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          reasoning: expect.stringContaining('Our API design standards'),
        })
      );
    });

    it('converts filename to title correctly', async () => {
      vi.mocked(mockStorage.save).mockResolvedValue(createMockEntry());

      // Test various filename formats
      const testCases = [
        { path: 'docs/api-guidelines.md', expectedTitle: 'Api Guidelines' },
        { path: 'README.txt', expectedTitle: 'README' },
        { path: 'src/my_config_file.yaml', expectedTitle: 'My Config File' },
      ];

      for (const { path: filePath, expectedTitle } of testCases) {
        await learnToolHandler({ paths: [filePath] }, ctx);

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

      const result = await learnToolHandler({ paths: ['docs/api-guidelines.md'] }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.results[0].success).toBe(true);
      expect(response.data.results[0].created).toBe(false);
      expect(response.data.summary.updated).toBe(1);
    });
  });

  describe('multiple files', () => {
    it('processes multiple file paths successfully', async () => {
      const now = new Date().toISOString();
      vi.mocked(mockStorage.save)
        .mockResolvedValueOnce(
          createMockEntry({ slug: 'file-one', created_at: now, updated_at: now })
        )
        .mockResolvedValueOnce(
          createMockEntry({ slug: 'file-two', created_at: now, updated_at: now })
        )
        .mockResolvedValueOnce(
          createMockEntry({
            slug: 'file-three',
            created_at: '2026-02-06T10:00:00.000Z',
            updated_at: now,
          })
        );

      const result = await learnToolHandler(
        {
          paths: ['file-one.md', 'file-two.md', 'file-three.md'],
        },
        ctx
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
        .mockResolvedValueOnce(
          createMockEntry({ slug: 'good-file', created_at: now, updated_at: now })
        )
        .mockRejectedValueOnce(new KnowledgeStorageError('Write failed', 'WRITE_ERROR'));

      const result = await learnToolHandler(
        {
          paths: ['good-file.md', 'bad-file.md'],
        },
        ctx
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

      const result = await learnToolHandler({ paths: ['large-file.md'] }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.results[0].success).toBe(false);
      expect(response.data.results[0].error).toContain('File too large');
      expect(response.data.results[0].error).toContain('500000');
    });

    it('handles missing Anthropic API key', async () => {
      mockCategorizeFile.mockRejectedValueOnce(new Error('ANTHROPIC_API_KEY is not set'));

      const result = await learnToolHandler({ paths: ['test.md'] }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.results[0].success).toBe(false);
      expect(response.data.results[0].error).toContain('AI categorization unavailable');
      expect(response.data.results[0].error).toContain('Anthropic API key');
    });

    it('handles KnowledgeStorageError', async () => {
      mockCategorizeFile.mockResolvedValue({
        category: 'reference',
        confidence: 0.9,
        reasoning: 'Test',
      });
      vi.mocked(mockStorage.save).mockRejectedValue(
        new KnowledgeStorageError('Directory not accessible', 'DIR_ERROR')
      );

      const result = await learnToolHandler({ paths: ['test.md'] }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.results[0].success).toBe(false);
      expect(response.data.results[0].error).toContain('Storage error');
      expect(response.data.results[0].error).toContain('DIR_ERROR');
    });

    it('handles unexpected errors', async () => {
      mockCategorizeFile.mockRejectedValueOnce(new Error('Unexpected network error'));

      const result = await learnToolHandler({ paths: ['test.md'] }, ctx);

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

      const result = await learnToolHandler({ paths: ['test.md'] }, ctx);

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

      const result = await learnToolHandler({ paths: ['ref.md', 'policy.md'] }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.message).toContain('reference');
      expect(response.data.message).toContain('policy');
    });
  });
});
