/**
 * Mode-Aware Executor
 *
 * The main entry point for mode-aware integration execution.
 * Routes execution to the appropriate executor based on mode:
 * - simulation: SimulationExecutor (mock responses)
 * - sandbox/production: IntegrationExecutor (real API calls)
 */

import { IntegrationExecutor } from '../executor.js';
import type { ExecutorConfig, VaultProvider } from '../executor.js';
import { type ModeAwareVaultProvider, createModeAwareVaultProvider } from './mode-aware-vault.js';
import { getModeResolver, resolveMode } from './resolver.js';
import { type SimulationExecutor, createSimulationExecutor } from './simulation-executor.js';
import type {
  ExecutionMode,
  ModeAwareExecutionRequest,
  ModeAwareExecutionResult,
  ModeResolutionResult,
} from './types.js';

/**
 * Configuration for ModeAwareExecutor
 */
export interface ModeAwareExecutorConfig {
  /** Directory for integration descriptors */
  integrationsDir?: string;

  /** Project path for mode configuration */
  projectPath?: string;

  /** Custom executor config for sandbox/production */
  executorConfig?: Partial<ExecutorConfig>;

  /** Custom vault provider (optional) */
  vaultProvider?: VaultProvider;
}

/**
 * Mode-Aware Executor
 *
 * Provides a unified interface for executing integration operations
 * with automatic mode resolution and routing.
 */
export class ModeAwareExecutor {
  private simulationExecutor: SimulationExecutor;
  private realExecutor: IntegrationExecutor;
  private vaultProvider: ModeAwareVaultProvider;
  private projectPath?: string;

  constructor(config?: ModeAwareExecutorConfig) {
    this.projectPath = config?.projectPath;

    // Create simulation executor
    this.simulationExecutor = createSimulationExecutor({
      integrationsDir: config?.integrationsDir,
    });

    // Create mode-aware vault provider
    this.vaultProvider = createModeAwareVaultProvider();

    // Create real executor for sandbox/production
    this.realExecutor = new IntegrationExecutor(this.vaultProvider, {
      ...config?.executorConfig,
      integrationsDir: config?.integrationsDir,
    });
  }

  /**
   * Execute an integration operation with automatic mode resolution
   */
  async execute(request: ModeAwareExecutionRequest): Promise<ModeAwareExecutionResult> {
    const startTime = Date.now();

    // 1. Resolve execution mode
    const modeResult = resolveMode(request.mode, this.projectPath, request.user);

    // 2. Check if mode is allowed
    if (!modeResult.allowed) {
      return this.buildDeniedResult(request, modeResult, startTime);
    }

    // 3. Route to appropriate executor
    switch (modeResult.mode) {
      case 'simulation':
        return this.executeSimulation(request, modeResult);

      case 'sandbox':
      case 'production':
        return this.executeReal(request, modeResult);
    }
  }

  /**
   * Execute in simulation mode
   */
  private async executeSimulation(
    request: ModeAwareExecutionRequest,
    modeResult: ModeResolutionResult
  ): Promise<ModeAwareExecutionResult> {
    const result = await this.simulationExecutor.execute(
      request.integrationId,
      request.operation,
      request.params
    );

    // Update mode source in result
    return {
      ...result,
      modeSource: modeResult.source,
    };
  }

  /**
   * Execute in sandbox or production mode (real API calls)
   */
  private async executeReal(
    request: ModeAwareExecutionRequest,
    modeResult: ModeResolutionResult
  ): Promise<ModeAwareExecutionResult> {
    // Set vault mode before execution
    this.vaultProvider.setMode(modeResult.mode);

    const timestamp = new Date().toISOString();

    // Execute using the real executor
    const result = await this.realExecutor.execute({
      integrationId: request.integrationId,
      operation: request.operation,
      params: request.params,
      timeout: request.timeout,
      skipRetry: request.skipRetry,
    });

    // Convert to ModeAwareExecutionResult
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      errorCode: result.errorCode,
      simulated: false,
      mode: modeResult.mode,
      modeSource: modeResult.source,
      meta: {
        integrationId: result.meta.integrationId,
        operation: result.meta.operation,
        mode: modeResult.mode,
        modeSource: modeResult.source,
        duration: result.meta.duration,
        attempts: result.meta.attempts,
        timestamp: result.meta.timestamp || timestamp,
        circuitBreakerState: result.meta.circuitBreakerState,
        vaultEnvironment: modeResult.mode === 'sandbox' ? 'sandbox' : 'production',
      },
    };
  }

  /**
   * Build result for denied mode
   */
  private buildDeniedResult(
    request: ModeAwareExecutionRequest,
    modeResult: ModeResolutionResult,
    startTime: number
  ): ModeAwareExecutionResult {
    return {
      success: false,
      error: modeResult.denialReason ?? 'Mode not allowed',
      errorCode: 'MODE_NOT_ALLOWED',
      simulated: false,
      mode: modeResult.mode,
      modeSource: modeResult.source,
      meta: {
        integrationId: request.integrationId,
        operation: request.operation,
        mode: modeResult.mode,
        modeSource: modeResult.source,
        duration: Date.now() - startTime,
        attempts: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Set session mode (persists across requests)
   */
  setSessionMode(mode: ExecutionMode, user?: string): void {
    getModeResolver().setSessionMode(mode, user);
  }

  /**
   * Clear session mode
   */
  clearSessionMode(): void {
    getModeResolver().clearSessionMode();
  }

  /**
   * Get current session mode
   */
  getSessionMode(): ExecutionMode | undefined {
    return getModeResolver().getSessionState().currentMode;
  }

  /**
   * Check credential status for an integration
   */
  async checkCredentials(
    _integrationId: string,
    credentialKeys: string[]
  ): Promise<{
    sandbox: { found: string[]; missing: string[] };
    production: { found: string[]; missing: string[] };
  }> {
    // Note: integrationId reserved for future use (loading credentials from descriptor)
    return this.vaultProvider.getCredentialStatus(credentialKeys);
  }

  /**
   * Get the underlying vault provider
   */
  getVaultProvider(): ModeAwareVaultProvider {
    return this.vaultProvider;
  }

  /**
   * Get circuit breaker stats from the real executor
   */
  getCircuitBreakerStats() {
    return this.realExecutor.getCircuitBreakerStats();
  }

  /**
   * Reset circuit breaker for an integration
   */
  resetCircuitBreaker(integrationId: string): boolean {
    return this.realExecutor.resetCircuitBreaker(integrationId);
  }
}

/**
 * Create a mode-aware executor
 */
export function createModeAwareExecutor(config?: ModeAwareExecutorConfig): ModeAwareExecutor {
  return new ModeAwareExecutor(config);
}

/**
 * Singleton instance
 */
let globalExecutor: ModeAwareExecutor | null = null;

/**
 * Get the global mode-aware executor
 */
export function getModeAwareExecutor(): ModeAwareExecutor {
  if (!globalExecutor) {
    globalExecutor = new ModeAwareExecutor();
  }
  return globalExecutor;
}

/**
 * Reset the global executor (for testing)
 */
export function resetModeAwareExecutor(): void {
  globalExecutor = null;
}

/**
 * Convenience function for quick execution
 */
export async function executeWithMode(
  request: ModeAwareExecutionRequest
): Promise<ModeAwareExecutionResult> {
  return getModeAwareExecutor().execute(request);
}
