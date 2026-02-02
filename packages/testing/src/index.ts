/**
 * @kahuna/testing - Testing infrastructure for Kahuna feedback loop
 *
 * This package provides:
 * - CLI tools for programmatic testing (test:init, test:create, test:submit)
 * - API client for test automation
 * - Type definitions for testing
 */

// Types
export * from './types.js';

// API Client
export { TestApiClient, createTestClient } from './client.js';

// Config utilities
export { loadConfig, saveConfig, getConfigPath } from './commands/init.js';
