/**
 * Integrations Module
 *
 * Discovers, stores, and manages integration descriptors for external tools,
 * APIs, databases, and services.
 *
 * Key concepts:
 * - IntegrationDescriptor: Complete description of an integration's capabilities
 * - Extraction: Discovering integrations from content (patterns + LLM)
 * - Storage: Persisting descriptors to ~/.kahuna/integrations/
 *
 * This module works alongside the vault module:
 * - Vault stores CREDENTIALS (secrets)
 * - Integrations stores CAPABILITIES (what the service can do)
 */

// Types
export type {
  AuthMethod,
  IntegrationAuth,
  IntegrationDescriptor,
  IntegrationExtractionResult,
  IntegrationLimits,
  IntegrationMention,
  IntegrationOperation,
  IntegrationSource,
  IntegrationSummary,
  IntegrationType,
  OperationParam,
  UsageExample,
  UseIntegrationRequest,
  UseIntegrationResult,
} from './types.js';

// Extraction
export {
  createCustomIntegration,
  extractIntegrationsFromPatterns,
  generateIntegrationId,
  INTEGRATION_EXTRACTION_PROMPT,
  mergeSecretsWithIntegrations,
} from './extraction.js';

// Storage
export {
  deleteIntegration,
  ensureIntegrationsDir,
  findIntegrationsBySource,
  findIntegrationsByType,
  generateIntegrationsSummaryMarkdown,
  getIntegrationsDir,
  integrationExists,
  listIntegrationIds,
  listIntegrations,
  listIntegrationSummaries,
  loadIntegration,
  mergeIntegration,
  saveIntegration,
  updateIntegrationStatus,
} from './storage.js';
