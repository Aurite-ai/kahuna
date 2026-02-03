/**
 * Connector Registry - Maps tool types to their connectors
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
 * Get connector for a specific tool type
 */
export function getConnector(toolType: string): BaseConnector | null {
  return connectors[toolType] || null;
}

/**
 * Get all available tool types
 */
export function getAvailableToolTypes(): string[] {
  return Object.keys(connectors);
}
