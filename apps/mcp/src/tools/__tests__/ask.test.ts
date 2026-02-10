import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentResult } from '../../knowledge/index.js';
import { askToolDefinition, askToolHandler } from '../ask.js';
import type { ToolContext } from '../types.js';
import { createMockContext } from './test-utils.js';

// Mock the agent runner
vi.mock('../../knowledge/agents/run-agent.js', () => ({
  runAgent: vi.fn(),
}));

// Mock the context writer (for listContextFiles)
vi.mock('../../knowledge/surfacing/context-writer.js', () => ({
  clearContextDir: vi.fn(),
  writeContextFile: vi.fn(),
  writeContextReadme: vi.fn(),
  listContextFiles: vi.fn().mockResolvedValue([]),
}));

import { runAgent } from '../../knowledge/agents/run-agent.js';
import { listContextFiles } from '../../knowledge/surfacing/context-writer.js';

const mockRunAgent = vi.mocked(runAgent);
const mockListContextFiles = vi.mocked(listContextFiles);

describe('askToolDefinition', () => {
  it('has the correct name', () => {
    expect(askToolDefinition.name).toBe('kahuna_ask');
  });

  it('requires question', () => {
    expect(askToolDefinition.inputSchema.required).toContain('question');
  });

  it('has question as string parameter', () => {
    const questionSchema = askToolDefinition.inputSchema.properties.question;
    expect(questionSchema.type).toBe('string');
  });

  it('has description with <examples> and <hints>', () => {
    expect(askToolDefinition.description).toContain('<examples>');
    expect(askToolDefinition.description).toContain('<hints>');
  });
});

describe('askToolHandler', () => {
  let ctx: ToolContext;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    mockListContextFiles.mockResolvedValue([]);
  });

  describe('input validation', () => {
    it('returns error when question is missing', async () => {
      const result = await askToolHandler({}, ctx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing or empty question');
    });

    it('returns error when question is empty string', async () => {
      const result = await askToolHandler({ question: '' }, ctx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing or empty question');
    });

    it('returns error when question is only whitespace', async () => {
      const result = await askToolHandler({ question: '   ' }, ctx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing or empty question');
    });
  });

  describe('successful answer', () => {
    it('returns markdown response with question, answer, and hints', async () => {
      mockRunAgent.mockResolvedValue({
        textResponse:
          'Based on the knowledge base, the answer is: We use Vitest for testing.\n\n**Source:** testing-guide.mdc',
        toolResults: [],
      });

      const result = await askToolHandler({ question: 'What testing framework do we use?' }, ctx);

      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain('# Answer');
      expect(text).toContain('**Question:** What testing framework do we use?');
      expect(text).toContain('Vitest');
      expect(text).toContain('<hints>');
    });

    it('passes question to runAgent as user message', async () => {
      mockRunAgent.mockResolvedValue({
        textResponse: 'Some answer',
        toolResults: [],
      });

      await askToolHandler({ question: 'Why did we choose X?' }, ctx);

      expect(mockRunAgent).toHaveBeenCalledOnce();
      expect(mockRunAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          systemPrompt: expect.any(String),
          tools: expect.any(Array),
        }),
        'Why did we choose X?',
        ctx.storage,
        ctx.anthropic
      );
    });
  });

  describe('with context files', () => {
    it('includes context files info in system prompt', async () => {
      mockListContextFiles.mockResolvedValue(['api-guidelines.md', 'error-patterns.md']);

      mockRunAgent.mockResolvedValue({
        textResponse: 'Answer based on KB',
        toolResults: [],
      });

      await askToolHandler({ question: 'Test question' }, ctx);

      // The system prompt should include context file info
      expect(mockRunAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('api-guidelines.md'),
        }),
        expect.any(String),
        ctx.storage,
        ctx.anthropic
      );
    });
  });

  describe('error handling', () => {
    it('handles agent errors gracefully', async () => {
      mockRunAgent.mockRejectedValue(new Error('API rate limited'));

      const result = await askToolHandler({ question: 'Test question' }, ctx);

      expect(result.isError).toBe(true);
      const text = result.content[0].text;
      expect(text).toContain('Failed to answer question');
      expect(text).toContain('API rate limited');
    });
  });
});
