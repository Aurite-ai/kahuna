# Common Schemas and Cross-Cutting Specifications

**Type:** Design Document
**Date:** 2026-03-08
**Status:** Stable (v1.0)
**Purpose:** Define shared schemas, formats, and architectural decisions used across multiple subsystems

**Related:**
- [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) — Parent architecture
- [`static-dynamic-integration.md`](../02-architecture/static-dynamic-integration.md) — Bayesian integration
- [`llm-agent-model.md`](../04-foundations/llm-agent-model.md) — Agent structure

---

## Executive Summary

This document resolves the P0 gaps identified in the subsystem design readiness analysis. These specifications are **prerequisites** for detailed subsystem design—without them, subsystem boundaries and contracts cannot be fully defined.

**Specifications Defined:**
1. **Episode Schema** — Formal structure for Extraction agent output
2. **Conversation Log Format** — How copilot sessions become consolidation input
3. **Salience Architecture** — Centralized rules with distributed execution
4. **Integration Decision Criteria** — When to create, update, or merge KB entries

---

## Part 1: Episode Schema

### 1.1 Overview

An **Episode** is a discrete, self-contained learning signal extracted from a copilot session. Episodes are the atomic units of knowledge that flow through the consolidation pipeline.

**Bayesian Role:** Episodes are the evidence (E) used to update the prior P(H). Each episode represents something learned during a session.

### 1.2 Episode Types

Episodes are classified by the type of learning signal they represent:

| Episode Type | Description | Example |
|--------------|-------------|---------|
| `decision` | An explicit choice or architectural decision | "We decided to use PostgreSQL for the database" |
| `error` | A mistake that was corrected | "Using `any` type was wrong; should use generics" |
| `pattern` | A recurring approach or convention observed | "This project uses barrel exports" |
| `preference` | A user preference expressed or implied | "Prefer composition over inheritance" |
| `fact` | A factual piece of project knowledge | "The API runs on port 3000" |
| `correction` | A correction to existing KB knowledge | "Actually, the service uses gRPC, not REST" |

### 1.3 Episode Schema Definition

```typescript
interface Episode {
  // === Identity ===
  id: string;                    // UUID, generated at extraction
  session_id: string;            // Source session identifier

  // === Content ===
  type: EpisodeType;             // decision | error | pattern | preference | fact | correction
  content: string;               // The extracted knowledge (natural language)
  context: string;               // Surrounding context that explains the content

  // === Source Attribution ===
  source: {
    turn_range: [number, number]; // [start_turn, end_turn] in conversation
    timestamp: string;            // ISO 8601 when this was said/discovered
    actor: 'user' | 'assistant';  // Who provided this knowledge
    explicit: boolean;            // True if directly stated, false if inferred
  };

  // === Confidence ===
  confidence: number;            // 0.0-1.0, how confident Extraction is
  confidence_rationale: string;  // Why this confidence level

  // === Relations (optional) ===
  supersedes?: string;           // Episode ID this replaces (for corrections)
  related_topics?: string[];     // Semantic tags for categorization hints
}

type EpisodeType = 'decision' | 'error' | 'pattern' | 'preference' | 'fact' | 'correction';
```

### 1.4 Episode Extraction Rules

**What to extract:**
- Explicit learning moments ("I learned...", "The answer is...")
- Error corrections ("That's wrong because...", "Actually...")
- Decisions ("We decided to...", "The approach is...")
- Preferences expressed ("I prefer...", "Always do...")
- Factual discoveries ("The system uses...", "This is configured as...")

**What NOT to extract:**
- Transient task details (specific file paths being edited)
- Debugging noise (intermediate failed attempts)
- Small talk or meta-conversation
- Information already in KB with no update

**Confidence Guidelines:**

| Scenario | Confidence Range | Rationale |
|----------|-----------------|-----------|
| User explicitly states knowledge | 0.85 - 1.0 | Direct user input is highest signal |
| User confirms assistant suggestion | 0.75 - 0.90 | Confirmation adds confidence |
| User accepts without explicit confirmation | 0.50 - 0.70 | Implicit agreement, may be passive |
| Inferred from user behavior | 0.30 - 0.50 | Pattern observed, not confirmed |
| Assistant-generated insight | 0.20 - 0.40 | Requires validation |

### 1.5 Episode Examples

**Example 1: Decision Episode**
```json
{
  "id": "ep-123e4567-e89b",
  "session_id": "sess-2026-03-08-001",
  "type": "decision",
  "content": "Use Vitest instead of Jest for testing in this project",
  "context": "User asked about testing setup. After discussing tradeoffs, user chose Vitest for its speed and native ESM support.",
  "source": {
    "turn_range": [12, 15],
    "timestamp": "2026-03-08T14:23:00Z",
    "actor": "user",
    "explicit": true
  },
  "confidence": 0.95,
  "confidence_rationale": "User explicitly stated 'Let's use Vitest' after discussion",
  "related_topics": ["testing", "tooling", "vitest"]
}
```

**Example 2: Error Episode**
```json
{
  "id": "ep-789abcde-f012",
  "session_id": "sess-2026-03-08-001",
  "type": "error",
  "content": "Do not use default exports in this codebase; use named exports only",
  "context": "Assistant suggested default export. User corrected: 'We use named exports everywhere for better tree-shaking and refactoring support.'",
  "source": {
    "turn_range": [22, 23],
    "timestamp": "2026-03-08T14:45:00Z",
    "actor": "user",
    "explicit": true
  },
  "confidence": 0.90,
  "confidence_rationale": "User explicitly corrected the approach with reasoning",
  "related_topics": ["code-style", "exports", "conventions"]
}
```

**Example 3: Pattern Episode (Inferred)**
```json
{
  "id": "ep-456def78-9012",
  "session_id": "sess-2026-03-08-001",
  "type": "pattern",
  "content": "Error handling in this codebase uses Result types rather than exceptions",
  "context": "Across multiple code samples user provided, errors are returned as Result<T, E> rather than thrown.",
  "source": {
    "turn_range": [5, 30],
    "timestamp": "2026-03-08T15:00:00Z",
    "actor": "user",
    "explicit": false
  },
  "confidence": 0.55,
  "confidence_rationale": "Pattern observed in multiple samples but never explicitly stated",
  "related_topics": ["error-handling", "patterns", "result-types"]
}
```

### 1.6 Relationship to KB Entry

Episodes are **not** KB entries. The Integration agent transforms episodes into KB entry proposals:

```
Episode (raw evidence)
    │
    │ Integration Agent analyzes
    ▼
KB Entry Proposal
    │
    │ - May become new entry
    │ - May update existing entry
    │ - May trigger merge
    │
    ▼
KB Entry (stored knowledge)
```

The episode's `confidence` propagates to the proposal and influences the final entry's confidence.

---

## Part 2: Conversation Log Format

### 2.1 Overview

A **Conversation Log** is the structured capture of a copilot session that serves as input to the Extraction agent. It preserves the information needed to extract episodes while filtering noise.

### 2.2 Log Structure

```typescript
interface ConversationLog {
  // === Session Identity ===
  session_id: string;           // Unique session identifier
  started_at: string;           // ISO 8601 session start
  ended_at: string;             // ISO 8601 session end

  // === Context ===
  mode: string;                 // Active mode (e.g., "code", "architect")
  project: string;              // Project identifier
  initial_task?: string;        // Initial task description if available

  // === Turns ===
  turns: Turn[];                // Ordered conversation turns

  // === Metadata ===
  tools_used: ToolUsage[];      // Summary of tool usage
  files_touched: string[];      // Files read/written during session
  outcome?: SessionOutcome;     // Optional: how session ended
}

interface Turn {
  index: number;                // 0-based turn index
  timestamp: string;            // ISO 8601
  role: 'user' | 'assistant';
  content: string;              // The message content

  // === Tool Calls (assistant only) ===
  tool_calls?: ToolCall[];

  // === Annotations (optional) ===
  annotations?: {
    is_correction?: boolean;    // User corrected something
    is_decision?: boolean;      // A decision was made
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
}

interface ToolCall {
  tool: string;                 // Tool name
  input: Record<string, unknown>; // Tool input (simplified)
  output_summary?: string;      // Brief summary of output (not full output)
  success: boolean;
}

interface ToolUsage {
  tool: string;
  count: number;
  success_rate: number;
}

interface SessionOutcome {
  completed: boolean;           // Did task reach completion?
  user_satisfaction?: 'satisfied' | 'neutral' | 'unsatisfied';
  notes?: string;
}
```

### 2.3 Log Capture Rules

**What to capture:**
- All user messages (full content)
- All assistant messages (full content)
- Tool calls with success/failure status
- Mode context and task description

**What to summarize (not full capture):**
- Tool outputs — only include summary, not full file contents
- Large code blocks — include reference, not full content

**What to exclude:**
- Binary file contents
- Full read_file outputs (reference the file instead)
- System/internal messages not visible to user

### 2.4 Multi-Session Handling

Sessions are **independent units** for consolidation. Each session produces its own conversation log and is processed separately.

**Cross-session relationships** are handled by the Integration agent, which queries the KB to find related entries from previous sessions.

```
Session 1 → Log 1 → Episodes 1 → Integration with KB → KB v1
Session 2 → Log 2 → Episodes 2 → Integration with KB v1 → KB v2
Session 3 → Log 3 → Episodes 3 → Integration with KB v2 → KB v3
```

### 2.5 Log Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONVERSATION LOG LIFECYCLE                            │
│                                                                          │
│   ACTIVE SESSION                                                         │
│   ──────────────                                                         │
│   MCP Server accumulates turns as session progresses                     │
│   Log stored in memory (not persisted yet)                               │
│                                                                          │
│        │                                                                 │
│        │ Session ends (user closes, timeout, explicit end)               │
│        ▼                                                                 │
│                                                                          │
│   LOG PERSISTED                                                          │
│   ─────────────                                                          │
│   Log written to temporary storage                                       │
│   Consolidation triggered (async)                                        │
│                                                                          │
│        │                                                                 │
│        │ Extraction complete                                             │
│        ▼                                                                 │
│                                                                          │
│   EPISODES EXTRACTED                                                     │
│   ──────────────────                                                     │
│   Episodes flow to Integration → Error Handling → Consolidation          │
│                                                                          │
│        │                                                                 │
│        │ Consolidation complete and verified                             │
│        ▼                                                                 │
│                                                                          │
│   LOG ARCHIVED/DELETED                                                   │
│   ────────────────────                                                   │
│   Option A: Delete (episodes are the durable form)                       │
│   Option B: Archive (keep for debugging/audit)                           │
│                                                                          │
│   [Hypothesis] Default: Archive with 30-day retention                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.6 Example Conversation Log

```json
{
  "session_id": "sess-2026-03-08-001",
  "started_at": "2026-03-08T14:00:00Z",
  "ended_at": "2026-03-08T15:30:00Z",
  "mode": "code",
  "project": "kahuna",
  "initial_task": "Add error handling to the retrieval service",

  "turns": [
    {
      "index": 0,
      "timestamp": "2026-03-08T14:00:05Z",
      "role": "user",
      "content": "I need to add proper error handling to the retrieval service. We should use Result types, not exceptions."
    },
    {
      "index": 1,
      "timestamp": "2026-03-08T14:00:30Z",
      "role": "assistant",
      "content": "I'll add Result-based error handling to the retrieval service. Let me first look at the current implementation.",
      "tool_calls": [
        {
          "tool": "read_file",
          "input": {"path": "src/retrieval/service.ts"},
          "output_summary": "RetrievalService class with search and rank methods",
          "success": true
        }
      ]
    },
    {
      "index": 2,
      "timestamp": "2026-03-08T14:01:15Z",
      "role": "assistant",
      "content": "I see the current implementation throws exceptions. I'll refactor to use Result<T, RetrievalError>..."
    }
  ],

  "tools_used": [
    {"tool": "read_file", "count": 5, "success_rate": 1.0},
    {"tool": "write_to_file", "count": 3, "success_rate": 1.0}
  ],

  "files_touched": [
    "src/retrieval/service.ts",
    "src/retrieval/types.ts",
    "src/retrieval/errors.ts"
  ],

  "outcome": {
    "completed": true,
    "user_satisfaction": "satisfied"
  }
}
```

---

## Part 3: Salience Architecture

### 3.1 Architectural Decision

**Decision:** Hybrid architecture — centralized rules with distributed execution.

**[Derived]** This follows from the triple-parallel analysis: brain has distributed attention mechanisms but consistent underlying rules (salience computation happens in multiple regions but uses shared principles).

### 3.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SALIENCE ARCHITECTURE (HYBRID)                        │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    SALIENCE RULES MODULE                         │   │
│   │                    (Centralized Definitions)                      │   │
│   │                                                                   │   │
│   │   • Factor definitions (what contributes to salience)            │   │
│   │   • Factor weights (how much each factor matters)                │   │
│   │   • Computation formulas (how to combine factors)                │   │
│   │   • Decay curves (how salience changes over time)                │   │
│   │   • Boost/penalty rules (how events affect salience)             │   │
│   │                                                                   │   │
│   └───────────────────────────┬─────────────────────────────────────┘   │
│                               │                                          │
│           ┌───────────────────┼───────────────────┐                     │
│           │                   │                   │                     │
│           ▼                   ▼                   ▼                     │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐            │
│   │   ENCODING    │   │   RETRIEVAL   │   │ CONSOLIDATION │            │
│   │               │   │               │   │               │            │
│   │ compute_      │   │ boost_on_     │   │ apply_decay   │            │
│   │ initial_      │   │ access()      │   │ ()            │            │
│   │ salience()    │   │               │   │               │            │
│   └───────────────┘   └───────────────┘   └───────────────┘            │
│                                                                          │
│   Each subsystem:                                                        │
│   • Imports rules from central module                                    │
│   • Executes computation inline (no service call)                        │
│   • Updates entry metadata directly                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Salience Factors

**[Hypothesis]** Initial factor set — subject to empirical tuning:

| Factor | Description | Range | Weight |
|--------|-------------|-------|--------|
| `source_type` | How the knowledge was acquired | 0.0-1.0 | 0.25 |
| `recency` | How recently created or accessed | 0.0-1.0 | 0.20 |
| `access_frequency` | How often retrieved and used | 0.0-1.0 | 0.20 |
| `explicit_signal` | User explicitly marked as important | 0.0-1.0 | 0.20 |
| `confidence` | How confident we are in the knowledge | 0.0-1.0 | 0.15 |

**Factor Computation:**

```typescript
// Source Type Factor
function sourceTypeFactor(source: SourceType): number {
  const weights: Record<SourceType, number> = {
    'user_explicit': 1.0,    // User directly taught
    'user_implicit': 0.8,    // Inferred from user behavior
    'inferred': 0.5,         // System inference
    'imported': 0.6,         // Imported from external source
  };
  return weights[source] ?? 0.5;
}

// Recency Factor (exponential decay)
function recencyFactor(lastAccessed: Date, now: Date): number {
  const daysSince = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
  const halfLife = 30; // days
  return Math.exp(-0.693 * daysSince / halfLife);
}

// Access Frequency Factor (log scale, capped)
function accessFrequencyFactor(accessCount: number): number {
  const maxUseful = 50; // Beyond this, diminishing returns
  return Math.min(1.0, Math.log10(accessCount + 1) / Math.log10(maxUseful + 1));
}

// Explicit Signal Factor
function explicitSignalFactor(pinned: boolean, userBoost: number): number {
  if (pinned) return 1.0;
  return Math.min(1.0, userBoost); // userBoost is 0.0-1.0
}

// Confidence Factor (direct pass-through)
function confidenceFactor(confidence: number): number {
  return confidence;
}
```

### 3.4 Salience Computation Formula

```typescript
interface SalienceFactors {
  source_type: number;
  recency: number;
  access_frequency: number;
  explicit_signal: number;
  confidence: number;
}

interface SalienceWeights {
  source_type: number;     // 0.25
  recency: number;         // 0.20
  access_frequency: number; // 0.20
  explicit_signal: number; // 0.20
  confidence: number;      // 0.15
}

function computeSalience(factors: SalienceFactors, weights: SalienceWeights): number {
  const weighted =
    factors.source_type * weights.source_type +
    factors.recency * weights.recency +
    factors.access_frequency * weights.access_frequency +
    factors.explicit_signal * weights.explicit_signal +
    factors.confidence * weights.confidence;

  // Ensure result is in [0.0, 1.0]
  return Math.max(0.0, Math.min(1.0, weighted));
}
```

### 3.5 Salience Update Events

| Event | Location | Effect |
|-------|----------|--------|
| Entry created | Encoding | Initial salience computed from source_type, confidence |
| Entry retrieved | Retrieval | Access boost: salience += 0.05 × (1 - salience) |
| Entry used in output | Retrieval (feedback) | Usage boost: salience += 0.10 × (1 - salience) |
| Time passes | Consolidation | Decay applied based on recency factor |
| User pins entry | MCP Tool | explicit_signal = 1.0, exempt from decay |
| User unpins entry | MCP Tool | explicit_signal = 0.0, decay resumes |

**Boost Formula (diminishing returns):**
```
new_salience = old_salience + boost_amount × (1 - old_salience)
```
This ensures salience approaches 1.0 asymptotically and never exceeds it.

### 3.6 Decay Mechanism

**[Hypothesis]** Exponential decay with configurable half-life:

```typescript
interface DecayConfig {
  halfLifeDays: number;      // Default: 30 days
  minSalience: number;       // Floor: 0.05 (never fully forget)
  archiveThreshold: number;  // Below this: archive (default: 0.10)
  deleteThreshold: number;   // Below this after archive: delete (default: 0.02)
}

function applyDecay(
  currentSalience: number,
  daysSinceLastAccess: number,
  config: DecayConfig
): number {
  const decayFactor = Math.exp(-0.693 * daysSinceLastAccess / config.halfLifeDays);
  const decayed = currentSalience * decayFactor;
  return Math.max(config.minSalience, decayed);
}
```

**Decay Outcomes:**
- `salience >= archiveThreshold`: Entry remains active
- `salience < archiveThreshold`: Entry moved to archive (removed from active index)
- `salience < deleteThreshold` AND in archive for > 90 days: Entry deleted

**Protection:**
- Pinned entries: Exempt from decay
- Recently created entries: No decay for first 7 days
- Referenced entries: Protected if other entries link to them

### 3.7 Salience → Attention Interface

Salience informs the Executive Function's attention allocation:

```typescript
interface SalienceSignal {
  entry_id: string;
  salience: number;           // Current salience score
  salience_trend: 'rising' | 'stable' | 'falling';
  confidence: number;         // Entry confidence
  last_accessed: string;      // ISO 8601
}

// In context guide, entries include salience signals
interface ContextGuideEntry {
  content: string;
  relevance_score: number;    // Similarity × salience
  salience_signal: SalienceSignal;
}
```

The Executive (Orchestrator) can use salience signals to:
- Prioritize high-salience entries in limited context windows
- Flag low-confidence entries for verification
- Identify knowledge that's "fading" (falling salience) that might need refresh

---

## Part 4: Integration Decision Criteria

### 4.1 Overview

The Integration agent receives episodes and must decide what to do with each:

| Decision | Meaning |
|----------|---------|
| `create` | New KB entry — knowledge doesn't exist |
| `update` | Modify existing entry — knowledge overlaps |
| `merge` | Combine multiple entries — redundancy detected |
| `skip` | No action — already in KB or not worth storing |

### 4.2 Decision Algorithm

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION DECISION FLOWCHART                        │
│                                                                          │
│   Episode arrives                                                        │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────────────┐                                                   │
│   │ Query KB for    │                                                   │
│   │ related entries │                                                   │
│   │ (semantic search│                                                   │
│   │  top 10)        │                                                   │
│   └────────┬────────┘                                                   │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐     No matches      ┌─────────────────┐          │
│   │ Any matches     │────────────────────▶│ Decision: CREATE │          │
│   │ above threshold?│                     │ (new entry)      │          │
│   │ (sim >= 0.75)   │                     └─────────────────┘          │
│   └────────┬────────┘                                                   │
│            │ Yes, matches found                                         │
│            ▼                                                             │
│   ┌─────────────────┐     Very high sim   ┌─────────────────┐          │
│   │ Highest match   │────────────────────▶│ Check: duplicate?│          │
│   │ similarity?     │     (sim >= 0.95)   └────────┬────────┘          │
│   └────────┬────────┘                              │                    │
│            │                                       ▼                    │
│            │                              ┌─────────────────┐          │
│            │                              │ Semantic equiv? │          │
│            │                              │ (LLM comparison)│          │
│            │                              └────────┬────────┘          │
│            │                                       │                    │
│            │               ┌───────────────────────┼───────────────┐   │
│            │               │ Yes, equivalent       │ No, different │   │
│            │               ▼                       ▼                   │
│            │       ┌───────────────┐       ┌───────────────┐          │
│            │       │Decision: SKIP │       │Decision: UPDATE│          │
│            │       │(already known)│       │(refine existing)│         │
│            │       └───────────────┘       └───────────────┘          │
│            │                                                            │
│            │ High sim (0.75 <= sim < 0.95)                             │
│            ▼                                                             │
│   ┌─────────────────┐                                                   │
│   │ Relationship    │                                                   │
│   │ type?           │                                                   │
│   │ (LLM analysis)  │                                                   │
│   └────────┬────────┘                                                   │
│            │                                                             │
│   ┌────────┼────────────────────────────────────┐                      │
│   │        │                                    │                      │
│   ▼        ▼                                    ▼                      │
│ SUPERSEDES       EXTENDS                    RELATED                    │
│ (episode         (episode adds             (different but              │
│  replaces        to existing)               connected)                 │
│  existing)                                                              │
│   │              │                          │                          │
│   ▼              ▼                          ▼                          │
│ Decision:      Decision:                  Decision:                    │
│ UPDATE         UPDATE                     CREATE                       │
│ (replace       (append/                   (new entry                   │
│  content)      enrich)                    + link to                    │
│                                           related)                      │
│                                                                          │
│   If multiple high matches found:                                       │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐                                                   │
│   │ Multiple entries│     Yes     ┌─────────────────┐                  │
│   │ semantically    │────────────▶│ Decision: MERGE │                  │
│   │ equivalent?     │             │ (combine into   │                  │
│   └────────┬────────┘             │  single entry)  │                  │
│            │ No                   └─────────────────┘                  │
│            ▼                                                             │
│   ┌─────────────────┐                                                   │
│   │ Decision: UPDATE│                                                   │
│   │ (update best    │                                                   │
│   │  match only)    │                                                   │
│   └─────────────────┘                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Similarity Thresholds

| Threshold | Value | Meaning |
|-----------|-------|---------|
| `DUPLICATE_THRESHOLD` | 0.95 | Almost certainly the same knowledge |
| `RELATED_THRESHOLD` | 0.75 | Likely related, needs analysis |
| `UNRELATED_THRESHOLD` | < 0.75 | Different enough to be new |

**[Hypothesis]** These thresholds are initial values. They should be tuned based on:
- False positive rate (creating duplicates)
- False negative rate (missing updates)
- Merge quality

### 4.4 Relationship Classification

When similarity is in the "related" range (0.75-0.95), the Integration agent uses LLM analysis to classify the relationship:

```typescript
type RelationshipType =
  | 'supersedes'   // Episode replaces/corrects existing
  | 'extends'      // Episode adds to existing
  | 'related'      // Different topic but connected
  | 'duplicate';   // Semantically equivalent

interface RelationshipAnalysis {
  type: RelationshipType;
  confidence: number;
  rationale: string;
  affected_entries: string[];
}
```

**Classification Prompt (Integration Agent):**

```
Given the new episode and the existing KB entry, classify their relationship:

Episode: {episode.content}
Existing Entry: {entry.content}

Classification options:
1. SUPERSEDES - The episode corrects or replaces the existing entry
2. EXTENDS - The episode adds new information to the existing entry
3. RELATED - Different knowledge but topically connected
4. DUPLICATE - Semantically equivalent (no new information)

Respond with: type, confidence (0.0-1.0), rationale
```

### 4.5 Confidence Influence

Episode confidence affects integration decisions:

| Episode Confidence | Effect on Decision |
|-------------------|-------------------|
| >= 0.80 | Can supersede lower-confidence entries |
| 0.50 - 0.79 | Can extend but not supersede |
| < 0.50 | Creates provisional entry, flagged for verification |

**Supersession Rule:**
```
Episode can supersede existing entry if:
  episode.confidence > existing_entry.confidence + 0.10
  OR
  episode.source.explicit == true AND episode.confidence >= 0.60
```

### 4.6 Proposal Structure

The Integration agent outputs proposals for each episode:

```typescript
interface IntegrationProposal {
  // === Identity ===
  proposal_id: string;
  episode_id: string;

  // === Decision ===
  action: 'create' | 'update' | 'merge' | 'skip';

  // === Targets ===
  target_entry_ids?: string[];   // For update/merge

  // === Content ===
  proposed_content?: string;     // New content (create/update)
  proposed_metadata?: {
    category: string;
    confidence: number;
    salience: number;           // Initial salience
    source_type: SourceType;
    source_ref: string;         // Session ID
    related_entries?: string[]; // Links to related entries
  };

  // === Rationale ===
  decision_rationale: string;
  relationship_analysis?: RelationshipAnalysis;

  // === Confidence ===
  proposal_confidence: number;  // Integration agent's confidence
}
```

### 4.7 Merge Criteria

Merge is proposed when:
1. Episode reveals that 2+ existing entries are semantically equivalent
2. The entries have high mutual similarity (>= 0.90)
3. Merging would reduce redundancy without losing information

**Merge Procedure:**
1. Select the entry with highest salience as "primary"
2. Append unique content from other entries
3. Combine metadata (highest confidence, union of sources)
4. Archive the non-primary entries (don't delete—provenance)
5. Update references pointing to merged entries

---

## Part 5: Cross-Cutting Concerns

### 5.1 Confidence Propagation

Confidence must propagate through the pipeline:

```
Episode.confidence (from Extraction)
        │
        │ × Integration.proposal_confidence
        ▼
Proposal.confidence
        │
        │ (Error Handling may adjust)
        ▼
Final Entry.confidence
```

**Propagation Formula:**
```typescript
function propagateConfidence(
  episodeConfidence: number,
  integrationConfidence: number,
  errorHandlingAdjustment: number = 0
): number {
  const combined = episodeConfidence * integrationConfidence;
  const adjusted = combined + errorHandlingAdjustment;
  return Math.max(0.0, Math.min(1.0, adjusted));
}
```

### 5.2 Error Handling Adjustments

Error Handling may adjust proposal confidence:

| Scenario | Adjustment |
|----------|------------|
| No conflicts detected | +0.0 (no change) |
| Conflict resolved (auto) | -0.05 (slight uncertainty) |
| Conflict resolved (source priority) | -0.10 (moderate uncertainty) |
| Escalated (unresolved) | Proposal blocked |

### 5.3 Timestamp Standards

All timestamps use ISO 8601 format in UTC:
- `2026-03-08T14:30:00Z` (preferred)
- `2026-03-08T14:30:00.123Z` (with milliseconds if needed)

### 5.4 ID Conventions

| Entity | Format | Example |
|--------|--------|---------|
| Episode | `ep-{uuid-first8}` | `ep-123e4567` |
| Session | `sess-{date}-{seq}` | `sess-2026-03-08-001` |
| Entry | `entry-{uuid-first8}` | `entry-789abcde` |
| Proposal | `prop-{uuid-first8}` | `prop-456def78` |

---

## Summary

### What This Document Establishes

1. **Episode Schema** — Formal structure for Extraction output with types, confidence, and source attribution
2. **Conversation Log Format** — Complete specification for capturing copilot sessions
3. **Salience Architecture** — Hybrid model with centralized rules and distributed execution
4. **Integration Decision Criteria** — Algorithm for create/update/merge/skip decisions

### Dependencies Resolved

| Subsystem | Gap Resolved |
|-----------|--------------|
| Consolidation | Episode Schema, Conversation Log Format, Integration Criteria |
| Attention | Salience Architecture, Factor definitions, Decay mechanism |
| Retrieval | Salience signals in context guide |
| Encoding | Initial salience computation rules |

### Next Steps

With these P0 gaps resolved:
1. Proceed with individual subsystem design documents
2. Define subsystem-specific contracts referencing these schemas
3. Implement the Salience Rules module as a shared package

---

## Changelog

- v1.0 (2026-03-08): Initial specification resolving P0 gaps
