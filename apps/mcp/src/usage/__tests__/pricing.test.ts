/**
 * Tests for the pricing module
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRICING,
  MODEL_REGISTRY,
  getKnownModels,
  getModelPricing,
  getShortModelName,
  isKnownModel,
} from '../pricing.js';

describe('getModelPricing()', () => {
  it('returns pricing for known Claude 3 Haiku model', () => {
    const pricing = getModelPricing('claude-3-haiku-20240307');

    expect(pricing.displayName).toBe('Claude 3 Haiku');
    expect(pricing.provider).toBe('anthropic');
    expect(pricing.inputPer1M).toBe(0.25);
    expect(pricing.outputPer1M).toBe(1.25);
    expect(pricing.cacheReadPer1M).toBe(0.03);
    expect(pricing.cacheWritePer1M).toBe(0.3);
  });

  it('returns pricing for known Claude Sonnet 4 model', () => {
    const pricing = getModelPricing('claude-sonnet-4-20250514');

    expect(pricing.displayName).toBe('Claude Sonnet 4');
    expect(pricing.provider).toBe('anthropic');
    expect(pricing.inputPer1M).toBe(3);
    expect(pricing.outputPer1M).toBe(15);
  });

  it('returns default pricing for unknown models', () => {
    const pricing = getModelPricing('unknown-model-xyz');

    expect(pricing).toEqual(DEFAULT_PRICING);
    expect(pricing.displayName).toBe('Unknown Model');
    expect(pricing.provider).toBe('unknown');
    expect(pricing.inputPer1M).toBe(5.0);
    expect(pricing.outputPer1M).toBe(15.0);
  });

  it('returns default pricing for empty string model', () => {
    const pricing = getModelPricing('');

    expect(pricing).toEqual(DEFAULT_PRICING);
  });
});

describe('isKnownModel()', () => {
  it('returns true for known models', () => {
    expect(isKnownModel('claude-3-haiku-20240307')).toBe(true);
    expect(isKnownModel('claude-sonnet-4-20250514')).toBe(true);
  });

  it('returns false for unknown models', () => {
    expect(isKnownModel('unknown-model')).toBe(false);
    expect(isKnownModel('')).toBe(false);
    expect(isKnownModel('gpt-4')).toBe(false);
  });
});

describe('getKnownModels()', () => {
  it('returns array of model identifiers', () => {
    const models = getKnownModels();

    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
  });

  it('includes Claude 3 Haiku', () => {
    const models = getKnownModels();

    expect(models).toContain('claude-3-haiku-20240307');
  });

  it('includes Claude Sonnet 4', () => {
    const models = getKnownModels();

    expect(models).toContain('claude-sonnet-4-20250514');
  });

  it('returns same keys as MODEL_REGISTRY', () => {
    const models = getKnownModels();
    const registryKeys = Object.keys(MODEL_REGISTRY);

    expect(models).toEqual(registryKeys);
  });
});

describe('getShortModelName()', () => {
  it('returns display name for known models', () => {
    expect(getShortModelName('claude-3-haiku-20240307')).toBe('Claude 3 Haiku');
    expect(getShortModelName('claude-sonnet-4-20250514')).toBe('Claude Sonnet 4');
  });

  it('strips date suffix from unknown models', () => {
    // Model with 8-digit date suffix
    expect(getShortModelName('some-model-20240101')).toBe('some-model');
  });

  it('returns full name if no date suffix', () => {
    expect(getShortModelName('some-model')).toBe('some-model');
    expect(getShortModelName('model-v2')).toBe('model-v2');
  });

  it('returns full name if suffix is not 8 digits', () => {
    expect(getShortModelName('some-model-123')).toBe('some-model-123');
    expect(getShortModelName('some-model-abc')).toBe('some-model-abc');
  });
});

describe('DEFAULT_PRICING', () => {
  it('has conservative pricing values', () => {
    expect(DEFAULT_PRICING.inputPer1M).toBe(5.0);
    expect(DEFAULT_PRICING.outputPer1M).toBe(15.0);
    expect(DEFAULT_PRICING.cacheReadPer1M).toBe(0.5);
    expect(DEFAULT_PRICING.cacheWritePer1M).toBe(5.0);
  });

  it('has unknown provider/displayName', () => {
    expect(DEFAULT_PRICING.displayName).toBe('Unknown Model');
    expect(DEFAULT_PRICING.provider).toBe('unknown');
  });
});

describe('MODEL_REGISTRY', () => {
  it('exports MODEL_REGISTRY for direct access', () => {
    expect(MODEL_REGISTRY).toBeDefined();
    expect(typeof MODEL_REGISTRY).toBe('object');
  });

  it('contains model configurations with required fields', () => {
    for (const [modelId, config] of Object.entries(MODEL_REGISTRY)) {
      expect(config.displayName).toBeDefined();
      expect(config.provider).toBeDefined();
      expect(config.pricing).toBeDefined();
      expect(config.pricing.inputPer1M).toBeGreaterThanOrEqual(0);
      expect(config.pricing.outputPer1M).toBeGreaterThanOrEqual(0);
    }
  });
});
