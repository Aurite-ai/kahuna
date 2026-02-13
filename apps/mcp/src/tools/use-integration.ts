/**
 * Use Integration Tool
 *
 * MCP tool for executing operations on discovered integrations.
 * This is the "action" part of Kahuna - actually using the integrations.
 */

import { createSimpleExecutor } from '../integrations/execution/index.js';
import { type MCPToolResponse, type ToolContext, markdownResponse } from './types.js';

/**
 * Tool definition for MCP registration
 */
export const useIntegrationToolDefinition = {
  name: 'kahuna_use_integration',
  description: `Execute an operation on a discovered integration.

Use this tool to interact with external services (APIs, databases, etc.) that Kahuna has learned about. 
The integration must first be discovered using kahuna_learn on files that describe it.

Examples:
- Query a database: integration="postgresql", operation="query", params={sql: "SELECT * FROM users"}
- Send a message: integration="slack", operation="send-message", params={channel: "#general", text: "Hello"}
- Call an API: integration="openai", operation="chat-completion", params={messages: [...]}

The tool handles:
- Credential resolution from vault
- Retry logic with exponential backoff
- Circuit breaker to prevent cascading failures
- Request/response logging`,
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
  const timeout = args.timeout as number | undefined;
  const skipRetry = args.skipRetry as boolean | undefined;

  if (!integrationId) {
    return markdownResponse('Error: integration ID is required', true);
  }

  if (!operation) {
    return markdownResponse('Error: operation is required', true);
  }

  try {
    // Create executor with vault provider that uses environment variables
    const secrets = new Map<string, string>();

    // Load all relevant environment variables
    for (const [key, value] of Object.entries(process.env)) {
      if (value) {
        // Store with multiple path formats for flexibility
        const lowerKey = key.toLowerCase();
        secrets.set(lowerKey, value);
        secrets.set(lowerKey.replace(/_/g, '/'), value);
        secrets.set(key, value);
      }
    }

    const executor = createSimpleExecutor(secrets);

    // Execute the operation
    const result = await executor.execute({
      integrationId,
      operation,
      params,
      timeout,
      skipRetry,
    });

    if (result.success) {
      return markdownResponse(`# ✅ Operation Successful

**Integration:** ${integrationId}
**Operation:** ${operation}
**Duration:** ${result.meta.duration}ms
**Attempts:** ${result.meta.attempts}

## Result

\`\`\`json
${JSON.stringify(result.data, null, 2)}
\`\`\``);
    }

    // Operation failed
    let errorTips = '';
    if (result.errorCode === 'CREDENTIALS_NOT_FOUND') {
      errorTips = `
## Tip

Make sure the required credentials are set as environment variables or in your vault.
Check the integration's required credentials and ensure they're available.`;
    } else if (result.errorCode === 'CIRCUIT_OPEN') {
      errorTips = `
## Tip

The circuit breaker is open due to repeated failures. Wait for the circuit to recover or reset it manually.`;
    }

    return markdownResponse(
      `# ❌ Operation Failed

**Integration:** ${integrationId}
**Operation:** ${operation}
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
