/**
 * Integration Verifier
 *
 * Verifies that integrations are correctly configured and can
 * connect to their external services.
 */

import type { VaultProvider } from '../execution/executor.js';
import { IntegrationExecutor } from '../execution/executor.js';
import { listIntegrations, loadIntegration, updateIntegrationStatus } from '../storage.js';
import type { IntegrationDescriptor, IntegrationType } from '../types.js';
import type {
  HealthCheckDefinition,
  VerificationConfig,
  VerificationResult,
  VerificationSummary,
} from './types.js';
import { DEFAULT_VERIFICATION_CONFIG } from './types.js';

/**
 * Default health checks for common integration types
 */
export const DEFAULT_HEALTH_CHECKS: Map<IntegrationType, HealthCheckDefinition> = new Map([
  [
    'database',
    {
      type: 'database',
      operation: 'query',
      params: { sql: 'SELECT 1', query: '{}' },
      validateResponse: (response) => response !== null && response !== undefined,
      description: 'Execute a minimal query to verify database connectivity',
    },
  ],
  [
    'api',
    {
      type: 'api',
      operation: 'list',
      params: { limit: 1 },
      validateResponse: (response) => response !== null && response !== undefined,
      description: 'Fetch a minimal list to verify API connectivity',
    },
  ],
  [
    'messaging',
    {
      type: 'messaging',
      operation: 'list-channels',
      params: { limit: 1 },
      validateResponse: (response) => response !== null && response !== undefined,
      description: 'List channels to verify messaging connectivity',
    },
  ],
  [
    'storage',
    {
      type: 'storage',
      operation: 'list-objects',
      params: { limit: 1 },
      validateResponse: (response) => response !== null && response !== undefined,
      description: 'List objects to verify storage connectivity',
    },
  ],
  [
    'crm',
    {
      type: 'crm',
      operation: 'query',
      params: { query: 'SELECT Id FROM Account LIMIT 1' },
      validateResponse: (response) => response !== null && response !== undefined,
      description: 'Execute a minimal query to verify CRM connectivity',
    },
  ],
  [
    'ai',
    {
      type: 'ai',
      operation: 'chat-completion',
      params: { messages: [{ role: 'user', content: 'test' }], max_tokens: 1 },
      validateResponse: (response) => response !== null && response !== undefined,
      description: 'Send a minimal request to verify AI service connectivity',
    },
  ],
]);

/**
 * Integration Verifier
 *
 * Tests integrations to ensure they are properly configured and functional.
 */
export class IntegrationVerifier {
  private executor: IntegrationExecutor;
  private config: VerificationConfig;
  private healthChecks: Map<string, HealthCheckDefinition>;

  constructor(
    vault: VaultProvider,
    config: Partial<VerificationConfig> = {},
    private integrationsDir?: string
  ) {
    this.config = { ...DEFAULT_VERIFICATION_CONFIG, ...config };
    this.executor = new IntegrationExecutor(vault, {
      defaultTimeout: this.config.timeout,
      integrationsDir,
    });

    // Merge default and custom health checks
    this.healthChecks = new Map(DEFAULT_HEALTH_CHECKS);
    if (this.config.customHealthChecks) {
      for (const [key, check] of this.config.customHealthChecks) {
        this.healthChecks.set(key, check);
      }
    }
  }

  /**
   * Verify a single integration
   */
  async verify(integrationId: string): Promise<VerificationResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // Load integration
    const integration = await loadIntegration(integrationId, this.integrationsDir);

    if (!integration) {
      return {
        integrationId,
        success: false,
        status: 'error',
        message: `Integration not found: ${integrationId}`,
        details: {
          credentialsResolved: false,
          missingCredentials: [],
          connectionSuccess: false,
        },
        duration: Date.now() - startTime,
        timestamp,
      };
    }

    // Step 1: Check credentials
    const credentialCheck = await this.checkCredentials(integration);

    if (!credentialCheck.resolved) {
      await updateIntegrationStatus(integrationId, 'error', this.integrationsDir);

      return {
        integrationId,
        success: false,
        status: 'error',
        message: `Missing credentials: ${credentialCheck.missing.join(', ')}`,
        details: {
          credentialsResolved: false,
          missingCredentials: credentialCheck.missing,
          connectionSuccess: false,
        },
        duration: Date.now() - startTime,
        timestamp,
      };
    }

    // If skip connection test, mark as configured
    if (this.config.skipConnectionTest) {
      await updateIntegrationStatus(integrationId, 'configured', this.integrationsDir);

      return {
        integrationId,
        success: true,
        status: 'configured',
        message: 'Credentials verified, connection test skipped',
        details: {
          credentialsResolved: true,
          missingCredentials: [],
          connectionSuccess: false,
        },
        duration: Date.now() - startTime,
        timestamp,
      };
    }

    // Step 2: Test connection with health check
    const connectionResult = await this.testConnection(integration);

    // Update status based on result
    const newStatus = connectionResult.success ? 'verified' : 'error';
    await updateIntegrationStatus(integrationId, newStatus, this.integrationsDir);

    return {
      integrationId,
      success: connectionResult.success,
      status: newStatus,
      message: connectionResult.success
        ? 'Integration verified successfully'
        : `Connection failed: ${connectionResult.error}`,
      details: {
        credentialsResolved: true,
        missingCredentials: [],
        connectionSuccess: connectionResult.success,
        connectionError: connectionResult.error,
        testOperationSuccess: connectionResult.success,
        testOperation: connectionResult.operation,
        testResponse: connectionResult.response,
      },
      duration: Date.now() - startTime,
      timestamp,
    };
  }

  /**
   * Verify all discovered integrations
   */
  async verifyAll(): Promise<VerificationSummary> {
    const timestamp = new Date().toISOString();
    const integrations = await listIntegrations(this.integrationsDir);

    if (integrations.length === 0) {
      return {
        total: 0,
        verified: 0,
        configured: 0,
        errors: 0,
        results: [],
        overallStatus: 'healthy',
        timestamp,
      };
    }

    // Verify each integration
    const results: VerificationResult[] = [];
    for (const integration of integrations) {
      const result = await this.verify(integration.id);
      results.push(result);
    }

    // Calculate summary
    const verified = results.filter((r) => r.status === 'verified').length;
    const configured = results.filter((r) => r.status === 'configured').length;
    const errors = results.filter((r) => r.status === 'error').length;

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (errors === 0) {
      overallStatus = 'healthy';
    } else if (errors < results.length) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      total: results.length,
      verified,
      configured,
      errors,
      results,
      overallStatus,
      timestamp,
    };
  }

  /**
   * Check if credentials can be resolved
   */
  private async checkCredentials(
    integration: IntegrationDescriptor
  ): Promise<{ resolved: boolean; missing: string[] }> {
    const required = integration.authentication.requiredCredentials;
    const vaultRefs = integration.authentication.vaultRefs;

    const missing: string[] = [];

    for (const key of required) {
      const ref = vaultRefs[key];
      if (!ref) {
        missing.push(key);
      }
    }

    return {
      resolved: missing.length === 0,
      missing,
    };
  }

  /**
   * Test connection with a health check operation
   */
  private async testConnection(
    integration: IntegrationDescriptor
  ): Promise<{ success: boolean; error?: string; operation?: string; response?: string }> {
    // Find appropriate health check
    const healthCheck = this.healthChecks.get(integration.type) ?? this.healthChecks.get('api');

    if (!healthCheck) {
      return {
        success: false,
        error: 'No health check available for this integration type',
      };
    }

    // Check if integration has the required operation
    const hasOperation = integration.operations.some((op) => op.name === healthCheck.operation);

    if (!hasOperation) {
      // Try to find an alternative operation
      const firstOp = integration.operations[0];
      if (!firstOp) {
        return {
          success: false,
          error: 'No operations available for health check',
        };
      }

      // Use the first available operation
      try {
        const result = await this.executor.execute({
          integrationId: integration.id,
          operation: firstOp.name,
          params: {},
          timeout: this.config.timeout,
          skipRetry: true, // Don't retry for verification
        });

        return {
          success: result.success,
          error: result.error,
          operation: firstOp.name,
          response: result.success ? this.summarizeResponse(result.data) : undefined,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          operation: firstOp.name,
        };
      }
    }

    // Execute the health check
    try {
      const result = await this.executor.execute({
        integrationId: integration.id,
        operation: healthCheck.operation,
        params: healthCheck.params,
        timeout: this.config.timeout,
        skipRetry: true,
      });

      if (result.success) {
        const valid = healthCheck.validateResponse(result.data);
        return {
          success: valid,
          error: valid ? undefined : 'Response validation failed',
          operation: healthCheck.operation,
          response: this.summarizeResponse(result.data),
        };
      }

      return {
        success: false,
        error: result.error,
        operation: healthCheck.operation,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        operation: healthCheck.operation,
      };
    }
  }

  /**
   * Create a brief summary of a response for display
   */
  private summarizeResponse(data: unknown): string {
    if (data === null || data === undefined) {
      return 'null';
    }

    if (Array.isArray(data)) {
      return `Array[${data.length}]`;
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return `Object{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
    }

    return String(data).slice(0, 50);
  }

  /**
   * Register a custom health check
   */
  registerHealthCheck(integrationId: string, check: HealthCheckDefinition): void {
    this.healthChecks.set(integrationId, check);
  }
}

/**
 * Create a verifier with a simple vault provider
 */
export function createVerifier(
  secrets: Map<string, string>,
  config?: Partial<VerificationConfig>,
  integrationsDir?: string
): IntegrationVerifier {
  const vault = {
    async getSecret(path: string): Promise<string | null> {
      return secrets.get(path) ?? null;
    },
  };
  return new IntegrationVerifier(vault, config, integrationsDir);
}
