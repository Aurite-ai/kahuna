/**
 * GitHub Connector - Test GitHub API connectivity
 */
import type { BaseConnector, ConnectionTestResult } from './base.connector.js';

export class GitHubConnector implements BaseConnector {
  async testConnection(
    configuration: Record<string, unknown>,
    credentials?: Record<string, unknown>
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Extract configuration
      const baseUrl = (configuration.baseUrl as string) || 'https://api.github.com';
      const token = credentials?.token as string;

      if (!token) {
        return {
          success: false,
          error: 'GitHub token is required',
          message: 'Please provide a GitHub Personal Access Token',
        };
      }

      // Test connection by fetching user info
      const response = await fetch(`${baseUrl}/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Kahuna-CLI',
          Accept: 'application/vnd.github+json',
        },
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `GitHub API error: ${response.status} ${response.statusText}`,
          message: errorText || 'Failed to authenticate with GitHub',
          responseTime,
        };
      }

      const user = await response.json();

      return {
        success: true,
        message: `Connected successfully as ${user.login}`,
        responseTime,
        details: {
          username: user.login,
          name: user.name,
          id: user.id,
          type: user.type,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to connect to GitHub',
        responseTime,
      };
    }
  }
}
