/**
 * Model Pricing Database
 *
 * Contains pricing information for all supported LLM models.
 * Prices are in USD per 1 million tokens.
 *
 * Note: Keep this updated as model pricing changes.
 * Reference: https://docs.anthropic.com/en/docs/about-claude/models
 * Last updated: 2026-02
 */

/**
 * Pricing structure for a model.
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
 * Model pricing database.
 * Maps model identifiers to their pricing information.
 *
 * Pricing reference: https://docs.anthropic.com/en/docs/about-claude/models
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // ============================================
  // Claude 4 Models (Latest - 2025/2026)
  // ============================================

  // Claude Opus 4 (most capable)
  'claude-opus-4-6': {
    displayName: 'Claude Opus 4',
    provider: 'anthropic',
    inputPer1M: 5.0,
    outputPer1M: 25.0,
    cacheReadPer1M: 0.5,
    cacheWritePer1M: 6.25,
  },

  // Claude Sonnet 4 (balanced performance)
  'claude-sonnet-4-6': {
    displayName: 'Claude Sonnet 4',
    provider: 'anthropic',
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cacheReadPer1M: 0.3,
    cacheWritePer1M: 3.75,
  },

  // Claude Haiku 4.5 (fast, economical)
  'claude-haiku-4-5-20251001': {
    displayName: 'Claude Haiku 4.5',
    provider: 'anthropic',
    inputPer1M: 1.0,
    outputPer1M: 5.0,
    cacheReadPer1M: 0.1,
    cacheWritePer1M: 1.25,
  },

  // Alias for claude-haiku-4-5
  'claude-haiku-4-5': {
    displayName: 'Claude Haiku 4.5',
    provider: 'anthropic',
    inputPer1M: 1.0,
    outputPer1M: 5.0,
    cacheReadPer1M: 0.1,
    cacheWritePer1M: 1.25,
  },

  // ============================================
  // Claude 3.5 Models (Legacy)
  // ============================================

  // Claude 3.5 Sonnet (legacy - still available)
  'claude-3-5-sonnet-20241022': {
    displayName: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cacheReadPer1M: 0.3,
    cacheWritePer1M: 3.75,
  },

  // Claude 3.5 Sonnet (older version)
  'claude-3-5-sonnet-20240620': {
    displayName: 'Claude 3.5 Sonnet (June)',
    provider: 'anthropic',
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cacheReadPer1M: 0.3,
    cacheWritePer1M: 3.75,
  },

  // Claude 3.5 Haiku
  'claude-3-5-haiku-20241022': {
    displayName: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    inputPer1M: 0.8,
    outputPer1M: 4.0,
    cacheReadPer1M: 0.08,
    cacheWritePer1M: 1.0,
  },

  // ============================================
  // Claude 3 Models (Legacy)
  // ============================================

  // Claude 3 Opus (legacy)
  'claude-3-opus-20240229': {
    displayName: 'Claude 3 Opus',
    provider: 'anthropic',
    inputPer1M: 15.0,
    outputPer1M: 75.0,
    cacheReadPer1M: 1.5,
    cacheWritePer1M: 18.75,
  },

  // Claude 3 Sonnet (legacy)
  'claude-3-sonnet-20240229': {
    displayName: 'Claude 3 Sonnet',
    provider: 'anthropic',
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cacheReadPer1M: 0.3,
    cacheWritePer1M: 3.75,
  },

  // Claude 3 Haiku (legacy)
  'claude-3-haiku-20240307': {
    displayName: 'Claude 3 Haiku',
    provider: 'anthropic',
    inputPer1M: 0.25,
    outputPer1M: 1.25,
    cacheReadPer1M: 0.03,
    cacheWritePer1M: 0.3,
  },

  // ============================================
  // Legacy Sonnet 4 (older naming)
  // ============================================

  // Claude Sonnet 4 (older dated version)
  'claude-sonnet-4-20250514': {
    displayName: 'Claude Sonnet 4',
    provider: 'anthropic',
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cacheReadPer1M: 0.3,
    cacheWritePer1M: 3.75,
  },
};

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
 * Get pricing for a model.
 * Returns default pricing if model is not found.
 *
 * @param model - Model identifier
 * @returns Pricing information for the model
 */
export function getModelPricing(model: string): ModelPricing {
  return MODEL_PRICING[model] ?? DEFAULT_PRICING;
}

/**
 * Check if a model is known in the pricing database.
 *
 * @param model - Model identifier
 * @returns True if model pricing is known
 */
export function isKnownModel(model: string): boolean {
  return model in MODEL_PRICING;
}

/**
 * Get all known model identifiers.
 *
 * @returns Array of model identifiers
 */
export function getKnownModels(): string[] {
  return Object.keys(MODEL_PRICING);
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
