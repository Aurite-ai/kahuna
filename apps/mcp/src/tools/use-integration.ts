/**
 * Use Integration Tool
 *
 * MCP tool for executing operations on discovered integrations.
 * This is the "action" part of Kahuna - actually using the integrations.
<<<<<<< Updated upstream
 */

import { createSimpleExecutor } from '../integrations/execution/index.js';
=======
 *
 * Supports three execution modes:
 * - simulation: No network calls, returns mock responses (safe, free)
 * - sandbox: Real API calls using test/sandbox credentials (safe testing)
 * - production: Real API calls using production credentials (real operations)
 *
 * Also supports dry_run mode to preview requests without executing them.
 */

import {
  DEFAULT_HTTP_OPERATION_CONFIGS,
  buildAuthHeaders,
  buildPathFromTemplate,
  buildUrl,
} from '../integrations/execution/http-executor.js';
import {
  type ExecutionMode,
  executeWithMode,
  isValidExecutionMode,
  logExecution,
} from '../integrations/execution/modes/index.js';
import { loadIntegration } from '../integrations/storage.js';
>>>>>>> Stashed changes
import { type MCPToolResponse, type ToolContext, markdownResponse } from './types.js';

/**
 * Tool definition for MCP registration
 */
export const useIntegrationToolDefinition = {
  name: 'kahuna_use_integration',
  description: `Execute an operation on a discovered integration.

Use this tool to interact with external services (APIs, databases, etc.) that Kahuna has learned about. 
The integration must first be discovered using kahuna_learn on files that describe it.

**Execution Modes:**
- simulation: No network calls, returns mock responses (safe, free, instant)
- sandbox: Real API calls using test/sandbox credentials (safe testing)
- production: Real API calls using production credentials (real operations)

If mode is not specified, it will be resolved from session or project configuration (defaults to "simulation" for safety).

Examples:
- Simulate a call: integration="slack", operation="send-message", params={...}, mode="simulation"
- Test in sandbox: integration="stripe", operation="create-payment-intent", params={...}, mode="sandbox"
- Execute for real: integration="openai", operation="chat-completion", params={...}, mode="production"

The tool handles:
- Mode-aware credential resolution (sandbox vs production vault)
- Retry logic with exponential backoff
- Circuit breaker to prevent cascading failures
- Audit logging for compliance`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      integration: {
        type: 'string',
        description: 'The integration ID to use (e.g., "postgresql", "slack", "openai")',
      },
      operation: {
        type: 'string',
        description: 'The operation to perform (e.g., "query", "send-message", "chat-completion")',
      },
      params: {
        type: 'object',
        description: 'Parameters for the operation (varies by integration and operation)',
        additionalProperties: true,
      },
      mode: {
        type: 'string',
        enum: ['simulation', 'sandbox', 'production'],
        description:
          'Execution mode: "simulation" (mock, no network), "sandbox" (test credentials), ' +
          'or "production" (real credentials). Defaults to "simulation" if not specified.',
      },
      timeout: {
        type: 'number',
        description: 'Optional timeout in milliseconds (default: 30000)',
      },
      skipRetry: {
        type: 'boolean',
        description: 'Optional: skip retry logic (default: false)',
      },
    },
    required: ['integration', 'operation'],
  },
};

/**
 * Handler for use integration tool
 */
export async function useIntegrationToolHandler(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<MCPToolResponse> {
  const integrationId = args.integration as string;
  const operation = args.operation as string;
  const params = (args.params as Record<string, unknown>) ?? {};
  const mode = args.mode as string | undefined;
  const timeout = args.timeout as number | undefined;
  const skipRetry = args.skipRetry as boolean | undefined;

  if (!integrationId) {
    return markdownResponse('Error: integration ID is required', true);
  }

  if (!operation) {
    return markdownResponse('Error: operation is required', true);
  }

<<<<<<< Updated upstream
=======
  // Validate mode if provided
  if (mode && !isValidExecutionMode(mode)) {
    return markdownResponse(
      `Error: Invalid mode "${mode}". Valid modes: simulation, sandbox, production`,
      true
    );
  }

  // =========================================================================
  // DRY RUN MODE
  // =========================================================================
  if (dryRun) {
    return handleDryRun(integrationId, operation, params);
  }

>>>>>>> Stashed changes
  try {
    // Execute using mode-aware executor
    const result = await executeWithMode({
      integrationId,
      operation,
      params,
      mode: mode as ExecutionMode | undefined,
      timeout,
      skipRetry,
    });

    // Log the execution for audit trail
    logExecution(
      integrationId,
      operation,
      result.mode,
      result.modeSource,
      result.success,
      result.meta.duration,
      undefined, // user
      result.errorCode
    );

    if (result.success) {
      // Build mode indicator
      const modeEmoji =
        result.mode === 'simulation' ? '⚡' : result.mode === 'sandbox' ? '🧪' : '🚀';
      const modeLabel = result.mode.toUpperCase();
      const simulatedNote = result.simulated
        ? '\n\n> ⚠️ **This is a simulated response. No actual API call was made.**'
        : '';

      return markdownResponse(`# ${modeEmoji} ${modeLabel}: Operation Successful

**Integration:** ${integrationId}
**Operation:** ${operation}
**Mode:** ${result.mode} (resolved via ${result.modeSource.replace(/_/g, ' ')})
**Duration:** ${result.meta.duration}ms
**Attempts:** ${result.meta.attempts}${simulatedNote}

## Result

\`\`\`json
${JSON.stringify(result.data, null, 2)}
\`\`\`

---
<hints>
${result.mode === 'simulation' ? '- To test with real APIs, use `mode="sandbox"`\n- To execute in production, use `mode="production"`' : ''}
${result.mode === 'sandbox' ? '- To execute in production, use `mode="production"`' : ''}
</hints>`);
    }

    // Operation failed
    let errorTips = '';
    if (result.errorCode === 'CREDENTIALS_NOT_FOUND') {
      const vaultEnv = result.mode === 'sandbox' ? 'sandbox' : 'production';
      errorTips = `
## Tip

Make sure the required credentials are set in your ${vaultEnv} vault:
- Env vars: Set \`${result.mode === 'sandbox' ? 'SANDBOX_' : ''}[CREDENTIAL_NAME]\`
- Vault file: Add to \`~/.kahuna/vault/${vaultEnv}/.env\``;
    } else if (result.errorCode === 'CIRCUIT_OPEN') {
      errorTips = `
## Tip

The circuit breaker is open due to repeated failures. Wait for the circuit to recover or reset it manually.`;
    } else if (result.errorCode === 'MODE_NOT_ALLOWED') {
      errorTips = `
## Tip

This mode is not allowed in the current project configuration.
Check \`.kahuna/config.yaml\` to see allowed modes.`;
    }

    const modeEmoji = result.mode === 'simulation' ? '⚡' : result.mode === 'sandbox' ? '🧪' : '🚀';

    return markdownResponse(
      `# ${modeEmoji} ${result.mode.toUpperCase()}: Operation Failed

**Integration:** ${integrationId}
**Operation:** ${operation}
**Mode:** ${result.mode}
**Error Code:** ${result.errorCode}
**Duration:** ${result.meta.duration}ms
**Attempts:** ${result.meta.attempts}

## Error

${result.error}${errorTips}`,
      true
    );
  } catch (error) {
    return markdownResponse(
      `Error executing integration operation: ${error instanceof Error ? error.message : String(error)}`,
      true
    );
  }
}

/**
 * Export the tool definition and handler together
 */
export const useIntegrationTool = {
  definition: useIntegrationToolDefinition,
  handler: useIntegrationToolHandler,
};
