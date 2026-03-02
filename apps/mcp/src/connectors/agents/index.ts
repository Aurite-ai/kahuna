/**
 * Connector Agents Module
 *
 * Re-exports all agent-related functionality for integration research.
 */

export {
  buildResearchUserMessage,
  buildUpdateUserMessage,
  BULK_MIGRATION_PROMPT,
  CONNECTOR_UPDATE_PROMPT,
  INTEGRATION_RESEARCH_PROMPT,
} from './research-prompts.js';

export {
  executeResearchTool,
  fetchApiDocsTool,
  generateManifestTool,
  integrationResearchTools,
  listConnectorsTool,
  parseOpenApiTool,
  registerConnectorTool,
  type ResearchToolContext,
  searchIntegrationInfoTool,
  type WebSearchResult,
} from './research-tools.js';
