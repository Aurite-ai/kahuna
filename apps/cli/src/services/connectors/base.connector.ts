/**
 * Base connector interface for all integration/data source connectors
 */

export interface ConnectionTestResult {
  success: boolean;
  message?: string;
  error?: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

export interface BaseConnector {
  /**
   * Test connection with provided configuration and credentials
   */
  testConnection(
    configuration: Record<string, unknown>,
    credentials?: Record<string, unknown>
  ): Promise<ConnectionTestResult>;
}
