/**
 * Execution Mode Types
 *
 * Defines the three execution modes for Kahuna integrations:
 * - simulation: No network calls, returns mock responses
 * - sandbox: Real API calls using test/sandbox credentials
 * - production: Real API calls using production credentials
 */

/**
 * Available execution modes
 */
export type ExecutionMode = 'simulation' | 'sandbox' | 'production';

/**
 * All available execution modes
 */
export const EXECUTION_MODES: ExecutionMode[] = ['simulation', 'sandbox', 'production'];

/**
 * Check if a string is a valid execution mode
 */
export function isValidExecutionMode(mode: string): mode is ExecutionMode {
  return EXECUTION_MODES.includes(mode as ExecutionMode);
}

/**
 * Mode-specific configuration
 */
export interface ModeConfig {
  /** Whether this mode requires confirmation for certain operations */
  requireConfirmation: boolean;

  /** Operations that require explicit confirmation in this mode */
  confirmationRequired?: string[];

  /** Whether to log all operations in audit trail */
  auditLog: boolean;

  /** Allowed users/roles for this mode (empty = all allowed) */
  allowedUsers?: string[];

  /** Maximum timeout allowed for this mode (ms) */
  maxTimeout?: number;

  /** Whether dry_run is implicitly true (for simulation) */
  implicitDryRun?: boolean;
}

/**
 * Default mode configurations
 */
export const DEFAULT_MODE_CONFIGS: Record<ExecutionMode, ModeConfig> = {
  simulation: {
    requireConfirmation: false,
    auditLog: false,
    implicitDryRun: true,
    maxTimeout: 5000, // Simulation should be fast
  },
  sandbox: {
    requireConfirmation: false,
    auditLog: true,
    maxTimeout: 60000,
  },
  production: {
    requireConfirmation: true,
    confirmationRequired: ['delete-*', 'update-*', 'payment-*', 'send-*'],
    auditLog: true,
    maxTimeout: 120000,
  },
};

/**
 * Project-level mode configuration
 */
export interface ProjectModeConfig {
  /** Default mode for this project */
  defaultMode: ExecutionMode;

  /** Allowed modes (modes not in this list are blocked) */
  allowedModes: ExecutionMode[];

  /** Mode-specific overrides */
  modes?: Partial<Record<ExecutionMode, Partial<ModeConfig>>>;
}

/**
 * Default project mode configuration (safe defaults)
 */
export const DEFAULT_PROJECT_MODE_CONFIG: ProjectModeConfig = {
  defaultMode: 'simulation',
  allowedModes: ['simulation', 'sandbox'],
  modes: {},
};

/**
 * Global user mode configuration
 */
export interface GlobalModeConfig {
  /** User's preferred default mode */
  defaultMode: ExecutionMode;

  /** Whether user can override project mode restrictions */
  allowModeOverride: boolean;
}

/**
 * Default global mode configuration
 */
export const DEFAULT_GLOBAL_MODE_CONFIG: GlobalModeConfig = {
  defaultMode: 'simulation',
  allowModeOverride: false,
};

/**
 * Session mode state (in-memory, per session)
 */
export interface SessionModeState {
  /** Current session mode (if set) */
  currentMode?: ExecutionMode;

  /** When the session mode was set */
  setAt?: string;

  /** Who set the session mode */
  setBy?: string;
}

/**
 * Mode resolution result
 */
export interface ModeResolutionResult {
  /** The resolved execution mode */
  mode: ExecutionMode;

  /** How the mode was determined */
  source: ModeResolutionSource;

  /** The effective mode config (merged from all levels) */
  config: ModeConfig;

  /** Whether this mode is allowed for the current context */
  allowed: boolean;

  /** If not allowed, the reason why */
  denialReason?: string;
}

/**
 * How the mode was determined
 */
export type ModeResolutionSource =
  | 'explicit_parameter' // User specified mode in tool call
  | 'session_mode' // Set via kahuna_set_mode for session
  | 'project_default' // From .kahuna/config.yaml
  | 'global_default' // From ~/.kahuna/config.yaml
  | 'system_default'; // Kahuna's built-in default (simulation)

/**
 * Mode resolution priority (highest to lowest)
 */
export const MODE_RESOLUTION_PRIORITY: ModeResolutionSource[] = [
  'explicit_parameter',
  'session_mode',
  'project_default',
  'global_default',
  'system_default',
];

/**
 * Audit entry for mode-related operations
 */
export interface ModeAuditEntry {
  /** ISO timestamp */
  timestamp: string;

  /** The operation performed */
  action: 'mode_set' | 'mode_resolved' | 'mode_denied' | 'execution';

  /** The mode involved */
  mode: ExecutionMode;

  /** How the mode was determined */
  source: ModeResolutionSource;

  /** User who performed the action */
  user?: string;

  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Mode-aware execution request extends the base request
 */
export interface ModeAwareExecutionRequest {
  /** Integration ID to execute */
  integrationId: string;

  /** Operation name to perform */
  operation: string;

  /** Parameters for the operation */
  params: Record<string, unknown>;

  /** Execution mode (optional - will be resolved if not provided) */
  mode?: ExecutionMode;

  /** Optional timeout in milliseconds */
  timeout?: number;

  /** Optional: Skip retry logic */
  skipRetry?: boolean;

  /** Optional: User making the request */
  user?: string;
}

/**
 * Mode-aware execution result extends the base result
 */
export interface ModeAwareExecutionResult {
  /** Whether the execution succeeded */
  success: boolean;

  /** Result data (if successful) */
  data?: unknown;

  /** Error message (if failed) */
  error?: string;

  /** Error code for programmatic handling */
  errorCode?: string;

  /** Whether this was a simulated result */
  simulated: boolean;

  /** The mode that was used */
  mode: ExecutionMode;

  /** How the mode was determined */
  modeSource: ModeResolutionSource;

  /** Execution metadata */
  meta: ModeAwareExecutionMeta;
}

/**
 * Extended metadata including mode information
 */
export interface ModeAwareExecutionMeta {
  /** Integration that was executed */
  integrationId: string;

  /** Operation that was executed */
  operation: string;

  /** Execution mode used */
  mode: ExecutionMode;

  /** How mode was determined */
  modeSource: ModeResolutionSource;

  /** Execution duration in milliseconds */
  duration: number;

  /** Number of attempts (0 for simulation) */
  attempts: number;

  /** ISO timestamp of execution */
  timestamp: string;

  /** Circuit breaker state (not applicable for simulation) */
  circuitBreakerState?: string;

  /** Vault environment used for credentials */
  vaultEnvironment?: 'sandbox' | 'production';
}
