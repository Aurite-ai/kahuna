# Attention Subsystem Design

**Type:** Subsystem Design Document
**Date:** 2026-03-08
**Status:** Draft (v1.1)
**Purpose:** Define the Attention subsystem — calculating, updating, and managing salience scores that determine KB entry priority

**Related:**
- [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) — Parent architecture (subsystem boundaries, contracts)
- [`00-common-schemas.md`](00-common-schemas.md) — Salience Architecture (Part 3), factor definitions
- [`01-storage.md`](01-storage.md) — Storage interface (update_metadata_batch, list_entries)
- [`04-retrieval.md`](04-retrieval.md) — Retrieval uses salience for ranking, reports access events

---

## Executive Summary

The Attention subsystem is Kahuna's **prior weighting engine** — it determines which KB entries are most important before any specific query arrives. Unlike Retrieval (which computes task-specific relevance), Attention maintains a persistent model of entry importance that evolves over time.

**Core Responsibilities:**
- Calculate initial salience scores for new entries
- Update salience based on access patterns and explicit signals
- Apply time-based decay to salience values
- Adjust attention weights based on operational mode
- Identify entries for archival or deletion based on decay thresholds

**Bayesian Role:** Attention performs P(H) = Prior Weighting. It determines which beliefs (KB entries) are most relevant before evidence arrives. High-salience entries receive more attention during retrieval; low-salience entries may be archived or forgotten.

**G-Level:** G5-G6 (Strategy Selection)
- Operates at the **meta-cognitive** level — it doesn't process individual tasks but shapes how the system prioritizes knowledge
- Salience rules are G5 (strategy selection based on task type)
- Decay management is G6 (meta-strategy for knowledge lifecycle)
- No LLM agents required — purely computational operations

**Design Philosophy:** Attention is **passive-first** — salience updates happen primarily when entries are accessed (lazy evaluation). Active decay is applied periodically via scheduled jobs, not continuously. This balances accuracy with computational efficiency.

**Architectural Role:** Attention is a **computational module**, not a service endpoint. It provides salience computation rules and algorithms that other subsystems apply directly. Retrieval's Access Tracker uses Attention's formulas when calling `storage.update_metadata_batch()`. There is no runtime `attention.recordAccess()` API — the integration is via shared computation rules, not inter-service calls.

---

## Part 1: Component Architecture

### 1.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ATTENTION SUBSYSTEM                                          │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         SALIENCE COMPUTER                                        │   │
│   │                                                                                   │   │
│   │   • Compute initial salience for new entries                                      │   │
│   │   • Recalculate salience on access events                                         │   │
│   │   • Apply factor weights and mode adjustments                                     │   │
│   │   • Produce effective_salience value                                              │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         DECAY MANAGER                                            │   │
│   │                                                                                   │   │
│   │   • Apply time-based exponential decay                                            │   │
│   │   • Respect protection rules (pinned, recently created, referenced)               │   │
│   │   • Identify entries crossing archive/delete thresholds                           │   │
│   │   • Schedule and execute decay jobs                                               │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         PRIORITY QUEUE                                           │   │
│   │                                                                                   │   │
│   │   • Maintain sorted view of entries by salience                                   │   │
│   │   • Support efficient top-N queries                                               │   │
│   │   • Provide salience distribution statistics                                      │   │
│   │   • Track salience trends (rising, stable, falling)                               │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         MODE ADAPTER                                             │   │
│   │                                                                                   │   │
│   │   • Load mode-specific weight configurations                                      │   │
│   │   • Compute mode_weight multiplier for entries                                    │   │
│   │   • Adjust effective salience per operational context                             │   │
│   │   • Support dynamic mode switching                                                │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Responsibilities

#### Salience Computer

**Purpose:** Calculate and maintain salience scores for KB entries.

| Responsibility | Description |
|----------------|-------------|
| **Initial Computation** | Calculate base_salience when entry is created |
| **Access Updates** | Recalculate salience when entry is accessed |
| **Factor Aggregation** | Combine individual factors with weights |
| **Boost Application** | Apply access and usage boosts with diminishing returns |

**Owns:**
- Factor computation functions
- Weight configuration
- Boost formulas

#### Decay Manager

**Purpose:** Apply time-based decay to salience values.

| Responsibility | Description |
|----------------|-------------|
| **Exponential Decay** | Reduce salience based on time since last access |
| **Protection Enforcement** | Exempt pinned, recent, and referenced entries |
| **Threshold Monitoring** | Identify entries crossing archive/delete thresholds |
| **Job Scheduling** | Manage periodic decay job execution |

**Owns:**
- Decay curve configuration
- Protection rules
- Threshold definitions
- Job schedule

#### Priority Queue

**Purpose:** Maintain a salience-ordered view of KB entries.

| Responsibility | Description |
|----------------|-------------|
| **Sorted Access** | Provide entries ordered by effective_salience |
| **Top-N Queries** | Efficiently return highest-salience entries |
| **Statistics** | Report salience distribution metrics |
| **Trend Tracking** | Identify entries with rising/falling salience |

**Owns:**
- Query interface
- Statistics computation
- Trend detection logic

#### Mode Adapter

**Purpose:** Adjust attention based on operational context.

| Responsibility | Description |
|----------------|-------------|
| **Config Loading** | Load mode-specific weight configurations |
| **Weight Computation** | Calculate mode_weight multiplier per entry |
| **Context Switching** | Handle mode transitions |
| **Category Mapping** | Map entry categories to mode relevance |

**Owns:**
- Mode configuration registry
- Category-to-weight mapping
- Default fallback configuration

---

## Part 2: Data Structures

### 2.1 Core Types

```typescript
/**
 * Salience metadata stored with each KB entry.
 * Updated by Attention subsystem, read by Retrieval.
 */
interface SalienceMetadata {
  // === Base Values ===
  base_salience: number;           // Initial computed value (0.0-1.0)
  effective_salience: number;      // Current value after decay/boosts (0.0-1.0)

  // === Temporal ===
  created_at: string;              // ISO 8601 entry creation time
  last_accessed: string;           // ISO 8601 last retrieval time
  last_salience_update: string;    // ISO 8601 last salience recalculation

  // === Counters ===
  access_count: number;            // Total retrieval count
  recent_access_count: number;     // Access count in last N days (rolling window)

  // === Flags ===
  pinned: boolean;                 // User-pinned (exempt from decay)
  protected_until?: string;        // ISO 8601 protection expiry (for new entries)

  // === Trend ===
  salience_trend: SalienceTrend;   // Direction of salience change
  previous_salience?: number;      // Salience at last update (for trend calculation)
}

type SalienceTrend = 'rising' | 'stable' | 'falling';

/**
 * Individual salience factors before aggregation.
 * See common-schemas.md Part 3.3 for factor definitions.
 */
interface SalienceFactors {
  source_type: number;             // 0.0-1.0 based on knowledge source
  recency: number;                 // 0.0-1.0 based on time since access
  access_frequency: number;        // 0.0-1.0 based on access count
  explicit_signal: number;         // 0.0-1.0 based on user actions (pin, boost)
  confidence: number;              // 0.0-1.0 from entry confidence score
}

/**
 * Weight configuration for factor aggregation.
 * Weights must sum to 1.0.
 */
interface SalienceWeights {
  source_type: number;             // Default: 0.25
  recency: number;                 // Default: 0.20
  access_frequency: number;        // Default: 0.20
  explicit_signal: number;         // Default: 0.20
  confidence: number;              // Default: 0.15
}

/**
 * Effective salience computation parameters.
 */
interface EffectiveSalienceParams {
  base_salience: number;
  recency_factor: number;          // e^(-0.693 × days_since_access / half_life) where half_life = 30
  access_boost: number;            // 1 + (0.1 × recent_access_count)
  mode_weight: number;             // Mode-specific multiplier
}
```

### 2.2 Configuration Types

```typescript
/**
 * Decay configuration for the Decay Manager.
 *
 * Note: Decay uses the half-life formula exclusively:
 *   decay_factor = e^(-0.693 × days_since_access / half_life_days)
 *
 * The decay rate λ is derived from half-life: λ = ln(2) / half_life_days ≈ 0.023 for 30 days.
 * This provides intuitive configuration (half-life) with mathematically correct decay.
 */
interface DecayConfig {
  half_life_days: number;          // Default: 30 days (salience halves every 30 days)
  min_salience: number;            // Floor: 0.05 (never fully forget)
  archive_threshold: number;       // Below this: archive (default: 0.10)
  delete_threshold: number;        // Below this after archive: delete (default: 0.02)
  new_entry_protection_days: number; // No decay for N days (default: 7)
}

/**
 * Mode-specific configuration for the Mode Adapter.
 */
interface ModeConfig {
  mode: string;                    // Mode identifier (e.g., "code", "architect")
  category_weights: Record<string, number>;  // Category → weight multiplier
  default_weight: number;          // Weight for unlisted categories (default: 1.0)
  description?: string;            // Human-readable mode description
}

/**
 * Access boost configuration.
 */
interface AccessBoostConfig {
  retrieval_boost: number;         // Boost for being retrieved (default: 0.02)
  output_inclusion_boost: number;  // Additional boost for inclusion in output (default: 0.05)
  recent_window_days: number;      // Window for recent_access_count (default: 7)
  max_recent_access_count: number; // Cap for access count (default: 20)
}
```

### 2.3 Event Types

```typescript
/**
 * Access event reported by Retrieval subsystem.
 */
interface AccessEvent {
  entry_id: string;
  accessed_at: string;             // ISO 8601
  mode: string;                    // Active mode during access
  included_in_output: boolean;     // Was entry included in context guide?
  query_context?: string;          // Brief description of the query
}

/**
 * Salience update request for Storage.
 */
interface SalienceUpdate {
  entry_id: string;
  effective_salience: number;
  last_accessed?: string;
  access_count_increment?: number;
  recent_access_count?: number;
  salience_trend?: SalienceTrend;
  previous_salience?: number;
}

/**
 * Decay job result.
 */
interface DecayJobResult {
  executed_at: string;             // ISO 8601
  entries_processed: number;
  entries_decayed: number;
  entries_archived: number;
  entries_protected: number;
  duration_ms: number;
  errors: DecayError[];
}

interface DecayError {
  entry_id: string;
  error: string;
}
```

### 2.4 Query Types

```typescript
/**
 * Query for entries ordered by salience.
 */
interface SalienceQuery {
  mode?: string;                   // Apply mode-specific weights
  min_salience?: number;           // Filter by minimum salience
  max_salience?: number;           // Filter by maximum salience
  categories?: string[];           // Filter by category
  trend?: SalienceTrend;           // Filter by trend
  limit?: number;                  // Maximum results (default: 100)
  include_archived?: boolean;      // Include archived entries (default: false)
}

/**
 * Salience distribution statistics.
 */
interface SalienceStats {
  total_entries: number;
  active_entries: number;          // Above archive_threshold
  archived_entries: number;
  pinned_entries: number;

  distribution: {
    high: number;                  // >= 0.7
    medium: number;                // 0.4 - 0.7
    low: number;                   // 0.1 - 0.4
    negligible: number;            // < 0.1
  };

  trends: {
    rising: number;
    stable: number;
    falling: number;
  };

  average_salience: number;
  median_salience: number;
}
```

---

## Part 3: Salience Calculation

### 3.1 Effective Salience Formula

The effective salience determines an entry's priority for retrieval. From the task requirements:

```
effective_salience = base_salience × recency_factor × access_boost × mode_weight
```

Where:
- `base_salience` = initial computed value (0.0-1.0)
- `recency_factor` = e^(-0.693 × days_since_access / 30) — half-life decay with 30-day half-life
- `access_boost` = 1 + (0.1 × recent_access_count)
- `mode_weight` = mode-specific multiplier

**Note on Decay Formula:** The recency factor uses the half-life formula (λ = ln(2)/half_life ≈ 0.023 for 30 days), NOT λ = 0.1. This ensures salience actually halves every 30 days as configured.

### 3.2 Base Salience Computation

Base salience is calculated at entry creation using weighted factors from [`00-common-schemas.md`](00-common-schemas.md):

```typescript
const DEFAULT_WEIGHTS: SalienceWeights = {
  source_type: 0.25,
  recency: 0.20,
  access_frequency: 0.20,
  explicit_signal: 0.20,
  confidence: 0.15,
};

/**
 * Compute base salience for a new entry.
 */
function computeBaseSalience(
  factors: SalienceFactors,
  weights: SalienceWeights = DEFAULT_WEIGHTS
): number {
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

### 3.3 Factor Computation Functions

```typescript
/**
 * Source type factor based on knowledge origin.
 */
type SourceType = 'user_explicit' | 'user_implicit' | 'inferred' | 'imported' | 'system';

function computeSourceTypeFactor(source: SourceType): number {
  const weights: Record<SourceType, number> = {
    user_explicit: 1.0,    // User directly taught
    user_implicit: 0.8,    // Inferred from user behavior
    inferred: 0.5,         // System inference
    imported: 0.6,         // Imported from external source
    system: 0.4,           // System-generated
  };
  return weights[source] ?? 0.5;
}

/**
 * Recency factor using exponential decay with half-life.
 * Returns 1.0 for just accessed, 0.5 after half_life_days, approaches 0 over time.
 *
 * Formula: e^(-0.693 × days_since_access / half_life_days)
 * where 0.693 = ln(2), ensuring salience halves every half_life_days.
 */
function computeRecencyFactor(
  lastAccessed: Date,
  now: Date,
  halfLifeDays: number = 30
): number {
  const daysSince = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-0.693 * daysSince / halfLifeDays);
}

/**
 * Access frequency factor using log scale with cap.
 * Diminishing returns after ~50 accesses.
 */
function computeAccessFrequencyFactor(accessCount: number): number {
  const maxUseful = 50;
  return Math.min(1.0, Math.log10(accessCount + 1) / Math.log10(maxUseful + 1));
}

/**
 * Explicit signal factor based on user actions.
 */
function computeExplicitSignalFactor(
  pinned: boolean,
  userBoost: number = 0
): number {
  if (pinned) return 1.0;
  return Math.min(1.0, Math.max(0.0, userBoost));
}

/**
 * Confidence factor (direct pass-through).
 */
function computeConfidenceFactor(confidence: number): number {
  return Math.max(0.0, Math.min(1.0, confidence));
}
```

### 3.4 Effective Salience Computation

```typescript
/**
 * Compute effective salience for an entry.
 * This is the value used for retrieval ranking.
 */
function computeEffectiveSalience(params: EffectiveSalienceParams): number {
  const { base_salience, recency_factor, access_boost, mode_weight } = params;

  // Apply the formula
  const effective = base_salience * recency_factor * access_boost * mode_weight;

  // Clamp to valid range
  return Math.max(0.0, Math.min(1.0, effective));
}

/**
 * Build effective salience params from entry metadata and context.
 */
function buildEffectiveSalienceParams(
  metadata: SalienceMetadata,
  mode: string,
  entryCategory: string,
  modeAdapter: ModeAdapter,
  config: DecayConfig
): EffectiveSalienceParams {
  const now = new Date();
  const lastAccessed = new Date(metadata.last_accessed);

  return {
    base_salience: metadata.base_salience,
    recency_factor: computeRecencyFactor(lastAccessed, now, config.half_life_days),
    access_boost: computeAccessBoost(metadata.recent_access_count),
    mode_weight: modeAdapter.getWeight(mode, entryCategory),
  };
}
```

### 3.5 Access Boost with Diminishing Returns

```typescript
/**
 * Compute access boost based on recent access count.
 * Formula: 1 + (0.1 × recent_access_count)
 * Capped at 2x boost (10 recent accesses).
 */
function computeAccessBoost(recentAccessCount: number): number {
  const boostPerAccess = 0.1;
  const maxBoost = 2.0;  // Cap at 2x multiplier

  const boost = 1 + (boostPerAccess * recentAccessCount);
  return Math.min(maxBoost, boost);
}

/**
 * Apply boost with diminishing returns.
 * Formula: new_salience = old_salience + boost × (1 - old_salience)
 * Ensures salience approaches 1.0 asymptotically.
 */
function applyBoostWithDiminishingReturns(
  currentSalience: number,
  boost: number
): number {
  const newSalience = currentSalience + boost * (1 - currentSalience);
  return Math.min(1.0, newSalience);
}
```

### 3.6 Salience Update on Access

```typescript
/**
 * Update salience when an entry is accessed.
 * Called by the Salience Computer when Retrieval reports access.
 */
function updateSalienceOnAccess(
  metadata: SalienceMetadata,
  event: AccessEvent,
  config: AccessBoostConfig
): SalienceUpdate {
  const now = new Date(event.accessed_at);

  // Compute boost based on access type
  let boost = config.retrieval_boost;
  if (event.included_in_output) {
    boost += config.output_inclusion_boost;
  }

  // Apply boost with diminishing returns
  const previousSalience = metadata.effective_salience;
  const newSalience = applyBoostWithDiminishingReturns(previousSalience, boost);

  // Update recent access count (rolling window)
  // Note: recent_access_count is maintained incrementally by the access recording process.
  // The stored value represents accesses within the rolling window. We increment it here
  // and rely on periodic maintenance to reset/recalculate when needed.
  const recentAccessCount = computeRecentAccessCount(metadata, now, config.recent_window_days);

  // Determine trend
  const trend = determineTrend(previousSalience, newSalience);

  return {
    entry_id: event.entry_id,
    effective_salience: newSalience,
    last_accessed: event.accessed_at,
    access_count_increment: 1,
    recent_access_count: recentAccessCount + 1,
    salience_trend: trend,
    previous_salience: previousSalience,
  };
}

/**
 * Determine salience trend based on change.
 */
function determineTrend(previous: number, current: number): SalienceTrend {
  const delta = current - previous;
  const threshold = 0.02;  // 2% change threshold

  if (delta > threshold) return 'rising';
  if (delta < -threshold) return 'falling';
  return 'stable';
}

/**
 * Compute recent access count within rolling window.
 *
 * Implementation note: For MVP, recent_access_count is maintained incrementally:
 * - Incremented on each access
 * - Reset to 0 during periodic decay jobs when entry hasn't been accessed within window
 *
 * For accurate rolling window calculation, implementation could:
 * 1. Store access timestamps array (more storage, accurate)
 * 2. Use probabilistic counting (HyperLogLog-style, approximate)
 * 3. Use current approach: increment on access, periodic reset (simple, good enough)
 *
 * Current design uses approach #3 for simplicity.
 */
function computeRecentAccessCount(
  metadata: SalienceMetadata,
  now: Date,
  windowDays: number
): number {
  const lastAccessed = new Date(metadata.last_accessed);
  const daysSinceAccess = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);

  // If last access is outside window, reset to 0
  if (daysSinceAccess > windowDays) {
    return 0;
  }

  // Otherwise, use the stored recent_access_count
  return metadata.recent_access_count;
}
```

---

## Part 4: Decay Management

### 4.1 Decay Algorithm

The Decay Manager applies exponential decay to entries that haven't been accessed recently:

```typescript
const DEFAULT_DECAY_CONFIG: DecayConfig = {
  half_life_days: 30,
  min_salience: 0.05,
  archive_threshold: 0.10,
  delete_threshold: 0.02,
  new_entry_protection_days: 7,
};

/**
 * Apply decay to an entry's salience.
 * Returns the decayed salience value.
 */
function applyDecay(
  currentSalience: number,
  daysSinceLastAccess: number,
  config: DecayConfig
): number {
  // Exponential decay formula
  const decayFactor = Math.exp(-0.693 * daysSinceLastAccess / config.half_life_days);
  const decayed = currentSalience * decayFactor;

  // Enforce minimum (never fully forget)
  return Math.max(config.min_salience, decayed);
}
```

### 4.2 Protection Rules

Certain entries are protected from decay:

```typescript
/**
 * Check if an entry is protected from decay.
 */
function isProtected(
  metadata: SalienceMetadata,
  config: DecayConfig,
  now: Date
): { protected: boolean; reason?: string } {
  // Rule 1: Pinned entries
  if (metadata.pinned) {
    return { protected: true, reason: 'pinned' };
  }

  // Rule 2: Recently created entries
  const createdAt = new Date(metadata.created_at);
  const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < config.new_entry_protection_days) {
    return { protected: true, reason: 'recently_created' };
  }

  // Rule 3: Explicit protection period
  if (metadata.protected_until) {
    const protectedUntil = new Date(metadata.protected_until);
    if (now < protectedUntil) {
      return { protected: true, reason: 'explicit_protection' };
    }
  }

  return { protected: false };
}

/**
 * Check if an entry is referenced by other entries.
 * Referenced entries are protected from deletion (not archive).
 *
 * Implementation note: Storage provides `query_metadata` which can filter by
 * `related_entries` field. We use this to find entries that reference the target.
 * This is implemented as a metadata query rather than a dedicated `find_references` API.
 */
async function isReferenced(
  entryId: string,
  storage: StorageInterface
): Promise<boolean> {
  // Query entries whose related_entries array contains this entry ID
  const result = await storage.query_metadata({
    // Filter: entries where related_entries includes entryId
    // Implementation: SQL WHERE json_each(related_entries) = entryId
    // or equivalent for the storage backend
    related_entries_contains: entryId,
    limit: 1,  // We only need to know if ANY reference exists
  });
  return result.entries.length > 0;
}
```

### 4.3 Threshold Actions

```typescript
type ThresholdAction = 'none' | 'archive' | 'delete';

/**
 * Determine action based on salience thresholds.
 */
function determineThresholdAction(
  salience: number,
  isArchived: boolean,
  daysSinceArchive: number,
  config: DecayConfig
): ThresholdAction {
  // Below archive threshold and not yet archived
  if (salience < config.archive_threshold && !isArchived) {
    return 'archive';
  }

  // Below delete threshold and archived for sufficient time
  if (salience < config.delete_threshold && isArchived && daysSinceArchive > 90) {
    return 'delete';
  }

  return 'none';
}
```

### 4.4 Decay Job Implementation

```typescript
/**
 * Execute decay job on all active entries.
 * This is called periodically (e.g., daily) by the scheduler.
 */
async function executeDecayJob(
  storage: StorageInterface,
  config: DecayConfig
): Promise<DecayJobResult> {
  const startTime = Date.now();
  const now = new Date();
  const errors: DecayError[] = [];

  let entriesProcessed = 0;
  let entriesDecayed = 0;
  let entriesArchived = 0;
  let entriesProtected = 0;

  // Fetch all active entries
  const entries = await storage.list_entries({
    sort_by: 'salience',
    include_archived: false,
  });

  const updates: SalienceUpdate[] = [];

  for (const entry of entries) {
    entriesProcessed++;

    try {
      const metadata = entry.salience_metadata;

      // Check protection
      const protection = isProtected(metadata, config, now);
      if (protection.protected) {
        entriesProtected++;
        continue;
      }

      // Calculate days since last access
      const lastAccessed = new Date(metadata.last_accessed);
      const daysSinceAccess = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);

      // Apply decay
      const decayedSalience = applyDecay(
        metadata.effective_salience,
        daysSinceAccess,
        config
      );

      // Check if salience actually changed
      if (Math.abs(decayedSalience - metadata.effective_salience) < 0.001) {
        continue;  // No significant change
      }

      entriesDecayed++;

      // Determine if threshold action needed
      const action = determineThresholdAction(
        decayedSalience,
        entry.is_archived,
        entry.days_since_archive ?? 0,
        config
      );

      if (action === 'archive') {
        entriesArchived++;
      }

      updates.push({
        entry_id: entry.id,
        effective_salience: decayedSalience,
        salience_trend: 'falling',
        previous_salience: metadata.effective_salience,
      });
    } catch (error) {
      errors.push({
        entry_id: entry.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Batch update
  if (updates.length > 0) {
    await storage.update_metadata_batch({ updates });
  }

  return {
    executed_at: now.toISOString(),
    entries_processed: entriesProcessed,
    entries_decayed: entriesDecayed,
    entries_archived: entriesArchived,
    entries_protected: entriesProtected,
    duration_ms: Date.now() - startTime,
    errors,
  };
}
```

### 4.5 Decay Job Scheduling

```typescript
interface DecayScheduleConfig {
  enabled: boolean;
  interval_hours: number;          // Default: 24 (daily)
  run_at_hour?: number;            // Optional: specific hour (0-23)
  max_entries_per_run?: number;    // Optional: limit for large KBs
}

const DEFAULT_SCHEDULE: DecayScheduleConfig = {
  enabled: true,
  interval_hours: 24,
  run_at_hour: 3,  // 3 AM local time
};

/**
 * Schedule periodic decay jobs.
 * Uses a simple interval-based scheduler.
 */
class DecayScheduler {
  private intervalId?: NodeJS.Timeout;

  constructor(
    private storage: StorageInterface,
    private decayConfig: DecayConfig,
    private scheduleConfig: DecayScheduleConfig
  ) {}

  start(): void {
    if (!this.scheduleConfig.enabled) return;

    const intervalMs = this.scheduleConfig.interval_hours * 60 * 60 * 1000;

    this.intervalId = setInterval(async () => {
      try {
        const result = await executeDecayJob(this.storage, this.decayConfig);
        console.log(`Decay job completed: ${result.entries_decayed} entries decayed`);
      } catch (error) {
        console.error('Decay job failed:', error);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Trigger immediate decay job (for testing or manual execution).
   */
  async runNow(): Promise<DecayJobResult> {
    return executeDecayJob(this.storage, this.decayConfig);
  }
}
```

---

## Part 5: Mode Configuration

### 5.0 Canonical Mode Configuration

**Design Decision:** Mode configurations are defined canonically in the Attention subsystem.

Both Attention and Retrieval use mode-specific weights, but to avoid duplication and maintenance risk:
- **Attention owns the mode configuration definitions** (this document, Part 5.1)
- **Retrieval references Attention's mode configs** at runtime
- **common-schemas.md** defines the mode config interface/schema only

This ensures a single source of truth for mode-specific behavior. Retrieval's mode adapter loads configs from Attention's registry rather than maintaining its own copy.

### 5.1 Mode Weight System

Different operational modes prioritize different types of knowledge:

```typescript
const MODE_CONFIGS: Record<string, ModeConfig> = {
  code: {
    mode: 'code',
    description: 'Implementation and coding tasks',
    category_weights: {
      patterns: 1.3,           // Strongly boost patterns
      errors: 1.4,             // Very strongly boost errors
      decisions: 1.1,          // Boost decisions
      preferences: 1.0,        // Neutral
      facts: 0.9,              // Slight reduction
      context: 0.8,            // Lower priority
    },
    default_weight: 1.0,
  },

  architect: {
    mode: 'architect',
    description: 'Design and architecture tasks',
    category_weights: {
      patterns: 1.1,
      errors: 0.9,
      decisions: 1.4,          // Very strongly boost decisions
      preferences: 1.3,        // Strongly boost preferences
      facts: 1.0,
      context: 1.2,            // Boost context for big picture
    },
    default_weight: 1.0,
  },

  debug: {
    mode: 'debug',
    description: 'Debugging and troubleshooting',
    category_weights: {
      patterns: 1.0,
      errors: 1.5,             // Maximum boost for errors
      decisions: 0.8,
      preferences: 0.7,
      facts: 1.3,              // Boost facts (configs, etc.)
      context: 1.0,
    },
    default_weight: 1.0,
  },

  ask: {
    mode: 'ask',
    description: 'Q&A and explanation tasks',
    category_weights: {
      patterns: 1.0,
      errors: 0.9,
      decisions: 1.1,
      preferences: 1.0,
      facts: 1.3,              // Boost facts for answers
      context: 1.2,            // Boost context for explanations
    },
    default_weight: 1.0,
  },
};

const DEFAULT_MODE_CONFIG: ModeConfig = {
  mode: 'default',
  description: 'Default mode for unrecognized contexts',
  category_weights: {},
  default_weight: 1.0,
};
```

### 5.2 Mode Adapter Implementation

```typescript
class ModeAdapter {
  private configs: Map<string, ModeConfig>;

  constructor(configs: Record<string, ModeConfig> = MODE_CONFIGS) {
    this.configs = new Map(Object.entries(configs));
    this.configs.set('default', DEFAULT_MODE_CONFIG);
  }

  /**
   * Get mode weight for an entry category.
   */
  getWeight(mode: string, category: string): number {
    const config = this.configs.get(mode) ?? this.configs.get('default')!;
    return config.category_weights[category] ?? config.default_weight;
  }

  /**
   * Get full mode configuration.
   */
  getConfig(mode: string): ModeConfig {
    return this.configs.get(mode) ?? this.configs.get('default')!;
  }

  /**
   * List all available modes.
   */
  listModes(): string[] {
    return Array.from(this.configs.keys()).filter(m => m !== 'default');
  }

  /**
   * Register a custom mode configuration.
   */
  registerMode(config: ModeConfig): void {
    this.configs.set(config.mode, config);
  }

  /**
   * Apply mode weights to a list of entries.
   * Returns entries with mode_weight applied to effective_salience.
   */
  applyModeWeights(
    entries: Array<{ id: string; category: string; effective_salience: number }>,
    mode: string
  ): Array<{ id: string; weighted_salience: number }> {
    return entries.map(entry => ({
      id: entry.id,
      weighted_salience: entry.effective_salience * this.getWeight(mode, entry.category),
    }));
  }
}
```

### 5.3 Dynamic Mode Switching

```typescript
/**
 * Handle mode switch events.
 * When mode changes, effective salience for all entries is affected.
 * Note: We don't recompute stored salience — mode weight is applied at query time.
 */
interface ModeSwitchEvent {
  previous_mode: string;
  new_mode: string;
  timestamp: string;
}

/**
 * Mode switch doesn't require salience updates.
 * Mode weight is applied dynamically during retrieval.
 * This keeps salience computation efficient and mode-independent.
 */
function handleModeSwitch(event: ModeSwitchEvent): void {
  // No salience updates needed
  // Mode weight is applied at query time, not stored
  console.log(`Mode switched from ${event.previous_mode} to ${event.new_mode}`);
}
```

---

## Part 6: Priority Queue

### 6.1 Query Interface

```typescript
interface PriorityQueue {
  /**
   * Get top entries by effective salience.
   */
  getTopEntries(query: SalienceQuery): Promise<PriorityEntry[]>;

  /**
   * Get salience statistics for the KB.
   */
  getStats(): Promise<SalienceStats>;

  /**
   * Get entries with specific trend.
   */
  getByTrend(trend: SalienceTrend, limit?: number): Promise<PriorityEntry[]>;

  /**
   * Get entries approaching archive threshold.
   */
  getAtRisk(threshold?: number): Promise<PriorityEntry[]>;
}

interface PriorityEntry {
  entry_id: string;
  title: string;
  category: string;
  effective_salience: number;
  weighted_salience?: number;      // After mode weight applied
  salience_trend: SalienceTrend;
  last_accessed: string;
  days_until_archive?: number;     // Estimated days until archive threshold
}
```

### 6.2 Implementation

```typescript
class PriorityQueueImpl implements PriorityQueue {
  constructor(
    private storage: StorageInterface,
    private modeAdapter: ModeAdapter,
    private decayConfig: DecayConfig
  ) {}

  async getTopEntries(query: SalienceQuery): Promise<PriorityEntry[]> {
    // Query storage for entries sorted by salience
    const entries = await this.storage.list_entries({
      sort_by: 'salience',
      limit: query.limit ?? 100,
      filters: {
        min_salience: query.min_salience ?? this.decayConfig.archive_threshold,
        max_salience: query.max_salience,
        categories: query.categories,
        include_archived: query.include_archived ?? false,
      },
    });

    // Apply mode weights if mode specified
    let results: PriorityEntry[] = entries.map(e => ({
      entry_id: e.id,
      title: e.title,
      category: e.category,
      effective_salience: e.salience_metadata.effective_salience,
      salience_trend: e.salience_metadata.salience_trend,
      last_accessed: e.salience_metadata.last_accessed,
    }));

    if (query.mode) {
      results = results.map(entry => ({
        ...entry,
        weighted_salience: entry.effective_salience *
          this.modeAdapter.getWeight(query.mode!, entry.category),
      }));

      // Re-sort by weighted salience
      results.sort((a, b) => (b.weighted_salience ?? 0) - (a.weighted_salience ?? 0));
    }

    // Filter by trend if specified
    if (query.trend) {
      results = results.filter(e => e.salience_trend === query.trend);
    }

    return results.slice(0, query.limit ?? 100);
  }

  async getStats(): Promise<SalienceStats> {
    const entries = await this.storage.list_entries({
      sort_by: 'salience',
      include_archived: true,
    });

    const saliences = entries.map(e => e.salience_metadata.effective_salience);

    return {
      total_entries: entries.length,
      active_entries: entries.filter(e => !e.is_archived).length,
      archived_entries: entries.filter(e => e.is_archived).length,
      pinned_entries: entries.filter(e => e.salience_metadata.pinned).length,

      distribution: {
        high: entries.filter(e => e.salience_metadata.effective_salience >= 0.7).length,
        medium: entries.filter(e => {
          const s = e.salience_metadata.effective_salience;
          return s >= 0.4 && s < 0.7;
        }).length,
        low: entries.filter(e => {
          const s = e.salience_metadata.effective_salience;
          return s >= 0.1 && s < 0.4;
        }).length,
        negligible: entries.filter(e => e.salience_metadata.effective_salience < 0.1).length,
      },

      trends: {
        rising: entries.filter(e => e.salience_metadata.salience_trend === 'rising').length,
        stable: entries.filter(e => e.salience_metadata.salience_trend === 'stable').length,
        falling: entries.filter(e => e.salience_metadata.salience_trend === 'falling').length,
      },

      average_salience: saliences.reduce((a, b) => a + b, 0) / saliences.length,
      median_salience: this.median(saliences),
    };
  }

  async getByTrend(trend: SalienceTrend, limit: number = 20): Promise<PriorityEntry[]> {
    return this.getTopEntries({ trend, limit });
  }

  async getAtRisk(threshold?: number): Promise<PriorityEntry[]> {
    const riskThreshold = threshold ?? this.decayConfig.archive_threshold * 1.5;

    return this.getTopEntries({
      min_salience: this.decayConfig.archive_threshold,
      max_salience: riskThreshold,
      limit: 50,
    });
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
```

---

## Part 7: Storage Contract

### 7.1 Required Storage Operations

The Attention subsystem depends on the following Storage operations:

```typescript
interface AttentionStorageContract {
  /**
   * Update metadata for multiple entries (batch operation).
   * Used for salience updates and access tracking.
   */
  update_metadata_batch(params: {
    updates: Array<{
      entry_id: string;
      effective_salience?: number;
      last_accessed?: string;
      access_count_increment?: number;
      recent_access_count?: number;
      salience_trend?: SalienceTrend;
      previous_salience?: number;
      pinned?: boolean;
      protected_until?: string;
    }>;
  }): Promise<void>;

  /**
   * Get entries sorted by salience (for Priority Queue).
   */
  list_entries(params: {
    sort_by: 'salience';
    limit?: number;
    filters?: {
      min_salience?: number;
      max_salience?: number;
      categories?: string[];
      include_archived?: boolean;
    };
  }): Promise<KBEntry[]>;

  /**
   * Get a single entry by ID.
   * Used for individual salience lookups.
   */
  get_entry(id: string): Promise<KBEntry | null>;

  /**
   * Search with salience weighting (for Retrieval integration).
   */
  search_semantic(
    query: string,
    options: { salience_weight: number }
  ): Promise<SearchResult[]>;

  /**
   * Query entries by metadata, including related_entries containment.
   * Used for protection rule checking (finding references to an entry).
   *
   * Note: The `related_entries_contains` filter is used instead of a
   * dedicated `find_references` operation. This leverages existing
   * metadata query infrastructure.
   */
  query_metadata(params: {
    related_entries_contains?: string;
    limit?: number;
    // ... other standard query_metadata params
  }): Promise<QueryMetadataOutput>;

  /**
   * Archive an entry (remove from active index).
   */
  archive_entry(entry_id: string): Promise<void>;

  /**
   * Delete an entry permanently.
   */
  delete_entry(entry_id: string): Promise<void>;
}
```

### 7.2 Storage Mapping

| Attention Operation | Storage Method |
|---------------------|----------------|
| Update salience on access | `update_metadata_batch` |
| Apply decay to entries | `update_metadata_batch` |
| Get top entries by salience | `list_entries` with `sort_by: 'salience'` |
| Check if entry is referenced | `query_metadata` with `related_entries_contains` |
| Archive low-salience entry | `archive_entry` |
| Delete forgotten entry | `delete_entry` |

### 7.3 Contract Obligations

**Attention's obligations:**
- Use batch updates for efficiency (minimize Storage calls)
- Respect Storage's async contract (await all operations)
- Handle Storage errors gracefully
- Never update content (salience metadata only)

**Storage's obligations (expected):**
- Maintain salience index for efficient sorted queries
- Apply updates atomically within a batch
- Return entries with complete `salience_metadata`
- Support filtering by salience range

---

## Part 8: Error Handling

### 8.1 Error Types

```typescript
type AttentionError =
  | { code: 'STORAGE_UNAVAILABLE'; reason: string }
  | { code: 'ENTRY_NOT_FOUND'; entry_id: string }
  | { code: 'UPDATE_FAILED'; entry_id: string; reason: string }
  | { code: 'DECAY_JOB_FAILED'; reason: string; partial_results?: DecayJobResult }
  | { code: 'INVALID_SALIENCE'; value: number; message: string }
  | { code: 'CONFIG_INVALID'; field: string; message: string };
```

### 8.2 Recovery Strategies

```typescript
async function handleAttentionError(
  error: AttentionError,
  context: { operation: string; entry_id?: string }
): Promise<void> {
  switch (error.code) {
    case 'STORAGE_UNAVAILABLE':
      // Log and retry with backoff
      console.error(`Storage unavailable during ${context.operation}: ${error.reason}`);
      // Queue the update for retry
      await queueForRetry(context);
      break;

    case 'ENTRY_NOT_FOUND':
      // Entry may have been deleted — skip silently
      console.warn(`Entry ${error.entry_id} not found during ${context.operation}`);
      break;

    case 'UPDATE_FAILED':
      // Log and continue (non-critical for individual entries)
      console.error(`Update failed for ${error.entry_id}: ${error.reason}`);
      break;

    case 'DECAY_JOB_FAILED':
      // Log with partial results if available
      console.error(`Decay job failed: ${error.reason}`);
      if (error.partial_results) {
        console.log(`Partial results: ${error.partial_results.entries_processed} processed`);
      }
      // Schedule retry
      await scheduleDecayRetry();
      break;

    case 'INVALID_SALIENCE':
      // Clamp to valid range and warn
      console.warn(`Invalid salience ${error.value}: ${error.message}. Clamping to valid range.`);
      break;

    case 'CONFIG_INVALID':
      // Use defaults and warn
      console.warn(`Invalid config for ${error.field}: ${error.message}. Using defaults.`);
      break;

    default:
      throw error;
  }
}
```

### 8.3 Graceful Degradation

```typescript
/**
 * When Attention subsystem is unavailable, Retrieval can still function
 * using stored salience values (read-only mode).
 */
interface AttentionDegradedMode {
  /**
   * Check if Attention is functioning normally.
   */
  isHealthy(): Promise<boolean>;

  /**
   * Get current mode (normal, degraded, offline).
   */
  getStatus(): Promise<AttentionStatus>;
}

type AttentionStatus =
  | { mode: 'normal' }
  | { mode: 'degraded'; reason: string; capabilities: string[] }
  | { mode: 'offline'; reason: string };

/**
 * In degraded mode:
 * - Salience reads work (from stored values)
 * - Salience updates are queued for later
 * - Decay jobs are paused
 * - Mode adaptation still works (pure computation)
 */
const DEGRADED_CAPABILITIES = [
  'read_salience',
  'apply_mode_weights',
  'priority_queue_read',
];
```

---

## Part 9: Integration Points

### 9.1 Attention → Retrieval

**Integration Model:** Attention provides computational rules; Retrieval applies them directly.

Retrieval reads salience from entry metadata. When recording access events, Retrieval's Access Tracker applies Attention's salience formulas directly via `storage.update_metadata_batch()`. There is no runtime call to an `attention.recordAccess()` method.

```typescript
// Retrieval reads salience during ranking
const relevanceScore = computeRelevanceScore({
  similarity: semanticScore,
  salience: entry.salience_metadata.effective_salience,
  confidence: entry.confidence,
  recency: computeRecencyFactor(entry.last_accessed, halfLifeDays),
});

// Retrieval's Access Tracker applies Attention's salience rules directly via Storage
// No attention.recordAccess() call - the formulas are shared, not the API
await storage.update_metadata_batch({
  updates: [{
    entry_id: entry.id,
    salience: currentSalience + computeAccessBoost(includedInOutput),
    last_accessed: new Date().toISOString(),
    access_count_increment: 1,
  }],
});
```

**Note:** The `computeAccessBoost()` and `computeRecencyFactor()` functions defined in this document (Parts 3.3-3.5) are the canonical implementations. Retrieval imports and uses these directly.

### 9.2 Attention → Encoding

Encoding sets initial salience when creating new entries:

```typescript
// Encoding computes initial salience via Attention
const initialSalience = attention.computeInitialSalience({
  source_type: episode.source.explicit ? 'user_explicit' : 'inferred',
  confidence: episode.confidence,
  // Other factors set to defaults
});

// Entry created with salience metadata
const entry = await storage.create_entry({
  content: proposedContent,
  salience_metadata: {
    base_salience: initialSalience,
    effective_salience: initialSalience,
    created_at: now,
    last_accessed: now,
    access_count: 0,
    recent_access_count: 0,
    pinned: false,
    salience_trend: 'stable',
  },
});
```

### 9.3 Attention → Consolidation

Consolidation may trigger decay job after processing:

```typescript
// After consolidation completes, optionally trigger decay
// (if consolidation introduces many new entries, old ones may decay faster)
if (consolidationResult.entries_created > 10) {
  await attention.scheduleDecayJob({ immediate: true });
}
```

---

## Summary

### What This Document Establishes

1. **Component architecture** — Four components (Salience Computer, Decay Manager, Priority Queue, Mode Adapter) with clear responsibilities
2. **Salience calculation** — Formula: `effective_salience = base_salience × recency_factor × access_boost × mode_weight`
3. **Decay management** — Exponential decay with protection rules and threshold actions
4. **Mode configuration** — Per-mode category weights for context-sensitive attention
5. **Storage contract** — Required operations and mapping
6. **Error handling** — Error types, recovery strategies, graceful degradation

### Bayesian Role Reminder

Attention computes P(H) = Prior Weighting:
- **Base salience** = Initial importance based on source and confidence
- **Recency factor** = How recently the knowledge was accessed
- **Access boost** = Frequency of use (evidence of importance)
- **Mode weight** = Context-specific relevance adjustment
- **Combined = Effective salience** = Prior weight for retrieval ranking

### Dependencies

| Depends On | For |
|------------|-----|
| Storage | `update_metadata_batch`, `list_entries`, `get_entry`, `query_metadata` |

| Depended On By | For |
|----------------|-----|
| Retrieval | Reading salience for ranking; uses Attention's computation rules for access boosts |
| Encoding | Computing initial salience for new entries |
| Consolidation | Triggering decay after batch processing |

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Passive vs Active | **Passive-first** | Salience updates on access; active decay via scheduled jobs |
| LLM Required | **No** | Purely computational (formulas + config) |
| Mode weights | **Query-time** | Mode weight applied during retrieval, not stored |
| Decay schedule | **Daily** | Balance between freshness and efficiency |
| Mode config ownership | **Attention-owned** | Single source of truth; Retrieval references |
| Integration model | **Computational module** | Rules/formulas shared, not API calls |
| Decay formula | **Half-life based** | λ = ln(2)/30 ≈ 0.023 for 30-day half-life |

---

## Changelog

- v1.1 (2026-03-08): Address review gaps (P2.1-P2.5)
  - Clarified architectural role: Attention is a computational module, not a service endpoint
  - Added `computeRecentAccessCount()` implementation with rolling window logic
  - Replaced `find_references` with `query_metadata(related_entries_contains)` pattern
  - Resolved decay formula inconsistency: standardized on half-life formula (λ = ln(2)/half_life)
  - Designated Attention as canonical owner of mode configurations
  - Updated integration examples to show direct Storage calls, not Attention API
- v1.0 (2026-03-08): Initial Attention subsystem design
