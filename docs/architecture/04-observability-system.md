# Kahuna Observability System

> Architecture documentation for LangSmith-based observability in Kahuna MCP Server

## Overview

The Kahuna Observability System provides enterprise-grade tracing, monitoring, and analytics for Kahuna MCP tools. It integrates with [LangSmith](https://smith.langchain.com/) to give developers and operators full visibility into:

- **Tool Execution**: Every Kahuna tool call with inputs, outputs, and timing
- **LLM Operations**: Internal Claude API calls made by Kahuna's agents
- **Context Effectiveness**: Hit/miss tracking for surfaced knowledge base content
- **Integration Usage**: Whether surfaced integrations were actually called
- **Cost Analytics**: Token usage and cost breakdown by tool and model

## Design Goals

1. **Zero Impact When Disabled**: No performance overhead or errors when LangSmith is not configured
2. **Minimal Code Intrusion**: Tracing wraps existing functions without major refactoring
3. **Automatic Hierarchy**: LLM calls automatically link to parent tool traces
4. **Session Intelligence**: Track context effectiveness across a user's session
5. **Free Tier Friendly**: Designed to work within LangSmith's free tier (5K traces/month)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Claude Code (User's Agent)                        │
│                                                                             │
│   User: "Build an auth system"                                              │
│   Agent: Calls kahuna_prepare_context("build auth system")                 │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Kahuna MCP Server                               │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Observability Layer                            │  │
│  │                                                                       │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────────┐ │  │
│  │  │  Tracer     │   │  Session    │   │  LangSmith Client          │ │  │
│  │  │             │   │  Tracker    │   │                             │ │  │
│  │  │ - Tool wrap │   │ - Hit/Miss  │   │ - Trace submission         │ │  │
│  │  │ - LLM wrap  │   │ - Context   │   │ - Async batching           │ │  │
│  │  │ - Metadata  │   │ - Sessions  │   │ - Error handling           │ │  │
│  │  └─────────────┘   └─────────────┘   └─────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          Tool Handlers                                │  │
│  │                                                                       │  │
│  │  ┌──────────┐  ┌────────────────┐  ┌─────────┐  ┌─────────────────┐  │  │
│  │  │  learn   │  │ prepare_context│  │   ask   │  │ use_integration │  │  │
│  │  └────┬─────┘  └───────┬────────┘  └────┬────┘  └────────┬────────┘  │  │
│  └───────│────────────────│────────────────│────────────────│───────────┘  │
│          │                │                │                │               │
│          ▼                ▼                ▼                ▼               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Agent Runner (run-agent.ts)                   │  │
│  │                                                                       │  │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐                       │  │
│  │   │ LLM Call │───▶│ LLM Call │───▶│ LLM Call │                       │  │
│  │   │ (traced) │    │ (traced) │    │ (traced) │                       │  │
│  │   └──────────┘    └──────────┘    └──────────┘                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LangSmith Cloud                                 │
│                                                                             │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │
│   │   Traces    │   │  Analytics  │   │   Alerts    │   │  Datasets   │   │
│   │   Browser   │   │  Dashboard  │   │  & Monitors │   │  & Evals    │   │
│   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Structure

```
apps/mcp/src/observability/
├── index.ts                 # Public exports
├── langsmith-client.ts      # LangSmith client singleton & configuration
├── tracer.ts               # Core tracing utilities
├── session-tracker.ts      # Session-level context tracking
├── types.ts                # Type definitions
└── __tests__/
    ├── tracer.test.ts
    └── session-tracker.test.ts
```

---

## Trace Data Model

### KahunaTrace

Each Kahuna tool call generates a trace with the following structure:

```typescript
interface KahunaTrace {
  // Identity
  trace_id: string;           // Unique trace identifier
  parent_trace_id?: string;   // Links to parent (for nested calls)
  session_id: string;         // Groups traces by user session
  
  // Operation
  tool_name: string;          // e.g., "kahuna_prepare_context"
  operation_type: 'tool' | 'llm' | 'integration';
  
  // Timing
  start_time: Date;
  end_time: Date;
  duration_ms: number;
  
  // Input/Output
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  
  // LLM Details (when applicable)
  llm_calls: LLMCallTrace[];
  
  // Cost
  cost: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    total_cost_usd: number;
    cost_by_model: Record<string, number>;
  };
  
  // Status
  status: 'success' | 'error' | 'timeout';
  error_message?: string;
  error_stack?: string;
  
  // Context Metrics (for prepare_context)
  context_surfaced?: {
    knowledge_files: string[];
    integrations: string[];
    framework?: string;
  };
  
  // Tags & Metadata
  tags: string[];
  metadata: Record<string, unknown>;
}
```

### LLMCallTrace

Each LLM API call within a Kahuna agent generates:

```typescript
interface LLMCallTrace {
  call_id: string;
  parent_trace_id: string;    // Links to parent tool trace
  
  // Model
  model: string;              // e.g., "claude-sonnet-4-20250514"
  provider: 'anthropic';
  
  // Messages
  system_prompt_preview: string;  // First 200 chars
  user_message_preview: string;   // First 200 chars
  
  // Response
  response_preview: string;       // First 200 chars
  tool_calls_made: string[];      // Tools the LLM called
  stop_reason: string;
  
  // Usage
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  
  // Timing
  latency_ms: number;
  
  // Cost
  cost_usd: number;
}
```

### SessionMetrics

Aggregated metrics for a user session:

```typescript
interface SessionMetrics {
  session_id: string;
  start_time: Date;
  last_activity: Date;
  
  // Tool Usage
  tool_calls_total: number;
  tool_calls_by_name: Record<string, number>;
  
  // Context Effectiveness
  context: {
    files_surfaced: number;
    files_used: number;
    file_hit_rate: number;        // files_used / files_surfaced
    
    integrations_surfaced: number;
    integrations_used: number;
    integration_hit_rate: number;
  };
  
  // Cost
  total_cost_usd: number;
  cost_by_tool: Record<string, number>;
  cost_by_model: Record<string, number>;
  
  // Performance
  total_latency_ms: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
}
```

---

## Implementation Details

### 1. LangSmith Client (`langsmith-client.ts`)

Singleton client with lazy initialization and graceful degradation:

```typescript
import { Client } from 'langsmith';
import { LANGSMITH } from '../config.js';

let clientInstance: Client | null = null;
let initializationAttempted = false;

/**
 * Get the LangSmith client instance.
 * Returns null if LangSmith is not configured or initialization fails.
 */
export function getLangSmithClient(): Client | null {
  if (!LANGSMITH.enabled) {
    return null;
  }
  
  if (!initializationAttempted) {
    initializationAttempted = true;
    try {
      clientInstance = new Client({
        apiKey: LANGSMITH.apiKey,
        apiUrl: LANGSMITH.endpoint,
      });
    } catch (error) {
      console.warn('[Observability] Failed to initialize LangSmith:', error);
      clientInstance = null;
    }
  }
  
  return clientInstance;
}

/**
 * Check if LangSmith observability is enabled and working.
 */
export function isObservabilityEnabled(): boolean {
  return getLangSmithClient() !== null;
}
```

### 2. Tracer (`tracer.ts`)

Core tracing utilities for wrapping tool and LLM calls:

```typescript
import { traceable } from 'langsmith/traceable';
import { getLangSmithClient, isObservabilityEnabled } from './langsmith-client.js';
import { getSessionTracker } from './session-tracker.js';

/**
 * Wrap a Kahuna tool handler with LangSmith tracing.
 * If LangSmith is not enabled, executes the function directly.
 */
export async function traceToolCall<T>(
  toolName: string,
  input: Record<string, unknown>,
  fn: () => Promise<T>,
  options?: {
    tags?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<T> {
  if (!isObservabilityEnabled()) {
    return fn();
  }
  
  const traced = traceable(fn, {
    name: toolName,
    run_type: 'tool',
    project_name: LANGSMITH.project,
    tags: ['kahuna', toolName, ...(options?.tags ?? [])],
    metadata: {
      tool_name: toolName,
      input,
      ...options?.metadata,
    },
  });
  
  return traced();
}

/**
 * Wrap an LLM API call with tracing.
 * Called from run-agent.ts for each Claude API call.
 */
export async function traceLLMCall<T>(
  model: string,
  config: {
    systemPrompt: string;
    userMessage: string;
    tools?: string[];
  },
  fn: () => Promise<T>,
  parentRunId?: string
): Promise<T> {
  if (!isObservabilityEnabled()) {
    return fn();
  }
  
  const traced = traceable(fn, {
    name: `llm_call_${model}`,
    run_type: 'llm',
    project_name: LANGSMITH.project,
    parent_run_id: parentRunId,
    tags: ['kahuna', 'llm', model],
    metadata: {
      model,
      system_prompt_preview: config.systemPrompt.slice(0, 200),
      user_message_preview: config.userMessage.slice(0, 200),
      tools_available: config.tools,
    },
  });
  
  return traced();
}

/**
 * Record context surfacing for hit/miss tracking.
 * Called when prepare_context completes.
 */
export function recordContextSurfaced(
  sessionId: string,
  context: {
    knowledgeFiles: string[];
    integrations: string[];
    framework?: string;
  }
): void {
  const tracker = getSessionTracker();
  tracker.recordSurfaced(sessionId, context);
}

/**
 * Record context usage (hit).
 * Called when use_integration or similar is called.
 */
export function recordContextUsed(
  sessionId: string,
  usage: {
    integrationId?: string;
    knowledgeFile?: string;
  }
): void {
  const tracker = getSessionTracker();
  tracker.recordUsed(sessionId, usage);
}
```

### 3. Session Tracker (`session-tracker.ts`)

Tracks context effectiveness across a session:

```typescript
interface SessionContext {
  surfacedFiles: Set<string>;
  surfacedIntegrations: Set<string>;
  surfacedFramework?: string;
  usedFiles: Set<string>;
  usedIntegrations: Set<string>;
  usedFramework: boolean;
  startTime: Date;
  lastActivity: Date;
}

/**
 * Session tracker for context hit/miss analysis.
 * Maintains in-memory state per session.
 */
export class SessionTracker {
  private sessions = new Map<string, SessionContext>();
  
  // Session timeout (30 minutes of inactivity)
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  
  recordSurfaced(sessionId: string, context: {
    knowledgeFiles: string[];
    integrations: string[];
    framework?: string;
  }): void {
    const session = this.getOrCreateSession(sessionId);
    context.knowledgeFiles.forEach(f => session.surfacedFiles.add(f));
    context.integrations.forEach(i => session.surfacedIntegrations.add(i));
    if (context.framework) session.surfacedFramework = context.framework;
    session.lastActivity = new Date();
  }
  
  recordUsed(sessionId: string, usage: {
    integrationId?: string;
    knowledgeFile?: string;
  }): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    if (usage.integrationId) {
      session.usedIntegrations.add(usage.integrationId);
    }
    if (usage.knowledgeFile) {
      session.usedFiles.add(usage.knowledgeFile);
    }
    session.lastActivity = new Date();
  }
  
  getMetrics(sessionId: string): SessionMetrics | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    const fileHitRate = session.surfacedFiles.size > 0
      ? session.usedFiles.size / session.surfacedFiles.size
      : 0;
    
    const integrationHitRate = session.surfacedIntegrations.size > 0
      ? session.usedIntegrations.size / session.surfacedIntegrations.size
      : 0;
    
    return {
      session_id: sessionId,
      context: {
        files_surfaced: session.surfacedFiles.size,
        files_used: session.usedFiles.size,
        file_hit_rate: fileHitRate,
        integrations_surfaced: session.surfacedIntegrations.size,
        integrations_used: session.usedIntegrations.size,
        integration_hit_rate: integrationHitRate,
      },
      start_time: session.startTime,
      last_activity: session.lastActivity,
    };
  }
  
  // Cleanup expired sessions periodically
  cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > this.SESSION_TIMEOUT_MS) {
        // Log final metrics before cleanup
        this.logSessionMetrics(id, session);
        this.sessions.delete(id);
      }
    }
  }
}

// Singleton instance
let trackerInstance: SessionTracker | null = null;

export function getSessionTracker(): SessionTracker {
  if (!trackerInstance) {
    trackerInstance = new SessionTracker();
  }
  return trackerInstance;
}
```

---

## Tool Instrumentation

Each Kahuna tool handler is wrapped with tracing:

### Example: `prepare-context.ts`

```typescript
import { traceToolCall, recordContextSurfaced } from '../observability/index.js';

export async function prepareContextToolHandler(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<MCPToolResponse> {
  return traceToolCall('kahuna_prepare_context', args, async () => {
    // ... existing implementation ...
    
    // After context is surfaced, record for hit/miss tracking
    recordContextSurfaced(ctx.sessionId, {
      knowledgeFiles: kbFiles.map(f => f.slug),
      integrations: integrations.map(i => i.id),
      framework: frameworkResult?.id,
    });
    
    return result;
  }, {
    tags: ['context-retrieval'],
    metadata: {
      task: args.task,
      files_requested: args.files,
    },
  });
}
```

### Example: `use-integration.ts`

```typescript
import { traceToolCall, recordContextUsed } from '../observability/index.js';

export async function useIntegrationToolHandler(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<MCPToolResponse> {
  return traceToolCall('kahuna_use_integration', args, async () => {
    // ... existing implementation ...
    
    // Record that this integration was used
    recordContextUsed(ctx.sessionId, {
      integrationId: args.integration as string,
    });
    
    return result;
  }, {
    tags: ['integration-execution'],
    metadata: {
      integration: args.integration,
      operation: args.operation,
    },
  });
}
```

---

## Configuration

### Environment Variables

```bash
# LangSmith Configuration (Optional)
# Get your API key at: https://smith.langchain.com/settings

# Required for observability
LANGSMITH_API_KEY=lsv2_pt_xxxxx

# Project name in LangSmith (default: kahuna-mcp)
LANGSMITH_PROJECT=kahuna-mcp

# Custom endpoint (optional, for self-hosted LangSmith)
LANGSMITH_ENDPOINT=https://api.smith.langchain.com

# Enable/disable (default: true when API key is set)
LANGSMITH_TRACING_ENABLED=true
```

### Configuration Module (`config.ts`)

```typescript
export const LANGSMITH = {
  get enabled(): boolean {
    const explicitlyDisabled = process.env.LANGSMITH_TRACING_ENABLED === 'false';
    const hasApiKey = !!process.env.LANGSMITH_API_KEY;
    return hasApiKey && !explicitlyDisabled;
  },
  
  get apiKey(): string | undefined {
    return process.env.LANGSMITH_API_KEY;
  },
  
  get project(): string {
    return process.env.LANGSMITH_PROJECT ?? 'kahuna-mcp';
  },
  
  get endpoint(): string | undefined {
    return process.env.LANGSMITH_ENDPOINT;
  },
};
```

---

## What Users See in LangSmith

### 1. Trace List View

| Trace | Tool | Duration | Cost | Status |
|-------|------|----------|------|--------|
| `trc_abc123` | kahuna_prepare_context | 2.3s | $0.0089 | ✅ |
| `trc_def456` | kahuna_ask | 1.8s | $0.0045 | ✅ |
| `trc_ghi789` | kahuna_use_integration | 0.4s | $0.0012 | ✅ |

### 2. Trace Detail View

```
📍 kahuna_prepare_context
├── Input: { task: "build auth system" }
├── Duration: 2,340ms
├── Cost: $0.0089
│
├── 🤖 llm_call_claude-sonnet-4 (Iteration 1)
│   ├── Input tokens: 1,234
│   ├── Output tokens: 456
│   ├── Latency: 1,200ms
│   └── Tool calls: search_knowledge_base
│
├── 🤖 llm_call_claude-sonnet-4 (Iteration 2)
│   ├── Input tokens: 2,456
│   ├── Output tokens: 892
│   ├── Latency: 1,100ms
│   └── Tool calls: select_files_for_context
│
└── Output: {
      files_selected: 3,
      integrations_available: 2,
      framework: "langgraph"
    }
```

### 3. Session Analytics

```
📊 Session Summary (last 2 hours)
─────────────────────────────────────
Tool Calls:           12
Context Surfaced:     8 files, 3 integrations

Context Hit Rate:
  Files:              75% (6/8 used)
  Integrations:       100% (3/3 used)
  
Total Cost:           $0.1234
Avg Latency:          1.8s
─────────────────────────────────────
```

---

## Free Tier Considerations

LangSmith Free Tier includes:
- **5,000 traces per month**
- Basic tracing and debugging
- 14-day trace retention

### Trace Budget Management

With 5K traces/month ≈ ~166 traces/day:

| Tool | Avg Traces per Call | Est. Daily Calls | Daily Traces |
|------|---------------------|------------------|--------------|
| prepare_context | 3 (1 tool + 2 LLM) | 20 | 60 |
| ask | 2 (1 tool + 1 LLM) | 30 | 60 |
| learn | 4 (1 tool + 3 LLM avg) | 10 | 40 |
| use_integration | 1 | 5 | 5 |
| **Total** | | | **165** |

This fits comfortably within the free tier for typical development usage.

### Sampling Strategy (Optional)

For high-volume production, implement sampling:

```typescript
export function shouldTrace(): boolean {
  if (process.env.LANGSMITH_SAMPLE_RATE) {
    const rate = parseFloat(process.env.LANGSMITH_SAMPLE_RATE);
    return Math.random() < rate;
  }
  return true; // Trace everything by default
}
```

---

## Testing

### Unit Tests

```typescript
// tracer.test.ts
describe('traceToolCall', () => {
  it('executes function when LangSmith disabled', async () => {
    // Mock LANGSMITH.enabled = false
    const result = await traceToolCall('test_tool', { input: 'test' }, async () => 'result');
    expect(result).toBe('result');
  });
  
  it('wraps function with tracing when enabled', async () => {
    // Mock LangSmith client
    const mockTrace = vi.fn();
    // ...
  });
});

// session-tracker.test.ts
describe('SessionTracker', () => {
  it('calculates hit rate correctly', () => {
    const tracker = new SessionTracker();
    tracker.recordSurfaced('session-1', {
      knowledgeFiles: ['file1', 'file2', 'file3'],
      integrations: ['github'],
    });
    tracker.recordUsed('session-1', { knowledgeFile: 'file1' });
    tracker.recordUsed('session-1', { integrationId: 'github' });
    
    const metrics = tracker.getMetrics('session-1');
    expect(metrics?.context.file_hit_rate).toBe(1/3);
    expect(metrics?.context.integration_hit_rate).toBe(1);
  });
});
```

---

## Migration & Rollout

### Phase 1: Basic Tracing
1. Add LangSmith dependency
2. Implement client and basic tracer
3. Wrap tool handlers
4. Test in development

### Phase 2: LLM Call Tracing
1. Instrument run-agent.ts
2. Link LLM calls to parent tool traces
3. Capture token usage and costs

### Phase 3: Session Intelligence
1. Implement session tracker
2. Add hit/miss tracking
3. Surface metrics in traces

### Phase 4: Documentation & Release
1. Update README and docs
2. Add .env.example entries
3. Release with observability feature flag

---

## Future Enhancements

1. **Evaluation Datasets**: Use LangSmith datasets to create regression tests
2. **Prompt Versioning**: Track prompt changes and their impact on quality
3. **Alerting**: Set up alerts for error spikes or cost anomalies
4. **A/B Testing**: Compare different prompt strategies
5. **Fine-tuning Data**: Export traces as training data

---

## References

- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [LangSmith Python SDK](https://github.com/langchain-ai/langsmith-sdk)
- [LangSmith JavaScript/TypeScript SDK](https://www.npmjs.com/package/langsmith)
- [Existing Kahuna Demo Script](../apps/mcp/scripts/langsmith-demo.ts)
