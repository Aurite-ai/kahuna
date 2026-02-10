import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentResult } from '../../knowledge/index.js';
import { prepareContextToolDefinition, prepareContextToolHandler } from '../prepare-context.js';
import type { ToolContext } from '../types.js';
import { createMockContext, createMockEntry } from './test-utils.js';

// Mock the agent runner
vi.mock('../../knowledge/agents/run-agent.js', () => ({
  runAgent: vi.fn(),
}));

// Mock the context writer
vi.mock('../../knowledge/surfacing/context-writer.js', () => ({
  clearContextDir: vi.fn(),
  writeContextFile: vi.fn(),
  writeContextReadme: vi.fn(),
  listContextFiles: vi.fn(),
  shouldReferenceLocally: vi.fn().mockResolvedValue(false), // Default: copy files to context/
  getRelativeLocalPath: vi.fn((path) => path),
}));

// Mock generateMdcFile from storage utils
vi.mock('../../knowledge/storage/utils.js', () => ({
  generateMdcFile: vi.fn().mockReturnValue('---\ntype: knowledge\n---\n# Content'),
  stripFrontmatter: vi.fn().mockReturnValue('# Content'),
  generateSlug: vi.fn(),
  validateCategory: vi.fn(),
  parseMdcFile: vi.fn(),
}));

import { runAgent } from '../../knowledge/agents/run-agent.js';
import {
  clearContextDir,
  writeContextFile,
  writeContextReadme,
} from '../../knowledge/surfacing/context-writer.js';

const mockRunAgent = vi.mocked(runAgent);
const mockClearContextDir = vi.mocked(clearContextDir);
const mockWriteContextFile = vi.mocked(writeContextFile);
const mockWriteContextReadme = vi.mocked(writeContextReadme);

/**
 * Helper: Build a mock AgentResult with select_files_for_context.
 */
function mockRetrievalResult(selections: Array<{ slug: string; reason: string }>): AgentResult {
  return {
    textResponse: 'I selected the relevant files.',
    toolResults: [
      {
        tool: 'select_files_for_context',
        selections,
      },
    ],
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

  it('has description with <examples> and <hints>', () => {
    expect(prepareContextToolDefinition.description).toContain('<examples>');
    expect(prepareContextToolDefinition.description).toContain('<hints>');
  });
});

describe('prepareContextToolHandler', () => {
  let ctx: ToolContext;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();

    // Default: context writer mocks resolve
    mockClearContextDir.mockResolvedValue(undefined);
    mockWriteContextFile.mockResolvedValue(undefined);
    mockWriteContextReadme.mockResolvedValue(undefined);
  });

  describe('input validation', () => {
    it('returns error when task is missing', async () => {
      const result = await prepareContextToolHandler({}, ctx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('task');
    });
  });

  describe('empty KB', () => {
    it('returns no-knowledge markdown when KB is empty', async () => {
      vi.mocked(ctx.storage.list).mockResolvedValue([]);

      const result = await prepareContextToolHandler({ task: 'test task' }, ctx);

      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain('No Context Available');
      expect(text).toContain('knowledge base is empty');
      expect(text).toContain('<hints>');
      expect(text).toContain('kahuna_learn');
      // Agent should NOT be called
      expect(mockRunAgent).not.toHaveBeenCalled();
    });
  });

  describe('successful retrieval', () => {
    it('runs agent, writes to context/, returns markdown', async () => {
      const entries = [
        createMockEntry({ slug: 'api-guidelines', title: 'API Guidelines' }),
        createMockEntry({ slug: 'error-patterns', title: 'Error Handling Patterns' }),
      ];
      vi.mocked(ctx.storage.list).mockResolvedValue(entries);
      vi.mocked(ctx.storage.get)
        .mockResolvedValueOnce(entries[0])
        .mockResolvedValueOnce(entries[1]);

      mockRunAgent.mockResolvedValue(
        mockRetrievalResult([
          { slug: 'api-guidelines', reason: 'Contains API design standards' },
          { slug: 'error-patterns', reason: 'Error handling patterns' },
        ])
      );

      const result = await prepareContextToolHandler({ task: 'Add rate limiting' }, ctx);

      // Verify agent was called
      expect(mockRunAgent).toHaveBeenCalledOnce();

      // Verify context writer was called
      expect(mockClearContextDir).toHaveBeenCalledOnce();
      expect(mockWriteContextFile).toHaveBeenCalledTimes(2);
      expect(mockWriteContextReadme).toHaveBeenCalledOnce();
      expect(mockWriteContextReadme).toHaveBeenCalledWith(
        expect.any(String),
        'Add rate limiting',
        expect.arrayContaining([
          expect.objectContaining({ slug: 'api-guidelines' }),
          expect.objectContaining({ slug: 'error-patterns' }),
        ]),
        undefined, // referencedFiles (none since shouldReferenceLocally returns false)
        undefined // frameworkResult (no framework selected)
      );

      // Verify markdown response
      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain('# Context Ready');
      expect(text).toContain('API Guidelines');
      expect(text).toContain('context/api-guidelines.md');
      expect(text).toContain('<hints>');
    });
  });

  describe('no relevant files', () => {
    it('returns no-relevant markdown when agent selects nothing', async () => {
      vi.mocked(ctx.storage.list).mockResolvedValue([createMockEntry({ slug: 'unrelated' })]);

      mockRunAgent.mockResolvedValue(mockRetrievalResult([]));

      const result = await prepareContextToolHandler(
        { task: 'Something completely unrelated' },
        ctx
      );

      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain('No Relevant Context');
      expect(text).toContain('1 files');
      expect(text).toContain('<hints>');

      // Context writer should NOT be called
      expect(mockClearContextDir).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles storage errors gracefully', async () => {
      vi.mocked(ctx.storage.list).mockRejectedValue(new Error('Storage unavailable'));

      const result = await prepareContextToolHandler({ task: 'test task' }, ctx);

      expect(result.isError).toBe(true);
      const text = result.content[0].text;
      expect(text).toContain('Failed to prepare context');
      expect(text).toContain('Storage unavailable');
    });
  });
});
