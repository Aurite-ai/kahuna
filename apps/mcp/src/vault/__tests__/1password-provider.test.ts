/**
 * Tests for 1Password vault provider
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  OnePasswordProvider,
  formatOpReference,
  getOpInstallInstructions,
  isOpReference,
  opRefToVaultPath,
  parseOpReference,
  vaultPathToOpRef,
} from '../1password-provider.js';
import {
  detect1PasswordReferences,
  extractVaultReferences,
  has1PasswordReferences,
} from '../sensitive-detection.js';

describe('parseOpReference', () => {
  it('parses basic op:// references', () => {
    const result = parseOpReference('op://Personal/my-item/password');
    expect(result).toEqual({
      vault: 'Personal',
      item: 'my-item',
      field: 'password',
    });
  });

  it('parses references with spaces in item names', () => {
    const result = parseOpReference('op://Personal/Volvo License plate Database/password');
    expect(result).toEqual({
      vault: 'Personal',
      item: 'Volvo License plate Database',
      field: 'password',
    });
  });

  it('parses references with vault containing hyphens', () => {
    const result = parseOpReference('op://Personal-Nidhi/my-item/api-key');
    expect(result).toEqual({
      vault: 'Personal-Nidhi',
      item: 'my-item',
      field: 'api-key',
    });
  });

  it('parses references with section/field path', () => {
    const result = parseOpReference('op://Dev/my-item/Database/password');
    expect(result).toEqual({
      vault: 'Dev',
      item: 'my-item',
      section: 'Database',
      field: 'password',
    });
  });

  it('returns null for invalid references', () => {
    expect(parseOpReference('not-a-reference')).toBeNull();
    expect(parseOpReference('http://example.com')).toBeNull();
    expect(parseOpReference('op://')).toBeNull();
    expect(parseOpReference('op://vault')).toBeNull();
    expect(parseOpReference('op://vault/item')).toBeNull();
    expect(parseOpReference('')).toBeNull();
  });
});

describe('formatOpReference', () => {
  it('formats basic references', () => {
    const result = formatOpReference({
      vault: 'Personal',
      item: 'my-item',
      field: 'password',
    });
    expect(result).toBe('op://Personal/my-item/password');
  });

  it('formats references with sections', () => {
    const result = formatOpReference({
      vault: 'Dev',
      item: 'database-creds',
      section: 'Connection',
      field: 'password',
    });
    expect(result).toBe('op://Dev/database-creds/Connection/password');
  });

  it('round-trips with parseOpReference', () => {
    const original = 'op://Personal/my-item/password';
    const parsed = parseOpReference(original);
    expect(parsed).not.toBeNull();
    if (parsed) {
      const formatted = formatOpReference(parsed);
      expect(formatted).toBe(original);
    }
  });

  it('round-trips with section', () => {
    const original = 'op://Dev/my-item/Section/field';
    const parsed = parseOpReference(original);
    expect(parsed).not.toBeNull();
    if (parsed) {
      const formatted = formatOpReference(parsed);
      expect(formatted).toBe(original);
    }
  });
});

describe('vaultPathToOpRef', () => {
  it('converts vault path to op:// reference', () => {
    expect(vaultPathToOpRef('Personal/item/field')).toBe('op://Personal/item/field');
  });

  it('handles leading slash', () => {
    expect(vaultPathToOpRef('/Personal/item/field')).toBe('op://Personal/item/field');
  });
});

describe('opRefToVaultPath', () => {
  it('converts op:// reference to vault path', () => {
    expect(opRefToVaultPath('op://Personal/item/field')).toBe('Personal/item/field');
  });

  it('handles paths without op:// prefix', () => {
    expect(opRefToVaultPath('Personal/item/field')).toBe('Personal/item/field');
  });
});

describe('isOpReference', () => {
  it('returns true for valid op:// references', () => {
    expect(isOpReference('op://Personal/item/field')).toBe(true);
    expect(isOpReference('op://Dev/my-db/password')).toBe(true);
  });

  it('returns false for non-op:// strings', () => {
    expect(isOpReference('vault://env/SECRET')).toBe(false);
    expect(isOpReference('https://example.com')).toBe(false);
    expect(isOpReference('password123')).toBe(false);
    expect(isOpReference('')).toBe(false);
  });
});

describe('getOpInstallInstructions', () => {
  it('returns installation instructions', () => {
    const instructions = getOpInstallInstructions();
    expect(instructions).toContain('1Password CLI');
    expect(instructions).toContain('brew install');
    expect(instructions).toContain('op signin');
  });
});

describe('detect1PasswordReferences', () => {
  it('detects op:// references in content', () => {
    const content = `
      Database config:
        password: op://Personal/my-db/password
        api_key: op://Dev/api-service/key
    `;
    const refs = detect1PasswordReferences(content);
    expect(refs).toHaveLength(2);
    expect(refs[0].reference).toBe('op://Personal/my-db/password');
    expect(refs[1].reference).toBe('op://Dev/api-service/key');
  });

  it('handles content with no references', () => {
    const content = 'Just some regular text without any references';
    const refs = detect1PasswordReferences(content);
    expect(refs).toHaveLength(0);
  });

  it('captures position information', () => {
    const content = 'password: op://Personal/item/field';
    const refs = detect1PasswordReferences(content);
    expect(refs).toHaveLength(1);
    expect(refs[0].position.start).toBeGreaterThan(0);
    expect(refs[0].position.end).toBeGreaterThan(refs[0].position.start);
  });
});

describe('has1PasswordReferences', () => {
  it('returns true when content has op:// references', () => {
    expect(has1PasswordReferences('Use op://Personal/item/field for password')).toBe(true);
  });

  it('returns false when content has no op:// references', () => {
    expect(has1PasswordReferences('Regular content without references')).toBe(false);
    expect(has1PasswordReferences('vault://env/SECRET is different')).toBe(false);
  });
});

describe('extractVaultReferences', () => {
  it('extracts both op:// and vault:// references', () => {
    const content = `
      1Password: op://Personal/item/password
      Env: vault://env/SECRET_KEY
    `;
    const refs = extractVaultReferences(content);
    expect(refs).toHaveLength(2);

    const opRef = refs.find((r) => r.type === 'op');
    const vaultRef = refs.find((r) => r.type === 'vault');

    expect(opRef?.reference).toBe('op://Personal/item/password');
    expect(vaultRef?.reference).toBe('vault://env/SECRET_KEY');
  });

  it('returns empty array for content without references', () => {
    const refs = extractVaultReferences('No references here');
    expect(refs).toHaveLength(0);
  });
});

describe('OnePasswordProvider', () => {
  let provider: OnePasswordProvider;

  beforeEach(() => {
    provider = new OnePasswordProvider();
  });

  describe('name', () => {
    it('has correct provider name', () => {
      expect(provider.name).toBe('1password');
    });
  });

  describe('getStatus', () => {
    it('returns status object', async () => {
      // This test runs against actual system
      // It may fail if 1Password CLI is not installed
      const status = await provider.getStatus();

      expect(status).toHaveProperty('installed');
      expect(status).toHaveProperty('signedIn');
      expect(typeof status.installed).toBe('boolean');
      expect(typeof status.signedIn).toBe('boolean');

      if (status.installed) {
        expect(status.version).toBeDefined();
      }
    });
  });

  describe('clearStatusCache', () => {
    it('clears the status cache', async () => {
      // Get status to populate cache
      await provider.getStatus();

      // Clear cache should not throw
      expect(() => provider.clearStatusCache()).not.toThrow();
    });
  });

  // Note: The following tests require actual 1Password CLI and authentication
  // They are marked as skip for CI environments

  describe.skipIf(!process.env.TEST_1PASSWORD)('with 1Password CLI', () => {
    it('isAvailable returns true when signed in', async () => {
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });

    it('listVaults returns array of vaults', async () => {
      const vaults = await provider.listVaults();
      expect(Array.isArray(vaults)).toBe(true);
      expect(vaults.length).toBeGreaterThan(0);
      expect(vaults[0]).toHaveProperty('id');
      expect(vaults[0]).toHaveProperty('name');
    });

    it('searchItems finds items matching query', async () => {
      const results = await provider.searchItems('test');
      expect(Array.isArray(results)).toBe(true);
    });

    it('getSecret returns null for non-existent items', async () => {
      const value = await provider.getSecret('op://NonExistentVault/nonexistent-item/field');
      expect(value).toBeNull();
    });
  });
});
