# Error Handling Subsystem Design

**Type:** Subsystem Design Document
**Date:** 2026-03-08
**Status:** Draft (v1.1)
**Purpose:** Define the Error Handling subsystem — conflict detection, resolution, proposal validation, and escalation management

**Related:**
- [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) — Parent architecture (subsystem boundaries, contracts)
- [`00-common-schemas.md`](00-common-schemas.md) — Episode Schema, Integration Decision Criteria, Proposal structure
- [`01-storage.md`](01-storage.md) — Storage interface for reading existing entries
- [`llm-agent-model.md`](../04-foundations/llm-agent-model.md) — GRSO framework for agent prompts

---

## Executive Summary

The Error Handling subsystem is the **belief revision layer** (G3) of Kahuna's consolidation pipeline. It ensures the Knowledge Base maintains coherence by detecting contradictions between proposals and existing entries, resolving conflicts using principled strategies, and escalating to humans when automated resolution is not possible.

**Core Responsibilities:**
- Validate proposals from Integration for structural correctness
- Detect conflicts between proposals and existing KB entries
- Resolve conflicts using configurable resolution strategies
- Manage escalation to human when automated resolution fails
- Maintain audit trail of conflict decisions

**Bayesian Role:** Error Handling maintains P(H) coherence — ensuring the prior distribution doesn't contain contradictory beliefs. It's the "truth maintenance" system that keeps the KB self-consistent.

**G-Level:** G3 (applying rules about rules) with G4 elements (resolving meta-conflicts)

---

## Part 1: Component Architecture

### 1.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            ERROR HANDLING SUBSYSTEM                                        │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           PUBLIC API LAYER                                       │   │
│   │                                                                                   │   │
│   │   validate_proposals()  detect_conflicts()  resolve_conflicts()                  │   │
│   │   get_validated_proposals()  escalate_conflict()  get_escalation_status()        │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                                  │
│              ┌─────────────────────────┼─────────────────────────┐                       │
│              │                         │                         │                       │
│              ▼                         ▼                         ▼                       │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐          │
│   │ PROPOSAL VALIDATOR  │   │  CONFLICT DETECTOR  │   │  CONFLICT RESOLVER  │          │
│   │                     │   │                     │   │                     │          │
│   │ • Schema validation │   │ • Semantic compare  │   │ • Strategy selection│          │
│   │ • Required fields   │   │ • Contradiction     │   │ • Resolution logic  │          │
│   │ • Consistency checks│   │   classification    │   │ • Decision recording│          │
│   │ • Metadata ranges   │   │ • Related entry     │   │ • Confidence adjust │          │
│   │                     │   │   retrieval         │   │                     │          │
│   └──────────┬──────────┘   └──────────┬──────────┘   └──────────┬──────────┘          │
│              │                         │                         │                       │
│              │                         │                         │                       │
│              ▼                         ▼                         ▼                       │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐          │
│   │  VALIDATION RULES   │   │  STORAGE (read)     │   │ RESOLUTION STRATEGY │          │
│   │  (configuration)    │   │  (KB access)        │   │ (configuration)     │          │
│   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘          │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                        ESCALATION HANDLER                                        │   │
│   │                                                                                   │   │
│   │   • Escalation criteria evaluation     • Human decision recording                │   │
│   │   • Escalation queue management        • Decision propagation                    │   │
│   │   • Notification preparation           • Timeout handling                        │   │
│   │                                                                                   │   │
│   │   Storage: .kahuna/escalations/                                                   │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         CONFLICT AUDIT LOG                                       │   │
│   │                                                                                   │   │
│   │   • All conflict detections logged     • Resolution decisions recorded          │   │
│   │   • Escalation history                 • Human decisions tracked                 │   │
│   │                                                                                   │   │
│   │   Storage: .kahuna/audit/conflicts/                                              │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Responsibilities

#### Proposal Validator

**Purpose:** Validate proposal structure and content before conflict detection.

| Responsibility | Description |
|----------------|-------------|
| **Schema Validation** | Ensure proposals match IntegrationProposal schema |
| **Required Fields** | Verify all required fields are present and non-empty |
| **Consistency Checks** | Validate internal consistency of proposal data |
| **Metadata Validation** | Ensure confidence, salience in valid ranges |
| **Target Validation** | Verify referenced entries exist (for update/merge) |

**Owns:**
- Validation rule configuration
- Error message formatting
- Validation result structure

#### Conflict Detector

**Purpose:** Identify contradictions between proposals and existing KB entries.

| Responsibility | Description |
|----------------|-------------|
| **Related Entry Retrieval** | Find KB entries potentially in conflict |
| **Semantic Comparison** | Compare meaning of proposal vs existing entries |
| **Contradiction Classification** | Classify conflict type (direct, implicit, etc.) |
| **Confidence Assessment** | Rate confidence that conflict exists |
| **Multi-Conflict Handling** | Handle proposals conflicting with multiple entries |

**Owns:**
- Conflict type taxonomy
- Detection algorithms
- Conflict report structure

#### Conflict Resolver

**Purpose:** Decide which version to keep when conflicts exist.

| Responsibility | Description |
|----------------|-------------|
| **Strategy Selection** | Choose appropriate resolution strategy |
| **Resolution Execution** | Apply the selected strategy |
| **Decision Recording** | Document the resolution with rationale |
| **Confidence Adjustment** | Modify proposal confidence based on resolution |
| **Escalation Triggering** | Determine when to escalate vs auto-resolve |

**Owns:**
- Resolution strategy definitions
- Strategy selection rules
- Resolution decision format

#### Escalation Handler

**Purpose:** Manage human-in-the-loop conflict resolution.

| Responsibility | Description |
|----------------|-------------|
| **Escalation Criteria** | Determine when conflicts require human review |
| **Queue Management** | Maintain queue of pending escalations |
| **Context Preparation** | Prepare conflict context for human review |
| **Decision Recording** | Capture and validate human decisions |
| **Timeout Handling** | Handle escalations that aren't resolved promptly |

**Owns:**
- Escalation queue structure
- Human decision interface
- Timeout policies

---

## Part 2: Data Structures

### 2.1 Conflict Types

```typescript
/**
 * Types of conflicts that can occur between proposals and KB entries.
 */
type ConflictType =
  | 'direct_contradiction'    // A says X, B says not-X
  | 'implicit_contradiction'  // A implies X, B implies not-X
  | 'supersession'            // Newer info should replace older
  | 'partial_overlap'         // Some claims conflict, others don't
  | 'semantic_drift'          // Same topic, incompatible framing
  | 'version_conflict';       // Multiple updates to same entry

/**
 * Severity levels for conflicts.
 */
type ConflictSeverity = 'critical' | 'high' | 'medium' | 'low';
```

### 2.2 Conflict Report Schema

```typescript
/**
 * A detected conflict between a proposal and existing KB entry.
 */
interface Conflict {
  // === Identity ===
  conflict_id: string;              // Unique identifier (conflict-{uuid-first8})
  detected_at: string;              // ISO 8601 timestamp

  // === Parties ===
  proposal_id: string;              // The proposal causing potential conflict
  conflicting_entry_id: string;     // The existing KB entry in conflict

  // === Classification ===
  type: ConflictType;
  severity: ConflictSeverity;

  // === Content ===
  proposal_claim: string;           // The conflicting claim from proposal
  existing_claim: string;           // The conflicting claim from KB entry

  // === Analysis ===
  description: string;              // Human-readable description of the conflict
  confidence: number;               // 0.0-1.0 confidence that conflict exists

  // === Context ===
  semantic_similarity: number;      // Similarity score that triggered comparison
  common_topics: string[];          // Shared topics/tags
}

/**
 * Full report of conflict detection for a set of proposals.
 */
interface ConflictReport {
  // === Identity ===
  report_id: string;
  generated_at: string;

  // === Input ===
  proposals_checked: number;

  // === Results ===
  conflicts: Conflict[];

  // === Summary ===
  summary: {
    total_conflicts: number;
    by_type: Record<ConflictType, number>;
    by_severity: Record<ConflictSeverity, number>;
    proposals_with_conflicts: string[];
    clean_proposals: string[];
  };
}
```

### 2.3 Resolution Schema

```typescript
/**
 * Resolution strategies for conflict handling.
 */
type ResolutionStrategy =
  | 'recency'           // Newer wins
  | 'confidence'        // Higher confidence wins
  | 'source_priority'   // User explicit > inferred
  | 'scope'             // More specific wins
  | 'merge'             // Combine both with scoping
  | 'escalate';         // Human decides

/**
 * Resolution decision for a single conflict.
 */
interface ResolutionDecision {
  // === Identity ===
  decision_id: string;
  conflict_id: string;
  decided_at: string;

  // === Decision ===
  strategy_used: ResolutionStrategy;
  winner: 'proposal' | 'existing' | 'merged' | 'escalated';

  // === Rationale ===
  rationale: string;
  confidence: number;           // Confidence in this resolution

  // === Outcome ===
  modified_proposal?: IntegrationProposal;  // If proposal was modified
  escalation_id?: string;                   // If escalated

  // === Decision Source ===
  decided_by: 'system' | 'human';
  human_reviewer?: string;      // If decided by human
}

/**
 * Result of resolution for all conflicts in a batch.
 */
interface ResolutionResult {
  // === Identity ===
  result_id: string;
  resolved_at: string;

  // === Input ===
  conflict_report_id: string;

  // === Decisions ===
  decisions: ResolutionDecision[];

  // === Summary ===
  summary: {
    auto_resolved: number;
    escalated: number;
    by_strategy: Record<ResolutionStrategy, number>;
    by_winner: Record<string, number>;
  };
}
```

### 2.4 Escalation Schema

```typescript
/**
 * An escalated conflict awaiting human resolution.
 */
interface Escalation {
  // === Identity ===
  escalation_id: string;
  created_at: string;

  // === Status ===
  status: 'pending' | 'in_review' | 'resolved' | 'timeout' | 'dismissed';

  // === Conflict ===
  conflict: Conflict;
  proposal: IntegrationProposal;
  existing_entry: KBEntry;

  // === Context ===
  escalation_reason: string;
  suggested_resolutions: Array<{
    strategy: ResolutionStrategy;
    description: string;
    confidence: number;
  }>;

  // === Resolution (when resolved) ===
  resolution?: {
    decided_at: string;
    decision: 'keep_proposal' | 'keep_existing' | 'merge' | 'dismiss_both';
    rationale: string;
    reviewer: string;
    merged_content?: string;
  };

  // === Timeout ===
  timeout_at: string;           // When escalation expires
  timeout_action: 'keep_existing' | 'keep_proposal' | 'dismiss';
}

/**
 * Queue of pending escalations.
 */
interface EscalationQueue {
  pending: Escalation[];
  in_review: Escalation[];
  recently_resolved: Escalation[];  // Last N resolved

  stats: {
    total_pending: number;
    average_resolution_time_hours: number;
    timeout_rate: number;
  };
}
```

### 2.5 Validated Proposal Schema

```typescript
/**
 * A proposal that has passed through error handling.
 */
interface ValidatedProposal {
  // === Original Proposal ===
  original_proposal: IntegrationProposal;

  // === Validation ===
  validation_status: 'valid' | 'invalid';
  validation_errors?: string[];

  // === Conflict Status ===
  conflict_status: 'clean' | 'resolved' | 'escalated';
  conflicts_detected: Conflict[];
  resolutions_applied: ResolutionDecision[];

  // === Final Proposal ===
  final_proposal: IntegrationProposal;  // May differ from original if modified

  // === Confidence Adjustment ===
  original_confidence: number;
  final_confidence: number;
  confidence_adjustment_reason?: string;

  // === Audit ===
  processed_at: string;
  processing_duration_ms: number;
}
```

---

## Part 3: Conflict Detection

### 3.1 Detection Algorithm Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONFLICT DETECTION ALGORITHM                          │
│                                                                          │
│   INPUT: Proposal from Integration                                       │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ STEP 1: Candidate Retrieval                                      │   │
│   │                                                                   │   │
│   │ Query Storage for entries that might conflict:                    │   │
│   │ • Semantic search on proposal content (top 10)                   │   │
│   │ • Category match (same category as proposal)                     │   │
│   │ • Tag overlap (shared tags)                                       │   │
│   │ • For update/merge: always include target entries                │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │                                          │
│                                ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ STEP 2: Pairwise Comparison                                       │   │
│   │                                                                   │   │
│   │ For each candidate entry:                                         │   │
│   │ • Extract core claims from proposal                              │   │
│   │ • Extract core claims from candidate                             │   │
│   │ • Compare claims for contradiction (LLM-assisted)                │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │                                          │
│                                ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ STEP 3: Conflict Classification                                   │   │
│   │                                                                   │   │
│   │ For each detected contradiction:                                  │   │
│   │ • Classify type (direct, implicit, supersession, etc.)           │   │
│   │ • Assess severity based on confidence and impact                 │   │
│   │ • Generate human-readable description                            │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │                                          │
│                                ▼                                          │
│   OUTPUT: ConflictReport                                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Conflict Type Detection Rules

| Conflict Type | Detection Criteria | Example |
|---------------|-------------------|---------|
| **Direct Contradiction** | A explicitly negates B | "Use PostgreSQL" vs "Use SQLite" |
| **Implicit Contradiction** | A's implications conflict with B's | "Always use async" vs "Use sync for file ops" |
| **Supersession** | A is newer and addresses same topic | "API v2 uses REST" supersedes "API v1 uses SOAP" |
| **Partial Overlap** | Some claims conflict, others compatible | "Use 2-space indent in Python" vs "Use 4-space indent in TypeScript" |
| **Semantic Drift** | Same topic, incompatible framing | "Functional-first" vs "OOP-first" for same codebase |
| **Version Conflict** | Multiple proposals update same entry | Two sessions modify same entry concurrently |

### 3.3 Conflict Detector Agent

Using the GRSO framework from [`llm-agent-model.md`](../04-foundations/llm-agent-model.md):

```markdown
# Agent: Conflict Detector

## Goal
Identify contradictions between a proposal and existing KB entries.
Output a list of conflicts with classification, severity, and confidence.

## Rules
- Contradiction means CANNOT BOTH BE TRUE — not merely different
- Different topics are NOT conflicts (A about Python, B about JavaScript)
- Context matters — same statement might conflict in one context but not another
- Must identify WHICH specific claims conflict
- Must explain WHY they conflict
- Confidence must reflect actual certainty (don't overstate)

## Strategies
- Compare semantic meaning, not surface text
- Check for logical inconsistencies (A says X, B says not-X)
- Check for implicit conflicts (A implies X, B implies not-X)
- Consider temporal context (newer info may supersede)
- Consider scope (may not conflict if different scopes)
- High confidence existing + high confidence proposal = high severity

## Opening
1. Extract the core claims from the proposal
2. For each candidate entry, extract its core claims
3. Compare claims systematically
4. For each potential conflict, verify it's genuine
5. Classify type and severity
6. Output structured conflict report
```

### 3.5 Conflict Detector Output Interface

```typescript
/**
 * Output from the Conflict Detector agent.
 */
interface ConflictDetectorOutput {
  // === Identified Conflicts ===
  conflicts: Array<{
    conflicting_entry_id: string;
    type: ConflictType;
    severity: ConflictSeverity;
    proposal_claim: string;
    existing_claim: string;
    description: string;
    confidence: number;
  }>;

  // === Analysis Summary ===
  summary: {
    entries_compared: number;
    conflicts_found: number;
    highest_severity: ConflictSeverity | null;
  };

  // === Agent Metadata ===
  processing_notes?: string;
}
```

### 3.6 Similarity Thresholds for Candidate Retrieval

```typescript
interface DetectionConfig {
  // === Candidate Retrieval ===
  semantic_search_limit: number;          // Default: 10 candidates
  min_similarity_for_comparison: number;  // Default: 0.50 (lower than integration)

  // === Conflict Detection ===
  min_confidence_to_report: number;       // Default: 0.30 (include uncertain)

  // === Severity Assignment ===
  severity_thresholds: {
    critical: number;  // Confidence >= 0.90 AND both high-confidence claims
    high: number;      // Confidence >= 0.75
    medium: number;    // Confidence >= 0.50
    low: number;       // Confidence >= 0.30
  };
}
```

**Rationale:** Lower similarity threshold (0.50) than Integration (0.75) because:
- We want to catch conflicts that might be missed
- False positives (checking non-conflicts) are low cost
- False negatives (missing conflicts) corrupt the KB

---

## Part 4: Conflict Resolution

### 4.1 Resolution Strategies

#### Strategy 1: Recency

**When to use:** Proposal is newer and explicitly updates older information.

```typescript
interface RecencyStrategy {
  name: 'recency';

  // Winner selection
  select_winner(
    proposal: IntegrationProposal,
    existing: KBEntry
  ): 'proposal' | 'existing' {
    const proposal_time = new Date(proposal.proposed_metadata.source_ref);
    const existing_time = new Date(existing.metadata.updated_at);

    return proposal_time > existing_time ? 'proposal' : 'existing';
  }

  // Applicable when
  applicable: (conflict: Conflict) => boolean = (c) =>
    c.type === 'supersession' ||
    (c.type === 'direct_contradiction' && time_difference_significant());
}
```

#### Strategy 2: Confidence

**When to use:** One claim has significantly higher confidence than the other.

```typescript
interface ConfidenceStrategy {
  name: 'confidence';

  // Minimum confidence difference to apply
  min_difference: number;  // Default: 0.20

  select_winner(
    proposal: IntegrationProposal,
    existing: KBEntry
  ): 'proposal' | 'existing' {
    const diff = proposal.proposed_metadata.confidence - existing.metadata.confidence;
    if (diff > this.min_difference) return 'proposal';
    if (diff < -this.min_difference) return 'existing';
    return null;  // Cannot decide, try next strategy
  }
}
```

#### Strategy 3: Source Priority

**When to use:** Different source types have different reliability.

```typescript
interface SourcePriorityStrategy {
  name: 'source_priority';

  // Priority order (highest first)
  priority_order: SourceType[] = [
    'user_explicit',    // User directly stated
    'user_implicit',    // Inferred from user behavior
    'consolidated',     // From consolidation pipeline
    'imported',         // External import
    'inferred',         // System inference
    'system'            // System-generated defaults
  ];

  select_winner(
    proposal: IntegrationProposal,
    existing: KBEntry
  ): 'proposal' | 'existing' {
    const proposal_priority = this.priority_order.indexOf(
      proposal.proposed_metadata.source_type
    );
    const existing_priority = this.priority_order.indexOf(
      existing.metadata.source_type
    );

    if (proposal_priority < existing_priority) return 'proposal';  // Lower index = higher priority
    if (existing_priority < proposal_priority) return 'existing';
    return null;  // Same priority, try next strategy
  }
}
```

#### Strategy 4: Scope

**When to use:** One claim is more specific than the other.

```typescript
interface ScopeStrategy {
  name: 'scope';

  // More specific wins
  select_winner(
    proposal: IntegrationProposal,
    existing: KBEntry,
    conflict: Conflict
  ): 'proposal' | 'existing' | 'merge' {
    const proposal_scope = assess_scope(proposal.proposed_content);
    const existing_scope = assess_scope(existing.content);

    // If one is strictly more specific, it wins
    if (is_strictly_narrower(proposal_scope, existing_scope)) return 'proposal';
    if (is_strictly_narrower(existing_scope, proposal_scope)) return 'existing';

    // If they're different scopes, both might be valid
    if (scopes_are_compatible(proposal_scope, existing_scope)) return 'merge';

    return null;  // Cannot determine, try next strategy
  }
}
```

#### Strategy 5: Merge

**When to use:** Both claims are valid in different contexts or can be combined.

```typescript
interface MergeStrategy {
  name: 'merge';

  // Merge both claims into unified entry
  async merge(
    proposal: IntegrationProposal,
    existing: KBEntry,
    conflict: Conflict
  ): Promise<IntegrationProposal> {
    // Use LLM to create merged content
    const merged_content = await merge_content_agent(
      proposal.proposed_content,
      existing.content,
      conflict.description
    );

    return {
      ...proposal,
      action: 'update',
      target_entry_ids: [existing.id],
      proposed_content: merged_content,
      proposed_metadata: {
        ...proposal.proposed_metadata,
        confidence: Math.min(
          proposal.proposed_metadata.confidence,
          existing.metadata.confidence
        ),  // Conservative confidence
      },
      decision_rationale: `Merged conflicting claims: ${conflict.description}`,
    };
  }
}
```

#### Strategy 6: Escalate

**When to use:** Automated resolution cannot confidently decide.

```typescript
interface EscalateStrategy {
  name: 'escalate';

  // Criteria for escalation
  should_escalate(
    conflict: Conflict,
    proposal: IntegrationProposal,
    existing: KBEntry
  ): boolean {
    // Escalate if:
    // 1. Both high confidence (hard to dismiss either)
    const both_confident =
      proposal.proposed_metadata.confidence >= 0.75 &&
      existing.metadata.confidence >= 0.75;

    // 2. Critical severity
    const critical = conflict.severity === 'critical';

    // 3. User-explicit on both sides
    const both_explicit =
      proposal.proposed_metadata.source_type === 'user_explicit' &&
      existing.metadata.source_type === 'user_explicit';

    // 4. Conflict detection itself is uncertain
    const uncertain_conflict = conflict.confidence < 0.70;

    return (both_confident && critical) || both_explicit || uncertain_conflict;
  }
}
```

### 4.2 Strategy Selection Algorithm

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RESOLUTION STRATEGY SELECTION                         │
│                                                                          │
│   INPUT: Conflict + Proposal + Existing Entry                            │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ CHECK: Should escalate immediately?                              │   │
│   │                                                                   │   │
│   │ • Both user_explicit sources? → ESCALATE                         │   │
│   │ • Conflict confidence < 0.70? → ESCALATE                         │   │
│   │ • Severity = critical AND both conf >= 0.80? → ESCALATE          │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │ No immediate escalation                 │
│                                ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ TRY: Source Priority Strategy                                    │   │
│   │                                                                   │   │
│   │ If source types differ significantly → Use source priority       │   │
│   │ Example: user_explicit beats inferred                            │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │ No clear winner                         │
│                                ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ TRY: Confidence Strategy                                         │   │
│   │                                                                   │   │
│   │ If confidence differs by > 0.20 → Higher confidence wins         │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │ Confidence similar                      │
│                                ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ TRY: Recency Strategy                                            │   │
│   │                                                                   │   │
│   │ If conflict type is supersession → Newer wins                    │   │
│   │ If time difference > 30 days → Newer wins                        │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │ Recency not decisive                    │
│                                ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ TRY: Scope Strategy                                              │   │
│   │                                                                   │   │
│   │ If one is more specific → More specific wins                     │   │
│   │ If scopes are compatible → Consider MERGE                        │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │ No clear resolution                     │
│                                ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ FALLBACK: Escalate                                               │   │
│   │                                                                   │   │
│   │ If no strategy produced a winner → ESCALATE                      │   │
│   │ Provide ranked suggestions for human reviewer                    │   │
│   │                                                                   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   OUTPUT: ResolutionDecision                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Conflict Resolver Agent

```markdown
# Agent: Conflict Resolver

## Goal
Determine which version to keep when conflicts exist, using principled resolution strategies.
Output a resolution decision with rationale.

## Rules
- MUST choose: keep proposal, keep existing, merge, or escalate
- MUST provide rationale that references specific factors
- CANNOT lose information unnecessarily — prefer merge over discard
- Escalate if: both high confidence, unclear which is correct, or human context needed
- Resolution decision confidence reflects actual certainty

## Strategies
- Source priority: user_explicit > user_implicit > inferred > system
- Confidence comparison: higher confidence wins (if difference > 0.20)
- Recency: newer wins for supersession conflicts
- Scope: more specific wins over more general
- Merge: when both valid in different contexts
- When close call, prefer keeping existing (conservative)

## Opening
1. Evaluate escalation criteria first
2. Compare source types
3. Compare confidence levels
4. Consider recency
5. Analyze scope relationship
6. If no clear winner, consider merge
7. If merge not appropriate, escalate
8. Document decision with full rationale
```

### 4.4 Conflict Resolver Output Interface

```typescript
/**
 * Output from the Conflict Resolver agent.
 */
interface ConflictResolverOutput {
  // === Decision ===
  decision: 'keep_proposal' | 'keep_existing' | 'merge' | 'escalate';

  // === Rationale ===
  rationale: string;
  confidence: number;

  // === Strategy Used ===
  strategy_applied: ResolutionStrategy;
  strategies_considered: Array<{
    strategy: ResolutionStrategy;
    applicable: boolean;
    result?: 'proposal' | 'existing' | 'merge' | null;
    reason: string;
  }>;

  // === For Merge Decisions ===
  merge_guidance?: {
    suggested_structure: string;
    key_elements_from_proposal: string[];
    key_elements_from_existing: string[];
    scoping_recommendation: string;
  };

  // === For Escalation Decisions ===
  escalation_context?: {
    why_automated_failed: string;
    suggested_resolutions: Array<{
      action: 'keep_proposal' | 'keep_existing' | 'merge';
      rationale: string;
      confidence: number;
    }>;
  };
}
```

### 4.5 Merge Content Agent

Using the GRSO framework from [`llm-agent-model.md`](../04-foundations/llm-agent-model.md):

```markdown
# Agent: Merge Content

## Goal
Combine two conflicting KB entries into a unified entry that preserves information
from both sources with appropriate scoping. Output merged content that resolves
the conflict while maintaining clarity and accuracy.

## Rules
- MUST NOT lose information from either source unless explicitly contradictory
- MUST clearly scope when each claim applies (context, version, use case)
- Output confidence = min(proposal_confidence, existing_confidence)
- Use conditional language where needed: "When X, use Y; when Z, use W"
- Preserve attribution when possible (e.g., "As of [date]...")
- MUST maintain consistent formatting with KB entry standards

## Strategies
- Identify non-conflicting portions to keep verbatim
- Scope conflicting claims by context, version, or use case
- Create clear structure (headings, bullet points) for combined content
- Prioritize more recent information when temporal scoping applies
- Use explicit conditions rather than vague qualifications
- Prefer concrete examples over abstract reconciliation

## Opening
1. Extract core claims from both sources
2. Identify which portions conflict vs which are compatible
3. Determine appropriate scoping criteria (temporal, contextual, conditional)
4. Compose unified content with clear structure
5. Verify no information loss
6. Output merged markdown with confidence assessment
```

### 4.5.1 Merge Content Agent Output Interface

```typescript
/**
 * Output from the Merge Content agent.
 */
interface MergeContentOutput {
  // === Merged Content ===
  merged_content: string;

  // === Structure ===
  content_structure: {
    sections: Array<{
      heading?: string;
      source: 'proposal' | 'existing' | 'synthesized';
      content_summary: string;
    }>;
  };

  // === Scoping Applied ===
  scoping: {
    type: 'temporal' | 'contextual' | 'conditional' | 'none';
    description: string;
    conditions?: string[];
  };

  // === Quality Assessment ===
  assessment: {
    information_preserved: boolean;
    conflicts_resolved: boolean;
    clarity_score: number;  // 0.0-1.0
    confidence: number;     // 0.0-1.0
  };

  // === Warnings ===
  warnings?: string[];
}
```

### 4.6 Confidence Adjustment Rules

After resolution, proposal confidence may be adjusted:

| Scenario | Adjustment | Rationale |
|----------|------------|-----------|
| No conflicts detected | +0.00 | No change |
| Conflict auto-resolved (proposal wins) | -0.05 | Slight uncertainty from conflict |
| Conflict auto-resolved (existing wins) | N/A | Proposal blocked |
| Conflict merged | -0.10 | Combined knowledge may be less precise |
| Conflict escalated | N/A | Proposal pending |
| Escalation resolved (proposal wins) | +0.00 | Human confirmed |

```typescript
function adjust_confidence(
  original: number,
  scenario: 'no_conflict' | 'resolved_wins' | 'merged' | 'human_confirmed'
): number {
  const adjustments: Record<string, number> = {
    'no_conflict': 0.00,
    'resolved_wins': -0.05,
    'merged': -0.10,
    'human_confirmed': 0.00,
  };

  const adjusted = original + (adjustments[scenario] ?? 0);
  return Math.max(0.0, Math.min(1.0, adjusted));
}
```

---

## Part 5: Proposal Validation

### 5.1 Validation Rules

```typescript
interface ValidationRules {
  // === Required Fields ===
  required_fields: string[];  // ['proposal_id', 'episode_id', 'action', ...]

  // === Field Constraints ===
  constraints: {
    action: {
      type: 'enum';
      values: ['create', 'update', 'merge', 'skip'];
    };
    confidence: {
      type: 'range';
      min: 0.0;
      max: 1.0;
    };
    salience: {
      type: 'range';
      min: 0.0;
      max: 1.0;
    };
    target_entry_ids: {
      type: 'conditional_required';
      condition: "action in ['update', 'merge']";
    };
  };

  // === Consistency Checks ===
  consistency_rules: Array<{
    name: string;
    check: (proposal: IntegrationProposal) => boolean;
    error_message: string;
  }>;
}
```

### 5.2 Default Validation Rules

```typescript
const DEFAULT_VALIDATION_RULES: ValidationRules = {
  required_fields: [
    'proposal_id',
    'episode_id',
    'action',
    'decision_rationale',
  ],

  constraints: {
    action: {
      type: 'enum',
      values: ['create', 'update', 'merge', 'skip'],
    },
    confidence: {
      type: 'range',
      min: 0.0,
      max: 1.0,
    },
    salience: {
      type: 'range',
      min: 0.0,
      max: 1.0,
    },
    target_entry_ids: {
      type: 'conditional_required',
      condition: "action in ['update', 'merge']",
    },
  },

  consistency_rules: [
    {
      name: 'create_requires_content',
      check: (p) => p.action !== 'create' || (p.proposed_content?.length ?? 0) > 0,
      error_message: 'Create action requires non-empty proposed_content',
    },
    {
      name: 'update_requires_target',
      check: (p) => p.action !== 'update' || (p.target_entry_ids?.length ?? 0) > 0,
      error_message: 'Update action requires at least one target_entry_id',
    },
    {
      name: 'merge_requires_multiple_targets',
      check: (p) => p.action !== 'merge' || (p.target_entry_ids?.length ?? 0) >= 2,
      error_message: 'Merge action requires at least two target_entry_ids',
    },
    {
      name: 'skip_has_rationale',
      check: (p) => p.action !== 'skip' || (p.decision_rationale?.length ?? 0) > 10,
      error_message: 'Skip action requires substantive decision_rationale',
    },
    {
      name: 'metadata_required_for_create',
      check: (p) => p.action !== 'create' || p.proposed_metadata != null,
      error_message: 'Create action requires proposed_metadata',
    },
    {
      name: 'targets_exist',
      check: async (p) => {
        if (!p.target_entry_ids?.length) return true;
        // Validate targets exist in Storage
        const result = await storage.read_entries_batch({
          entry_ids: p.target_entry_ids
        });
        return result.not_found.length === 0;
      },
      error_message: 'One or more target_entry_ids do not exist',
    },
  ],
};
```

### 5.3 Validation Process

```typescript
interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field?: string;
    rule: string;
    message: string;
  }>;
  warnings: Array<{
    field?: string;
    rule: string;
    message: string;
  }>;
}

async function validate_proposal(
  proposal: IntegrationProposal,
  rules: ValidationRules = DEFAULT_VALIDATION_RULES
): Promise<ValidationResult> {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  // Check required fields
  for (const field of rules.required_fields) {
    if (proposal[field] == null || proposal[field] === '') {
      errors.push({
        field,
        rule: 'required_field',
        message: `Required field '${field}' is missing or empty`,
      });
    }
  }

  // Check constraints
  for (const [field, constraint] of Object.entries(rules.constraints)) {
    const value = proposal[field];

    if (constraint.type === 'enum' && value != null) {
      if (!constraint.values.includes(value)) {
        errors.push({
          field,
          rule: 'enum_constraint',
          message: `Field '${field}' must be one of: ${constraint.values.join(', ')}`,
        });
      }
    }

    if (constraint.type === 'range' && value != null) {
      if (value < constraint.min || value > constraint.max) {
        errors.push({
          field,
          rule: 'range_constraint',
          message: `Field '${field}' must be between ${constraint.min} and ${constraint.max}`,
        });
      }
    }
  }

  // Check consistency rules
  for (const rule of rules.consistency_rules) {
    const passes = await rule.check(proposal);
    if (!passes) {
      errors.push({
        rule: rule.name,
        message: rule.error_message,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

---

## Part 6: Escalation Flow

### 6.1 Escalation Criteria

```typescript
interface EscalationCriteria {
  // === Automatic Escalation ===
  always_escalate: {
    both_user_explicit: boolean;          // Both sources are user_explicit
    critical_severity: boolean;           // Conflict severity is critical
    low_conflict_confidence: boolean;     // Conflict detection confidence < 0.70
  };

  // === Conditional Escalation ===
  escalate_if: {
    high_confidence_threshold: number;    // Both sides >= this
    confidence_difference_max: number;    // Auto-resolve only if diff > this
    categories_requiring_human: string[]; // e.g., ['security', 'compliance']
  };

  // === Never Escalate ===
  skip_escalation: {
    low_confidence_proposal: number;      // Proposal conf < this → reject without escalation
    system_source_only: boolean;          // Both system-generated → auto-resolve
  };
}

const DEFAULT_ESCALATION_CRITERIA: EscalationCriteria = {
  always_escalate: {
    both_user_explicit: true,
    critical_severity: true,
    low_conflict_confidence: true,
  },
  escalate_if: {
    high_confidence_threshold: 0.80,
    confidence_difference_max: 0.15,
    categories_requiring_human: ['security', 'compliance', 'architecture'],
  },
  skip_escalation: {
    low_confidence_proposal: 0.30,
    system_source_only: true,
  },
};
```

### 6.2 Escalation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ESCALATION FLOW                                  │
│                                                                          │
│   Conflict cannot be auto-resolved                                       │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ CREATE ESCALATION                                                │   │
│   │                                                                   │   │
│   │ • Generate escalation_id                                         │   │
│   │ • Set status = 'pending'                                          │   │
│   │ • Prepare conflict context                                       │   │
│   │ • Generate suggested resolutions                                 │   │
│   │ • Set timeout (default: 72 hours)                                │   │
│   │ • Persist to .kahuna/escalations/                                │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │                                          │
│                                ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ NOTIFY (optional)                                                │   │
│   │                                                                   │   │
│   │ If notification configured:                                       │   │
│   │ • Format notification message                                    │   │
│   │ • Send via configured channel (log, webhook, etc.)               │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │                                          │
│                                ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ AWAIT RESOLUTION                                                 │   │
│   │                                                                   │   │
│   │ Proposal marked as 'escalated' (not passed to Consolidation)     │   │
│   │ Human can resolve via:                                           │   │
│   │ • MCP tool: kahuna_resolve_escalation                            │   │
│   │ • Direct file edit in escalations directory                      │   │
│   │                                                                   │   │
│   └────────────────────────────┬────────────────────────────────────┘   │
│                                │                                          │
│           ┌────────────────────┼────────────────────┐                    │
│           │                    │                    │                    │
│           ▼                    ▼                    ▼                    │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐             │
│   │   RESOLVED    │   │   TIMEOUT     │   │  DISMISSED    │             │
│   │               │   │               │   │               │             │
│   │ Human made    │   │ Timeout       │   │ Human chose   │             │
│   │ decision      │   │ reached       │   │ to dismiss    │             │
│   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘             │
│           │                   │                   │                       │
│           ▼                   ▼                   ▼                       │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ APPLY RESOLUTION                                                 │   │
│   │                                                                   │   │
│   │ Based on decision:                                               │   │
│   │ • keep_proposal → Mark proposal as valid                         │   │
│   │ • keep_existing → Block proposal                                 │   │
│   │ • merge → Create merged proposal                                 │   │
│   │ • dismiss_both → Block proposal + archive existing               │   │
│   │ • timeout → Apply timeout_action (default: keep_existing)        │   │
│   │                                                                   │   │
│   │ Log decision to audit trail                                       │   │
│   │                                                                   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Escalation Context Preparation

What information is provided to the human reviewer:

```typescript
interface EscalationContext {
  // === Conflict Summary ===
  conflict_summary: {
    type: ConflictType;
    severity: ConflictSeverity;
    description: string;
    detection_confidence: number;
  };

  // === The Claims ===
  proposal_claim: {
    content: string;
    source: string;
    confidence: number;
    session_context?: string;   // Brief context from originating session
  };

  existing_claim: {
    content: string;
    source: string;
    confidence: number;
    created_at: string;
    access_count: number;       // How often this has been used
  };

  // === Suggestions ===
  suggested_resolutions: Array<{
    action: 'keep_proposal' | 'keep_existing' | 'merge';
    description: string;
    rationale: string;
    confidence: number;
  }>;

  // === Context ===
  related_entries?: Array<{
    id: string;
    title: string;
    relevance: string;
  }>;

  // === Instructions ===
  instructions: string;
}
```

### 6.4 Human Decision Interface

```typescript
interface HumanDecision {
  // === Identity ===
  escalation_id: string;
  reviewer: string;              // Who made the decision
  decided_at: string;

  // === Decision ===
  decision: 'keep_proposal' | 'keep_existing' | 'merge' | 'dismiss_both';

  // === Rationale ===
  rationale: string;             // Required explanation

  // === For Merge Decisions ===
  merged_content?: string;       // If decision is 'merge'

  // === Confidence ===
  reviewer_confidence?: number;  // Optional: how confident reviewer is
}

// MCP tool for resolving escalations
interface ResolveEscalationInput {
  escalation_id: string;
  decision: HumanDecision['decision'];
  rationale: string;
  merged_content?: string;
}
```

### 6.5 Timeout Handling

```typescript
interface TimeoutConfig {
  // === Duration ===
  default_timeout_hours: number;   // Default: 72

  // === Action on Timeout ===
  timeout_action: 'keep_existing' | 'keep_proposal' | 'dismiss';

  // === Escalation ===
  timeout_re_escalate: boolean;    // Re-escalate on next consolidation?
  max_re_escalations: number;      // Default: 3
}

async function check_escalation_timeouts(): Promise<void> {
  const queue = await get_escalation_queue();
  const now = new Date();

  for (const escalation of queue.pending) {
    const timeout_at = new Date(escalation.timeout_at);

    if (now > timeout_at) {
      // Handle timeout
      const action = escalation.timeout_action;

      await apply_timeout_resolution(escalation, action);

      await log_timeout({
        escalation_id: escalation.escalation_id,
        action,
        timed_out_at: now.toISOString(),
      });
    }
  }
}
```

### 6.6 Concurrent Escalation Handling

#### 6.6.1 Problem Statement

Multiple concurrent operations can create race conditions:
1. Two users attempting to resolve the same escalation simultaneously
2. A new proposal triggering escalation while a related escalation is pending
3. Timeout processing running while a human is actively resolving

#### 6.6.2 Concurrency Strategy

**Optimistic Locking for Resolution:**

```typescript
interface EscalationLock {
  escalation_id: string;
  version: number;              // Incremented on each state change
  locked_by?: string;           // Reviewer who has it open
  locked_at?: string;           // When lock was acquired
  lock_timeout_minutes: number; // Default: 30
}

async function resolve_escalation_safe(
  escalation_id: string,
  decision: HumanDecision,
  expected_version: number
): Promise<ResolveEscalationOutput> {
  const current = await get_escalation(escalation_id);

  // Version check - reject if escalation was modified
  if (current.version !== expected_version) {
    throw new ConcurrencyError({
      type: 'version_mismatch',
      message: 'Escalation was modified by another process',
      current_version: current.version,
      expected_version,
      current_status: current.status,
    });
  }

  // Status check - reject if already resolved
  if (current.status !== 'pending' && current.status !== 'in_review') {
    throw new ConcurrencyError({
      type: 'invalid_status',
      message: `Cannot resolve escalation in status: ${current.status}`,
      current_status: current.status,
    });
  }

  // Apply resolution with version increment
  return await apply_resolution(escalation_id, decision, current.version + 1);
}
```

**Related Escalation Detection:**

```typescript
interface RelatedEscalationCheck {
  proposal_id: string;
  existing_escalations: Array<{
    escalation_id: string;
    relationship: 'same_proposal' | 'same_entry' | 'related_topic';
    status: Escalation['status'];
  }>;
}

async function check_related_escalations(
  proposal: IntegrationProposal
): Promise<RelatedEscalationCheck> {
  const pending = await get_escalation_queue({ status_filter: ['pending', 'in_review'] });

  const related = pending.escalations.filter(esc => {
    // Same proposal being re-escalated
    if (esc.proposal.proposal_id === proposal.proposal_id) {
      return true;
    }
    // Same target entry
    if (proposal.target_entry_ids?.some(id =>
      esc.existing_entry.id === id || esc.proposal.target_entry_ids?.includes(id)
    )) {
      return true;
    }
    return false;
  });

  return {
    proposal_id: proposal.proposal_id,
    existing_escalations: related.map(esc => ({
      escalation_id: esc.escalation_id,
      relationship: esc.proposal.proposal_id === proposal.proposal_id
        ? 'same_proposal'
        : 'same_entry',
      status: esc.status,
    })),
  };
}
```

#### 6.6.3 Handling Strategies

| Scenario | Strategy |
|----------|----------|
| **Concurrent resolution attempts** | First-write-wins with version check; second attempt gets ConcurrencyError |
| **Related pending escalation exists** | Link new escalation to existing; notify reviewer of relationship |
| **Timeout during active review** | Extend timeout if `in_review` status; only timeout truly abandoned escalations |
| **Duplicate proposal escalation** | Deduplicate by proposal_id; update existing escalation context if needed |

#### 6.6.4 Error Types

```typescript
interface ConcurrencyError {
  type: 'version_mismatch' | 'invalid_status' | 'lock_held' | 'duplicate_escalation';
  message: string;
  current_version?: number;
  expected_version?: number;
  current_status?: Escalation['status'];
  held_by?: string;
  related_escalation_id?: string;
}
```

---

## Part 7: Public API

### 7.1 Primary Operations

#### validate_proposals

Validate a batch of proposals for structural correctness.

```typescript
interface ValidateProposalsInput {
  proposals: IntegrationProposal[];
}

interface ValidateProposalsOutput {
  results: Array<{
    proposal_id: string;
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

function validate_proposals(input: ValidateProposalsInput): Promise<ValidateProposalsOutput>;
```

---

#### detect_conflicts

Detect conflicts between proposals and existing KB.

```typescript
interface DetectConflictsInput {
  proposals: IntegrationProposal[];
  options?: {
    similarity_threshold?: number;   // Override default
    max_candidates_per_proposal?: number;
  };
}

interface DetectConflictsOutput {
  report: ConflictReport;
}

function detect_conflicts(input: DetectConflictsInput): Promise<DetectConflictsOutput>;
```

---

#### resolve_conflicts

Attempt to resolve detected conflicts.

```typescript
interface ResolveConflictsInput {
  conflict_report: ConflictReport;
  proposals: IntegrationProposal[];
  options?: {
    escalation_criteria?: EscalationCriteria;
    allowed_strategies?: ResolutionStrategy[];
  };
}

interface ResolveConflictsOutput {
  result: ResolutionResult;
  escalations_created: Escalation[];
}

function resolve_conflicts(input: ResolveConflictsInput): Promise<ResolveConflictsOutput>;
```

---

#### process_proposals (Composite)

Full error handling pipeline: validate → detect → resolve.

```typescript
interface ProcessProposalsInput {
  proposals: IntegrationProposal[];
}

interface ProcessProposalsOutput {
  validated_proposals: ValidatedProposal[];

  summary: {
    input_count: number;
    valid_count: number;
    invalid_count: number;
    conflict_free_count: number;
    auto_resolved_count: number;
    escalated_count: number;
  };

  // Ready for Consolidation
  ready_for_consolidation: IntegrationProposal[];

  // Blocked
  blocked_proposals: Array<{
    proposal_id: string;
    reason: 'invalid' | 'conflict_unresolved' | 'escalated';
    details: string;
  }>;
}

function process_proposals(input: ProcessProposalsInput): Promise<ProcessProposalsOutput>;
```

---

#### get_validated_proposals

Retrieve validated proposals ready for Consolidation. This is the primary interface for the Error Handling → Consolidation contract.

```typescript
interface GetValidatedProposalsInput {
  include_escalated?: boolean;    // Default: false - exclude pending escalations
  since?: string;                 // ISO 8601 - only proposals validated after this time
  batch_id?: string;              // Filter by specific processing batch
}

interface GetValidatedProposalsOutput {
  proposals: ValidatedProposal[];

  summary: {
    total_ready: number;
    escalated_pending: number;
    oldest_proposal_at: string;
  };

  // For pagination if needed
  has_more: boolean;
  next_cursor?: string;
}

function get_validated_proposals(input: GetValidatedProposalsInput): Promise<GetValidatedProposalsOutput>;
```

**Contract Notes:**
- Returns only proposals that have passed validation AND conflict resolution
- Escalated proposals are excluded by default (they're not ready for consolidation)
- Consolidation can assume all returned proposals are safe to apply
- Proposals are returned in order of validation time (oldest first)

---

### 7.2 Escalation Operations

#### get_escalation_queue

Get current escalation queue status.

```typescript
interface GetEscalationQueueInput {
  status_filter?: Escalation['status'][];
  limit?: number;
}

interface GetEscalationQueueOutput {
  escalations: Escalation[];
  stats: EscalationQueue['stats'];
}

function get_escalation_queue(input: GetEscalationQueueInput): Promise<GetEscalationQueueOutput>;
```

---

#### resolve_escalation

Record human decision for an escalation.

```typescript
interface ResolveEscalationInput {
  escalation_id: string;
  decision: HumanDecision;
}

interface ResolveEscalationOutput {
  success: boolean;
  escalation: Escalation;        // Updated escalation
  affected_proposal?: IntegrationProposal;  // Modified proposal if applicable
}

function resolve_escalation(input: ResolveEscalationInput): Promise<ResolveEscalationOutput>;
```

---

#### dismiss_escalation

Dismiss an escalation without resolution.

```typescript
interface DismissEscalationInput {
  escalation_id: string;
  reason: string;
  reviewer: string;
}

interface DismissEscalationOutput {
  success: boolean;
  escalation: Escalation;
}

function dismiss_escalation(input: DismissEscalationInput): Promise<DismissEscalationOutput>;
```

---

### 7.3 Query Operations

#### get_conflict_history

Get historical conflict data for analysis.

```typescript
interface GetConflictHistoryInput {
  since?: string;                // ISO 8601
  until?: string;
  conflict_types?: ConflictType[];
  resolution_strategies?: ResolutionStrategy[];
  limit?: number;
}

interface GetConflictHistoryOutput {
  conflicts: Array<{
    conflict: Conflict;
    resolution: ResolutionDecision;
    outcome: 'proposal_applied' | 'proposal_blocked' | 'merged';
  }>;

  analytics: {
    total_conflicts: number;
    by_type: Record<ConflictType, number>;
    by_strategy: Record<ResolutionStrategy, number>;
    escalation_rate: number;
    avg_resolution_time_hours: number;
  };
}

function get_conflict_history(input: GetConflictHistoryInput): Promise<GetConflictHistoryOutput>;
```

---

## Part 8: Integration Contracts

### 8.1 Integration → Error Handling Contract

**Operation:** `process_proposals`

From [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) Part 6.4.

```typescript
// Integration calls this after producing proposals
const result = await errorHandling.process_proposals({
  proposals: integrationProposals,
});

// Use validated proposals
const readyForConsolidation = result.ready_for_consolidation;
```

**Contract:**
- Integration provides valid IntegrationProposal objects
- Error Handling validates, detects conflicts, resolves where possible
- Returns proposals ready for Consolidation (clean or resolved)
- Blocked proposals are separated with reasons

---

### 8.2 Error Handling → Consolidation Contract

**Operation:** `get_validated_proposals`

From [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) Part 6.5.

```typescript
// Consolidation calls this to get validated proposals
const validated = await errorHandling.get_validated_proposals({
  include_escalated: false,  // Don't include pending escalations
});

// All returned proposals are safe to apply
for (const proposal of validated.proposals) {
  await consolidation.apply_proposal(proposal);
}
```

**Contract:**
- Returns only proposals that have passed validation and conflict resolution
- Escalated proposals are NOT returned (unless include_escalated=true)
- Consolidation can assume all returned proposals are safe to apply

---

### 8.3 Error Handling → Storage Contract

**Operation:** `semantic_search`, `read_entries_batch`

```typescript
// Error Handling queries Storage to find potential conflicts
const candidates = await storage.semantic_search({
  query: proposal.proposed_content,
  filters: {
    categories: [proposal.proposed_metadata.category],
  },
  limit: 10,
});

// Read full entries for conflict analysis
const entries = await storage.read_entries_batch({
  entry_ids: candidates.results.map(r => r.entry_id),
  include_content: true,
});
```

**Contract:**
- Error Handling reads from Storage (never writes)
- Uses semantic search to find potential conflicts
- Uses batch read for efficiency
- Does NOT update access timestamps (read-only for analysis)

---

### 8.4 MCP Tools → Error Handling Contract

For human escalation resolution:

```typescript
// MCP tool: kahuna_resolve_escalation
const result = await errorHandling.resolve_escalation({
  escalation_id: 'esc-abc12345',
  decision: {
    escalation_id: 'esc-abc12345',
    reviewer: 'user',
    decided_at: new Date().toISOString(),
    decision: 'keep_proposal',
    rationale: 'The newer information is more accurate based on recent changes.',
  },
});

// MCP tool: kahuna_list_escalations
const queue = await errorHandling.get_escalation_queue({
  status_filter: ['pending'],
});
```

---

## Part 9: Implementation Considerations

### 9.1 Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Conflict Detection** | LLM Agent | Semantic comparison requires understanding |
| **Conflict Resolution** | Rule-based + LLM | Rules for clear cases, LLM for merge |
| **Validation** | TypeScript functions | Fast, deterministic |
| **Escalation Storage** | JSON files | Human-readable, git-friendly |
| **Audit Log** | SQLite | Queryable, structured |

### 9.2 LLM Agent Configuration

```typescript
interface AgentConfig {
  // === Model Selection ===
  conflict_detector_model: string;   // e.g., 'claude-3-sonnet'
  conflict_resolver_model: string;   // e.g., 'claude-3-haiku' (simpler task)

  // === Token Limits ===
  max_context_tokens: number;        // Default: 8000
  max_output_tokens: number;         // Default: 2000

  // === Temperature ===
  detection_temperature: number;     // Default: 0.3 (consistent detection)
  resolution_temperature: number;    // Default: 0.5 (some flexibility for merge)

  // === Retry ===
  max_retries: number;               // Default: 2
  retry_delay_ms: number;            // Default: 1000
}
```

### 9.3 Performance Considerations

| Operation | Target Latency | Strategy |
|-----------|---------------|----------|
| `validate_proposals` (batch) | < 100ms | Pure TypeScript validation |
| `detect_conflicts` (per proposal) | < 2s | LLM call + semantic search |
| `resolve_conflicts` (per conflict) | < 1s | Rule-based, LLM only for merge |
| `process_proposals` (full pipeline) | < 10s for 10 proposals | Parallel processing where safe |

**Optimization strategies:**
- Batch semantic searches across proposals
- Cache conflict detection results during pipeline
- Use faster model for simple conflict resolution
- Parallelize independent proposal processing

### 9.4 Directory Structure

```
.kahuna/
├── escalations/                   # Pending escalations
│   ├── esc-abc12345.json          # Individual escalation files
│   ├── esc-def67890.json
│   └── queue.json                 # Queue metadata
│
├── audit/                         # Audit logs
│   └── conflicts/
│       ├── 2026-03/               # Organized by month
│       │   ├── conflict-log.jsonl # Append-only log
│       │   └── resolutions.jsonl  # Resolution decisions
│       └── index.sqlite           # Queryable index
│
└── config/
    └── error-handling.json        # Configuration
```

### 9.5 Configuration Schema

```typescript
interface ErrorHandlingConfig {
  // === Detection ===
  detection: {
    semantic_search_limit: number;
    min_similarity_for_comparison: number;
    min_confidence_to_report: number;
  };

  // === Resolution ===
  resolution: {
    allowed_strategies: ResolutionStrategy[];
    confidence_difference_threshold: number;
    recency_threshold_days: number;
  };

  // === Escalation ===
  escalation: {
    criteria: EscalationCriteria;
    timeout_hours: number;
    timeout_action: 'keep_existing' | 'keep_proposal' | 'dismiss';
    notification: {
      enabled: boolean;
      channel: 'log' | 'webhook' | 'file';
      webhook_url?: string;
    };
  };

  // === Audit ===
  audit: {
    enabled: boolean;
    retention_days: number;
  };

  // === Agent ===
  agent: AgentConfig;
}
```

### 9.6 Error Handling Within Error Handling

Meta-level error handling for the subsystem itself:

| Error | Recovery Strategy |
|-------|-------------------|
| LLM API failure | Retry with backoff; if persistent, escalate all conflicts |
| Storage read failure | Fail fast; cannot safely detect conflicts |
| Validation error in proposal | Mark invalid with detailed error message |
| Conflict detection timeout | Treat as "no conflicts detected" with warning |
| Resolution strategy failure | Try next strategy; ultimately escalate |

```typescript
async function detect_conflicts_with_fallback(
  proposal: IntegrationProposal
): Promise<Conflict[]> {
  try {
    return await detect_conflicts_llm(proposal);
  } catch (error) {
    if (isRetryableError(error)) {
      await delay(1000);
      return await detect_conflicts_llm(proposal);
    }

    // On persistent failure, log warning and assume no conflicts
    // This is conservative — proposal will proceed and conflicts
    // may be detected in future consolidation cycles
    logger.warn('Conflict detection failed, proceeding with caution', {
      proposal_id: proposal.proposal_id,
      error,
    });

    return [];
  }
}
```

---

## Part 10: Testing Strategy

### 10.1 Unit Tests

| Component | Test Focus |
|-----------|------------|
| **Proposal Validator** | Schema validation, required fields, consistency rules |
| **Conflict Detector** | Conflict type classification, severity assignment |
| **Conflict Resolver** | Strategy selection, confidence adjustment |
| **Escalation Handler** | Queue management, timeout handling |

### 10.2 Integration Tests

| Scenario | Verification |
|----------|--------------|
| Full pipeline | Proposals → Validate → Detect → Resolve → Output |
| Escalation flow | Create → Await → Resolve → Apply |
| Multi-conflict | Proposal conflicting with multiple entries |
| Merge resolution | Content correctly merged |

### 10.3 Edge Cases

| Edge Case | Expected Behavior |
|-----------|-------------------|
| Empty proposal batch | Return empty results |
| All proposals invalid | Return all as blocked with errors |
| Proposal conflicts with itself | Skip self-comparison |
| Circular conflict (A→B→C→A) | Detect all conflicts, escalate |
| High-volume batch (100+ proposals) | Process with parallelization |

### 10.4 Conflict Detection Test Cases

```typescript
const CONFLICT_TEST_CASES = [
  {
    name: 'direct_contradiction',
    proposal: 'Use PostgreSQL for the database',
    existing: 'Use SQLite for the database',
    expected_type: 'direct_contradiction',
    expected_severity: 'high',
  },
  {
    name: 'no_conflict_different_topics',
    proposal: 'Use 2-space indentation in Python',
    existing: 'Use camelCase for JavaScript variables',
    expected_type: null,  // No conflict
  },
  {
    name: 'supersession',
    proposal: 'API v2 uses REST endpoints',
    existing: 'API v1 uses SOAP endpoints',
    expected_type: 'supersession',
    expected_severity: 'medium',
  },
  {
    name: 'partial_overlap',
    proposal: 'Always use async/await for I/O operations',
    existing: 'Use synchronous file operations for config loading',
    expected_type: 'partial_overlap',
    expected_severity: 'medium',
  },
  {
    name: 'implicit_contradiction',
    proposal: 'Prefer immutable data structures',
    existing: 'Modify state in place for performance',
    expected_type: 'implicit_contradiction',
    expected_severity: 'high',
  },
];
```

---

## Part 11: Bayesian Interpretation

### 11.1 Error Handling as Belief Revision

From [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) Part 9:

> Error Handling maintains P(H) coherence — ensuring the prior distribution doesn't contain contradictory beliefs.

In Bayesian terms:

```
P(H) = Prior (the KB)
Conflict = P(A) > 0 AND P(not-A) > 0 where A and not-A are contradictory

Belief revision ensures:
∀ contradictory pairs (A, not-A): P(A) + P(not-A) ≤ 1

Error Handling enforces this by:
1. Detecting when P(A) and P(not-A) both have significant mass
2. Resolving by reducing one or the other
3. Escalating when resolution is uncertain
```

### 11.2 Confidence as Probability Mass

The confidence scores in proposals and entries represent probability mass:

```
Entry A: "Use PostgreSQL" with confidence 0.85
Entry B: "Use SQLite" with confidence 0.60

If both are in KB, we have:
P(Use PostgreSQL) = 0.85
P(Use SQLite) = 0.60

This is incoherent if they're mutually exclusive.

Resolution (confidence strategy):
Keep A (higher confidence), remove B
Result: P(Use PostgreSQL) = 0.85, P(Use SQLite) = 0
```

### 11.3 Resolution as Belief Update

Each resolution strategy corresponds to a belief update rule:

| Strategy | Belief Update Rule |
|----------|-------------------|
| **Recency** | Newer evidence dominates: P(H_new) = P(H_new\|E_recent) |
| **Confidence** | Higher-confidence belief dominates: keep max(P(A), P(B)) |
| **Source Priority** | User-explicit is more reliable: P(H\|user_explicit) > P(H\|inferred) |
| **Scope** | More specific belief is more informative |
| **Merge** | Both beliefs are valid in different contexts |
| **Escalate** | Insufficient information for automated update |

### 11.4 G-Level Analysis

Error Handling operates at G3 with G4 elements:

```
G3: Applying rules about rules
    - "If proposal confidence > existing + 0.20, proposal wins"
    - "If both user_explicit, escalate"
    - "If supersession, newer wins"

G4: Resolving meta-conflicts
    - "Which rule applies to this conflict?"
    - "How to weight conflicting heuristics?"
    - This is where LLM judgment is needed
```

---

## Summary

### What This Document Establishes

1. **Component Architecture** — Four components (Validator, Detector, Resolver, Escalation Handler) with clear responsibilities
2. **Conflict Types** — Taxonomy of six conflict types with detection rules
3. **Resolution Strategies** — Six strategies with selection algorithm
4. **Escalation Flow** — Complete human-in-the-loop workflow
5. **Validation Rules** — Comprehensive proposal validation
6. **Public API** — Full set of operations for error handling
7. **Integration Contracts** — Connections to Integration, Consolidation, Storage
8. **Bayesian Grounding** — Error handling as belief revision

### Bayesian Role Reminder

Error Handling maintains P(H) coherence:
- **Conflict Detection** finds where P(H) is inconsistent
- **Conflict Resolution** restores consistency
- **Escalation** handles cases beyond automated repair
- The KB remains a valid probability distribution

### Dependencies

| Depends On | For |
|------------|-----|
| Storage | Reading existing entries for conflict detection |
| LLM (Anthropic API) | Conflict detection and merge resolution |
| Integration | Proposals to process |

| Depended On By | For |
|----------------|-----|
| Consolidation | Validated proposals to apply |
| MCP Tools | Escalation resolution interface |

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| LLM-based conflict detection | Semantic comparison requires understanding |
| Rule-based resolution with LLM fallback | Fast for clear cases, capable for complex |
| Escalation as first-class concept | Human judgment essential for high-stakes conflicts |
| Conservative confidence adjustment | Conflicts reduce certainty |
| Audit logging | Decisions must be explainable |

---

## Changelog

- v1.1 (2026-03-08): Address analysis review gaps
  - Added `get_validated_proposals` API operation (Part 7.1)
  - Added `merge_content_agent` GRSO specification (Part 4.5)
  - Added Conflict Detector output interface (Part 3.5)
  - Added Conflict Resolver output interface (Part 4.4)
  - Added concurrent escalation handling section (Part 6.6)
  - Fixed action enum inconsistency (removed `delete` from validation rules)
- v1.0 (2026-03-08): Initial Error Handling subsystem design