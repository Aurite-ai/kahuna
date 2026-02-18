/**
 * Cost Calculator
 *
 * Calculates costs for LLM API calls based on token usage and model pricing.
 */

import { getModelPricing, getShortModelName } from './pricing.js';
import type { CostBreakdown, TokenUsage, UsageDisplay, UsageSummary } from './types.js';

/**
 * Calculate the cost breakdown for a single LLM call.
 *
 * @param model - Model identifier
 * @param usage - Token usage from API response
 * @returns Cost breakdown in USD
 */
export function calculateCost(model: string, usage: TokenUsage): CostBreakdown {
  const pricing = getModelPricing(model);

  // Calculate costs (prices are per 1M tokens, so divide by 1,000,000)
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPer1M;

  // Calculate cache costs if applicable
  let cacheCost = 0;
  if (usage.cacheReadTokens && pricing.cacheReadPer1M) {
    cacheCost += (usage.cacheReadTokens / 1_000_000) * pricing.cacheReadPer1M;
  }
  if (usage.cacheCreationTokens && pricing.cacheWritePer1M) {
    cacheCost += (usage.cacheCreationTokens / 1_000_000) * pricing.cacheWritePer1M;
  }

  const totalCost = inputCost + outputCost + cacheCost;

  return {
    inputCost: roundToMicros(inputCost),
    outputCost: roundToMicros(outputCost),
    cacheCost: roundToMicros(cacheCost),
    totalCost: roundToMicros(totalCost),
    currency: 'USD',
  };
}

/**
 * Round to 6 decimal places (micro-dollars precision).
 * This avoids floating point errors in cost calculations.
 */
function roundToMicros(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Format a cost value for display.
 *
 * @param cost - Cost in USD
 * @param precision - Number of decimal places (default: 4)
 * @returns Formatted cost string (e.g., "$0.0123")
 */
export function formatCost(cost: number, precision = 4): string {
  if (cost < 0.0001) {
    return '<$0.0001';
  }
  return `$${cost.toFixed(precision)}`;
}

/**
 * Format token count for display.
 *
 * @param tokens - Number of tokens
 * @returns Formatted string (e.g., "1,234" or "1.2K")
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 10_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toLocaleString();
}

/**
 * Format latency for display.
 *
 * @param ms - Latency in milliseconds
 * @returns Formatted string (e.g., "123ms" or "1.2s")
 */
export function formatLatency(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
}

/**
 * Create an empty usage summary.
 *
 * @returns Empty UsageSummary with all values at zero
 */
export function createEmptySummary(): UsageSummary {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    estimatedCost: 0,
    callCount: 0,
    avgLatencyMs: 0,
  };
}

/**
 * Add token usage to an existing summary.
 *
 * @param summary - Existing summary to update
 * @param usage - Token usage to add
 * @param cost - Cost breakdown to add
 * @param latencyMs - Latency to include in average
 * @returns Updated summary (mutates original)
 */
export function addToSummary(
  summary: UsageSummary,
  usage: TokenUsage,
  cost: CostBreakdown,
  latencyMs: number
): UsageSummary {
  // Update token counts
  summary.inputTokens += usage.inputTokens;
  summary.outputTokens += usage.outputTokens;
  summary.cacheReadTokens += usage.cacheReadTokens ?? 0;
  summary.cacheCreationTokens += usage.cacheCreationTokens ?? 0;

  // Update cost
  summary.estimatedCost = roundToMicros(summary.estimatedCost + cost.totalCost);

  // Update call count and average latency
  const prevTotalLatency = summary.avgLatencyMs * summary.callCount;
  summary.callCount += 1;
  summary.avgLatencyMs = Math.round((prevTotalLatency + latencyMs) / summary.callCount);

  return summary;
}

/**
 * Generate a usage display object for tool responses.
 *
 * @param model - Model used for this call
 * @param usage - Token usage for this call
 * @param cost - Cost for this call
 * @param latencyMs - Latency for this call
 * @param sessionTotals - Session totals summary
 * @returns UsageDisplay with markdown and structured data
 */
export function generateUsageDisplay(
  model: string,
  usage: TokenUsage,
  cost: CostBreakdown,
  latencyMs: number,
  sessionTotals: UsageSummary
): UsageDisplay {
  const modelName = getShortModelName(model);

  // Generate markdown table
  const markdown = `
---
📊 **Usage Summary**

| Metric | This Call | Session Total |
|--------|-----------|---------------|
| Model | ${modelName} | - |
| Input Tokens | ${formatTokens(usage.inputTokens)} | ${formatTokens(sessionTotals.inputTokens)} |
| Output Tokens | ${formatTokens(usage.outputTokens)} | ${formatTokens(sessionTotals.outputTokens)} |
| Est. Cost | ${formatCost(cost.totalCost)} | ${formatCost(sessionTotals.estimatedCost)} |
| Latency | ${formatLatency(latencyMs)} | avg ${formatLatency(sessionTotals.avgLatencyMs)} |
| Calls | 1 | ${sessionTotals.callCount} |
`.trim();

  return {
    markdown,
    data: {
      thisCall: {
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cost: cost.totalCost,
        latencyMs,
      },
      sessionTotal: {
        inputTokens: sessionTotals.inputTokens,
        outputTokens: sessionTotals.outputTokens,
        cost: sessionTotals.estimatedCost,
        callCount: sessionTotals.callCount,
      },
    },
  };
}

/**
 * Generate a compact one-line usage summary.
 * Useful for inline display in tool responses.
 *
 * @param model - Model used
 * @param usage - Token usage
 * @param cost - Cost breakdown
 * @returns One-line summary string
 */
export function generateCompactSummary(
  model: string,
  usage: TokenUsage,
  cost: CostBreakdown
): string {
  const modelName = getShortModelName(model);
  const totalTokens = usage.inputTokens + usage.outputTokens;
  return `${modelName} | ${formatTokens(totalTokens)} tokens | ${formatCost(cost.totalCost)}`;
}
