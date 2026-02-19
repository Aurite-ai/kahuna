/**
 * Model Pricing
 *
 * Provides pricing information for cost calculations.
 * Uses the MODEL_REGISTRY from config.ts as the single source of truth.
 *
 * Pricing reference: https://platform.claude.com/docs/en/about-claude/pricing
 */

import { MODEL_REGISTRY, type ModelConfig, getModelConfig } from '../config.js';

/**
 * Pricing structure for a model (backward compatible interface).
 * All prices are per 1 million tokens.
 */
export interface ModelPricing {
  /** Display name for the model */
  displayName: string;
  /** Provider (e.g., "anthropic", "openai") */
  provider: string;
  /** Cost per 1M input tokens in USD */
  inputPer1M: number;
  /** Cost per 1M output tokens in USD */
  outputPer1M: number;
  /** Cost per 1M cache read tokens in USD (optional) */
  cacheReadPer1M?: number;
  /** Cost per 1M cache write/creation tokens in USD (optional) */
  cacheWritePer1M?: number;
}

/**
 * Default pricing for unknown models.
 * Uses conservative (higher) estimates based on mid-tier models.
 */
export const DEFAULT_PRICING: ModelPricing = {
  displayName: 'Unknown Model',
  provider: 'unknown',
  inputPer1M: 5.0,
  outputPer1M: 15.0,
  cacheReadPer1M: 0.5,
  cacheWritePer1M: 5.0,
};

/**
 * Convert ModelConfig from config.ts to ModelPricing interface.
 */
function toModelPricing(config: ModelConfig): ModelPricing {
  return {
    displayName: config.displayName,
    provider: config.provider,
    inputPer1M: config.pricing.inputPer1M,
    outputPer1M: config.pricing.outputPer1M,
    cacheReadPer1M: config.pricing.cacheReadPer1M,
    cacheWritePer1M: config.pricing.cacheWritePer1M,
  };
}

/**
 * Get pricing for a model.
 * Returns default pricing if model is not found.
 *
 * @param model - Model identifier
 * @returns Pricing information for the model
 */
export function getModelPricing(model: string): ModelPricing {
  const config = getModelConfig(model);
  if (config) {
    return toModelPricing(config);
  }
  return DEFAULT_PRICING;
}

/**
 * Check if a model is known in the pricing database.
 *
 * @param model - Model identifier
 * @returns True if model pricing is known
 */
export function isKnownModel(model: string): boolean {
  return model in MODEL_REGISTRY;
}

/**
 * Get all known model identifiers.
 *
 * @returns Array of model identifiers
 */
export function getKnownModels(): string[] {
  return Object.keys(MODEL_REGISTRY);
}

/**
 * Get a short display name for a model (for compact display).
 * Extracts the model family and version.
 *
 * @param model - Full model identifier
 * @returns Short display name
 */
export function getShortModelName(model: string): string {
  const pricing = getModelPricing(model);
  if (pricing.displayName !== 'Unknown Model') {
    return pricing.displayName;
  }

  // Try to extract a readable name from the identifier
  // e.g., "claude-3-haiku-20240307" -> "claude-3-haiku"
  const parts = model.split('-');
  if (parts.length > 2) {
    // Remove the date suffix if present (8 digits at end)
    const lastPart = parts[parts.length - 1];
    if (/^\d{8}$/.test(lastPart)) {
      return parts.slice(0, -1).join('-');
    }
  }

  return model;
}

/**
 * Re-export MODEL_REGISTRY for direct access if needed.
 * Prefer using getModelPricing() for most use cases.
 */
export { MODEL_REGISTRY };
