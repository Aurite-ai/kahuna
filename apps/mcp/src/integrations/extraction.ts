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

  // Developer Platforms
  {
    pattern: /github|gh_[a-zA-Z0-9]{36}|ghp_[a-zA-Z0-9]{36}/gi,
    type: 'developer',
    displayName: 'GitHub',
    id: 'github',
    authMethod: 'bearer_token',
    credentialKeys: ['personal_access_token'],
    defaultOperations: [
      {
        name: 'list-repos',
        description: 'List repositories for the authenticated user or organization',
        params: [
          {
            name: 'org',
            description: 'Organization name (optional)',
            type: 'string',
            required: false,
          },
          {
            name: 'type',
            description: 'Repository type (all, public, private)',
            type: 'string',
            required: false,
          },
        ],
        returns: { type: 'array', description: 'List of repositories' },
      },
      {
        name: 'create-issue',
        description: 'Create a new issue in a repository',
        params: [
          { name: 'owner', description: 'Repository owner', type: 'string', required: true },
          { name: 'repo', description: 'Repository name', type: 'string', required: true },
          { name: 'title', description: 'Issue title', type: 'string', required: true },
          { name: 'body', description: 'Issue body', type: 'string', required: false },
          { name: 'labels', description: 'Labels to apply', type: 'array', required: false },
        ],
        returns: { type: 'object', description: 'Created issue details' },
      },
      {
        name: 'get-pull-requests',
        description: 'List pull requests for a repository',
        params: [
          { name: 'owner', description: 'Repository owner', type: 'string', required: true },
          { name: 'repo', description: 'Repository name', type: 'string', required: true },
          {
            name: 'state',
            description: 'PR state (open, closed, all)',
            type: 'string',
            required: false,
          },
        ],
        returns: { type: 'array', description: 'List of pull requests' },
      },
    ],
  },

  // Social Platforms
  {
    pattern: /linkedin|li_[a-zA-Z0-9]+/gi,
    type: 'social',
    displayName: 'LinkedIn',
    id: 'linkedin',
    authMethod: 'oauth2',
    credentialKeys: ['client_id', 'client_secret', 'access_token'],
    defaultOperations: [
      {
        name: 'get-profile',
        description: 'Get the authenticated user profile',
        params: [],
        returns: { type: 'object', description: 'User profile data' },
      },
      {
        name: 'post-share',
        description: 'Share content on LinkedIn',
        params: [
          { name: 'text', description: 'Post text content', type: 'string', required: true },
          {
            name: 'visibility',
            description: 'Post visibility (PUBLIC, CONNECTIONS)',
            type: 'string',
            required: false,
          },
        ],
        returns: { type: 'object', description: 'Share result with post ID' },
      },
      {
        name: 'get-connections',
        description: 'Get user connections',
        params: [
          { name: 'start', description: 'Pagination start index', type: 'number', required: false },
          {
            name: 'count',
            description: 'Number of connections to return',
            type: 'number',
            required: false,
          },
        ],
        returns: { type: 'array', description: 'List of connections' },
      },
    ],
  },
  {
    pattern: /twitter|x\.com|tweet|AAAA[a-zA-Z0-9%]+/gi,
    type: 'social',
    displayName: 'Twitter/X',
    id: 'twitter',
    authMethod: 'oauth2',
    credentialKeys: ['api_key', 'api_secret', 'access_token', 'access_token_secret'],
    defaultOperations: [
      {
        name: 'post-tweet',
        description: 'Post a new tweet',
        params: [
          {
            name: 'text',
            description: 'Tweet text (max 280 characters)',
            type: 'string',
            required: true,
          },
          {
            name: 'reply_to',
            description: 'Tweet ID to reply to',
            type: 'string',
            required: false,
          },
        ],
        returns: { type: 'object', description: 'Posted tweet data' },
      },
      {
        name: 'search-tweets',
        description: 'Search for tweets',
        params: [
          { name: 'query', description: 'Search query', type: 'string', required: true },
          {
            name: 'max_results',
            description: 'Maximum results (10-100)',
            type: 'number',
            required: false,
          },
        ],
        returns: { type: 'array', description: 'List of matching tweets' },
      },
      {
        name: 'get-user',
        description: 'Get user profile by username',
        params: [
          { name: 'username', description: 'Twitter username', type: 'string', required: true },
        ],
        returns: { type: 'object', description: 'User profile data' },
      },
    ],
  },

  // Communication - Microsoft Teams
  {
    pattern: /microsoft\s*teams|ms\s*teams|teams\.microsoft/gi,
    type: 'messaging',
    displayName: 'Microsoft Teams',
    id: 'microsoft-teams',
    authMethod: 'oauth2',
    credentialKeys: ['client_id', 'client_secret', 'tenant_id'],
    defaultOperations: [
      {
        name: 'send-message',
        description: 'Send a message to a Teams channel',
        params: [
          { name: 'team_id', description: 'Team ID', type: 'string', required: true },
          { name: 'channel_id', description: 'Channel ID', type: 'string', required: true },
          { name: 'content', description: 'Message content', type: 'string', required: true },
        ],
        returns: { type: 'object', description: 'Message details' },
      },
      {
        name: 'create-channel',
        description: 'Create a new channel in a team',
        params: [
          { name: 'team_id', description: 'Team ID', type: 'string', required: true },
          { name: 'display_name', description: 'Channel name', type: 'string', required: true },
          {
            name: 'description',
            description: 'Channel description',
            type: 'string',
            required: false,
          },
        ],
        returns: { type: 'object', description: 'Created channel details' },
      },
      {
        name: 'list-teams',
        description: 'List teams the user is a member of',
        params: [],
        returns: { type: 'array', description: 'List of teams' },
      },
    ],
  },

  // Productivity - Google Drive
  {
    pattern: /google\s*drive|gdrive|drive\.google/gi,
    type: 'storage',
    displayName: 'Google Drive',
    id: 'google-drive',
    authMethod: 'oauth2',
    credentialKeys: ['client_id', 'client_secret', 'refresh_token'],
    defaultOperations: [
      {
        name: 'list-files',
        description: 'List files in Google Drive',
        params: [
          {
            name: 'folder_id',
            description: 'Folder ID (root if not specified)',
            type: 'string',
            required: false,
          },
          { name: 'query', description: 'Search query', type: 'string', required: false },
          {
            name: 'page_size',
            description: 'Number of results per page',
            type: 'number',
            required: false,
          },
        ],
        returns: { type: 'array', description: 'List of files' },
      },
      {
        name: 'upload-file',
        description: 'Upload a file to Google Drive',
        params: [
          { name: 'name', description: 'File name', type: 'string', required: true },
          { name: 'content', description: 'File content', type: 'string', required: true },
          { name: 'mime_type', description: 'MIME type', type: 'string', required: false },
          { name: 'folder_id', description: 'Parent folder ID', type: 'string', required: false },
        ],
        returns: { type: 'object', description: 'Uploaded file metadata' },
      },
      {
        name: 'download-file',
        description: 'Download a file from Google Drive',
        params: [{ name: 'file_id', description: 'File ID', type: 'string', required: true }],
        returns: { type: 'object', description: 'File content and metadata' },
      },
      {
        name: 'create-folder',
        description: 'Create a folder in Google Drive',
        params: [
          { name: 'name', description: 'Folder name', type: 'string', required: true },
          { name: 'parent_id', description: 'Parent folder ID', type: 'string', required: false },
        ],
        returns: { type: 'object', description: 'Created folder metadata' },
      },
    ],
  },

  // Productivity - Notion
  {
    pattern: /notion|notion\.so|ntn_[a-zA-Z0-9]+/gi,
    type: 'productivity',
    displayName: 'Notion',
    id: 'notion',
    authMethod: 'bearer_token',
    credentialKeys: ['api_key'],
    defaultOperations: [
      {
        name: 'query-database',
        description: 'Query a Notion database',
        params: [
          { name: 'database_id', description: 'Database ID', type: 'string', required: true },
          { name: 'filter', description: 'Filter conditions', type: 'object', required: false },
          { name: 'sorts', description: 'Sort conditions', type: 'array', required: false },
        ],
        returns: { type: 'array', description: 'Database entries' },
      },
      {
        name: 'create-page',
        description: 'Create a new page in Notion',
        params: [
          {
            name: 'parent_id',
            description: 'Parent page or database ID',
            type: 'string',
            required: true,
          },
          { name: 'title', description: 'Page title', type: 'string', required: true },
          { name: 'properties', description: 'Page properties', type: 'object', required: false },
          { name: 'content', description: 'Page content blocks', type: 'array', required: false },
        ],
        returns: { type: 'object', description: 'Created page details' },
      },
      {
        name: 'update-page',
        description: 'Update an existing Notion page',
        params: [
          { name: 'page_id', description: 'Page ID', type: 'string', required: true },
          {
            name: 'properties',
            description: 'Properties to update',
            type: 'object',
            required: true,
          },
        ],
        returns: { type: 'object', description: 'Updated page details' },
      },
    ],
  },

  // Productivity - Google Sheets
  {
    pattern: /google\s*sheets|gsheets|sheets\.google|spreadsheet/gi,
    type: 'storage',
    displayName: 'Google Sheets',
    id: 'google-sheets',
    authMethod: 'oauth2',
    credentialKeys: ['client_id', 'client_secret', 'refresh_token'],
    defaultOperations: [
      {
        name: 'get-values',
        description: 'Get values from a spreadsheet range',
        params: [
          { name: 'spreadsheet_id', description: 'Spreadsheet ID', type: 'string', required: true },
          {
            name: 'range',
            description: 'A1 notation range (e.g., Sheet1!A1:D10)',
            type: 'string',
            required: true,
          },
        ],
        returns: { type: 'array', description: 'Cell values as 2D array' },
      },
      {
        name: 'update-values',
        description: 'Update values in a spreadsheet range',
        params: [
          { name: 'spreadsheet_id', description: 'Spreadsheet ID', type: 'string', required: true },
          { name: 'range', description: 'A1 notation range', type: 'string', required: true },
          {
            name: 'values',
            description: 'Values to write (2D array)',
            type: 'array',
            required: true,
          },
        ],
        returns: { type: 'object', description: 'Update result' },
      },
      {
        name: 'append-row',
        description: 'Append a row to a spreadsheet',
        params: [
          { name: 'spreadsheet_id', description: 'Spreadsheet ID', type: 'string', required: true },
          { name: 'range', description: 'Target sheet range', type: 'string', required: true },
          { name: 'values', description: 'Row values', type: 'array', required: true },
        ],
        returns: { type: 'object', description: 'Append result' },
      },
    ],
  },

  // Project Management - Jira
  {
    pattern: /jira|atlassian\.net\/jira/gi,
    type: 'project_management',
    displayName: 'Jira',
    id: 'jira',
    authMethod: 'basic_auth',
    credentialKeys: ['email', 'api_token', 'domain'],
    defaultOperations: [
      {
        name: 'create-issue',
        description: 'Create a new Jira issue',
        params: [
          {
            name: 'project_key',
            description: 'Project key (e.g., PROJ)',
            type: 'string',
            required: true,
          },
          { name: 'summary', description: 'Issue summary', type: 'string', required: true },
          {
            name: 'issue_type',
            description: 'Issue type (Bug, Task, Story)',
            type: 'string',
            required: true,
          },
          {
            name: 'description',
            description: 'Issue description',
            type: 'string',
            required: false,
          },
          { name: 'priority', description: 'Priority level', type: 'string', required: false },
        ],
        returns: { type: 'object', description: 'Created issue details' },
      },
      {
        name: 'get-issue',
        description: 'Get details of a Jira issue',
        params: [
          {
            name: 'issue_key',
            description: 'Issue key (e.g., PROJ-123)',
            type: 'string',
            required: true,
          },
        ],
        returns: { type: 'object', description: 'Issue details' },
      },
      {
        name: 'search-issues',
        description: 'Search issues using JQL',
        params: [
          { name: 'jql', description: 'JQL query string', type: 'string', required: true },
          { name: 'max_results', description: 'Maximum results', type: 'number', required: false },
        ],
        returns: { type: 'array', description: 'Matching issues' },
      },
      {
        name: 'transition-issue',
        description: 'Move issue to a different status',
        params: [
          { name: 'issue_key', description: 'Issue key', type: 'string', required: true },
          { name: 'transition_id', description: 'Transition ID', type: 'string', required: true },
        ],
        returns: { type: 'object', description: 'Transition result' },
      },
    ],
  },

  // Database - Supabase
  {
    pattern: /supabase|\.supabase\.co/gi,
    type: 'database',
    displayName: 'Supabase',
    id: 'supabase',
    authMethod: 'api_key',
    credentialKeys: ['url', 'anon_key', 'service_role_key'],
    defaultOperations: [
      {
        name: 'query',
        description: 'Query data from a table',
        params: [
          { name: 'table', description: 'Table name', type: 'string', required: true },
          { name: 'select', description: 'Columns to select', type: 'string', required: false },
          { name: 'filter', description: 'Filter conditions', type: 'object', required: false },
          { name: 'limit', description: 'Maximum rows', type: 'number', required: false },
        ],
        returns: { type: 'array', description: 'Query results' },
      },
      {
        name: 'insert',
        description: 'Insert data into a table',
        params: [
          { name: 'table', description: 'Table name', type: 'string', required: true },
          { name: 'data', description: 'Data to insert', type: 'object', required: true },
        ],
        returns: { type: 'object', description: 'Inserted record' },
      },
      {
        name: 'update',
        description: 'Update data in a table',
        params: [
          { name: 'table', description: 'Table name', type: 'string', required: true },
          { name: 'data', description: 'Data to update', type: 'object', required: true },
          { name: 'filter', description: 'Filter conditions', type: 'object', required: true },
        ],
        returns: { type: 'object', description: 'Update result' },
      },
      {
        name: 'call-function',
        description: 'Call a Supabase Edge Function',
        params: [
          { name: 'function_name', description: 'Function name', type: 'string', required: true },
          { name: 'body', description: 'Request body', type: 'object', required: false },
        ],
        returns: { type: 'object', description: 'Function response' },
      },
    ],
  },

  // Database - Firebase
  {
    pattern: /firebase|firestore|\.firebaseio\.com|AIza[a-zA-Z0-9_-]{35}/gi,
    type: 'database',
    displayName: 'Firebase',
    id: 'firebase',
    authMethod: 'api_key',
    credentialKeys: ['api_key', 'project_id', 'service_account_key'],
    defaultOperations: [
      {
        name: 'get-doc',
        description: 'Get a document from Firestore',
        params: [
          { name: 'collection', description: 'Collection path', type: 'string', required: true },
          { name: 'doc_id', description: 'Document ID', type: 'string', required: true },
        ],
        returns: { type: 'object', description: 'Document data' },
      },
      {
        name: 'set-doc',
        description: 'Set/create a document in Firestore',
        params: [
          { name: 'collection', description: 'Collection path', type: 'string', required: true },
          { name: 'doc_id', description: 'Document ID', type: 'string', required: true },
          { name: 'data', description: 'Document data', type: 'object', required: true },
          {
            name: 'merge',
            description: 'Merge with existing data',
            type: 'boolean',
            required: false,
          },
        ],
        returns: { type: 'object', description: 'Write result' },
      },
      {
        name: 'query-collection',
        description: 'Query documents from a collection',
        params: [
          { name: 'collection', description: 'Collection path', type: 'string', required: true },
          { name: 'where', description: 'Where conditions', type: 'array', required: false },
          { name: 'order_by', description: 'Field to order by', type: 'string', required: false },
          { name: 'limit', description: 'Maximum documents', type: 'number', required: false },
        ],
        returns: { type: 'array', description: 'Matching documents' },
      },
      {
        name: 'call-function',
        description: 'Call a Firebase Cloud Function',
        params: [
          { name: 'function_name', description: 'Function name', type: 'string', required: true },
          { name: 'data', description: 'Function input data', type: 'object', required: false },
        ],
        returns: { type: 'object', description: 'Function response' },
      },
    ],
  },

  // AI - Google AI/Gemini
  {
    pattern: /google\s*ai|gemini|generativelanguage\.googleapis|AIza[a-zA-Z0-9_-]{35}/gi,
    type: 'ai',
    displayName: 'Google AI (Gemini)',
    id: 'google-ai',
    authMethod: 'api_key',
    credentialKeys: ['api_key'],
    defaultOperations: [
      {
        name: 'generate-content',
        description: 'Generate content using Gemini',
        params: [
          { name: 'prompt', description: 'Input prompt', type: 'string', required: true },
          {
            name: 'model',
            description: 'Model to use (gemini-pro, gemini-pro-vision)',
            type: 'string',
            required: false,
          },
          {
            name: 'max_tokens',
            description: 'Maximum output tokens',
            type: 'number',
            required: false,
          },
        ],
        returns: { type: 'object', description: 'Generated content response' },
      },
      {
        name: 'embed-content',
        description: 'Generate embeddings for text',
        params: [
          { name: 'text', description: 'Text to embed', type: 'string', required: true },
          { name: 'model', description: 'Embedding model', type: 'string', required: false },
        ],
        returns: { type: 'array', description: 'Embedding vector' },
      },
      {
        name: 'count-tokens',
        description: 'Count tokens in text',
        params: [
          { name: 'text', description: 'Text to count tokens for', type: 'string', required: true },
          {
            name: 'model',
            description: 'Model to use for tokenization',
            type: 'string',
            required: false,
          },
        ],
        returns: { type: 'object', description: 'Token count' },
      },
    ],
  },

  // Database - SQLite
  {
    pattern: /sqlite|\.sqlite\b|\.db\b|sqlite3/gi,
    type: 'database',
    displayName: 'SQLite',
    id: 'sqlite',
    authMethod: 'none',
    credentialKeys: ['database_path'],
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

  // Database - MySQL
  {
    pattern: /mysql|mariadb|mysql:\/\//gi,
    type: 'database',
    displayName: 'MySQL Database',
    id: 'mysql',
    authMethod: 'basic_auth',
    credentialKeys: ['host', 'username', 'password', 'database'],
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
      {
        name: 'backup',
        description: 'Create a database backup',
        params: [
          {
            name: 'tables',
            description: 'Tables to backup (all if not specified)',
            type: 'array',
            required: false,
          },
          {
            name: 'output_path',
            description: 'Path to save backup file',
            type: 'string',
            required: true,
          },
        ],
        returns: { type: 'object', description: 'Backup result with file path' },
      },
    ],
  },

  // Payment - PayPal
  {
    pattern: /paypal|paypal\.com|PAYPAL_/gi,
    type: 'payment',
    displayName: 'PayPal',
    id: 'paypal',
    authMethod: 'oauth2',
    credentialKeys: ['client_id', 'client_secret'],
    defaultOperations: [
      {
        name: 'create-payment',
        description: 'Create a new payment order',
        params: [
          { name: 'amount', description: 'Payment amount', type: 'number', required: true },
          {
            name: 'currency',
            description: 'Currency code (USD, EUR, etc.)',
            type: 'string',
            required: true,
          },
          {
            name: 'description',
            description: 'Payment description',
            type: 'string',
            required: false,
          },
          {
            name: 'return_url',
            description: 'URL to redirect after approval',
            type: 'string',
            required: true,
          },
          {
            name: 'cancel_url',
            description: 'URL to redirect if cancelled',
            type: 'string',
            required: true,
          },
        ],
        returns: { type: 'object', description: 'Payment order with approval URL' },
      },
      {
        name: 'capture-payment',
        description: 'Capture an approved payment',
        params: [
          { name: 'order_id', description: 'PayPal order ID', type: 'string', required: true },
        ],
        returns: { type: 'object', description: 'Captured payment details' },
      },
      {
        name: 'refund',
        description: 'Refund a captured payment',
        params: [
          {
            name: 'capture_id',
            description: 'Capture ID to refund',
            type: 'string',
            required: true,
          },
          {
            name: 'amount',
            description: 'Amount to refund (full if not specified)',
            type: 'number',
            required: false,
          },
          { name: 'currency', description: 'Currency code', type: 'string', required: false },
        ],
        returns: { type: 'object', description: 'Refund details' },
      },
      {
        name: 'get-transactions',
        description: 'Get transaction history',
        params: [
          {
            name: 'start_date',
            description: 'Start date (ISO format)',
            type: 'string',
            required: true,
          },
          {
            name: 'end_date',
            description: 'End date (ISO format)',
            type: 'string',
            required: true,
          },
          {
            name: 'page_size',
            description: 'Number of results per page',
            type: 'number',
            required: false,
          },
        ],
        returns: { type: 'array', description: 'List of transactions' },
      },
    ],
  },

  // Messaging - Discord
  {
    pattern: /discord|discord\.com|discord\.gg/gi,
    type: 'messaging',
    displayName: 'Discord',
    id: 'discord',
    authMethod: 'bearer_token',
    credentialKeys: ['bot_token', 'client_id', 'client_secret'],
    defaultOperations: [
      {
        name: 'send-message',
        description: 'Send a message to a Discord channel',
        params: [
          { name: 'channel_id', description: 'Discord channel ID', type: 'string', required: true },
          { name: 'content', description: 'Message content', type: 'string', required: true },
          { name: 'embeds', description: 'Message embeds', type: 'array', required: false },
        ],
        returns: { type: 'object', description: 'Sent message details' },
      },
      {
        name: 'list-channels',
        description: 'List channels in a guild/server',
        params: [
          {
            name: 'guild_id',
            description: 'Discord guild/server ID',
            type: 'string',
            required: true,
          },
        ],
        returns: { type: 'array', description: 'List of channels' },
      },
      {
        name: 'create-webhook',
        description: 'Create a webhook for a channel',
        params: [
          { name: 'channel_id', description: 'Channel ID', type: 'string', required: true },
          { name: 'name', description: 'Webhook name', type: 'string', required: true },
          {
            name: 'avatar',
            description: 'Avatar URL or base64 image',
            type: 'string',
            required: false,
          },
        ],
        returns: { type: 'object', description: 'Created webhook details' },
      },
      {
        name: 'send-webhook',
        description: 'Send a message via webhook',
        params: [
          { name: 'webhook_url', description: 'Webhook URL', type: 'string', required: true },
          { name: 'content', description: 'Message content', type: 'string', required: true },
          {
            name: 'username',
            description: 'Override webhook username',
            type: 'string',
            required: false,
          },
          { name: 'embeds', description: 'Message embeds', type: 'array', required: false },
        ],
        returns: { type: 'object', description: 'Webhook response' },
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
  { keywords: ['sqlite', 'sqlite3'], patternId: 'sqlite' },
  { keywords: ['redis'], patternId: 'redis' },
  { keywords: ['supabase'], patternId: 'supabase' },
  { keywords: ['firebase', 'firestore'], patternId: 'firebase' },
  { keywords: ['database', 'db'], patternId: 'postgresql' }, // Default to PostgreSQL for generic "database"

  // Messaging
  { keywords: ['slack'], patternId: 'slack' },
  { keywords: ['discord'], patternId: 'discord' },
  { keywords: ['gmail', 'google-mail', 'googlemail'], patternId: 'gmail' },
  { keywords: ['sendgrid'], patternId: 'sendgrid' },
  { keywords: ['teams', 'microsoft-teams', 'ms-teams'], patternId: 'microsoft-teams' },

  // CRM
  { keywords: ['salesforce', 'sfdc'], patternId: 'salesforce' },
  { keywords: ['hubspot'], patternId: 'hubspot' },

  // AI
  { keywords: ['openai', 'gpt'], patternId: 'openai' },
  { keywords: ['anthropic', 'claude'], patternId: 'anthropic' },
  { keywords: ['gemini', 'google-ai', 'googleai'], patternId: 'google-ai' },

  // Payment
  { keywords: ['stripe'], patternId: 'stripe' },
  { keywords: ['paypal'], patternId: 'paypal' },

  // Storage
  { keywords: ['aws', 's3', 'amazon'], patternId: 'aws-s3' },
  { keywords: ['google-drive', 'gdrive', 'googledrive'], patternId: 'google-drive' },
  { keywords: ['google-sheets', 'gsheets', 'googlesheets'], patternId: 'google-sheets' },

  // Productivity
  { keywords: ['notion'], patternId: 'notion' },
  { keywords: ['jira', 'atlassian'], patternId: 'jira' },

  // Social/Developer Platforms
  { keywords: ['github', 'gh'], patternId: 'github' },
  { keywords: ['linkedin'], patternId: 'linkedin' },
  { keywords: ['twitter', 'x'], patternId: 'twitter' },

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
    // AI Services
    openai_api_key: 'openai',
    anthropic_api_key: 'anthropic',
    gemini_api_key: 'google-ai',
    google_ai_api_key: 'google-ai',

    // Messaging
    google_api_key: 'gmail',
    slack_bot_token: 'slack',
    slack_webhook: 'slack',
    discord_bot_token: 'discord',
    discord_client_id: 'discord',
    discord_client_secret: 'discord',
    teams_client_id: 'microsoft-teams',
    teams_client_secret: 'microsoft-teams',
    sendgrid_api_key: 'sendgrid',

    // Developer/Social Platforms
    github_token: 'github',
    github_personal_access_token: 'github',
    linkedin_client_id: 'linkedin',
    linkedin_client_secret: 'linkedin',
    twitter_api_key: 'twitter',
    twitter_api_secret: 'twitter',
    twitter_access_token: 'twitter',

    // Payment
    stripe_api_key: 'stripe',
    stripe_secret_key: 'stripe',

    // Storage
    aws_access_key: 'aws-s3',
    aws_secret_key: 'aws-s3',
    google_drive_client_id: 'google-drive',
    google_drive_client_secret: 'google-drive',
    google_sheets_client_id: 'google-sheets',
    google_sheets_client_secret: 'google-sheets',

    // Productivity/Project Management
    notion_api_key: 'notion',
    jira_api_token: 'jira',
    jira_email: 'jira',

    // Databases
    database_url: 'postgresql',
    database_password: 'postgresql',
    mysql_host: 'mysql',
    mysql_username: 'mysql',
    mysql_password: 'mysql',
    mysql_database: 'mysql',
    supabase_url: 'supabase',
    supabase_anon_key: 'supabase',
    supabase_service_role_key: 'supabase',
    firebase_api_key: 'firebase',
    firebase_project_id: 'firebase',
    firebase_service_account: 'firebase',

    // Additional Payment
    paypal_client_id: 'paypal',
    paypal_client_secret: 'paypal',
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
