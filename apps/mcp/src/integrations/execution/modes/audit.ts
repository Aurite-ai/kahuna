/**
 * Mode Audit Logger
 *
 * Provides audit logging for mode-related operations.
 * Logs are stored in ~/.kahuna/audit.jsonl (JSON Lines format)
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { ExecutionMode, ModeAuditEntry, ModeResolutionSource } from './types.js';

/**
 * Audit log configuration
 */
export interface AuditConfig {
  /** Path to audit log file */
  logPath?: string;

  /** Whether audit logging is enabled */
  enabled?: boolean;

  /** Maximum entries to keep (0 = unlimited) */
  maxEntries?: number;
}

/**
 * Default audit configuration
 */
const DEFAULT_AUDIT_CONFIG: Required<AuditConfig> = {
  logPath: join(homedir(), '.kahuna', 'audit.jsonl'),
  enabled: true,
  maxEntries: 10000,
};

/**
 * Execution audit entry (extends base audit entry)
 */
export interface ExecutionAuditEntry extends ModeAuditEntry {
  action: 'execution';
  integrationId: string;
  operation: string;
  success: boolean;
  duration: number;
  errorCode?: string;
}

/**
 * Mode Audit Logger class
 */
export class ModeAuditLogger {
  private config: Required<AuditConfig>;

  constructor(config?: AuditConfig) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
    this.ensureLogDirectory();
  }

  /**
   * Log a mode set operation
   */
  logModeSet(mode: ExecutionMode, source: ModeResolutionSource, user?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: 'mode_set',
      mode,
      source,
      user,
    });
  }

  /**
   * Log a mode resolution
   */
  logModeResolved(
    mode: ExecutionMode,
    source: ModeResolutionSource,
    user?: string,
    details?: Record<string, unknown>
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: 'mode_resolved',
      mode,
      source,
      user,
      details,
    });
  }

  /**
   * Log a mode denial
   */
  logModeDenied(
    mode: ExecutionMode,
    source: ModeResolutionSource,
    reason: string,
    user?: string
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: 'mode_denied',
      mode,
      source,
      user,
      details: { reason },
    });
  }

  /**
   * Log an execution
   */
  logExecution(
    integrationId: string,
    operation: string,
    mode: ExecutionMode,
    source: ModeResolutionSource,
    success: boolean,
    duration: number,
    user?: string,
    errorCode?: string
  ): void {
    const entry: ExecutionAuditEntry = {
      timestamp: new Date().toISOString(),
      action: 'execution',
      mode,
      source,
      user,
      integrationId,
      operation,
      success,
      duration,
      errorCode,
    };
    this.log(entry);
  }

  /**
   * Write an audit entry to the log
   */
  private log(entry: ModeAuditEntry): void {
    if (!this.config.enabled) {
      return;
    }

    try {
      const line = `${JSON.stringify(entry)}\n`;
      appendFileSync(this.config.logPath, line, 'utf-8');
    } catch {
      // Silently fail if we can't write to audit log
      // Don't break execution for audit failures
    }
  }

  /**
   * Read recent audit entries
   */
  readEntries(limit = 100): ModeAuditEntry[] {
    if (!existsSync(this.config.logPath)) {
      return [];
    }

    try {
      const content = readFileSync(this.config.logPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      const entries = lines
        .map((line) => {
          try {
            return JSON.parse(line) as ModeAuditEntry;
          } catch {
            return null;
          }
        })
        .filter((entry): entry is ModeAuditEntry => entry !== null);

      // Return most recent entries
      return entries.slice(-limit);
    } catch {
      return [];
    }
  }

  /**
   * Get entries filtered by criteria
   */
  queryEntries(options: {
    mode?: ExecutionMode;
    action?: ModeAuditEntry['action'];
    user?: string;
    since?: Date;
    limit?: number;
  }): ModeAuditEntry[] {
    let entries = this.readEntries(options.limit ?? 1000);

    if (options.mode) {
      entries = entries.filter((e) => e.mode === options.mode);
    }

    if (options.action) {
      entries = entries.filter((e) => e.action === options.action);
    }

    if (options.user) {
      entries = entries.filter((e) => e.user === options.user);
    }

    if (options.since) {
      const sinceTime = options.since.getTime();
      entries = entries.filter((e) => new Date(e.timestamp).getTime() >= sinceTime);
    }

    return entries.slice(-(options.limit ?? 100));
  }

  /**
   * Get execution statistics
   */
  getStats(since?: Date): {
    total: number;
    byMode: Record<ExecutionMode, number>;
    bySuccess: { success: number; failure: number };
    averageDuration: number;
  } {
    const entries = this.queryEntries({
      action: 'execution',
      since,
      limit: 10000,
    }) as ExecutionAuditEntry[];

    const byMode: Record<ExecutionMode, number> = {
      simulation: 0,
      sandbox: 0,
      production: 0,
    };

    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;

    for (const entry of entries) {
      byMode[entry.mode]++;
      if (entry.success) {
        successCount++;
      } else {
        failureCount++;
      }
      totalDuration += entry.duration;
    }

    return {
      total: entries.length,
      byMode,
      bySuccess: { success: successCount, failure: failureCount },
      averageDuration: entries.length > 0 ? totalDuration / entries.length : 0,
    };
  }

  /**
   * Ensure the log directory exists
   */
  private ensureLogDirectory(): void {
    const dir = dirname(this.config.logPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Clear the audit log (for testing)
   */
  clear(): void {
    try {
      const { writeFileSync } = require('node:fs');
      writeFileSync(this.config.logPath, '', 'utf-8');
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Singleton instance
 */
let globalAuditLogger: ModeAuditLogger | null = null;

/**
 * Get the global audit logger
 */
export function getAuditLogger(): ModeAuditLogger {
  if (!globalAuditLogger) {
    globalAuditLogger = new ModeAuditLogger();
  }
  return globalAuditLogger;
}

/**
 * Reset the global audit logger (for testing)
 */
export function resetAuditLogger(): void {
  globalAuditLogger = null;
}

/**
 * Create a new audit logger
 */
export function createAuditLogger(config?: AuditConfig): ModeAuditLogger {
  return new ModeAuditLogger(config);
}

/**
 * Convenience function to log an execution
 */
export function logExecution(
  integrationId: string,
  operation: string,
  mode: ExecutionMode,
  source: ModeResolutionSource,
  success: boolean,
  duration: number,
  user?: string,
  errorCode?: string
): void {
  getAuditLogger().logExecution(
    integrationId,
    operation,
    mode,
    source,
    success,
    duration,
    user,
    errorCode
  );
}
