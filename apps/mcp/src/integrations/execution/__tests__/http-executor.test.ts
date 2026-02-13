/**
 * Tests for HTTP Executor
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_HTTP_OPERATION_CONFIGS,
  buildAuthHeaders,
  buildPathFromTemplate,
  buildUrl,
  executeHttpRequest,
  mapHttpStatusToErrorCode,
} from '../http-executor.js';
import { RetryableError } from '../retry.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildAuthHeaders', () => {
  describe('api_key', () => {
    it('should add API key header with default name', () => {
      const headers = buildAuthHeaders('api_key', { api_key: 'test-key-123' });
      expect(headers['X-API-Key']).toBe('test-key-123');
    });

    it('should use custom header name if provided', () => {
      const headers = buildAuthHeaders('api_key', {
        api_key: 'test-key-123',
        api_key_header: 'X-Custom-Key',
      });
      expect(headers['X-Custom-Key']).toBe('test-key-123');
    });

    it('should handle alternative key names', () => {
      expect(buildAuthHeaders('api_key', { apiKey: 'key1' })['X-API-Key']).toBe('key1');
      expect(buildAuthHeaders('api_key', { key: 'key2' })['X-API-Key']).toBe('key2');
    });
  });

  describe('bearer_token', () => {
    it('should add Bearer authorization header', () => {
      const headers = buildAuthHeaders('bearer_token', { token: 'abc123' });
      expect(headers.Authorization).toBe('Bearer abc123');
    });

    it('should handle alternative token names', () => {
      expect(buildAuthHeaders('bearer_token', { access_token: 't1' }).Authorization).toBe(
        'Bearer t1'
      );
      expect(buildAuthHeaders('bearer_token', { bearer_token: 't2' }).Authorization).toBe(
        'Bearer t2'
      );
      expect(buildAuthHeaders('bearer_token', { bot_token: 't3' }).Authorization).toBe('Bearer t3');
    });
  });

  describe('basic_auth', () => {
    it('should add Basic authorization header', () => {
      const headers = buildAuthHeaders('basic_auth', {
        username: 'user',
        password: 'pass',
      });
      const expected = Buffer.from('user:pass').toString('base64');
      expect(headers.Authorization).toBe(`Basic ${expected}`);
    });

    it('should handle alternative credential names', () => {
      const headers = buildAuthHeaders('basic_auth', { user: 'u', pass: 'p' });
      expect(headers.Authorization).toContain('Basic');
    });

    it('should not add header if credentials incomplete', () => {
      const headers = buildAuthHeaders('basic_auth', { username: 'user' });
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe('oauth2', () => {
    it('should add Bearer authorization header', () => {
      const headers = buildAuthHeaders('oauth2', { access_token: 'oauth-token' });
      expect(headers.Authorization).toBe('Bearer oauth-token');
    });
  });

  describe('custom', () => {
    it('should add custom authorization header', () => {
      const headers = buildAuthHeaders('custom', {
        authorization: 'Custom auth-value',
      });
      expect(headers.Authorization).toBe('Custom auth-value');
    });
  });

  describe('none', () => {
    it('should return empty headers', () => {
      const headers = buildAuthHeaders('none', {});
      expect(Object.keys(headers)).toHaveLength(0);
    });
  });
});

describe('buildUrl', () => {
  it('should build URL from base and path', () => {
    expect(buildUrl('https://api.example.com', '/users')).toBe('https://api.example.com/users');
  });

  it('should normalize trailing slashes', () => {
    expect(buildUrl('https://api.example.com/', '/users')).toBe('https://api.example.com/users');
    expect(buildUrl('https://api.example.com///', '/users')).toBe('https://api.example.com/users');
  });

  it('should normalize missing leading slash in path', () => {
    expect(buildUrl('https://api.example.com', 'users')).toBe('https://api.example.com/users');
  });

  it('should add query parameters', () => {
    const url = buildUrl('https://api.example.com', '/search', {
      q: 'test',
      limit: 10,
      active: true,
    });
    expect(url).toContain('?');
    expect(url).toContain('q=test');
    expect(url).toContain('limit=10');
    expect(url).toContain('active=true');
  });

  it('should not add query string for empty params', () => {
    const url = buildUrl('https://api.example.com', '/users', {});
    expect(url).toBe('https://api.example.com/users');
  });
});

describe('buildPathFromTemplate', () => {
  it('should replace path parameters', () => {
    expect(buildPathFromTemplate('/{id}', { id: '123' })).toBe('/123');
  });

  it('should replace multiple parameters', () => {
    expect(
      buildPathFromTemplate('/users/{userId}/posts/{postId}', { userId: 'u1', postId: 'p2' })
    ).toBe('/users/u1/posts/p2');
  });

  it('should URL encode parameter values', () => {
    expect(buildPathFromTemplate('/{name}', { name: 'hello world' })).toBe('/hello%20world');
  });

  it('should handle missing parameters gracefully', () => {
    expect(buildPathFromTemplate('/{id}', {})).toBe('/{id}');
  });
});

describe('mapHttpStatusToErrorCode', () => {
  it('should map 401/403 to CREDENTIALS_INVALID', () => {
    expect(mapHttpStatusToErrorCode(401)).toBe('CREDENTIALS_INVALID');
    expect(mapHttpStatusToErrorCode(403)).toBe('CREDENTIALS_INVALID');
  });

  it('should map 429 to RATE_LIMITED', () => {
    expect(mapHttpStatusToErrorCode(429)).toBe('RATE_LIMITED');
  });

  it('should map 408/504 to TIMEOUT', () => {
    expect(mapHttpStatusToErrorCode(408)).toBe('TIMEOUT');
    expect(mapHttpStatusToErrorCode(504)).toBe('TIMEOUT');
  });

  it('should map 5xx to CONNECTION_FAILED', () => {
    expect(mapHttpStatusToErrorCode(500)).toBe('CONNECTION_FAILED');
    expect(mapHttpStatusToErrorCode(502)).toBe('CONNECTION_FAILED');
    expect(mapHttpStatusToErrorCode(503)).toBe('CONNECTION_FAILED');
  });

  it('should map 4xx to EXECUTION_ERROR', () => {
    expect(mapHttpStatusToErrorCode(400)).toBe('EXECUTION_ERROR');
    expect(mapHttpStatusToErrorCode(404)).toBe('EXECUTION_ERROR');
    expect(mapHttpStatusToErrorCode(422)).toBe('EXECUTION_ERROR');
  });

  it('should map 2xx/3xx to UNKNOWN_ERROR', () => {
    expect(mapHttpStatusToErrorCode(200)).toBe('UNKNOWN_ERROR');
    expect(mapHttpStatusToErrorCode(301)).toBe('UNKNOWN_ERROR');
  });
});

describe('executeHttpRequest', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should make successful GET request', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ data: 'test' }),
      text: vi.fn(),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await executeHttpRequest({
      baseUrl: 'https://api.example.com',
      method: 'GET',
      path: '/data',
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ data: 'test' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should make POST request with body', async () => {
    const mockResponse = {
      ok: true,
      status: 201,
      statusText: 'Created',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ id: 1 }),
      text: vi.fn(),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await executeHttpRequest({
      baseUrl: 'https://api.example.com',
      method: 'POST',
      path: '/users',
      body: { name: 'John' },
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(201);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'John' }),
      })
    );
  });

  it('should include custom headers', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn(),
    };
    mockFetch.mockResolvedValue(mockResponse);

    await executeHttpRequest({
      baseUrl: 'https://api.example.com',
      method: 'GET',
      path: '/data',
      headers: { Authorization: 'Bearer token123' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token123',
        }),
      })
    );
  });

  it('should handle error responses', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ error: 'Resource not found' }),
      text: vi.fn(),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await executeHttpRequest({
      baseUrl: 'https://api.example.com',
      method: 'GET',
      path: '/missing',
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.data).toEqual({ error: 'Resource not found' });
  });

  it('should handle text responses', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'text/plain' }),
      json: vi.fn(),
      text: vi.fn().mockResolvedValue('Plain text response'),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await executeHttpRequest({
      baseUrl: 'https://api.example.com',
      method: 'GET',
      path: '/text',
    });

    expect(result.data).toBe('Plain text response');
  });

  it('should throw RetryableError on timeout', async () => {
    vi.useFakeTimers();

    mockFetch.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          reject(error);
        }, 100);
      });
    });

    const requestPromise = executeHttpRequest({
      baseUrl: 'https://api.example.com',
      method: 'GET',
      path: '/slow',
      timeout: 50,
    });

    vi.advanceTimersByTime(100);

    await expect(requestPromise).rejects.toThrow(RetryableError);
    await expect(requestPromise).rejects.toMatchObject({
      code: 'TIMEOUT',
    });

    vi.useRealTimers();
  });

  it('should throw RetryableError on connection error', async () => {
    mockFetch.mockRejectedValue(new Error('fetch failed: ECONNREFUSED'));

    await expect(
      executeHttpRequest({
        baseUrl: 'https://api.example.com',
        method: 'GET',
        path: '/data',
      })
    ).rejects.toThrow(RetryableError);
  });
});

describe('DEFAULT_HTTP_OPERATION_CONFIGS', () => {
  it('should have configs for common read operations', () => {
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.list).toBeDefined();
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.list.method).toBe('GET');

    expect(DEFAULT_HTTP_OPERATION_CONFIGS.get).toBeDefined();
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.get.method).toBe('GET');
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.get.pathParams).toContain('id');

    expect(DEFAULT_HTTP_OPERATION_CONFIGS.query).toBeDefined();
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.query.method).toBe('GET');
  });

  it('should have configs for common write operations', () => {
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.create).toBeDefined();
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.create.method).toBe('POST');

    expect(DEFAULT_HTTP_OPERATION_CONFIGS.update).toBeDefined();
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.update.method).toBe('PUT');

    expect(DEFAULT_HTTP_OPERATION_CONFIGS.patch).toBeDefined();
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.patch.method).toBe('PATCH');

    expect(DEFAULT_HTTP_OPERATION_CONFIGS.delete).toBeDefined();
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.delete.method).toBe('DELETE');
  });

  it('should have configs for action operations', () => {
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.send).toBeDefined();
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.send.method).toBe('POST');

    expect(DEFAULT_HTTP_OPERATION_CONFIGS.execute).toBeDefined();
    expect(DEFAULT_HTTP_OPERATION_CONFIGS.execute.method).toBe('POST');
  });
});
