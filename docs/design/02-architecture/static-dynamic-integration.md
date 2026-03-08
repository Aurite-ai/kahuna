# Static-Dynamic Architecture Integration

**Type:** Design Document
**Date:** 2026-03-07
**Status:** Stable
**Purpose:** Integrate the static architecture (subsystems, components, contracts) with the dynamic behavior model (Bayesian inference, LLM completion)

**Related:**
- [`abstract-architecture.md`](abstract-architecture.md) — Static architecture

---

## Executive Summary

Kahuna's design has been developed from two complementary perspectives:

1. **Static Architecture** — What EXISTS: subsystems, components, data structures, integration contracts
2. **Dynamic Behavior** — What HAPPENS: Bayesian inference, prior/likelihood/update, learning over time

This document integrates these views to create a complete picture of Kahuna as a system that both HAS structure and DOES computation. The integration reveals that static components are not just "pieces" but are **instruments of inference** — each plays a specific role in the Bayesian completion of the LLM.

**Key insight:** The static architecture IS the dynamic behavior made concrete. Storage is how we maintain the prior. Retrieval is how we compute likelihood. Consolidation is how we perform Bayesian update. This isn't metaphor — it's specification.

---

## Part 1: Two Views Summary

### 1.1 The Static View

The static architecture defines:

| Element | What It Captures |
|---------|------------------|
| **Subsystems** | Cohesive groups of components with shared purpose |
| **Components** | Functional units with defined inputs/outputs |
| **Data Objects** | What flows between components |
| **Integration Contracts** | Interface specifications between subsystems |
| **Dependency Graph** | What depends on what |

**Six Subsystems:**
- **Encoding** — Transform raw input into storable entries
- **Storage** — Persist and retrieve KB entries and metadata
- **Retrieval** — Find and rank relevant entries for context
- **Consolidation** — Transform experiences into durable knowledge
- **Error Handling** — Detect and resolve conflicts
- **Attention** — Compute and maintain salience scores (distributed)

### 1.2 The Dynamic View

The dynamic behavior model defines:

| Element | What It Captures |
|---------|------------------|
| **Bayesian Structure** | Prior, likelihood, evidence, posterior |
| **LLM Incompleteness** | What LLMs lack that prevents full learning |
| **Kahuna Completion** | How Kahuna provides what LLMs lack |
| **Stacked Inference** | Hierarchical Bayesian machines |
| **Agent Pipeline** | Posteriors flowing between inference stages |

**Core Claim:** An LLM alone has:
- ✅ Fixed prior (training weights)
- ❌ No separable likelihood
- ❌ No prior update mechanism
- ❌ No persistent memory

Kahuna completes the system:
- KB = **Updateable prior**
- Retrieval = **Likelihood computation**
- Consolidation = **Bayesian update**

### 1.3 Why Integration Matters

Without integration, we have:
- A parts list (static) without understanding of computation
- A computational model (dynamic) without understanding of implementation

With integration, we have:
- Clear mapping from "what we build" to "what it computes"
- Design decisions grounded in computational requirements
- Ability to verify that implementation achieves intended behavior

---

## Part 2: Component-Role Mapping

### 2.1 The Complete Mapping

| Static Component | Subsystem | Dynamic Role | Bayesian Function |
|-----------------|-----------|--------------|-------------------|
| **KB Files** | Storage | Prior distribution P(H) | Encodes beliefs about the project |
| **Metadata Store** | Storage | Prior parameters | Confidence, salience, source inform P(H) |
| **Semantic Index** | Storage | Prior + Likelihood structure | Enables similarity-based retrieval |
| **Query Processor** | Retrieval | Evidence interpretation | Transforms task into query |
| **Semantic Searcher** | Retrieval | Candidate generation | Initial hypothesis space H |
| **Relevance Ranker** | Retrieval | Likelihood computation P(E|H) | "How well does this entry explain the task?" |
| **Context Writer** | Retrieval | Evidence preparation | Formats posterior for LLM consumption |
| **Extraction Agent** | Consolidation | Evidence gathering | Extracts learnable episodes from experience |
| **Integration Agent** | Consolidation | Update proposal | Proposes how to modify P(H) |
| **Consolidation Agent** | Consolidation | Bayesian update | Applies changes to P(H) |
| **Decay Processor** | Consolidation | Prior pruning | Prevents prior from growing unbounded |
| **Conflict Detector** | Error Handling | Inconsistency detection | Finds violations of P(H) coherence |
| **Conflict Resolver** | Error Handling | Belief revision | Resolves contradictions in P(H) |
| **Categorizer** | Encoding | Prior structure | Assigns new knowledge to appropriate P(H) region |
| **Salience Computer** | Attention | Prior weighting | Determines which parts of P(H) matter |

### 2.2 Expanded Role Descriptions

#### Storage Subsystem = Prior Maintenance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STORAGE AS PRIOR MAINTENANCE                          │
│                                                                          │
│   What the static view says:                                             │
│   "Persist and retrieve KB entries and metadata"                         │
│                                                                          │
│   What the dynamic view adds:                                            │
│   "Maintain the updateable prior distribution P(H)"                      │
│                                                                          │
│   ┌─────────────────┐                                                    │
│   │    KB FILES     │  ← Each file represents beliefs about a domain    │
│   │                 │    The content IS the prior                        │
│   │  preferences/   │    "For architecture decisions, this is how we    │
│   │  patterns/      │     think and what we prefer"                     │
│   │  decisions/     │                                                    │
│   └────────┬────────┘                                                    │
│            │                                                             │
│            │ indexed by                                                  │
│            ▼                                                             │
│   ┌─────────────────┐                                                    │
│   │ SEMANTIC INDEX  │  ← Enables similarity-based access to prior       │
│   │                 │    Without this, prior is unsearchable             │
│   │  embeddings     │    With this, we can find relevant beliefs         │
│   └────────┬────────┘                                                    │
│            │                                                             │
│            │ augmented by                                                │
│            ▼                                                             │
│   ┌─────────────────┐                                                    │
│   │ METADATA STORE  │  ← Parameters of the prior distribution           │
│   │                 │    Confidence = how strongly we hold this belief   │
│   │  confidence     │    Salience = how important this belief is         │
│   │  salience       │    Source = where this belief came from            │
│   │  source         │                                                    │
│   └─────────────────┘                                                    │
│                                                                          │
│   INVARIANT: The KB at any moment IS the prior P(H)                      │
│   Changing the KB = Changing what we believe                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Retrieval Subsystem = Likelihood Computation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RETRIEVAL AS LIKELIHOOD COMPUTATION                   │
│                                                                          │
│   What the static view says:                                             │
│   "Find and rank relevant KB entries for a given context"               │
│                                                                          │
│   What the dynamic view adds:                                            │
│   "Compute P(Evidence | Hypothesis) — how well does each entry          │
│    explain/fit the current task?"                                        │
│                                                                          │
│   BAYESIAN INTERPRETATION:                                               │
│   ─────────────────────────                                              │
│   - Hypothesis H = "Entry X is relevant to this task"                   │
│   - Evidence E = The task description + mode context                    │
│   - P(E|H) = "If this entry IS relevant, how well does it fit?"         │
│                                                                          │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│   │ QUERY PROCESSOR │────▶│ SEMANTIC SEARCH │────▶│ RELEVANCE RANK  │   │
│   │                 │     │                 │     │                 │   │
│   │ Interprets task │     │ Finds candidates│     │ Computes P(E|H) │   │
│   │ as query        │     │ from index      │     │ for each entry  │   │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│                                                          │              │
│                                                          │ ranked       │
│                                                          ▼              │
│                                                   ┌─────────────────┐   │
│                                                   │ CONTEXT WRITER  │   │
│                                                   │                 │   │
│                                                   │ Packages for    │   │
│                                                   │ LLM consumption │   │
│                                                   └─────────────────┘   │
│                                                                          │
│   THE RANKING IS THE LIKELIHOOD:                                         │
│   A high-ranked entry has high P(task | entry is relevant)              │
│   This is equivalent to P(entry is relevant | task) by Bayes            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Consolidation Subsystem = Bayesian Update

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSOLIDATION AS BAYESIAN UPDATE                      │
│                                                                          │
│   What the static view says:                                             │
│   "Transform session experiences into durable knowledge"                │
│                                                                          │
│   What the dynamic view adds:                                            │
│   "Perform P(H_new) = Update(P(H_old), Evidence)"                       │
│   This is where LEARNING happens.                                        │
│                                                                          │
│   THE UPDATE PIPELINE:                                                   │
│   ────────────────────                                                   │
│                                                                          │
│   ┌─────────────────┐                                                    │
│   │   EXTRACTION    │  ← Gathers evidence from session                   │
│   │                 │    "What did we learn?"                            │
│   │   Conv log ────▶│    Produces: Episodes (raw evidence)               │
│   │                 │                                                    │
│   └────────┬────────┘                                                    │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐                                                    │
│   │  INTEGRATION    │  ← Proposes how evidence should update P(H)        │
│   │                 │    "Given what we learned, how should beliefs      │
│   │   Episodes +    │     change?"                                       │
│   │   KB state ────▶│    Produces: Update proposals                      │
│   │                 │                                                    │
│   └────────┬────────┘                                                    │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐                                                    │
│   │ CONSOLIDATION   │  ← Applies the update to P(H)                      │
│   │                 │    "Commit the belief changes"                     │
│   │   Validated     │    Produces: Updated KB (new prior)                │
│   │   proposals ───▶│                                                    │
│   │                 │                                                    │
│   └────────┬────────┘                                                    │
│            │                                                             │
│            ▼                                                             │
│   ┌─────────────────┐                                                    │
│   │     DECAY       │  ← Prunes the prior to prevent unbounded growth    │
│   │                 │    "Forget what no longer matters"                 │
│   │   Stale entries │    Maintains tractable P(H)                        │
│   │   archived ────▶│                                                    │
│   │                 │                                                    │
│   └─────────────────┘                                                    │
│                                                                          │
│   INVARIANT: After consolidation, P(H) reflects both old beliefs        │
│   AND new evidence. This is Bayesian learning.                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Error Handling Subsystem = Belief Revision

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING AS BELIEF REVISION                     │
│                                                                          │
│   What the static view says:                                             │
│   "Detect and resolve conflicts in KB"                                  │
│                                                                          │
│   What the dynamic view adds:                                            │
│   "Ensure P(H) remains coherent — no contradictory beliefs"             │
│   This is belief revision / truth maintenance.                           │
│                                                                          │
│   WHY THIS MATTERS:                                                      │
│   ──────────────────                                                     │
│   Bayes assumes a coherent probability distribution.                     │
│   If P(A) = 0.8 and P(not-A) = 0.5, the math breaks.                    │
│   Conflicting KB entries = incoherent P(H).                             │
│                                                                          │
│   ┌─────────────────┐                                                    │
│   │    CONFLICT     │  ← Detects incoherence in P(H)                     │
│   │    DETECTOR     │    "Entry A says X, entry B says not-X"            │
│   │                 │    This violates probability axioms                │
│   │   Proposals +   │                                                    │
│   │   KB state ────▶│                                                    │
│   └────────┬────────┘                                                    │
│            │                                                             │
│            │ conflicts                                                   │
│            ▼                                                             │
│   ┌─────────────────┐                                                    │
│   │    CONFLICT     │  ← Revises beliefs to restore coherence            │
│   │    RESOLVER     │    Uses: recency, confidence, source priority      │
│   │                 │    "Which belief should we keep?"                  │
│   │   Conflict      │                                                    │
│   │   report ──────▶│    Produces: Coherent update proposals             │
│   └─────────────────┘                                                    │
│                                                                          │
│   ESCALATION = admitting uncertainty                                     │
│   When we can't resolve: mark as "uncertain" rather than corrupt P(H)   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Attention Subsystem = Prior Weighting

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ATTENTION AS PRIOR WEIGHTING                          │
│                                                                          │
│   What the static view says:                                             │
│   "Compute and maintain importance/salience scores"                     │
│                                                                          │
│   What the dynamic view adds:                                            │
│   "Not all beliefs are equally important. Salience weights P(H)."       │
│                                                                          │
│   BAYESIAN INTERPRETATION:                                               │
│   ─────────────────────────                                              │
│   Without salience: P(H) = uniform over KB entries                      │
│   With salience: P(H) ∝ salience × content                              │
│                                                                          │
│   High-salience entries are MORE LIKELY to be relevant a priori.        │
│   This is a principled way to incorporate importance into inference.    │
│                                                                          │
│   DISTRIBUTED COMPUTATION:                                               │
│   ────────────────────────                                               │
│   Salience is updated at multiple points:                                │
│                                                                          │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│   │    ENCODING     │     │   RETRIEVAL     │     │ CONSOLIDATION   │   │
│   │                 │     │                 │     │                 │   │
│   │ Initial assign  │     │ Boost on access │     │ Decay over time │   │
│   │ "How important  │     │ "Used = more    │     │ "Unused = less  │   │
│   │  is this new    │     │  important"     │     │  important"     │   │
│   │  knowledge?"    │     │                 │     │                 │   │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│                                                                          │
│   This creates a DYNAMIC PRIOR that reflects actual usage patterns.     │
│   Frequently-used knowledge becomes more salient.                        │
│   Unused knowledge fades.                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Encoding Subsystem = Prior Expansion

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENCODING AS PRIOR EXPANSION                           │
│                                                                          │
│   What the static view says:                                             │
│   "Transform raw input into storable entries with metadata"             │
│                                                                          │
│   What the dynamic view adds:                                            │
│   "Add new hypotheses to the prior distribution P(H)"                   │
│                                                                          │
│   BAYESIAN INTERPRETATION:                                               │
│   ─────────────────────────                                              │
│   Before encoding: P(H) covers existing hypotheses                       │
│   After encoding: P(H') covers existing + new hypothesis                │
│                                                                          │
│   The categorizer determines WHERE in hypothesis space the new          │
│   knowledge lives. This is prior structure, not just organization.      │
│                                                                          │
│   ┌─────────────────┐     ┌─────────────────┐                           │
│   │   CATEGORIZER   │────▶│ INITIAL SALIENCE│                           │
│   │                 │     │                 │                           │
│   │ Where does this │     │ How important   │                           │
│   │ fit in P(H)?    │     │ is this new H?  │                           │
│   └─────────────────┘     └─────────────────┘                           │
│                                                                          │
│   Key difference from consolidation:                                     │
│   - Encoding adds to P(H) directly (explicit learning via learn tool)  │
│   - Consolidation updates P(H) based on evidence (implicit learning)   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Integration Points

### 3.1 Where Static and Dynamic Meet

Integration points are the exact locations where structural components perform dynamic computation. These are the **operational interfaces** — where data structures become inference operations.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       INTEGRATION POINT MAP                              │
│                                                                          │
│   STATIC WORLD                    DYNAMIC WORLD                          │
│   ────────────                    ─────────────                          │
│                                                                          │
│   KB File Read ─────────────────▶ Prior Query                           │
│   "Get entry content"              "What do we believe?"                 │
│         │                                │                               │
│         │                                │                               │
│   Integration Point 1: PRIOR ACCESS      │                               │
│   ────────────────────────────────────────                               │
│                                                                          │
│                                                                          │
│   Semantic Search ──────────────▶ Likelihood Computation                │
│   "Find similar entries"           "How relevant is each?"              │
│         │                                │                               │
│         │                                │                               │
│   Integration Point 2: RELEVANCE SCORING │                               │
│   ────────────────────────────────────────                               │
│                                                                          │
│                                                                          │
│   Context Guide Write ──────────▶ Evidence Preparation                  │
│   "Format for LLM"                 "Package posterior for next layer"   │
│         │                                │                               │
│         │                                │                               │
│   Integration Point 3: LAYER TRANSITION  │                               │
│   ────────────────────────────────────────                               │
│                                                                          │
│                                                                          │
│   KB File Update ───────────────▶ Bayesian Update                       │
│   "Modify entry"                   "Update P(H)"                         │
│         │                                │                               │
│         │                                │                               │
│   Integration Point 4: LEARNING          │                               │
│   ────────────────────────────────────────                               │
│                                                                          │
│                                                                          │
│   Metadata Update ──────────────▶ Prior Parameter Adjustment            │
│   "Change salience/confidence"     "Adjust belief strength"             │
│         │                                │                               │
│         │                                │                               │
│   Integration Point 5: BELIEF MODULATION │                               │
│   ────────────────────────────────────────                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Structures as Computational Instruments

| Data Structure | Static Description | Dynamic Function | Why This Structure |
|----------------|-------------------|------------------|-------------------|
| **KB Entry** | Markdown file with content + frontmatter | A single hypothesis in P(H) | Markdown = human-readable, frontmatter = metadata |
| **Semantic Embedding** | Vector representation | Enables similarity = likelihood | Vectors allow fast approximate matching |
| **Salience Score** | Float 0.0-1.0 | Prior weight | Bounded, comparable, updateable |
| **Confidence Score** | Float 0.0-1.0 | Belief strength | Propagates through pipeline |
| **Category** | String taxonomy | P(H) structure | Organizes hypothesis space |
| **Source Type** | Enum: user/inferred/observed | Reliability weighting | Affects conflict resolution |
| **Timestamp** | ISO datetime | Recency for decay | Enables time-based operations |
| **Episode** | Structured extraction | Evidence unit | Self-contained learning signal |
| **Proposal** | Structured update intent | Update candidate | Can be validated before applying |

### 3.3 Operations as Inference Steps

| Static Operation | Input | Output | Dynamic Meaning |
|-----------------|-------|--------|-----------------|
| `semantic_search(query)` | Query embedding | Candidate entries | "Generate hypothesis space" |
| `rank_by_relevance(candidates)` | Candidates + task | Ranked list | "Compute P(E|H) for each H" |
| `store_entry(entry)` | New entry | Entry ID | "Expand P(H) with new hypothesis" |
| `update_entry(id, content)` | Entry ID + new content | Updated entry | "Revise belief H" |
| `delete_entry(id)` | Entry ID | Void | "Remove hypothesis from P(H)" |
| `update_salience(id, delta)` | Entry ID + change | New salience | "Adjust P(H) weighting" |
| `detect_conflicts(proposal, kb)` | Proposal + KB state | Conflict report | "Check P(H) coherence" |
| `resolve_conflict(report)` | Conflict report | Resolution | "Restore P(H) coherence" |
| `apply_decay(scope)` | Decay scope | Decay actions | "Prune P(H) to maintain tractability" |

### 3.4 Entry Points: Static → Dynamic

The system transitions from static structure to dynamic behavior at specific entry points:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENTRY POINTS: STATIC → DYNAMIC                        │
│                                                                          │
│   ENTRY POINT 1: MCP Tool Call                                           │
│   ─────────────────────────────                                          │
│   Static: Tool handler receives request                                  │
│   Dynamic: Inference begins                                              │
│                                                                          │
│   kahuna_prepare_context(task, mode)                                    │
│        │                                                                 │
│        ├── Triggers: Retrieval subsystem activation                     │
│        ├── Computes: P(relevant | task, mode)                           │
│        └── Returns: Context guide (posterior for LLM)                   │
│                                                                          │
│   kahuna_learn(content)                                                 │
│        │                                                                 │
│        ├── Triggers: Encoding subsystem activation                      │
│        ├── Computes: Category assignment, initial salience              │
│        └── Returns: Entry ID (hypothesis added to P(H))                 │
│                                                                          │
│                                                                          │
│   ENTRY POINT 2: Consolidation Trigger                                   │
│   ───────────────────────────────────                                    │
│   Static: Trigger condition met (session end, schedule, etc.)           │
│   Dynamic: Bayesian update cycle begins                                  │
│                                                                          │
│   on_session_end() / on_schedule() / on_capacity_exceeded()            │
│        │                                                                 │
│        ├── Triggers: Full consolidation pipeline                        │
│        ├── Computes: P(H_new) = Update(P(H_old), session_evidence)      │
│        └── Result: Updated KB (new prior)                               │
│                                                                          │
│                                                                          │
│   ENTRY POINT 3: Access Event                                            │
│   ───────────────────────────                                            │
│   Static: Entry retrieved from KB                                        │
│   Dynamic: Salience update (reinforcement)                               │
│                                                                          │
│   on_entry_accessed(entry_id)                                           │
│        │                                                                 │
│        ├── Triggers: Attention subsystem (salience boost)               │
│        ├── Computes: salience' = salience + boost                       │
│        └── Effect: This hypothesis becomes more prominent in P(H)       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Complete Runtime Flow

### 4.1 Unified Flow Diagram

This diagram shows both static components and their dynamic roles in a single view:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           UNIFIED RUNTIME FLOW                                            │
│                                                                                          │
│   USER                                                                                    │
│   ────                                                                                    │
│   Task: "Implement user authentication"                                                  │
│                                                                                          │
│        │                                                                                 │
│        │ MCP: kahuna_prepare_context                                                    │
│        ▼                                                                                 │
│   ╔═══════════════════════════════════════════════════════════════════════════════════╗ │
│   ║                         RETRIEVAL SUBSYSTEM                                        ║ │
│   ║                                                                                    ║ │
│   ║   STATIC                          │        DYNAMIC                                 ║ │
│   ║   ──────                          │        ───────                                 ║ │
│   ║                                   │                                                ║ │
│   ║   Query Processor ────────────────┼──────▶ Evidence Interpretation                ║ │
│   ║   "Parse task + mode"             │        "What question are we asking P(H)?"    ║ │
│   ║           │                       │                                                ║ │
│   ║           ▼                       │                                                ║ │
│   ║   Semantic Searcher ──────────────┼──────▶ Hypothesis Generation                  ║ │
│   ║   "Find candidate entries"        │        "What hypotheses might be relevant?"   ║ │
│   ║           │                       │                                                ║ │
│   ║           ▼                       │                                                ║ │
│   ║   Relevance Ranker ───────────────┼──────▶ Likelihood Computation                 ║ │
│   ║   "Score: similarity × salience"  │        "P(task | entry) for each entry"       ║ │
│   ║           │                       │                                                ║ │
│   ║           ▼                       │                                                ║ │
│   ║   Context Writer ─────────────────┼──────▶ Posterior Packaging                    ║ │
│   ║   "Format .context-guide.md"      │        "Prepare for LLM consumption"          ║ │
│   ║                                   │                                                ║ │
│   ╚═══════════════════════════════════╪════════════════════════════════════════════════╝ │
│                                       │                                                  │
│        │                              │                                                  │
│        │ Context guide                │                                                  │
│        ▼                              │                                                  │
│   ╔═══════════════════════════════════╪════════════════════════════════════════════════╗ │
│   ║                              LLM                                                   ║ │
│   ║                                   │                                                ║ │
│   ║   Receives: Context guide         │        Acts as: Inference engine               ║ │
│   ║   (prior from Kahuna)             │        Computes: P(response | task + context)  ║ │
│   ║   Produces: Response              │        Cannot: Update its own prior            ║ │
│   ║                                   │                                                ║ │
│   ╚═══════════════════════════════════╪════════════════════════════════════════════════╝ │
│                                       │                                                  │
│        │                              │                                                  │
│        │ Session continues...         │                                                  │
│        │ (tool calls, conversation)   │                                                  │
│        │                              │                                                  │
│        ▼                              │                                                  │
│   SESSION ENDS                        │                                                  │
│   ────────────                        │                                                  │
│                                       │                                                  │
│        │                              │                                                  │
│        │ Trigger: Consolidation       │                                                  │
│        ▼                              │                                                  │
│   ╔═══════════════════════════════════╪════════════════════════════════════════════════╗ │
│   ║                     CONSOLIDATION SUBSYSTEM                                        ║ │
│   ║                                   │                                                ║ │
│   ║   STATIC                          │        DYNAMIC                                 ║ │
│   ║   ──────                          │        ───────                                 ║ │
│   ║                                   │                                                ║ │
│   ║   Extraction Agent ───────────────┼──────▶ Evidence Gathering                     ║ │
│   ║   "Parse conversation log"        │        "What did we learn this session?"      ║ │
│   ║           │                       │                                                ║ │
│   ║           ▼                       │                                                ║ │
│   ║   Integration Agent ──────────────┼──────▶ Update Proposal                        ║ │
│   ║   "Compare to existing KB"        │        "How should P(H) change?"              ║ │
│   ║           │                       │                                                ║ │
│   ║           ▼                       │                                                ║ │
│   ║   Error Handling ─────────────────┼──────▶ Coherence Check                        ║ │
│   ║   "Detect/resolve conflicts"      │        "Is updated P(H) coherent?"            ║ │
│   ║           │                       │                                                ║ │
│   ║           ▼                       │                                                ║ │
│   ║   Consolidation Agent ────────────┼──────▶ Bayesian Update                        ║ │
│   ║   "Apply validated updates"       │        "Commit: P(H_new) = Update(P(H), E)"   ║ │
│   ║           │                       │                                                ║ │
│   ║           ▼                       │                                                ║ │
│   ║   Decay Processor ────────────────┼──────▶ Prior Maintenance                      ║ │
│   ║   "Archive/delete stale entries"  │        "Prune P(H) to stay tractable"         ║ │
│   ║                                   │                                                ║ │
│   ╚═══════════════════════════════════╪════════════════════════════════════════════════╝ │
│                                       │                                                  │
│        │                              │                                                  │
│        │ Updated KB                   │                                                  │
│        ▼                              │                                                  │
│   ╔═══════════════════════════════════╪════════════════════════════════════════════════╗ │
│   ║                       STORAGE SUBSYSTEM                                            ║ │
│   ║                                   │                                                ║ │
│   ║   KB Files (updated) ─────────────┼──────▶ P(H) now reflects session learning     ║ │
│   ║   Semantic Index (updated) ───────┼──────▶ New hypotheses searchable              ║ │
│   ║   Metadata (updated) ─────────────┼──────▶ Salience/confidence adjusted           ║ │
│   ║                                   │                                                ║ │
│   ╚═══════════════════════════════════╧════════════════════════════════════════════════╝ │
│                                                                                          │
│   READY FOR NEXT SESSION                                                                 │
│   ──────────────────────                                                                 │
│   The prior P(H) has been updated.                                                       │
│   Next session starts with accumulated knowledge.                                        │
│   This is how the system LEARNS over time.                                               │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Information Flow Table

| Phase | Static Components Active | Data Flowing | Dynamic Computation |
|-------|-------------------------|--------------|---------------------|
| **Context Request** | Query Processor, Semantic Searcher, Relevance Ranker, Context Writer | Task → Query → Candidates → Ranked → Context Guide | P(relevant | task) |
| **LLM Inference** | (External: LLM) | Context Guide → Response | P(response | context) |
| **Access Tracking** | Access Tracker (in Retrieval) | Entry IDs → Salience Updates | Salience reinforcement |
| **Explicit Learning** | Categorizer, Initial Salience, KB File Manager | Content → Entry → Storage | P(H) expansion |
| **Session End** | Trigger Manager | Session state → Consolidation trigger | Trigger detection |
| **Extraction** | Extraction Agent | Conversation log → Episodes | Evidence gathering |
| **Integration** | Integration Agent, Semantic Searcher | Episodes + KB → Proposals | Update planning |
| **Error Check** | Conflict Detector, Conflict Resolver | Proposals → Validated Proposals | P(H) coherence |
| **Consolidation** | Consolidation Agent | Validated Proposals → KB Updates | P(H_new) = Update(P(H), E) |
| **Decay** | Decay Processor | Entry Metadata → Archive/Delete Actions | P(H) pruning |
| **Verification** | Verification Agent | KB State → Verification Report | Integrity check |

---

## Part 5: Gap Analysis

### 5.1 Static Components Without Clear Dynamic Role

| Component | Current Dynamic Role | Issue | Resolution |
|-----------|---------------------|-------|------------|
| **Verification Agent** | "Check KB consistency after updates" | What computation does this perform? | **Resolved:** This is P(H) integrity checking — ensures the updated prior remains well-formed (no orphaned references, valid metadata, etc.). Not a Bayesian operation per se, but a **precondition** for correct inference. |
| **Archive Manager** | Part of decay/storage | Why archive vs delete? | **Resolved:** Archives preserve hypotheses that might be needed for reconstruction/audit but shouldn't influence current inference. This is "suspended hypotheses" vs "deleted hypotheses." |

### 5.2 Dynamic Patterns Without Static Implementation

| Dynamic Pattern | Required Behavior | Static Implementation | Status |
|-----------------|-------------------|----------------------|--------|
| **Confidence Propagation** | Extraction confidence → Integration confidence → Final confidence | Metadata field passed through pipeline | ⚠️ **Partially Specified** — How confidence combines is undefined |
| **Feedback Loop (LLM → Kahuna)** | LLM success/failure should inform retrieval quality | Not currently specified | ❌ **Missing** — No mechanism for LLM to signal retrieval quality |
| **Layer Calibration** | Kahuna's "relevance" should match LLM's actual needs | Not currently specified | ❌ **Missing** — No calibration mechanism defined |
| **Multi-Modal Posterior** | Sometimes multiple entries are "equally relevant" | Ranking returns ordered list | ⚠️ **Implicit** — Ranking captures this, but diversity logic undefined |

### 5.3 Missing Integration Mechanisms

#### Gap 1: Confidence Propagation

**Problem:** The dynamic model says "confidence must propagate" through the agent pipeline. The static architecture has confidence as a metadata field, but doesn't specify how confidence combines.

**Example:**
- Extraction is 70% confident about an episode
- Integration proposes an update based on this episode
- What confidence should the proposal have?

**Proposed Resolution:**
```
Proposal.confidence = Episode.confidence × Integration.confidence
Where Integration.confidence = agent's confidence in its proposal given the episode

If Episode.confidence = 0.7 and Integration.confidence = 0.9:
   Proposal.confidence = 0.63
```

This is the standard Bayesian confidence multiplication. Add to Integration → Error Handling contract.

#### Gap 2: LLM → Kahuna Feedback

**Problem:** The dynamic model describes a "stacked Bayesian system" where layers communicate through "predictions and prediction errors." Currently, Kahuna sends context to the LLM, but the LLM has no mechanism to signal back.

**What's Missing:**
- Did the retrieved context help?
- Was anything missing?
- Was anything irrelevant (noise)?

**Proposed Resolution:**

Add an implicit feedback mechanism via session analysis:
```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IMPLICIT FEEDBACK MECHANISM                           │
│                                                                          │
│   During Extraction:                                                     │
│   ─────────────────                                                      │
│   1. Identify what context was surfaced                                  │
│   2. Identify what the LLM actually used (referenced in response)       │
│   3. Identify gaps (LLM asked for info not in context)                  │
│                                                                          │
│   Generate Feedback Signals:                                             │
│   ──────────────────────────                                             │
│   - Used entries → salience boost                                        │
│   - Unused entries → no change (not penalty, might be valid)            │
│   - Gaps → flag as missing knowledge                                     │
│                                                                          │
│   This closes the feedback loop without explicit LLM cooperation.        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

This extends the Extraction Agent's responsibilities.

#### Gap 3: Layer Calibration

**Problem:** How do we know if Kahuna's relevance scoring matches what the LLM actually needs?

**Symptoms of Miscalibration:**
- High-ranked entries never used by LLM
- LLM frequently asks for information not in context
- Retrieved context doesn't reduce LLM uncertainty

**Proposed Resolution:**

Define calibration metrics:
```
Calibration Score = Correlation(Relevance Rank, Actual Usage Rank)

If we rank entry A > entry B,
the LLM should use A more than B.
If this correlation is low, we're miscalibrated.
```

This requires tracking:
- What we surfaced (ranked)
- What LLM used (from session analysis)
- Computing correlation over time

Add to Verification Agent responsibilities as a periodic health check.

### 5.4 Summary of Gaps

| Gap | Severity | Resolution | Implementation Impact |
|-----|----------|------------|----------------------|
| Confidence Propagation | Medium | Define combination rule | Update contracts |
| LLM → Kahuna Feedback | High | Implicit via session analysis | Extend Extraction Agent |
| Layer Calibration | Medium | Define metrics + tracking | Extend Verification Agent |
| Multi-Modal Posterior | Low | Make diversity logic explicit | Update Retrieval subsystem |

---

## Part 6: Implications for the Methodology

### 6.1 The Integration Reveals: Structure IS Computation

The most important finding from this integration:

**Static architecture and dynamic behavior are not separate things.**

- Storage isn't just "where we put files" — it's how we maintain P(H)
- Retrieval isn't just "finding relevant stuff" — it's computing likelihood
- Consolidation isn't just "saving learned things" — it's Bayesian update

This means:
- **Design decisions about structure ARE design decisions about computation**
- Changing KB organization changes the prior structure
- Changing retrieval ranking changes the likelihood function
- Changing consolidation rules changes the learning algorithm

### 6.2 Implications for Design Process

#### When Designing Static Components

Ask: "What computation does this enable?"

| Static Design Question | Dynamic Translation |
|-----------------------|---------------------|
| "What's the file format?" | "How is P(H) represented?" |
| "How is the index organized?" | "How efficient is likelihood computation?" |
| "What metadata do we store?" | "What parameters does P(H) have?" |
| "How do we handle conflicts?" | "How do we maintain P(H) coherence?" |

#### When Designing Dynamic Behavior

Ask: "What structure supports this?"

| Dynamic Design Question | Static Translation |
|-----------------------|---------------------|
| "How do we represent prior?" | "What storage structure?" |
| "How do we compute relevance?" | "What index and ranking?" |
| "How do we learn from experience?" | "What consolidation pipeline?" |
| "How do we handle uncertainty?" | "What confidence metadata?" |

### 6.3 Implications for Implementation

#### Implementation Order

The dependency graph from static architecture + dynamic roles suggests:

```
Phase 1: Foundation (P(H) representation)
─────────────────────────────────────────
Storage subsystem
- KB file format
- Metadata schema
- Semantic index

This is: "Where does P(H) live?"


Phase 2: Inference (likelihood computation)
───────────────────────────────────────────
Retrieval subsystem
- Query processing
- Similarity search
- Relevance ranking

This is: "How do we compute P(relevant | task)?"


Phase 3: Learning (Bayesian update)
───────────────────────────────────
Consolidation subsystem
- Extraction agent
- Integration agent
- Error handling
- Consolidation agent

This is: "How does P(H) change from experience?"


Phase 4: Attention (prior weighting)
────────────────────────────────────
Attention subsystem (distributed)
- Salience computation rules
- Decay logic
- Access tracking

This is: "Which parts of P(H) matter most?"


Phase 5: Quality (calibration + feedback)
─────────────────────────────────────────
Feedback mechanisms
- Session analysis for implicit feedback
- Calibration metrics
- Health checks

This is: "Is the system working correctly?"
```

#### Verification Strategy

Because static structure IS dynamic computation:

- **Unit tests** verify static component behavior
- **Integration tests** verify component composition
- **Calibration tests** verify dynamic computation quality

Example calibration test:
```
Given: Known-relevant entries for a task
When: Retrieval runs
Then: Known-relevant entries should rank highly
      Calibration score > 0.7
```

### 6.4 Implications for Documentation

#### Documentation Should Be Dual-View

For each subsystem, document both:

1. **Static specification** — Components, contracts, data structures
2. **Dynamic role** — What computation this enables, how it participates in inference

Example:
```markdown
## Storage Subsystem

### Static Specification
- Components: KB File Manager, Semantic Index, Metadata Store
- Contracts: See Integration Contracts section
- Data: EntrySchema, MetadataSchema

### Dynamic Role
- Maintains the prior distribution P(H)
- KB files ARE the hypotheses
- Metadata ARE the prior parameters
- Index ENABLES efficient likelihood computation
```

This dual documentation ensures implementers understand both WHAT they're building and WHY.

---

## Summary

### What This Document Establishes

1. **Complete mapping** between static components and dynamic roles
2. **Integration points** where structure becomes computation
3. **Unified runtime flow** showing both views simultaneously
4. **Gap analysis** revealing missing mechanisms
5. **Methodology implications** for design, implementation, and documentation

### Key Insights

1. **Storage = Prior** — The KB IS the updateable prior distribution
2. **Retrieval = Likelihood** — Relevance ranking IS likelihood computation
3. **Consolidation = Update** — Learning IS Bayesian update of P(H)
4. **Error Handling = Coherence** — Conflict resolution maintains P(H) consistency
5. **Attention = Weighting** — Salience weights the prior distribution

### Gaps Identified

1. **Confidence propagation** — How confidence combines through pipeline (medium)
2. **Feedback loop** — How LLM signals retrieval quality back (high)
3. **Layer calibration** — How to verify layers are aligned (medium)

### Foundation Established

This integration provides the foundation for:
- Implementation planning (knowing what computes what)
- Subsystem design (understanding the computational requirements)
- Quality assurance (testing that computation works correctly)
- Future evolution (understanding what changes when structure changes)

---

## Changelog

- v1.0 (2026-03-07): Initial static-dynamic integration
