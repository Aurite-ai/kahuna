/**
 * Credential Prompting Utilities
 *
 * Provides clear, actionable guidance for users when credentials are missing.
 * Works with all supported integrations to show:
 * - Exact environment variable names
 * - 1Password reference paths
 * - Example values and where to get them
 */

import type { IntegrationDescriptor } from './types.js';

/**
 * Information about a credential requirement
 */
export interface CredentialRequirement {
  /** The credential key (e.g., 'api_key', 'bot_token') */
  key: string;
  /** Human-readable name */
  displayName: string;
  /** Description of what this credential is */
  description: string;
  /** Example environment variable name */
  envVarName: string;
  /** Example 1Password reference path */
  opPath: string;
  /** Example value format (redacted) */
  exampleFormat: string;
  /** Where to obtain this credential */
  obtainFrom: string;
  /** Is this credential required or optional */
  required: boolean;
}

/**
 * Credential information for known integrations
 */
const CREDENTIAL_INFO: Record<string, Record<string, Partial<CredentialRequirement>>> = {
  // Databases
  postgresql: {
    database_url: {
      displayName: 'Database URL',
      description: 'Full PostgreSQL connection string',
      envVarName: 'DATABASE_URL',
      exampleFormat: 'postgresql://user:pass@host:5432/dbname',
      obtainFrom: 'Your database provider dashboard or hosting service',
    },
    password: {
      displayName: 'Database Password',
      description: 'Database user password',
      envVarName: 'DATABASE_PASSWORD',
      exampleFormat: '********',
      obtainFrom: 'Your database provider',
    },
  },
  mysql: {
    host: {
      displayName: 'MySQL Host',
      description: 'MySQL server hostname',
      envVarName: 'MYSQL_HOST',
      exampleFormat: 'localhost or db.example.com',
      obtainFrom: 'Your MySQL server configuration',
    },
    username: {
      displayName: 'MySQL Username',
      description: 'Database username',
      envVarName: 'MYSQL_USERNAME',
      exampleFormat: 'root',
      obtainFrom: 'Your database admin',
    },
    password: {
      displayName: 'MySQL Password',
      description: 'Database password',
      envVarName: 'MYSQL_PASSWORD',
      exampleFormat: '********',
      obtainFrom: 'Your database admin',
    },
    database: {
      displayName: 'Database Name',
      description: 'Name of the database to connect to',
      envVarName: 'MYSQL_DATABASE',
      exampleFormat: 'myapp_production',
      obtainFrom: 'Your database configuration',
    },
  },
  sqlite: {
    database_path: {
      displayName: 'Database Path',
      description: 'Path to SQLite database file',
      envVarName: 'SQLITE_DATABASE_PATH',
      exampleFormat: './data/app.db',
      obtainFrom: 'Your local filesystem',
      required: false,
    },
  },
  supabase: {
    url: {
      displayName: 'Supabase URL',
      description: 'Your Supabase project URL',
      envVarName: 'SUPABASE_URL',
      exampleFormat: 'https://xxxx.supabase.co',
      obtainFrom: 'Supabase Dashboard → Settings → API',
    },
    anon_key: {
      displayName: 'Anon Key',
      description: 'Public anonymous key for client access',
      envVarName: 'SUPABASE_ANON_KEY',
      exampleFormat: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      obtainFrom: 'Supabase Dashboard → Settings → API',
    },
    service_role_key: {
      displayName: 'Service Role Key',
      description: 'Secret key for server-side access (admin)',
      envVarName: 'SUPABASE_SERVICE_ROLE_KEY',
      exampleFormat: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      obtainFrom: 'Supabase Dashboard → Settings → API (keep secret!)',
      required: false,
    },
  },
  firebase: {
    api_key: {
      displayName: 'Firebase API Key',
      description: 'Web API key for Firebase',
      envVarName: 'FIREBASE_API_KEY',
      exampleFormat: 'AIzaSy...',
      obtainFrom: 'Firebase Console → Project Settings → General',
    },
    project_id: {
      displayName: 'Project ID',
      description: 'Firebase project identifier',
      envVarName: 'FIREBASE_PROJECT_ID',
      exampleFormat: 'my-app-12345',
      obtainFrom: 'Firebase Console → Project Settings',
    },
    service_account_key: {
      displayName: 'Service Account Key',
      description: 'JSON key for server-side access',
      envVarName: 'FIREBASE_SERVICE_ACCOUNT',
      exampleFormat: '{"type": "service_account", ...}',
      obtainFrom: 'Firebase Console → Project Settings → Service Accounts',
      required: false,
    },
  },

  // AI Services
  openai: {
    api_key: {
      displayName: 'OpenAI API Key',
      description: 'API key for OpenAI services',
      envVarName: 'OPENAI_API_KEY',
      exampleFormat: 'sk-proj-xxxx...',
      obtainFrom: 'https://platform.openai.com/api-keys',
    },
  },
  anthropic: {
    api_key: {
      displayName: 'Anthropic API Key',
      description: 'API key for Claude and other Anthropic models',
      envVarName: 'ANTHROPIC_API_KEY',
      exampleFormat: 'sk-ant-xxxx...',
      obtainFrom: 'https://console.anthropic.com/settings/keys',
    },
  },
  'google-ai': {
    api_key: {
      displayName: 'Google AI API Key',
      description: 'API key for Gemini models',
      envVarName: 'GOOGLE_AI_API_KEY',
      exampleFormat: 'AIzaSy...',
      obtainFrom: 'https://aistudio.google.com/app/apikey',
    },
  },

  // Messaging
  slack: {
    bot_token: {
      displayName: 'Slack Bot Token',
      description: 'OAuth token for your Slack bot',
      envVarName: 'SLACK_BOT_TOKEN',
      exampleFormat: 'xoxb-xxxx-xxxx-xxxx',
      obtainFrom: 'Slack App Dashboard → OAuth & Permissions',
    },
    webhook_url: {
      displayName: 'Webhook URL',
      description: 'Incoming webhook URL for posting messages',
      envVarName: 'SLACK_WEBHOOK_URL',
      exampleFormat: 'https://hooks.slack.com/services/T.../B.../xxxx',
      obtainFrom: 'Slack App Dashboard → Incoming Webhooks',
      required: false,
    },
  },
  discord: {
    bot_token: {
      displayName: 'Discord Bot Token',
      description: 'Token for your Discord bot',
      envVarName: 'DISCORD_BOT_TOKEN',
      exampleFormat: 'MTI...xxxx',
      obtainFrom: 'Discord Developer Portal → Bot → Token',
    },
    client_id: {
      displayName: 'Client ID',
      description: 'OAuth2 client ID',
      envVarName: 'DISCORD_CLIENT_ID',
      exampleFormat: '123456789012345678',
      obtainFrom: 'Discord Developer Portal → OAuth2',
      required: false,
    },
    client_secret: {
      displayName: 'Client Secret',
      description: 'OAuth2 client secret',
      envVarName: 'DISCORD_CLIENT_SECRET',
      exampleFormat: 'xxxx...',
      obtainFrom: 'Discord Developer Portal → OAuth2',
      required: false,
    },
  },
  'microsoft-teams': {
    client_id: {
      displayName: 'Client ID',
      description: 'Azure AD application client ID',
      envVarName: 'TEAMS_CLIENT_ID',
      exampleFormat: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      obtainFrom: 'Azure Portal → App Registrations',
    },
    client_secret: {
      displayName: 'Client Secret',
      description: 'Azure AD application secret',
      envVarName: 'TEAMS_CLIENT_SECRET',
      exampleFormat: 'xxxx~xxxx...',
      obtainFrom: 'Azure Portal → App Registrations → Certificates & Secrets',
    },
    tenant_id: {
      displayName: 'Tenant ID',
      description: 'Azure AD tenant identifier',
      envVarName: 'TEAMS_TENANT_ID',
      exampleFormat: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      obtainFrom: 'Azure Portal → Azure Active Directory → Overview',
    },
  },
  gmail: {
    client_id: {
      displayName: 'OAuth Client ID',
      description: 'Google OAuth 2.0 client ID',
      envVarName: 'GMAIL_CLIENT_ID',
      exampleFormat: 'xxxx.apps.googleusercontent.com',
      obtainFrom: 'Google Cloud Console → APIs & Services → Credentials',
    },
    client_secret: {
      displayName: 'OAuth Client Secret',
      description: 'Google OAuth 2.0 client secret',
      envVarName: 'GMAIL_CLIENT_SECRET',
      exampleFormat: 'GOCSPX-xxxx...',
      obtainFrom: 'Google Cloud Console → APIs & Services → Credentials',
    },
    refresh_token: {
      displayName: 'Refresh Token',
      description: 'OAuth refresh token for persistent access',
      envVarName: 'GMAIL_REFRESH_TOKEN',
      exampleFormat: '1//xxxx...',
      obtainFrom: 'OAuth consent flow (use Google OAuth Playground)',
    },
  },
  sendgrid: {
    api_key: {
      displayName: 'SendGrid API Key',
      description: 'API key for sending emails',
      envVarName: 'SENDGRID_API_KEY',
      exampleFormat: 'SG.xxxx...',
      obtainFrom: 'SendGrid Dashboard → Settings → API Keys',
    },
  },

  // Payment
  stripe: {
    secret_key: {
      displayName: 'Stripe Secret Key',
      description: 'Secret API key for server-side operations',
      envVarName: 'STRIPE_SECRET_KEY',
      exampleFormat: 'sk_live_xxxx... or sk_test_xxxx...',
      obtainFrom: 'Stripe Dashboard → Developers → API Keys',
    },
    publishable_key: {
      displayName: 'Publishable Key',
      description: 'Public key for client-side operations',
      envVarName: 'STRIPE_PUBLISHABLE_KEY',
      exampleFormat: 'pk_live_xxxx... or pk_test_xxxx...',
      obtainFrom: 'Stripe Dashboard → Developers → API Keys',
      required: false,
    },
  },
  paypal: {
    client_id: {
      displayName: 'PayPal Client ID',
      description: 'OAuth client ID for PayPal API',
      envVarName: 'PAYPAL_CLIENT_ID',
      exampleFormat: 'AYxx...',
      obtainFrom: 'PayPal Developer Dashboard → My Apps & Credentials',
    },
    client_secret: {
      displayName: 'PayPal Client Secret',
      description: 'OAuth client secret for PayPal API',
      envVarName: 'PAYPAL_CLIENT_SECRET',
      exampleFormat: 'EKxx...',
      obtainFrom: 'PayPal Developer Dashboard → My Apps & Credentials',
    },
  },

  // Storage
  'aws-s3': {
    access_key_id: {
      displayName: 'AWS Access Key ID',
      description: 'IAM access key for AWS services',
      envVarName: 'AWS_ACCESS_KEY_ID',
      exampleFormat: 'AKIAIOSFODNN7EXAMPLE',
      obtainFrom: 'AWS Console → IAM → Users → Security Credentials',
    },
    secret_access_key: {
      displayName: 'AWS Secret Access Key',
      description: 'IAM secret key for AWS services',
      envVarName: 'AWS_SECRET_ACCESS_KEY',
      exampleFormat: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      obtainFrom: 'AWS Console → IAM → Users → Security Credentials',
    },
  },
  'google-drive': {
    client_id: {
      displayName: 'OAuth Client ID',
      description: 'Google OAuth 2.0 client ID',
      envVarName: 'GOOGLE_DRIVE_CLIENT_ID',
      exampleFormat: 'xxxx.apps.googleusercontent.com',
      obtainFrom: 'Google Cloud Console → APIs & Services → Credentials',
    },
    client_secret: {
      displayName: 'OAuth Client Secret',
      description: 'Google OAuth 2.0 client secret',
      envVarName: 'GOOGLE_DRIVE_CLIENT_SECRET',
      exampleFormat: 'GOCSPX-xxxx...',
      obtainFrom: 'Google Cloud Console → APIs & Services → Credentials',
    },
    refresh_token: {
      displayName: 'Refresh Token',
      description: 'OAuth refresh token for persistent access',
      envVarName: 'GOOGLE_DRIVE_REFRESH_TOKEN',
      exampleFormat: '1//xxxx...',
      obtainFrom: 'OAuth consent flow (use Google OAuth Playground)',
    },
  },
  'google-sheets': {
    client_id: {
      displayName: 'OAuth Client ID',
      description: 'Google OAuth 2.0 client ID',
      envVarName: 'GOOGLE_SHEETS_CLIENT_ID',
      exampleFormat: 'xxxx.apps.googleusercontent.com',
      obtainFrom: 'Google Cloud Console → APIs & Services → Credentials',
    },
    client_secret: {
      displayName: 'OAuth Client Secret',
      description: 'Google OAuth 2.0 client secret',
      envVarName: 'GOOGLE_SHEETS_CLIENT_SECRET',
      exampleFormat: 'GOCSPX-xxxx...',
      obtainFrom: 'Google Cloud Console → APIs & Services → Credentials',
    },
    refresh_token: {
      displayName: 'Refresh Token',
      description: 'OAuth refresh token for persistent access',
      envVarName: 'GOOGLE_SHEETS_REFRESH_TOKEN',
      exampleFormat: '1//xxxx...',
      obtainFrom: 'OAuth consent flow (use Google OAuth Playground)',
    },
  },

  // CRM
  salesforce: {
    client_id: {
      displayName: 'Consumer Key',
      description: 'Connected App consumer key',
      envVarName: 'SALESFORCE_CLIENT_ID',
      exampleFormat: '3MVG9...',
      obtainFrom: 'Salesforce → Setup → App Manager → Connected App',
    },
    client_secret: {
      displayName: 'Consumer Secret',
      description: 'Connected App consumer secret',
      envVarName: 'SALESFORCE_CLIENT_SECRET',
      exampleFormat: 'xxxx...',
      obtainFrom: 'Salesforce → Setup → App Manager → Connected App',
    },
    refresh_token: {
      displayName: 'Refresh Token',
      description: 'OAuth refresh token',
      envVarName: 'SALESFORCE_REFRESH_TOKEN',
      exampleFormat: '5Aep...',
      obtainFrom: 'OAuth flow with your Connected App',
    },
    instance_url: {
      displayName: 'Instance URL',
      description: 'Your Salesforce org URL',
      envVarName: 'SALESFORCE_INSTANCE_URL',
      exampleFormat: 'https://mycompany.salesforce.com',
      obtainFrom: 'Browser URL when logged into Salesforce',
    },
  },
  hubspot: {
    api_key: {
      displayName: 'HubSpot API Key',
      description: 'Private app access token',
      envVarName: 'HUBSPOT_API_KEY',
      exampleFormat: 'pat-na1-xxxx...',
      obtainFrom: 'HubSpot → Settings → Integrations → Private Apps',
    },
    access_token: {
      displayName: 'Access Token',
      description: 'OAuth access token',
      envVarName: 'HUBSPOT_ACCESS_TOKEN',
      exampleFormat: 'xxxx...',
      obtainFrom: 'HubSpot OAuth flow',
      required: false,
    },
  },

  // Developer/Social
  github: {
    personal_access_token: {
      displayName: 'Personal Access Token',
      description: 'GitHub PAT with required scopes',
      envVarName: 'GITHUB_TOKEN',
      exampleFormat: 'ghp_xxxx...',
      obtainFrom: 'GitHub → Settings → Developer Settings → Personal Access Tokens',
    },
  },
  linkedin: {
    client_id: {
      displayName: 'LinkedIn Client ID',
      description: 'OAuth app client ID',
      envVarName: 'LINKEDIN_CLIENT_ID',
      exampleFormat: '86xxxx...',
      obtainFrom: 'LinkedIn Developer Portal → My Apps',
    },
    client_secret: {
      displayName: 'LinkedIn Client Secret',
      description: 'OAuth app client secret',
      envVarName: 'LINKEDIN_CLIENT_SECRET',
      exampleFormat: 'xxxx...',
      obtainFrom: 'LinkedIn Developer Portal → My Apps',
    },
    access_token: {
      displayName: 'Access Token',
      description: 'OAuth access token',
      envVarName: 'LINKEDIN_ACCESS_TOKEN',
      exampleFormat: 'AQVxx...',
      obtainFrom: 'LinkedIn OAuth flow',
    },
  },
  twitter: {
    api_key: {
      displayName: 'API Key (Consumer Key)',
      description: 'Twitter app API key',
      envVarName: 'TWITTER_API_KEY',
      exampleFormat: 'xxxx...',
      obtainFrom: 'Twitter Developer Portal → Project → App',
    },
    api_secret: {
      displayName: 'API Secret',
      description: 'Twitter app API secret',
      envVarName: 'TWITTER_API_SECRET',
      exampleFormat: 'xxxx...',
      obtainFrom: 'Twitter Developer Portal → Project → App',
    },
    access_token: {
      displayName: 'Access Token',
      description: 'User access token',
      envVarName: 'TWITTER_ACCESS_TOKEN',
      exampleFormat: '123456789-xxxx...',
      obtainFrom: 'Twitter Developer Portal → Project → App → Keys & Tokens',
    },
    access_token_secret: {
      displayName: 'Access Token Secret',
      description: 'User access token secret',
      envVarName: 'TWITTER_ACCESS_TOKEN_SECRET',
      exampleFormat: 'xxxx...',
      obtainFrom: 'Twitter Developer Portal → Project → App → Keys & Tokens',
    },
  },

  // Productivity
  notion: {
    api_key: {
      displayName: 'Notion Integration Token',
      description: 'Internal integration token',
      envVarName: 'NOTION_API_KEY',
      exampleFormat: 'ntn_xxxx... or secret_xxxx...',
      obtainFrom: 'Notion → Settings → Integrations → Develop Your Own',
    },
  },
  jira: {
    email: {
      displayName: 'Atlassian Email',
      description: 'Your Atlassian account email',
      envVarName: 'JIRA_EMAIL',
      exampleFormat: 'user@company.com',
      obtainFrom: 'Your Atlassian account email',
    },
    api_token: {
      displayName: 'API Token',
      description: 'Atlassian API token',
      envVarName: 'JIRA_API_TOKEN',
      exampleFormat: 'ATATT3...',
      obtainFrom: 'https://id.atlassian.com/manage-profile/security/api-tokens',
    },
    domain: {
      displayName: 'Jira Domain',
      description: 'Your Jira instance domain',
      envVarName: 'JIRA_DOMAIN',
      exampleFormat: 'yourcompany.atlassian.net',
      obtainFrom: 'Your Jira URL',
    },
  },
};

/**
 * Get detailed credential requirements for an integration
 */
export function getCredentialRequirements(
  integrationId: string,
  requiredCredentials: string[]
): CredentialRequirement[] {
  const integrationInfo = CREDENTIAL_INFO[integrationId] ?? {};

  return requiredCredentials.map((key) => {
    const info = integrationInfo[key] ?? {};
    const uppercaseIntegration = integrationId.toUpperCase().replace(/-/g, '_');
    const uppercaseKey = key.toUpperCase().replace(/-/g, '_');

    return {
      key,
      displayName:
        info.displayName ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      description: info.description ?? `Credential: ${key}`,
      envVarName: info.envVarName ?? `${uppercaseIntegration}_${uppercaseKey}`,
      opPath: `op://vault/${integrationId}/${key}`,
      exampleFormat: info.exampleFormat ?? '********',
      obtainFrom: info.obtainFrom ?? 'Check the service documentation',
      required: info.required !== false,
    };
  });
}

/**
 * Generate a markdown prompt for missing credentials
 */
export function generateCredentialPrompt(
  integration: IntegrationDescriptor,
  missingCredentials: string[]
): string {
  const requirements = getCredentialRequirements(integration.id, missingCredentials);

  let markdown = `# ⚠️ Missing Credentials for ${integration.displayName}

The following credentials are required but not found:

`;

  for (const req of requirements) {
    markdown += `## ${req.displayName}${req.required ? ' (Required)' : ' (Optional)'}

${req.description}

**How to provide:**

| Method | Value |
|--------|-------|
| Environment Variable | \`${req.envVarName}\` |
| 1Password Reference | \`${req.opPath}\` |
| Example Format | \`${req.exampleFormat}\` |

📍 **Where to get it:** ${req.obtainFrom}

---

`;
  }

  markdown += `## Quick Setup Options

### Option 1: Environment Variables

Add to your \`.env\` file or export in your shell:

\`\`\`bash
${requirements.map((r) => `export ${r.envVarName}="your_${r.key}_here"`).join('\n')}
\`\`\`

### Option 2: 1Password References

Use 1Password references in your configuration:

\`\`\`bash
${requirements.map((r) => `${r.envVarName}="${r.opPath}"`).join('\n')}
\`\`\`

### Option 3: Provide via kahuna_learn

You can also teach Kahuna about these credentials by running:

\`\`\`
kahuna_learn("Your ${integration.displayName} credentials: [paste config or describe setup]")
\`\`\`

After providing credentials, run \`kahuna_verify_integration("${integration.id}")\` to verify the setup.
`;

  return markdown;
}

/**
 * Check which credentials are missing from environment
 */
export function checkMissingCredentials(
  integrationId: string,
  requiredCredentials: string[]
): { found: string[]; missing: string[] } {
  const found: string[] = [];
  const missing: string[] = [];

  for (const key of requiredCredentials) {
    const requirements = getCredentialRequirements(integrationId, [key]);
    const envVarName = requirements[0]?.envVarName;

    // Check various possible env var names
    const possibleNames = [
      envVarName,
      envVarName?.toLowerCase(),
      `${integrationId.toUpperCase()}_${key.toUpperCase()}`,
      key.toUpperCase(),
    ].filter(Boolean);

    const isFound = possibleNames.some((name) => name && process.env[name]);

    if (isFound) {
      found.push(key);
    } else {
      missing.push(key);
    }
  }

  return { found, missing };
}

/**
 * Generate a summary of integration credential status
 */
export function generateCredentialStatusSummary(integrations: IntegrationDescriptor[]): string {
  let markdown = `# 🔐 Integration Credential Status

| Integration | Status | Found | Missing |
|-------------|--------|-------|---------|
`;

  for (const integration of integrations) {
    const { found, missing } = checkMissingCredentials(
      integration.id,
      integration.authentication.requiredCredentials
    );

    const status = missing.length === 0 ? '✅' : found.length > 0 ? '⚠️' : '❌';
    markdown += `| ${integration.displayName} | ${status} | ${found.length} | ${missing.length} |\n`;
  }

  const totalMissing = integrations.reduce(
    (acc, i) =>
      acc + checkMissingCredentials(i.id, i.authentication.requiredCredentials).missing.length,
    0
  );

  if (totalMissing > 0) {
    markdown += `
---

**${totalMissing} credentials missing.** Use \`kahuna_verify_integration("<id>")\` for setup instructions.
`;
  } else {
    markdown += `
---

✅ **All integrations have credentials configured!**
`;
  }

  return markdown;
}
