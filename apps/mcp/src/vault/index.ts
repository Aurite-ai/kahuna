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

// 1Password provider
export type { OnePasswordReference, OnePasswordStatus } from './1password-provider.js';
export {
  OnePasswordProvider,
  onePasswordProvider,
  parseOpReference,
  formatOpReference,
  vaultPathToOpRef,
  opRefToVaultPath,
  isOpReference,
  getOpInstallInstructions,
} from './1password-provider.js';

// Sensitive data detection
export type {
  DetectionConfidence,
  SensitiveDataType,
  SensitiveDataMatch,
  RedactionResult,
  DetectionOptions,
  LLMVerificationOptions,
  LLMVerificationResult,
} from './sensitive-detection.js';

export {
  detectSensitiveData,
  detectSensitiveDataWithLLM,
  redactSensitiveData,
  hasSensitiveData,
  filterByConfidence,
  detect1PasswordReferences,
  has1PasswordReferences,
  extractVaultReferences,
  // Entropy filtering helpers
  calculateEntropy,
  isPlaceholder,
  isLikelyRealSecret,
  // LLM verification helpers
  verifySecretWithLLM,
  verifySecretsWithLLM,
} from './sensitive-detection.js';
