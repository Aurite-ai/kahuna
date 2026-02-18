/**
 * Integration Execution Types
 *
 * Types for the execution layer that enables agents to actually
 * USE discovered integrations (call APIs, query databases, etc.)
 */

import type { IntegrationDescriptor, IntegrationOperation } from '../types.js';

/**
 * Request to execute an integration operation
 */
export interface ExecutionRequest {
  /** Integration ID to execute */
  integrationId: string;

  /** Operation name to perform */
  operation: string;

  /** Parameters for the operation */
  params: Record<string, unknown>;

  /** Optional timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Optional: Skip retry logic */
  skipRetry?: boolean;
}

/**
 * Result of an integration execution
 */
export interface ExecutionResult {
  /** Whether the execution succeeded */
  success: boolean;

  /** Result data (if successful) */
  data?: unknown;

  /** Error message (if failed) */
  error?: string;

  /** Error code for programmatic handling */
  errorCode?: ExecutionErrorCode;

  /** Execution metadata */
  meta: ExecutionMeta;
}

/**
 * Metadata about the execution
 */
export interface ExecutionMeta {
  /** Integration that was executed */
  integrationId: string;

  /** Operation that was executed */
  operation: string;

  /** Execution duration in milliseconds */
  duration: number;

  /** Number of attempts (if retried) */
  attempts: number;

  /** ISO timestamp of execution */
  timestamp: string;

  /** Whether circuit breaker was involved */
  circuitBreakerState?: CircuitBreakerState;
}

/**
 * Error codes for execution failures
 */
export type ExecutionErrorCode =
  | 'INTEGRATION_NOT_FOUND'
  | 'OPERATION_NOT_FOUND'
  | 'CREDENTIALS_NOT_FOUND'
  | 'CREDENTIALS_INVALID'
  | 'CONNECTION_FAILED'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'CIRCUIT_OPEN'
  | 'VALIDATION_ERROR'
  | 'EXECUTION_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Circuit breaker states
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;

  /** Initial backoff delay in ms (default: 100) */
  initialDelayMs: number;

  /** Maximum backoff delay in ms (default: 5000) */
  maxDelayMs: number;

  /** Backoff multiplier (default: 2) */
  multiplier: number;

  /** Whether to add jitter to delays (default: true) */
  jitter: boolean;

  /** Error codes that should trigger retry */
  retryableErrors: ExecutionErrorCode[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  multiplier: 2,
  jitter: true,
  retryableErrors: ['CONNECTION_FAILED', 'TIMEOUT', 'RATE_LIMITED'],
};

/**
 * Configuration for circuit breaker
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold: number;

  /** Time to wait before trying again (ms) (default: 30000) */
  resetTimeoutMs: number;

  /** Number of successful calls to close circuit (default: 2) */
  successThreshold: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  successThreshold: 2,
};

/**
 * Context provided to operation executors
 */
export interface ExecutionContext {
  /** The integration being executed */
  integration: IntegrationDescriptor;

  /** The operation being performed */
  operation: IntegrationOperation;

  /** Resolved credentials (fetched from vault) */
  credentials: Record<string, string>;

  /** Timeout for this execution */
  timeout: number;

  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

/**
 * Interface for type-specific executors
 *
 * Different integration types (database, api, messaging) may have
 * specialized executors that know how to handle their operations.
 */
export interface TypeExecutor {
  /** Integration type this executor handles */
  type: string;

  /** Check if this executor can handle the operation */
  canExecute(context: ExecutionContext): boolean;

  /** Execute the operation */
  execute(context: ExecutionContext, params: Record<string, unknown>): Promise<ExecutionResult>;
}

/**
 * Audit log entry for executions
 */
export interface ExecutionAuditEntry {
  /** ISO timestamp */
  timestamp: string;

  /** Integration executed */
  integrationId: string;

  /** Operation executed */
  operation: string;

  /** Whether it succeeded */
  success: boolean;

  /** Duration in ms */
  duration: number;

  /** Error if failed */
  error?: string;

  /** Number of retry attempts */
  attempts: number;
}
