/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by stopping requests to failing services.
 * When a service fails repeatedly, the circuit "opens" and rejects
 * requests immediately without attempting the operation.
 *
 * States:
 * - CLOSED: Normal operation, requests go through
 * - OPEN: Service is failing, requests rejected immediately
 * - HALF_OPEN: Testing if service recovered
 */

import type { CircuitBreakerConfig, CircuitBreakerState } from './types.js';
import { DEFAULT_CIRCUIT_BREAKER_CONFIG } from './types.js';

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitOpenError extends Error {
  constructor(
    public readonly integrationId: string,
    public readonly nextRetryTime: Date
  ) {
    super(
      `Circuit breaker is open for ${integrationId}. Retry after ${nextRetryTime.toISOString()}`
    );
    this.name = 'CircuitOpenError';
  }

  /** Milliseconds until circuit might close */
  get retryAfterMs(): number {
    return Math.max(0, this.nextRetryTime.getTime() - Date.now());
  }
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  /** Current state */
  state: CircuitBreakerState;

  /** Total successful calls */
  successCount: number;

  /** Total failed calls */
  failureCount: number;

  /** Consecutive failures (reset on success) */
  consecutiveFailures: number;

  /** Consecutive successes in HALF_OPEN (reset when circuit opens) */
  consecutiveSuccesses: number;

  /** When the circuit last opened */
  lastOpenedAt?: Date;

  /** When the circuit last closed */
  lastClosedAt?: Date;

  /** Time until circuit attempts recovery (if OPEN) */
  nextRetryTime?: Date;
}

/**
 * Circuit Breaker
 *
 * Wraps operations and tracks failures to prevent cascading failures.
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker('postgresql');
 *
 * try {
 *   const result = await breaker.execute(async () => {
 *     return await db.query('SELECT 1');
 *   });
 * } catch (error) {
 *   if (error instanceof CircuitOpenError) {
 *     console.log('Service unavailable, retry after:', error.nextRetryTime);
 *   }
 * }
 * ```
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private successCount = 0;
  private failureCount = 0;
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private lastOpenedAt?: Date;
  private lastClosedAt?: Date;
  private openedAt?: Date;
  private readonly config: CircuitBreakerConfig;

  constructor(
    public readonly integrationId: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitBreakerState {
    // Check if OPEN circuit should transition to HALF_OPEN
    if (this.state === 'OPEN' && this.shouldAttemptRecovery()) {
      this.transitionTo('HALF_OPEN');
    }
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.getState(),
      successCount: this.successCount,
      failureCount: this.failureCount,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastOpenedAt: this.lastOpenedAt,
      lastClosedAt: this.lastClosedAt,
      nextRetryTime: this.state === 'OPEN' ? this.getNextRetryTime() : undefined,
    };
  }

  /**
   * Check if circuit allows requests
   */
  isAllowed(): boolean {
    const state = this.getState();
    return state === 'CLOSED' || state === 'HALF_OPEN';
  }

  /**
   * Execute an operation through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();

    // If circuit is OPEN, reject immediately
    if (state === 'OPEN') {
      throw new CircuitOpenError(this.integrationId, this.getNextRetryTime());
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.successCount++;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses++;

    if (this.state === 'HALF_OPEN') {
      // Check if we have enough successes to close the circuit
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
      }
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failureCount++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;

    if (this.state === 'CLOSED') {
      // Check if we should open the circuit
      if (this.consecutiveFailures >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    } else if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN reopens the circuit
      this.transitionTo('OPEN');
    }
  }

  /**
   * Manually open the circuit
   */
  open(): void {
    this.transitionTo('OPEN');
  }

  /**
   * Manually close the circuit
   */
  close(): void {
    this.transitionTo('CLOSED');
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.state = 'CLOSED';
    this.successCount = 0;
    this.failureCount = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastOpenedAt = undefined;
    this.lastClosedAt = undefined;
    this.openedAt = undefined;
  }

  /**
   * Check if enough time has passed to attempt recovery
   */
  private shouldAttemptRecovery(): boolean {
    if (!this.openedAt) return false;
    const elapsed = Date.now() - this.openedAt.getTime();
    return elapsed >= this.config.resetTimeoutMs;
  }

  /**
   * Get the time when circuit will attempt recovery
   */
  private getNextRetryTime(): Date {
    if (!this.openedAt) {
      return new Date();
    }
    return new Date(this.openedAt.getTime() + this.config.resetTimeoutMs);
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;

    if (newState === 'OPEN' && oldState !== 'OPEN') {
      this.openedAt = new Date();
      this.lastOpenedAt = this.openedAt;
      this.consecutiveSuccesses = 0;
    } else if (newState === 'CLOSED' && oldState !== 'CLOSED') {
      this.lastClosedAt = new Date();
      this.consecutiveFailures = 0;
      this.openedAt = undefined;
    } else if (newState === 'HALF_OPEN') {
      this.consecutiveSuccesses = 0;
    }
  }
}

/**
 * Circuit Breaker Registry
 *
 * Manages circuit breakers for multiple integrations.
 * Ensures each integration has a single circuit breaker instance.
 */
export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();
  private readonly defaultConfig: Partial<CircuitBreakerConfig>;

  constructor(defaultConfig: Partial<CircuitBreakerConfig> = {}) {
    this.defaultConfig = defaultConfig;
  }

  /**
   * Get or create a circuit breaker for an integration
   */
  get(integrationId: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(integrationId);

    if (!breaker) {
      breaker = new CircuitBreaker(integrationId, {
        ...this.defaultConfig,
        ...config,
      });
      this.breakers.set(integrationId, breaker);
    }

    return breaker;
  }

  /**
   * Check if an integration has an active circuit breaker
   */
  has(integrationId: string): boolean {
    return this.breakers.has(integrationId);
  }

  /**
   * Get stats for all circuit breakers
   */
  getAllStats(): Map<string, CircuitBreakerStats> {
    const stats = new Map<string, CircuitBreakerStats>();
    for (const [id, breaker] of this.breakers) {
      stats.set(id, breaker.getStats());
    }
    return stats;
  }

  /**
   * Get IDs of all integrations with open circuits
   */
  getOpenCircuits(): string[] {
    const open: string[] = [];
    for (const [id, breaker] of this.breakers) {
      if (breaker.getState() === 'OPEN') {
        open.push(id);
      }
    }
    return open;
  }

  /**
   * Reset a specific circuit breaker
   */
  reset(integrationId: string): boolean {
    const breaker = this.breakers.get(integrationId);
    if (breaker) {
      breaker.reset();
      return true;
    }
    return false;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Remove a circuit breaker
   */
  remove(integrationId: string): boolean {
    return this.breakers.delete(integrationId);
  }

  /**
   * Clear all circuit breakers
   */
  clear(): void {
    this.breakers.clear();
  }

  /**
   * Get count of registered circuit breakers
   */
  get size(): number {
    return this.breakers.size;
  }
}

/**
 * Global circuit breaker registry
 *
 * Shared instance for use across the execution layer.
 */
export const globalCircuitBreakerRegistry = new CircuitBreakerRegistry();
