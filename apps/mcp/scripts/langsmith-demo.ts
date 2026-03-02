#!/usr/bin/env npx tsx
/**
 * LangSmith-Style Observability Demo
 *
 * Demonstrates enterprise-grade tracing, debugging, monitoring, and evaluation
 * capabilities that can be added to Kahuna.
 *
 * Run: npx tsx apps/mcp/scripts/langsmith-demo.ts
 */

// =============================================================================
// TYPES
// =============================================================================

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
}

interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result: string;
}

interface TraceIteration {
  index: number;
  prompt: string;
  response: string;
  toolCalls: ToolCall[];
  latencyMs: number;
  usage: TokenUsage;
  cost: CostBreakdown;
}

interface AgentTrace {
  traceId: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalCost: number;
  model: string;
  toolName: string;
  status: 'success' | 'error' | 'timeout';
  iterations: TraceIteration[];
  finalResponse: string;
}

interface DetectedIssue {
  type:
    | 'infinite_loop'
    | 'hallucinated_tool'
    | 'context_overflow'
    | 'prompt_injection'
    | 'silent_abandonment';
  severity: 'warning' | 'error' | 'critical';
  description: string;
  evidence: Record<string, unknown>;
  suggestedFix: string[];
}

interface MonitoringMetrics {
  timeRange: string;
  totalRequests: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  totalCost: number;
  costPerHour: number;
  byModel: Record<string, { cost: number; percentage: number }>;
  byTool: Record<string, { cost: number; percentage: number }>;
  alerts: Array<{ level: string; message: string; time: string }>;
}

interface EvaluationResult {
  datasetName: string;
  totalExamples: number;
  passRate: number;
  avgScore: number;
  results: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    score: number;
    passed: boolean;
    reasoning: string;
  }>;
}

// =============================================================================
// COLORS & FORMATTING
// =============================================================================

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

const c = colors;

function printHeader(): void {
  console.log(`
${c.bgBlue}${c.white}${c.bold}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}
${c.bgBlue}${c.white}${c.bold}║                    🔎 LANGSMITH-STYLE OBSERVABILITY DEMO                     ║${c.reset}
${c.bgBlue}${c.white}${c.bold}║                         Kahuna AI Agent Monitoring                           ║${c.reset}
${c.bgBlue}${c.white}${c.bold}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}

${c.dim}This demo showcases enterprise-grade observability features that can be added to Kahuna:${c.reset}
${c.dim}• Full hierarchical tracing of agent execution${c.reset}
${c.dim}• Automatic issue detection (loops, hallucinations, overflow)${c.reset}
${c.dim}• Production monitoring dashboards${c.reset}
${c.dim}• Evaluation and testing frameworks${c.reset}
`);
}

function printSectionHeader(title: string): void {
  const line = '━'.repeat(80);
  console.log(`\n${c.cyan}${line}${c.reset}`);
  console.log(`${c.bold}${c.cyan}${title}${c.reset}`);
  console.log(`${c.cyan}${line}${c.reset}\n`);
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

function formatCost(cost: number): string {
  if (cost < 0.0001) return '<$0.0001';
  return `$${cost.toFixed(4)}`;
}

function formatLatency(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function progressBar(value: number, max: number, width = 24): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

function printSuccessfulTrace(trace: AgentTrace): void {
  const statusIcon = trace.status === 'success' ? `${c.green}✅` : `${c.red}❌`;

  console.log(`${c.bold}📍 Trace ID:${c.reset} ${c.cyan}${trace.traceId}${c.reset}`);
  console.log(`${c.bold}📅 Started:${c.reset} ${trace.startTime}`);
  console.log(`${c.bold}⏱️  Duration:${c.reset} ${formatLatency(trace.totalDuration)}`);
  console.log(
    `${c.bold}💰 Total Cost:${c.reset} ${c.yellow}${formatCost(trace.totalCost)}${c.reset}`
  );
  console.log(`${c.bold}🤖 Model:${c.reset} ${trace.model}`);
  console.log(`${c.bold}🔧 Tool:${c.reset} ${trace.toolName}`);
  console.log(
    `${c.bold}📊 Status:${c.reset} ${statusIcon} ${trace.status.toUpperCase()}${c.reset}`
  );

  console.log(
    `\n${c.bold}┌─ Agent Execution Tree ────────────────────────────────────────────────────┐${c.reset}`
  );

  for (const iter of trace.iterations) {
    const totalTokens = iter.usage.inputTokens + iter.usage.outputTokens;
    console.log(`${c.bold}│${c.reset}`);
    console.log(
      `${c.bold}│  ┌─ Iteration ${iter.index + 1} ──────────────────────────────────────────────────────┐${c.reset}`
    );
    console.log(`${c.bold}│  │${c.reset}  🤖 ${c.cyan}LLM Call:${c.reset} ${trace.model}`);
    console.log(
      `${c.bold}│  │${c.reset}  📥 Input: ${c.blue}${formatTokens(iter.usage.inputTokens)}${c.reset} tokens | 📤 Output: ${c.blue}${formatTokens(iter.usage.outputTokens)}${c.reset} tokens | 💰 ${c.yellow}${formatCost(iter.cost.totalCost)}${c.reset}`
    );
    console.log(`${c.bold}│  │${c.reset}  ⏱️  Latency: ${formatLatency(iter.latencyMs)}`);
    console.log(`${c.bold}│  │${c.reset}`);
    console.log(
      `${c.bold}│  │${c.reset}  ${c.dim}📝 Prompt: "${iter.prompt.substring(0, 60)}..."${c.reset}`
    );

    if (iter.toolCalls.length > 0) {
      for (const tool of iter.toolCalls) {
        console.log(`${c.bold}│  │${c.reset}  🔧 ${c.magenta}Tool Called:${c.reset} ${tool.name}`);
        console.log(
          `${c.bold}│  │${c.reset}  📤 ${c.dim}Tool Result: ${tool.result.substring(0, 50)}...${c.reset}`
        );
      }
    }
    console.log(
      `${c.bold}│  └────────────────────────────────────────────────────────────────────────┘${c.reset}`
    );
  }

  console.log(`${c.bold}│${c.reset}`);
  console.log(
    `${c.bold}│  ${c.green}✅ Final Response:${c.reset} "${trace.finalResponse.substring(0, 65)}..."`
  );
  console.log(`${c.bold}│${c.reset}`);
  console.log(
    `${c.bold}└─────────────────────────────────────────────────────────────────────────────┘${c.reset}`
  );
}

function printIssueDetection(issue: DetectedIssue, trace: AgentTrace): void {
  const severityColors: Record<string, string> = {
    warning: c.yellow,
    error: c.red,
    critical: `${c.bgRed}${c.white}`,
  };
  const severityIcons: Record<string, string> = {
    warning: '⚠️ ',
    error: '🔴',
    critical: '🚨',
  };

  const color = severityColors[issue.severity] || c.red;
  const icon = severityIcons[issue.severity] || '❌';

  console.log(`${c.bold}📍 Trace ID:${c.reset} ${c.cyan}${trace.traceId}${c.reset}`);
  console.log(
    `${color}${icon} ISSUE DETECTED: ${issue.type.toUpperCase().replace(/_/g, ' ')}${c.reset}`
  );

  console.log(
    `\n${c.bold}┌─ Detection Details ─────────────────────────────────────────────────────────┐${c.reset}`
  );
  console.log(`${c.bold}│${c.reset}`);
  console.log(
    `${c.bold}│${c.reset}  ${color}🔴 SEVERITY: ${issue.severity.toUpperCase()}${c.reset}`
  );
  console.log(`${c.bold}│${c.reset}`);
  console.log(`${c.bold}│${c.reset}  ${c.bold}📊 Evidence:${c.reset}`);

  for (const [key, value] of Object.entries(issue.evidence)) {
    console.log(`${c.bold}│${c.reset}     • ${key}: ${c.yellow}${value}${c.reset}`);
  }

  console.log(`${c.bold}│${c.reset}`);
  console.log(`${c.bold}│${c.reset}  ${c.bold}🔍 Root Cause:${c.reset}`);
  console.log(`${c.bold}│${c.reset}     ${c.dim}${issue.description}${c.reset}`);
  console.log(`${c.bold}│${c.reset}`);
  console.log(`${c.bold}│${c.reset}  ${c.bold}💡 Suggested Fixes:${c.reset}`);

  issue.suggestedFix.forEach((fix, i) => {
    console.log(`${c.bold}│${c.reset}     ${i + 1}. ${c.green}${fix}${c.reset}`);
  });

  console.log(`${c.bold}│${c.reset}`);
  console.log(
    `${c.bold}└──────────────────────────────────────────────────────────────────────────────┘${c.reset}`
  );
}

function printMonitoringDashboard(metrics: MonitoringMetrics): void {
  console.log(
    `${c.bold}┌─ Real-Time Metrics (${metrics.timeRange}) ──────────────────────────────────────────────┐${c.reset}`
  );
  console.log(`${c.bold}│${c.reset}`);
  console.log(
    `${c.bold}│${c.reset}  📈 ${c.bold}Requests:${c.reset}     ${c.cyan}${metrics.totalRequests.toLocaleString()}${c.reset} total  |  ${Math.round(metrics.totalRequests / 24)}/hour avg`
  );
  console.log(
    `${c.bold}│${c.reset}  ⏱️  ${c.bold}Latency:${c.reset}      ${formatLatency(metrics.avgLatencyMs)} avg  |  p95: ${formatLatency(metrics.p95LatencyMs)}  |  p99: ${formatLatency(metrics.p99LatencyMs)}`
  );
  console.log(
    `${c.bold}│${c.reset}  ❌ ${c.bold}Error Rate:${c.reset}   ${metrics.errorRate < 2 ? c.green : c.red}${metrics.errorRate.toFixed(1)}%${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset}  💰 ${c.bold}Cost:${c.reset}         ${c.yellow}${formatCost(metrics.totalCost)}${c.reset}  |  ${formatCost(metrics.costPerHour)}/hour`
  );
  console.log(`${c.bold}│${c.reset}`);
  console.log(
    `${c.bold}├─ Cost by Model ─────────────────────────────────────────────────────────────┤${c.reset}`
  );
  console.log(`${c.bold}│${c.reset}`);

  const maxCost = Math.max(...Object.values(metrics.byModel).map((m) => m.cost));
  for (const [model, data] of Object.entries(metrics.byModel)) {
    const bar = progressBar(data.cost, maxCost, 20);
    const modelName = model.padEnd(22);
    console.log(
      `${c.bold}│${c.reset}  ${modelName} ${c.blue}${bar}${c.reset}  ${c.yellow}${formatCost(data.cost)}${c.reset} (${data.percentage}%)`
    );
  }

  console.log(`${c.bold}│${c.reset}`);
  console.log(
    `${c.bold}├─ Cost by Tool ──────────────────────────────────────────────────────────────┤${c.reset}`
  );
  console.log(`${c.bold}│${c.reset}`);

  const maxToolCost = Math.max(...Object.values(metrics.byTool).map((t) => t.cost));
  for (const [tool, data] of Object.entries(metrics.byTool)) {
    const bar = progressBar(data.cost, maxToolCost, 20);
    const toolName = tool.padEnd(22);
    console.log(
      `${c.bold}│${c.reset}  ${toolName} ${c.magenta}${bar}${c.reset}  ${c.yellow}${formatCost(data.cost)}${c.reset} (${data.percentage}%)`
    );
  }

  console.log(`${c.bold}│${c.reset}`);
  console.log(
    `${c.bold}├─ Active Alerts ─────────────────────────────────────────────────────────────┤${c.reset}`
  );
  console.log(`${c.bold}│${c.reset}`);

  for (const alert of metrics.alerts) {
    const alertColor = alert.level === 'CRIT' ? c.red : c.yellow;
    const alertIcon = alert.level === 'CRIT' ? '🔴' : '⚠️ ';
    console.log(
      `${c.bold}│${c.reset}  ${alertIcon} ${alertColor}[${alert.level}]${c.reset} ${alert.message} at ${alert.time}`
    );
  }

  console.log(`${c.bold}│${c.reset}`);
  console.log(
    `${c.bold}└──────────────────────────────────────────────────────────────────────────────┘${c.reset}`
  );
}

function printEvaluationResults(evaluation: EvaluationResult): void {
  const passColor =
    evaluation.passRate >= 80 ? c.green : evaluation.passRate >= 50 ? c.yellow : c.red;

  console.log(`${c.bold}📋 Dataset:${c.reset} ${c.cyan}${evaluation.datasetName}${c.reset}`);
  console.log(`${c.bold}📊 Total Examples:${c.reset} ${evaluation.totalExamples}`);
  console.log(
    `${c.bold}✅ Pass Rate:${c.reset} ${passColor}${evaluation.passRate.toFixed(1)}%${c.reset}`
  );
  console.log(
    `${c.bold}⭐ Average Score:${c.reset} ${c.yellow}${evaluation.avgScore.toFixed(2)}/1.0${c.reset}`
  );

  console.log(
    `\n${c.bold}┌─ Evaluation Results ────────────────────────────────────────────────────────┐${c.reset}`
  );

  for (const result of evaluation.results) {
    const statusIcon = result.passed ? `${c.green}✅` : `${c.red}❌`;
    const scoreColor = result.score >= 0.8 ? c.green : result.score >= 0.5 ? c.yellow : c.red;

    console.log(`${c.bold}│${c.reset}`);
    console.log(
      `${c.bold}│${c.reset}  ${statusIcon} ${c.bold}Score: ${scoreColor}${result.score.toFixed(2)}${c.reset}`
    );
    console.log(
      `${c.bold}│${c.reset}  📝 ${c.dim}Input: "${result.input.substring(0, 50)}..."${c.reset}`
    );
    console.log(
      `${c.bold}│${c.reset}  🎯 ${c.dim}Expected: "${result.expectedOutput.substring(0, 40)}..."${c.reset}`
    );
    console.log(
      `${c.bold}│${c.reset}  📤 ${c.dim}Actual: "${result.actualOutput.substring(0, 40)}..."${c.reset}`
    );
    console.log(`${c.bold}│${c.reset}  💭 ${c.dim}Reasoning: ${result.reasoning}${c.reset}`);
  }

  console.log(`${c.bold}│${c.reset}`);
  console.log(
    `${c.bold}└──────────────────────────────────────────────────────────────────────────────┘${c.reset}`
  );
}

function printTraceComparison(success: AgentTrace, failure: AgentTrace): void {
  console.log(`${c.bold}🔍 Trace Comparison: Success vs Failure${c.reset}\n`);

  console.log(
    `${c.bold}┌─────────────────────────────────┬─────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset} ${c.green}✅ SUCCESS${c.reset}                      ${c.bold}│${c.reset} ${c.red}❌ FAILURE${c.reset}                      ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}├─────────────────────────────────┼─────────────────────────────────┤${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset} Trace: ${c.cyan}${success.traceId.substring(0, 12)}...${c.reset}       ${c.bold}│${c.reset} Trace: ${c.cyan}${failure.traceId.substring(0, 12)}...${c.reset}       ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset} Duration: ${formatLatency(success.totalDuration).padEnd(16)}  ${c.bold}│${c.reset} Duration: ${formatLatency(failure.totalDuration).padEnd(16)}  ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset} Cost: ${formatCost(success.totalCost).padEnd(20)}  ${c.bold}│${c.reset} Cost: ${formatCost(failure.totalCost).padEnd(20)}  ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset} Iterations: ${String(success.iterations.length).padEnd(15)}  ${c.bold}│${c.reset} Iterations: ${String(failure.iterations.length).padEnd(15)}  ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}├─────────────────────────────────┴─────────────────────────────────┤${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset}  ${c.bold}🎯 Key Difference Identified:${c.reset}                                    ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset}                                                                   ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset}  ${c.yellow}At iteration ${failure.iterations.length}, the failed trace:${c.reset}                          ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset}  • Called tool '${c.red}search_files${c.reset}' instead of '${c.green}categorize_file${c.reset}'         ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset}  • Received ambiguous context that led to wrong decision           ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset}  • Missing key phrase in system prompt about stopping criteria     ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset}                                                                   ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset}  ${c.bold}💡 Recommendation:${c.reset}                                                ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}│${c.reset}  Add explicit instruction: "If results are ambiguous, ask user"   ${c.bold}│${c.reset}`
  );
  console.log(
    `${c.bold}└───────────────────────────────────────────────────────────────────┘${c.reset}`
  );
}

// =============================================================================
// DUMMY DATA
// =============================================================================

const successfulTrace: AgentTrace = {
  traceId: 'trc_abc123def456',
  startTime: '2026-03-02T13:45:00Z',
  endTime: '2026-03-02T13:45:04Z',
  totalDuration: 4200,
  totalCost: 0.0234,
  model: 'claude-sonnet-4-20250514',
  toolName: 'kahuna_prepare_context',
  status: 'success',
  iterations: [
    {
      index: 0,
      prompt:
        'Analyze this codebase and find relevant security documentation for implementing OAuth2 authentication...',
      response: 'I will search the knowledge base for security-related documents.',
      toolCalls: [
        {
          name: 'search_knowledge_base',
          input: { query: 'OAuth2 authentication security' },
          result:
            'Found 3 relevant documents: auth-patterns.md, security-best-practices.md, oauth-implementation.md',
        },
      ],
      latencyMs: 1200,
      usage: { inputTokens: 1234, outputTokens: 456 },
      cost: { inputCost: 0.0037, outputCost: 0.0052, totalCost: 0.0089 },
    },
    {
      index: 1,
      prompt:
        'Based on the search results, categorize and prepare the context for the user task...',
      response: 'I will categorize the found documents and prepare a context guide.',
      toolCalls: [
        {
          name: 'categorize_file',
          input: { files: ['auth-patterns.md'] },
          result: 'Categorized as security/authentication with high relevance score 0.92',
        },
      ],
      latencyMs: 2800,
      usage: { inputTokens: 2456, outputTokens: 892 },
      cost: { inputCost: 0.0074, outputCost: 0.0071, totalCost: 0.0145 },
    },
  ],
  finalResponse:
    'Based on my analysis, I found 2 highly relevant documents for OAuth2 implementation. The context guide has been prepared at .kahuna/context-guide.md with security patterns, authentication flows, and best practices for your use case.',
};

const failedTrace: AgentTrace = {
  traceId: 'trc_xyz789fail01',
  startTime: '2026-03-02T14:10:00Z',
  endTime: '2026-03-02T14:10:45Z',
  totalDuration: 45000,
  totalCost: 0.1823,
  model: 'claude-sonnet-4-20250514',
  toolName: 'kahuna_prepare_context',
  status: 'error',
  iterations: [
    {
      index: 0,
      prompt: 'Find documentation about database migration patterns...',
      response: 'Searching for database migration documentation.',
      toolCalls: [
        {
          name: 'search_files',
          input: { query: 'database migration' },
          result: 'Found 0 exact matches, 15 partial matches with varying relevance',
        },
      ],
      latencyMs: 1500,
      usage: { inputTokens: 1100, outputTokens: 320 },
      cost: { inputCost: 0.0033, outputCost: 0.0026, totalCost: 0.0059 },
    },
    {
      index: 1,
      prompt: 'Results were ambiguous, trying alternative search...',
      response: 'Expanding search to include schema and ORM patterns.',
      toolCalls: [
        {
          name: 'search_files',
          input: { query: 'schema ORM migration patterns' },
          result: 'Found 8 partial matches, relevance unclear',
        },
      ],
      latencyMs: 1800,
      usage: { inputTokens: 2200, outputTokens: 450 },
      cost: { inputCost: 0.0066, outputCost: 0.0036, totalCost: 0.0102 },
    },
  ],
  finalResponse:
    'I was unable to find definitive documentation. The search returned ambiguous results.',
};

const infiniteLoopIssue: DetectedIssue = {
  type: 'infinite_loop',
  severity: 'critical',
  description:
    'Agent received ambiguous search results and kept retrying with slightly modified queries without a termination condition.',
  evidence: {
    'Tool called': 'search_files',
    'Consecutive calls': 12,
    'Token growth': '2K → 8K → 24K → 67K',
    'Same query pattern': 'repeated 12 times',
  },
  suggestedFix: [
    'Add max retry limit for same tool (recommend: 3)',
    'Implement query deduplication',
    'Add explicit "give up" instruction in system prompt',
  ],
};

const hallucinatedToolIssue: DetectedIssue = {
  type: 'hallucinated_tool',
  severity: 'error',
  description: 'Agent attempted to call a tool that does not exist in the available tool set.',
  evidence: {
    'Tool requested': 'execute_sql_query',
    'Available tools': 'search_knowledge_base, categorize_file, select_files',
    'Error type': 'ToolNotFoundError',
  },
  suggestedFix: [
    'Improve tool descriptions in system prompt',
    'Add tool-call validation layer before execution',
    'Include explicit list of available tools in context',
  ],
};

const contextOverflowIssue: DetectedIssue = {
  type: 'context_overflow',
  severity: 'warning',
  description:
    'Prompt token count approaching model limit. Agent may start ignoring earlier instructions.',
  evidence: {
    'Current tokens': '127,450',
    'Model limit': '128,000',
    Utilization: '99.6%',
    'Instructions at risk': 'System prompt sections 1-3',
  },
  suggestedFix: [
    'Implement context compression at 80% threshold',
    'Summarize conversation history before continuing',
    'Split task into smaller sub-tasks',
  ],
};

const loopTrace: AgentTrace = {
  traceId: 'trc_loop123abc',
  startTime: '2026-03-02T15:00:00Z',
  endTime: '2026-03-02T15:02:30Z',
  totalDuration: 150000,
  totalCost: 0.4521,
  model: 'claude-sonnet-4-20250514',
  toolName: 'kahuna_ask',
  status: 'timeout',
  iterations: [],
  finalResponse: 'Agent terminated due to max iterations reached.',
};

const monitoringMetrics: MonitoringMetrics = {
  timeRange: 'Last 24h',
  totalRequests: 1247,
  avgLatencyMs: 2300,
  p95LatencyMs: 4800,
  p99LatencyMs: 8200,
  errorRate: 1.2,
  totalCost: 47.23,
  costPerHour: 1.97,
  byModel: {
    'claude-sonnet-4-20250514': { cost: 31.45, percentage: 67 },
    'claude-3-haiku': { cost: 12.34, percentage: 26 },
    'claude-3-opus': { cost: 3.44, percentage: 7 },
  },
  byTool: {
    kahuna_prepare_context: { cost: 28.12, percentage: 60 },
    kahuna_ask: { cost: 14.56, percentage: 31 },
    kahuna_learn: { cost: 4.55, percentage: 9 },
  },
  alerts: [
    { level: 'WARN', message: 'Latency spike detected (p95 > 5s threshold)', time: '2:30 PM' },
    { level: 'CRIT', message: "Error rate exceeded 5% for 'verify_integration'", time: '3:15 PM' },
  ],
};

const evaluationResults: EvaluationResult = {
  datasetName: 'production-regression-v2.3',
  totalExamples: 50,
  passRate: 86.0,
  avgScore: 0.82,
  results: [
    {
      input:
        'Find authentication patterns for implementing SSO with SAML 2.0 in a Node.js application',
      expectedOutput: 'Retrieved auth-patterns.md with SAML section highlighted',
      actualOutput: 'Retrieved auth-patterns.md with SAML 2.0 implementation guide',
      score: 0.95,
      passed: true,
      reasoning: 'Exact match on document retrieval with correct section identification',
    },
    {
      input: 'What are the best practices for database connection pooling in PostgreSQL?',
      expectedOutput: 'Retrieved database-patterns.md with connection pooling section',
      actualOutput: 'Retrieved general-backend.md with partial database info',
      score: 0.45,
      passed: false,
      reasoning: 'Retrieved related but incorrect document; missed specific pooling guidance',
    },
    {
      input: 'Explain the circuit breaker pattern for microservice resilience',
      expectedOutput: 'Retrieved resilience-patterns.md with circuit breaker explanation',
      actualOutput: 'Retrieved resilience-patterns.md with circuit breaker details and examples',
      score: 0.92,
      passed: true,
      reasoning: 'Accurate retrieval with bonus example code included',
    },
  ],
};

// =============================================================================
// MAIN
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  printHeader();

  // Scenario 1: Successful Agent Trace
  printSectionHeader('SCENARIO 1: ✅ Successful Agent Execution Trace');
  printSuccessfulTrace(successfulTrace);
  await sleep(500);

  // Scenario 2: Issue Detection - Infinite Loop
  printSectionHeader('SCENARIO 2: 🚨 Issue Detected - INFINITE LOOP');
  printIssueDetection(infiniteLoopIssue, loopTrace);
  await sleep(500);

  // Scenario 3: Issue Detection - Hallucinated Tool
  printSectionHeader('SCENARIO 3: 🔴 Issue Detected - HALLUCINATED TOOL');
  printIssueDetection(hallucinatedToolIssue, failedTrace);
  await sleep(500);

  // Scenario 4: Issue Detection - Context Overflow
  printSectionHeader('SCENARIO 4: ⚠️ Issue Detected - CONTEXT OVERFLOW');
  printIssueDetection(contextOverflowIssue, successfulTrace);
  await sleep(500);

  // Scenario 5: Production Monitoring Dashboard
  printSectionHeader('SCENARIO 5: 📊 Production Monitoring Dashboard');
  printMonitoringDashboard(monitoringMetrics);
  await sleep(500);

  // Scenario 6: Evaluation Results
  printSectionHeader('SCENARIO 6: ✅ Evaluation & Testing Results');
  printEvaluationResults(evaluationResults);
  await sleep(500);

  // Scenario 7: Trace Comparison (Debugging)
  printSectionHeader('SCENARIO 7: 🔍 Debugging - Trace Comparison');
  printTraceComparison(successfulTrace, failedTrace);

  // Summary
  console.log(`
${c.bgGreen}${c.white}${c.bold}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}
${c.bgGreen}${c.white}${c.bold}║                           📊 DEMO SUMMARY                                    ║${c.reset}
${c.bgGreen}${c.white}${c.bold}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}

${c.bold}Features Demonstrated:${c.reset}
  ✅ Full hierarchical tracing with token counts, costs, and latency
  ✅ Automatic issue detection (infinite loops, hallucinated tools, context overflow)
  ✅ Production monitoring dashboard with real-time metrics
  ✅ Evaluation framework with pass/fail rates and reasoning
  ✅ Side-by-side trace comparison for debugging

${c.bold}Enterprise Value:${c.reset}
  💰 Cost visibility and optimization ($47.23/day shown)
  🚨 Proactive issue detection before user impact
  📈 Performance monitoring with alerting
  ✅ Regression testing for prompt changes
  🔍 Root cause analysis for failed agent runs

${c.dim}These capabilities can be integrated into Kahuna's existing UsageTracker and
agent system (run-agent.ts) to provide LangSmith-level observability.${c.reset}
`);
}

main().catch(console.error);
