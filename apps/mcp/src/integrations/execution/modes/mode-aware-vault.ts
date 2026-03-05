/**
 * Mode-Aware Vault Provider
 *
 * Extends the vault system to support separate credential storage
 * for sandbox and production modes.
 *
 * Structure:
 * ~/.kahuna/
 * ├── vault/
 * │   ├── production/    # Production credentials
 * │   │   └── .env
 * │   └── sandbox/       # Test/sandbox credentials
 * │       └── .env
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { VaultProvider } from '../../../vault/types.js';
import type { ExecutionMode } from './types.js';

/**
 * Vault environment (mode-specific)
 */
export type VaultEnvironment = 'sandbox' | 'production';

/**
 * Mode-aware vault configuration
 */
export interface ModeAwareVaultConfig {
  /** Base directory for vault storage */
  baseDir?: string;

  /** Prefix for environment variables */
  envPrefix?: string;

  /** Whether to fall back to production if sandbox credential not found */
  fallbackToProduction?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ModeAwareVaultConfig> = {
  baseDir: join(homedir(), '.kahuna', 'vault'),
  envPrefix: '',
  fallbackToProduction: false,
};

/**
 * Mode-Aware Vault Provider
 *
 * Provides credential resolution based on execution mode:
 * - simulation: No credentials needed (returns placeholders)
 * - sandbox: Uses sandbox credentials from ~/.kahuna/vault/sandbox/
 * - production: Uses production credentials from ~/.kahuna/vault/production/
 */
export class ModeAwareVaultProvider implements VaultProvider {
  readonly name = 'env' as const;
  private config: Required<ModeAwareVaultConfig>;
  private currentMode: ExecutionMode = 'simulation';
  private secretsCache: Map<string, Map<string, string>> = new Map();

  constructor(config?: ModeAwareVaultConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeDirectories();
  }

  /**
   * Set the current execution mode
   */
  setMode(mode: ExecutionMode): void {
    this.currentMode = mode;
  }

  /**
   * Get the current execution mode
   */
  getMode(): ExecutionMode {
    return this.currentMode;
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    return true; // Environment variables are always available
  }

  /**
   * Get a secret value based on current mode
   */
  async getSecret(path: string): Promise<string | null> {
    // For simulation mode, return placeholder
    if (this.currentMode === 'simulation') {
      return `[SIMULATED_${path.toUpperCase()}]`;
    }

    // Determine vault environment
    const vaultEnv = this.currentMode === 'sandbox' ? 'sandbox' : 'production';

    // Try to get from the appropriate vault
    let value = await this.getSecretFromEnvironment(path, vaultEnv);

    // Fallback to production if configured and not found in sandbox
    if (!value && vaultEnv === 'sandbox' && this.config.fallbackToProduction) {
      value = await this.getSecretFromEnvironment(path, 'production');
    }

    return value;
  }

  /**
   * Get secret from a specific vault environment
   */
  async getSecretFromEnvironment(
    path: string,
    environment: VaultEnvironment
  ): Promise<string | null> {
    // Load secrets for this environment
    const secrets = await this.loadSecretsForEnvironment(environment);

    // Try multiple key formats
    const normalizedPath = path.toUpperCase().replace(/[/-]/g, '_');
    const prefixedPath = this.config.envPrefix
      ? `${this.config.envPrefix}${normalizedPath}`
      : normalizedPath;

    // Check in order: exact path, normalized path, prefixed path
    return secrets.get(path) ?? secrets.get(normalizedPath) ?? secrets.get(prefixedPath) ?? null;
  }

  /**
   * Store a secret in the appropriate vault environment
   */
  async setSecret(path: string, value: string): Promise<void> {
    if (this.currentMode === 'simulation') {
      // Don't actually store in simulation mode
      return;
    }

    const vaultEnv = this.currentMode === 'sandbox' ? 'sandbox' : 'production';
    const envFile = this.getEnvFilePath(vaultEnv);

    // Load existing content
    let content = '';
    if (existsSync(envFile)) {
      content = readFileSync(envFile, 'utf-8');
    }

    // Parse existing entries
    const entries = new Map<string, string>();
    for (const line of content.split('\n')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        entries.set(match[1], match[2]);
      }
    }

    // Add/update the new entry
    const key = path.toUpperCase().replace(/[/-]/g, '_');
    entries.set(key, value);

    // Write back
    const newContent = Array.from(entries.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    writeFileSync(envFile, newContent, 'utf-8');

    // Clear cache
    this.secretsCache.delete(vaultEnv);
  }

  /**
   * List available secrets (paths only)
   */
  async listSecrets(prefix?: string): Promise<string[]> {
    const vaultEnv = this.currentMode === 'sandbox' ? 'sandbox' : 'production';
    const secrets = await this.loadSecretsForEnvironment(vaultEnv);

    let keys = Array.from(secrets.keys());

    if (prefix) {
      const normalizedPrefix = prefix.toUpperCase().replace(/[/-]/g, '_');
      keys = keys.filter((k) => k.startsWith(normalizedPrefix));
    }

    return keys;
  }

  /**
   * Delete a secret
   */
  async deleteSecret(path: string): Promise<void> {
    if (this.currentMode === 'simulation') {
      return;
    }

    const vaultEnv = this.currentMode === 'sandbox' ? 'sandbox' : 'production';
    const envFile = this.getEnvFilePath(vaultEnv);

    if (!existsSync(envFile)) {
      return;
    }

    const content = readFileSync(envFile, 'utf-8');
    const key = path.toUpperCase().replace(/[/-]/g, '_');

    const newLines = content.split('\n').filter((line) => !line.startsWith(`${key}=`));

    writeFileSync(envFile, newLines.join('\n'), 'utf-8');

    // Clear cache
    this.secretsCache.delete(vaultEnv);
  }

  /**
   * Load secrets for a specific environment
   */
  private async loadSecretsForEnvironment(
    environment: VaultEnvironment
  ): Promise<Map<string, string>> {
    // Check cache
    const cached = this.secretsCache.get(environment);
    if (cached) {
      return cached;
    }

    const secrets = new Map<string, string>();

    // Load from .env file
    const envFile = this.getEnvFilePath(environment);
    if (existsSync(envFile)) {
      const content = readFileSync(envFile, 'utf-8');
      for (const line of content.split('\n')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          secrets.set(match[1], match[2]);
        }
      }
    }

    // Also load from process.env with appropriate prefix
    const envPrefix = environment === 'sandbox' ? 'SANDBOX_' : '';

    for (const [key, value] of Object.entries(process.env)) {
      if (value) {
        if (envPrefix && key.startsWith(envPrefix)) {
          // Store without prefix for easier lookup
          const unprefixedKey = key.substring(envPrefix.length);
          secrets.set(unprefixedKey, value);
        } else if (!envPrefix) {
          // Production: load all env vars
          secrets.set(key, value);
        }
      }
    }

    // Cache the result
    this.secretsCache.set(environment, secrets);

    return secrets;
  }

  /**
   * Get path to .env file for an environment
   */
  private getEnvFilePath(environment: VaultEnvironment): string {
    return join(this.config.baseDir, environment, '.env');
  }

  /**
   * Initialize directory structure
   */
  private initializeDirectories(): void {
    const sandboxDir = join(this.config.baseDir, 'sandbox');
    const productionDir = join(this.config.baseDir, 'production');

    if (!existsSync(sandboxDir)) {
      mkdirSync(sandboxDir, { recursive: true });
    }

    if (!existsSync(productionDir)) {
      mkdirSync(productionDir, { recursive: true });
    }
  }

  /**
   * Clear the secrets cache (useful for testing)
   */
  clearCache(): void {
    this.secretsCache.clear();
  }

  /**
   * Check if credentials exist for a specific environment
   */
  async hasCredentials(
    credentialKeys: string[],
    environment: VaultEnvironment
  ): Promise<{ found: string[]; missing: string[] }> {
    const secrets = await this.loadSecretsForEnvironment(environment);
    const found: string[] = [];
    const missing: string[] = [];

    for (const key of credentialKeys) {
      const normalizedKey = key.toUpperCase().replace(/[/-]/g, '_');
      if (secrets.has(key) || secrets.has(normalizedKey)) {
        found.push(key);
      } else {
        missing.push(key);
      }
    }

    return { found, missing };
  }

  /**
   * Get credential status for both environments
   */
  async getCredentialStatus(
    credentialKeys: string[]
  ): Promise<Record<VaultEnvironment, { found: string[]; missing: string[] }>> {
    const sandbox = await this.hasCredentials(credentialKeys, 'sandbox');
    const production = await this.hasCredentials(credentialKeys, 'production');

    return { sandbox, production };
  }
}

/**
 * Singleton instance
 */
let globalVaultProvider: ModeAwareVaultProvider | null = null;

/**
 * Get the global mode-aware vault provider
 */
export function getModeAwareVaultProvider(): ModeAwareVaultProvider {
  if (!globalVaultProvider) {
    globalVaultProvider = new ModeAwareVaultProvider();
  }
  return globalVaultProvider;
}

/**
 * Reset the global vault provider (for testing)
 */
export function resetModeAwareVaultProvider(): void {
  globalVaultProvider = null;
}

/**
 * Create a new mode-aware vault provider
 */
export function createModeAwareVaultProvider(
  config?: ModeAwareVaultConfig
): ModeAwareVaultProvider {
  return new ModeAwareVaultProvider(config);
}

/**
 * Map execution mode to vault environment
 */
export function modeToVaultEnvironment(mode: ExecutionMode): VaultEnvironment | null {
  switch (mode) {
    case 'sandbox':
      return 'sandbox';
    case 'production':
      return 'production';
    case 'simulation':
      return null; // No vault needed for simulation
  }
}
