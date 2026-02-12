/**
 * 1Password Vault Provider
 *
 * Universal 1Password integration that works for any user with 1Password CLI.
 * Supports multiple vaults, flexible item/field naming, and graceful error handling.
 *
 * Reference format: op://vault/item/field
 * Example: op://Personal/Volvo Database/password
 *
 * See: docs/design/secure-integrations.md
 */

import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
import type { VaultProvider } from './types.js';

const exec = promisify(execCallback);

/**
 * 1Password item structure (partial)
 */
interface OnePasswordItem {
  id: string;
  title: string;
  vault: {
    id: string;
    name: string;
  };
  category: string;
  fields?: Array<{
    id: string;
    type: string;
    label: string;
    value?: string;
    section?: {
      id: string;
      label: string;
    };
  }>;
}

/**
 * 1Password vault structure
 */
interface OnePasswordVault {
  id: string;
  name: string;
}

/**
 * Parsed 1Password reference
 */
export interface OnePasswordReference {
  vault: string;
  item: string;
  field: string;
  section?: string;
}

/**
 * Result of checking 1Password availability
 */
export interface OnePasswordStatus {
  installed: boolean;
  version?: string;
  signedIn: boolean;
  accounts?: Array<{
    url: string;
    email: string;
    userId: string;
  }>;
  error?: string;
}

/**
 * Parse an op:// reference into components
 *
 * Formats supported:
 * - op://vault/item/field
 * - op://vault/item/section/field
 */
export function parseOpReference(ref: string): OnePasswordReference | null {
  // Match op://vault/item/field or op://vault/item/section/field
  const match = ref.match(/^op:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!match) return null;

  const [, vault, item, fieldPath] = match;

  // Check if fieldPath contains a section (section/field)
  const fieldParts = fieldPath.split('/');
  if (fieldParts.length === 2) {
    return {
      vault,
      item,
      section: fieldParts[0],
      field: fieldParts[1],
    };
  }

  return { vault, item, field: fieldPath };
}

/**
 * Format components into an op:// reference
 */
export function formatOpReference(ref: OnePasswordReference): string {
  if (ref.section) {
    return `op://${ref.vault}/${ref.item}/${ref.section}/${ref.field}`;
  }
  return `op://${ref.vault}/${ref.item}/${ref.field}`;
}

/**
 * Convert a vault:// path to an op:// reference
 *
 * vault://1password/Personal/item/field -> op://Personal/item/field
 */
export function vaultPathToOpRef(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `op://${cleanPath}`;
}

/**
 * Convert an op:// reference to a vault path
 *
 * op://Personal/item/field -> Personal/item/field
 */
export function opRefToVaultPath(ref: string): string {
  return ref.replace(/^op:\/\//, '');
}

/**
 * 1Password Vault Provider
 *
 * Implements the VaultProvider interface for 1Password CLI.
 * Works with any 1Password account and vault structure.
 */
export class OnePasswordProvider implements VaultProvider {
  name = '1password' as const;

  private statusCache: OnePasswordStatus | null = null;
  private statusCacheTime = 0;
  private readonly STATUS_CACHE_TTL = 30000; // 30 seconds

  /**
   * Check if 1Password CLI is available and user is signed in
   */
  async isAvailable(): Promise<boolean> {
    const status = await this.getStatus();
    return status.installed && status.signedIn;
  }

  /**
   * Get detailed status of 1Password CLI
   */
  async getStatus(): Promise<OnePasswordStatus> {
    // Return cached status if fresh
    const now = Date.now();
    if (this.statusCache && now - this.statusCacheTime < this.STATUS_CACHE_TTL) {
      return this.statusCache;
    }

    const status: OnePasswordStatus = {
      installed: false,
      signedIn: false,
    };

    try {
      // Check if op CLI is installed
      const { stdout: versionOut } = await exec('op --version');
      status.installed = true;
      status.version = versionOut.trim();

      // Check if signed in by listing accounts
      const { stdout: accountsOut } = await exec('op account list --format json');
      const accounts = JSON.parse(accountsOut);

      if (Array.isArray(accounts) && accounts.length > 0) {
        status.signedIn = true;
        status.accounts = accounts.map(
          (acc: { url: string; email: string; user_uuid: string }) => ({
            url: acc.url,
            email: acc.email,
            userId: acc.user_uuid,
          })
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('command not found') || message.includes('not recognized')) {
        status.error =
          '1Password CLI (op) is not installed. Install from: https://1password.com/downloads/command-line/';
      } else if (message.includes('not signed in') || message.includes('sign in')) {
        status.installed = true;
        status.error = 'Not signed in to 1Password. Run: op signin';
      } else {
        status.error = message;
      }
    }

    // Cache the status
    this.statusCache = status;
    this.statusCacheTime = now;

    return status;
  }

  /**
   * Clear the status cache (useful after sign-in/sign-out)
   */
  clearStatusCache(): void {
    this.statusCache = null;
    this.statusCacheTime = 0;
  }

  /**
   * Get a secret from 1Password
   *
   * @param path - Path in format: vault/item/field or vault/item/section/field
   * @returns The secret value, or null if not found
   *
   * IMPORTANT: The returned value should never be logged or stored.
   */
  async getSecret(path: string): Promise<string | null> {
    const opRef = path.startsWith('op://') ? path : `op://${path}`;

    try {
      const { stdout } = await exec(`op read "${opRef}"`);
      return stdout.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // Handle common errors gracefully
      if (message.includes('not found') || message.includes("doesn't exist")) {
        return null;
      }
      if (message.includes('not signed in')) {
        throw new Error('1Password session expired. Please run: op signin');
      }
      if (message.includes('permission denied') || message.includes('access denied')) {
        throw new Error(`Permission denied accessing: ${opRef}`);
      }

      throw new Error(`Failed to read from 1Password: ${message}`);
    }
  }

  /**
   * Store a secret in 1Password
   *
   * Creates or updates an item with the given secret value.
   * This is more complex than other providers because 1Password
   * requires creating items with specific structure.
   *
   * @param path - Path in format: vault/item/field
   * @param value - The secret value to store
   */
  async setSecret(path: string, value: string): Promise<void> {
    const ref = parseOpReference(path.startsWith('op://') ? path : `op://${path}`);
    if (!ref) {
      throw new Error(`Invalid 1Password path: ${path}`);
    }

    try {
      // Try to update existing item first
      await exec(`op item edit "${ref.item}" --vault "${ref.vault}" "${ref.field}=${value}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // If item doesn't exist, create it
      if (message.includes('not found') || message.includes("doesn't exist")) {
        try {
          // Create a new Secure Note with the field
          await exec(
            `op item create --category "Secure Note" --vault "${ref.vault}" --title "${ref.item}" "${ref.field}=${value}"`
          );
        } catch (createError) {
          const createMessage =
            createError instanceof Error ? createError.message : String(createError);
          throw new Error(`Failed to create 1Password item: ${createMessage}`);
        }
      } else {
        throw new Error(`Failed to update 1Password item: ${message}`);
      }
    }
  }

  /**
   * List available secrets in a vault
   *
   * @param prefix - Optional vault name to filter by
   * @returns Array of paths in format: vault/item
   */
  async listSecrets(prefix?: string): Promise<string[]> {
    const secrets: string[] = [];

    try {
      // If prefix is provided, treat it as vault name
      if (prefix) {
        const { stdout } = await exec(`op item list --vault "${prefix}" --format json`);
        const items: OnePasswordItem[] = JSON.parse(stdout);

        for (const item of items) {
          secrets.push(`${prefix}/${item.title}`);
        }
      } else {
        // List items from all vaults
        const vaults = await this.listVaults();

        for (const vault of vaults) {
          try {
            const { stdout } = await exec(`op item list --vault "${vault.name}" --format json`);
            const items: OnePasswordItem[] = JSON.parse(stdout);

            for (const item of items) {
              secrets.push(`${vault.name}/${item.title}`);
            }
          } catch {
            // Skip vaults we can't access
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list 1Password items: ${message}`);
    }

    return secrets.sort();
  }

  /**
   * Delete a secret from 1Password
   *
   * Note: This deletes the entire item, not just a field.
   *
   * @param path - Path in format: vault/item
   */
  async deleteSecret(path: string): Promise<void> {
    const ref = parseOpReference(path.startsWith('op://') ? path : `op://${path}`);
    if (!ref) {
      throw new Error(`Invalid 1Password path: ${path}`);
    }

    try {
      await exec(`op item delete "${ref.item}" --vault "${ref.vault}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('not found') || message.includes("doesn't exist")) {
        // Already deleted, ignore
        return;
      }

      throw new Error(`Failed to delete 1Password item: ${message}`);
    }
  }

  /**
   * List available vaults
   */
  async listVaults(): Promise<OnePasswordVault[]> {
    try {
      const { stdout } = await exec('op vault list --format json');
      return JSON.parse(stdout);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list 1Password vaults: ${message}`);
    }
  }

  /**
   * Search for items matching a query
   *
   * @param query - Search query (item title, etc.)
   * @param vault - Optional vault to search in
   */
  async searchItems(
    query: string,
    vault?: string
  ): Promise<Array<{ vault: string; item: string; category: string }>> {
    try {
      const vaultArg = vault ? `--vault "${vault}"` : '';
      const { stdout } = await exec(`op item list ${vaultArg} --format json`);
      const items: OnePasswordItem[] = JSON.parse(stdout);

      // Filter by query (case-insensitive)
      const lowerQuery = query.toLowerCase();
      return items
        .filter((item) => item.title.toLowerCase().includes(lowerQuery))
        .map((item) => ({
          vault: item.vault.name,
          item: item.title,
          category: item.category,
        }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to search 1Password items: ${message}`);
    }
  }

  /**
   * Get all fields for an item
   *
   * Useful for discovering available fields in an item.
   */
  async getItemFields(
    item: string,
    vault: string
  ): Promise<Array<{ label: string; type: string; section?: string }>> {
    try {
      const { stdout } = await exec(`op item get "${item}" --vault "${vault}" --format json`);
      const itemData: OnePasswordItem = JSON.parse(stdout);

      if (!itemData.fields) {
        return [];
      }

      return itemData.fields.map((field) => ({
        label: field.label,
        type: field.type,
        section: field.section?.label,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get 1Password item fields: ${message}`);
    }
  }
}

/**
 * Singleton instance of the OnePasswordProvider
 */
export const onePasswordProvider = new OnePasswordProvider();

/**
 * Check if a string is a 1Password reference
 */
export function isOpReference(value: string): boolean {
  return value.startsWith('op://');
}

/**
 * Helper to get installation instructions for 1Password CLI
 */
export function getOpInstallInstructions(): string {
  return `
1Password CLI Installation Instructions:

macOS (Homebrew):
  brew install --cask 1password-cli

macOS (Direct download):
  https://1password.com/downloads/command-line/

Windows (winget):
  winget install -e --id AgileBits.1Password.CLI

Linux:
  See https://developer.1password.com/docs/cli/get-started/

After installation, sign in:
  op signin
`.trim();
}
