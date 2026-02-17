import * as fs from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentResult } from '../../knowledge/index.js';
import { askToolDefinition, askToolHandler } from '../ask.js';
import type { ToolContext } from '../types.js';
import { createMockContext } from './test-utils.js';

// Mock the agent runner
vi.mock('../../knowledge/agents/run-agent.js', () => ({
  runAgent: vi.fn(),
}));

// Mock fs/promises for .context-guide.md reading
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { runAgent } from '../../knowledge/agents/run-agent.js';

const mockReadFile = vi.mocked(fs.readFile);

const mockRunAgent = vi.mocked(runAgent);

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
    // Default: no .context-guide.md exists
    mockReadFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));
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

    it('includes referenced KB files in system prompt when .context-guide.md exists', async () => {
      // Mock .context-guide.md with KB file references
      const contextGuideContent = `# Context for: Build authentication system

Surfaced from Kahuna knowledge base on 2026-02-12.

## Knowledge Base Files

| Topic | KB Path | Why Relevant |
|-------|---------|--------------|
| Authentication Patterns | [/home/user/.kahuna/knowledge/auth-patterns.mdc](/home/user/.kahuna/knowledge/auth-patterns.mdc) | Contains JWT implementation patterns |
| Security Best Practices | [/home/user/.kahuna/knowledge/security-guide.mdc](/home/user/.kahuna/knowledge/security-guide.mdc) | Security requirements for auth |

## Start Here

1. Review /home/user/.kahuna/knowledge/auth-patterns.mdc — Contains JWT implementation patterns
2. Review /home/user/.kahuna/knowledge/security-guide.mdc — Security requirements for auth
`;

      mockReadFile.mockResolvedValue(contextGuideContent);
      mockRunAgent.mockResolvedValue({
        textResponse: 'Answer based on KB',
        toolResults: [],
      });

      await askToolHandler({ question: 'How should I implement auth?' }, ctx);

      expect(mockRunAgent).toHaveBeenCalledOnce();
      const systemPrompt = mockRunAgent.mock.calls[0][0].systemPrompt;

      // Verify the system prompt includes the referenced KB files
      expect(systemPrompt).toContain('/home/user/.kahuna/knowledge/auth-patterns.mdc');
      expect(systemPrompt).toContain('/home/user/.kahuna/knowledge/security-guide.mdc');
      expect(systemPrompt).toContain(
        'already has these KB files referenced in their .context-guide.md'
      );
    });

    it('handles missing .context-guide.md gracefully', async () => {
      // mockReadFile already rejects by default in beforeEach
      mockRunAgent.mockResolvedValue({
        textResponse: 'Answer without context',
        toolResults: [],
      });

      await askToolHandler({ question: 'Test question' }, ctx);

      expect(mockRunAgent).toHaveBeenCalledOnce();
      const systemPrompt = mockRunAgent.mock.calls[0][0].systemPrompt;

      // Verify the system prompt doesn't include referenced files section
      expect(systemPrompt).not.toContain('already has these KB files referenced');
    });

    it('extracts multiple KB file paths from .context-guide.md', async () => {
      const contextGuideContent = `# Context for: Multi-file task

## Knowledge Base Files

| Topic | KB Path | Why Relevant |
|-------|---------|--------------|
| File 1 | [/path/to/file1.mdc](/path/to/file1.mdc) | Reason 1 |
| File 2 | [/path/to/file2.mdc](/path/to/file2.mdc) | Reason 2 |
| File 3 | [/path/to/file3.mdc](/path/to/file3.mdc) | Reason 3 |
`;

      mockReadFile.mockResolvedValue(contextGuideContent);
      mockRunAgent.mockResolvedValue({
        textResponse: 'Answer',
        toolResults: [],
      });

      await askToolHandler({ question: 'Test' }, ctx);

      const systemPrompt = mockRunAgent.mock.calls[0][0].systemPrompt;
      expect(systemPrompt).toContain('/path/to/file1.mdc');
      expect(systemPrompt).toContain('/path/to/file2.mdc');
      expect(systemPrompt).toContain('/path/to/file3.mdc');
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
