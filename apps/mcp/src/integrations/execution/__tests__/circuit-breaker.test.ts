/**
 * Tests for Circuit Breaker pattern implementation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerRegistry,
  CircuitOpenError,
  globalCircuitBreakerRegistry,
} from '../circuit-breaker.js';

describe('CircuitOpenError', () => {
  it('should create error with integration ID and retry time', () => {
    const nextRetry = new Date('2026-02-12T10:00:00Z');
    const error = new CircuitOpenError('postgresql', nextRetry);

    expect(error.name).toBe('CircuitOpenError');
    expect(error.integrationId).toBe('postgresql');
    expect(error.nextRetryTime).toBe(nextRetry);
    expect(error.message).toContain('postgresql');
    expect(error.message).toContain('2026-02-12');
  });

  it('should calculate retryAfterMs correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T10:00:00Z'));

    const nextRetry = new Date('2026-02-12T10:00:30Z'); // 30 seconds later
    const error = new CircuitOpenError('test', nextRetry);

    expect(error.retryAfterMs).toBe(30000);

    vi.useRealTimers();
  });

  it('should return 0 for retryAfterMs if time has passed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T10:01:00Z'));

    const nextRetry = new Date('2026-02-12T10:00:00Z'); // In the past
    const error = new CircuitOpenError('test', nextRetry);

    expect(error.retryAfterMs).toBe(0);

    vi.useRealTimers();
  });
});

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-integration', {
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      successThreshold: 2,
    });
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should have zero counts', () => {
      const stats = breaker.getStats();
      expect(stats.successCount).toBe(0);
      expect(stats.failureCount).toBe(0);
      expect(stats.consecutiveFailures).toBe(0);
      expect(stats.consecutiveSuccesses).toBe(0);
    });

    it('should allow requests', () => {
      expect(breaker.isAllowed()).toBe(true);
    });
  });

  describe('CLOSED state', () => {
    it('should execute operations and track success', async () => {
      const result = await breaker.execute(async () => 'success');

      expect(result).toBe('success');
      expect(breaker.getStats().successCount).toBe(1);
      expect(breaker.getStats().consecutiveSuccesses).toBe(1);
    });

    it('should track failures but stay CLOSED below threshold', async () => {
      // Two failures (threshold is 3)
      await expect(
        breaker.execute(async () => {
          throw new Error('fail');
        })
      ).rejects.toThrow('fail');

      await expect(
        breaker.execute(async () => {
          throw new Error('fail');
        })
      ).rejects.toThrow('fail');

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getStats().failureCount).toBe(2);
      expect(breaker.getStats().consecutiveFailures).toBe(2);
    });

    it('should open after reaching failure threshold', async () => {
      // Three failures (threshold is 3)
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => {
            throw new Error('fail');
          })
        ).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.getStats().lastOpenedAt).toBeDefined();
    });

    it('should reset consecutive failures on success', async () => {
      // Two failures
      await expect(
        breaker.execute(async () => {
          throw new Error('fail');
        })
      ).rejects.toThrow();
      await expect(
        breaker.execute(async () => {
          throw new Error('fail');
        })
      ).rejects.toThrow();

      expect(breaker.getStats().consecutiveFailures).toBe(2);

      // One success
      await breaker.execute(async () => 'ok');

      expect(breaker.getStats().consecutiveFailures).toBe(0);
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('OPEN state', () => {
    beforeEach(async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => {
            throw new Error('fail');
          })
        ).rejects.toThrow();
      }
    });

    it('should reject requests immediately', async () => {
      await expect(breaker.execute(async () => 'success')).rejects.toThrow(CircuitOpenError);
    });

    it('should throw CircuitOpenError with retry time', async () => {
      try {
        await breaker.execute(async () => 'success');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitOpenError);
        if (error instanceof CircuitOpenError) {
          expect(error.integrationId).toBe('test-integration');
          expect(error.nextRetryTime).toBeDefined();
        }
      }
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      vi.useFakeTimers();

      expect(breaker.getState()).toBe('OPEN');

      // Advance past reset timeout
      vi.advanceTimersByTime(1001);

      expect(breaker.getState()).toBe('HALF_OPEN');

      vi.useRealTimers();
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(async () => {
      vi.useFakeTimers();

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => {
            throw new Error('fail');
          })
        ).rejects.toThrow();
      }

      // Advance to HALF_OPEN
      vi.advanceTimersByTime(1001);
      expect(breaker.getState()).toBe('HALF_OPEN');
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow requests', () => {
      expect(breaker.isAllowed()).toBe(true);
    });

    it('should close after enough successes', async () => {
      // Two successes (threshold is 2)
      await breaker.execute(async () => 'ok1');
      expect(breaker.getState()).toBe('HALF_OPEN');

      await breaker.execute(async () => 'ok2');
      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getStats().lastClosedAt).toBeDefined();
    });

    it('should reopen on any failure', async () => {
      await expect(
        breaker.execute(async () => {
          throw new Error('fail');
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');
    });

    it('should reopen even after some successes', async () => {
      await breaker.execute(async () => 'ok1');
      expect(breaker.getState()).toBe('HALF_OPEN');

      await expect(
        breaker.execute(async () => {
          throw new Error('fail');
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('manual controls', () => {
    it('should manually open the circuit', () => {
      expect(breaker.getState()).toBe('CLOSED');

      breaker.open();

      expect(breaker.getState()).toBe('OPEN');
    });

    it('should manually close the circuit', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => {
            throw new Error('fail');
          })
        ).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('OPEN');

      breaker.close();

      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should reset all statistics', async () => {
      // Generate some stats
      await breaker.execute(async () => 'ok');
      await expect(
        breaker.execute(async () => {
          throw new Error('fail');
        })
      ).rejects.toThrow();

      breaker.reset();

      const stats = breaker.getStats();
      expect(stats.state).toBe('CLOSED');
      expect(stats.successCount).toBe(0);
      expect(stats.failureCount).toBe(0);
      expect(stats.consecutiveFailures).toBe(0);
      expect(stats.consecutiveSuccesses).toBe(0);
    });
  });

  describe('recordSuccess and recordFailure', () => {
    it('should allow manual recording of success', () => {
      breaker.recordSuccess();
      breaker.recordSuccess();

      expect(breaker.getStats().successCount).toBe(2);
      expect(breaker.getStats().consecutiveSuccesses).toBe(2);
    });

    it('should allow manual recording of failure', () => {
      breaker.recordFailure();
      breaker.recordFailure();

      expect(breaker.getStats().failureCount).toBe(2);
      expect(breaker.getStats().consecutiveFailures).toBe(2);
    });
  });
});

describe('CircuitBreakerRegistry', () => {
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    registry = new CircuitBreakerRegistry({
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      successThreshold: 2,
    });
  });

  it('should create new circuit breaker on first get', () => {
    const breaker = registry.get('postgresql');

    expect(breaker).toBeInstanceOf(CircuitBreaker);
    expect(breaker.integrationId).toBe('postgresql');
  });

  it('should return same instance on subsequent gets', () => {
    const breaker1 = registry.get('postgresql');
    const breaker2 = registry.get('postgresql');

    expect(breaker1).toBe(breaker2);
  });

  it('should create different breakers for different integrations', () => {
    const pg = registry.get('postgresql');
    const slack = registry.get('slack');

    expect(pg).not.toBe(slack);
    expect(pg.integrationId).toBe('postgresql');
    expect(slack.integrationId).toBe('slack');
  });

  it('should check if integration has breaker', () => {
    expect(registry.has('postgresql')).toBe(false);

    registry.get('postgresql');

    expect(registry.has('postgresql')).toBe(true);
  });

  it('should get stats for all breakers', async () => {
    const pg = registry.get('postgresql');
    const slack = registry.get('slack');

    await pg.execute(async () => 'ok');
    slack.recordFailure();

    const stats = registry.getAllStats();

    expect(stats.size).toBe(2);
    expect(stats.get('postgresql')?.successCount).toBe(1);
    expect(stats.get('slack')?.failureCount).toBe(1);
  });

  it('should get open circuits', async () => {
    const pg = registry.get('postgresql');
    const slack = registry.get('slack');

    // Open pg circuit
    for (let i = 0; i < 3; i++) {
      pg.recordFailure();
    }

    const open = registry.getOpenCircuits();

    expect(open).toContain('postgresql');
    expect(open).not.toContain('slack');
  });

  it('should reset specific breaker', async () => {
    const pg = registry.get('postgresql');
    pg.recordSuccess();

    expect(pg.getStats().successCount).toBe(1);

    registry.reset('postgresql');

    expect(pg.getStats().successCount).toBe(0);
  });

  it('should reset all breakers', () => {
    const pg = registry.get('postgresql');
    const slack = registry.get('slack');

    pg.recordSuccess();
    slack.recordFailure();

    registry.resetAll();

    expect(pg.getStats().successCount).toBe(0);
    expect(slack.getStats().failureCount).toBe(0);
  });

  it('should remove breaker', () => {
    registry.get('postgresql');
    expect(registry.has('postgresql')).toBe(true);

    const removed = registry.remove('postgresql');

    expect(removed).toBe(true);
    expect(registry.has('postgresql')).toBe(false);
  });

  it('should clear all breakers', () => {
    registry.get('postgresql');
    registry.get('slack');

    expect(registry.size).toBe(2);

    registry.clear();

    expect(registry.size).toBe(0);
  });

  it('should apply custom config to individual breaker', () => {
    const breaker = registry.get('postgresql', { failureThreshold: 10 });

    // Should use custom threshold
    for (let i = 0; i < 9; i++) {
      breaker.recordFailure();
    }

    expect(breaker.getState()).toBe('CLOSED'); // Not open yet

    breaker.recordFailure(); // 10th failure
    expect(breaker.getState()).toBe('OPEN');
  });
});

describe('globalCircuitBreakerRegistry', () => {
  afterEach(() => {
    globalCircuitBreakerRegistry.clear();
  });

  it('should be a singleton registry', () => {
    const breaker = globalCircuitBreakerRegistry.get('test');

    expect(breaker).toBeInstanceOf(CircuitBreaker);
  });

  it('should persist across imports', () => {
    const breaker1 = globalCircuitBreakerRegistry.get('test');
    breaker1.recordSuccess();

    const breaker2 = globalCircuitBreakerRegistry.get('test');

    expect(breaker2.getStats().successCount).toBe(1);
  });
});
