/**
 * Integration Executor
 *
 * Main entry point for executing integration operations.
 * Combines:
 * - Integration descriptor loading
 * - Credential resolution from vault
 * - Retry logic
 * - Circuit breaker
 * - Type-specific execution (HTTP, database, etc.)
 */

import { loadIntegration, updateIntegrationStatus } from '../storage.js';
import type { IntegrationDescriptor } from '../types.js';
import {
  type CircuitBreaker,
  CircuitBreakerRegistry,
  CircuitOpenError,
} from './circuit-breaker.js';
import { executeHttpOperation } from './http-executor.js';
import { RETRY_PRESETS, withRetry } from './retry.js';
import type {
  ExecutionContext,
  ExecutionRequest,
  ExecutionResult,
  RetryConfig,
  TypeExecutor,
} from './types.js';

/**
 * Vault interface for credential resolution
 */
export interface VaultProvider {
  /** Get a secret value from the vault */
  getSecret(path: string): Promise<string | null>;
}

/**
 * Executor configuration
 */
export interface ExecutorConfig {
  /** Default timeout in milliseconds */
  defaultTimeout: number;

  /** Retry configuration */
  retry: Partial<RetryConfig>;

  /** Enable circuit breaker */
  circuitBreakerEnabled: boolean;

  /** Custom integrations directory (for testing) */
  integrationsDir?: string;
}

/**
 * Default executor configuration
 */
export const DEFAULT_EXECUTOR_CONFIG: ExecutorConfig = {
  defaultTimeout: 30000,
  retry: RETRY_PRESETS.standard,
  circuitBreakerEnabled: true,
};

/**
 * Integration Executor
 *
 * Orchestrates the execution of integration operations with proper
 * credential handling, retry logic, and circuit breaking.
 *
 * @example
 * ```typescript
 * const executor = new IntegrationExecutor(vaultProvider);
 *
 * const result = await executor.execute({
 *   integrationId: 'postgresql',
 *   operation: 'query',
 *   params: { sql: 'SELECT * FROM users' }
 * });
 * ```
 */
export class IntegrationExecutor {
  private circuitBreakers: CircuitBreakerRegistry;
  private typeExecutors: Map<string, TypeExecutor> = new Map();
  private config: ExecutorConfig;

  constructor(
    private vault: VaultProvider,
    config: Partial<ExecutorConfig> = {}
  ) {
    this.config = { ...DEFAULT_EXECUTOR_CONFIG, ...config };
    this.circuitBreakers = new CircuitBreakerRegistry();
  }

  /**
   * Register a custom type executor
   */
  registerTypeExecutor(executor: TypeExecutor): void {
    this.typeExecutors.set(executor.type, executor);
  }

  /**
   * Execute an integration operation
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // 1. Load integration descriptor
    const integration = await loadIntegration(request.integrationId, this.config.integrationsDir);

    if (!integration) {
      return {
        success: false,
        error: `Integration not found: ${request.integrationId}`,
        errorCode: 'INTEGRATION_NOT_FOUND',
        meta: {
          integrationId: request.integrationId,
          operation: request.operation,
          duration: Date.now() - startTime,
          attempts: 0,
          timestamp,
        },
      };
    }

    // 2. Find the operation
    const operation = integration.operations.find((op) => op.name === request.operation);

    if (!operation) {
      return {
        success: false,
        error: `Operation not found: ${request.operation} on integration ${request.integrationId}`,
        errorCode: 'OPERATION_NOT_FOUND',
        meta: {
          integrationId: request.integrationId,
          operation: request.operation,
          duration: Date.now() - startTime,
          attempts: 0,
          timestamp,
        },
      };
    }

    // 3. Resolve credentials from vault
    const credentials = await this.resolveCredentials(integration);

    if (!credentials) {
      return {
        success: false,
        error: `Failed to resolve credentials for integration: ${request.integrationId}`,
        errorCode: 'CREDENTIALS_NOT_FOUND',
        meta: {
          integrationId: request.integrationId,
          operation: request.operation,
          duration: Date.now() - startTime,
          attempts: 0,
          timestamp,
        },
      };
    }

    // 4. Build execution context
    const context: ExecutionContext = {
      integration,
      operation,
      credentials,
      timeout: request.timeout ?? this.config.defaultTimeout,
    };

    // 5. Execute with circuit breaker and retry
    try {
      const result = await this.executeWithResilience(context, request);

      // Update integration status on success
      if (result.success && integration.status !== 'verified') {
        await updateIntegrationStatus(
          request.integrationId,
          'verified',
          this.config.integrationsDir
        );
      }

      return result;
    } catch (error) {
      // Update integration status on persistent failure
      if (integration.status === 'verified') {
        await updateIntegrationStatus(request.integrationId, 'error', this.config.integrationsDir);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof CircuitOpenError ? 'CIRCUIT_OPEN' : 'EXECUTION_ERROR',
        meta: {
          integrationId: request.integrationId,
          operation: request.operation,
          duration: Date.now() - startTime,
          attempts: 1,
          timestamp,
          circuitBreakerState:
            error instanceof CircuitOpenError
              ? 'OPEN'
              : this.circuitBreakers.get(request.integrationId).getState(),
        },
      };
    }
  }

  /**
   * Execute with circuit breaker and retry logic
   */
  private async executeWithResilience(
    context: ExecutionContext,
    request: ExecutionRequest
  ): Promise<ExecutionResult> {
    const circuitBreaker = this.config.circuitBreakerEnabled
      ? this.circuitBreakers.get(request.integrationId)
      : null;

    // Check circuit breaker first
    if (circuitBreaker && !circuitBreaker.isAllowed()) {
      throw new CircuitOpenError(
        request.integrationId,
        new Date(Date.now() + 30000) // Approximate retry time
      );
    }

    // Execution function with type-specific logic
    const executeFn = async (): Promise<ExecutionResult> => {
      return this.executeOperation(context, request.params);
    };

    // Execute with retry
    if (request.skipRetry) {
      // No retry - execute directly with circuit breaker
      if (circuitBreaker) {
        return circuitBreaker.execute(executeFn);
      }
      return executeFn();
    }

    // With retry
    const retryResult = await withRetry(async () => {
      if (circuitBreaker) {
        return circuitBreaker.execute(executeFn);
      }
      return executeFn();
    }, this.config.retry);

    if (retryResult.success && retryResult.result) {
      // Update attempts in meta
      const result = retryResult.result;
      return {
        ...result,
        meta: {
          ...result.meta,
          attempts: retryResult.attempts,
        },
      };
    }

    // Failed after all retries
    throw retryResult.lastError ?? new Error('Execution failed after retries');
  }

  /**
   * Execute the actual operation
   */
  private async executeOperation(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const { integration, operation } = context;

    // Check for type-specific executor
    const typeExecutor = this.typeExecutors.get(integration.type);
    if (typeExecutor && typeExecutor.canExecute(context)) {
      return typeExecutor.execute(context, params);
    }

    // Default: use HTTP executor for api type
    if (integration.type === 'api' || integration.type === 'custom') {
      return executeHttpOperation(context, params);
    }

    // For other types, we need specific executors
    // Return an error if no executor is available
    return {
      success: false,
      error: `No executor available for integration type: ${integration.type}. Register a TypeExecutor for this type.`,
      errorCode: 'EXECUTION_ERROR',
      meta: {
        integrationId: integration.id,
        operation: operation.name,
        duration: 0,
        attempts: 1,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Resolve credentials from vault references
   */
  private async resolveCredentials(
    integration: IntegrationDescriptor
  ): Promise<Record<string, string> | null> {
    const credentials: Record<string, string> = {};
    const vaultRefs = integration.authentication.vaultRefs;

    for (const [key, ref] of Object.entries(vaultRefs)) {
      // Parse vault reference: vault://provider/path
      const match = ref.match(/^vault:\/\/([^/]+)\/(.+)$/);
      if (!match) {
        continue;
      }

      const [, _provider, path] = match;
      const value = await this.vault.getSecret(path);

      if (value) {
        credentials[key] = value;
      }
    }

    // Check if we have all required credentials
    const required = integration.authentication.requiredCredentials;
    const missing = required.filter((key) => !credentials[key]);

    if (missing.length > 0) {
      // Try to find credentials by alternative names
      for (const key of missing) {
        // Try without underscores
        const altKey = key.replace(/_/g, '');
        if (credentials[altKey]) {
          credentials[key] = credentials[altKey];
        }
      }
    }

    // Return null if critical credentials are missing
    const stillMissing = required.filter((key) => !credentials[key]);
    if (stillMissing.length > 0) {
      return null;
    }

    return credentials;
  }

  /**
   * Get circuit breaker stats for all integrations
   */
  getCircuitBreakerStats(): Map<string, ReturnType<CircuitBreaker['getStats']>> {
    return this.circuitBreakers.getAllStats();
  }

  /**
   * Reset circuit breaker for an integration
   */
  resetCircuitBreaker(integrationId: string): boolean {
    return this.circuitBreakers.reset(integrationId);
  }

  /**
   * Get list of integrations with open circuits
   */
  getOpenCircuits(): string[] {
    return this.circuitBreakers.getOpenCircuits();
  }
}

/**
 * Simple vault provider for testing/development
 * Uses environment variables or a provided map
 */
export class SimpleVaultProvider implements VaultProvider {
  constructor(private secrets: Map<string, string> = new Map()) {}

  async getSecret(path: string): Promise<string | null> {
    // First check our map
    if (this.secrets.has(path)) {
      return this.secrets.get(path) ?? null;
    }

    // Then check environment variables
    // Convert path to env var format: api/key -> API_KEY
    const envKey = path.toUpperCase().replace(/[/\-]/g, '_');
    const envValue = process.env[envKey];
    if (envValue) {
      return envValue;
    }

    return null;
  }

  /**
   * Set a secret (for testing)
   */
  setSecret(path: string, value: string): void {
    this.secrets.set(path, value);
  }

  /**
   * Load secrets from environment variables with a prefix
   */
  loadFromEnv(prefix = ''): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (prefix && !key.startsWith(prefix)) {
        continue;
      }
      const path = key.toLowerCase().replace(/_/g, '/');
      if (value) {
        this.secrets.set(path, value);
      }
    }
  }
}

/**
 * Create an executor with the simple vault provider
 */
export function createSimpleExecutor(
  secrets?: Map<string, string>,
  config?: Partial<ExecutorConfig>
): IntegrationExecutor {
  const vault = new SimpleVaultProvider(secrets);
  return new IntegrationExecutor(vault, config);
}
