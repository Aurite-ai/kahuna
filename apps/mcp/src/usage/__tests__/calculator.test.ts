/**
 * Tests for the usage calculator module
 */

import { describe, expect, it } from 'vitest';
import {
  addToSummary,
  calculateCost,
  createEmptySummary,
  formatCost,
  formatLatency,
  formatTokens,
  generateCompactSummary,
} from '../calculator.js';
import type { CostBreakdown, TokenUsage } from '../types.js';

describe('calculateCost', () => {
  it('calculates cost for Claude 3 Haiku correctly', () => {
    const usage: TokenUsage = {
      inputTokens: 1000,
      outputTokens: 500,
    };

    const cost = calculateCost('claude-3-haiku-20240307', usage);

    // Haiku: $0.25/1M input, $1.25/1M output
    // Input: 1000 / 1M * 0.25 = 0.00025
    // Output: 500 / 1M * 1.25 = 0.000625
    expect(cost.inputCost).toBeCloseTo(0.00025, 6);
    expect(cost.outputCost).toBeCloseTo(0.000625, 6);
    expect(cost.cacheCost).toBe(0);
    expect(cost.totalCost).toBeCloseTo(0.000875, 6);
    expect(cost.currency).toBe('USD');
  });

  it('calculates cost for Claude Sonnet 4 correctly', () => {
    const usage: TokenUsage = {
      inputTokens: 10000,
      outputTokens: 2000,
    };

    const cost = calculateCost('claude-sonnet-4-20250514', usage);

    // Sonnet 4: $3/1M input, $15/1M output
    // Input: 10000 / 1M * 3 = 0.03
    // Output: 2000 / 1M * 15 = 0.03
    expect(cost.inputCost).toBeCloseTo(0.03, 6);
    expect(cost.outputCost).toBeCloseTo(0.03, 6);
    expect(cost.totalCost).toBeCloseTo(0.06, 6);
  });

  it('includes cache costs when provided', () => {
    const usage: TokenUsage = {
      inputTokens: 1000,
      outputTokens: 500,
      cacheReadTokens: 2000,
      cacheCreationTokens: 500,
    };

    const cost = calculateCost('claude-3-haiku-20240307', usage);

    // Haiku cache: $0.03/1M read, $0.30/1M write
    // Cache read: 2000 / 1M * 0.03 = 0.00006
    // Cache write: 500 / 1M * 0.30 = 0.00015
    expect(cost.cacheCost).toBeCloseTo(0.00021, 6);
    expect(cost.totalCost).toBeGreaterThan(cost.inputCost + cost.outputCost);
  });

  it('uses default pricing for unknown models', () => {
    const usage: TokenUsage = {
      inputTokens: 1000,
      outputTokens: 500,
    };

    const cost = calculateCost('unknown-model-xyz', usage);

    // Default: $5/1M input, $15/1M output
    expect(cost.inputCost).toBeCloseTo(0.005, 6);
    expect(cost.outputCost).toBeCloseTo(0.0075, 6);
  });
});

describe('formatCost', () => {
  it('formats normal costs correctly', () => {
    expect(formatCost(0.0123)).toBe('$0.0123');
    expect(formatCost(1.5678)).toBe('$1.5678');
  });

  it('formats very small costs as less than threshold', () => {
    expect(formatCost(0.00001)).toBe('<$0.0001');
    expect(formatCost(0.00009)).toBe('<$0.0001');
  });

  it('respects precision parameter', () => {
    expect(formatCost(0.123456, 2)).toBe('$0.12');
    expect(formatCost(0.123456, 6)).toBe('$0.123456');
  });
});

describe('formatTokens', () => {
  it('formats small numbers with commas', () => {
    expect(formatTokens(100)).toBe('100');
    expect(formatTokens(1234)).toBe('1,234');
    expect(formatTokens(9999)).toBe('9,999');
  });

  it('formats large numbers as K', () => {
    expect(formatTokens(10000)).toBe('10.0K');
    expect(formatTokens(15678)).toBe('15.7K');
    expect(formatTokens(999999)).toBe('1000.0K');
  });

  it('formats very large numbers as M', () => {
    expect(formatTokens(1000000)).toBe('1.0M');
    expect(formatTokens(2500000)).toBe('2.5M');
  });
});

describe('formatLatency', () => {
  it('formats milliseconds correctly', () => {
    expect(formatLatency(50)).toBe('50ms');
    expect(formatLatency(500)).toBe('500ms');
    expect(formatLatency(999)).toBe('999ms');
  });

  it('formats seconds correctly', () => {
    expect(formatLatency(1000)).toBe('1.0s');
    expect(formatLatency(1500)).toBe('1.5s');
    expect(formatLatency(10000)).toBe('10.0s');
  });
});

describe('createEmptySummary', () => {
  it('creates summary with all zeros', () => {
    const summary = createEmptySummary();

    expect(summary.inputTokens).toBe(0);
    expect(summary.outputTokens).toBe(0);
    expect(summary.cacheReadTokens).toBe(0);
    expect(summary.cacheCreationTokens).toBe(0);
    expect(summary.estimatedCost).toBe(0);
    expect(summary.callCount).toBe(0);
    expect(summary.avgLatencyMs).toBe(0);
  });
});

describe('addToSummary', () => {
  it('accumulates token counts correctly', () => {
    const summary = createEmptySummary();
    const usage: TokenUsage = { inputTokens: 100, outputTokens: 50 };
    const cost: CostBreakdown = {
      inputCost: 0.01,
      outputCost: 0.02,
      cacheCost: 0,
      totalCost: 0.03,
      currency: 'USD',
    };

    addToSummary(summary, usage, cost, 500);

    expect(summary.inputTokens).toBe(100);
    expect(summary.outputTokens).toBe(50);
    expect(summary.estimatedCost).toBeCloseTo(0.03, 6);
    expect(summary.callCount).toBe(1);
    expect(summary.avgLatencyMs).toBe(500);
  });

  it('calculates running average latency', () => {
    const summary = createEmptySummary();
    const usage: TokenUsage = { inputTokens: 100, outputTokens: 50 };
    const cost: CostBreakdown = {
      inputCost: 0.01,
      outputCost: 0.02,
      cacheCost: 0,
      totalCost: 0.03,
      currency: 'USD',
    };

    addToSummary(summary, usage, cost, 100);
    addToSummary(summary, usage, cost, 200);
    addToSummary(summary, usage, cost, 300);

    expect(summary.callCount).toBe(3);
    expect(summary.avgLatencyMs).toBe(200); // (100 + 200 + 300) / 3
  });
});

describe('generateCompactSummary', () => {
  it('generates a compact one-line summary', () => {
    const usage: TokenUsage = { inputTokens: 1000, outputTokens: 500 };
    const cost: CostBreakdown = {
      inputCost: 0.01,
      outputCost: 0.02,
      cacheCost: 0,
      totalCost: 0.03,
      currency: 'USD',
    };

    const summary = generateCompactSummary('claude-3-haiku-20240307', usage, cost);

    expect(summary).toContain('Claude 3 Haiku');
    expect(summary).toContain('1,500');
    expect(summary).toContain('$0.03');
  });
});
