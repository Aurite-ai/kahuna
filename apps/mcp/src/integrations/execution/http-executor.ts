/**
 * HTTP Executor
 *
 * Generic HTTP client for executing REST API operations.
 * Handles authentication, request formatting, and response parsing.
 */

import type { AuthMethod } from '../types.js';
import { RetryableError } from './retry.js';
import type { ExecutionContext, ExecutionErrorCode, ExecutionResult } from './types.js';

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  /** Base URL for the API */
  baseUrl: string;

  /** HTTP method */
  method: HttpMethod;

  /** Path (appended to baseUrl) */
  path: string;

  /** Query parameters */
  query?: Record<string, string | number | boolean>;

  /** Request headers */
  headers?: Record<string, string>;

  /** Request body */
  body?: unknown;

  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * HTTP response
 */
export interface HttpResponse {
  /** HTTP status code */
  status: number;

  /** Status text */
  statusText: string;

  /** Response headers */
  headers: Record<string, string>;

  /** Response body (parsed JSON or text) */
  data: unknown;

  /** Whether the request was successful (2xx status) */
  ok: boolean;
}

/**
 * Build authentication headers based on auth method and credentials
 */
export function buildAuthHeaders(
  authMethod: AuthMethod,
  credentials: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {};

  switch (authMethod) {
    case 'api_key': {
      // API key can go in header (common patterns)
      const apiKey = credentials.api_key ?? credentials.apiKey ?? credentials.key;
      if (apiKey) {
        // Check for custom header name
        const headerName = credentials.api_key_header ?? 'X-API-Key';
        headers[headerName] = apiKey;
      }
      break;
    }

    case 'bearer_token': {
      const token =
        credentials.token ??
        credentials.access_token ??
        credentials.bearer_token ??
        credentials.bot_token;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      break;
    }

    case 'basic_auth': {
      const username = credentials.username ?? credentials.user;
      const password = credentials.password ?? credentials.pass;
      if (username && password) {
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        headers.Authorization = `Basic ${encoded}`;
      }
      break;
    }

    case 'oauth2': {
      // For OAuth2, we expect an access token to be provided
      const accessToken = credentials.access_token ?? credentials.token;
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      break;
    }

    case 'custom': {
      // For custom auth, look for any Authorization header value
      const auth = credentials.authorization ?? credentials.auth_header;
      if (auth) {
        headers.Authorization = auth;
      }
      break;
    }

    case 'none':
      // No authentication needed
      break;

    default:
      // Unknown auth method, no headers added
      break;
  }

  return headers;
}

/**
 * Build URL with query parameters
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean>
): string {
  // Ensure base URL doesn't end with slash and path starts with slash
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  let url = `${normalizedBase}${normalizedPath}`;

  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      params.append(key, String(value));
    }
    url += `?${params.toString()}`;
  }

  return url;
}

/**
 * Map HTTP status codes to execution error codes
 */
export function mapHttpStatusToErrorCode(status: number): ExecutionErrorCode {
  if (status === 401 || status === 403) {
    return 'CREDENTIALS_INVALID';
  }
  if (status === 429) {
    return 'RATE_LIMITED';
  }
  if (status === 408 || status === 504) {
    return 'TIMEOUT';
  }
  if (status >= 500) {
    return 'CONNECTION_FAILED';
  }
  if (status >= 400) {
    return 'EXECUTION_ERROR';
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Execute an HTTP request
 */
export async function executeHttpRequest(config: HttpRequestConfig): Promise<HttpResponse> {
  const url = buildUrl(config.baseUrl, config.path, config.query);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...config.headers,
  };

  const fetchOptions: RequestInit = {
    method: config.method,
    headers,
  };

  // Add body for methods that support it
  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    fetchOptions.body = JSON.stringify(config.body);
  }

  // Add timeout via AbortController
  const controller = new AbortController();
  const timeout = config.timeout ?? 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(url, fetchOptions);

    // Parse response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Parse response body
    let data: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data,
      ok: response.ok,
    };
  } catch (error) {
    // Handle fetch errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new RetryableError(`Request timed out after ${timeout}ms`, 'TIMEOUT', error);
      }

      // Network errors
      if (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('fetch failed')
      ) {
        throw new RetryableError(`Connection failed: ${error.message}`, 'CONNECTION_FAILED', error);
      }
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generic operation configuration for HTTP-based integrations
 */
export interface HttpOperationConfig {
  /** HTTP method to use */
  method: HttpMethod;

  /** Path template (can include {param} placeholders) */
  pathTemplate: string;

  /** Parameters that go in the path */
  pathParams?: string[];

  /** Parameters that go in query string */
  queryParams?: string[];

  /** Parameters that go in request body */
  bodyParams?: string[];
}

/**
 * Default HTTP operation configs for common operation patterns
 */
export const DEFAULT_HTTP_OPERATION_CONFIGS: Record<string, HttpOperationConfig> = {
  // Read operations
  list: {
    method: 'GET',
    pathTemplate: '/',
    queryParams: ['limit', 'offset', 'page', 'filter'],
  },
  get: {
    method: 'GET',
    pathTemplate: '/{id}',
    pathParams: ['id'],
  },
  query: {
    method: 'GET',
    pathTemplate: '/query',
    queryParams: ['q', 'query', 'filter'],
  },

  // Write operations
  create: {
    method: 'POST',
    pathTemplate: '/',
    bodyParams: ['data'],
  },
  update: {
    method: 'PUT',
    pathTemplate: '/{id}',
    pathParams: ['id'],
    bodyParams: ['data'],
  },
  patch: {
    method: 'PATCH',
    pathTemplate: '/{id}',
    pathParams: ['id'],
    bodyParams: ['data'],
  },
  delete: {
    method: 'DELETE',
    pathTemplate: '/{id}',
    pathParams: ['id'],
  },

  // Action operations
  send: {
    method: 'POST',
    pathTemplate: '/send',
    bodyParams: ['to', 'subject', 'body', 'message', 'content'],
  },
  execute: {
    method: 'POST',
    pathTemplate: '/execute',
    bodyParams: ['command', 'query', 'sql'],
  },
};

/**
 * Build path from template and parameters
 */
export function buildPathFromTemplate(template: string, params: Record<string, unknown>): string {
  let path = template;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
  }
  return path;
}

/**
 * Execute an HTTP-based integration operation
 */
export async function executeHttpOperation(
  context: ExecutionContext,
  params: Record<string, unknown>
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const { integration, operation, credentials, timeout } = context;

  // Get base URL from credentials or a well-known location
  const baseUrl = credentials.base_url ?? credentials.baseUrl ?? credentials.url ?? '';

  if (!baseUrl) {
    return {
      success: false,
      error: 'No base URL configured for this integration',
      errorCode: 'VALIDATION_ERROR',
      meta: {
        integrationId: integration.id,
        operation: operation.name,
        duration: Date.now() - startTime,
        attempts: 1,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Determine HTTP config for this operation
  const opConfig = DEFAULT_HTTP_OPERATION_CONFIGS[operation.name] ?? {
    method: 'POST' as HttpMethod,
    pathTemplate: `/${operation.name}`,
    bodyParams: Object.keys(params),
  };

  // Build path
  const path = buildPathFromTemplate(opConfig.pathTemplate, params);

  // Build query parameters
  const query: Record<string, string | number | boolean> = {};
  if (opConfig.queryParams) {
    for (const key of opConfig.queryParams) {
      if (params[key] !== undefined) {
        query[key] = params[key] as string | number | boolean;
      }
    }
  }

  // Build body
  let body: unknown;
  if (opConfig.bodyParams && ['POST', 'PUT', 'PATCH'].includes(opConfig.method)) {
    // If single 'data' param, use it directly
    if (opConfig.bodyParams.length === 1 && opConfig.bodyParams[0] === 'data' && params.data) {
      body = params.data;
    } else {
      // Otherwise, build object from body params
      body = {};
      for (const key of opConfig.bodyParams) {
        if (params[key] !== undefined) {
          (body as Record<string, unknown>)[key] = params[key];
        }
      }
    }
  }

  // Build auth headers
  const authHeaders = buildAuthHeaders(integration.authentication.method, credentials);

  try {
    const response = await executeHttpRequest({
      baseUrl,
      method: opConfig.method,
      path,
      query: Object.keys(query).length > 0 ? query : undefined,
      body,
      headers: authHeaders,
      timeout,
    });

    if (response.ok) {
      return {
        success: true,
        data: response.data,
        meta: {
          integrationId: integration.id,
          operation: operation.name,
          duration: Date.now() - startTime,
          attempts: 1,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Handle error response
    const errorCode = mapHttpStatusToErrorCode(response.status);
    const errorMessage =
      typeof response.data === 'object' && response.data !== null
        ? ((response.data as { error?: string; message?: string }).error ??
          (response.data as { error?: string; message?: string }).message ??
          response.statusText)
        : response.statusText;

    // Some errors are retryable
    if (['CONNECTION_FAILED', 'TIMEOUT', 'RATE_LIMITED'].includes(errorCode)) {
      throw new RetryableError(errorMessage, errorCode);
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
      meta: {
        integrationId: integration.id,
        operation: operation.name,
        duration: Date.now() - startTime,
        attempts: 1,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    // Re-throw RetryableError to be handled by retry logic
    if (error instanceof RetryableError) {
      throw error;
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorCode: 'EXECUTION_ERROR',
      meta: {
        integrationId: integration.id,
        operation: operation.name,
        duration: Date.now() - startTime,
        attempts: 1,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
