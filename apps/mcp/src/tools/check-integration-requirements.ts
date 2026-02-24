/**
 * Check Integration Requirements Tool
 *
 * Proactively checks what integrations are needed based on user input
 * and reports which credentials are missing BEFORE attempting to build.
 *
 * This enables a better UX flow:
 * 1. User says "build a LinkedIn DM agent"
 * 2. AI calls this tool to check requirements
 * 3. Tool reports LinkedIn needs credentials
 * 4. AI asks user for credentials
 * 5. User provides credentials
 * 6. AI proceeds with building
 */

import {
  checkMissingCredentials,
  generateCredentialPrompt,
} from '../integrations/credential-prompts.js';
import { loadIntegration } from '../integrations/storage.js';
import type { IntegrationDescriptor } from '../integrations/types.js';
import { type MCPToolResponse, type ToolContext, markdownResponse } from './types.js';

/**
 * Integration patterns to detect from user input
 * Maps keywords to integration IDs
 */
const INTEGRATION_KEYWORDS: Record<string, string[]> = {
  // Social/Communication
  linkedin: ['linkedin', 'linked in', 'li profile', 'linkedin dm', 'linkedin message'],
  twitter: ['twitter', 'x.com', 'tweet', 'x platform'],
  discord: ['discord', 'discord bot', 'discord server'],
  slack: ['slack', 'slack bot', 'slack channel', 'slack message'],
  'whatsapp-business': ['whatsapp', 'whats app', 'wa message'],
  'microsoft-teams': ['teams', 'ms teams', 'microsoft teams'],
  twilio: ['twilio', 'sms', 'text message', 'phone call'],
  gmail: ['gmail', 'email', 'google mail'],
  sendgrid: ['sendgrid', 'email api'],

  // Databases
  postgresql: ['postgres', 'postgresql', 'pg database'],
  mysql: ['mysql', 'mariadb'],
  mongodb: ['mongodb', 'mongo'],
  supabase: ['supabase'],
  firebase: ['firebase', 'firestore'],
  sqlite: ['sqlite'],

  // AI Services
  openai: ['openai', 'gpt', 'chatgpt', 'gpt-4', 'gpt-3.5', 'dall-e'],
  anthropic: ['anthropic', 'claude'],
  'google-ai': ['gemini', 'google ai', 'bard'],

  // Payment
  stripe: ['stripe', 'payment', 'credit card'],
  paypal: ['paypal'],

  // Storage
  'aws-s3': ['aws s3', 's3 bucket', 'amazon s3'],
  'google-drive': ['google drive', 'gdrive'],
  'google-sheets': ['google sheets', 'spreadsheet', 'gsheets'],

  // CRM
  salesforce: ['salesforce', 'sfdc'],
  hubspot: ['hubspot'],

  // Developer
  github: ['github', 'git repo', 'repository'],

  // Productivity
  notion: ['notion', 'notion page', 'notion database'],
  jira: ['jira', 'atlassian', 'jira ticket'],
};

/**
 * Detect integrations mentioned in user input
 */
export function detectIntegrationsFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detected: Set<string> = new Set();

  for (const [integrationId, keywords] of Object.entries(INTEGRATION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        detected.add(integrationId);
        break;
      }
    }
  }

  return Array.from(detected);
}

/**
 * Get integration descriptor by ID (from storage or create from known patterns)
 */
async function getIntegrationInfo(integrationId: string): Promise<IntegrationDescriptor | null> {
  // First try to load from storage
  const stored = await loadIntegration(integrationId);
  if (stored) return stored;

  // If not in storage, create a minimal descriptor from known credential requirements
  const knownCredentials: Record<string, string[]> = {
    linkedin: ['client_id', 'client_secret', 'access_token'],
    twitter: ['api_key', 'api_secret', 'access_token', 'access_token_secret'],
    discord: ['bot_token'],
    slack: ['bot_token'],
    'whatsapp-business': ['access_token', 'phone_number_id'],
    'microsoft-teams': ['client_id', 'client_secret', 'tenant_id'],
    twilio: ['account_sid', 'auth_token'],
    gmail: ['client_id', 'client_secret', 'refresh_token'],
    sendgrid: ['api_key'],
    postgresql: ['database_url'],
    mysql: ['host', 'username', 'password', 'database'],
    supabase: ['url', 'anon_key'],
    firebase: ['api_key', 'project_id'],
    openai: ['api_key'],
    anthropic: ['api_key'],
    'google-ai': ['api_key'],
    stripe: ['secret_key'],
    paypal: ['client_id', 'client_secret'],
    'aws-s3': ['access_key_id', 'secret_access_key'],
    'google-drive': ['client_id', 'client_secret', 'refresh_token'],
    'google-sheets': ['client_id', 'client_secret', 'refresh_token'],
    salesforce: ['client_id', 'client_secret', 'refresh_token', 'instance_url'],
    hubspot: ['api_key'],
    github: ['personal_access_token'],
    notion: ['api_key'],
    jira: ['email', 'api_token', 'domain'],
  };

  const requiredCreds = knownCredentials[integrationId];
  if (!requiredCreds) return null;

  // Create a minimal descriptor
  const now = new Date().toISOString();
  return {
    id: integrationId,
    displayName: integrationId
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    type: 'custom',
    description: `${integrationId} integration`,
    operations: [],
    authentication: {
      method: 'api_key',
      requiredCredentials: requiredCreds,
      vaultRefs: {},
    },
    examples: [],
    notes: [],
    source: {
      learnedFrom: 'system',
      learnedAt: now,
      confidence: 1,
      extractionMethod: 'pattern',
    },
    status: 'discovered',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Tool definition for MCP registration
 */
export const checkIntegrationRequirementsToolDefinition = {
  name: 'kahuna_check_integration_requirements',
  description: `Proactively check what integrations and credentials are needed based on user's request.

Use this tool BEFORE building an agent or integration to:
1. Detect which external services are needed from the user's description
2. Check if required credentials are already configured
3. Generate clear instructions for any missing credentials

This prevents wasted effort by identifying credential gaps upfront.

Examples:
- User says "build a LinkedIn DM auto-replier" → detects LinkedIn, checks for OAuth creds
- User says "create a Slack bot that posts daily" → detects Slack, checks for bot token`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      userRequest: {
        type: 'string',
        description: "The user's request or description of what they want to build",
      },
      additionalIntegrations: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional integration IDs to check (e.g., ["openai", "supabase"])',
      },
    },
    required: ['userRequest'],
  },
};

/**
 * Handler for check integration requirements tool
 */
export async function checkIntegrationRequirementsToolHandler(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<MCPToolResponse> {
  const userRequest = args.userRequest as string;
  const additionalIntegrations = (args.additionalIntegrations as string[]) ?? [];

  if (!userRequest) {
    return markdownResponse('Error: userRequest is required', true);
  }

  try {
    // Detect integrations from user request
    const detectedIds = detectIntegrationsFromText(userRequest);

    // Combine with additional integrations
    const allIntegrationIds = [...new Set([...detectedIds, ...additionalIntegrations])];

    if (allIntegrationIds.length === 0) {
      return markdownResponse(`# ✅ No External Integrations Detected

Based on your request:
> "${userRequest.slice(0, 200)}${userRequest.length > 200 ? '...' : ''}"

I didn't detect any external service integrations needed.

If you do need external services, please:
1. Specify which services you want to use
2. Or run \`kahuna_list_integrations()\` to see available integrations`);
    }

    // Check each integration
    const results: Array<{
      id: string;
      displayName: string;
      found: string[];
      missing: string[];
      integration: IntegrationDescriptor | null;
    }> = [];

    for (const integrationId of allIntegrationIds) {
      const integration = await getIntegrationInfo(integrationId);

      if (integration) {
        const { found, missing } = checkMissingCredentials(
          integrationId,
          integration.authentication.requiredCredentials
        );
        results.push({
          id: integrationId,
          displayName: integration.displayName,
          found,
          missing,
          integration,
        });
      } else {
        results.push({
          id: integrationId,
          displayName: integrationId,
          found: [],
          missing: [],
          integration: null,
        });
      }
    }

    // Generate report
    const allReady = results.every((r) => r.missing.length === 0);
    const someReady = results.some((r) => r.missing.length === 0);

    let markdown = `# ${allReady ? '✅' : someReady ? '⚠️' : '❌'} Integration Requirements Check

Based on your request:
> "${userRequest.slice(0, 200)}${userRequest.length > 200 ? '...' : ''}"

## Detected Integrations

| Integration | Status | Credentials |
|-------------|--------|-------------|
`;

    for (const result of results) {
      const status =
        result.missing.length === 0
          ? '✅ Ready'
          : result.found.length > 0
            ? '⚠️ Partial'
            : '❌ Missing';
      const credStatus =
        result.missing.length === 0
          ? `${result.found.length} configured`
          : `${result.found.length} found, ${result.missing.length} missing`;
      markdown += `| ${result.displayName} | ${status} | ${credStatus} |\n`;
    }

    // If any credentials are missing, show detailed prompts
    const integrationsNeedingCreds = results.filter((r) => r.missing.length > 0);

    if (integrationsNeedingCreds.length > 0) {
      markdown += `

---

# 🔑 Credentials Required

The following integrations need credentials before we can proceed:

`;

      for (const result of integrationsNeedingCreds) {
        if (result.integration) {
          markdown += generateCredentialPrompt(result.integration, result.missing);
          markdown += '\n---\n\n';
        }
      }

      markdown += `
## Next Steps

1. **Provide the credentials above** using one of the methods shown
2. **Run this check again** to verify: \`kahuna_check_integration_requirements("${userRequest.slice(0, 50)}")\`
3. **Or proceed anyway** - I'll prompt you again when we try to use the integration

Once credentials are configured, I can proceed with building your request.
`;
    } else {
      markdown += `

---

## ✅ All Systems Go!

All required credentials are configured. You can proceed with building:
> "${userRequest.slice(0, 100)}${userRequest.length > 100 ? '...' : ''}"

Would you like me to continue?
`;
    }

    return markdownResponse(markdown);
  } catch (error) {
    return markdownResponse(
      `Error checking integration requirements: ${error instanceof Error ? error.message : String(error)}`,
      true
    );
  }
}

/**
 * Export the tool definition and handler together
 */
export const checkIntegrationRequirementsTool = {
  definition: checkIntegrationRequirementsToolDefinition,
  handler: checkIntegrationRequirementsToolHandler,
};
