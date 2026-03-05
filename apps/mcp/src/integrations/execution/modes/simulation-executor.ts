/**
 * Simulation Executor
 *
 * Handles execution in simulation mode:
 * - No network calls
 * - Returns realistic mock responses
 * - Validates parameters and integration existence
 * - Fast and cost-free
 */

import { loadIntegration } from '../../storage.js';
import type { IntegrationOperation } from '../../types.js';
import type { ModeAwareExecutionMeta, ModeAwareExecutionResult } from './types.js';

/**
 * Mock response templates for different integration types
 */
const MOCK_RESPONSE_TEMPLATES: Record<string, Record<string, unknown>> = {
  // Messaging integrations
  slack: {
    'send-message': {
      ok: true,
      channel: 'C0SIMULATED',
      ts: '{{timestamp}}',
      message: {
        text: '{{params.message}}',
        user: 'U0SIMULATED',
        ts: '{{timestamp}}',
      },
    },
    'list-channels': {
      ok: true,
      channels: [
        { id: 'C0SIM001', name: 'general', is_private: false },
        { id: 'C0SIM002', name: 'random', is_private: false },
        { id: 'C0SIM003', name: 'test', is_private: true },
      ],
    },
  },

  // Payment integrations
  stripe: {
    'create-payment-intent': {
      id: 'pi_simulated_{{randomId}}',
      object: 'payment_intent',
      amount: '{{params.amount}}',
      currency: '{{params.currency}}',
      status: 'requires_payment_method',
      livemode: false,
      created: '{{unixTimestamp}}',
    },
    'list-customers': {
      object: 'list',
      data: [
        { id: 'cus_sim001', email: 'test1@example.com', name: 'Test Customer 1' },
        { id: 'cus_sim002', email: 'test2@example.com', name: 'Test Customer 2' },
      ],
      has_more: false,
    },
  },

  // Database integrations
  postgresql: {
    query: {
      rows: [
        { id: 1, name: 'Simulated Row 1', created_at: '{{isoTimestamp}}' },
        { id: 2, name: 'Simulated Row 2', created_at: '{{isoTimestamp}}' },
      ],
      rowCount: 2,
      command: 'SELECT',
    },
    execute: {
      rowCount: 1,
      command: 'INSERT',
    },
  },

  // AI integrations
  openai: {
    'chat-completion': {
      id: 'chatcmpl-simulated-{{randomId}}',
      object: 'chat.completion',
      created: '{{unixTimestamp}}',
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '[SIMULATED] This is a simulated response. No actual API call was made.',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    },
    embeddings: {
      object: 'list',
      data: [
        {
          object: 'embedding',
          embedding: Array(1536).fill(0.001),
          index: 0,
        },
      ],
      model: 'text-embedding-ada-002',
      usage: {
        prompt_tokens: 5,
        total_tokens: 5,
      },
    },
  },

  // Storage integrations
  s3: {
    'list-objects': {
      Contents: [
        { Key: 'simulated-file-1.txt', Size: 1024, LastModified: '{{isoTimestamp}}' },
        { Key: 'simulated-file-2.txt', Size: 2048, LastModified: '{{isoTimestamp}}' },
      ],
      IsTruncated: false,
    },
    'get-object': {
      Body: '[SIMULATED] File content would be here',
      ContentType: 'text/plain',
      ContentLength: 100,
    },
    'put-object': {
      ETag: '"simulated-etag-{{randomId}}"',
      VersionId: 'simulated-version-id',
    },
  },

  // CRM integrations
  salesforce: {
    query: {
      totalSize: 2,
      done: true,
      records: [
        { Id: 'sim001', Name: 'Simulated Account 1', Type: 'Customer' },
        { Id: 'sim002', Name: 'Simulated Account 2', Type: 'Prospect' },
      ],
    },
    'create-record': {
      id: 'sim_{{randomId}}',
      success: true,
      errors: [],
    },
  },

  // Email integrations
  sendgrid: {
    'send-email': {
      statusCode: 202,
      body: '',
      headers: {
        'x-message-id': 'sim_{{randomId}}',
      },
    },
  },

  gmail: {
    'send-email': {
      id: 'sim_{{randomId}}',
      threadId: 'sim_thread_{{randomId}}',
      labelIds: ['SENT'],
    },
    'list-messages': {
      messages: [
        { id: 'msg_sim001', threadId: 'thread_sim001' },
        { id: 'msg_sim002', threadId: 'thread_sim002' },
      ],
      resultSizeEstimate: 2,
    },
  },

  // Developer integrations
  github: {
    'list-repos': [
      { id: 1, name: 'simulated-repo-1', full_name: 'user/simulated-repo-1', private: false },
      { id: 2, name: 'simulated-repo-2', full_name: 'user/simulated-repo-2', private: true },
    ],
    'create-issue': {
      id: 1,
      number: 42,
      title: '{{params.title}}',
      state: 'open',
      html_url: 'https://github.com/user/repo/issues/42',
    },
  },
};

/**
 * Generic mock response for unknown operations
 */
const GENERIC_MOCK_RESPONSE = {
  success: true,
  message: '[SIMULATED] Operation completed successfully',
  data: null,
  timestamp: '{{isoTimestamp}}',
};

/**
 * Simulation Executor class
 */
export class SimulationExecutor {
  private integrationsDir?: string;

  constructor(options?: { integrationsDir?: string }) {
    this.integrationsDir = options?.integrationsDir;
  }

  /**
   * Execute an operation in simulation mode
   */
  async execute(
    integrationId: string,
    operation: string,
    params: Record<string, unknown>
  ): Promise<ModeAwareExecutionResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // 1. Load integration descriptor
    const integration = await loadIntegration(integrationId, this.integrationsDir);

    if (!integration) {
      return this.buildErrorResult(
        integrationId,
        operation,
        startTime,
        'INTEGRATION_NOT_FOUND',
        `Integration not found: ${integrationId}`
      );
    }

    // 2. Find the operation
    const operationDef = integration.operations.find((op) => op.name === operation);

    if (!operationDef) {
      const availableOps = integration.operations.map((op) => op.name).join(', ');
      return this.buildErrorResult(
        integrationId,
        operation,
        startTime,
        'OPERATION_NOT_FOUND',
        `Operation not found: ${operation}. Available: ${availableOps}`
      );
    }

    // 3. Validate parameters
    const validationResult = this.validateParams(operationDef, params);
    if (!validationResult.valid) {
      return this.buildErrorResult(
        integrationId,
        operation,
        startTime,
        'VALIDATION_ERROR',
        validationResult.error ?? 'Parameter validation failed'
      );
    }

    // 4. Generate mock response
    const mockResponse = this.generateMockResponse(integrationId, operation, params);

    // 5. Return successful simulated result
    const meta: ModeAwareExecutionMeta = {
      integrationId,
      operation,
      mode: 'simulation',
      modeSource: 'explicit_parameter',
      duration: Date.now() - startTime,
      attempts: 0,
      timestamp,
    };

    return {
      success: true,
      data: mockResponse,
      simulated: true,
      mode: 'simulation',
      modeSource: 'explicit_parameter',
      meta,
    };
  }

  /**
   * Validate parameters against operation definition
   */
  private validateParams(
    operation: IntegrationOperation,
    params: Record<string, unknown>
  ): { valid: boolean; error?: string } {
    // Check required parameters using the params array from IntegrationOperation
    if (operation.params && operation.params.length > 0) {
      for (const paramDef of operation.params) {
        if (paramDef.required && params[paramDef.name] === undefined) {
          return {
            valid: false,
            error: `Missing required parameter: ${paramDef.name}`,
          };
        }

        // Basic type validation
        if (params[paramDef.name] !== undefined && paramDef.type) {
          const actualType = typeof params[paramDef.name];
          const expectedType = paramDef.type;

          // Simplified type checking
          if (expectedType === 'string' && actualType !== 'string') {
            return {
              valid: false,
              error: `Parameter ${paramDef.name} should be string, got ${actualType}`,
            };
          }
          if (expectedType === 'number' && actualType !== 'number') {
            return {
              valid: false,
              error: `Parameter ${paramDef.name} should be number, got ${actualType}`,
            };
          }
          if (expectedType === 'boolean' && actualType !== 'boolean') {
            return {
              valid: false,
              error: `Parameter ${paramDef.name} should be boolean, got ${actualType}`,
            };
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Generate a mock response for an operation
   */
  private generateMockResponse(
    integrationId: string,
    operation: string,
    params: Record<string, unknown>
  ): unknown {
    // Look up template for this integration and operation
    const integrationTemplates = MOCK_RESPONSE_TEMPLATES[integrationId];
    const template = integrationTemplates?.[operation] ?? GENERIC_MOCK_RESPONSE;

    // Process template placeholders
    return this.processTemplate(template, params);
  }

  /**
   * Process template placeholders with actual values
   */
  private processTemplate(template: unknown, params: Record<string, unknown>): unknown {
    if (typeof template === 'string') {
      return this.processStringTemplate(template, params);
    }

    if (Array.isArray(template)) {
      return template.map((item) => this.processTemplate(item, params));
    }

    if (typeof template === 'object' && template !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.processTemplate(value, params);
      }
      return result;
    }

    return template;
  }

  /**
   * Process string template with placeholders
   */
  private processStringTemplate(template: string, params: Record<string, unknown>): string {
    let result = template;

    // Replace {{timestamp}} with Slack-style timestamp
    result = result.replace(/\{\{timestamp\}\}/g, () => {
      const now = Date.now();
      return `${Math.floor(now / 1000)}.${String(now % 1000).padStart(6, '0')}`;
    });

    // Replace {{isoTimestamp}} with ISO timestamp
    result = result.replace(/\{\{isoTimestamp\}\}/g, () => new Date().toISOString());

    // Replace {{unixTimestamp}} with Unix timestamp
    result = result.replace(/\{\{unixTimestamp\}\}/g, () => String(Math.floor(Date.now() / 1000)));

    // Replace {{randomId}} with random ID
    result = result.replace(/\{\{randomId\}\}/g, () => this.generateRandomId());

    // Replace {{params.xxx}} with parameter values
    result = result.replace(/\{\{params\.(\w+)\}\}/g, (_, paramName) => {
      const value = params[paramName];
      return value !== undefined ? String(value) : `[${paramName}]`;
    });

    return result;
  }

  /**
   * Generate a random ID for mock responses
   */
  private generateRandomId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Build an error result
   */
  private buildErrorResult(
    integrationId: string,
    operation: string,
    startTime: number,
    errorCode: string,
    error: string
  ): ModeAwareExecutionResult {
    return {
      success: false,
      error,
      errorCode,
      simulated: true,
      mode: 'simulation',
      modeSource: 'explicit_parameter',
      meta: {
        integrationId,
        operation,
        mode: 'simulation',
        modeSource: 'explicit_parameter',
        duration: Date.now() - startTime,
        attempts: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Create a simulation executor instance
 */
export function createSimulationExecutor(options?: {
  integrationsDir?: string;
}): SimulationExecutor {
  return new SimulationExecutor(options);
}

/**
 * Get mock response preview for an operation
 * (Useful for showing what would be returned without validation)
 */
export function getMockResponsePreview(
  integrationId: string,
  operation: string,
  params: Record<string, unknown> = {}
): unknown {
  const integrationTemplates = MOCK_RESPONSE_TEMPLATES[integrationId];
  const template = integrationTemplates?.[operation] ?? GENERIC_MOCK_RESPONSE;

  // Process template inline since processTemplate is private
  return processTemplateForPreview(template, params);
}

/**
 * Process template placeholders for preview (standalone function)
 */
function processTemplateForPreview(template: unknown, params: Record<string, unknown>): unknown {
  if (typeof template === 'string') {
    let result = template;
    result = result.replace(/\{\{timestamp\}\}/g, () => {
      const now = Date.now();
      return `${Math.floor(now / 1000)}.${String(now % 1000).padStart(6, '0')}`;
    });
    result = result.replace(/\{\{isoTimestamp\}\}/g, () => new Date().toISOString());
    result = result.replace(/\{\{unixTimestamp\}\}/g, () => String(Math.floor(Date.now() / 1000)));
    result = result.replace(/\{\{randomId\}\}/g, () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let id = '';
      for (let i = 0; i < 24; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
    });
    result = result.replace(/\{\{params\.(\w+)\}\}/g, (_, paramName) => {
      const value = params[paramName];
      return value !== undefined ? String(value) : `[${paramName}]`;
    });
    return result;
  }

  if (Array.isArray(template)) {
    return template.map((item) => processTemplateForPreview(item, params));
  }

  if (typeof template === 'object' && template !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = processTemplateForPreview(value, params);
    }
    return result;
  }

  return template;
}

/**
 * Check if an integration has mock templates defined
 */
export function hasMockTemplates(integrationId: string): boolean {
  return integrationId in MOCK_RESPONSE_TEMPLATES;
}

/**
 * List operations with mock templates for an integration
 */
export function listMockOperations(integrationId: string): string[] {
  const templates = MOCK_RESPONSE_TEMPLATES[integrationId];
  return templates ? Object.keys(templates) : [];
}
