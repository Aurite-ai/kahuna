/**
 * Knowledge agents module
 *
 * Provides agent tools, prompts, and the shared agentic loop runner.
 */

// Prompts
export {
  CATEGORIZATION_PROMPT,
  CONTRADICTION_CHECK_PROMPT,
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
  reportContradictionsTool,
  selectFrameworkTool,
  retrievalTools,
  qaTools,
  categorizationTools,
  contradictionCheckTools,
  executeKnowledgeTool,
} from './knowledge-tools.js';

// Agent runner
export { runAgent, type AgentConfig, type AgentResult, type AgentUsageStats } from './run-agent.js';
