/**
 * Usage Tracker Service
 *
 * In-memory session tracker for LLM usage and costs.
 * Tracks all LLM calls within a session and provides summaries.
 *
 * For enterprise deployment, this can be extended to send data
 * to a remote API for persistent storage and analytics.
 */

import { randomUUID } from 'node:crypto';
import {
  addToSummary,
  calculateCost,
  createEmptySummary,
  generateUsageDisplay,
} from './calculator.js';
import type {
  LLMCall,
  ModelUsage,
  RecordCallInput,
  SessionSummary,
  TokenUsage,
  ToolUsage,
  UsageDisplay,
  UsageSummary,
  UsageTrackerConfig,
  UserIdentity,
} from './types.js';

/**
 * Usage Tracker class.
 *
 * Manages a single session's worth of LLM usage data.
 * Provides methods to record calls, get summaries, and generate display output.
 */
export class UsageTracker {
  private readonly sessionId: string;
  private readonly startTime: Date;
  private readonly config: UsageTrackerConfig;
  private readonly calls: LLMCall[] = [];
  private readonly totals: UsageSummary;
  private readonly byModel: Map<string, UsageSummary> = new Map();
  private readonly byTool: Map<string, UsageSummary> = new Map();

  // Track the most recent call for display purposes
  private lastCall: LLMCall | null = null;

  constructor(config?: Partial<UsageTrackerConfig>) {
    this.sessionId = randomUUID();
    this.startTime = new Date();
    this.totals = createEmptySummary();

    this.config = {
      includeInResponses: true,
      enableRemoteReporting: false,
      ...config,
    };
  }

  /**
   * Get the session ID.
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get the user identity (if configured).
   */
  getUserIdentity(): UserIdentity | undefined {
    return this.config.userIdentity;
  }

  /**
   * Record an LLM API call.
   *
   * @param input - Call data to record
   * @returns The recorded LLMCall with calculated costs
   */
  record(input: RecordCallInput): LLMCall {
    const cost = calculateCost(input.model, input.usage);

    const call: LLMCall = {
      id: randomUUID(),
      timestamp: new Date(),
      model: input.model,
      toolName: input.toolName,
      usage: input.usage,
      cost,
      latencyMs: input.latencyMs,
      success: input.success ?? true,
      errorMessage: input.errorMessage,
    };

    // Store the call
    this.calls.push(call);
    this.lastCall = call;

    // Update totals
    addToSummary(this.totals, input.usage, cost, input.latencyMs);

    // Update by-model breakdown
    let modelSummary = this.byModel.get(input.model);
    if (!modelSummary) {
      modelSummary = createEmptySummary();
      this.byModel.set(input.model, modelSummary);
    }
    addToSummary(modelSummary, input.usage, cost, input.latencyMs);

    // Update by-tool breakdown
    let toolSummary = this.byTool.get(input.toolName);
    if (!toolSummary) {
      toolSummary = createEmptySummary();
      this.byTool.set(input.toolName, toolSummary);
    }
    addToSummary(toolSummary, input.usage, cost, input.latencyMs);

    // Send to remote API if configured
    if (this.config.enableRemoteReporting) {
      this.sendToRemote(call).catch((err) => {
        console.error('[UsageTracker] Failed to send to remote API:', err);
      });
    }

    return call;
  }

  /**
   * Get the total usage summary for this session.
   */
  getTotals(): UsageSummary {
    return { ...this.totals };
  }

  /**
   * Get usage breakdown by model.
   */
  getByModel(): Record<string, ModelUsage> {
    const result: Record<string, ModelUsage> = {};
    for (const [model, summary] of this.byModel) {
      result[model] = { ...summary, model };
    }
    return result;
  }

  /**
   * Get usage breakdown by tool.
   */
  getByTool(): Record<string, ToolUsage> {
    const result: Record<string, ToolUsage> = {};
    for (const [toolName, summary] of this.byTool) {
      result[toolName] = { ...summary, toolName };
    }
    return result;
  }

  /**
   * Get the full session summary.
   */
  getSessionSummary(): SessionSummary {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: null, // Session is still active
      userId: this.config.userIdentity?.userId,
      organizationId: this.config.userIdentity?.organizationId,
      calls: [...this.calls],
      totals: this.getTotals(),
      byModel: this.getByModel(),
      byTool: this.getByTool(),
    };
  }

  /**
   * Get the most recent call.
   */
  getLastCall(): LLMCall | null {
    return this.lastCall;
  }

  /**
   * Generate a usage display for the most recent call.
   * Returns null if no calls have been recorded.
   */
  getLastCallDisplay(): UsageDisplay | null {
    if (!this.lastCall) {
      return null;
    }

    return generateUsageDisplay(
      this.lastCall.model,
      this.lastCall.usage,
      this.lastCall.cost,
      this.lastCall.latencyMs,
      this.totals
    );
  }

  /**
   * Generate a usage display for a specific call.
   *
   * @param call - The call to generate display for
   * @returns UsageDisplay with markdown and data
   */
  getCallDisplay(call: LLMCall): UsageDisplay {
    return generateUsageDisplay(call.model, call.usage, call.cost, call.latencyMs, this.totals);
  }

  /**
   * Check if usage should be included in tool responses.
   */
  shouldIncludeInResponses(): boolean {
    return this.config.includeInResponses;
  }

  /**
   * Get the number of calls in this session.
   */
  getCallCount(): number {
    return this.calls.length;
  }

  /**
   * Reset the session (clears all recorded calls).
   * Useful for testing or starting a fresh session.
   */
  reset(): void {
    this.calls.length = 0;
    this.byModel.clear();
    this.byTool.clear();
    this.lastCall = null;

    // Reset totals
    this.totals.inputTokens = 0;
    this.totals.outputTokens = 0;
    this.totals.cacheReadTokens = 0;
    this.totals.cacheCreationTokens = 0;
    this.totals.estimatedCost = 0;
    this.totals.callCount = 0;
    this.totals.avgLatencyMs = 0;
  }

  /** Timeout for remote API calls in milliseconds */
  private static readonly REMOTE_TIMEOUT_MS = 10000;

  /**
   * Send usage data to remote API (for enterprise tracking).
   * Override this method to implement custom reporting.
   *
   * @param call - The call to report
   */
  protected async sendToRemote(call: LLMCall): Promise<void> {
    if (!this.config.apiEndpoint || !this.config.apiKey) {
      return;
    }

    // Add timeout to prevent slow/unresponsive endpoints from causing issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UsageTracker.REMOTE_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.config.apiEndpoint}/usage/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.config.userIdentity?.userId,
          organizationId: this.config.userIdentity?.organizationId,
          call: {
            id: call.id,
            timestamp: call.timestamp.toISOString(),
            model: call.model,
            toolName: call.toolName,
            inputTokens: call.usage.inputTokens,
            outputTokens: call.usage.outputTokens,
            cacheReadTokens: call.usage.cacheReadTokens ?? 0,
            cacheCreationTokens: call.usage.cacheCreationTokens ?? 0,
            estimatedCostCents: Math.round(call.cost.totalCost * 100),
            latencyMs: call.latencyMs,
            success: call.success,
            errorMessage: call.errorMessage,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[UsageTracker] Remote API returned ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[UsageTracker] Failed to send to remote API:', error);
    }
  }
}

/**
 * Create a usage tracker with configuration from environment variables.
 *
 * Environment variables:
 * - KAHUNA_USAGE_API_ENDPOINT: Remote API endpoint for usage reporting
 * - KAHUNA_USAGE_API_KEY: API key for remote reporting
 * - KAHUNA_USER_ID: User identifier
 * - KAHUNA_ORG_ID: Organization identifier
 * - KAHUNA_TEAM_ID: Team identifier (optional)
 * - KAHUNA_INCLUDE_USAGE_IN_RESPONSES: Whether to include usage in responses (default: true)
 *
 * @returns Configured UsageTracker instance
 */
export function createUsageTrackerFromEnv(): UsageTracker {
  const apiEndpoint = process.env.KAHUNA_USAGE_API_ENDPOINT;
  const apiKey = process.env.KAHUNA_USAGE_API_KEY;
  const userId = process.env.KAHUNA_USER_ID;
  const orgId = process.env.KAHUNA_ORG_ID;
  const teamId = process.env.KAHUNA_TEAM_ID;
  const includeInResponses = process.env.KAHUNA_INCLUDE_USAGE_IN_RESPONSES !== 'false';

  const config: Partial<UsageTrackerConfig> = {
    includeInResponses,
    enableRemoteReporting: !!(apiEndpoint && apiKey),
    apiEndpoint,
    apiKey,
  };

  if (userId && orgId) {
    config.userIdentity = {
      userId,
      organizationId: orgId,
      teamId,
      permissions: [], // Would be populated from auth system
    };
  }

  return new UsageTracker(config);
}

/**
 * Helper function to extract token usage from Anthropic API response.
 * Handles missing usage gracefully by returning zeros.
 *
 * @param response - Anthropic API response object
 * @returns TokenUsage object
 */
export function extractTokenUsage(response: {
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}): TokenUsage {
  return {
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    cacheReadTokens: response.usage?.cache_read_input_tokens,
    cacheCreationTokens: response.usage?.cache_creation_input_tokens,
  };
}
