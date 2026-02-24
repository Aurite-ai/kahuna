/**
 * Shared agentic loop runner
 *
 * Handles the tool_use → execute → tool_result → continue cycle
 * for all agent-based tools (learn, prepare_context, ask).
 *
 * See: docs/internal/designs/context-management-system.md
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { Tool, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { UsageTracker } from '../../usage/index.js';
import { extractTokenUsage, recordProjectUsage } from '../../usage/index.js';
import type { KnowledgeStorageService } from '../storage/types.js';
import { executeKnowledgeTool } from './knowledge-tools.js';

/**
 * Configuration for an agent run.
 */
export interface AgentConfig {
  /** Anthropic model identifier (from config.ts) */
  model: string;
  /** System prompt for this agent */
  systemPrompt: string;
  /** Tools available to this agent */
  tools: Tool[];
  /** Maximum loop iterations (default: 10) */
  maxIterations?: number;
  /** Maximum tokens per response (default: 2000) */
  maxTokens?: number;
}

/**
 * Usage statistics for an agent run.
 */
export interface AgentUsageStats {
  /** Total input tokens across all LLM calls */
  totalInputTokens: number;
  /** Total output tokens across all LLM calls */
  totalOutputTokens: number;
  /** Total estimated cost in USD */
  totalCost: number;
  /** Number of LLM API calls made */
  llmCallCount: number;
  /** Total latency across all LLM calls in ms */
  totalLatencyMs: number;
}

/**
 * Result from an agent run.
 */
export interface AgentResult {
  /** Final text response from the agent */
  textResponse: string;
  /** Accumulated structured results from specific tool calls (select_files, categorize_file) */
  toolResults: Record<string, unknown>[];
  /** Usage statistics for this agent run */
  usage: AgentUsageStats;
}

/** Tool names whose results we capture as structured data */
const STRUCTURED_TOOL_NAMES = new Set([
  'select_files_for_context',
  'categorize_file',
  'select_framework',
  'report_contradictions',
]);

/**
 * Run an agentic loop with the given configuration.
 *
 * Handles:
 * - Message loop management
 * - Tool call routing via executeKnowledgeTool
 * - Iteration counting
 * - Stop condition detection (end_turn or no tool_use blocks)
 * - Structured result accumulation for select_files_for_context and categorize_file
 * - Usage tracking for cost calculation
 *
 * @param config - Agent configuration (model, prompt, tools, limits)
 * @param userMessage - The user's message to the agent
 * @param storage - Knowledge storage service for tool execution
 * @param anthropic - Shared Anthropic client instance
 * @param usageTracker - Optional usage tracker for cost tracking
 * @param toolName - Name of the tool calling this agent (for usage attribution)
 * @returns Agent result with text response, structured tool results, and usage stats
 */
export async function runAgent(
  config: AgentConfig,
  userMessage: string,
  storage: KnowledgeStorageService,
  anthropic: Anthropic,
  usageTracker?: UsageTracker,
  toolName = 'unknown'
): Promise<AgentResult> {
  const maxIterations = config.maxIterations ?? 10;
  const maxTokens = config.maxTokens ?? 2000;

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const structuredResults: Record<string, unknown>[] = [];

  // Track usage for this agent run
  const agentUsage: AgentUsageStats = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    llmCallCount: 0,
    totalLatencyMs: 0,
  };

  for (let i = 0; i < maxIterations; i++) {
    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: config.model,
      max_tokens: maxTokens,
      system: config.systemPrompt,
      tools: config.tools,
      messages,
    });

    const latencyMs = Date.now() - startTime;

    // Extract and track usage
    const tokenUsage = extractTokenUsage(response);
    agentUsage.totalInputTokens += tokenUsage.inputTokens;
    agentUsage.totalOutputTokens += tokenUsage.outputTokens;
    agentUsage.llmCallCount += 1;
    agentUsage.totalLatencyMs += latencyMs;

    // Record to usage tracker if provided
    if (usageTracker) {
      const call = usageTracker.record({
        model: config.model,
        toolName,
        usage: tokenUsage,
        latencyMs,
      });
      agentUsage.totalCost += call.cost.totalCost;

      // Also persist to project-level storage
      recordProjectUsage(toolName, tokenUsage, call.cost).catch((err) => {
        // Don't fail the agent run if project storage has issues
        console.error('[runAgent] Failed to persist project usage:', err);
      });
    }

    // Check if we're done (no more tool use)
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((block) => block.type === 'text');
      return {
        textResponse: textBlock?.type === 'text' ? textBlock.text : '',
        toolResults: structuredResults,
        usage: agentUsage,
      };
    }

    // Process tool uses
    const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');

    if (toolUseBlocks.length === 0) {
      // No tool use and not end_turn — extract any text and return
      const textBlock = response.content.find((block) => block.type === 'text');
      return {
        textResponse: textBlock?.type === 'text' ? textBlock.text : '',
        toolResults: structuredResults,
        usage: agentUsage,
      };
    }

    // Add assistant's response to messages
    messages.push({
      role: 'assistant',
      content: response.content,
    });

    // Execute tools and add results
    const toolResults: ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      if (block.type === 'tool_use') {
        const result = await executeKnowledgeTool(
          block.name,
          block.input as Record<string, unknown>,
          storage
        );

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });

        // Capture structured results from specific tools
        if (STRUCTURED_TOOL_NAMES.has(block.name)) {
          try {
            const parsed = JSON.parse(result);
            structuredResults.push({ tool: block.name, ...parsed });
          } catch {
            // Result wasn't valid JSON (e.g., validation error) — skip
          }
        }
      }
    }

    messages.push({
      role: 'user',
      content: toolResults,
    });
  }

  // Max iterations reached — return whatever text we can find from the last response
  return {
    textResponse: 'Agent reached maximum iterations without completing.',
    toolResults: structuredResults,
    usage: agentUsage,
  };
}
