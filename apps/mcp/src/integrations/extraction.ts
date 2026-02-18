/**
 * Integration Extraction
 *
 * Extracts integration descriptors from content. Uses a two-phase approach:
 * 1. Pattern-based detection for common services (fast, no API calls)
 * 2. LLM-based extraction for detailed capability discovery (optional)
 *
 * Works alongside sensitive-detection.ts:
 * - sensitive-detection.ts: Finds credentials → vault
 * - extraction.ts: Finds capabilities → knowledge base
 */

import { type OnePasswordReference, parseOpReference } from '../vault/1password-provider.js';
import type { SensitiveDataMatch } from '../vault/sensitive-detection.js';
import type {
  AuthMethod,
  IntegrationDescriptor,
  IntegrationExtractionResult,
  IntegrationMention,
  IntegrationOperation,
  IntegrationType,
} from './types.js';

/**
 * Known integration patterns for quick detection
 */
interface KnownIntegrationPattern {
  /** Pattern to match in content */
  pattern: RegExp;
  /** Integration type */
  type: IntegrationType;
  /** Default display name */
  displayName: string;
  /** Default ID (kebab-case) */
  id: string;
  /** Authentication method this typically uses */
  authMethod: AuthMethod;
  /** Typical credential keys */
  credentialKeys: string[];
  /** Common operations */
  defaultOperations: IntegrationOperation[];
}

/**
 * Known integration patterns for common services
 */
const KNOWN_PATTERNS: KnownIntegrationPattern[] = [
  // Databases
  {
    pattern: /postgres(?:ql)?|pg_/gi,
    type: 'database',
    displayName: 'PostgreSQL Database',
    id: 'postgresql',
    authMethod: 'basic_auth',
    credentialKeys: ['database_url', 'password'],
    defaultOperations: [
      {
        name: 'query',
        description: 'Execute a SQL query',
        params: [
          { name: 'sql', description: 'SQL query to execute', type: 'string', required: true },
          { name: 'params', description: 'Query parameters', type: 'array', required: false },
        ],
        returns: { type: 'array', description: 'Query results as array of objects' },
      },
      {
        name: 'execute',
        description: 'Execute a SQL statement (insert, update, delete)',
        params: [
          { name: 'sql', description: 'SQL statement to execute', type: 'string', required: true },
          { name: 'params', description: 'Statement parameters', type: 'array', required: false },
        ],
        returns: { type: 'object', description: 'Execution result with affected rows' },
      },
    ],
  },
  {
    pattern: /mongodb|mongo\s+(?:db|database)|mongoose/gi,
    type: 'database',
    displayName: 'MongoDB Database',
    id: 'mongodb',
    authMethod: 'basic_auth',
    credentialKeys: ['connection_string', 'password'],
    defaultOperations: [
      {
        name: 'find',
        description: 'Find documents in a collection',
        params: [
          { name: 'collection', description: 'Collection name', type: 'string', required: true },
          { name: 'filter', description: 'Query filter', type: 'object', required: false },
        ],
        returns: { type: 'array', description: 'Matching documents' },
      },
      {
        name: 'insert',
        description: 'Insert documents into a collection',
        params: [
          { name: 'collection', description: 'Collection name', type: 'string', required: true },
          { name: 'documents', description: 'Documents to insert', type: 'array', required: true },
        ],
        returns: { type: 'object', description: 'Insert result with IDs' },
      },
    ],
  },

  // Messaging
  {
    pattern: /slack|xoxb-|slack\.com/gi,
    type: 'messaging',
    displayName: 'Slack',
    id: 'slack',
    authMethod: 'bearer_token',
    credentialKeys: ['bot_token', 'webhook_url'],
    defaultOperations: [
      {
        name: 'send-message',
        description: 'Send a message to a Slack channel',
        params: [
          { name: 'channel', description: 'Channel ID or name', type: 'string', required: true },
          { name: 'text', description: 'Message text', type: 'string', required: true },
          { name: 'blocks', description: 'Block Kit blocks', type: 'array', required: false },
        ],
        returns: { type: 'object', description: 'Message posting result' },
      },
      {
        name: 'list-channels',
        description: 'List available Slack channels',
        params: [],
        returns: { type: 'array', description: 'List of channels' },
      },
    ],
  },

  // Email
  {
    pattern: /gmail|google\s+mail|smtp\.google/gi,
    type: 'messaging',
    displayName: 'Gmail',
    id: 'gmail',
    authMethod: 'oauth2',
    credentialKeys: ['client_id', 'client_secret', 'refresh_token'],
    defaultOperations: [
      {
        name: 'send-email',
        description: 'Send an email via Gmail',
        params: [
          { name: 'to', description: 'Recipient email address', type: 'string', required: true },
          { name: 'subject', description: 'Email subject', type: 'string', required: true },
          {
            name: 'body',
            description: 'Email body (HTML or plain text)',
            type: 'string',
            required: true,
          },
        ],
        returns: { type: 'object', description: 'Send result with message ID' },
      },
      {
        name: 'list-messages',
        description: 'List emails from inbox',
        params: [
          { name: 'query', description: 'Search query', type: 'string', required: false },
          {
            name: 'maxResults',
            description: 'Maximum number of results',
            type: 'number',
            required: false,
          },
        ],
        returns: { type: 'array', description: 'List of email summaries' },
      },
    ],
  },
  {
    pattern: /sendgrid|sg\./gi,
    type: 'messaging',
    displayName: 'SendGrid',
    id: 'sendgrid',
    authMethod: 'api_key',
    credentialKeys: ['api_key'],
    defaultOperations: [
      {
        name: 'send-email',
        description: 'Send an email via SendGrid',
        params: [
          { name: 'to', description: 'Recipient email', type: 'string', required: true },
          { name: 'from', description: 'Sender email', type: 'string', required: true },
          { name: 'subject', description: 'Email subject', type: 'string', required: true },
          { name: 'content', description: 'Email content', type: 'string', required: true },
        ],
        returns: { type: 'object', description: 'Send result' },
      },
    ],
  },

  // CRM
  {
    pattern: /salesforce|sfdc|force\.com/gi,
    type: 'crm',
    displayName: 'Salesforce',
    id: 'salesforce',
    authMethod: 'oauth2',
    credentialKeys: ['client_id', 'client_secret', 'refresh_token', 'instance_url'],
    defaultOperations: [
      {
        name: 'query',
        description: 'Execute a SOQL query',
        params: [{ name: 'soql', description: 'SOQL query', type: 'string', required: true }],
        returns: { type: 'array', description: 'Query results' },
      },
      {
        name: 'create-record',
        description: 'Create a new record',
        params: [
          {
            name: 'objectType',
            description: 'Salesforce object type',
            type: 'string',
            required: true,
          },
          { name: 'data', description: 'Record data', type: 'object', required: true },
        ],
        returns: { type: 'object', description: 'Created record ID' },
      },
      {
        name: 'update-record',
        description: 'Update an existing record',
        params: [
          {
            name: 'objectType',
            description: 'Salesforce object type',
            type: 'string',
            required: true,
          },
          { name: 'id', description: 'Record ID', type: 'string', required: true },
          { name: 'data', description: 'Fields to update', type: 'object', required: true },
        ],
        returns: { type: 'object', description: 'Update result' },
      },
    ],
  },
  {
    pattern: /hubspot/gi,
    type: 'crm',
    displayName: 'HubSpot',
    id: 'hubspot',
    authMethod: 'api_key',
    credentialKeys: ['api_key', 'access_token'],
    defaultOperations: [
      {
        name: 'get-contact',
        description: 'Get a contact by email or ID',
        params: [
          { name: 'email', description: 'Contact email', type: 'string', required: false },
          { name: 'id', description: 'Contact ID', type: 'string', required: false },
        ],
        returns: { type: 'object', description: 'Contact details' },
      },
      {
        name: 'create-contact',
        description: 'Create a new contact',
        params: [
          { name: 'properties', description: 'Contact properties', type: 'object', required: true },
        ],
        returns: { type: 'object', description: 'Created contact' },
      },
    ],
  },

  // AI Services
  {
    // Match OpenAI references but avoid Stripe keys (sk_live_, sk_test_)
    // OpenAI keys use sk- followed by alphanumeric (no underscore after sk-)
    pattern: /openai|gpt-(?:3\.5|4|4o)|sk-(?!_)[a-zA-Z0-9]{20,}/gi,
    type: 'ai',
    displayName: 'OpenAI',
    id: 'openai',
    authMethod: 'api_key',
    credentialKeys: ['api_key'],
    defaultOperations: [
      {
        name: 'chat-completion',
        description: 'Generate a chat completion',
        params: [
          { name: 'messages', description: 'Chat messages', type: 'array', required: true },
          { name: 'model', description: 'Model to use', type: 'string', required: false },
        ],
        returns: { type: 'object', description: 'Completion response' },
      },
      {
        name: 'embeddings',
        description: 'Generate embeddings for text',
        params: [
          { name: 'input', description: 'Text to embed', type: 'string', required: true },
          { name: 'model', description: 'Embedding model', type: 'string', required: false },
        ],
        returns: { type: 'array', description: 'Embedding vectors' },
      },
    ],
  },
  {
    pattern: /anthropic|claude|sk-ant-/gi,
    type: 'ai',
    displayName: 'Anthropic',
    id: 'anthropic',
    authMethod: 'api_key',
    credentialKeys: ['api_key'],
    defaultOperations: [
      {
        name: 'messages',
        description: 'Generate a message completion',
        params: [
          { name: 'messages', description: 'Chat messages', type: 'array', required: true },
          { name: 'model', description: 'Model to use', type: 'string', required: false },
          { name: 'max_tokens', description: 'Maximum tokens', type: 'number', required: false },
        ],
        returns: { type: 'object', description: 'Message response' },
      },
    ],
  },

  // Payment
  {
    pattern: /stripe|sk_(?:live|test)_/gi,
    type: 'payment',
    displayName: 'Stripe',
    id: 'stripe',
    authMethod: 'api_key',
    credentialKeys: ['secret_key', 'publishable_key'],
    defaultOperations: [
      {
        name: 'create-payment-intent',
        description: 'Create a payment intent',
        params: [
          { name: 'amount', description: 'Amount in cents', type: 'number', required: true },
          { name: 'currency', description: 'Currency code', type: 'string', required: true },
        ],
        returns: { type: 'object', description: 'Payment intent object' },
      },
      {
        name: 'list-customers',
        description: 'List customers',
        params: [{ name: 'limit', description: 'Max results', type: 'number', required: false }],
        returns: { type: 'array', description: 'List of customers' },
      },
    ],
  },

  // Storage
  {
    pattern: /aws\s+s3|amazon\s+s3|s3:\/\/|AKIA[A-Z0-9]{16}/gi,
    type: 'storage',
    displayName: 'AWS S3',
    id: 'aws-s3',
    authMethod: 'api_key',
    credentialKeys: ['access_key_id', 'secret_access_key'],
    defaultOperations: [
      {
        name: 'list-objects',
        description: 'List objects in a bucket',
        params: [
          { name: 'bucket', description: 'Bucket name', type: 'string', required: true },
          { name: 'prefix', description: 'Key prefix', type: 'string', required: false },
        ],
        returns: { type: 'array', description: 'List of objects' },
      },
      {
        name: 'get-object',
        description: 'Get an object from S3',
        params: [
          { name: 'bucket', description: 'Bucket name', type: 'string', required: true },
          { name: 'key', description: 'Object key', type: 'string', required: true },
        ],
        returns: { type: 'object', description: 'Object data and metadata' },
      },
      {
        name: 'put-object',
        description: 'Upload an object to S3',
        params: [
          { name: 'bucket', description: 'Bucket name', type: 'string', required: true },
          { name: 'key', description: 'Object key', type: 'string', required: true },
          { name: 'body', description: 'Object content', type: 'string', required: true },
        ],
        returns: { type: 'object', description: 'Upload result' },
      },
    ],
  },
];

// =============================================================================
// 1PASSWORD REFERENCE EXTRACTION
// =============================================================================

/**
 * Mapping from 1Password item name keywords to integration patterns
 *
 * When we see op://vault/postgres/... we infer it's a PostgreSQL integration
 */
const OP_ITEM_TO_INTEGRATION: Array<{
  keywords: string[];
  patternId: string;
}> = [
  // Databases
  { keywords: ['postgres', 'postgresql', 'pg', 'pgsql'], patternId: 'postgresql' },
  { keywords: ['mongo', 'mongodb'], patternId: 'mongodb' },
  { keywords: ['mysql', 'mariadb'], patternId: 'mysql' },
  { keywords: ['redis'], patternId: 'redis' },
  { keywords: ['database', 'db'], patternId: 'postgresql' }, // Default to PostgreSQL for generic "database"

  // Messaging
  { keywords: ['slack'], patternId: 'slack' },
  { keywords: ['gmail', 'google-mail', 'googlemail'], patternId: 'gmail' },
  { keywords: ['sendgrid'], patternId: 'sendgrid' },
  { keywords: ['twilio'], patternId: 'twilio' },

  // CRM
  { keywords: ['salesforce', 'sfdc'], patternId: 'salesforce' },
  { keywords: ['hubspot'], patternId: 'hubspot' },

  // AI
  { keywords: ['openai', 'gpt'], patternId: 'openai' },
  { keywords: ['anthropic', 'claude'], patternId: 'anthropic' },

  // Payment
  { keywords: ['stripe'], patternId: 'stripe' },

  // Storage
  { keywords: ['aws', 's3', 'amazon'], patternId: 'aws-s3' },

  // Generic API
  { keywords: ['api'], patternId: 'custom-api' },
];

/**
 * Result of parsing a 1Password reference for integration inference
 */
export interface OnePasswordIntegrationRef {
  /** The original op:// reference */
  opReference: string;
  /** Parsed reference components */
  parsed: OnePasswordReference;
  /** Inferred integration ID (e.g., 'postgresql', 'gmail') */
  integrationId: string | null;
  /** Which field this credential represents */
  credentialField: string;
  /** Confidence in the inference (based on keyword matching) */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Find all op:// references in content
 */
export function find1PasswordReferences(content: string): string[] {
  const pattern = /op:\/\/[^\s"'<>]+/g;
  const matches = content.match(pattern) || [];
  return [...new Set(matches)]; // Dedupe
}

/**
 * Infer integration ID from a 1Password item name
 *
 * @param itemName - The item name from the op:// reference (e.g., "postgres", "database", "gmail-creds")
 * @returns The integration ID or null if no match
 */
export function inferIntegrationFromOpItem(itemName: string): {
  id: string | null;
  confidence: 'high' | 'medium' | 'low';
} {
  const lowerName = itemName.toLowerCase();

  // Try exact or partial matches
  for (const mapping of OP_ITEM_TO_INTEGRATION) {
    for (const keyword of mapping.keywords) {
      // Exact match = high confidence
      if (lowerName === keyword) {
        return { id: mapping.patternId, confidence: 'high' };
      }
      // Contains keyword = medium confidence
      if (lowerName.includes(keyword)) {
        return { id: mapping.patternId, confidence: 'medium' };
      }
    }
  }

  return { id: null, confidence: 'low' };
}

/**
 * Parse and analyze a 1Password reference to infer what integration it's for
 */
export function analyze1PasswordReference(opRef: string): OnePasswordIntegrationRef | null {
  const parsed = parseOpReference(opRef);
  if (!parsed) return null;

  // Try to infer from item name first, then vault name as fallback
  let inference = inferIntegrationFromOpItem(parsed.item);
  if (!inference.id) {
    inference = inferIntegrationFromOpItem(parsed.vault);
  }

  // The field name becomes the credential key
  const credentialField = parsed.field
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return {
    opReference: opRef,
    parsed,
    integrationId: inference.id,
    credentialField: credentialField || 'credential',
    confidence: inference.confidence,
  };
}

/**
 * Extract integrations from 1Password references found in content
 *
 * This is the key function that bridges 1Password references to integration descriptors.
 * It:
 * 1. Finds all op:// references in content
 * 2. Parses and infers integration types from item/vault names
 * 3. Groups references by integration
 * 4. Creates integration descriptors with vault references
 */
export function extractIntegrationsFrom1PasswordRefs(
  content: string,
  options: {
    sourceFile: string;
    project?: string;
  }
): {
  integrations: IntegrationDescriptor[];
  refs: OnePasswordIntegrationRef[];
  unmatched: string[];
} {
  const opRefs = find1PasswordReferences(content);
  const analyzedRefs: OnePasswordIntegrationRef[] = [];
  const unmatched: string[] = [];

  // Analyze each reference
  for (const ref of opRefs) {
    const analyzed = analyze1PasswordReference(ref);
    if (analyzed) {
      if (analyzed.integrationId) {
        analyzedRefs.push(analyzed);
      } else {
        unmatched.push(ref);
      }
    }
  }

  // Group by integration ID
  const byIntegration = new Map<string, OnePasswordIntegrationRef[]>();
  for (const ref of analyzedRefs) {
    const id = ref.integrationId;
    if (id) {
      const existing = byIntegration.get(id);
      if (existing) {
        existing.push(ref);
      } else {
        byIntegration.set(id, [ref]);
      }
    }
  }

  const now = new Date().toISOString();
  const integrations: IntegrationDescriptor[] = [];

  // Create integration descriptors
  for (const [integrationId, refs] of byIntegration) {
    // Find the known pattern for this integration
    const knownPattern = KNOWN_PATTERNS.find((p) => p.id === integrationId);

    // Build vault references from the op:// refs
    const vaultRefs: Record<string, string> = {};
    for (const ref of refs) {
      vaultRefs[ref.credentialField] = ref.opReference;
    }

    // Determine the best confidence from all refs
    const bestConfidence = refs.some((r) => r.confidence === 'high')
      ? 0.9
      : refs.some((r) => r.confidence === 'medium')
        ? 0.7
        : 0.5;

    if (knownPattern) {
      // Use known pattern as base
      const descriptor: IntegrationDescriptor = {
        id: knownPattern.id,
        displayName: knownPattern.displayName,
        type: knownPattern.type,
        description: `${knownPattern.displayName} integration (credentials in 1Password)`,
        operations: knownPattern.defaultOperations,
        authentication: {
          method: knownPattern.authMethod,
          requiredCredentials: Object.keys(vaultRefs),
          vaultRefs,
        },
        examples: [],
        notes: [
          'Auto-detected from 1Password references',
          `Credentials: ${refs.map((r) => r.opReference).join(', ')}`,
        ],
        source: {
          learnedFrom: options.sourceFile,
          learnedAt: now,
          project: options.project,
          confidence: bestConfidence,
          extractionMethod: '1password',
        },
        status: 'discovered',
        createdAt: now,
        updatedAt: now,
      };
      integrations.push(descriptor);
    } else {
      // Create a custom integration
      const descriptor: IntegrationDescriptor = {
        id: integrationId,
        displayName: integrationId
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        type: 'custom',
        description: 'Custom integration (credentials in 1Password)',
        operations: [],
        authentication: {
          method: 'api_key',
          requiredCredentials: Object.keys(vaultRefs),
          vaultRefs,
        },
        examples: [],
        notes: [
          'Auto-detected from 1Password references',
          `Credentials: ${refs.map((r) => r.opReference).join(', ')}`,
        ],
        source: {
          learnedFrom: options.sourceFile,
          learnedAt: now,
          project: options.project,
          confidence: bestConfidence,
          extractionMethod: '1password',
        },
        status: 'discovered',
        createdAt: now,
        updatedAt: now,
      };
      integrations.push(descriptor);
    }
  }

  return { integrations, refs: analyzedRefs, unmatched };
}

// =============================================================================
// PATTERN-BASED EXTRACTION
// =============================================================================

/**
 * Extract integrations from content using pattern matching
 *
 * This is the fast path - no API calls needed.
 * For detailed extraction, use extractIntegrationsWithLLM.
 */
export function extractIntegrationsFromPatterns(
  content: string,
  options: {
    sourceFile: string;
    project?: string;
    detectedSecrets?: SensitiveDataMatch[];
  }
): IntegrationExtractionResult {
  const integrations: IntegrationDescriptor[] = [];
  const mentions: IntegrationMention[] = [];
  const warnings: string[] = [];
  const foundIds = new Set<string>();

  const now = new Date().toISOString();

  // Check each known pattern
  for (const knownPattern of KNOWN_PATTERNS) {
    knownPattern.pattern.lastIndex = 0;
    const match = knownPattern.pattern.exec(content);

    if (match && !foundIds.has(knownPattern.id)) {
      foundIds.add(knownPattern.id);

      // Build vault references from detected secrets
      const vaultRefs: Record<string, string> = {};
      for (const credKey of knownPattern.credentialKeys) {
        // Check if we detected a secret that matches this credential type
        const matchingSecret = options.detectedSecrets?.find((s) =>
          s.type.toLowerCase().includes(credKey.replace(/_/g, ''))
        );
        if (matchingSecret) {
          vaultRefs[credKey] = `vault://env/${matchingSecret.suggestedVaultPath}`;
        } else {
          vaultRefs[credKey] = `vault://env/${knownPattern.id}/${credKey}`;
        }
      }

      const descriptor: IntegrationDescriptor = {
        id: knownPattern.id,
        displayName: knownPattern.displayName,
        type: knownPattern.type,
        description: `${knownPattern.displayName} integration detected from content`,
        operations: knownPattern.defaultOperations,
        authentication: {
          method: knownPattern.authMethod,
          requiredCredentials: knownPattern.credentialKeys,
          vaultRefs,
        },
        examples: [],
        notes: ['Auto-detected from content patterns'],
        source: {
          learnedFrom: options.sourceFile,
          learnedAt: now,
          project: options.project,
          confidence: 0.7, // Pattern matching gives medium confidence
          extractionMethod: 'pattern',
        },
        status: 'discovered',
        createdAt: now,
        updatedAt: now,
      };

      integrations.push(descriptor);
    }
  }

  // Look for generic API mentions
  const apiMentionPatterns = [
    /(?:the\s+)?(\w+)\s+(?:api|service|endpoint)/gi,
    /connect(?:ing|ion)?\s+to\s+(?:the\s+)?(\w+)/gi,
    /(?:call|invoke|use)\s+(?:the\s+)?(\w+)\s+api/gi,
  ];

  for (const pattern of apiMentionPatterns) {
    pattern.lastIndex = 0;
    let match = pattern.exec(content);
    while (match) {
      const name = match[1];
      // Skip if it's a known pattern we already found
      const isKnown = KNOWN_PATTERNS.some(
        (kp) =>
          kp.displayName.toLowerCase().includes(name.toLowerCase()) ||
          kp.id.includes(name.toLowerCase())
      );

      if (!isKnown && name.length > 2) {
        // Get context around the mention
        const start = Math.max(0, match.index - 50);
        const end = Math.min(content.length, match.index + match[0].length + 50);
        const context = content.slice(start, end);

        mentions.push({
          name,
          context: `...${context}...`,
          reason: 'Generic API mention - needs LLM extraction for details',
          position: { start: match.index, end: match.index + match[0].length },
        });
      }

      match = pattern.exec(content);
    }
  }

  return { integrations, mentions, warnings };
}

/**
 * Merge detected secrets with integration descriptors
 *
 * When we detect secrets during learn, we can enhance integration descriptors
 * with the vault references for those secrets.
 */
export function mergeSecretsWithIntegrations(
  integrations: IntegrationDescriptor[],
  secrets: SensitiveDataMatch[]
): IntegrationDescriptor[] {
  // Map secret types to integration IDs
  const secretToIntegration: Record<string, string> = {
    openai_api_key: 'openai',
    anthropic_api_key: 'anthropic',
    google_api_key: 'gmail',
    slack_bot_token: 'slack',
    slack_webhook: 'slack',
    github_token: 'github',
    stripe_api_key: 'stripe',
    aws_access_key: 'aws-s3',
    aws_secret_key: 'aws-s3',
    database_url: 'postgresql',
    database_password: 'postgresql',
    sendgrid_api_key: 'sendgrid',
  };

  return integrations.map((integration) => {
    const updatedVaultRefs = { ...integration.authentication.vaultRefs };

    for (const secret of secrets) {
      const targetIntegration = secretToIntegration[secret.type];
      if (targetIntegration === integration.id) {
        // Find which credential key this secret maps to
        const credKey = secret.type.replace(/_/g, '-').replace(`${integration.id}-`, '');
        updatedVaultRefs[credKey] = `vault://env/${secret.suggestedVaultPath}`;
      }
    }

    return {
      ...integration,
      authentication: {
        ...integration.authentication,
        vaultRefs: updatedVaultRefs,
      },
    };
  });
}

/**
 * Generate a unique integration ID from a name
 */
export function generateIntegrationId(name: string, existingIds: Set<string>): string {
  const baseId = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let counter = 2;
  while (existingIds.has(`${baseId}-${counter}`)) {
    counter++;
  }
  return `${baseId}-${counter}`;
}

/**
 * Create a custom integration descriptor from partial info
 *
 * Used when LLM extraction returns partial information about a custom service.
 */
export function createCustomIntegration(
  partial: {
    name: string;
    description?: string;
    type?: IntegrationType;
    operations?: IntegrationOperation[];
    authMethod?: AuthMethod;
    credentialKeys?: string[];
  },
  options: {
    sourceFile: string;
    project?: string;
    existingIds?: Set<string>;
  }
): IntegrationDescriptor {
  const now = new Date().toISOString();
  const id = generateIntegrationId(partial.name, options.existingIds ?? new Set());

  const vaultRefs: Record<string, string> = {};
  for (const credKey of partial.credentialKeys ?? ['api_key']) {
    vaultRefs[credKey] = `vault://env/${id}/${credKey}`;
  }

  return {
    id,
    displayName: partial.name,
    type: partial.type ?? 'custom',
    description: partial.description ?? `Custom integration: ${partial.name}`,
    operations: partial.operations ?? [],
    authentication: {
      method: partial.authMethod ?? 'api_key',
      requiredCredentials: partial.credentialKeys ?? ['api_key'],
      vaultRefs,
    },
    examples: [],
    notes: ['Custom integration - may need manual configuration'],
    source: {
      learnedFrom: options.sourceFile,
      learnedAt: now,
      project: options.project,
      confidence: 0.5,
      extractionMethod: 'llm',
    },
    status: 'discovered',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Prompt template for LLM-based integration extraction
 *
 * This is used when pattern matching isn't enough and we need
 * the LLM to understand custom integrations.
 */
export const INTEGRATION_EXTRACTION_PROMPT = `
Analyze the following content and extract information about any external tools, APIs, databases, or services mentioned.

For each integration found, provide:
1. name: A short name for the integration (e.g., "Customer Database", "Email Service")
2. type: One of: database, api, messaging, storage, crm, analytics, payment, ai, custom
3. description: What this integration does
4. operations: List of operations it supports (name, description, parameters)
5. authMethod: How it authenticates (api_key, oauth2, basic_auth, bearer_token, custom, none)
6. credentialKeys: What credentials are needed (e.g., ["api_key"] or ["username", "password"])
7. limits: Any rate limits or constraints mentioned
8. notes: Important information for using this integration

{{#if detectedSecrets}}
These credential types were detected in the content (values redacted):
{{#each detectedSecrets}}
- {{type}}: {{suggestedVaultPath}}
{{/each}}
Use this to understand what integrations are being configured.
{{/if}}

Content to analyze:
---
{{content}}
---

Respond with a JSON array of integrations. If no integrations are found, return an empty array.
`;
