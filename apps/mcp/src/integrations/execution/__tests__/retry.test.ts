/**
 * Tests for retry logic with exponential backoff
 */

import { describe, expect, it, vi } from 'vitest';
import {
  RETRY_PRESETS,
  RetryableError,
  calculateBackoffDelay,
  createRetryWrapper,
  shouldRetry,
  sleep,
  withRetry,
} from '../retry.js';
import { DEFAULT_RETRY_CONFIG, type RetryConfig } from '../types.js';

describe('RetryableError', () => {
  it('should create error with code', () => {
    const error = new RetryableError('Connection failed', 'CONNECTION_FAILED');
    expect(error.message).toBe('Connection failed');
    expect(error.code).toBe('CONNECTION_FAILED');
    expect(error.name).toBe('RetryableError');
  });

  it('should include cause if provided', () => {
    const cause = new Error('Original error');
    const error = new RetryableError('Wrapped error', 'TIMEOUT', cause);
    expect(error.cause).toBe(cause);
  });
});

describe('calculateBackoffDelay', () => {
  const noJitterConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    jitter: false,
  };

  it('should calculate exponential delay without jitter', () => {
    // With default config: initialDelay=100, multiplier=2
    expect(calculateBackoffDelay(1, noJitterConfig)).toBe(100); // 100 * 2^0
    expect(calculateBackoffDelay(2, noJitterConfig)).toBe(200); // 100 * 2^1
    expect(calculateBackoffDelay(3, noJitterConfig)).toBe(400); // 100 * 2^2
    expect(calculateBackoffDelay(4, noJitterConfig)).toBe(800); // 100 * 2^3
  });

  it('should cap at maxDelay', () => {
    const config: RetryConfig = {
      ...noJitterConfig,
      maxDelayMs: 500,
    };
    expect(calculateBackoffDelay(1, config)).toBe(100);
    expect(calculateBackoffDelay(2, config)).toBe(200);
    expect(calculateBackoffDelay(3, config)).toBe(400);
    expect(calculateBackoffDelay(4, config)).toBe(500); // capped
    expect(calculateBackoffDelay(5, config)).toBe(500); // still capped
  });

  it('should add jitter when enabled', () => {
    const config: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      jitter: true,
    };

    // Run multiple times to ensure randomness
    const delays = Array.from({ length: 100 }, () => calculateBackoffDelay(1, config));

    // All should be roughly around 100 (±25%)
    for (const delay of delays) {
      expect(delay).toBeGreaterThanOrEqual(75);
      expect(delay).toBeLessThanOrEqual(125);
    }

    // Should have some variation (not all the same)
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });
});

describe('shouldRetry', () => {
  it('should retry RetryableError with matching code', () => {
    const error = new RetryableError('Failed', 'CONNECTION_FAILED');
    expect(shouldRetry(error, DEFAULT_RETRY_CONFIG)).toBe(true);
  });

  it('should not retry RetryableError with non-matching code', () => {
    const error = new RetryableError('Invalid', 'VALIDATION_ERROR');
    expect(shouldRetry(error, DEFAULT_RETRY_CONFIG)).toBe(false);
  });

  it('should retry connection errors', () => {
    expect(shouldRetry(new Error('ECONNREFUSED'))).toBe(true);
    expect(shouldRetry(new Error('ECONNRESET'))).toBe(true);
    expect(shouldRetry(new Error('ETIMEDOUT'))).toBe(true);
    expect(shouldRetry(new Error('ENOTFOUND'))).toBe(true);
    expect(shouldRetry(new Error('Network error'))).toBe(true);
    expect(shouldRetry(new Error('Socket closed'))).toBe(true);
  });

  it('should retry timeout errors', () => {
    expect(shouldRetry(new Error('Request timeout'))).toBe(true);
    expect(shouldRetry(new Error('Operation timed out'))).toBe(true);
  });

  it('should retry rate limit errors', () => {
    expect(shouldRetry(new Error('Rate limit exceeded'))).toBe(true);
    expect(shouldRetry(new Error('Too many requests'))).toBe(true);
    expect(shouldRetry(new Error('429 Too Many Requests'))).toBe(true);
  });

  it('should not retry unknown errors', () => {
    expect(shouldRetry(new Error('Unknown error'))).toBe(false);
    expect(shouldRetry(new Error('Invalid input'))).toBe(false);
    expect(shouldRetry(new Error('Not found'))).toBe(false);
  });

  it('should respect custom retryableErrors config', () => {
    const config: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      retryableErrors: ['VALIDATION_ERROR'],
    };

    // Now validation errors are retryable
    expect(shouldRetry(new RetryableError('Invalid', 'VALIDATION_ERROR'), config)).toBe(true);

    // Connection errors are no longer retryable
    expect(shouldRetry(new RetryableError('Failed', 'CONNECTION_FAILED'), config)).toBe(false);
  });
});

describe('sleep', () => {
  it('should wait for specified duration', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some timing variance
    expect(elapsed).toBeLessThan(150);
  });
});

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(fn);

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new RetryableError('Fail 1', 'CONNECTION_FAILED'))
      .mockRejectedValueOnce(new RetryableError('Fail 2', 'CONNECTION_FAILED'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, { initialDelayMs: 10 });

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new RetryableError('Always fails', 'CONNECTION_FAILED'));

    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 });

    expect(result.success).toBe(false);
    expect(result.result).toBeUndefined();
    expect(result.attempts).toBe(3);
    expect(result.lastError?.message).toBe('Always fails');
  });

  it('should not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new RetryableError('Invalid', 'VALIDATION_ERROR'));

    const result = await withRetry(fn, { maxAttempts: 3 });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1); // Only one attempt
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should track total time including delays', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new RetryableError('Fail', 'CONNECTION_FAILED'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, { initialDelayMs: 50, jitter: false });

    expect(result.totalTime).toBeGreaterThanOrEqual(40); // At least the delay
  });

  it('should use default config when none provided', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new RetryableError('Fail', 'CONNECTION_FAILED'))
      .mockResolvedValue('success');

    // Use very short delay for test
    const result = await withRetry(fn, { initialDelayMs: 5 });

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
  });

  it('should handle non-Error rejections', async () => {
    const fn = vi.fn().mockRejectedValue('string error');

    const result = await withRetry(fn, { maxAttempts: 1 });

    expect(result.success).toBe(false);
    expect(result.lastError?.message).toBe('string error');
  });
});

describe('createRetryWrapper', () => {
  it('should create wrapper with pre-configured settings', async () => {
    const wrapper = createRetryWrapper({ maxAttempts: 2, initialDelayMs: 10 });

    const fn = vi.fn().mockRejectedValue(new RetryableError('Fail', 'CONNECTION_FAILED'));

    const result = await wrapper(fn);

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(2); // Uses configured maxAttempts
  });

  it('should be reusable', async () => {
    const wrapper = createRetryWrapper({ maxAttempts: 1 });

    const fn1 = vi.fn().mockResolvedValue('result1');
    const fn2 = vi.fn().mockResolvedValue('result2');

    const [result1, result2] = await Promise.all([wrapper(fn1), wrapper(fn2)]);

    expect(result1.result).toBe('result1');
    expect(result2.result).toBe('result2');
  });
});

describe('RETRY_PRESETS', () => {
  it('should have correct fast preset', () => {
    expect(RETRY_PRESETS.fast.maxAttempts).toBe(3);
    expect(RETRY_PRESETS.fast.initialDelayMs).toBe(50);
    expect(RETRY_PRESETS.fast.maxDelayMs).toBe(500);
  });

  it('should have correct standard preset', () => {
    expect(RETRY_PRESETS.standard.maxAttempts).toBe(3);
    expect(RETRY_PRESETS.standard.initialDelayMs).toBe(100);
  });

  it('should have correct aggressive preset', () => {
    expect(RETRY_PRESETS.aggressive.maxAttempts).toBe(5);
    expect(RETRY_PRESETS.aggressive.initialDelayMs).toBe(200);
    expect(RETRY_PRESETS.aggressive.retryableErrors).toContain('RATE_LIMITED');
  });

  it('should have correct rateLimited preset', () => {
    expect(RETRY_PRESETS.rateLimited.maxAttempts).toBe(5);
    expect(RETRY_PRESETS.rateLimited.initialDelayMs).toBe(1000);
    expect(RETRY_PRESETS.rateLimited.maxDelayMs).toBe(60000);
  });

  it('should have correct none preset', () => {
    expect(RETRY_PRESETS.none.maxAttempts).toBe(1);
    expect(RETRY_PRESETS.none.retryableErrors).toHaveLength(0);
  });

  it('should work with withRetry', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(fn, RETRY_PRESETS.fast);

    expect(result.success).toBe(true);
  });
});
