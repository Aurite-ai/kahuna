/**
 * Vault Module
 *
 * Secure credential management for integrations.
 * Provides vault providers and sensitive data detection.
 *
 * See: docs/design/secure-integrations.md
 */

// Types and interfaces
export type {
  VaultProviderType,
  SecretReference,
  VaultProvider,
  VaultConfig,
  VaultOperationResult,
  VaultAuditEntry,
} from './types.js';

export {
  parseVaultReference,
  formatVaultReference,
  isValidProvider,
  isVaultReference,
  DEFAULT_VAULT_CONFIG,
} from './types.js';

// Environment variable provider
export { EnvVaultProvider, envVaultProvider } from './env-provider.js';

// Sensitive data detection
export type {
  DetectionConfidence,
  SensitiveDataType,
  SensitiveDataMatch,
  RedactionResult,
} from './sensitive-detection.js';

export {
  detectSensitiveData,
  redactSensitiveData,
  hasSensitiveData,
  filterByConfidence,
} from './sensitive-detection.js';
