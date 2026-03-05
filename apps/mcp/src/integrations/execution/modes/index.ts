/**
 * Execution Modes Module
 *
 * Provides the three-mode execution system for Kahuna integrations:
 * - simulation: No network calls, returns mock responses (safe, free)
 * - sandbox: Real API calls using test/sandbox credentials (safe testing)
 * - production: Real API calls using production credentials (real operations)
 *
 * @example
 * ```typescript
 * import { executeWithMode, setSessionMode } from './modes';
 *
 * // Set session mode
 * setSessionMode('sandbox');
 *
 * // Execute with automatic mode resolution
 * const result = await executeWithMode({
 *   integrationId: 'slack',
 *   operation: 'send-message',
 *   params: { channel: '#general', message: 'Hello!' },
 * });
 *
 * // Or specify mode explicitly
 * const simResult = await executeWithMode({
 *   integrationId: 'slack',
 *   operation: 'send-message',
 *   params: { channel: '#general', message: 'Hello!' },
 *   mode: 'simulation',
 * });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  ExecutionMode,
  ModeConfig,
  ProjectModeConfig,
  GlobalModeConfig,
  SessionModeState,
  ModeResolutionResult,
  ModeResolutionSource,
  ModeAuditEntry,
  ModeAwareExecutionRequest,
  ModeAwareExecutionResult,
  ModeAwareExecutionMeta,
} from './types.js';

export {
  EXECUTION_MODES,
  DEFAULT_MODE_CONFIGS,
  DEFAULT_PROJECT_MODE_CONFIG,
  DEFAULT_GLOBAL_MODE_CONFIG,
  MODE_RESOLUTION_PRIORITY,
  isValidExecutionMode,
} from './types.js';

// ============================================================================
// Mode Resolver
// ============================================================================

export {
  ModeResolver,
  getModeResolver,
  resetModeResolver,
  resolveMode,
  setSessionMode,
  clearSessionMode,
  getSessionState,
} from './resolver.js';

// ============================================================================
// Simulation Executor
// ============================================================================

export {
  SimulationExecutor,
  createSimulationExecutor,
  getMockResponsePreview,
  hasMockTemplates,
  listMockOperations,
} from './simulation-executor.js';

// ============================================================================
// Mode-Aware Vault
// ============================================================================

export type { VaultEnvironment, ModeAwareVaultConfig } from './mode-aware-vault.js';

export {
  ModeAwareVaultProvider,
  getModeAwareVaultProvider,
  resetModeAwareVaultProvider,
  createModeAwareVaultProvider,
  modeToVaultEnvironment,
} from './mode-aware-vault.js';

// ============================================================================
// Mode-Aware Executor
// ============================================================================

export type { ModeAwareExecutorConfig } from './mode-aware-executor.js';

export {
  ModeAwareExecutor,
  createModeAwareExecutor,
  getModeAwareExecutor,
  resetModeAwareExecutor,
  executeWithMode,
} from './mode-aware-executor.js';

// ============================================================================
// Audit Logging
// ============================================================================

export type { AuditConfig, ExecutionAuditEntry } from './audit.js';

export {
  ModeAuditLogger,
  getAuditLogger,
  resetAuditLogger,
  createAuditLogger,
  logExecution,
} from './audit.js';
