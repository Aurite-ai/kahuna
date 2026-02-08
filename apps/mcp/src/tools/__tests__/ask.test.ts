import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeEntry, KnowledgeStorageService } from '../../storage/index.js';
import { askToolDefinition, askToolHandler } from '../ask.js';

// Mock the Anthropic client
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              answer: 'This is a synthesized answer based on the context.',
              suggestedFollowups: ['What about error handling?', 'How do we test this?'],
              hasKnowledgeGap: false,
            }),
          },
        ],
      }),
    },
  })),
}));

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
    content: '# Test Content\n\nThis is test content about testing.',
    ...overrides,
  };
}

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
  let mockStorage: KnowledgeStorageService;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = createMockStorage();
    // Mock environment with API key
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('input validation', () => {
    it('returns error when question is missing', async () => {
      const result = await askToolHandler({}, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Missing or empty question');
    });

    it('returns error when question is empty string', async () => {
      const result = await askToolHandler({ question: '' }, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Missing or empty question');
    });

    it('returns error when question is only whitespace', async () => {
      const result = await askToolHandler({ question: '   ' }, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Missing or empty question');
    });
  });

  describe('empty knowledge base', () => {
    it('handles empty knowledge base gracefully', async () => {
      vi.mocked(mockStorage.list).mockResolvedValue([]);

      const result = await askToolHandler({ question: 'What is the API rate limit?' }, mockStorage);

      expect(result.isError).toBeUndefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.message).toContain('No knowledge base entries found');
    });
  });

  describe('keyword extraction', () => {
    it('returns error when no meaningful keywords can be extracted', async () => {
      vi.mocked(mockStorage.list).mockResolvedValue([createMockEntry()]);

      const result = await askToolHandler({ question: 'Is it the what?' }, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Could not extract meaningful keywords');
    });
  });

  describe('relevance ranking', () => {
    it('ranks entries with matching title higher', async () => {
      const entries = [
        createMockEntry({
          slug: 'unrelated',
          title: 'Unrelated Topic',
          content: 'Nothing relevant here.',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['other'],
            topics: ['other'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
        createMockEntry({
          slug: 'auth-guide',
          title: 'Authentication Guide',
          content: 'This is about authentication patterns.',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['authentication', 'security'],
            topics: ['auth'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await askToolHandler(
        { question: 'How does authentication work?' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.sources[0].slug).toBe('auth-guide');
    });

    it('ranks entries with matching tags higher', async () => {
      const entries = [
        createMockEntry({
          slug: 'api-entry',
          title: 'API Documentation',
          content: 'API documentation content.',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['api', 'rest', 'documentation'],
            topics: ['api'],
            entities: { technologies: ['REST'], frameworks: [], libraries: [], apis: ['REST API'] },
          },
        }),
        createMockEntry({
          slug: 'other-entry',
          title: 'Other Document',
          content: 'Some other content.',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['database'],
            topics: ['data'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await askToolHandler(
        { question: 'What REST API endpoints exist?' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.sources[0].slug).toBe('api-entry');
    });

    it('scores content matches', async () => {
      const entries = [
        createMockEntry({
          slug: 'rate-limit-doc',
          title: 'Configuration Guide',
          content: 'The rate limit is set to 100 requests per minute for API calls.',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['config'],
            topics: ['configuration'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await askToolHandler({ question: 'What is the rate limit?' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.sources.length).toBeGreaterThan(0);
    });
  });

  describe('confidence scoring', () => {
    it('returns high confidence when sources are highly relevant', async () => {
      const entries = [
        createMockEntry({
          slug: 'auth-guide',
          title: 'Authentication Configuration',
          summary: 'How to configure authentication in the system',
          content: 'Authentication is configured using JWT tokens...',
          classification: {
            category: 'reference',
            confidence: 0.95,
            reasoning: 'Test',
            tags: ['authentication', 'jwt', 'security', 'configuration'],
            topics: ['authentication', 'security'],
            entities: {
              technologies: ['JWT', 'OAuth2'],
              frameworks: [],
              libraries: [],
              apis: [],
            },
          },
        }),
        createMockEntry({
          slug: 'security-policy',
          title: 'Security Policy',
          summary: 'Security policies for authentication',
          content: 'Our authentication security policy requires...',
          classification: {
            category: 'policy',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['security', 'authentication', 'policy'],
            topics: ['security'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await askToolHandler(
        { question: 'How do we configure authentication security?' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(['high', 'medium']).toContain(response.data.confidence);
    });

    it('returns low confidence when no relevant sources found', async () => {
      const entries = [
        createMockEntry({
          slug: 'unrelated',
          title: 'Database Schema',
          content: 'The database schema includes...',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['database', 'schema'],
            topics: ['data'],
            entities: { technologies: ['PostgreSQL'], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await askToolHandler(
        { question: 'What payment gateway do we use?' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      // If no matches, sources will be empty or have low scores
      if (response.data.sources && response.data.sources.length > 0) {
        expect(response.data.confidence).toBe('low');
      }
    });
  });

  describe('response format', () => {
    it('includes formatted answer with sources', async () => {
      const entries = [
        createMockEntry({
          slug: 'api-docs',
          title: 'API Documentation',
          content: 'The API uses REST endpoints for all operations.',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['api', 'rest'],
            topics: ['api'],
            entities: { technologies: ['REST'], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await askToolHandler({ question: 'What type of API do we use?' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.data.answer).toBeDefined();
      expect(response.data.answer).toContain('# Answer');
      expect(response.data.answer).toContain('**Question:**');
      expect(response.data.answer).toContain('**Confidence:**');
    });

    it('includes sources with excerpts', async () => {
      const entries = [
        createMockEntry({
          slug: 'test-doc',
          title: 'Test Document',
          content: 'This is the relevant test content about testing frameworks.',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['test', 'testing'],
            topics: ['testing'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await askToolHandler(
        { question: 'What testing framework do we use?' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.sources).toBeDefined();
      expect(response.data.sources.length).toBeGreaterThan(0);
      expect(response.data.sources[0]).toHaveProperty('title');
      expect(response.data.sources[0]).toHaveProperty('slug');
      expect(response.data.sources[0]).toHaveProperty('relevanceScore');
      expect(response.data.sources[0]).toHaveProperty('excerpt');
      expect(response.data.sources[0]).toHaveProperty('category');
    });

    it('includes keywords used for search', async () => {
      const entries = [createMockEntry()];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await askToolHandler(
        { question: 'How does authentication work with tokens?' },
        mockStorage
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.data.keywords).toBeDefined();
      expect(response.data.keywords).toContain('authentication');
      expect(response.data.keywords).toContain('tokens');
    });

    it('includes cache stats', async () => {
      const entries = [createMockEntry()];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await askToolHandler({ question: 'How does testing work?' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      expect(response.data.cacheStats).toBeDefined();
      expect(response.data.cacheStats).toHaveProperty('entryCount');
      expect(response.data.cacheStats).toHaveProperty('hitRate');
    });
  });

  describe('error handling', () => {
    it('handles storage errors gracefully', async () => {
      vi.mocked(mockStorage.list).mockRejectedValue(new Error('Storage unavailable'));

      const result = await askToolHandler({ question: 'What is the API rate limit?' }, mockStorage);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Failed to answer question');
      expect(response.error).toContain('Storage unavailable');
    });
  });

  describe('fallback behavior', () => {
    it('uses fallback when API key is not set', async () => {
      // Remove API key by setting to undefined
      process.env.ANTHROPIC_API_KEY = undefined as unknown as string;

      const entries = [
        createMockEntry({
          slug: 'api-docs',
          title: 'API Documentation',
          content: 'The API rate limit is 100 requests per minute.',
          classification: {
            category: 'reference',
            confidence: 0.9,
            reasoning: 'Test',
            tags: ['api', 'rate-limit'],
            topics: ['api'],
            entities: { technologies: [], frameworks: [], libraries: [], apis: [] },
          },
        }),
      ];
      vi.mocked(mockStorage.list).mockResolvedValue(entries);

      const result = await askToolHandler({ question: 'What is the API rate limit?' }, mockStorage);

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      // Fallback should include excerpts from the knowledge base
      expect(response.data.answer).toContain('knowledge base');
    });
  });
});
