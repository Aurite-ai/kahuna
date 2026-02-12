/**
 * Sensitive Data Detection
 *
 * Detects credentials, API keys, passwords, and other sensitive data
 * in file content. Used during kahuna_learn to prevent secrets from
 * being stored in the knowledge base.
 *
 * See: docs/design/secure-integrations.md
 */

/**
 * Confidence level for sensitive data detection
 */
export type DetectionConfidence = 'high' | 'medium' | 'low';

/**
 * Type of sensitive data detected
 */
export type SensitiveDataType =
  | 'openai_api_key'
  | 'anthropic_api_key'
  | 'google_api_key'
  | 'aws_access_key'
  | 'aws_secret_key'
  | 'slack_bot_token'
  | 'slack_webhook'
  | 'github_token'
  | 'stripe_api_key'
  | 'twilio_api_key'
  | 'sendgrid_api_key'
  | 'oauth_client_secret'
  | 'oauth_refresh_token'
  | 'oauth_access_token'
  | 'database_url'
  | 'database_password'
  | 'jwt_secret'
  | 'private_key'
  | 'generic_api_key'
  | 'generic_password'
  | 'generic_secret'
  | 'bearer_token'
  | '1password_reference';

/**
 * A pattern for detecting sensitive data
 */
interface SensitivePattern {
  type: SensitiveDataType;
  pattern: RegExp;
  confidence: DetectionConfidence;
  description: string;
  /** Which capture group contains the actual secret (0 = full match) */
  valueGroup?: number;
  /** Suggested vault path prefix */
  vaultPathPrefix: string;
}

/**
 * Result of detecting sensitive data in content
 */
export interface SensitiveDataMatch {
  type: SensitiveDataType;
  confidence: DetectionConfidence;
  description: string;
  /** The actual secret value (handle with care!) */
  value: string;
  /** Position in the original content */
  position: { start: number; end: number };
  /** Suggested path for storing in vault */
  suggestedVaultPath: string;
  /** Masked version for display (e.g., "sk-****...abc") */
  maskedValue: string;
}

/**
 * Result of redacting sensitive data from content
 */
export interface RedactionResult {
  /** Content with sensitive data replaced by placeholders */
  redactedContent: string;
  /** List of detected sensitive data matches */
  matches: SensitiveDataMatch[];
  /** Whether any sensitive data was found */
  hasSensitiveData: boolean;
}

/**
 * Patterns for detecting sensitive data
 *
 * Ordered by specificity - more specific patterns first.
 * Each pattern includes a confidence level and description.
 */
const SENSITIVE_PATTERNS: SensitivePattern[] = [
  // ============ HIGH CONFIDENCE - Known API key formats ============

  // OpenAI
  {
    type: 'openai_api_key',
    pattern: /\b(sk-[a-zA-Z0-9]{32,})\b/g,
    confidence: 'high',
    description: 'OpenAI API key',
    valueGroup: 1,
    vaultPathPrefix: 'openai',
  },

  // Anthropic
  {
    type: 'anthropic_api_key',
    pattern: /\b(sk-ant-[a-zA-Z0-9-]{32,})\b/g,
    confidence: 'high',
    description: 'Anthropic API key',
    valueGroup: 1,
    vaultPathPrefix: 'anthropic',
  },

  // Google
  {
    type: 'google_api_key',
    pattern: /\b(AIza[a-zA-Z0-9_-]{35})\b/g,
    confidence: 'high',
    description: 'Google API key',
    valueGroup: 1,
    vaultPathPrefix: 'google',
  },

  // AWS Access Key
  {
    type: 'aws_access_key',
    pattern: /\b(AKIA[A-Z0-9]{16})\b/g,
    confidence: 'high',
    description: 'AWS Access Key ID',
    valueGroup: 1,
    vaultPathPrefix: 'aws',
  },

  // AWS Secret Key (40 chars, base64-ish)
  {
    type: 'aws_secret_key',
    pattern:
      /(?:aws[_-]?secret[_-]?(?:access[_-]?)?key|secret[_-]?key)\s*[=:]\s*["']?([a-zA-Z0-9/+=]{40})["']?/gi,
    confidence: 'high',
    description: 'AWS Secret Access Key',
    valueGroup: 1,
    vaultPathPrefix: 'aws',
  },

  // Slack Bot Token
  {
    type: 'slack_bot_token',
    pattern: /\b(xoxb-[a-zA-Z0-9-]+)\b/g,
    confidence: 'high',
    description: 'Slack Bot Token',
    valueGroup: 1,
    vaultPathPrefix: 'slack',
  },

  // Slack Webhook URL
  {
    type: 'slack_webhook',
    pattern: /(https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+)/g,
    confidence: 'high',
    description: 'Slack Webhook URL',
    valueGroup: 1,
    vaultPathPrefix: 'slack',
  },

  // GitHub Token
  {
    type: 'github_token',
    pattern: /\b(gh[pousr]_[a-zA-Z0-9]{36,})\b/g,
    confidence: 'high',
    description: 'GitHub Personal Access Token',
    valueGroup: 1,
    vaultPathPrefix: 'github',
  },

  // Stripe API Key
  {
    type: 'stripe_api_key',
    pattern: /\b(sk_(?:live|test)_[a-zA-Z0-9]{24,})\b/g,
    confidence: 'high',
    description: 'Stripe API key',
    valueGroup: 1,
    vaultPathPrefix: 'stripe',
  },

  // Twilio API Key
  {
    type: 'twilio_api_key',
    pattern: /\b(SK[a-f0-9]{32})\b/g,
    confidence: 'high',
    description: 'Twilio API key',
    valueGroup: 1,
    vaultPathPrefix: 'twilio',
  },

  // SendGrid API Key
  {
    type: 'sendgrid_api_key',
    pattern: /\b(SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43})\b/g,
    confidence: 'high',
    description: 'SendGrid API key',
    valueGroup: 1,
    vaultPathPrefix: 'sendgrid',
  },

  // ============ HIGH CONFIDENCE - Database URLs ============

  // PostgreSQL URL with password
  {
    type: 'database_url',
    pattern: /(postgres(?:ql)?:\/\/[^:]+:[^@]+@[^\s"']+)/gi,
    confidence: 'high',
    description: 'PostgreSQL connection string',
    valueGroup: 1,
    vaultPathPrefix: 'database',
  },

  // MySQL URL with password
  {
    type: 'database_url',
    pattern: /(mysql:\/\/[^:]+:[^@]+@[^\s"']+)/gi,
    confidence: 'high',
    description: 'MySQL connection string',
    valueGroup: 1,
    vaultPathPrefix: 'database',
  },

  // MongoDB URL with password
  {
    type: 'database_url',
    pattern: /(mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^\s"']+)/gi,
    confidence: 'high',
    description: 'MongoDB connection string',
    valueGroup: 1,
    vaultPathPrefix: 'database',
  },

  // ============ HIGH CONFIDENCE - Private Keys ============

  // RSA/DSA/EC Private Key
  {
    type: 'private_key',
    pattern:
      /(-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |DSA |EC )?PRIVATE KEY-----)/g,
    confidence: 'high',
    description: 'Private key',
    valueGroup: 1,
    vaultPathPrefix: 'keys',
  },

  // ============ MEDIUM CONFIDENCE - Pattern-based detection ============

  // OAuth client_secret
  {
    type: 'oauth_client_secret',
    pattern: /client[_-]?secret["']?\s*[=:]\s*["']([^"'\s]{16,})["']/gi,
    confidence: 'medium',
    description: 'OAuth client secret',
    valueGroup: 1,
    vaultPathPrefix: 'oauth',
  },

  // OAuth refresh_token
  {
    type: 'oauth_refresh_token',
    pattern: /refresh[_-]?token["']?\s*[=:]\s*["']([^"'\s]{20,})["']/gi,
    confidence: 'medium',
    description: 'OAuth refresh token',
    valueGroup: 1,
    vaultPathPrefix: 'oauth',
  },

  // OAuth access_token
  {
    type: 'oauth_access_token',
    pattern: /access[_-]?token["']?\s*[=:]\s*["']([^"'\s]{20,})["']/gi,
    confidence: 'medium',
    description: 'OAuth access token',
    valueGroup: 1,
    vaultPathPrefix: 'oauth',
  },

  // Bearer token in headers
  {
    type: 'bearer_token',
    pattern: /Bearer\s+([a-zA-Z0-9._-]{20,})/gi,
    confidence: 'medium',
    description: 'Bearer token',
    valueGroup: 1,
    vaultPathPrefix: 'auth',
  },

  // JWT Secret
  {
    type: 'jwt_secret',
    pattern: /jwt[_-]?secret["']?\s*[=:]\s*["']([^"'\s]{16,})["']/gi,
    confidence: 'medium',
    description: 'JWT secret',
    valueGroup: 1,
    vaultPathPrefix: 'auth',
  },

  // Generic api_key pattern
  {
    type: 'generic_api_key',
    pattern: /(?:api[_-]?key|apikey)["']?\s*[=:]\s*["']([^"'\s]{16,})["']/gi,
    confidence: 'medium',
    description: 'API key',
    valueGroup: 1,
    vaultPathPrefix: 'api',
  },

  // Generic password pattern
  {
    type: 'generic_password',
    pattern: /(?:password|passwd|pwd)["']?\s*[=:]\s*["']([^"'\s]{8,})["']/gi,
    confidence: 'medium',
    description: 'Password',
    valueGroup: 1,
    vaultPathPrefix: 'auth',
  },

  // Generic secret pattern
  {
    type: 'generic_secret',
    pattern: /(?:secret|secret[_-]?key)["']?\s*[=:]\s*["']([^"'\s]{16,})["']/gi,
    confidence: 'medium',
    description: 'Secret',
    valueGroup: 1,
    vaultPathPrefix: 'secrets',
  },

  // Database password
  {
    type: 'database_password',
    pattern: /(?:db[_-]?password|database[_-]?password)["']?\s*[=:]\s*["']([^"'\s]{8,})["']/gi,
    confidence: 'medium',
    description: 'Database password',
    valueGroup: 1,
    vaultPathPrefix: 'database',
  },

  // ============ SPECIAL - 1Password References (not redacted, just recognized) ============

  // 1Password reference (op://vault/item/field)
  {
    type: '1password_reference',
    pattern: /(op:\/\/[^\s"']+)/g,
    confidence: 'high',
    description: '1Password secret reference',
    valueGroup: 1,
    vaultPathPrefix: '1password',
  },
];

/**
 * Detect 1Password references in content
 *
 * Returns all op:// references found without treating them as secrets to redact.
 * These are already secure references that should be preserved as-is.
 */
export function detect1PasswordReferences(content: string): Array<{
  reference: string;
  position: { start: number; end: number };
}> {
  const refs: Array<{ reference: string; position: { start: number; end: number } }> = [];
  const pattern = /(op:\/\/[^\s"']+)/g;

  let match = pattern.exec(content);
  while (match !== null) {
    refs.push({
      reference: match[1],
      position: { start: match.index, end: match.index + match[0].length },
    });
    match = pattern.exec(content);
  }

  return refs;
}

/**
 * Check if content contains 1Password references
 */
export function has1PasswordReferences(content: string): boolean {
  return /op:\/\/[^\s"']+/.test(content);
}

/**
 * Extract vault references from content
 *
 * Finds both op:// (1Password) and vault:// references in content.
 * Returns parsed references with their positions.
 */
export function extractVaultReferences(content: string): Array<{
  type: 'op' | 'vault';
  reference: string;
  position: { start: number; end: number };
}> {
  const refs: Array<{
    type: 'op' | 'vault';
    reference: string;
    position: { start: number; end: number };
  }> = [];

  // Find op:// references
  const opPattern = /(op:\/\/[^\s"']+)/g;
  let match = opPattern.exec(content);
  while (match !== null) {
    refs.push({
      type: 'op',
      reference: match[1],
      position: { start: match.index, end: match.index + match[0].length },
    });
    match = opPattern.exec(content);
  }

  // Find vault:// references
  const vaultPattern = /(vault:\/\/[^\s"']+)/g;
  match = vaultPattern.exec(content);
  while (match !== null) {
    refs.push({
      type: 'vault',
      reference: match[1],
      position: { start: match.index, end: match.index + match[0].length },
    });
    match = vaultPattern.exec(content);
  }

  return refs.sort((a, b) => a.position.start - b.position.start);
}

/**
 * Mask a sensitive value for safe display
 * e.g., "sk-abc123xyz789" -> "sk-abc***789"
 */
function maskValue(value: string): string {
  if (value.length <= 8) {
    return '****';
  }

  // Show first 4 and last 3 characters
  const prefix = value.slice(0, 4);
  const suffix = value.slice(-3);
  return `${prefix}***${suffix}`;
}

/**
 * Generate a suggested vault path for a detected secret
 */
function generateVaultPath(type: SensitiveDataType, prefix: string, index: number): string {
  // Convert type to a reasonable key name
  const keyName = type.replace(/_/g, '-').replace(/^generic-/, '');

  return index === 0 ? `${prefix}/${keyName}` : `${prefix}/${keyName}-${index + 1}`;
}

/**
 * Detect sensitive data in content
 *
 * Scans content for known patterns of credentials, API keys, and secrets.
 * Returns all matches with position, value, and suggested vault path.
 */
export function detectSensitiveData(content: string): SensitiveDataMatch[] {
  const matches: SensitiveDataMatch[] = [];
  const seenPositions = new Set<string>();

  // Track counts per type for unique vault paths
  const typeCounts = new Map<string, number>();

  for (const pattern of SENSITIVE_PATTERNS) {
    // Reset regex state (important for global regexes)
    pattern.pattern.lastIndex = 0;

    let match = pattern.pattern.exec(content);
    while (match !== null) {
      const fullMatch = match[0];
      const value = pattern.valueGroup ? match[pattern.valueGroup] : fullMatch;
      const start = match.index;
      const end = start + fullMatch.length;

      // Skip if we've already matched this position
      const posKey = `${start}-${end}`;
      if (!seenPositions.has(posKey)) {
        seenPositions.add(posKey);

        // Get unique index for this type
        const typeKey = `${pattern.vaultPathPrefix}/${pattern.type}`;
        const typeIndex = typeCounts.get(typeKey) ?? 0;
        typeCounts.set(typeKey, typeIndex + 1);

        matches.push({
          type: pattern.type,
          confidence: pattern.confidence,
          description: pattern.description,
          value,
          position: { start, end },
          suggestedVaultPath: generateVaultPath(pattern.type, pattern.vaultPathPrefix, typeIndex),
          maskedValue: maskValue(value),
        });
      }

      match = pattern.pattern.exec(content);
    }
  }

  // Sort by position
  return matches.sort((a, b) => a.position.start - b.position.start);
}

/**
 * Redact sensitive data from content
 *
 * Replaces detected secrets with vault reference placeholders.
 * Returns the redacted content and list of matches.
 */
export function redactSensitiveData(content: string): RedactionResult {
  const matches = detectSensitiveData(content);

  if (matches.length === 0) {
    return {
      redactedContent: content,
      matches: [],
      hasSensitiveData: false,
    };
  }

  // Replace from end to preserve positions
  let redacted = content;
  for (const match of [...matches].reverse()) {
    const placeholder = `[REDACTED: vault://env/${match.suggestedVaultPath}]`;
    redacted =
      redacted.slice(0, match.position.start) + placeholder + redacted.slice(match.position.end);
  }

  return {
    redactedContent: redacted,
    matches,
    hasSensitiveData: true,
  };
}

/**
 * Check if content contains any sensitive data
 *
 * Quick check without extracting all matches.
 */
export function hasSensitiveData(content: string): boolean {
  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.pattern.lastIndex = 0;
    if (pattern.pattern.test(content)) {
      return true;
    }
  }
  return false;
}

/**
 * Filter matches by confidence level
 */
export function filterByConfidence(
  matches: SensitiveDataMatch[],
  minConfidence: DetectionConfidence
): SensitiveDataMatch[] {
  const confidenceOrder: DetectionConfidence[] = ['high', 'medium', 'low'];
  const minIndex = confidenceOrder.indexOf(minConfidence);

  return matches.filter((m) => {
    const matchIndex = confidenceOrder.indexOf(m.confidence);
    return matchIndex <= minIndex;
  });
}
