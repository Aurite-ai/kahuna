/**
 * Tests for sensitive data detection
 */

import { describe, expect, it } from 'vitest';
import {
  detectSensitiveData,
  filterByConfidence,
  hasSensitiveData,
  redactSensitiveData,
} from '../sensitive-detection.js';

describe('detectSensitiveData', () => {
  describe('high confidence patterns', () => {
    it('detects OpenAI API keys', () => {
      const content = 'My API key is sk-abcdefghijklmnopqrstuvwxyz123456';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('openai_api_key');
      expect(matches[0].confidence).toBe('high');
      expect(matches[0].value).toBe('sk-abcdefghijklmnopqrstuvwxyz123456');
      expect(matches[0].suggestedVaultPath).toBe('openai/openai-api-key');
    });

    it('detects Anthropic API keys', () => {
      const content = 'Use this key: sk-ant-api03-abcdefghijklmnopqrstuvwxyz12345678901234';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('anthropic_api_key');
      expect(matches[0].confidence).toBe('high');
    });

    it('detects Google API keys', () => {
      // Google API keys are exactly AIza + 35 characters = 39 total
      const content = 'Google key: AIzaSyAbcdefghijklmnopqrstuvwxyz1234567';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('google_api_key');
      expect(matches[0].confidence).toBe('high');
    });

    it('detects AWS access keys', () => {
      const content = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('aws_access_key');
      expect(matches[0].confidence).toBe('high');
    });

    it('detects Slack bot tokens', () => {
      const content = 'SLACK_TOKEN=xoxb-123456789012-1234567890123-abcdefghijklmnopqrstuv';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('slack_bot_token');
      expect(matches[0].confidence).toBe('high');
    });

    it('detects GitHub tokens', () => {
      const content = 'Token: ghp_abcdefghijklmnopqrstuvwxyz1234567890';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('github_token');
      expect(matches[0].confidence).toBe('high');
    });

    it('detects Stripe API keys', () => {
      const content = 'stripe_key = sk_live_abcdefghijklmnopqrstuvwx';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('stripe_api_key');
      expect(matches[0].confidence).toBe('high');
    });

    it('detects PostgreSQL connection strings', () => {
      const content = 'DATABASE_URL=postgres://user:password123@localhost:5432/mydb';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('database_url');
      expect(matches[0].confidence).toBe('high');
    });

    it('detects MongoDB connection strings', () => {
      const content = 'MONGO_URI=mongodb+srv://admin:secretpass@cluster.mongodb.net/db';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('database_url');
      expect(matches[0].confidence).toBe('high');
    });

    it('detects private keys', () => {
      const content = `
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0M2d5dG93j0XGQ4r
-----END RSA PRIVATE KEY-----
      `;
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('private_key');
      expect(matches[0].confidence).toBe('high');
    });
  });

  describe('medium confidence patterns', () => {
    it('detects OAuth client secrets', () => {
      // Use a value that only matches client_secret pattern (not generic_secret)
      const content = 'client_secret: "my_oauth_client_secret_val"';
      const matches = detectSensitiveData(content);

      expect(matches.length).toBeGreaterThanOrEqual(1);
      const clientSecretMatch = matches.find((m) => m.type === 'oauth_client_secret');
      expect(clientSecretMatch).toBeDefined();
      expect(clientSecretMatch?.confidence).toBe('medium');
    });

    it('detects generic API keys', () => {
      const content = 'api_key: "abcdefghijklmnop1234567890"';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('generic_api_key');
      expect(matches[0].confidence).toBe('medium');
    });

    it('detects generic passwords', () => {
      const content = 'password = "mysecretpassword123"';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('generic_password');
      expect(matches[0].confidence).toBe('medium');
    });
  });

  describe('multiple matches', () => {
    it('detects multiple secrets in same content', () => {
      const content = `
        OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456
        DATABASE_URL=postgres://user:pass@host/db
        api_key = "my-custom-api-key-12345"
      `;
      const matches = detectSensitiveData(content);

      expect(matches.length).toBeGreaterThanOrEqual(3);
    });

    it('assigns unique vault paths for same type', () => {
      const content = `
        KEY1=sk-abcdefghijklmnopqrstuvwxyz111111
        KEY2=sk-abcdefghijklmnopqrstuvwxyz222222
      `;
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(2);
      expect(matches[0].suggestedVaultPath).toBe('openai/openai-api-key');
      expect(matches[1].suggestedVaultPath).toBe('openai/openai-api-key-2');
    });
  });

  describe('no false positives', () => {
    it('does not match short strings', () => {
      const content = 'api_key = "short"';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(0);
    });

    it('does not match random text', () => {
      const content = 'This is just some normal text without any secrets.';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(0);
    });

    it('does not match URLs without passwords', () => {
      const content = 'DATABASE_URL=postgres://localhost:5432/mydb';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(0);
    });
  });
});

describe('redactSensitiveData', () => {
  it('replaces secrets with vault references', () => {
    const content = 'My API key is sk-abcdefghijklmnopqrstuvwxyz123456';
    const result = redactSensitiveData(content);

    expect(result.hasSensitiveData).toBe(true);
    expect(result.matches).toHaveLength(1);
    expect(result.redactedContent).toContain('[REDACTED: vault://env/');
    expect(result.redactedContent).not.toContain('sk-abcdefghijklmnopqrstuvwxyz123456');
  });

  it('preserves non-sensitive content', () => {
    const content = 'Hello world! My key is sk-abcdefghijklmnopqrstuvwxyz123456. Goodbye!';
    const result = redactSensitiveData(content);

    expect(result.redactedContent).toContain('Hello world!');
    expect(result.redactedContent).toContain('Goodbye!');
  });

  it('returns original content when no secrets found', () => {
    const content = 'This is normal content without secrets.';
    const result = redactSensitiveData(content);

    expect(result.hasSensitiveData).toBe(false);
    expect(result.matches).toHaveLength(0);
    expect(result.redactedContent).toBe(content);
  });

  it('handles multiple secrets', () => {
    const content = `
      OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456
      DATABASE_URL=postgres://user:pass123@host/db
    `;
    const result = redactSensitiveData(content);

    expect(result.hasSensitiveData).toBe(true);
    expect(result.matches.length).toBeGreaterThanOrEqual(2);
    expect(result.redactedContent).not.toContain('sk-abcdefghijklmnopqrstuvwxyz123456');
    expect(result.redactedContent).not.toContain('postgres://user:pass123@host/db');
  });
});

describe('hasSensitiveData', () => {
  it('returns true when secrets are present', () => {
    const content = 'My key: sk-abcdefghijklmnopqrstuvwxyz123456';
    expect(hasSensitiveData(content)).toBe(true);
  });

  it('returns false when no secrets are present', () => {
    const content = 'Normal text without secrets';
    expect(hasSensitiveData(content)).toBe(false);
  });
});

describe('filterByConfidence', () => {
  it('filters to high confidence only', () => {
    const content = `
      sk-abcdefghijklmnopqrstuvwxyz123456
      api_key = "some-generic-api-key-here"
    `;
    const allMatches = detectSensitiveData(content);
    const highOnly = filterByConfidence(allMatches, 'high');

    expect(highOnly.length).toBeLessThan(allMatches.length);
    expect(highOnly.every((m) => m.confidence === 'high')).toBe(true);
  });

  it('includes high and medium when filtering by medium', () => {
    const content = `
      sk-abcdefghijklmnopqrstuvwxyz123456
      api_key = "some-generic-api-key-here"
    `;
    const allMatches = detectSensitiveData(content);
    const filtered = filterByConfidence(allMatches, 'medium');

    expect(filtered.every((m) => m.confidence === 'high' || m.confidence === 'medium')).toBe(true);
  });
});

describe('maskedValue', () => {
  it('masks values for safe display', () => {
    const content = 'sk-abcdefghijklmnopqrstuvwxyz123456';
    const matches = detectSensitiveData(content);

    expect(matches[0].maskedValue).toBe('sk-a***456');
  });
});
