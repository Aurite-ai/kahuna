/**
 * Retry Logic with Exponential Backoff
 *
 * Provides robust retry functionality for integration executions
 * with configurable backoff, jitter, and error filtering.
 */

import { DEFAULT_RETRY_CONFIG, type ExecutionErrorCode, type RetryConfig } from './types.js';

/**
 * Error that includes execution error code for retry decisions
 */
export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly code: ExecutionErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** The successful result (if any) */
  result?: T;

  /** Whether the operation succeeded */
  success: boolean;

  /** Number of attempts made */
  attempts: number;

  /** Total time spent (including delays) in ms */
  totalTime: number;

  /** Last error encountered (if failed) */
  lastError?: Error;
}

/**
 * Calculate the delay for a given attempt with exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  // Exponential backoff: initialDelay * multiplier^(attempt-1)
  const exponentialDelay = config.initialDelayMs * config.multiplier ** (attempt - 1);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter if enabled (±25% randomization)
  if (config.jitter) {
    const jitterRange = cappedDelay * 0.25;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    return Math.max(0, Math.round(cappedDelay + jitter));
  }

  return Math.round(cappedDelay);
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetry(error: unknown, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  // If it's a RetryableError, check the code
  if (error instanceof RetryableError) {
    return config.retryableErrors.includes(error.code);
  }

  // Check for common network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Connection errors
    if (
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('enotfound') ||
      message.includes('network') ||
      message.includes('socket')
    ) {
      return config.retryableErrors.includes('CONNECTION_FAILED');
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return config.retryableErrors.includes('TIMEOUT');
    }

    // Rate limit errors
    if (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429')
    ) {
      return config.retryableErrors.includes('RATE_LIMITED');
    }
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration (optional, uses defaults)
 * @returns RetryResult with the outcome
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     if (!response.ok) {
 *       throw new RetryableError('API error', 'CONNECTION_FAILED');
 *     }
 *     return response.json();
 *   },
 *   { maxAttempts: 3, initialDelayMs: 100 }
 * );
 *
 * if (result.success) {
 *   console.log('Data:', result.result);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts');
 * }
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();

  let attempts = 0;
  let lastError: Error | undefined;

  while (attempts < fullConfig.maxAttempts) {
    attempts++;

    try {
      const result = await fn();
      return {
        result,
        success: true,
        attempts,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const isLastAttempt = attempts >= fullConfig.maxAttempts;
      const canRetry = !isLastAttempt && shouldRetry(error, fullConfig);

      if (!canRetry) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateBackoffDelay(attempts, fullConfig);
      await sleep(delay);
    }
  }

  return {
    success: false,
    attempts,
    totalTime: Date.now() - startTime,
    lastError,
  };
}

/**
 * Create a retry wrapper with pre-configured settings
 *
 * Useful for creating reusable retry policies per integration type.
 *
 * @example
 * ```typescript
 * const databaseRetry = createRetryWrapper({
 *   maxAttempts: 5,
 *   initialDelayMs: 200,
 *   retryableErrors: ['CONNECTION_FAILED', 'TIMEOUT']
 * });
 *
 * const result = await databaseRetry(() => db.query('SELECT 1'));
 * ```
 */
export function createRetryWrapper(config: Partial<RetryConfig> = {}) {
  return <T>(fn: () => Promise<T>): Promise<RetryResult<T>> => {
    return withRetry(fn, config);
  };
}

/**
 * Retry configuration presets for common scenarios
 */
export const RETRY_PRESETS = {
  /** Fast retry for quick operations (3 attempts, 50ms initial) */
  fast: {
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 500,
    multiplier: 2,
    jitter: true,
    retryableErrors: ['CONNECTION_FAILED', 'TIMEOUT'] as ExecutionErrorCode[],
  },

  /** Standard retry for most APIs (3 attempts, 100ms initial) */
  standard: DEFAULT_RETRY_CONFIG,

  /** Aggressive retry for critical operations (5 attempts, 200ms initial) */
  aggressive: {
    maxAttempts: 5,
    initialDelayMs: 200,
    maxDelayMs: 10000,
    multiplier: 2,
    jitter: true,
    retryableErrors: ['CONNECTION_FAILED', 'TIMEOUT', 'RATE_LIMITED'] as ExecutionErrorCode[],
  },

  /** Patient retry for rate-limited APIs (5 attempts, 1s initial) */
  rateLimited: {
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    multiplier: 2,
    jitter: true,
    retryableErrors: ['RATE_LIMITED'] as ExecutionErrorCode[],
  },

  /** No retry - fail immediately */
  none: {
    maxAttempts: 1,
    initialDelayMs: 0,
    maxDelayMs: 0,
    multiplier: 1,
    jitter: false,
    retryableErrors: [] as ExecutionErrorCode[],
  },
} as const;
