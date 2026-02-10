import * as fs from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentResult } from '../../knowledge/index.js';
import { KnowledgeStorageError } from '../../knowledge/index.js';
import { learnToolDefinition, learnToolHandler } from '../learn.js';
import type { ToolContext } from '../types.js';
import { createMockContext, createMockEntry } from './test-utils.js';

// Mock the agent runner
vi.mock('../../knowledge/agents/run-agent.js', () => ({
  runAgent: vi.fn(),
}));

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  stat: vi.fn(),
  readdir: vi.fn(),
  readFile: vi.fn(),
  access: vi.fn(),
}));

import { runAgent } from '../../knowledge/agents/run-agent.js';

const mockRunAgent = vi.mocked(runAgent);

/**
 * Helper: Build a mock AgentResult for categorize_file tool.
 */
function mockCategorizationResult(overrides?: Record<string, unknown>): AgentResult {
  return {
    textResponse: '',
    toolResults: [
      {
        tool: 'categorize_file',
        category: 'reference',
        confidence: 0.9,
        reasoning: 'Test categorization',
        title: 'API Guidelines',
        summary: 'REST API design standards covering naming conventions and auth',
        topics: ['API Design', 'REST Conventions', 'Authentication'],
        ...overrides,
      },
    ],
  };
}

describe('learnToolDefinition', () => {
  it('has the correct name', () => {
    expect(learnToolDefinition.name).toBe('kahuna_learn');
  });

  it('requires paths', () => {
    expect(learnToolDefinition.inputSchema.required).toContain('paths');
    expect(learnToolDefinition.inputSchema.required).not.toContain('description');
  });

  it('defines paths as array of strings', () => {
    const pathsSchema = learnToolDefinition.inputSchema.properties.paths;
    expect(pathsSchema.type).toBe('array');
    expect(pathsSchema.items.type).toBe('string');
  });

  it('has description with <examples> and <hints>', () => {
    expect(learnToolDefinition.description).toContain('<examples>');
    expect(learnToolDefinition.description).toContain('<hints>');
  });
});

describe('learnToolHandler', () => {
  let ctx: ToolContext;
  const mockFsStat = vi.mocked(fs.stat);
  const mockFsReadFile = vi.mocked(fs.readFile);
  const mockFsAccess = vi.mocked(fs.access);

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();

    // Default file system mocks
    mockFsAccess.mockResolvedValue(undefined);
    mockFsStat.mockResolvedValue({
      isDirectory: () => false,
      isFile: () => true,
    } as unknown as Awaited<ReturnType<typeof fs.stat>>);
    mockFsReadFile.mockResolvedValue('# Test Content\n\nSome content here.');

    // Default agent mock
    mockRunAgent.mockResolvedValue(mockCategorizationResult());
  });

  describe('input validation', () => {
    it('returns error when paths is missing', async () => {
      const result = await learnToolHandler({}, ctx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('paths');
    });

    it('returns error when paths array is empty', async () => {
      const result = await learnToolHandler({ paths: [] }, ctx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('paths');
    });

    it('returns error when no accessible files found', async () => {
      mockFsAccess.mockRejectedValue(new Error('ENOENT'));

      const result = await learnToolHandler({ paths: ['/nonexistent/file.md'] }, ctx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('No Files Found');
    });
  });

  describe('successful processing', () => {
    it('processes a single file through agent → storage pipeline', async () => {
      const now = new Date().toISOString();
      vi.mocked(ctx.storage.save).mockResolvedValue(
        createMockEntry({
          slug: 'api-guidelines',
          title: 'API Guidelines',
          created_at: now,
          updated_at: now,
        })
      );

      const result = await learnToolHandler({ paths: ['docs/api-guidelines.md'] }, ctx);

      // Verify agent was called
      expect(mockRunAgent).toHaveBeenCalledOnce();
      expect(mockRunAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          systemPrompt: expect.any(String),
        }),
        expect.stringContaining('api-guidelines.md'),
        ctx.storage,
        ctx.anthropic
      );

      // Verify storage.save called with flat fields from agent result
      expect(ctx.storage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'API Guidelines',
          summary: expect.stringContaining('REST API'),
          sourceFile: 'api-guidelines.md',
          sourcePath: 'docs/api-guidelines.md',
          category: 'reference',
          confidence: 0.9,
          topics: expect.arrayContaining(['API Design']),
        })
      );

      // Verify markdown response
      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain('# Context Received');
      expect(text).toContain('api-guidelines.md');
      expect(text).toContain('<hints>');
    });

    it('includes description in reasoning when provided', async () => {
      vi.mocked(ctx.storage.save).mockResolvedValue(createMockEntry());

      await learnToolHandler(
        { paths: ['docs/api.md'], description: 'Our API design standards' },
        ctx
      );

      expect(ctx.storage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          reasoning: expect.stringContaining('Our API design standards'),
        })
      );
    });
  });

  describe('partial failure', () => {
    it('handles one success + one read error', async () => {
      const now = new Date().toISOString();
      vi.mocked(ctx.storage.save).mockResolvedValue(
        createMockEntry({ slug: 'good-file', created_at: now, updated_at: now })
      );

      // First file reads fine, second fails
      mockFsReadFile
        .mockResolvedValueOnce('Good content')
        .mockRejectedValueOnce(new Error('Permission denied'));

      const result = await learnToolHandler({ paths: ['good-file.md', 'bad-file.md'] }, ctx);

      const text = result.content[0].text;
      expect(text).toContain('✅');
      expect(text).toContain('❌');
      expect(text).toContain('Failed to read file');
    });

    it('handles KnowledgeStorageError', async () => {
      vi.mocked(ctx.storage.save).mockRejectedValue(
        new KnowledgeStorageError('Directory not accessible', 'DIR_ERROR')
      );

      const result = await learnToolHandler({ paths: ['test.md'] }, ctx);

      const text = result.content[0].text;
      expect(text).toContain('Storage error');
      expect(text).toContain('DIR_ERROR');
    });
  });

  describe('error handling', () => {
    it('rejects files exceeding size limit', async () => {
      // Create content that exceeds 400KB
      const largeContent = 'x'.repeat(500_000);
      mockFsReadFile.mockResolvedValue(largeContent);

      const result = await learnToolHandler({ paths: ['large-file.md'] }, ctx);

      const text = result.content[0].text;
      expect(text).toContain('File too large');
      // Agent should not have been called
      expect(mockRunAgent).not.toHaveBeenCalled();
    });

    it('handles agent not producing categorization result', async () => {
      mockRunAgent.mockResolvedValue({
        textResponse: 'I could not categorize this file.',
        toolResults: [],
      });

      const result = await learnToolHandler({ paths: ['test.md'] }, ctx);

      const text = result.content[0].text;
      expect(text).toContain('did not produce categorization result');
    });

    it('handles unexpected API errors', async () => {
      mockRunAgent.mockRejectedValue(new Error('API rate limited'));

      const result = await learnToolHandler({ paths: ['test.md'] }, ctx);

      const text = result.content[0].text;
      expect(text).toContain('API rate limited');
    });
  });
});
