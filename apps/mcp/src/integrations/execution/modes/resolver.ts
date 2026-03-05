/**
 * Mode Resolver
 *
 * Resolves the execution mode based on the priority hierarchy:
 * 1. Explicit parameter (highest)
 * 2. Session mode
 * 3. Project default
 * 4. Global default
 * 5. System default (lowest)
 */

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  DEFAULT_GLOBAL_MODE_CONFIG,
  DEFAULT_MODE_CONFIGS,
  DEFAULT_PROJECT_MODE_CONFIG,
  type ExecutionMode,
  type GlobalModeConfig,
  type ModeConfig,
  type ModeResolutionResult,
  type ModeResolutionSource,
  type ProjectModeConfig,
  type SessionModeState,
  isValidExecutionMode,
} from './types.js';

/**
 * Mode Resolver class
 *
 * Handles resolving the execution mode from multiple sources
 * and maintains session state.
 */
export class ModeResolver {
  private sessionState: SessionModeState = {};
  private projectConfigCache: Map<string, ProjectModeConfig> = new Map();
  private globalConfigCache: GlobalModeConfig | null = null;

  /**
   * Resolve the execution mode for a request
   *
   * @param explicitMode - Mode explicitly specified in the request (optional)
   * @param projectPath - Path to the project (for loading project config)
   * @param user - User making the request (optional)
   */
  resolve(
    explicitMode?: ExecutionMode | string,
    projectPath?: string,
    user?: string
  ): ModeResolutionResult {
    // 1. Check explicit parameter first
    if (explicitMode) {
      if (isValidExecutionMode(explicitMode)) {
        return this.buildResult(explicitMode, 'explicit_parameter', projectPath, user);
      }
      // Invalid mode specified
      return {
        mode: 'simulation',
        source: 'system_default',
        config: DEFAULT_MODE_CONFIGS.simulation,
        allowed: false,
        denialReason: `Invalid mode "${explicitMode}". Valid modes: simulation, sandbox, production`,
      };
    }

    // 2. Check session mode
    if (this.sessionState.currentMode) {
      return this.buildResult(this.sessionState.currentMode, 'session_mode', projectPath, user);
    }

    // 3. Check project config
    const projectConfig = this.loadProjectConfig(projectPath);
    if (projectConfig?.defaultMode) {
      return this.buildResult(projectConfig.defaultMode, 'project_default', projectPath, user);
    }

    // 4. Check global config
    const globalConfig = this.loadGlobalConfig();
    if (globalConfig?.defaultMode) {
      return this.buildResult(globalConfig.defaultMode, 'global_default', projectPath, user);
    }

    // 5. System default (simulation - safest)
    return this.buildResult('simulation', 'system_default', projectPath, user);
  }

  /**
   * Set the session mode
   */
  setSessionMode(mode: ExecutionMode, user?: string): void {
    this.sessionState = {
      currentMode: mode,
      setAt: new Date().toISOString(),
      setBy: user,
    };
  }

  /**
   * Clear the session mode
   */
  clearSessionMode(): void {
    this.sessionState = {};
  }

  /**
   * Get current session state
   */
  getSessionState(): SessionModeState {
    return { ...this.sessionState };
  }

  /**
   * Build a mode resolution result with validation
   */
  private buildResult(
    mode: ExecutionMode,
    source: ModeResolutionSource,
    projectPath?: string,
    _user?: string
  ): ModeResolutionResult {
    const projectConfig = this.loadProjectConfig(projectPath);
    const allowedModes = projectConfig?.allowedModes ?? DEFAULT_PROJECT_MODE_CONFIG.allowedModes;

    // Check if mode is allowed
    const allowed = allowedModes.includes(mode);

    // Get effective config for this mode
    const config = this.getMergedModeConfig(mode, projectConfig);

    if (!allowed) {
      return {
        mode,
        source,
        config,
        allowed: false,
        denialReason: `Mode "${mode}" is not allowed in this project. Allowed modes: ${allowedModes.join(', ')}`,
      };
    }

    return {
      mode,
      source,
      config,
      allowed: true,
    };
  }

  /**
   * Get merged mode config (project overrides + defaults)
   */
  private getMergedModeConfig(
    mode: ExecutionMode,
    projectConfig?: ProjectModeConfig | null
  ): ModeConfig {
    const baseConfig = DEFAULT_MODE_CONFIGS[mode];
    const projectOverrides = projectConfig?.modes?.[mode];

    if (!projectOverrides) {
      return baseConfig;
    }

    return {
      ...baseConfig,
      ...projectOverrides,
    };
  }

  /**
   * Load project mode configuration from .kahuna/config.yaml
   */
  private loadProjectConfig(projectPath?: string): ProjectModeConfig | null {
    if (!projectPath) {
      return null;
    }

    // Check cache
    if (this.projectConfigCache.has(projectPath)) {
      return this.projectConfigCache.get(projectPath) ?? null;
    }

    const configPath = join(projectPath, '.kahuna', 'config.yaml');
    const config = this.loadConfigFile(configPath);

    if (config) {
      const projectConfig = this.validateProjectConfig(config);
      if (projectConfig) {
        this.projectConfigCache.set(projectPath, projectConfig);
        return projectConfig;
      }
    }

    return null;
  }

  /**
   * Load global user mode configuration from ~/.kahuna/config.yaml
   */
  private loadGlobalConfig(): GlobalModeConfig | null {
    if (this.globalConfigCache) {
      return this.globalConfigCache;
    }

    const configPath = join(homedir(), '.kahuna', 'config.yaml');
    const config = this.loadConfigFile(configPath);

    if (config) {
      const globalConfig = this.validateGlobalConfig(config);
      if (globalConfig) {
        this.globalConfigCache = globalConfig;
        return globalConfig;
      }
    }

    return DEFAULT_GLOBAL_MODE_CONFIG;
  }

  /**
   * Validate and convert raw config to ProjectModeConfig
   */
  private validateProjectConfig(config: Record<string, unknown>): ProjectModeConfig | null {
    const defaultMode = config.defaultMode;
    const allowedModes = config.allowedModes;

    // Check required fields exist and are valid
    if (typeof defaultMode !== 'string' || !isValidExecutionMode(defaultMode)) {
      return null;
    }

    if (!Array.isArray(allowedModes)) {
      return null;
    }

    const validAllowedModes = allowedModes.filter(
      (m): m is ExecutionMode => typeof m === 'string' && isValidExecutionMode(m)
    );

    return {
      defaultMode,
      allowedModes: validAllowedModes,
      modes: config.modes as ProjectModeConfig['modes'],
    };
  }

  /**
   * Validate and convert raw config to GlobalModeConfig
   */
  private validateGlobalConfig(config: Record<string, unknown>): GlobalModeConfig | null {
    const defaultMode = config.defaultMode;
    const allowModeOverride = config.allowModeOverride;

    // Check required fields exist and are valid
    if (typeof defaultMode !== 'string' || !isValidExecutionMode(defaultMode)) {
      return null;
    }

    return {
      defaultMode,
      allowModeOverride: typeof allowModeOverride === 'boolean' ? allowModeOverride : false,
    };
  }

  /**
   * Load a YAML config file
   */
  private loadConfigFile(filePath: string): Record<string, unknown> | null {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      // Simple YAML parsing for our config format
      return this.parseSimpleYaml(content);
    } catch {
      // Config file exists but couldn't be read/parsed
      return null;
    }
  }

  /**
   * Simple YAML parser for our config format
   * (Handles basic key: value and arrays)
   */
  private parseSimpleYaml(content: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = content.split('\n');
    let currentKey = '';
    let currentArray: string[] | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Check for array item
      if (trimmed.startsWith('- ')) {
        if (currentArray !== null) {
          currentArray.push(trimmed.substring(2).trim());
        }
        continue;
      }

      // Save previous array if exists
      if (currentArray !== null && currentKey) {
        result[currentKey] = currentArray;
        currentArray = null;
      }

      // Parse key: value
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();

        if (value === '') {
          // Could be start of array or nested object
          currentKey = key;
          currentArray = [];
        } else if (value === 'true') {
          result[key] = true;
        } else if (value === 'false') {
          result[key] = false;
        } else if (!Number.isNaN(Number(value))) {
          result[key] = Number(value);
        } else {
          result[key] = value;
        }
      }
    }

    // Save final array if exists
    if (currentArray !== null && currentKey) {
      result[currentKey] = currentArray;
    }

    return result;
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.projectConfigCache.clear();
    this.globalConfigCache = null;
  }

  /**
   * Reload configuration from disk
   */
  reloadConfig(projectPath?: string): void {
    if (projectPath) {
      this.projectConfigCache.delete(projectPath);
    }
    this.globalConfigCache = null;
  }
}

/**
 * Singleton instance for global mode resolution
 */
let globalResolver: ModeResolver | null = null;

/**
 * Get the global mode resolver instance
 */
export function getModeResolver(): ModeResolver {
  if (!globalResolver) {
    globalResolver = new ModeResolver();
  }
  return globalResolver;
}

/**
 * Reset the global resolver (for testing)
 */
export function resetModeResolver(): void {
  globalResolver = null;
}

/**
 * Convenience function to resolve mode
 */
export function resolveMode(
  explicitMode?: ExecutionMode | string,
  projectPath?: string,
  user?: string
): ModeResolutionResult {
  return getModeResolver().resolve(explicitMode, projectPath, user);
}

/**
 * Convenience function to set session mode
 */
export function setSessionMode(mode: ExecutionMode, user?: string): void {
  getModeResolver().setSessionMode(mode, user);
}

/**
 * Convenience function to clear session mode
 */
export function clearSessionMode(): void {
  getModeResolver().clearSessionMode();
}

/**
 * Convenience function to get session state
 */
export function getSessionState(): SessionModeState {
  return getModeResolver().getSessionState();
}
