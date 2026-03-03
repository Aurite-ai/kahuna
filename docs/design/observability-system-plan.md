# Kahuna Observability System - Implementation Plan

> **Version:** 1.0  
> **Status:** Draft  
> **Created:** March 3, 2026  
> **Last Updated:** March 3, 2026

## Executive Summary

This document outlines the comprehensive plan for implementing a native observability system in Kahuna that provides **LangSmith-equivalent capabilities for free**. The system leverages Claude Code's existing JSONL history files to provide tracing, evaluation, cost tracking, and performance monitoring without requiring external services.

---

## Table of Contents

1. [Goals & Motivation](#goals--motivation)
2. [Feature Mapping: LangSmith → Kahuna](#feature-mapping-langsmith--kahuna)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Phases](#implementation-phases)
   - [Phase 1: Core Observability Module](#phase-1-core-observability-module)
   - [Phase 2: MCP Tools](#phase-2-mcp-tools)
   - [Phase 3: Core Types](#phase-3-core-types)
   - [Phase 4: Integration Enhancement](#phase-4-integration-enhancement)
   - [Phase 5: CLI Dashboard](#phase-5-cli-dashboard)
   - [Phase 6: Storage Structure](#phase-6-storage-structure)
5. [API Reference](#api-reference)
6. [Success Metrics](#success-metrics)
7. [Timeline & Milestones](#timeline--milestones)
8. [Risks & Mitigations](#risks--mitigations)

---

## Goals & Motivation

### Problem Statement
- LangSmith provides excellent observability for LLM applications but requires paid subscriptions for production use
- Developers need visibility into how AI agents use context, which tools they call, and at what cost
- No free, local-first alternative exists that integrates natively with Claude Code workflows

### Solution
Build a native observability system in Kahuna that:
- Reads Claude Code's existing `.jsonl` history files (zero instrumentation required)
- Provides context utilization scoring to measure KB effectiveness
- Tracks costs, latency, and tool usage metrics
- Stores feedback and evaluations locally
- Exports data in standard formats (JSON/CSV)

---

## Feature Mapping: LangSmith → Kahuna

| LangSmith Feature | Kahuna Native Equivalent | Implementation Approach |
|-------------------|-------------------------|------------------------|
| **Tracing** | Session Analysis | Read Claude Code `.jsonl` history files |
| **Evaluations** | Context Utilization Scoring | Compare Kahuna output vs Claude's response |
| **Datasets** | Test Scenarios | Existing `packages/testing/scenarios/` |
| **Prompt Management** | Knowledge Base | Existing Kahuna KB system |
| **Monitoring** | Real-time Dashboard | New CLI/web dashboard |
| **Annotations** | Feedback System | Store user feedback on responses |
| **Cost Tracking** | Already exists! | Enhance `apps/mcp/src/usage/` |
| **Latency Metrics** | Session Analysis | Extract from `elapsedTimeMs` in history |
| **Custom Metadata** | Tags & Filters | Add metadata tagging to traces |
| **Export** | Export Tool | Export to JSON/CSV |

### Out of Scope (v1)
- ❌ Real-time Playground (could add later)
- ❌ Team Collaboration (enterprise feature)
- ❌ Cloud sync/backup

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kahuna Observability System                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   History    │   │   Analysis   │   │  Evaluation  │        │
│  │   Reader     │──▶│    Engine    │──▶│   Scoring    │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│         │                  │                  │                  │
│         ▼                  ▼                  ▼                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                   Trace Storage                       │      │
│  └──────────────────────────────────────────────────────┘      │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │  MCP Tools   │   │     CLI      │   │   Export     │        │
│  │  (6 tools)   │   │  Dashboard   │   │  (JSON/CSV)  │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Ingest**: History reader watches Claude Code `.jsonl` files
2. **Parse**: Parser converts raw JSONL to structured traces
3. **Analyze**: Analysis engine computes metrics (cost, latency, tool usage)
4. **Evaluate**: Evaluator scores context utilization
5. **Store**: Traces and feedback stored in local `.kahuna/observability/`
6. **Surface**: Data available via MCP tools, CLI, and export

---

## Implementation Phases

### Phase 1: Core Observability Module

**Directory Structure:**

```
apps/mcp/src/observability/
├── types.ts                 # All observability types
├── history/
│   ├── index.ts
│   ├── reader.ts           # Read Claude Code history
│   ├── parser.ts           # Parse JSONL to traces
│   └── types.ts            # History-specific types
├── analysis/
│   ├── index.ts
│   ├── context-usage.ts    # Analyze if context was used
│   ├── tool-metrics.ts     # Tool usage statistics
│   ├── cost-analyzer.ts    # Cost calculations
│   └── performance.ts      # Latency & performance
├── storage/
│   ├── index.ts
│   ├── trace-storage.ts    # Store analyzed traces
│   └── feedback-storage.ts # Store user feedback
├── evaluation/
│   ├── index.ts
│   ├── evaluator.ts        # Evaluate agent outputs
│   ├── criteria.ts         # Evaluation criteria
│   └── scorer.ts           # Scoring algorithms
└── index.ts                # Public exports
```

**Key Components:**

#### 1.1 History Reader (`history/reader.ts`)
- Locate Claude Code history directory (platform-specific)
- Watch for new/modified session files
- Support reading specific sessions or date ranges
- Handle file locking and concurrent access

#### 1.2 Parser (`history/parser.ts`)
- Parse JSONL format to structured `Trace` objects
- Extract tool calls, LLM responses, and metadata
- Handle malformed/incomplete entries gracefully
- Preserve original timestamps and order

#### 1.3 Context Usage Analyzer (`analysis/context-usage.ts`)
- Compare Kahuna tool outputs with subsequent agent responses
- Score how much provided context was utilized
- Identify unused/ignored context
- Generate improvement recommendations

#### 1.4 Tool Metrics (`analysis/tool-metrics.ts`)
- Aggregate tool call counts by type
- Calculate success/failure rates
- Track average response times
- Identify slow or failing tools

#### 1.5 Cost Analyzer (`analysis/cost-analyzer.ts`)
- Extend existing `apps/mcp/src/usage/calculator.ts`
- Break down costs by tool, session, project
- Track cache efficiency (savings from prompt caching)
- Project future costs based on trends

---

### Phase 2: MCP Tools

Six new tools to expose observability features:

#### 2.1 `kahuna_analyze_session`
```typescript
{
  name: "kahuna_analyze_session",
  description: "Analyze a Claude Code session for context usage, costs, and performance",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Specific session ID to analyze (defaults to latest)"
      },
      projectPath: {
        type: "string",
        description: "Filter by project path"
      },
      showDetails: {
        type: "boolean",
        description: "Include full trace details",
        default: false
      }
    }
  }
}
```

**Output Example:**
```markdown
# Session Analysis: abc123

**Duration:** 45 minutes
**Total Cost:** $0.47
**Cache Efficiency:** 73%

## Tool Usage
| Tool | Calls | Avg Time | Success |
|------|-------|----------|---------|
| kahuna_ask | 12 | 234ms | 100% |
| kahuna_learn | 3 | 567ms | 100% |
| Read File | 28 | 45ms | 96% |

## Context Utilization: 87%
- 14/16 provided patterns were referenced
- Unused: Error handling examples, Rate limiting docs

## Recommendations
1. Consider condensing error handling docs (rarely accessed)
2. Add more code examples for common patterns (high reference rate)
```

#### 2.2 `kahuna_usage_insights`
```typescript
{
  name: "kahuna_usage_insights",
  description: "Get aggregated usage insights across sessions",
  inputSchema: {
    type: "object",
    properties: {
      period: {
        type: "string",
        enum: ["day", "week", "month", "all"],
        default: "week"
      },
      groupBy: {
        type: "string",
        enum: ["tool", "project", "session"],
        default: "tool"
      }
    }
  }
}
```

#### 2.3 `kahuna_evaluate`
```typescript
{
  name: "kahuna_evaluate",
  description: "Evaluate response quality for a session",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session to evaluate"
      },
      criteria: {
        type: "array",
        items: { type: "string" },
        description: "Specific criteria to evaluate (defaults to all)"
      }
    },
    required: ["sessionId"]
  }
}
```

#### 2.4 `kahuna_feedback`
```typescript
{
  name: "kahuna_feedback",
  description: "Add user feedback to a session or message",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session ID"
      },
      messageId: {
        type: "string",
        description: "Specific message ID (optional)"
      },
      rating: {
        type: "number",
        minimum: 1,
        maximum: 5,
        description: "Rating from 1-5"
      },
      comment: {
        type: "string",
        description: "Optional feedback comment"
      }
    },
    required: ["sessionId", "rating"]
  }
}
```

#### 2.5 `kahuna_export_traces`
```typescript
{
  name: "kahuna_export_traces",
  description: "Export trace data to JSON or CSV",
  inputSchema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["json", "csv"],
        default: "json"
      },
      period: {
        type: "string",
        description: "Time period to export (e.g., '7d', '30d', 'all')"
      },
      projectPath: {
        type: "string",
        description: "Filter by project"
      },
      outputPath: {
        type: "string",
        description: "Output file path"
      }
    }
  }
}
```

#### 2.6 `kahuna_compare_sessions`
```typescript
{
  name: "kahuna_compare_sessions",
  description: "Compare metrics across multiple sessions",
  inputSchema: {
    type: "object",
    properties: {
      sessionIds: {
        type: "array",
        items: { type: "string" },
        description: "Sessions to compare"
      },
      metrics: {
        type: "array",
        items: { type: "string" },
        description: "Metrics to compare (defaults to all)"
      }
    },
    required: ["sessionIds"]
  }
}
```

---

### Phase 3: Core Types

```typescript
// apps/mcp/src/observability/types.ts

// ============ Base Trace Types ============

/** A single trace representing one conversation turn */
export interface Trace {
  id: string;
  sessionId: string;
  projectPath: string;
  timestamp: Date;
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result';
  content: TraceContent;
  metadata: TraceMetadata;
}

export interface TraceContent {
  text?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
}

export interface TraceMetadata {
  elapsedMs?: number;
  model?: string;
  stopReason?: string;
  tags?: string[];
}

// ============ Specialized Trace Types ============

/** Tool-specific trace data */
export interface ToolTrace extends Trace {
  type: 'tool_use' | 'tool_result';
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput: unknown;
  elapsedMs: number;
  success: boolean;
  error?: string;
}

/** LLM call data */
export interface LLMTrace extends Trace {
  type: 'assistant';
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  thinking?: string;
  cost: number;
}

// ============ Summary Types ============

/** Tool call summary for aggregation */
export interface ToolCallSummary {
  toolName: string;
  callCount: number;
  totalTimeMs: number;
  avgTimeMs: number;
  successRate: number;
  errorCount: number;
}

/** Session summary with all metrics */
export interface SessionSummary {
  sessionId: string;
  projectPath: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  
  // Message counts
  userMessages: number;
  assistantMessages: number;
  
  // Tool metrics
  toolCalls: ToolCallSummary[];
  totalToolTime: number;
  kahunaToolCalls: number;
  
  // Cost metrics
  totalCost: number;
  costByTool: Record<string, number>;
  
  // Token metrics
  totalInputTokens: number;
  totalOutputTokens: number;
  cacheReadTokens: number;
  cacheEfficiency: number; // % of tokens from cache
  
  // Quality metrics
  contextUtilizationScore: number; // 0-100
  evaluationScores?: EvaluationScore[];
  userFeedback?: UserFeedback[];
}

// ============ Context Utilization ============

/** Context utilization analysis */
export interface ContextUtilization {
  sessionId: string;
  traceId: string;
  kahunaContext: string;      // What Kahuna returned
  agentResponse: string;      // What Claude did with it
  overlapScore: number;       // 0-1, how much was used
  keyConceptsUsed: string[];  // Which concepts appeared
  unusedContext: string[];    // What was ignored
  recommendation: string;     // How to improve
}

/** Aggregated context utilization for a session */
export interface SessionContextUtilization {
  sessionId: string;
  overallScore: number;
  utilizationByTool: Record<string, number>;
  topUsedConcepts: string[];
  frequentlyIgnored: string[];
  recommendations: string[];
}

// ============ Evaluation ============

/** Evaluation criteria definition */
export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  scorer: (context: ContextUtilization) => number;
}

/** Single evaluation score */
export interface EvaluationScore {
  criteriaId: string;
  criteriaName: string;
  score: number;        // 0-100
  maxScore: number;
  explanation: string;
  timestamp: Date;
}

/** Full evaluation result */
export interface EvaluationResult {
  sessionId: string;
  evaluatedAt: Date;
  scores: EvaluationScore[];
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  recommendations: string[];
}

// ============ Feedback ============

/** User feedback */
export interface UserFeedback {
  id: string;
  sessionId: string;
  traceId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  tags?: string[];
  timestamp: Date;
}

// ============ Export Types ============

/** Export options */
export interface ExportOptions {
  format: 'json' | 'csv';
  period?: string;
  projectPath?: string;
  includeTraces?: boolean;
  includeFeedback?: boolean;
  includeEvaluations?: boolean;
}

/** Export result */
export interface ExportResult {
  filePath: string;
  format: 'json' | 'csv';
  recordCount: number;
  dateRange: { start: Date; end: Date };
  size: number;
}
```

---

### Phase 4: Integration Enhancement

Enhance `verify-integration.ts` with observability capabilities:

#### Enhanced Tool Definition
```typescript
export const verifyIntegrationToolDefinition = {
  name: "verify_integration",
  inputSchema: {
    type: "object",
    properties: {
      integration: { 
        type: "string",
        description: "Integration name to verify"
      },
      skipConnectionTest: { 
        type: "boolean",
        description: "Skip live connection test"
      },
      
      // NEW: Observability options
      analyze: {
        type: "boolean",
        description: "Include usage analysis from recent sessions"
      },
      showMetrics: {
        type: "boolean", 
        description: "Show performance metrics"
      },
      evaluatePastUsage: {
        type: "boolean",
        description: "Evaluate how well this integration was used"
      }
    },
    required: ["integration"]
  }
}
```

#### Enhanced Output Format
```markdown
# ✅ Verification: slack-integration

**Status:** verified
**Last Used:** 2 hours ago
**Total Calls:** 47

## Connection Test
✅ API connection successful (234ms)
✅ Authentication valid
✅ Required scopes present

## Performance Metrics
| Metric | Value |
|--------|-------|
| Avg Response Time | 234ms |
| Success Rate | 98% |
| Cache Hit Rate | 67% |
| Total Cost | $1.23 |

## Context Utilization
🎯 **Score: 87%** - Agent effectively used the context provided

**Highly Used:**
- API endpoint patterns (94%)
- Error handling examples (89%)
- Rate limiting docs (78%)

**Rarely Used:**
- Webhook setup guide (12%)
- Admin features (8%)

## Recommendations
1. Consider adding more examples for error handling
2. Rate limiting patterns were provided but rarely used
3. Webhook docs may be candidates for archival
```

---

### Phase 5: CLI Dashboard

New CLI commands for the `apps/cli` package:

```bash
# Trace commands
kahuna traces                    # List recent sessions
kahuna traces <session-id>       # Show specific session details
kahuna traces --analyze          # Analyze all recent sessions
kahuna traces --export json      # Export to JSON
kahuna traces --export csv       # Export to CSV
kahuna traces --period week      # Filter by time period
kahuna traces --project /path    # Filter by project

# Insights commands
kahuna insights                  # Show usage insights
kahuna insights --period week    # Weekly insights
kahuna insights --period month   # Monthly insights
kahuna insights --project /path  # Project-specific insights
kahuna insights --group tool     # Group by tool
kahuna insights --group project  # Group by project

# Evaluation commands
kahuna evaluate                  # Run evaluations on recent sessions
kahuna evaluate <session-id>     # Evaluate specific session
kahuna evaluate --criteria all   # Full evaluation with all criteria
kahuna evaluate --report         # Generate evaluation report

# Feedback commands
kahuna feedback add <session>    # Add feedback interactively
kahuna feedback add <session> --rating 5 --comment "Great!"
kahuna feedback list             # List all feedback
kahuna feedback list --session <id>  # Feedback for session
```

#### CLI Output Examples

**`kahuna traces`:**
```
┌─────────────────────────────────────────────────────────────────┐
│                     Recent Sessions                              │
├────────────┬────────────────────┬──────────┬───────┬────────────┤
│ Session ID │ Project            │ Duration │ Cost  │ Score      │
├────────────┼────────────────────┼──────────┼───────┼────────────┤
│ abc123     │ /projects/myapp    │ 45m      │ $0.47 │ 87% ████▓  │
│ def456     │ /projects/api      │ 23m      │ $0.23 │ 92% █████  │
│ ghi789     │ /projects/myapp    │ 1h 12m   │ $1.23 │ 76% ███▓   │
└────────────┴────────────────────┴──────────┴───────┴────────────┘
```

**`kahuna insights`:**
```
┌─────────────────────────────────────────────────────────────────┐
│                     Weekly Usage Insights                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Total Sessions: 47          Total Cost: $12.34                 │
│  Avg Duration: 34 min        Cache Savings: $8.67 (41%)         │
│                                                                  │
│  Top Tools:                                                      │
│  ──────────────────────────────────────────────────             │
│  kahuna_ask        │████████████████████████│ 234 calls         │
│  kahuna_learn      │████████████            │ 89 calls          │
│  verify_integration│██████                  │ 45 calls          │
│                                                                  │
│  Context Utilization Trend:                                      │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun                              │
│  ██   ███  ████ ████ ███  ██   █                                │
│  78%  82%  89%  91%  85%  79%  75%                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 6: Storage Structure

```
.kahuna/
├── knowledge/              # Existing KB storage
├── integrations/           # Existing integration configs
├── usage.json              # Existing usage tracking
└── observability/          # NEW: Observability data
    ├── config.json         # Observability settings
    ├── traces/
    │   ├── 2026-03-01.jsonl
    │   ├── 2026-03-02.jsonl
    │   └── 2026-03-03.jsonl
    ├── feedback/
    │   └── feedback.json
    ├── evaluations/
    │   └── evaluations.json
    ├── cache/
    │   └── analysis-cache.json
    └── exports/
        ├── export-2026-03-01.json
        └── export-2026-03-01.csv
```

#### Storage File Formats

**`traces/<date>.jsonl`:**
```jsonl
{"id":"t1","sessionId":"abc123","type":"tool_use","timestamp":"2026-03-03T10:00:00Z","toolName":"kahuna_ask","elapsedMs":234}
{"id":"t2","sessionId":"abc123","type":"tool_result","timestamp":"2026-03-03T10:00:01Z","toolName":"kahuna_ask","success":true}
```

**`feedback/feedback.json`:**
```json
{
  "version": 1,
  "feedback": [
    {
      "id": "f1",
      "sessionId": "abc123",
      "rating": 5,
      "comment": "Context was very helpful",
      "timestamp": "2026-03-03T10:30:00Z"
    }
  ]
}
```

**`evaluations/evaluations.json`:**
```json
{
  "version": 1,
  "evaluations": [
    {
      "sessionId": "abc123",
      "evaluatedAt": "2026-03-03T11:00:00Z",
      "overallScore": 87,
      "grade": "B",
      "scores": [...]
    }
  ]
}
```

---

## API Reference

### Public Exports

```typescript
// apps/mcp/src/observability/index.ts

// History
export { HistoryReader, parseSession } from './history';

// Analysis
export { 
  analyzeContextUsage,
  calculateToolMetrics,
  analyzeCosts,
  analyzePerformance 
} from './analysis';

// Storage
export { 
  TraceStorage,
  FeedbackStorage 
} from './storage';

// Evaluation
export {
  Evaluator,
  defaultCriteria,
  createCustomCriteria
} from './evaluation';

// Types
export * from './types';
```

---

## Success Metrics

### Quantitative
- [ ] History reader can parse 100% of Claude Code JSONL formats
- [ ] Context utilization scoring has >90% correlation with manual evaluation
- [ ] Analysis completes in <2s for sessions up to 1000 messages
- [ ] Export handles sessions with >10,000 traces
- [ ] Storage growth <1MB per day of active usage

### Qualitative
- [ ] Users can identify underutilized KB content
- [ ] Users can track cost trends over time
- [ ] Users can compare session effectiveness
- [ ] Integration with existing Kahuna workflow is seamless

---

## Timeline & Milestones

| Phase | Milestone | Estimated Effort | Priority |
|-------|-----------|------------------|----------|
| **1** | Core Observability Module | 3-4 days | P0 |
| **2** | MCP Tools (6 tools) | 2-3 days | P0 |
| **3** | Type Definitions | 1 day | P0 |
| **4** | Integration Enhancement | 1-2 days | P1 |
| **5** | CLI Dashboard | 2-3 days | P1 |
| **6** | Storage Implementation | 1-2 days | P0 |

**Total Estimated Effort:** 10-15 days

### Suggested Implementation Order

1. **Week 1: Foundation**
   - [ ] Phase 3: Core types (day 1)
   - [ ] Phase 1: History reader + parser (days 2-3)
   - [ ] Phase 6: Basic storage (day 4-5)

2. **Week 2: Analysis & Tools**
   - [ ] Phase 1: Analysis modules (days 1-2)
   - [ ] Phase 2: MCP tools (days 3-5)

3. **Week 3: Integration & Polish**
   - [ ] Phase 4: Integration enhancement (days 1-2)
   - [ ] Phase 5: CLI dashboard (days 3-5)
   - [ ] Testing & documentation

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Claude Code history format changes | High | Medium | Version detection, graceful degradation |
| Large history files cause perf issues | Medium | Medium | Streaming parser, date-based sharding |
| Context utilization scoring inaccuracy | Medium | Medium | Multiple scoring algorithms, user calibration |
| Storage grows unbounded | Low | High | Automatic pruning, configurable retention |
| Breaking changes to existing tools | High | Low | Feature flags, backward compatibility |

---

## Open Questions

1. **History Location**: How to reliably find Claude Code history across platforms?
   - macOS: `~/.config/claude/`?
   - Linux: `~/.config/claude/`?
   - Windows: `%APPDATA%/claude/`?

2. **Privacy**: Should we offer opt-in/opt-out for history reading?

3. **Real-time vs Batch**: Should analysis run in real-time or on-demand?

4. **Scoring Calibration**: How to calibrate context utilization scoring?

---

## Appendix: Default Evaluation Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| Context Overlap | 30% | How much provided context appears in response |
| Pattern Usage | 25% | Whether recommended patterns were followed |
| Error Prevention | 20% | Did agent avoid documented pitfalls |
| Tool Efficiency | 15% | Appropriate tool selection and usage |
| Response Quality | 10% | General response helpfulness |

---

## Next Steps

After approval of this plan:

1. **Confirm scope** - Are all phases needed for v1?
2. **Prioritize** - Which phase should be implemented first?
3. **Begin implementation** - Switch to ACT mode and start coding

---

*Document generated by Kahuna Planning System*
