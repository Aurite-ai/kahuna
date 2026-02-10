import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeStorageService } from '../../storage/index.js';
import { askToolDefinition, askToolHandler } from '../ask.js';
import type { ToolContext } from '../types.js';
import { createMockContext, createMockEntry } from './test-utils.js';

// Mock Anthropic client - simulates agentic tool use flow
const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}));

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

  it('has a helpful description', () => {
    expect(askToolDefinition.description).toContain('Q&A');
    expect(askToolDefinition.description).toContain('knowledge base');
  });
});

describe('askToolHandler', () => {
  let ctx: ToolContext;
  let mockStorage: KnowledgeStorageService;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    mockStorage = ctx.storage;
    // Mock environment with API key for Anthropic SDK
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetAllMocks();
  });

  describe('input validation', () => {
    it('returns error when question is missing', async () => {
      const result = await askToolHandler({}, ctx);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Missing or empty question');
    });

    it('returns error when question is empty string', async () => {
      const result = await askToolHandler({ question: '' }, ctx);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Missing or empty question');
    });

    it('returns error when question is only whitespace', async () => {
      const result = await askToolHandler({ question: '   ' }, ctx);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Missing or empty question');
    });
  });

  describe('agentic flow', () => {
    it('calls synthesizeAnswer with Claude tool use loop', async () => {
      // Simulate agent listing files, then returning final answer
      mockCreate
        .mockResolvedValueOnce({
          stop_reason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'tool_1',
              name: 'list_knowledge_files',
              input: {},
            },
          ],
        })
        .mockResolvedValueOnce({
          stop_reason: 'end_turn',
          content: [
            {
              type: 'text',
              text: 'Based on the knowledge base, the answer is: Testing is done with Vitest.',
            },
          ],
        });

      vi.mocked(mockStorage.list).mockResolvedValue([createMockEntry()]);

      const result = await askToolHandler(
        { question: 'What testing framework do we use?' },
        ctx
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.answer).toContain('Testing is done with Vitest');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('agent can read specific files', async () => {
      // Simulate: list files -> read file -> return answer
      mockCreate
        .mockResolvedValueOnce({
          stop_reason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'tool_1',
              name: 'list_knowledge_files',
              input: {},
            },
          ],
        })
        .mockResolvedValueOnce({
          stop_reason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'tool_2',
              name: 'read_knowledge_file',
              input: { slug: 'test-entry' },
            },
          ],
        })
        .mockResolvedValueOnce({
          stop_reason: 'end_turn',
          content: [
            {
              type: 'text',
              text: 'According to the Test Entry document, the answer is in the content.',
            },
          ],
        });

      const testEntry = createMockEntry();
      vi.mocked(mockStorage.list).mockResolvedValue([testEntry]);
      vi.mocked(mockStorage.get).mockResolvedValue(testEntry);

      const result = await askToolHandler({ question: 'What is in the test entry?' }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(mockStorage.get).toHaveBeenCalledWith('test-entry');
    });

    it('handles empty knowledge base', async () => {
      mockCreate
        .mockResolvedValueOnce({
          stop_reason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'tool_1',
              name: 'list_knowledge_files',
              input: {},
            },
          ],
        })
        .mockResolvedValueOnce({
          stop_reason: 'end_turn',
          content: [
            {
              type: 'text',
              text: "I couldn't find information about this in the knowledge base.",
            },
          ],
        });

      vi.mocked(mockStorage.list).mockResolvedValue([]);

      const result = await askToolHandler({ question: 'What is the API rate limit?' }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.answer).toContain("couldn't find");
    });

    it('handles file not found gracefully', async () => {
      mockCreate
        .mockResolvedValueOnce({
          stop_reason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'tool_1',
              name: 'read_knowledge_file',
              input: { slug: 'nonexistent' },
            },
          ],
        })
        .mockResolvedValueOnce({
          stop_reason: 'end_turn',
          content: [
            {
              type: 'text',
              text: 'The file was not found in the knowledge base.',
            },
          ],
        });

      vi.mocked(mockStorage.get).mockResolvedValue(null);

      const result = await askToolHandler({ question: 'Read a missing file' }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(mockStorage.get).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('response format', () => {
    it('returns question and answer in response', async () => {
      mockCreate.mockResolvedValueOnce({
        stop_reason: 'end_turn',
        content: [
          {
            type: 'text',
            text: 'The answer to your question is: Use TypeScript.',
          },
        ],
      });

      const result = await askToolHandler({ question: 'What language do we use?' }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.question).toBe('What language do we use?');
      expect(response.data.answer).toBe('The answer to your question is: Use TypeScript.');
    });
  });

  describe('error handling', () => {
    it('handles storage errors gracefully', async () => {
      mockCreate.mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'list_knowledge_files',
            input: {},
          },
        ],
      });

      vi.mocked(mockStorage.list).mockRejectedValue(new Error('Storage unavailable'));

      const result = await askToolHandler({ question: 'What is the API rate limit?' }, ctx);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Failed to answer question');
      expect(response.error).toContain('Storage unavailable');
    });

    it('handles Anthropic API errors', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limited'));

      const result = await askToolHandler({ question: 'Test question' }, ctx);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Failed to answer question');
    });

    it('handles max iterations gracefully', async () => {
      // Always return tool use to hit max iterations
      mockCreate.mockResolvedValue({
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'tool_loop',
            name: 'list_knowledge_files',
            input: {},
          },
        ],
      });

      vi.mocked(mockStorage.list).mockResolvedValue([]);

      const result = await askToolHandler({ question: 'Test max iterations' }, ctx);

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.answer).toContain('maximum iterations');
    });
  });
});
