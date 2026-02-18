/**
 * Knowledge agents module
 *
 * Provides agent tools, prompts, and the shared agentic loop runner.
 */

// Prompts
export {
  CATEGORIZATION_PROMPT,
  RETRIEVAL_PROMPT,
  QA_PROMPT_TEMPLATE,
  buildCategorizationUserMessage,
  buildRetrievalUserMessage,
  buildQASystemPrompt,
} from './prompts.js';

// Agent tools
export {
  listKnowledgeFilesTool,
  readKnowledgeFileTool,
  selectFilesForContextTool,
  categorizeFileTool,
  selectFrameworkTool,
  retrievalTools,
  qaTools,
  categorizationTools,
  executeKnowledgeTool,
} from './knowledge-tools.js';

// Agent runner
export { runAgent, type AgentConfig, type AgentResult, type AgentUsageStats } from './run-agent.js';
