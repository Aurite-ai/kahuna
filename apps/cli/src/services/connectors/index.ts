/**
 * Connector Registry - Maps integration types to their connectors
 */
import type { BaseConnector } from './base.connector.js';
import { GitHubConnector } from './github.connector.js';

const connectors: Record<string, BaseConnector> = {
  GITHUB: new GitHubConnector(),
  // Add more connectors here as they are implemented
  // SLACK: new SlackConnector(),
  // NOTION: new NotionConnector(),
  // etc.
};

/**
 * Get connector for a specific integration type
 */
export function getConnector(integrationType: string): BaseConnector | null {
  return connectors[integrationType] || null;
}

/**
 * Get all available integration types
 */
export function getAvailableIntegrationTypes(): string[] {
  return Object.keys(connectors);
}
