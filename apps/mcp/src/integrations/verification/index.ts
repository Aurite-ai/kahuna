/**
 * Verification Module
 *
 * Provides tools for verifying that integrations are correctly
 * configured and can connect to their external services.
 */

// Types
export type {
  HealthCheckDefinition,
  VerificationConfig,
  VerificationDetails,
  VerificationResult,
  VerificationSummary,
} from './types.js';

export { DEFAULT_VERIFICATION_CONFIG } from './types.js';

// Verifier
export { createVerifier, DEFAULT_HEALTH_CHECKS, IntegrationVerifier } from './verifier.js';
