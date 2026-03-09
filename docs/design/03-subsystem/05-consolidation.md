# Consolidation Subsystem Design

**Type:** Subsystem Design Document
**Date:** 2026-03-08
**Status:** Draft (v1.1)
**Purpose:** Define the Consolidation subsystem — transforming episodic learning into persistent KB knowledge

**Related:**
- [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) — Parent architecture (subsystem boundaries, contracts)
- [`01-storage.md`](01-storage.md) — Storage interface (create_entry, apply_updates, search_semantic)
- [`00-common-schemas.md`](00-common-schemas.md) — Episode Schema, Integration Decision Criteria
- [`03-error-handling.md`](03-error-handling.md) — Conflict detection and resolution
- [`static-dynamic-integration.md`](../02-architecture/static-dynamic-integration.md) — Consolidation as Bayesian Update
- [`llm-agent-model.md`](../04-foundations/llm-agent-model.md) — GRSO agent specification pattern

---

## Executive Summary

The Consolidation subsystem is Kahuna's **Bayesian update engine** — it transforms raw episodic evidence (conversation logs) into persistent KB knowledge (beliefs). This is where learning becomes memory.

**Core Responsibilities:**
- Extract discrete knowledge claims (episodes) from conversation logs
- Determine integration strategy for each claim against existing KB
- Generate atomic storage operations to persist knowledge updates
- Coordinate with Error Handling for conflict resolution

**Bayesian Role:** Consolidation performs P(H|E) = Bayesian Update. Takes new evidence (episodes extracted from sessions) and updates beliefs (KB entries). Episodes are evidence; KB entries are hypotheses. The Integration Agent determines how new evidence should modify the belief distribution.

**G-Level:** G5-G6
- Operates on G5 (strategy selection): Chooses integration strategy (create, update, merge, skip)
- Operates on G6 (meta-strategy): Resolves conflicts between strategies, manages multi-episode coherence
- Transforms G3 content (extracted knowledge) into G0 storage operations

---

## Part 1: Component Architecture

### 1.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CONSOLIDATION SUBSYSTEM                                     │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           PUBLIC API                                             │   │
│   │                                                                                   │   │
│   │   consolidate_session(log: ConversationLog) → ConsolidationResult               │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                                  │
│                                        ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         EXTRACT AGENT                                            │   │
│   │                         (LLM-powered)                                            │   │
│   │                                                                                   │   │
│   │   • Analyze conversation log                                                      │   │
│   │   • Identify discrete knowledge claims                                            │   │
│   │   • Classify episode types (decision, error, pattern, etc.)                      │   │
│   │   • Assign confidence scores                                                      │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │ Episodes[]                                        │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         INTEGRATION AGENT                                        │   │
│   │                         (LLM-powered)                                            │   │
│   │                                                                                   │   │
│   │   • Query KB for related entries                                                  │   │
│   │   • Classify relationship (supersedes, extends, related, duplicate)              │   │
│   │   • Decide action (create, update, merge, skip)                                  │   │
│   │   • Generate integration proposals                                                │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │ IntegrationProposal[]                             │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         CONFLICT DETECTOR                                        │   │
│   │                                                                                   │   │
│   │   • Identify conflicts between proposals and KB                                   │   │
│   │   • Classify conflict types                                                       │   │
│   │   • Route to Error Handling subsystem                                             │   │
│   │   • Apply resolutions to proposals                                                │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │ ResolvedProposal[]                                │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         UPDATE GENERATOR                                         │   │
│   │                                                                                   │   │
│   │   • Transform proposals into storage operations                                   │   │
│   │   • Generate atomic operation sequences                                           │   │
│   │   • Compute initial salience for new entries                                      │   │
│   │   • Handle merge/supersession bookkeeping                                         │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │ StorageOperation[]                                │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         CONSOLIDATION PIPELINE                                   │   │
│   │                         (Orchestrator)                                           │   │
│   │                                                                                   │   │
│   │   • Execute operations against Storage                                            │   │
│   │   • Track success/failure per operation                                           │   │
│   │   • Generate consolidation report                                                 │   │
│   │   • Handle rollback on critical failures                                          │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Responsibilities

#### Extract Agent

**Purpose:** Identify discrete knowledge claims from conversation logs using LLM analysis.

| Responsibility | Description |
|----------------|-------------|
| **Log Analysis** | Parse conversation turns to understand context and flow |
| **Claim Identification** | Identify moments where knowledge was expressed or discovered |
| **Type Classification** | Classify each episode (decision, error, pattern, preference, fact, correction) |
| **Confidence Assignment** | Assign confidence based on source, explicitness, and confirmation |
| **Source Attribution** | Record turn ranges, timestamps, and actor information |

**Owns:**
- Episode extraction logic
- Confidence calibration rules
- Episode type definitions

#### Integration Agent

**Purpose:** Determine how each episode should integrate with existing KB knowledge.

| Responsibility | Description |
|----------------|-------------|
| **KB Querying** | Find potentially related entries via semantic search |
| **Similarity Assessment** | Evaluate semantic similarity between episode and candidates |
| **Relationship Classification** | Classify as supersedes, extends, related, or duplicate |
| **Action Decision** | Choose create, update, merge, or skip |
| **Proposal Generation** | Generate structured integration proposals |

**Owns:**
- Integration decision algorithm
- Relationship classification logic
- Proposal structure generation

#### Conflict Detector

**Purpose:** Identify and route conflicts between proposals and existing KB state.

| Responsibility | Description |
|----------------|-------------|
| **Conflict Identification** | Detect contradictions, outdated info, overlaps |
| **Conflict Classification** | Categorize by type (CONTRADICTION, OUTDATED, etc.) |
| **Error Handling Routing** | Route to Error Handling subsystem for resolution |
| **Resolution Application** | Apply resolved decisions back to proposals |

**Owns:**
- Conflict detection rules
- Conflict type taxonomy
- Error Handling integration

#### Update Generator

**Purpose:** Transform integration proposals into atomic storage operations.

| Responsibility | Description |
|----------------|-------------|
| **Operation Mapping** | Map actions to storage operations (create_entry, apply_updates, etc.) |
| **Salience Computation** | Calculate initial salience for new entries |
| **Merge Execution** | Handle multi-entry merges with provenance tracking |
| **Supersession Handling** | Archive superseded entries, update references |

**Owns:**
- Operation generation logic
- Initial salience computation
- Merge/supersession algorithms

#### Consolidation Pipeline

**Purpose:** Orchestrate the full consolidation flow and execute storage operations.

| Responsibility | Description |
|----------------|-------------|
| **Flow Orchestration** | Coordinate Extract → Integrate → Resolve → Generate → Execute |
| **Operation Execution** | Execute storage operations with error handling |
| **Transaction Management** | Ensure atomic operation groups succeed or rollback |
| **Report Generation** | Produce consolidation results with statistics |

**Owns:**
- Pipeline sequencing
- Execution error handling
- Result aggregation

---

## Part 2: Data Structures

### 2.1 Input Schema

```typescript
// ConversationLog and Episode imported from 00-common-schemas.md
import { ConversationLog, Episode } from './common-schemas';

interface ConsolidateSessionInput {
  // === Session Data ===
  log: ConversationLog;           // Full conversation log

  // === Options ===
  options?: ConsolidationOptions;
}

interface ConsolidationOptions {
  // === Processing Control ===
  dry_run?: boolean;              // Generate proposals without executing (default: false)
  min_confidence?: number;        // Skip episodes below this confidence (default: 0.3)

  // === Conflict Handling ===
  conflict_strategy?: 'escalate' | 'auto_resolve' | 'skip';  // default: 'escalate'

  // === Output Control ===
  include_skipped?: boolean;      // Include skipped episodes in report (default: false)
  verbose?: boolean;              // Include detailed rationales (default: false)
}
```

### 2.2 Output Schema: Consolidation Result

```typescript
interface ConsolidationResult {
  // === Identity ===
  session_id: string;             // Source session
  consolidation_id: string;       // Unique consolidation run ID
  completed_at: string;           // ISO 8601 timestamp

  // === Outcomes ===
  outcomes: ConsolidationOutcome[];

  // === Statistics ===
  stats: {
    episodes_extracted: number;   // Total episodes found
    episodes_processed: number;   // Episodes that generated actions
    episodes_skipped: number;     // Episodes skipped (duplicate, low confidence)
    entries_created: number;      // New KB entries
    entries_updated: number;      // Existing entries modified
    entries_merged: number;       // Entries combined
    conflicts_detected: number;   // Conflicts found
    conflicts_resolved: number;   // Conflicts auto-resolved
    conflicts_escalated: number;  // Conflicts requiring review
    processing_time_ms: number;   // Total processing time
  };

  // === Warnings ===
  warnings?: string[];            // Non-fatal issues encountered

  // === Errors ===
  errors?: ConsolidationError[];  // Errors that prevented some operations
}

interface ConsolidationOutcome {
  // === Episode Reference ===
  episode_id: string;
  episode_type: EpisodeType;
  episode_content: string;        // Brief summary

  // === Action Taken ===
  action: 'created' | 'updated' | 'merged' | 'skipped' | 'failed';

  // === Affected Entries ===
  affected_entries: {
    entry_id: string;
    operation: 'created' | 'updated' | 'archived' | 'linked';
  }[];

  // === Decision Info ===
  decision_rationale: string;
  confidence: number;             // Final confidence after propagation

  // === Conflict Info (if any) ===
  conflict?: {
    type: ConflictType;
    resolution: string;
    resolved_by: 'auto' | 'escalated' | 'skipped';
  };
}

interface ConsolidationError {
  episode_id?: string;            // Which episode (if applicable)
  operation?: string;             // Which operation failed
  code: string;                   // Error code
  message: string;                // Human-readable message
  recoverable: boolean;           // Was this recovered from?
}
```

### 2.3 Internal Data Structures

```typescript
// Integration Proposal (from 00-common-schemas.md, extended)
interface IntegrationProposal {
  // === Identity ===
  proposal_id: string;
  episode_id: string;

  // === Decision ===
  // Actions align with 00-common-schemas.md Integration Decision Criteria
  // SUPERSEDE maps to 'update' with relationship_analysis.type = 'supersedes' + archive of existing
  // LINK maps to 'create' with related_entries populated
  action: 'create' | 'update' | 'merge' | 'supersede' | 'link' | 'skip';

  // === Targets ===
  target_entry_ids?: string[];    // For update/merge

  // === Content ===
  proposed_content?: string;      // New content (create/update)
  proposed_metadata?: ProposedMetadata;

  // === Relationship ===
  relationship_analysis?: RelationshipAnalysis;

  // === Rationale ===
  decision_rationale: string;

  // === Confidence ===
  episode_confidence: number;     // From extraction
  integration_confidence: number; // Integration agent's confidence
  combined_confidence: number;    // Propagated confidence
}

interface ProposedMetadata {
  title: string;
  category: string;
  confidence: number;
  salience: number;               // Initial salience
  source_type: SourceType;
  source_ref: string;             // Session ID
  related_entries?: string[];     // Links to related entries
  tags?: string[];
}

interface RelationshipAnalysis {
  type: 'supersedes' | 'extends' | 'related' | 'duplicate';
  matched_entry_id?: string;
  similarity_score?: number;
  confidence: number;
  rationale: string;
}

// Resolved Proposal (after conflict detection)
interface ResolvedProposal extends IntegrationProposal {
  conflict_detected: boolean;
  conflict_type?: ConflictType;
  resolution?: ConflictResolution;
  blocked: boolean;               // If true, don't execute
}

interface ConflictResolution {
  strategy: 'auto' | 'source_priority' | 'escalated' | 'skip';
  confidence_adjustment: number;  // Adjustment to combined_confidence
  rationale: string;
}

// Storage Operation
interface StorageOperation {
  operation_id: string;
  proposal_id: string;            // Source proposal

  // === Operation Type ===
  type: 'create' | 'update' | 'archive' | 'link' | 'update_metadata';

  // === Target ===
  entry_id?: string;              // For update/archive/link operations

  // === Payload ===
  payload: CreatePayload | UpdatePayload | ArchivePayload | LinkPayload | MetadataPayload;

  // === Ordering ===
  depends_on?: string[];          // Operation IDs that must complete first

  // === Result (after execution) ===
  executed?: boolean;
  success?: boolean;
  result_entry_id?: string;       // For create operations
  error?: string;
}

interface CreatePayload {
  content: string;
  metadata: ProposedMetadata;
}

interface UpdatePayload {
  updates: EntryUpdate[];
}

interface EntryUpdate {
  field: 'content' | 'title' | 'confidence' | 'tags' | 'related_entries';
  operation: 'set' | 'append' | 'merge';
  value: unknown;
}

interface ArchivePayload {
  reason: 'superseded' | 'merged' | 'outdated';
  superseded_by?: string;
}

interface LinkPayload {
  source_entry_id: string;
  target_entry_id: string;
  link_type: 'related' | 'supersedes' | 'extends';
}

interface MetadataPayload {
  updates: {
    salience?: number;
    confidence?: number;
    last_updated?: string;
    access_count_increment?: number;
  };
}

// Conflict Types - aligned with 03-error-handling.md ConflictType (P1.3)
// Maps to Error Handling subsystem terminology for consistent conflict classification
type ConflictType =
  | 'direct_contradiction'    // A says X, B says not-X (was: CONTRADICTION)
  | 'implicit_contradiction'  // A implies X, B implies not-X
  | 'supersession'            // Newer info should replace older (was: OUTDATED)
  | 'partial_overlap'         // Some claims conflict, others don't (was: PARTIAL_OVERLAP)
  | 'semantic_drift'          // Same topic, incompatible framing (was: SCOPE_AMBIGUITY)
  | 'version_conflict';       // Multiple updates to same entry

// Legacy type mapping (for backwards compatibility during migration)
const CONFLICT_TYPE_MAPPING = {
  'CONTRADICTION': 'direct_contradiction',
  'OUTDATED': 'supersession',
  'PARTIAL_OVERLAP': 'partial_overlap',
  'CONFIDENCE_MISMATCH': 'implicit_contradiction',  // Closest match
  'SOURCE_CONFLICT': 'direct_contradiction',        // Escalate as direct
  'SCOPE_AMBIGUITY': 'semantic_drift',
} as const;

type SourceType = 'user_explicit' | 'user_implicit' | 'inferred' | 'imported' | 'consolidated';
```

---

## Part 3: Agent Specifications

### 3.1 Extract Agent

**Goal:** Identify and extract discrete knowledge claims from a conversation log, producing structured episodes suitable for integration.

**Rules:**
- MUST extract only actionable knowledge (not transient task details)
- MUST classify each episode with exactly one type from: decision, error, pattern, preference, fact, correction
- MUST assign confidence between 0.0-1.0 following calibration guidelines
- MUST NOT extract information already present in KB without new information
- MUST include source attribution (turn range, timestamp, actor, explicit flag)
- MUST extract at least one episode if the conversation contains any learning moments

**Strategies:**
- PREFER explicit user statements over inferred patterns
- PREFER higher confidence for direct user corrections over passive acceptance
- PREFER extracting fewer high-quality episodes over many low-quality ones
- PREFER grouping related turns into single coherent episode over fragmenting
- When in doubt about episode type, PREFER fact over pattern

**Opening:**
```
You are the Extract Agent for Kahuna's consolidation system. Your task is to identify discrete knowledge claims from the conversation log and structure them as episodes.

## Context
You will receive a conversation log from a copilot session. Your job is to find moments where:
- Explicit decisions were made
- Errors were identified and corrected
- Patterns or conventions were established
- User preferences were expressed
- Facts about the project were discovered
- Existing knowledge was corrected

## Conversation Log
Session ID: {session_id}
Mode: {mode}
Project: {project}
Started: {started_at}
Ended: {ended_at}

### Turns
{formatted_turns}

### Files Touched
{files_touched}

## Instructions
1. Read through the conversation carefully
2. Identify each moment where knowledge was expressed or discovered
3. For each knowledge claim, create an episode with:
   - type: decision | error | pattern | preference | fact | correction
   - content: The knowledge claim in clear, standalone language
   - context: Surrounding context that explains the claim
   - source.turn_range: [start_turn, end_turn] indices
   - source.timestamp: ISO 8601 of when this was said
   - source.actor: 'user' or 'assistant'
   - source.explicit: true if directly stated, false if inferred
   - confidence: 0.0-1.0 based on calibration guidelines
   - confidence_rationale: Why you assigned this confidence
   - related_topics: Semantic tags for categorization

## Confidence Calibration
| Scenario | Range |
|----------|-------|
| User explicitly states knowledge | 0.85 - 1.0 |
| User confirms assistant suggestion | 0.75 - 0.90 |
| User accepts without explicit confirmation | 0.50 - 0.70 |
| Inferred from user behavior | 0.30 - 0.50 |
| Assistant-generated insight | 0.20 - 0.40 |

## Output Format
Return a JSON array of episodes. Each episode must conform to the Episode schema.

```json
{
  "episodes": [
    {
      "id": "ep-{uuid}",
      "session_id": "{session_id}",
      "type": "...",
      "content": "...",
      "context": "...",
      "source": { ... },
      "confidence": 0.XX,
      "confidence_rationale": "...",
      "related_topics": [...]
    }
  ],
  "extraction_notes": "Any observations about the conversation that didn't become episodes"
}
```
```

### 3.2 Integration Agent

**Goal:** Determine the optimal integration strategy for each episode by analyzing its relationship to existing KB entries.

**Rules:**
- MUST query KB for related entries before making decisions
- MUST classify relationship as exactly one of: supersedes, extends, related, duplicate
- MUST choose action from: create, update, merge, skip
- MUST NOT update entries when episode confidence is below existing entry confidence (unless user-explicit)
- MUST provide rationale for every decision
- MUST flag potential conflicts for Error Handling review

**Strategies:**
- PREFER update over create when episode extends existing knowledge
- PREFER create over merge when semantic distance is > 0.25
- PREFER skip for duplicates with no new information
- When confidence is close (within 0.15), PREFER the more recent source
- For corrections, PREFER supersede when episode.source.explicit is true

**Opening:**
```
You are the Integration Agent for Kahuna's consolidation system. Your task is to determine how each episode should integrate with the existing Knowledge Base.

## Context
You will receive:
1. An episode extracted from a conversation
2. A list of potentially related KB entries (from semantic search)

Your job is to decide:
- What is the relationship between this episode and existing entries?
- What action should be taken? (create, update, merge, skip)

## Episode to Integrate
```json
{episode_json}
```

## Related KB Entries
{kb_entries_with_similarity}

## Decision Algorithm

### Step 1: Assess Similarity
- If no matches above 0.75 similarity → likely CREATE
- If any match >= 0.95 similarity → check for DUPLICATE
- If matches in 0.75-0.95 range → analyze relationship

### Step 2: Classify Relationship
For matches in the related range:
- SUPERSEDES: Episode corrects or replaces existing entry
- EXTENDS: Episode adds information to existing entry
- RELATED: Different knowledge but topically connected
- DUPLICATE: Semantically equivalent, no new information

### Step 3: Decide Action
| Relationship | Similarity | Action |
|--------------|-----------|--------|
| No match | < 0.75 | CREATE |
| DUPLICATE | >= 0.95 | SKIP |
| SUPERSEDES | 0.75-0.95 | UPDATE (replace content) |
| EXTENDS | 0.75-0.95 | UPDATE (append/enrich) |
| RELATED | 0.75-0.95 | CREATE + LINK |
| Multiple equivalents | any | MERGE |

### Step 4: Check Confidence
- Episode can supersede existing if: episode.confidence > existing.confidence + 0.10
- OR if episode.source.explicit == true AND episode.confidence >= 0.60
- Otherwise, flag as CONFIDENCE_MISMATCH conflict

## Output Format
```json
{
  "proposal": {
    "proposal_id": "prop-{uuid}",
    "episode_id": "{episode_id}",
    "action": "create | update | merge | skip",
    "target_entry_ids": ["entry-xxx"],  // if update/merge
    "proposed_content": "...",           // if create/update
    "proposed_metadata": {
      "title": "...",
      "category": "...",
      "confidence": 0.XX,
      "salience": 0.XX,
      "source_type": "...",
      "source_ref": "{session_id}",
      "related_entries": ["entry-xxx"],
      "tags": [...]
    },
    "relationship_analysis": {
      "type": "supersedes | extends | related | duplicate",
      "matched_entry_id": "entry-xxx",
      "similarity_score": 0.XX,
      "confidence": 0.XX,
      "rationale": "..."
    },
    "decision_rationale": "...",
    "integration_confidence": 0.XX,
    "potential_conflicts": [
      {
        "type": "CONTRADICTION | OUTDATED | ...",
        "description": "...",
        "affected_entries": ["entry-xxx"]
      }
    ]
  }
}
```
```

---

## Part 4: Pipeline Flow

### 4.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        CONSOLIDATION PIPELINE FLOW                                       │
│                                                                                          │
│   ┌─────────────┐                                                                        │
│   │   INPUT     │  ConversationLog                                                       │
│   └──────┬──────┘                                                                        │
│          │                                                                               │
│          ▼                                                                               │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │  PHASE 1: EXTRACTION                                                             │   │
│   │                                                                                   │   │
│   │  1.1 Validate conversation log                                                    │   │
│   │  1.2 Invoke Extract Agent (LLM)                                                  │   │
│   │  1.3 Validate extracted episodes                                                  │   │
│   │  1.4 Filter by min_confidence threshold                                           │   │
│   │                                                                                   │   │
│   │  Output: Episode[]                                                                │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │  PHASE 2: INTEGRATION                                                            │   │
│   │                                                                                   │   │
│   │  For each episode:                                                                │   │
│   │    2.1 Query KB for related entries (semantic_search)                            │   │
│   │    2.2 Invoke Integration Agent (LLM)                                            │   │
│   │    2.3 Validate integration proposal                                              │   │
│   │    2.4 Compute combined confidence                                                │   │
│   │                                                                                   │   │
│   │  Output: IntegrationProposal[]                                                    │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │  PHASE 3: CONFLICT DETECTION                                                     │   │
│   │                                                                                   │   │
│   │  For each proposal with action != skip:                                          │   │
│   │    3.1 Check for conflicts with existing KB                                       │   │
│   │    3.2 Check for conflicts between proposals                                      │   │
│   │    3.3 Classify conflict types                                                    │   │
│   │    3.4 Route to Error Handling subsystem                                          │   │
│   │    3.5 Apply resolutions or block proposals                                       │   │
│   │                                                                                   │   │
│   │  Output: ResolvedProposal[]                                                       │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │  PHASE 4: OPERATION GENERATION                                                   │   │
│   │                                                                                   │   │
│   │  For each non-blocked proposal:                                                   │   │
│   │    4.1 Map action to storage operations                                           │   │
│   │    4.2 Compute initial salience (for creates)                                     │   │
│   │    4.3 Generate operation sequence with dependencies                              │   │
│   │                                                                                   │   │
│   │  Output: StorageOperation[]                                                       │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │  PHASE 5: EXECUTION                                                              │   │
│   │                                                                                   │   │
│   │  5.1 Sort operations by dependencies                                              │   │
│   │  5.2 Execute in order, respecting dependencies                                    │   │
│   │  5.3 Handle failures (retry or rollback)                                          │   │
│   │  5.4 Record results                                                               │   │
│   │                                                                                   │   │
│   │  Output: ExecutionResult[]                                                        │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │  PHASE 6: REPORTING                                                              │   │
│   │                                                                                   │   │
│   │  6.1 Aggregate outcomes per episode                                               │   │
│   │  6.2 Compute statistics                                                           │   │
│   │  6.3 Collect warnings and errors                                                  │   │
│   │  6.4 Generate ConsolidationResult                                                 │   │
│   │                                                                                   │   │
│   └──────────────────────────────────┬──────────────────────────────────────────────┘   │
│                                      │                                                    │
│                                      ▼                                                    │
│   ┌─────────────┐                                                                        │
│   │   OUTPUT    │  ConsolidationResult                                                   │
│   └─────────────┘                                                                        │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Phase Details

#### Phase 1: Extraction

```typescript
async function extractEpisodes(
  log: ConversationLog,
  options: ConsolidationOptions
): Promise<Episode[]> {
  // 1.1 Validate conversation log
  validateConversationLog(log);

  // 1.2 Format log for Extract Agent
  const formattedLog = formatLogForAgent(log);

  // 1.3 Invoke Extract Agent
  const extractResult = await invokeExtractAgent({
    session_id: log.session_id,
    mode: log.mode,
    project: log.project,
    started_at: log.started_at,
    ended_at: log.ended_at,
    formatted_turns: formattedLog.turns,
    files_touched: log.files_touched,
  });

  // 1.4 Validate and parse episodes
  const episodes = parseAndValidateEpisodes(extractResult);

  // 1.5 Filter by minimum confidence
  const minConfidence = options.min_confidence ?? 0.3;
  return episodes.filter(ep => ep.confidence >= minConfidence);
}

function formatLogForAgent(log: ConversationLog): FormattedLog {
  const turns = log.turns.map(turn => {
    let formatted = `[${turn.index}] ${turn.role.toUpperCase()} (${turn.timestamp}):\n${turn.content}`;

    if (turn.tool_calls?.length) {
      const toolSummary = turn.tool_calls
        .map(tc => `  - ${tc.tool}: ${tc.success ? '✓' : '✗'} ${tc.output_summary ?? ''}`)
        .join('\n');
      formatted += `\n\nTool calls:\n${toolSummary}`;
    }

    return formatted;
  }).join('\n\n---\n\n');

  return { turns };
}
```

#### Phase 2: Integration

```typescript
async function integrateEpisodes(
  episodes: Episode[],
  storage: Storage
): Promise<IntegrationProposal[]> {
  const proposals: IntegrationProposal[] = [];

  for (const episode of episodes) {
    // 2.1 Query KB for related entries
    const relatedEntries = await storage.search_semantic({
      query: episode.content,
      limit: 10,
      min_similarity: 0.5,  // Lower threshold to catch potential matches
    });

    // 2.2 Format entries for Integration Agent
    const formattedEntries = relatedEntries.map(entry => ({
      entry_id: entry.id,
      title: entry.title,
      content: entry.content,
      similarity: entry.similarity,
      confidence: entry.metadata.confidence,
      category: entry.metadata.category,
    }));

    // 2.3 Invoke Integration Agent
    const integrationResult = await invokeIntegrationAgent({
      episode_json: JSON.stringify(episode),
      kb_entries_with_similarity: formatKBEntries(formattedEntries),
    });

    // 2.4 Validate and parse proposal
    const proposal = parseAndValidateProposal(integrationResult);

    // 2.5 Compute combined confidence
    proposal.combined_confidence = propagateConfidence(
      proposal.episode_confidence,
      proposal.integration_confidence
    );

    proposals.push(proposal);
  }

  return proposals;
}

function propagateConfidence(
  episodeConfidence: number,
  integrationConfidence: number
): number {
  // Multiply confidences (both must be high for high combined)
  return Math.max(0.0, Math.min(1.0, episodeConfidence * integrationConfidence));
}
```

#### Phase 3: Conflict Detection

```typescript
async function detectAndResolveConflicts(
  proposals: IntegrationProposal[],
  storage: Storage,
  errorHandling: ErrorHandling,
  options: ConsolidationOptions
): Promise<ResolvedProposal[]> {
  const resolved: ResolvedProposal[] = [];

  for (const proposal of proposals) {
    if (proposal.action === 'skip') {
      resolved.push({ ...proposal, conflict_detected: false, blocked: false });
      continue;
    }

    // 3.1 Check for conflicts with existing KB
    const kbConflicts = await detectKBConflicts(proposal, storage);

    // 3.2 Check for conflicts with other proposals
    const proposalConflicts = detectProposalConflicts(proposal, proposals);

    const allConflicts = [...kbConflicts, ...proposalConflicts];

    if (allConflicts.length === 0) {
      resolved.push({ ...proposal, conflict_detected: false, blocked: false });
      continue;
    }

    // 3.3 Route to Error Handling
    const resolutions = await resolveConflicts(
      allConflicts,
      proposal,
      errorHandling,
      options.conflict_strategy ?? 'escalate'
    );

    // 3.4 Apply resolutions
    const resolvedProposal = applyResolutions(proposal, resolutions);
    resolved.push(resolvedProposal);
  }

  return resolved;
}

async function detectKBConflicts(
  proposal: IntegrationProposal,
  storage: Storage
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  if (!proposal.target_entry_ids?.length) return conflicts;

  for (const targetId of proposal.target_entry_ids) {
    const existing = await storage.read_entry({ entry_id: targetId });
    if (!existing) continue;

    // Check for contradiction
    if (proposal.relationship_analysis?.type === 'supersedes') {
      const confidenceDiff = proposal.combined_confidence - existing.metadata.confidence;

      if (confidenceDiff < 0.10 && !proposal.episode_source_explicit) {
        conflicts.push({
          type: 'CONFIDENCE_MISMATCH',
          affected_entries: [targetId],
          description: `New claim (${proposal.combined_confidence.toFixed(2)}) not significantly more confident than existing (${existing.metadata.confidence.toFixed(2)})`,
        });
      }
    }

    // Check for source conflict
    if (existing.metadata.source_type === 'user_explicit' &&
        proposal.proposed_metadata?.source_type === 'inferred') {
      conflicts.push({
        type: 'SOURCE_CONFLICT',
        affected_entries: [targetId],
        description: 'Inferred knowledge attempting to modify user-explicit knowledge',
      });
    }
  }

  return conflicts;
}

async function resolveConflicts(
  conflicts: Conflict[],
  proposal: IntegrationProposal,
  errorHandling: ErrorHandling,
  strategy: 'escalate' | 'auto_resolve' | 'skip'
): Promise<ConflictResolution[]> {
  const resolutions: ConflictResolution[] = [];

  for (const conflict of conflicts) {
    switch (strategy) {
      case 'auto_resolve':
        const autoResolution = await errorHandling.autoResolve(conflict, proposal);
        resolutions.push(autoResolution);
        break;

      case 'skip':
        resolutions.push({
          strategy: 'skip',
          confidence_adjustment: 0,
          rationale: 'Conflict skipped per configuration',
        });
        break;

      case 'escalate':
      default:
        resolutions.push({
          strategy: 'escalated',
          confidence_adjustment: -0.1,  // Reduce confidence for escalated items
          rationale: `Conflict escalated: ${conflict.description}`,
        });
        break;
    }
  }

  return resolutions;
}
```

#### Phase 4: Operation Generation

```typescript
function generateOperations(
  proposals: ResolvedProposal[]
): StorageOperation[] {
  const operations: StorageOperation[] = [];

  for (const proposal of proposals) {
    if (proposal.blocked) continue;

    switch (proposal.action) {
      case 'create':
        operations.push(...generateCreateOperations(proposal));
        break;

      case 'update':
        operations.push(...generateUpdateOperations(proposal));
        break;

      case 'merge':
        operations.push(...generateMergeOperations(proposal));
        break;

      case 'skip':
        // No operations
        break;
    }
  }

  return operations;
}

function generateCreateOperations(proposal: ResolvedProposal): StorageOperation[] {
  const createOp: StorageOperation = {
    operation_id: generateId('op'),
    proposal_id: proposal.proposal_id,
    type: 'create',
    payload: {
      content: proposal.proposed_content!,
      metadata: {
        ...proposal.proposed_metadata!,
        salience: computeInitialSalience(proposal),
      },
    },
  };

  const operations: StorageOperation[] = [createOp];

  // If related entries, create links
  if (proposal.proposed_metadata?.related_entries?.length) {
    for (const relatedId of proposal.proposed_metadata.related_entries) {
      operations.push({
        operation_id: generateId('op'),
        proposal_id: proposal.proposal_id,
        type: 'link',
        depends_on: [createOp.operation_id],  // Must wait for create
        payload: {
          source_entry_id: '__NEW__',  // Will be replaced with created ID
          target_entry_id: relatedId,
          link_type: 'related',
        },
      });
    }
  }

  return operations;
}

function generateUpdateOperations(proposal: ResolvedProposal): StorageOperation[] {
  const operations: StorageOperation[] = [];
  const targetId = proposal.target_entry_ids![0];

  const updates: EntryUpdate[] = [];

  // Content update
  if (proposal.proposed_content) {
    const updateType = proposal.relationship_analysis?.type === 'extends' ? 'append' : 'set';
    updates.push({
      field: 'content',
      operation: updateType,
      value: proposal.proposed_content,
    });
  }

  // Confidence update (take higher)
  if (proposal.combined_confidence) {
    updates.push({
      field: 'confidence',
      operation: 'set',
      value: proposal.combined_confidence,
    });
  }

  // Tags merge
  if (proposal.proposed_metadata?.tags?.length) {
    updates.push({
      field: 'tags',
      operation: 'merge',
      value: proposal.proposed_metadata.tags,
    });
  }

  operations.push({
    operation_id: generateId('op'),
    proposal_id: proposal.proposal_id,
    type: 'update',
    entry_id: targetId,
    payload: { updates },
  });

  return operations;
}

function generateMergeOperations(proposal: ResolvedProposal): StorageOperation[] {
  const operations: StorageOperation[] = [];
  const [primaryId, ...secondaryIds] = proposal.target_entry_ids!;

  // 1. Update primary with merged content
  operations.push({
    operation_id: generateId('op'),
    proposal_id: proposal.proposal_id,
    type: 'update',
    entry_id: primaryId,
    payload: {
      updates: [{
        field: 'content',
        operation: 'set',
        value: proposal.proposed_content!,
      }],
    },
  });

  // 2. Archive secondary entries
  for (const secondaryId of secondaryIds) {
    operations.push({
      operation_id: generateId('op'),
      proposal_id: proposal.proposal_id,
      type: 'archive',
      entry_id: secondaryId,
      payload: {
        reason: 'merged',
        superseded_by: primaryId,
      },
    });
  }

  // 3. Update references (entries that linked to secondary now link to primary)
  // This is handled by Storage subsystem as part of archive operation

  return operations;
}

/**
 * Compute initial salience for a new entry.
 *
 * IMPORTANT (P2.3): This uses the canonical formula from 00-common-schemas.md Part 3.4.
 * The weights are imported from the Salience Rules module to ensure consistency
 * across all subsystems.
 *
 * @see 00-common-schemas.md Part 3.3-3.4 for authoritative formula
 */
function computeInitialSalience(proposal: ResolvedProposal): number {
  // Import weights from common-schemas Salience Architecture (Part 3.3)
  const SALIENCE_WEIGHTS = {
    source_type: 0.25,
    recency: 0.20,
    access_frequency: 0.20,
    explicit_signal: 0.20,
    confidence: 0.15,
  };

  // Source type factors from 00-common-schemas.md Part 3.4 sourceTypeFactor()
  const sourceWeights: Record<SourceType, number> = {
    'user_explicit': 1.0,
    'user_implicit': 0.8,
    'consolidated': 0.7,  // Storage-specific addition
    'inferred': 0.5,
    'imported': 0.6,
  };

  const sourceType = proposal.proposed_metadata?.source_type ?? 'consolidated';
  const sourceTypeFactor = sourceWeights[sourceType] ?? 0.5;
  const confidenceFactor = proposal.combined_confidence;

  // For new entries:
  // - recency = 1.0 (just created)
  // - access_frequency = 0 (never accessed)
  // - explicit_signal = 0 (not pinned)
  const factors = {
    source_type: sourceTypeFactor,
    recency: 1.0,
    access_frequency: 0.0,
    explicit_signal: 0.0,
    confidence: confidenceFactor,
  };

  // Canonical formula from 00-common-schemas.md computeSalience()
  const initialSalience =
    factors.source_type * SALIENCE_WEIGHTS.source_type +
    factors.recency * SALIENCE_WEIGHTS.recency +
    factors.access_frequency * SALIENCE_WEIGHTS.access_frequency +
    factors.explicit_signal * SALIENCE_WEIGHTS.explicit_signal +
    factors.confidence * SALIENCE_WEIGHTS.confidence;

  // Ensure result is in [0.0, 1.0] per common-schemas
  return Math.max(0.0, Math.min(1.0, initialSalience));
}
```

#### Phase 5: Execution

##### 5.1 Transactional Semantics (P2.1)

Consolidation uses **per-proposal atomicity** for storage operations:

| Scope | Atomicity | Rollback Behavior |
|-------|-----------|-------------------|
| **Single operation** | Atomic | Storage handles individual operation atomically |
| **Per-proposal** | Best-effort atomic | If any operation fails, attempt to reverse completed operations |
| **Per-session** | Non-atomic | Proposals are independent; one failure doesn't affect others |

**Design Decision:** Per-proposal atomicity balances consistency with resilience. A failed proposal doesn't corrupt the KB (single-entry changes are atomic), and doesn't block other proposals.

**Partial Failure Handling:**
1. Operations within a proposal execute in dependency order
2. If operation N fails, operations N+1... are skipped
3. Completed operations (1..N-1) are logged for potential manual review
4. The proposal is marked as `partially_failed` with details

##### 5.2 Dry Run Mode (P2.4)

When `options.dry_run = true`, the execution phase simulates operations without modifying storage:

```typescript
async function executeOperations(
  operations: StorageOperation[],
  storage: Storage,
  options: ConsolidationOptions = {}
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];
  const completed: Map<string, StorageOperation> = new Map();

  // Dry run mode: simulate without executing (P2.4)
  if (options.dry_run) {
    return operations.map((op, index) => ({
      operation_id: op.operation_id,
      success: true,
      simulated: true,
      entry_id: op.type === 'create' ? `dry-run-entry-${index}` : op.entry_id,
      would_execute: describeOperation(op),
    }));
  }

  // Sort by dependencies (topological sort)
  const sorted = topologicalSort(operations);

  for (const op of sorted) {
    // Check dependencies completed
    if (op.depends_on?.length) {
      const allDepsCompleted = op.depends_on.every(depId => {
        const dep = completed.get(depId);
        return dep?.success === true;
      });

      if (!allDepsCompleted) {
        results.push({
          operation_id: op.operation_id,
          success: false,
          error: 'Dependency failed',
        });
        continue;
      }
    }

    // Execute operation
    try {
      const result = await executeOperation(op, storage, completed);
      results.push(result);

      op.executed = true;
      op.success = result.success;
      op.result_entry_id = result.entry_id;
      completed.set(op.operation_id, op);
    } catch (error) {
      results.push({
        operation_id: op.operation_id,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Execute a single storage operation.
 *
 * IMPORTANT (P1.1): Uses Storage's batch API (apply_updates) which accepts
 * UpdateOperation[] per 01-storage.md Part 3.5. Operations are batched
 * by entry_id for efficiency.
 *
 * @see 01-storage.md apply_updates for API signature
 */
async function executeOperation(
  op: StorageOperation,
  storage: Storage,
  completed: Map<string, StorageOperation>
): Promise<ExecutionResult> {
  switch (op.type) {
    case 'create': {
      const payload = op.payload as CreatePayload;
      // Uses store_entry from 01-storage.md Part 3.1
      const result = await storage.store_entry({
        title: payload.metadata.title,
        content: payload.content,
        category: payload.metadata.category,
        tags: payload.metadata.tags,
        source_type: payload.metadata.source_type,
        source_ref: payload.metadata.source_ref,
        confidence: payload.metadata.confidence,
        salience: payload.metadata.salience,
        related_entries: payload.metadata.related_entries,
      });
      return { operation_id: op.operation_id, success: true, entry_id: result.entry_id };
    }

    case 'update': {
      const payload = op.payload as UpdatePayload;
      // P1.1 FIX: Use batch API signature from 01-storage.md Part 3.5
      await storage.apply_updates({
        updates: [{
          type: 'update',
          entry_id: op.entry_id,
          content: payload.updates.find(u => u.field === 'content')?.value as string,
          metadata_updates: {
            confidence: payload.updates.find(u => u.field === 'confidence')?.value as number,
          },
        }],
      });
      return { operation_id: op.operation_id, success: true, entry_id: op.entry_id };
    }

    case 'archive': {
      const payload = op.payload as ArchivePayload;
      // P1.1 FIX: Use batch API for archive operation
      await storage.apply_updates({
        updates: [{
          type: 'archive',
          entry_id: op.entry_id,
          metadata_updates: {
            status: 'archived',
            archive_reason: payload.reason,
            superseded_by: payload.superseded_by,
          },
        }],
      });
      return { operation_id: op.operation_id, success: true, entry_id: op.entry_id };
    }

    case 'link': {
      const payload = op.payload as LinkPayload;
      let sourceId = payload.source_entry_id;

      // Replace __NEW__ with actual created ID
      if (sourceId === '__NEW__') {
        const createOp = [...completed.values()].find(
          c => c.proposal_id === op.proposal_id && c.type === 'create'
        );
        sourceId = createOp!.result_entry_id!;
      }

      // P1.1 FIX: Use batch API for link operation
      await storage.apply_updates({
        updates: [{
          type: 'update',
          entry_id: sourceId,
          metadata_updates: {
            related_entries: [payload.target_entry_id],  // Merged by Storage
          },
        }],
      });
      return { operation_id: op.operation_id, success: true };
    }

    case 'update_metadata': {
      const payload = op.payload as MetadataPayload;
      // Uses update_metadata_batch from 01-storage.md Part 3.2
      await storage.update_metadata_batch({
        updates: [{
          entry_id: op.entry_id!,
          ...payload.updates,
        }],
      });
      return { operation_id: op.operation_id, success: true, entry_id: op.entry_id };
    }

    default:
      throw new Error(`Unknown operation type: ${op.type}`);
  }
}

/**
 * Helper for dry run mode - describes what operation would do.
 */
function describeOperation(op: StorageOperation): string {
  switch (op.type) {
    case 'create':
      return `Create new entry with title: ${(op.payload as CreatePayload).metadata.title}`;
    case 'update':
      return `Update entry ${op.entry_id}`;
    case 'archive':
      return `Archive entry ${op.entry_id} (reason: ${(op.payload as ArchivePayload).reason})`;
    case 'link':
      const linkPayload = op.payload as LinkPayload;
      return `Link ${linkPayload.source_entry_id} → ${linkPayload.target_entry_id}`;
    case 'update_metadata':
      return `Update metadata for entry ${op.entry_id}`;
    default:
      return `Unknown operation: ${op.type}`;
  }
}
```

---

## Part 5: Storage Contract

### 5.1 Required Storage Operations

The Consolidation subsystem requires the following Storage operations:

| Operation | Purpose | Consolidation Usage |
|-----------|---------|---------------------|
| `search_semantic` | Find related entries | Integration phase - KB querying |
| `get_entry` | Retrieve single entry | Conflict detection - fetch existing |
| `create_entry` | Create new entry | Execution - CREATE action |
| `apply_updates` | Update existing entry | Execution - UPDATE/ARCHIVE actions |
| `update_metadata_batch` | Batch metadata updates | Execution - salience updates |
| `list_entries` | Query by criteria | Merge detection - find duplicates |

### 5.2 Operation Mappings (P1.1 Fix)

**IMPORTANT:** Storage uses batch APIs per [`01-storage.md`](01-storage.md) Part 3.5.
All `apply_updates` calls use `ApplyUpdatesInput` with `updates: UpdateOperation[]`.

```typescript
// CREATE action → store_entry (01-storage.md Part 3.1)
const createResult = await storage.store_entry({
  title: proposal.proposed_metadata.title,
  content: proposal.proposed_content,
  category: proposal.proposed_metadata.category,
  tags: proposal.proposed_metadata.tags,
  source_type: proposal.proposed_metadata.source_type,
  source_ref: proposal.proposed_metadata.source_ref,
  confidence: proposal.combined_confidence,
  salience: computeInitialSalience(proposal),
  related_entries: proposal.proposed_metadata.related_entries,
});
// Returns: { entry_id: string, file_path: string, indexed: boolean }

// UPDATE action → apply_updates (01-storage.md Part 3.5)
// P1.1 FIX: Uses batch API signature
await storage.apply_updates({
  updates: [{
    type: 'update',
    entry_id: targetEntryId,
    content: proposal.proposed_content,
    metadata_updates: {
      confidence: Math.max(existingConfidence, proposal.combined_confidence),
    },
  }],
  atomic: false,  // Single operation, atomicity optional
});

// SUPERSEDE action → apply_updates for update + archive (P1.2)
// SUPERSEDE is handled as UPDATE to the target plus ARCHIVE of old entry
await storage.apply_updates({
  updates: [
    {
      type: 'update',
      entry_id: targetEntryId,
      content: proposal.proposed_content,
      metadata_updates: {
        confidence: proposal.combined_confidence,
        supersedes: oldEntryId,
      },
    },
    {
      type: 'archive',
      entry_id: oldEntryId,
      metadata_updates: {
        archive_reason: 'superseded',
        superseded_by: targetEntryId,
      },
    },
  ],
  atomic: true,  // Both must succeed or neither
});

// LINK action → create + update related_entries (P1.2)
// LINK creates new entry and establishes relationship
const newEntry = await storage.store_entry({
  title: proposal.proposed_metadata.title,
  content: proposal.proposed_content,
  category: proposal.proposed_metadata.category,
  source_type: proposal.proposed_metadata.source_type,
  source_ref: proposal.proposed_metadata.source_ref,
  confidence: proposal.combined_confidence,
  salience: computeInitialSalience(proposal),
  related_entries: [relatedEntryId],  // Link established at creation
});

// MERGE action → apply_updates batch with atomic=true
await storage.apply_updates({
  updates: [
    // Update primary with merged content
    {
      type: 'merge',
      entry_id: primaryEntryId,
      merge_target_ids: secondaryEntryIds,
      merge_primary_id: primaryEntryId,
      content: mergedContent,
      metadata_updates: {
        confidence: highestConfidence,
        salience: highestSalience,
      },
    },
  ],
  atomic: true,  // All merge operations must succeed together
});
// Storage handles archiving secondaries as part of merge operation

// SKIP action → no storage operations

// KB querying for integration
const relatedEntries = await storage.semantic_search({
  query: episode.content,
  filters: {
    categories: [proposal.proposed_metadata?.category],
  },
  limit: 10,
});
```

### 5.3 Action Type Mapping (P1.2)

The following table maps Integration Decision Criteria actions (from [`00-common-schemas.md`](00-common-schemas.md) Part 4) to Storage operations:

| Integration Action | Storage Operation(s) | Description |
|-------------------|---------------------|-------------|
| `create` | `store_entry` | New KB entry |
| `update` | `apply_updates` (type='update') | Modify existing entry content/metadata |
| `supersede` | `apply_updates` (update + archive, atomic) | Replace old entry with new, archive old |
| `link` | `store_entry` with `related_entries` | Create new entry linked to existing |
| `merge` | `apply_updates` (type='merge') | Combine multiple entries into one |
| `skip` | (none) | No storage operation |

**Note:** The `supersede` and `link` actions from common-schemas map to compound operations. They are tracked as distinct actions in proposals but execute as multiple storage operations.

### 5.3 Contract Obligations

**Consolidation → Storage:**
- Consolidation provides valid entry data conforming to KBEntry schema
- Consolidation handles Storage errors gracefully with rollback where needed
- Consolidation respects Storage's semantic search result format
- Consolidation does not assume operation ordering without explicit dependencies

**Storage → Consolidation:**
- Storage returns created entry IDs for reference
- Storage applies updates atomically per entry
- Storage provides consistent similarity scores for ranking
- Storage preserves archived entries (soft delete)

---

## Part 6: Error Handling

### 6.1 Error Types

```typescript
type ConsolidationErrorCode =
  // Extraction errors
  | 'EXTRACTION_FAILED'       // Extract Agent failed
  | 'EXTRACTION_TIMEOUT'      // Extract Agent timed out
  | 'INVALID_EPISODES'        // Episodes don't conform to schema
  | 'NO_EPISODES_FOUND'       // No knowledge worth extracting

  // Integration errors
  | 'INTEGRATION_FAILED'      // Integration Agent failed
  | 'INTEGRATION_TIMEOUT'     // Integration Agent timed out
  | 'INVALID_PROPOSAL'        // Proposal doesn't conform to schema
  | 'KB_QUERY_FAILED'         // Semantic search failed

  // Conflict errors
  | 'CONFLICT_UNRESOLVABLE'   // Conflict couldn't be resolved
  | 'CONFLICT_ESCALATED'      // Conflict requires human review

  // Execution errors
  | 'STORAGE_UNAVAILABLE'     // Storage subsystem not accessible
  | 'CREATE_FAILED'           // Entry creation failed
  | 'UPDATE_FAILED'           // Entry update failed
  | 'DEPENDENCY_FAILED'       // Operation dependency not satisfied
  | 'ROLLBACK_REQUIRED'       // Critical failure requiring rollback

  // General errors
  | 'INVALID_INPUT'           // ConversationLog doesn't conform
  | 'TIMEOUT'                 // Overall consolidation timeout
  | 'UNKNOWN';                // Unexpected error
```

### 6.2 Error Recovery Strategies

```typescript
async function handleConsolidationError(
  error: ConsolidationError,
  context: ErrorContext
): Promise<ErrorRecovery> {
  switch (error.code) {
    // === Extraction Errors ===
    case 'EXTRACTION_FAILED':
    case 'EXTRACTION_TIMEOUT':
      // Retry with simpler prompt or smaller log chunk
      if (context.retryCount < 2) {
        return {
          action: 'retry',
          modification: 'simplify_extraction',
          delay_ms: 1000 * context.retryCount,
        };
      }
      return { action: 'abort', reason: 'Extraction failed after retries' };

    case 'NO_EPISODES_FOUND':
      // Not an error - conversation had no learnable content
      return {
        action: 'complete',
        result: {
          episodes_extracted: 0,
          episodes_processed: 0,
          warning: 'No extractable knowledge found in conversation',
        },
      };

    // === Integration Errors ===
    case 'INTEGRATION_FAILED':
    case 'INTEGRATION_TIMEOUT':
      // Skip the problematic episode and continue
      return {
        action: 'skip_episode',
        episode_id: context.current_episode_id,
        warning: `Skipped episode due to integration failure: ${error.message}`,
      };

    case 'KB_QUERY_FAILED':
      // Fall back to create (can't check for duplicates)
      return {
        action: 'fallback',
        strategy: 'assume_create',
        warning: 'KB query failed; treating episode as new knowledge',
      };

    // === Conflict Errors ===
    case 'CONFLICT_UNRESOLVABLE':
      // Block the proposal but continue with others
      return {
        action: 'block_proposal',
        proposal_id: context.current_proposal_id,
        warning: `Proposal blocked due to unresolvable conflict`,
      };

    case 'CONFLICT_ESCALATED':
      // Mark for review but don't block
      return {
        action: 'mark_for_review',
        proposal_id: context.current_proposal_id,
        reduce_confidence: 0.1,
      };

    // === Execution Errors ===
    case 'CREATE_FAILED':
    case 'UPDATE_FAILED':
      // Retry once, then skip
      if (context.retryCount < 1) {
        return { action: 'retry', delay_ms: 500 };
      }
      return {
        action: 'skip_operation',
        operation_id: context.current_operation_id,
        error: error.message,
      };

    case 'DEPENDENCY_FAILED':
      // Skip this operation (dependency already failed)
      return {
        action: 'skip_operation',
        operation_id: context.current_operation_id,
        error: 'Dependency operation failed',
      };

    case 'ROLLBACK_REQUIRED':
      // Critical failure - rollback all operations in this consolidation
      return {
        action: 'rollback',
        operations_to_rollback: context.completed_operations,
        error: error.message,
      };

    case 'STORAGE_UNAVAILABLE':
      // Cannot continue - abort consolidation
      return {
        action: 'abort',
        reason: 'Storage subsystem unavailable',
        save_state: true,  // Save progress for retry
      };

    // === General Errors ===
    case 'TIMEOUT':
      // Save progress and report partial results
      return {
        action: 'partial_complete',
        completed_episodes: context.completed_episode_ids,
        remaining_episodes: context.remaining_episode_ids,
        warning: 'Consolidation timed out; partial results saved',
      };

    default:
      return {
        action: 'abort',
        reason: `Unknown error: ${error.message}`,
      };
  }
}
```

### 6.3 Conflict Resolution with Error Handling Subsystem (P2.2)

Consolidation's Conflict Detector routes conflicts to Error Handling's `resolve_conflicts` API.
See [`03-error-handling.md`](03-error-handling.md) Part 7.1 for the full API specification.

**Integration Interface:**

```typescript
/**
 * Interface between Consolidation's Conflict Detector and Error Handling subsystem.
 *
 * IMPORTANT (P2.2): This uses Error Handling's resolve_conflicts API from
 * 03-error-handling.md Part 7.1. The input must be transformed to match
 * Error Handling's ResolveConflictsInput schema.
 */

// Consolidation's internal conflict representation
interface ConsolidationConflict {
  conflict_id: string;
  type: ConflictType;               // Uses Error Handling terminology (P1.3)
  proposal: IntegrationProposal;
  conflicting_entry: KBEntry;
  detection_confidence: number;
}

// Transform to Error Handling's expected format
function transformToErrorHandlingInput(
  conflicts: ConsolidationConflict[],
  proposals: IntegrationProposal[]
): ResolveConflictsInput {
  // Build ConflictReport per 03-error-handling.md Part 2.2
  const conflictReport: ConflictReport = {
    report_id: generateId('report'),
    generated_at: new Date().toISOString(),
    proposals_checked: proposals.length,
    conflicts: conflicts.map(c => ({
      conflict_id: c.conflict_id,
      detected_at: new Date().toISOString(),
      proposal_id: c.proposal.proposal_id,
      conflicting_entry_id: c.conflicting_entry.id,
      type: c.type,                 // Already using Error Handling types (P1.3)
      severity: classifySeverity(c),
      proposal_claim: c.proposal.proposed_content ?? '',
      existing_claim: c.conflicting_entry.content,
      description: generateConflictDescription(c),
      confidence: c.detection_confidence,
      semantic_similarity: c.proposal.relationship_analysis?.similarity_score ?? 0,
      common_topics: c.proposal.proposed_metadata?.tags ?? [],
    })),
    summary: {
      total_conflicts: conflicts.length,
      by_type: countByType(conflicts),
      by_severity: countBySeverity(conflicts),
      proposals_with_conflicts: [...new Set(conflicts.map(c => c.proposal.proposal_id))],
      clean_proposals: proposals
        .filter(p => !conflicts.some(c => c.proposal.proposal_id === p.proposal_id))
        .map(p => p.proposal_id),
    },
  };

  return {
    conflict_report: conflictReport,
    proposals: proposals,
    options: {
      // Use default escalation criteria from Error Handling
    },
  };
}

// Call Error Handling's resolve_conflicts API
async function routeToErrorHandling(
  conflicts: ConsolidationConflict[],
  proposals: IntegrationProposal[],
  errorHandling: ErrorHandling
): Promise<ResolveConflictsOutput> {
  const input = transformToErrorHandlingInput(conflicts, proposals);

  // Error Handling's resolve_conflicts from 03-error-handling.md Part 7.1
  const result = await errorHandling.resolve_conflicts(input);

  return result;
}

// Apply Error Handling's resolutions back to proposals
function applyResolutions(
  proposals: IntegrationProposal[],
  resolutionResult: ResolveConflictsOutput
): ResolvedProposal[] {
  return proposals.map(proposal => {
    const decision = resolutionResult.result.decisions.find(
      d => d.conflict_id &&
           resolutionResult.conflict_report?.conflicts.some(
             c => c.conflict_id === d.conflict_id &&
                  c.proposal_id === proposal.proposal_id
           )
    );

    if (!decision) {
      // No conflict for this proposal
      return {
        ...proposal,
        conflict_detected: false,
        blocked: false,
      };
    }

    return {
      ...proposal,
      conflict_detected: true,
      conflict_type: getConflictType(decision.conflict_id, resolutionResult),
      resolution: {
        strategy: mapStrategyToConsolidation(decision.strategy_used),
        confidence_adjustment: computeConfidenceAdjustment(decision),
        rationale: decision.rationale,
      },
      blocked: decision.winner === 'existing' || decision.winner === 'escalated',
    };
  });
}
```

### 6.4 Conflict Type Handling (P1.3 Aligned)

Conflict types now use Error Handling terminology from [`03-error-handling.md`](03-error-handling.md) Part 2.1:

| Conflict Type (Error Handling) | Auto-Resolution Strategy | Escalation Trigger |
|-------------------------------|-------------------------|-------------------|
| `direct_contradiction` | Prefer higher confidence | Both > 0.7 confidence |
| `implicit_contradiction` | Prefer source_priority | Uncertain implication |
| `supersession` | Prefer newer source | Existing pinned |
| `partial_overlap` | Merge non-conflicting parts | Overlapping parts disagree |
| `semantic_drift` | Create separate entries | Cannot determine scope |
| `version_conflict` | Prefer most recent | Concurrent user_explicit |

---

## Part 7: Testing Strategy

### 7.1 Unit Tests

| Component | Test Focus |
|-----------|------------|
| **Extract Agent** | Episode extraction accuracy, confidence calibration, type classification |
| **Integration Agent** | Relationship classification, action decision, proposal generation |
| **Conflict Detector** | Conflict identification, type classification, resolution routing |
| **Update Generator** | Operation generation, salience computation, dependency ordering |
| **Pipeline** | Phase sequencing, error handling, result aggregation |

### 7.2 Integration Tests

| Scenario | Verification |
|----------|--------------|
| End-to-end consolidation | Log → Episodes → Proposals → Operations → KB updates |
| Conflict resolution flow | Conflict detected → Error Handling → Resolution applied |
| Merge execution | Multiple entries → Single merged entry + archives |
| Rollback on failure | Critical error → All operations rolled back |
| Dry run mode | Proposals generated, no KB modifications |

### 7.3 Agent Quality Tests

```typescript
// Test Extract Agent produces valid episodes
test('Extract Agent: produces valid episodes from conversation', async () => {
  const log = createTestConversationLog({
    turns: [
      { role: 'user', content: 'We should use PostgreSQL for the database' },
      { role: 'assistant', content: 'Got it, I will use PostgreSQL...' },
    ],
  });

  const episodes = await extractAgent.extract(log);

  expect(episodes.length).toBeGreaterThanOrEqual(1);
  expect(episodes[0].type).toBe('decision');
  expect(episodes[0].confidence).toBeGreaterThanOrEqual(0.75);
  expect(episodes[0].content).toContain('PostgreSQL');
});

// Test Integration Agent classifies relationships correctly
test('Integration Agent: identifies supersession', async () => {
  const episode = createTestEpisode({
    type: 'correction',
    content: 'Use gRPC not REST for the API',
    confidence: 0.9,
  });

  const existingEntry = createTestKBEntry({
    content: 'The API uses REST for communication',
    confidence: 0.7,
  });

  const proposal = await integrationAgent.integrate(episode, [existingEntry]);

  expect(proposal.action).toBe('update');
  expect(proposal.relationship_analysis.type).toBe('supersedes');
  expect(proposal.target_entry_ids).toContain(existingEntry.id);
});
```

---

## Part 8: Implementation Considerations

### 8.1 Component Dependencies

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSOLIDATION DEPENDENCY GRAPH                        │
│                                                                          │
│   ┌─────────────────┐     ┌─────────────────┐                           │
│   │ EXTRACT AGENT   │────▶│ LLM SERVICE     │                           │
│   │                 │     │ (Agent Runner)  │                           │
│   └────────┬────────┘     └─────────────────┘                           │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐     ┌─────────────────┐                           │
│   │ INTEGRATION     │────▶│ STORAGE         │ (semantic_search)         │
│   │ AGENT           │     │ SUBSYSTEM       │                           │
│   │                 │────▶│                 │                           │
│   │                 │     │ LLM SERVICE     │                           │
│   └────────┬────────┘     └─────────────────┘                           │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐     ┌─────────────────┐                           │
│   │ CONFLICT        │────▶│ ERROR HANDLING  │                           │
│   │ DETECTOR        │     │ SUBSYSTEM       │                           │
│   └────────┬────────┘     └─────────────────┘                           │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐                                                    │
│   │ UPDATE          │                                                    │
│   │ GENERATOR       │ (no external dependencies)                        │
│   └────────┬────────┘                                                    │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐     ┌─────────────────┐                           │
│   │ CONSOLIDATION   │────▶│ STORAGE         │                           │
│   │ PIPELINE        │     │ SUBSYSTEM       │                           │
│   └─────────────────┘     └─────────────────┘                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Performance Targets

| Operation | Target | Strategy |
|-----------|--------|----------|
| Episode extraction | < 5s | Single LLM call |
| Per-episode integration | < 2s | Cached KB queries + LLM call |
| Conflict detection | < 100ms | Rule-based, no LLM |
| Operation generation | < 50ms | In-memory computation |
| Per-operation execution | < 200ms | Async storage calls |
| **Total (5 episodes)** | **< 20s** | Pipeline parallelization |

### 8.3 Async Processing

Consolidation runs asynchronously after session end:

```typescript
// Session end triggers consolidation
async function onSessionEnd(sessionId: string): Promise<void> {
  const log = await retrieveSessionLog(sessionId);

  // Queue consolidation job
  await consolidationQueue.enqueue({
    session_id: sessionId,
    log: log,
    priority: 'normal',
    retry_policy: {
      max_retries: 3,
      backoff_ms: [1000, 5000, 30000],
    },
  });
}

// Worker processes queue
consolidationQueue.process(async (job) => {
  const result = await consolidationPipeline.consolidate_session({
    log: job.log,
    options: { conflict_strategy: 'escalate' },
  });

  // Store result for debugging/audit
  await storeConsolidationResult(job.session_id, result);

  return result;
});
```

### 8.4 Initialization Sequence

```typescript
async function initializeConsolidation(
  storage: Storage,
  errorHandling: ErrorHandling,
  agentRunner: AgentRunner
): Promise<ConsolidationSubsystem> {
  // 1. Initialize agents
  const extractAgent = new ExtractAgent(agentRunner, EXTRACT_AGENT_CONFIG);
  const integrationAgent = new IntegrationAgent(agentRunner, storage, INTEGRATION_AGENT_CONFIG);

  // 2. Initialize conflict detector
  const conflictDetector = new ConflictDetector(storage, errorHandling);

  // 3. Initialize update generator
  const updateGenerator = new UpdateGenerator();

  // 4. Initialize pipeline
  const pipeline = new ConsolidationPipeline({
    extractAgent,
    integrationAgent,
    conflictDetector,
    updateGenerator,
    storage,
  });

  return new ConsolidationSubsystem(pipeline);
}
```

---

## Summary

### What This Document Establishes

1. **Component architecture** — Five components (Extract Agent, Integration Agent, Conflict Detector, Update Generator, Pipeline) with clear responsibilities
2. **Data structures** — TypeScript interfaces for proposals, operations, and results
3. **Agent specifications** — GRSO format for Extract and Integration agents
4. **Pipeline flow** — Six-phase algorithm from log to KB updates
5. **Storage contract** — Mapping to Storage operations
6. **Error handling** — Comprehensive error types and recovery strategies

### Bayesian Role Reminder

Consolidation performs P(H|E) = Bayesian Update:
- **Episodes** = Evidence (E) from conversation
- **KB Entries** = Hypotheses (H) about project knowledge
- **Integration** = Update mechanism that modifies belief distribution
- **Confidence propagation** = Proper handling of uncertainty

### Dependencies

| Depends On | For |
|------------|-----|
| Storage | `store_entry`, `apply_updates`, `semantic_search`, `update_metadata_batch` |
| Error Handling | `resolve_conflicts` for conflict resolution |
| LLM Service | Agent execution (via AgentRunner) |

| Depended On By | For |
|----------------|-----|
| Session Manager | Triggers consolidation on session end |
| Audit System | Consumes consolidation results |

---

## Changelog

- v1.2 (2026-03-08): Integration alignment fixes
  - Fixed naming: `storage.get_entry()` → `storage.read_entry()` to align with Storage API (Part 4.2)
- v1.1 (2026-03-08): Address gaps from consolidation-subsystem-review.md
  - **P1.1**: Fixed Storage API signatures to use batch `apply_updates` API per 01-storage.md Part 3.5
  - **P1.2**: Added SUPERSEDE and LINK actions; documented mapping to Storage operations in Part 5.3
  - **P1.3**: Aligned conflict types with Error Handling terminology (03-error-handling.md Part 2.1)
  - **P2.1**: Added transactional semantics documentation (per-proposal atomicity) in Phase 5
  - **P2.2**: Clarified Error Handling integration interface with `resolve_conflicts` API transformation
  - **P2.3**: Updated `computeInitialSalience()` to reference canonical formula from 00-common-schemas.md
  - **P2.4**: Implemented dry run mode in `executeOperations()` with simulation output
- v1.0 (2026-03-08): Initial Consolidation subsystem design