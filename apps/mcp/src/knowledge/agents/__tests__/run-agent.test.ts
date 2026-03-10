/**
 * Tests for the shared agentic loop runner
 *
 * Tests the agent loop with a mocked Anthropic client.
 * Verifies: tool routing, max iterations, text extraction, toolResults accumulation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeEntry, KnowledgeStorageService } from '../../storage/types.js';
import { listKnowledgeFilesTool, readKnowledgeFileTool } from '../knowledge-tools.js';
import { type AgentConfig, runAgent } from '../run-agent.js';

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
 * Default usage object for mock responses.
 */
const defaultUsage = {
  input_tokens: 100,
  output_tokens: 50,
};

/**
 * Create a mock Anthropic client.
 */
function createMockAnthropic(responses: Array<Record<string, unknown>>) {
  let callIndex = 0;
  return {
    messages: {
      create: vi.fn().mockImplementation(async () => {
        const response = responses[callIndex];
        callIndex++;
        // Add default usage if not provided
        return { usage: defaultUsage, ...response };
      }),
    },
  } as unknown as import('@anthropic-ai/sdk').default;
}

const baseConfig: AgentConfig = {
  model: 'claude-3-haiku-20240307',
  systemPrompt: 'You are a test agent.',
  tools: [listKnowledgeFilesTool, readKnowledgeFileTool],
  maxIterations: 10,
  maxTokens: 2000,
};

describe('runAgent', () => {
  let storage: KnowledgeStorageService;

  beforeEach(() => {
    storage = createMockStorage([]);
  });

  it('returns text response on end_turn', async () => {
    const anthropic = createMockAnthropic([
      {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'The answer is 42.' }],
      },
    ]);

    const result = await runAgent(baseConfig, 'What is the answer?', storage, anthropic);

    expect(result.textResponse).toBe('The answer is 42.');
    expect(result.toolResults).toEqual([]);
  });

  it('handles tool_use then end_turn cycle', async () => {
    const anthropic = createMockAnthropic([
      // First response: agent wants to list files
      {
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'list_knowledge_files',
            input: {},
          },
        ],
      },
      // Second response: agent gives final answer
      {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'The knowledge base is empty.' }],
      },
    ]);

    const result = await runAgent(baseConfig, 'What files exist?', storage, anthropic);

    expect(result.textResponse).toBe('The knowledge base is empty.');
    expect(anthropic.messages.create).toHaveBeenCalledTimes(2);
  });

  it('routes tool calls to executeKnowledgeTool', async () => {
    const entries: KnowledgeEntry[] = [
      {
        type: 'knowledge',
        title: 'Test Entry',
        summary: 'A test.',
        slug: 'test-entry',
        content: 'Test content.',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        source: { file: 'test.md', project: null, path: null },
        classification: {
          category: 'reference',
          confidence: 0.9,
          reasoning: 'Test',
          topics: ['Testing'],
        },
        status: 'active',
      },
    ];
    storage = createMockStorage(entries);

    const anthropic = createMockAnthropic([
      // Agent lists files
      {
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'list_knowledge_files',
            input: {},
          },
        ],
      },
      // Agent reads a file
      {
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'tool_2',
            name: 'read_knowledge_file',
            input: { slug: 'test-entry' },
          },
        ],
      },
      // Agent gives answer
      {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Found the test entry.' }],
      },
    ]);

    const result = await runAgent(baseConfig, 'Find entries', storage, anthropic);

    expect(result.textResponse).toBe('Found the test entry.');
    expect(storage.list).toHaveBeenCalled();
    expect(storage.get).toHaveBeenCalledWith('test-entry');
  });

  it('respects maxIterations limit', async () => {
    // Create anthropic that always wants more tools
    const anthropic = createMockAnthropic(
      Array(5).fill({
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'tool_loop',
            name: 'list_knowledge_files',
            input: {},
          },
        ],
      })
    );

    const config: AgentConfig = { ...baseConfig, maxIterations: 3 };
    const result = await runAgent(config, 'Keep going', storage, anthropic);

    expect(result.textResponse).toBe('Agent reached maximum iterations without completing.');
    expect(anthropic.messages.create).toHaveBeenCalledTimes(3);
  });

  it('accumulates structured toolResults for select_files_for_context', async () => {
    const selectFilesTool = {
      name: 'select_files_for_context',
      description: 'Select files',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    };

    const config: AgentConfig = {
      ...baseConfig,
      tools: [listKnowledgeFilesTool, readKnowledgeFileTool, selectFilesTool],
    };

    const anthropic = createMockAnthropic([
      // Agent selects files
      {
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'tool_select',
            name: 'select_files_for_context',
            input: {
              selections: [{ slug: 'api-guidelines', reason: 'Has rate limiting info' }],
            },
          },
        ],
      },
      // Agent finishes
      {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Selected 1 file.' }],
      },
    ]);

    const result = await runAgent(config, 'Find relevant files', storage, anthropic);

    expect(result.textResponse).toBe('Selected 1 file.');
    expect(result.toolResults).toHaveLength(1);
    expect(result.toolResults[0]).toMatchObject({
      tool: 'select_files_for_context',
      selections: [{ slug: 'api-guidelines', reason: 'Has rate limiting info' }],
    });
  });

  it('accumulates structured toolResults for categorize_file', async () => {
    const categorizeFileToolDef = {
      name: 'categorize_file',
      description: 'Categorize file',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    };

    const config: AgentConfig = {
      ...baseConfig,
      tools: [categorizeFileToolDef],
    };

    const anthropic = createMockAnthropic([
      {
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'tool_cat',
            name: 'categorize_file',
            input: {
              category: 'policy',
              confidence: 0.92,
              reasoning: 'Contains rules',
              title: 'API Guidelines',
              summary: 'REST API standards.',
              topics: ['API Design'],
              isProjectContext: true,
            },
          },
        ],
      },
      {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Categorized.' }],
      },
    ]);

    const result = await runAgent(config, 'Categorize this', storage, anthropic);

    expect(result.toolResults).toHaveLength(1);
    expect(result.toolResults[0]).toMatchObject({
      tool: 'categorize_file',
      category: 'policy',
      title: 'API Guidelines',
      isProjectContext: true,
    });
  });

  it('handles response with no tool_use blocks and no end_turn', async () => {
    const anthropic = createMockAnthropic([
      {
        stop_reason: 'max_tokens',
        content: [{ type: 'text', text: 'Partial response...' }],
      },
    ]);

    const result = await runAgent(baseConfig, 'Test', storage, anthropic);

    expect(result.textResponse).toBe('Partial response...');
  });

  it('handles response with empty content', async () => {
    const anthropic = createMockAnthropic([
      {
        stop_reason: 'end_turn',
        content: [],
      },
    ]);

    const result = await runAgent(baseConfig, 'Test', storage, anthropic);

    expect(result.textResponse).toBe('');
  });
});
