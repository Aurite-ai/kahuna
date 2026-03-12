/**
 * Perplexity API Integration
 *
 * Provides real-time web search capabilities for the integration research agent.
 * Uses Perplexity's online models which have access to current web information.
 *
 * API Reference: https://docs.perplexity.ai/api-reference/chat-completions
 *
 * This integration is behind a feature flag (ENABLE_PERPLEXITY_INTEGRATION).
 */

import { FEATURE_FLAGS } from '../../config.js';
import type { WebSearchResult } from './research-tools.js';

// =============================================================================
// TYPES
// =============================================================================

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Note: PerplexityCitation kept for future use when parsing inline citations
// interface PerplexityCitation {
//   url: string;
//   text?: string;
// }

interface PerplexityChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: PerplexityChoice[];
  citations?: string[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface PerplexitySearchResult {
  answer: string;
  citations: string[];
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Use the sonar model which has online search capabilities
const PERPLEXITY_MODEL = 'llama-3.1-sonar-small-128k-online';

// =============================================================================
// SEARCH FUNCTION
// =============================================================================

/**
 * Search for information using Perplexity's online model.
 *
 * @param query - The search query
 * @param systemPrompt - Optional system prompt to guide the search
 * @returns Search results with answer and citations
 */
export async function searchWithPerplexity(
  query: string,
  systemPrompt?: string
): Promise<PerplexitySearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error(
      'PERPLEXITY_API_KEY environment variable is not set. ' +
        'Get your API key from https://www.perplexity.ai/settings/api'
    );
  }

  const messages: PerplexityMessage[] = [];

  // Add system prompt if provided
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  } else {
    messages.push({
      role: 'system',
      content:
        'You are a helpful assistant that provides accurate, concise information about APIs and software integrations. ' +
        'Focus on technical details like authentication methods, API endpoints, and required credentials. ' +
        'Always cite your sources.',
    });
  }

  // Add the user query
  messages.push({
    role: 'user',
    content: query,
  });

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages,
      max_tokens: 1024,
      temperature: 0.2, // Lower temperature for more factual responses
      return_citations: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as PerplexityResponse;

  // Extract the answer and citations
  const answer = data.choices[0]?.message?.content || 'No answer returned';
  const citations = data.citations || [];

  return {
    answer,
    citations,
  };
}

// =============================================================================
// WEB SEARCH ADAPTER
// =============================================================================

/**
 * Create a web search function compatible with ResearchToolContext.
 * This adapter converts Perplexity results to WebSearchResult format.
 */
export function createPerplexityWebSearch(): (query: string) => Promise<WebSearchResult[]> {
  return async (query: string): Promise<WebSearchResult[]> => {
    try {
      const result = await searchWithPerplexity(query);

      // Convert Perplexity response to WebSearchResult format
      // The answer is one comprehensive result with all citations
      const searchResults: WebSearchResult[] = [
        {
          title: 'Search Results',
          url: result.citations[0] || 'https://perplexity.ai',
          snippet: result.answer,
        },
      ];

      // Add individual citations as separate results
      for (let i = 0; i < result.citations.length && i < 5; i++) {
        const citation = result.citations[i];
        searchResults.push({
          title: `Source ${i + 1}`,
          url: citation,
          snippet: `Reference from ${new URL(citation).hostname}`,
        });
      }

      return searchResults;
    } catch (error) {
      console.error('[Perplexity] Search error:', error);
      return [];
    }
  };
}

// =============================================================================
// URL FETCHING
// =============================================================================

/**
 * Use Perplexity to summarize content from a URL.
 * This is an alternative to directly fetching HTML.
 */
export async function fetchUrlWithPerplexity(url: string, focus?: string): Promise<string> {
  const query = focus
    ? `Read and summarize the content from ${url}, focusing on: ${focus}`
    : `Read and summarize the key information from ${url}, especially API documentation, authentication methods, and available endpoints.`;

  const result = await searchWithPerplexity(query);

  return `## Content from ${url}\n\n${result.answer}\n\n**Sources:** ${result.citations.join(', ')}`;
}

/**
 * Create a URL fetch function compatible with ResearchToolContext.
 */
export function createPerplexityUrlFetch(): (url: string) => Promise<string> {
  return async (url: string): Promise<string> => {
    try {
      return await fetchUrlWithPerplexity(url);
    } catch (error) {
      console.error('[Perplexity] URL fetch error:', error);
      return `Failed to fetch content from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };
}

// =============================================================================
// INTEGRATION RESEARCH HELPERS
// =============================================================================

/**
 * Search for API documentation for a specific service.
 */
export async function searchApiDocs(serviceName: string): Promise<PerplexitySearchResult> {
  const query = `Find the official API documentation for ${serviceName}. Include:
1. The official docs URL
2. API base URL
3. Authentication method (API key, OAuth, Bearer token, etc.)
4. How to obtain API credentials`;

  return searchWithPerplexity(query);
}

/**
 * Search for authentication details for a specific service.
 */
export async function searchAuthDetails(serviceName: string): Promise<PerplexitySearchResult> {
  const query = `What authentication method does the ${serviceName} API use? 
Provide specific details about:
1. Auth type (API key, OAuth 2.0, Bearer token, Basic auth, etc.)
2. Required credentials (API key name, token name, etc.)
3. Where to get these credentials (developer console URL)
4. Any required headers or parameters`;

  return searchWithPerplexity(query);
}

/**
 * Search for API endpoints and operations.
 */
export async function searchEndpoints(serviceName: string): Promise<PerplexitySearchResult> {
  const query = `List the main API endpoints and operations for ${serviceName}. 
For each endpoint, provide:
1. HTTP method (GET, POST, etc.)
2. Endpoint path
3. Brief description of what it does
Focus on the 5-10 most commonly used endpoints.`;

  return searchWithPerplexity(query);
}

/**
 * Search for rate limits and quotas.
 */
export async function searchRateLimits(serviceName: string): Promise<PerplexitySearchResult> {
  const query = `What are the rate limits and quotas for the ${serviceName} API?
Include:
1. Requests per minute/hour/day
2. Any tier-based limits
3. How rate limits are communicated (headers, etc.)`;

  return searchWithPerplexity(query);
}

// =============================================================================
// CHECK IF PERPLEXITY IS AVAILABLE
// =============================================================================

/**
 * Check if Perplexity API is configured and available.
 *
 * Returns true only if:
 * 1. ENABLE_PERPLEXITY_INTEGRATION feature flag is set to 'true'
 * 2. PERPLEXITY_API_KEY environment variable is set
 *
 * When this returns false, integration discovery falls back to Claude's training knowledge.
 */
export function isPerplexityAvailable(): boolean {
  // Feature flag must be explicitly enabled
  if (!FEATURE_FLAGS.ENABLE_PERPLEXITY_INTEGRATION) {
    return false;
  }

  // API key must also be present
  return !!process.env.PERPLEXITY_API_KEY;
}
