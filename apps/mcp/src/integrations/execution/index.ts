/**
 * Execution Module
 *
 * Provides the execution layer for running integration operations.
 * Includes retry logic, circuit breakers, and HTTP execution.
 */

// Types
export type {
  CircuitBreakerConfig,
  CircuitBreakerState,
  ExecutionAuditEntry,
  ExecutionContext,
  ExecutionErrorCode,
  ExecutionMeta,
  ExecutionRequest,
  ExecutionResult,
  RetryConfig,
  TypeExecutor,
} from './types.js';

export { DEFAULT_CIRCUIT_BREAKER_CONFIG, DEFAULT_RETRY_CONFIG } from './types.js';

// Retry
export type { RetryResult } from './retry.js';
export {
  calculateBackoffDelay,
  createRetryWrapper,
  RETRY_PRESETS,
  RetryableError,
  shouldRetry,
  sleep,
  withRetry,
} from './retry.js';

// Circuit Breaker
export type { CircuitBreakerStats } from './circuit-breaker.js';
export {
  CircuitBreaker,
  CircuitBreakerRegistry,
  CircuitOpenError,
  globalCircuitBreakerRegistry,
} from './circuit-breaker.js';

// HTTP Executor
export type {
  HttpMethod,
  HttpOperationConfig,
  HttpRequestConfig,
  HttpResponse,
} from './http-executor.js';
export {
  buildAuthHeaders,
  buildPathFromTemplate,
  buildUrl,
  DEFAULT_HTTP_OPERATION_CONFIGS,
  executeHttpOperation,
  executeHttpRequest,
  mapHttpStatusToErrorCode,
} from './http-executor.js';

// Main Executor
export type { ExecutorConfig, VaultProvider } from './executor.js';
export {
  createSimpleExecutor,
  DEFAULT_EXECUTOR_CONFIG,
  IntegrationExecutor,
  SimpleVaultProvider,
} from './executor.js';
