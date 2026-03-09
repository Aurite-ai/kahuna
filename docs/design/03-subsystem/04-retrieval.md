# Retrieval Subsystem Design

**Type:** Subsystem Design Document
**Date:** 2026-03-08
**Status:** Draft (v1.0)
**Purpose:** Define the Retrieval subsystem — finding and ranking relevant KB entries for copilot context

**Related:**
- [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) — Parent architecture (subsystem boundaries, contracts)
- [`01-storage.md`](01-storage.md) — Storage interface (semantic_search, hybrid_search, read_entry)
- [`00-common-schemas.md`](00-common-schemas.md) — Salience Architecture, cross-cutting schemas
- [`static-dynamic-integration.md`](../02-architecture/static-dynamic-integration.md) — Retrieval as Likelihood Computation
- [`llm-agent-model.md`](../04-foundations/llm-agent-model.md) — Context as evidence for inference

---

## Executive Summary

The Retrieval subsystem is Kahuna's **likelihood computation engine** — it determines which KB entries are relevant to a given task and formats them for LLM consumption. This is the primary interface between the Knowledge Base (prior) and the LLM (inference engine).

**Core Responsibilities:**
- Transform task descriptions into effective retrieval queries
- Find and rank relevant KB entries using semantic similarity + salience
- Format retrieved entries as a context guide for LLM consumption
- Track access patterns for salience updates

**Bayesian Role:** Retrieval computes P(relevant | task) — the likelihood function. For each KB entry (hypothesis H), retrieval answers: "How well does this entry explain/fit the current task?" As Likelihood Computation (G4-G5 operation), Retrieval provides P(E|H) by measuring how well entries explain the query context.

**G-Level:** G0→G3
- Reads from G0 (Storage substrate)
- Applies G3 rules (ranking algorithms, mode-specific adjustments)
- Outputs G3 content (context guide containing rules/patterns for LLM)
- Bayesian Role: Likelihood computation P(relevant | task)

---

## Part 1: Component Architecture

### 1.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              RETRIEVAL SUBSYSTEM                                          │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           PUBLIC API                                             │   │
│   │                                                                                   │   │
│   │   prepare_context(task, mode, options) → ContextGuide                            │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                                  │
│                                        ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         QUERY PROCESSOR                                          │   │
│   │                                                                                   │   │
│   │   • Parse task description                                                        │   │
│   │   • Apply mode-specific adjustments                                               │   │
│   │   • Generate search queries (possibly multiple)                                   │   │
│   │   • Extract intent signals                                                        │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         SEMANTIC SEARCHER                                        │   │
│   │                                                                                   │   │
│   │   • Invoke Storage.semantic_search or hybrid_search                              │   │
│   │   • Manage candidate retrieval                                                    │   │
│   │   • Handle multi-query merging                                                    │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         RELEVANCE RANKER                                         │   │
│   │                                                                                   │   │
│   │   • Combine similarity scores with salience                                       │   │
│   │   • Apply mode-specific boosts                                                    │   │
│   │   • Apply recency factors                                                         │   │
│   │   • Enforce diversity (reduce redundancy)                                         │   │
│   │   • Produce final ranked list                                                     │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         CONTEXT WRITER                                           │   │
│   │                                                                                   │   │
│   │   • Format entries for LLM consumption                                            │   │
│   │   • Apply size limits and truncation                                              │   │
│   │   • Include confidence/relevance indicators                                       │   │
│   │   • Structure context guide                                                       │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         ACCESS TRACKER                                           │   │
│   │                                                                                   │   │
│   │   • Record which entries were retrieved                                           │   │
│   │   • Update access timestamps and counts                                           │   │
│   │   • Apply salience boosts                                                         │   │
│   │   • Queue for Attention subsystem                                                 │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Responsibilities

#### Query Processor

**Purpose:** Transform task descriptions and mode context into effective retrieval queries.

| Responsibility | Description |
|----------------|-------------|
| **Task Parsing** | Extract key concepts, entities, and intent from task description |
| **Mode Adjustment** | Apply mode-specific query modifications (e.g., architect mode emphasizes design patterns) |
| **Query Generation** | Generate one or more search queries from the task |
| **Filter Extraction** | Determine category filters, recency constraints from context |

**Owns:**
- Query transformation rules
- Mode-specific query templates
- Intent classification logic

#### Semantic Searcher

**Purpose:** Interface with Storage to retrieve candidate entries.

| Responsibility | Description |
|----------------|-------------|
| **Search Execution** | Call Storage.semantic_search or Storage.hybrid_search |
| **Multi-Query Handling** | Merge results from multiple queries |
| **Candidate Pooling** | Retrieve sufficient candidates for ranking (oversample) |
| **Filter Application** | Apply category/recency filters to search |

**Owns:**
- Search parameter defaults
- Multi-query merge strategy
- Candidate pool size configuration

#### Relevance Ranker

**Purpose:** Compute final relevance scores by combining multiple factors.

| Responsibility | Description |
|----------------|-------------|
| **Score Combination** | Combine similarity, salience, recency, confidence |
| **Mode Boosts** | Apply mode-specific relevance adjustments |
| **Diversity Enforcement** | Reduce redundancy in results |
| **Final Ranking** | Produce sorted list by combined relevance |

**Owns:**
- Relevance scoring algorithm
- Weight configuration
- Diversity parameters

#### Context Writer

**Purpose:** Format retrieved entries into a context guide optimized for LLM consumption.

| Responsibility | Description |
|----------------|-------------|
| **Content Formatting** | Structure entries for readability |
| **Metadata Inclusion** | Add confidence/relevance indicators |
| **Size Management** | Apply token limits and truncation |
| **Section Organization** | Group entries by category or relevance tier |

**Owns:**
- Context guide template
- Truncation rules
- Size limits

#### Access Tracker

**Purpose:** Record access patterns for salience updates.

| Responsibility | Description |
|----------------|-------------|
| **Access Recording** | Log which entries were retrieved |
| **Timestamp Update** | Update last_accessed in metadata |
| **Salience Boost** | Apply access-based salience increase |
| **Async Processing** | Queue updates for batch processing |

**Owns:**
- Access logging format
- Boost calculation
- Async update strategy

---

## Part 2: Data Structures

### 2.1 Input Schema

```typescript
interface PrepareContextInput {
  // === Task Description ===
  task: string;                    // Natural language task description

  // === Mode Context ===
  mode: string;                    // Active mode (e.g., "code", "architect", "debug")
  mode_context?: {
    files_in_scope?: string[];     // Files currently being worked on
    recent_actions?: string[];     // Recent tool calls or actions
  };

  // === Options ===
  options?: RetrievalOptions;
}

interface RetrievalOptions {
  // === Filtering ===
  categories?: string[];           // Include only these categories
  exclude_categories?: string[];   // Exclude these categories
  min_confidence?: number;         // Minimum confidence threshold (default: 0.0)
  max_age_days?: number;           // Only entries updated within N days

  // === Ranking Adjustments ===
  recency_boost?: number;          // Weight for recency factor (default: 0.1)
  diversity_threshold?: number;    // Similarity threshold for diversity (default: 0.85)

  // === Output Control ===
  max_entries?: number;            // Maximum entries to return (default: 10)
  max_tokens?: number;             // Maximum total tokens in output (default: 4000)
  include_metadata?: boolean;      // Include confidence/salience in output (default: true)

  // === Search Strategy ===
  search_type?: 'semantic' | 'hybrid' | 'auto';  // default: 'auto'
}
```

### 2.2 Output Schema: Context Guide

```typescript
interface ContextGuide {
  // === Metadata ===
  generated_at: string;            // ISO 8601 timestamp
  task_summary: string;            // Brief summary of the task
  mode: string;                    // Mode context was generated for

  // === Retrieved Entries ===
  entries: ContextEntry[];         // Ranked, formatted entries

  // === Statistics ===
  stats: {
    total_candidates: number;      // Entries considered
    entries_included: number;      // Entries in output
    tokens_used: number;           // Approximate token count
    search_time_ms: number;        // Search latency
  };

  // === Warnings ===
  warnings?: string[];             // Any issues encountered
}

interface ContextEntry {
  // === Identity ===
  entry_id: string;
  title: string;
  category: string;

  // === Content ===
  content: string;                 // Full or truncated content
  truncated: boolean;              // Was content truncated?

  // === Relevance Signals ===
  relevance: {
    score: number;                 // Combined relevance score (0.0-1.0)
    similarity: number;            // Semantic similarity (0.0-1.0)
    salience: number;              // Entry salience (0.0-1.0)
    confidence: number;            // Entry confidence (0.0-1.0)
    tier: 'high' | 'medium' | 'low';  // Relevance tier for quick reference
  };

  // === Source ===
  source_type: string;             // How this knowledge was acquired
  last_accessed: string;           // When last retrieved
}
```

### 2.3 Internal Data Structures

```typescript
// Query generated from task
interface RetrievalQuery {
  text: string;                    // Query text for embedding
  weight: number;                  // Importance weight for multi-query merge
  filters: SearchFilters;          // Filters to apply
  intent?: QueryIntent;            // Classified intent
}

type QueryIntent =
  | 'information_lookup'     // "What is X?"
  | 'how_to'                 // "How do I X?"
  | 'decision_support'       // "Should I X or Y?"
  | 'pattern_match'          // "What patterns apply to X?"
  | 'error_resolution'       // "Why is X failing?"
  | 'general';               // Unclassified

// Candidate entry with scores
interface ScoredCandidate {
  entry_id: string;
  file_path: string;
  title: string;
  category: string;
  content: string;

  // Individual scores
  similarity: number;              // From semantic search
  salience: number;                // From metadata
  confidence: number;              // From metadata
  recency: number;                 // Computed from last_accessed

  // Combined score
  relevance_score: number;         // Final combined score
}

// Mode-specific configuration
interface ModeConfig {
  mode: string;
  category_weights: Record<string, number>;  // Boost/penalize categories
  recency_importance: 'high' | 'medium' | 'low';
  preferred_entry_types: string[];
  max_entries?: number;            // Mode-specific default
}
```

---

## Part 3: Relevance Scoring Algorithm

### 3.1 Algorithm Overview

The relevance scoring algorithm combines multiple factors to produce a final score representing P(relevant | task):

```
relevance_score = combine(similarity, salience, recency, confidence, mode_boost)
```

### 3.2 Factor Computation

#### Similarity Factor

Similarity comes directly from Storage's semantic search (or hybrid search):

```typescript
// Similarity is normalized to [0, 1] by the search algorithm
// Higher = more semantically similar to query
similarity: number;  // 0.0 - 1.0
```

#### Salience Factor

Salience is retrieved from entry metadata (computed by Attention subsystem):

```typescript
// Salience represents prior importance
// See 00-common-schemas.md for salience computation
salience: number;  // 0.0 - 1.0
```

#### Recency Factor

Recency boosts recently accessed/updated entries:

```typescript
/**
 * Compute recency factor for query-time ranking.
 *
 * NOTE: This recency factor (14-day half-life) is ADDITIONAL to the recency
 * already embedded in effective_salience from the Attention subsystem (30-day
 * half-life). The different half-lives serve different purposes:
 *
 * - Attention's recency (30-day): Persistent decay for long-term salience
 * - Retrieval's recency (14-day): Query-time boost for recently-used entries
 *
 * Combined effect: Recently accessed entries get a strong ranking boost
 * beyond their baseline salience decay.
 */
function computeRecencyFactor(lastAccessed: Date, now: Date): number {
  const daysSince = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
  const halfLife = 14;  // days - entries half as "recent" after 14 days
  return Math.exp(-0.693 * daysSince / halfLife);
}
// Returns: 1.0 for just accessed, ~0.5 after 14 days, ~0.25 after 28 days
```

#### Confidence Factor

Confidence comes from entry metadata:

```typescript
// Confidence represents belief strength in this knowledge
// Higher confidence = more likely to be accurate
confidence: number;  // 0.0 - 1.0
```

#### Mode Boost Factor

Mode-specific adjustments based on category relevance:

```typescript
function computeModeBoost(entry: ScoredCandidate, modeConfig: ModeConfig): number {
  const categoryWeight = modeConfig.category_weights[entry.category] ?? 1.0;
  const typeMatch = modeConfig.preferred_entry_types.includes(entry.category) ? 1.1 : 1.0;
  return categoryWeight * typeMatch;
}
// Returns: Typically 0.8 - 1.3 range
```

### 3.3 Score Combination Formula

**[Hypothesis]** Weighted geometric mean with mode boost multiplier:

```typescript
interface RelevanceWeights {
  similarity: number;     // Default: 0.50
  salience: number;       // Default: 0.20
  recency: number;        // Default: 0.10
  confidence: number;     // Default: 0.20
}

function computeRelevanceScore(
  candidate: ScoredCandidate,
  modeConfig: ModeConfig,
  weights: RelevanceWeights
): number {
  // Weighted sum of factors
  const baseScore =
    weights.similarity * candidate.similarity +
    weights.salience * candidate.salience +
    weights.recency * candidate.recency +
    weights.confidence * candidate.confidence;

  // Apply mode boost
  const modeBoost = computeModeBoost(candidate, modeConfig);

  // Final score (clamped to [0, 1])
  return Math.max(0, Math.min(1, baseScore * modeBoost));
}
```

**Why this formula:**
- **Weighted sum** allows tuning factor importance
- **Similarity dominates** (0.50) because semantic match is primary signal
- **Salience contributes** (0.20) because prior importance matters
- **Confidence contributes** (0.20) because belief strength affects reliability
- **Recency minor** (0.10) because freshness is situational
- **Mode boost as multiplier** allows mode to amplify/dampen without changing base ranking

### 3.4 Mode-Specific Configurations

Mode configurations are defined canonically in the **Attention subsystem** ([`06-attention.md`](06-attention.md) Part 5.1). Retrieval imports these configurations at runtime rather than duplicating them.

```typescript
// Mode configurations imported from Attention subsystem.
// See: 06-attention.md Part 5.1 for canonical definitions.
//
// At runtime, Retrieval obtains configs via: attention.getModeConfig(mode)
//
// Example structure (for reference only - canonical values in Attention):
interface ModeConfig {
  mode: string;
  category_weights: Record<string, number>;  // e.g., errors: 1.4, patterns: 1.3
  recency_importance: 'high' | 'medium' | 'low';
  preferred_entry_types: string[];
  max_entries?: number;
}

// Default for unrecognized modes
const DEFAULT_MODE_CONFIG: ModeConfig = {
  mode: 'default',
  category_weights: {},    // All neutral (1.0)
  recency_importance: 'medium',
  preferred_entry_types: [],
  max_entries: 10,
};
```

> **Design Note:** The Attention subsystem owns mode configurations to ensure consistency across the system. Retrieval references these canonical values rather than maintaining duplicate definitions that could drift out of sync.

### 3.5 Diversity Enforcement

To avoid redundant entries, apply similarity-based diversity filtering:

```typescript
interface DiversityConfig {
  similarity_threshold: number;  // Default: 0.85
  max_per_category: number;      // Default: 4
}

function enforceDeversity(
  candidates: ScoredCandidate[],
  config: DiversityConfig
): ScoredCandidate[] {
  const result: ScoredCandidate[] = [];
  const categoryCount: Record<string, number> = {};

  // Candidates already sorted by relevance_score descending
  for (const candidate of candidates) {
    // Check category limit
    const catCount = categoryCount[candidate.category] ?? 0;
    if (catCount >= config.max_per_category) {
      continue;
    }

    // Check similarity to already-selected entries
    const tooSimilar = result.some(selected =>
      computeContentSimilarity(selected.content, candidate.content) > config.similarity_threshold
    );

    if (!tooSimilar) {
      result.push(candidate);
      categoryCount[candidate.category] = catCount + 1;
    }
  }

  return result;
}

// Approximate content similarity using character-level Jaccard
function computeContentSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
```

### 3.6 Relevance Tiers

Classify entries into tiers for quick LLM reference:

```typescript
function computeRelevanceTier(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}
```

---

## Part 4: Query Processing

### 4.0 Design Decision: Rule-Based Query Processing

**[Hypothesis]** Query processing uses deterministic pattern-matching rather than LLM inference.

**Rationale:**
- **Speed:** LLM calls add ~1-2s latency; retrieval should be <200ms total
- **Predictability:** Deterministic behavior aids debugging and testing
- **Simplicity:** Current patterns (intent classification, concept extraction) don't require LLM reasoning

**Implementation:** The [`classifyIntent()`](#42-intent-classification) and [`extractConcepts()`](#44-concept-extraction) functions use regex patterns and keyword matching, not LLM inference.

**Future consideration:** If query understanding proves inadequate for complex tasks, introduce a Query Processor agent with GRSO specification per [`llm-agent-model.md`](../04-foundations/llm-agent-model.md). Current implementation prioritizes latency.

### 4.1 Query Processor Algorithm

```typescript
async function processQuery(input: PrepareContextInput): Promise<RetrievalQuery[]> {
  const { task, mode, mode_context, options } = input;

  // 1. Classify intent
  const intent = classifyIntent(task);

  // 2. Extract key concepts
  const concepts = extractConcepts(task);

  // 3. Build base query
  const baseQuery: RetrievalQuery = {
    text: task,
    weight: 1.0,
    filters: buildFilters(options, mode),
    intent,
  };

  // 4. Generate additional queries based on intent
  const additionalQueries = generateIntentQueries(task, intent, concepts);

  // 5. Apply mode adjustments
  const queries = applyModeAdjustments([baseQuery, ...additionalQueries], mode);

  return queries;
}
```

### 4.2 Intent Classification

```typescript
function classifyIntent(task: string): QueryIntent {
  const taskLower = task.toLowerCase();

  // Pattern matching for intent
  if (/\b(what is|what are|explain|describe|tell me about)\b/.test(taskLower)) {
    return 'information_lookup';
  }
  if (/\b(how (do|can|should|to)|implement|create|build|add)\b/.test(taskLower)) {
    return 'how_to';
  }
  if (/\b(should i|which|choose|decide|compare|vs\b|versus)\b/.test(taskLower)) {
    return 'decision_support';
  }
  if (/\b(pattern|convention|best practice|standard|typical)\b/.test(taskLower)) {
    return 'pattern_match';
  }
  if (/\b(error|bug|fix|fail|broken|wrong|issue|problem|debug)\b/.test(taskLower)) {
    return 'error_resolution';
  }

  return 'general';
}
```

### 4.3 Multi-Query Strategy

For complex tasks, generate multiple queries to improve coverage:

```typescript
function generateIntentQueries(
  task: string,
  intent: QueryIntent,
  concepts: string[]
): RetrievalQuery[] {
  const queries: RetrievalQuery[] = [];

  switch (intent) {
    case 'error_resolution':
      // Add query for related errors
      queries.push({
        text: `error ${concepts.join(' ')}`,
        weight: 0.8,
        filters: { categories: ['errors'] },
      });
      // Add query for patterns that might prevent errors
      queries.push({
        text: `best practice ${concepts.join(' ')}`,
        weight: 0.5,
        filters: { categories: ['patterns'] },
      });
      break;

    case 'decision_support':
      // Add query for related decisions
      queries.push({
        text: `decision ${concepts.join(' ')}`,
        weight: 0.8,
        filters: { categories: ['decisions'] },
      });
      break;

    case 'how_to':
      // Add query for patterns
      queries.push({
        text: `pattern ${concepts.join(' ')}`,
        weight: 0.7,
        filters: { categories: ['patterns'] },
      });
      // Add query for related conventions
      queries.push({
        text: `convention ${concepts.join(' ')}`,
        weight: 0.5,
        filters: { categories: ['preferences'] },
      });
      break;

    // Other intents use single query
    default:
      break;
  }

  return queries;
}
```

### 4.4 Concept Extraction

Simple keyword extraction for query augmentation:

```typescript
function extractConcepts(task: string): string[] {
  // Remove common words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'this',
    'that', 'these', 'those', 'what', 'which', 'who', 'how', 'when',
    'where', 'why', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now',
  ]);

  const words = task
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Deduplicate and take top concepts
  return [...new Set(words)].slice(0, 5);
}
```

### 4.5 Filter Building

```typescript
function buildFilters(
  options: RetrievalOptions | undefined,
  mode: string
): SearchFilters {
  const filters: SearchFilters = {};

  // Apply explicit category filters
  if (options?.categories) {
    filters.categories = options.categories;
  }
  if (options?.exclude_categories) {
    filters.exclude_categories = options.exclude_categories;
  }

  // Apply confidence filter
  if (options?.min_confidence !== undefined) {
    filters.min_confidence = options.min_confidence;
  }

  // Apply recency filter
  if (options?.max_age_days !== undefined) {
    filters.max_age_days = options.max_age_days;
  }

  // Apply minimum salience (don't retrieve decayed entries)
  filters.min_salience = 0.05;  // Default floor

  return filters;
}
```

---

## Part 5: Context Guide Format

### 5.1 Format Design Principles

The context guide format is optimized for LLM consumption:

1. **Structured for scanning** — Clear sections and headers
2. **Relevance-prioritized** — Most relevant entries first
3. **Metadata-transparent** — Confidence/relevance visible to LLM
4. **Token-efficient** — No redundant formatting
5. **Action-oriented** — Emphasizes actionable knowledge

### 5.2 Context Guide Template

```markdown
# Context Guide

**Task:** [Brief task summary]
**Mode:** [Active mode]
**Generated:** [Timestamp]

---

## High Relevance

### [Entry Title] ▸ [Category]
**Relevance:** ●●●○○ (0.85) | **Confidence:** High | **Source:** User-explicit

[Entry content, possibly truncated]

---

### [Entry Title] ▸ [Category]
**Relevance:** ●●●○○ (0.78) | **Confidence:** Medium | **Source:** Inferred

[Entry content]

---

## Medium Relevance

### [Entry Title] ▸ [Category]
**Relevance:** ●●○○○ (0.52) | **Confidence:** High | **Source:** User-explicit

[Entry content]

---

## Additional Context

[Lower relevance entries if space permits]

---

*Retrieved [N] entries from [M] candidates in [X]ms*
```

### 5.3 Context Writer Implementation

```typescript
interface ContextWriterConfig {
  max_tokens: number;              // Default: 4000
  max_entry_tokens: number;        // Default: 800 per entry
  include_metadata: boolean;       // Default: true
  group_by_relevance: boolean;     // Default: true
}

function writeContextGuide(
  entries: ContextEntry[],
  task: string,
  mode: string,
  stats: ContextGuideStats,
  config: ContextWriterConfig
): string {
  const lines: string[] = [];

  // Header
  lines.push('# Context Guide\n');
  lines.push(`**Task:** ${summarizeTask(task)}`);
  lines.push(`**Mode:** ${mode}`);
  lines.push(`**Generated:** ${new Date().toISOString()}\n`);
  lines.push('---\n');

  // Group entries by relevance tier
  const highRelevance = entries.filter(e => e.relevance.tier === 'high');
  const mediumRelevance = entries.filter(e => e.relevance.tier === 'medium');
  const lowRelevance = entries.filter(e => e.relevance.tier === 'low');

  let tokensUsed = estimateTokens(lines.join('\n'));

  // High relevance section
  if (highRelevance.length > 0) {
    lines.push('## High Relevance\n');
    for (const entry of highRelevance) {
      const entryText = formatEntry(entry, config);
      const entryTokens = estimateTokens(entryText);
      if (tokensUsed + entryTokens > config.max_tokens) break;
      lines.push(entryText);
      tokensUsed += entryTokens;
    }
  }

  // Medium relevance section
  if (mediumRelevance.length > 0 && tokensUsed < config.max_tokens * 0.8) {
    lines.push('## Medium Relevance\n');
    for (const entry of mediumRelevance) {
      const entryText = formatEntry(entry, config);
      const entryTokens = estimateTokens(entryText);
      if (tokensUsed + entryTokens > config.max_tokens) break;
      lines.push(entryText);
      tokensUsed += entryTokens;
    }
  }

  // Low relevance only if significant space remains
  if (lowRelevance.length > 0 && tokensUsed < config.max_tokens * 0.6) {
    lines.push('## Additional Context\n');
    for (const entry of lowRelevance) {
      const entryText = formatEntry(entry, config);
      const entryTokens = estimateTokens(entryText);
      if (tokensUsed + entryTokens > config.max_tokens) break;
      lines.push(entryText);
      tokensUsed += entryTokens;
    }
  }

  // Footer
  lines.push('---\n');
  lines.push(`*Retrieved ${stats.entries_included} entries from ${stats.total_candidates} candidates in ${stats.search_time_ms}ms*`);

  return lines.join('\n');
}

function formatEntry(entry: ContextEntry, config: ContextWriterConfig): string {
  const lines: string[] = [];

  // Header
  lines.push(`### ${entry.title} ▸ ${entry.category}`);

  // Metadata line
  if (config.include_metadata) {
    const relevanceIndicator = formatRelevanceIndicator(entry.relevance.score);
    const confidenceLabel = entry.relevance.confidence >= 0.8 ? 'High' :
                            entry.relevance.confidence >= 0.5 ? 'Medium' : 'Low';
    lines.push(`**Relevance:** ${relevanceIndicator} (${entry.relevance.score.toFixed(2)}) | **Confidence:** ${confidenceLabel} | **Source:** ${formatSourceType(entry.source_type)}`);
    lines.push('');
  }

  // Content (truncated if needed)
  let content = entry.content;
  const contentTokens = estimateTokens(content);
  if (contentTokens > config.max_entry_tokens) {
    content = truncateToTokens(content, config.max_entry_tokens);
    content += '\n\n*[Truncated]*';
  }
  lines.push(content);

  lines.push('\n---\n');

  return lines.join('\n');
}

function formatRelevanceIndicator(score: number): string {
  const filled = Math.round(score * 5);
  return '●'.repeat(filled) + '○'.repeat(5 - filled);
}

function formatSourceType(source: string): string {
  const labels: Record<string, string> = {
    'user_explicit': 'User-explicit',
    'user_implicit': 'User-implicit',
    'inferred': 'Inferred',
    'imported': 'Imported',
    'consolidated': 'Consolidated',
    'system': 'System',
  };
  return labels[source] ?? source;
}
```

### 5.4 Token Estimation

```typescript
// Rough token estimation (GPT-style: ~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;

  // Truncate at word boundary
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace > 0 ? lastSpace : maxChars);
}
```

---

## Part 6: Access Tracking

### 6.1 Access Tracking Strategy

Access tracking serves two purposes:
1. **Metadata updates** — Keep `last_accessed` and `access_count` current
2. **Salience feedback** — Boost salience for frequently-used entries

**[Hypothesis]** Async batch updates for performance:

```typescript
interface AccessRecord {
  entry_id: string;
  accessed_at: string;           // ISO 8601
  context: string;               // Brief description of why accessed
  included_in_output: boolean;   // Was this entry included in context guide?
}

class AccessTracker {
  private pendingUpdates: AccessRecord[] = [];
  private readonly batchSize = 10;
  private readonly flushIntervalMs = 5000;

  constructor(private storage: Storage) {
    // Set up periodic flush
    setInterval(() => this.flush(), this.flushIntervalMs);
  }

  /**
   * Record an access event.
   * Updates are batched for efficiency.
   */
  recordAccess(record: AccessRecord): void {
    this.pendingUpdates.push(record);

    // Flush if batch is full
    if (this.pendingUpdates.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush pending updates to storage.
   */
  async flush(): Promise<void> {
    if (this.pendingUpdates.length === 0) return;

    const updates = this.pendingUpdates;
    this.pendingUpdates = [];

    // Group updates by entry
    const byEntry = new Map<string, AccessRecord[]>();
    for (const record of updates) {
      const existing = byEntry.get(record.entry_id) ?? [];
      existing.push(record);
      byEntry.set(record.entry_id, existing);
    }

    // Apply updates
    const metadataUpdates: MetadataUpdate[] = [];
    for (const [entryId, records] of byEntry) {
      // Use most recent access time
      const latestAccess = records.reduce((latest, r) =>
        r.accessed_at > latest ? r.accessed_at : latest,
        records[0].accessed_at
      );

      // Compute salience boost
      const includedCount = records.filter(r => r.included_in_output).length;
      const salienceBoost = computeAccessBoost(includedCount);

      metadataUpdates.push({
        entry_id: entryId,
        last_accessed: latestAccess,
        access_count_increment: records.length,
        salience_boost: salienceBoost,
      });
    }

    // Batch update via storage
    await this.storage.update_metadata_batch({ updates: metadataUpdates });
  }
}
```

### 6.2 Salience Boost Calculation

From [`00-common-schemas.md`](00-common-schemas.md), access boost uses diminishing returns:

```typescript
/**
 * Compute salience boost for access event.
 * Uses diminishing returns formula from Salience Architecture.
 */
function computeAccessBoost(includedInOutputCount: number): number {
  // Base boost for any retrieval
  const baseBoost = 0.02;

  // Additional boost for inclusion in output
  const inclusionBoost = includedInOutputCount > 0 ? 0.05 : 0;

  return baseBoost + inclusionBoost;
}

/**
 * Apply boost with diminishing returns.
 * new_salience = old_salience + boost × (1 - old_salience)
 */
function applyBoostWithDiminishingReturns(
  currentSalience: number,
  boost: number
): number {
  const newSalience = currentSalience + boost * (1 - currentSalience);
  return Math.min(1.0, newSalience);
}
```

### 6.3 Access Event Recording

Record access events during retrieval:

```typescript
function recordRetrievalAccess(
  candidates: ScoredCandidate[],
  includedEntryIds: Set<string>,
  taskSummary: string,
  tracker: AccessTracker
): void {
  const now = new Date().toISOString();

  for (const candidate of candidates) {
    tracker.recordAccess({
      entry_id: candidate.entry_id,
      accessed_at: now,
      context: taskSummary,
      included_in_output: includedEntryIds.has(candidate.entry_id),
    });
  }
}
```

---

## Part 7: Integration Contracts

### 7.1 Public API: prepare_context

The primary interface exposed to MCP tools:

```typescript
interface PrepareContextAPI {
  /**
   * Prepare context guide for a task.
   *
   * @param input - Task description, mode, and options
   * @returns Context guide formatted for LLM consumption
   */
  prepare_context(input: PrepareContextInput): Promise<ContextGuide>;
}
```

**Preconditions:**
- Storage subsystem initialized and accessible
- Task description is non-empty

**Postconditions:**
- Context guide returned with 0+ entries
- Access tracking recorded for all candidates
- Stats include timing information

**Errors:**
- `STORAGE_UNAVAILABLE` — Cannot access KB
- `INDEX_UNAVAILABLE` — Semantic index not ready
- `EMBEDDING_FAILURE` — Failed to embed query

### 7.2 Retrieval → Storage Contract

Retrieval depends on Storage for search and read operations:

```typescript
// Semantic search for candidates
const searchResults = await storage.semantic_search({
  query: queryText,
  filters: {
    categories: options?.categories,
    exclude_categories: options?.exclude_categories,
    min_salience: 0.05,
    min_confidence: options?.min_confidence,
    max_age_days: options?.max_age_days,
  },
  limit: candidatePoolSize,  // Oversample for ranking
});

// Hybrid search when appropriate
const hybridResults = await storage.hybrid_search({
  query: queryText,
  semantic_weight: 0.7,
  keyword_weight: 0.3,
  filters: {
    categories: options?.categories,
    exclude_categories: options?.exclude_categories,
    min_salience: 0.05,
    min_confidence: options?.min_confidence,
    max_age_days: options?.max_age_days,
  },
  limit: candidatePoolSize,
});

// Read full entries for context guide
const entries = await storage.read_entries_batch({
  entry_ids: topEntryIds,
  include_content: true,
});
```

**Contract obligations:**
- Retrieval respects Storage's search result format
- Retrieval uses Storage's error types
- Retrieval does NOT modify entries (read-only during retrieval)

### 7.3 Retrieval → Attention Contract

Retrieval reports access events to the Attention subsystem (via Storage):

```typescript
// After retrieval, record access for salience updates
await storage.update_metadata_batch({
  updates: accessRecords.map(r => ({
    entry_id: r.entry_id,
    salience: currentSalience + computeAccessBoost(r),
  })),
});
```

**Implementation Note:** The `record_access` operation referenced in abstract architecture is a logical operation implemented via `storage.update_metadata_batch()`. There is no separate `record_access` API — access tracking is a logical operation that uses the standard metadata update mechanism.

**Contract obligations:**
- Retrieval uses salience from metadata (doesn't recompute)
- Retrieval applies access boosts via Storage API
- Boost formula follows Attention subsystem rules

### 7.4 MCP Tool → Retrieval Contract

The MCP tool `kahuna_prepare_context` invokes Retrieval:

```typescript
// MCP tool handler
async function kahuna_prepare_context(args: MCPToolArgs): Promise<MCPToolResult> {
  const input: PrepareContextInput = {
    task: args.task,
    mode: args.mode ?? 'default',
    mode_context: args.context,
    options: {
      max_entries: args.limit,
      max_tokens: args.max_tokens,
      categories: args.categories,
    },
  };

  const contextGuide = await retrieval.prepare_context(input);

  return {
    content: contextGuide.formatted,  // Markdown string
    metadata: contextGuide.stats,
  };
}
```

---

## Part 8: Implementation Considerations

### 8.1 Component Dependencies

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RETRIEVAL DEPENDENCY GRAPH                            │
│                                                                          │
│   ┌─────────────────┐                                                    │
│   │ QUERY PROCESSOR │                                                    │
│   │                 │ (no dependencies)                                  │
│   └────────┬────────┘                                                    │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐     ┌─────────────────┐                           │
│   │ SEMANTIC        │────▶│ STORAGE         │                           │
│   │ SEARCHER        │     │ SUBSYSTEM       │                           │
│   └────────┬────────┘     └─────────────────┘                           │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐                                                    │
│   │ RELEVANCE       │                                                    │
│   │ RANKER          │ (uses salience from metadata)                     │
│   └────────┬────────┘                                                    │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐                                                    │
│   │ CONTEXT WRITER  │                                                    │
│   │                 │ (no dependencies)                                  │
│   └────────┬────────┘                                                    │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐     ┌─────────────────┐                           │
│   │ ACCESS TRACKER  │────▶│ STORAGE         │                           │
│   │                 │     │ SUBSYSTEM       │                           │
│   └─────────────────┘     └─────────────────┘                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Initialization Sequence

```typescript
async function initializeRetrieval(storage: Storage): Promise<RetrievalSubsystem> {
  // 1. Load mode configurations
  const modeConfigs = loadModeConfigs();

  // 2. Initialize components
  const queryProcessor = new QueryProcessor();
  const semanticSearcher = new SemanticSearcher(storage);
  const relevanceRanker = new RelevanceRanker(modeConfigs);
  const contextWriter = new ContextWriter();
  const accessTracker = new AccessTracker(storage);

  // 3. Create subsystem instance
  return new RetrievalSubsystem({
    queryProcessor,
    semanticSearcher,
    relevanceRanker,
    contextWriter,
    accessTracker,
  });
}
```

### 8.3 Performance Targets

| Operation | Target Latency | Strategy |
|-----------|---------------|----------|
| Query processing | < 10ms | Simple string operations |
| Semantic search | < 100ms | Depends on Storage subsystem |
| Relevance ranking | < 20ms | In-memory scoring |
| Context writing | < 30ms | String formatting |
| Access tracking | Async | Batched, non-blocking |
| **Total prepare_context** | < 200ms | Parallel where possible |

### 8.4 Caching Strategy

```typescript
interface RetrievalCache {
  // Query → SearchResults cache (short TTL)
  queryCache: LRUCache<string, SearchResult[]>;

  // Mode config cache (long TTL, invalidate on config change)
  modeConfigCache: Map<string, ModeConfig>;
}

// Cache configuration
const CACHE_CONFIG = {
  query_cache_size: 100,
  query_cache_ttl_ms: 30000,  // 30 seconds
  mode_config_ttl_ms: 3600000,  // 1 hour
};
```

**Cache invalidation:**
- Query cache: TTL-based expiration
- Mode config cache: Invalidate on config file change
- No caching of entry content (always fresh from Storage)

### 8.5 Error Handling

```typescript
type RetrievalError =
  | { code: 'STORAGE_UNAVAILABLE'; reason: string }
  | { code: 'INDEX_UNAVAILABLE'; reason: string }
  | { code: 'EMBEDDING_FAILURE'; reason: string }
  | { code: 'TIMEOUT'; operation: string; elapsed_ms: number }
  | { code: 'EMPTY_RESULTS'; query: string }
  | { code: 'TOKEN_BUDGET_EXCEEDED'; requested: number; available: number };

async function handleRetrievalError(
  error: RetrievalError,
  query: RetrievalQuery,
  storage: Storage
): Promise<ContextGuide> {
  switch (error.code) {
    case 'INDEX_UNAVAILABLE':
      // Fallback: metadata-only query (no semantic similarity)
      const metadataResults = await storage.query_metadata({
        categories: query.filters?.categories,
        min_salience: query.filters?.min_salience ?? 0.1,
        sort_by: 'salience',
        sort_order: 'desc',
        limit: 10,
      });
      return buildContextGuideFromMetadata(metadataResults, {
        warning: 'Semantic search unavailable; results based on metadata only',
      });

    case 'EMBEDDING_FAILURE':
      // Fallback: keyword search only (no semantic)
      const keywordResults = await storage.hybrid_search({
        query: query.text,
        semantic_weight: 0,
        keyword_weight: 1.0,
        filters: query.filters,
        limit: 10,
      });
      return buildContextGuide(keywordResults, {
        warning: 'Embedding failed; results based on keyword matching only',
      });

    case 'EMPTY_RESULTS':
      // Return empty context guide with explanation
      return {
        generated_at: new Date().toISOString(),
        task_summary: query.text,
        mode: 'unknown',
        entries: [],
        stats: { total_candidates: 0, entries_included: 0, tokens_used: 0, search_time_ms: 0 },
        warnings: ['No entries matched the query. The knowledge base may not contain relevant information.'],
      };

    case 'TOKEN_BUDGET_EXCEEDED':
      // Truncate to fit budget and warn
      return buildContextGuide(partialResults, {
        warning: `Token budget exceeded (${error.requested} requested, ${error.available} available). Results truncated.`,
      });

    case 'TIMEOUT':
      // Return whatever results were gathered before timeout
      return buildContextGuide(partialResults ?? [], {
        warning: `Search timed out after ${error.elapsed_ms}ms. Results may be incomplete.`,
      });

    case 'STORAGE_UNAVAILABLE':
      // Cannot recover - rethrow
      throw error;

    default:
      throw error;
  }
}
```

---

## Part 9: Testing Strategy

### 9.1 Unit Tests

| Component | Test Focus |
|-----------|------------|
| **Query Processor** | Intent classification, concept extraction, filter building |
| **Semantic Searcher** | Multi-query merging, filter application |
| **Relevance Ranker** | Score computation, diversity enforcement, mode boosts |
| **Context Writer** | Formatting, truncation, token limits |
| **Access Tracker** | Batching, boost calculation |

### 9.2 Integration Tests

| Scenario | Verification |
|----------|--------------|
| End-to-end retrieval | Task → Context guide with correct entries |
| Mode-specific ranking | Different modes produce different rankings |
| Salience influence | High-salience entries rank higher |
| Diversity enforcement | No redundant entries in output |
| Access tracking | Metadata updated after retrieval |

### 9.3 Calibration Tests

From [`static-dynamic-integration.md`](../02-architecture/static-dynamic-integration.md):

```typescript
// Test that relevance ranking matches expected behavior
test('calibration: known-relevant entries rank highly', async () => {
  // Given: entries known to be relevant for a task
  const knownRelevant = ['entry-auth-001', 'entry-auth-002'];
  const task = 'Implement user authentication';

  // When: retrieval runs
  const result = await retrieval.prepare_context({ task, mode: 'code' });

  // Then: known-relevant entries should be in top results
  const topIds = result.entries.slice(0, 5).map(e => e.entry_id);
  expect(knownRelevant.every(id => topIds.includes(id))).toBe(true);
});
```

---

## Summary

### What This Document Establishes

1. **Component architecture** — Five components (Query Processor, Semantic Searcher, Relevance Ranker, Context Writer, Access Tracker) with clear responsibilities
2. **Relevance scoring algorithm** — Weighted combination of similarity, salience, recency, confidence with mode-specific boosts
3. **Context guide format** — Structured markdown optimized for LLM consumption
4. **Query processing** — Intent classification and multi-query strategies
5. **Access tracking** — Async batched updates for salience feedback
6. **Integration contracts** — Clear interfaces with Storage and MCP tools

### Bayesian Role Reminder

Retrieval computes P(relevant | task) — the likelihood function:
- **Similarity** = How well does this entry match the query semantically?
- **Salience** = Prior importance weight from Attention subsystem
- **Mode boost** = Context-specific relevance adjustment
- **Combined score** = Posterior relevance for ranking

### Dependencies

| Depends On | For |
|------------|-----|
| Storage | `semantic_search`, `hybrid_search`, `read_entries_batch`, `update_metadata_batch` |

| Depended On By | For |
|----------------|-----|
| MCP Tools | `kahuna_prepare_context` tool |
| LLM | Receives context guide as part of prompt |

---

## Changelog

- v1.2 (2026-03-08): Integration alignment fixes
  - Removed duplicate mode weight definitions; now references Attention's canonical configs (Part 3.4)
  - Added clarifying comment about dual recency factors (14-day retrieval vs 30-day decay) (Part 3.2)
- v1.1 (2026-03-08): Address review gaps
  - Added design decision clarifying Query Processor uses rule-based processing (no LLM) (P1.1)
  - Fixed Storage filter mapping to include `exclude_categories` and `min_confidence` (P1.2)
  - Added implementation note clarifying `record_access` → `update_metadata_batch` mapping (P1.3)
  - Added Bayesian role statement to G-level section (P2.1)
  - Expanded error handling with explicit recovery strategies for all error types (P2.3)
- v1.0 (2026-03-08): Initial Retrieval subsystem design
