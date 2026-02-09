/**
 * Kahuna Agents Module
 *
 * This module contains shared agent components used by MCP tools
 * that need agentic capabilities (tool-use loops with Claude).
 *
 * Currently provides:
 * - Knowledge base tools for agents to explore and read KB content
 *
 * Future additions may include:
 * - Common agent loop utilities
 * - Agent configuration helpers
 * - Additional tool sets for different agent capabilities
 */

export {
  knowledgeTools,
  listKnowledgeFilesTool,
  readKnowledgeFileTool,
  executeKnowledgeTool,
} from './knowledge-tools.js';
