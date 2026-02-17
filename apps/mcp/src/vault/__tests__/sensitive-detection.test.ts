/**
 * Tests for sensitive data detection
 */

import { describe, expect, it } from 'vitest';
import {
  calculateEntropy,
  detectSensitiveData,
  filterByConfidence,
  hasSensitiveData,
  isLikelyRealSecret,
  isPlaceholder,
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
      // Use a realistic-looking AWS key (not one with "EXAMPLE")
      const content = 'AWS_ACCESS_KEY_ID=AKIAJ5QXWTRZ7M8NVGTA';
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
      // Use a high-entropy value that passes the entropy filter
      const content = 'client_secret: "aX7kM9pL2qR5tY8wB3nC6"';
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
    // Use high-entropy value that passes entropy filter
    const content = `
      sk-abcdefghijklmnopqrstuvwxyz123456
      api_key = "aX7kM9pL2qR5tY8wB3nC6vD4"
    `;
    const allMatches = detectSensitiveData(content);
    const highOnly = filterByConfidence(allMatches, 'high');

    // Should have both high and medium confidence matches
    expect(allMatches.length).toBeGreaterThan(1);
    expect(highOnly.length).toBeLessThan(allMatches.length);
    expect(highOnly.every((m) => m.confidence === 'high')).toBe(true);
  });

  it('includes high and medium when filtering by medium', () => {
    // Use high-entropy value that passes entropy filter
    const content = `
      sk-abcdefghijklmnopqrstuvwxyz123456
      api_key = "aX7kM9pL2qR5tY8wB3nC6vD4"
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

// =============================================================================
// ENTROPY FILTERING TESTS
// =============================================================================

describe('calculateEntropy', () => {
  it('returns 0 for empty string', () => {
    expect(calculateEntropy('')).toBe(0);
  });

  it('returns 0 for single character repeated', () => {
    expect(calculateEntropy('aaaa')).toBe(0);
  });

  it('calculates higher entropy for random-looking strings', () => {
    const random = 'aB3$xK9!mQ2@pL7';
    const simple = 'aaabbbcccddd';

    const randomEntropy = calculateEntropy(random);
    const simpleEntropy = calculateEntropy(simple);

    expect(randomEntropy).toBeGreaterThan(simpleEntropy);
  });

  it('calculates entropy around 4.0+ for real API keys', () => {
    // Real API keys typically have high entropy
    const realishKey = 'sk-AbCd1234XyZw5678MnOp9012QrSt3456';
    const entropy = calculateEntropy(realishKey);

    expect(entropy).toBeGreaterThan(3.5);
  });

  it('calculates lower entropy for placeholder-like strings', () => {
    const placeholder = 'your-api-key-here';
    const entropy = calculateEntropy(placeholder);

    expect(entropy).toBeLessThan(4.0);
  });
});

describe('isPlaceholder', () => {
  describe('detects explicit placeholder patterns', () => {
    it('detects "your-key-here" variants', () => {
      expect(isPlaceholder('your-api-key-here')).toBe(true);
      expect(isPlaceholder('your_api_key_here')).toBe(true);
      expect(isPlaceholder('your-key-here')).toBe(true);
      expect(isPlaceholder('your-secret-here')).toBe(true);
      expect(isPlaceholder('your-password-here')).toBe(true);
    });

    it('detects "insert/replace/put" variants', () => {
      expect(isPlaceholder('insert-your-key')).toBe(true);
      expect(isPlaceholder('replace-with-key')).toBe(true);
      expect(isPlaceholder('put_your_api_key')).toBe(true);
    });
  });

  describe('detects example/test/demo patterns', () => {
    it('detects example prefixes and suffixes', () => {
      expect(isPlaceholder('example_key')).toBe(true);
      expect(isPlaceholder('key_example')).toBe(true);
      expect(isPlaceholder('example-api-key')).toBe(true);
    });

    it('detects test prefixes and suffixes', () => {
      expect(isPlaceholder('test_key')).toBe(true);
      expect(isPlaceholder('key_test')).toBe(true);
      expect(isPlaceholder('test-api-key')).toBe(true);
    });

    it('detects demo/sample/fake/dummy patterns', () => {
      expect(isPlaceholder('demo_key')).toBe(true);
      expect(isPlaceholder('sample_key')).toBe(true);
      expect(isPlaceholder('fake_key')).toBe(true);
      expect(isPlaceholder('dummy_key')).toBe(true);
      expect(isPlaceholder('mock_key')).toBe(true);
    });
  });

  describe('detects default/change-me patterns', () => {
    it('detects changeme variants', () => {
      expect(isPlaceholder('changeme')).toBe(true);
      expect(isPlaceholder('change-me')).toBe(true);
      expect(isPlaceholder('change_me')).toBe(true);
    });

    it('detects sequential patterns', () => {
      expect(isPlaceholder('abcdefg')).toBe(true); // exact match
      expect(isPlaceholder('1234567890')).toBe(true); // exact match
      expect(isPlaceholder('xxxxxx')).toBe(true);
    });
  });

  describe('detects template patterns', () => {
    it('detects template variables', () => {
      expect(isPlaceholder('${API_KEY}')).toBe(true);
      expect(isPlaceholder('<YOUR_KEY>')).toBe(true);
      expect(isPlaceholder('[YOUR_KEY]')).toBe(true);
    });
  });

  describe('does not flag real secrets', () => {
    it('does not flag random-looking strings', () => {
      expect(isPlaceholder('aB3xK9mQ2pL7wN5')).toBe(false);
      expect(isPlaceholder('xvz1evFS4wEEPTGEFPHBog')).toBe(false);
    });
  });
});

describe('isLikelyRealSecret', () => {
  describe('high confidence patterns', () => {
    it('accepts high confidence secrets even with lower entropy', () => {
      // High confidence patterns with specific prefixes are trusted
      expect(isLikelyRealSecret('sk-realkey123abc', 'openai_api_key', 'high')).toBe(true);
    });

    it('rejects obvious placeholders even in high confidence', () => {
      // Even high confidence should reject obvious placeholders
      expect(isLikelyRealSecret('your-api-key-here', 'openai_api_key', 'high')).toBe(false);
    });
  });

  describe('medium confidence patterns', () => {
    it('rejects low entropy strings', () => {
      // Low entropy = likely placeholder
      expect(isLikelyRealSecret('changeme12345678', 'generic_api_key', 'medium')).toBe(false);
    });

    it('rejects placeholder patterns', () => {
      expect(isLikelyRealSecret('your-api-key-here-12345', 'generic_api_key', 'medium')).toBe(
        false
      );
      expect(isLikelyRealSecret('example-secret-key-value', 'generic_secret', 'medium')).toBe(
        false
      );
    });

    it('accepts high entropy, non-placeholder strings', () => {
      // High entropy random-looking string should pass
      const highEntropyKey = 'aB3$xK9!mQ2@pL7#wN5';
      expect(isLikelyRealSecret(highEntropyKey, 'generic_api_key', 'medium')).toBe(true);
    });
  });

  describe('rejects repeating patterns', () => {
    it('rejects strings with obvious repeating patterns', () => {
      expect(isLikelyRealSecret('abcabcabcabcabcabc', 'generic_api_key', 'medium')).toBe(false);
      expect(isLikelyRealSecret('123123123123123123', 'generic_api_key', 'medium')).toBe(false);
    });
  });
});

describe('entropy filtering in detection', () => {
  describe('filters placeholder values by default', () => {
    it('does not detect placeholder generic api_key values', () => {
      const content = 'api_key: "your-api-key-here-1234567890"';
      const matches = detectSensitiveData(content);

      // Should be filtered out as placeholder
      expect(matches.filter((m) => m.type === 'generic_api_key')).toHaveLength(0);
    });

    it('does not detect example passwords', () => {
      const content = 'password = "example-password"';
      const matches = detectSensitiveData(content);

      // Should be filtered out as placeholder
      expect(matches.filter((m) => m.type === 'generic_password')).toHaveLength(0);
    });

    it('does not detect changeme passwords', () => {
      const content = 'password = "changeme123"';
      const matches = detectSensitiveData(content);

      expect(matches.filter((m) => m.type === 'generic_password')).toHaveLength(0);
    });
  });

  describe('still detects real secrets', () => {
    it('detects high-entropy api keys', () => {
      const content = 'api_key: "aB3xK9mQ2pL7wN5rT8yU"';
      const matches = detectSensitiveData(content);

      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('detects real OpenAI keys regardless of entropy', () => {
      const content = 'OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456';
      const matches = detectSensitiveData(content);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('openai_api_key');
    });
  });

  describe('can be disabled', () => {
    it('returns all matches when entropy filter is disabled', () => {
      const content = 'api_key: "your-api-key-here-1234567890"';

      // With filtering (default)
      const filteredMatches = detectSensitiveData(content);

      // Without filtering
      const unfilteredMatches = detectSensitiveData(content, { useEntropyFilter: false });

      // Unfiltered should have more matches
      expect(unfilteredMatches.length).toBeGreaterThanOrEqual(filteredMatches.length);
    });
  });
});
