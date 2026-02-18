/**
 * Integration Verification Types
 *
 * Types for verifying that integrations are correctly configured
 * and able to connect to their external services.
 */

import type { IntegrationType } from '../types.js';

/**
 * Result of verifying an integration
 */
export interface VerificationResult {
  /** Integration that was verified */
  integrationId: string;

  /** Whether verification passed */
  success: boolean;

  /** Status after verification */
  status: 'verified' | 'configured' | 'error';

  /** Verification message */
  message: string;

  /** Details about what was tested */
  details: VerificationDetails;

  /** Time taken for verification (ms) */
  duration: number;

  /** ISO timestamp */
  timestamp: string;
}

/**
 * Details about verification tests
 */
export interface VerificationDetails {
  /** Whether credentials could be resolved */
  credentialsResolved: boolean;

  /** Missing credential keys */
  missingCredentials: string[];

  /** Whether connection was successful */
  connectionSuccess: boolean;

  /** Connection error (if any) */
  connectionError?: string;

  /** Whether test operation succeeded */
  testOperationSuccess?: boolean;

  /** Test operation used */
  testOperation?: string;

  /** Test operation response (summary) */
  testResponse?: string;
}

/**
 * Health check definition for an integration type
 */
export interface HealthCheckDefinition {
  /** Integration type this applies to */
  type: IntegrationType;

  /** Operation to use for health check */
  operation: string;

  /** Parameters for the health check operation */
  params: Record<string, unknown>;

  /** How to validate the response */
  validateResponse: (response: unknown) => boolean;

  /** Description of what this health check does */
  description: string;
}

/**
 * Configuration for verification
 */
export interface VerificationConfig {
  /** Timeout for verification (ms) */
  timeout: number;

  /** Skip actual connection test (just verify credentials exist) */
  skipConnectionTest: boolean;

  /** Custom health check definitions */
  customHealthChecks?: Map<string, HealthCheckDefinition>;
}

/**
 * Default verification configuration
 */
export const DEFAULT_VERIFICATION_CONFIG: VerificationConfig = {
  timeout: 10000,
  skipConnectionTest: false,
};

/**
 * Verification summary for multiple integrations
 */
export interface VerificationSummary {
  /** Total integrations checked */
  total: number;

  /** Successfully verified */
  verified: number;

  /** Configured but not verified */
  configured: number;

  /** Errors */
  errors: number;

  /** Individual results */
  results: VerificationResult[];

  /** Overall status */
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';

  /** ISO timestamp */
  timestamp: string;
}
