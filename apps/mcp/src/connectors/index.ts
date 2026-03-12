/**
 * Connectors Module
 *
 * Dynamic connector system for unlimited integrations.
 *
 * This module provides:
 * - ConnectorManifest: The schema for defining any integration
 * - JsonConnectorRegistry: File-based storage for connector definitions
 * - Research Agent: AI-powered discovery and generation of connectors
 *
 * Usage:
 * ```typescript
 * import { getConnectorRegistry, integrationToManifest } from './connectors';
 *
 * const registry = getConnectorRegistry();
 * const connectors = await registry.list();
 * ```
 */

// Types and schemas
export {
  AuthTypeSchema,
  CapabilitiesSchema,
  type ConnectorAuthType,
  type ConnectorCapabilities,
  type ConnectorInstallation,
  ConnectorManifestSchema,
  type ConnectorManifest,
  type ConnectorOperation,
  ConnectorOperationSchema,
  type ConnectorRegistry,
  ConnectionConfigSchema,
  type ConnectionConfig,
  CredentialSchema,
  type CredentialRequirement,
  HttpConfigSchema,
  type HttpConfig,
  integrationToManifest,
  manifestToIntegration,
  ConnectorMetadataSchema,
  type ConnectorMetadata,
  type OperationParam,
  OperationParamSchema,
  type RateLimitConfig,
  RateLimitSchema,
  type RegistryContext,
  RetryPolicySchema,
  type RetryPolicy,
} from './types.js';

// Registry
export {
  getConnectorRegistry,
  JsonConnectorRegistry,
  resetConnectorRegistry,
} from './registry/index.js';

// Agents
export {
  buildResearchUserMessage,
  buildUpdateUserMessage,
  BULK_MIGRATION_PROMPT,
  CONNECTOR_UPDATE_PROMPT,
  executeResearchTool,
  fetchApiDocsTool,
  generateManifestTool,
  INTEGRATION_RESEARCH_PROMPT,
  integrationResearchTools,
  listConnectorsTool,
  parseOpenApiTool,
  registerConnectorTool,
  type ResearchToolContext,
  searchIntegrationInfoTool,
  type WebSearchResult,
} from './agents/index.js';
