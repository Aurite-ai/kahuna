# Kahuna Abstract Architecture

**Type:** Design Document
**Date:** 2026-03-08
**Status:** Stable (v2.0)
**Purpose:** Define Kahuna as the Memory subsystem of the Cognitive Computer — subsystems, components, contracts, integration points, and G-level grounding

**Related:**
- [`cognitive-computer-architecture.md`](../01-product/cognitive-computer-architecture.md) — Parent architecture (Kahuna implements Memory subsystem)
- [`general-intelligence-theory.md`](../04-foundations/general-intelligence-theory.md) — G Theory foundation (3×4 framework)
- [`static-dynamic-integration.md`](static-dynamic-integration.md) — Bayesian integration details
- [`kahuna-product-model.md`](../01-product/kahuna-product-model.md) — Product-level definition
- [`00-common-schemas.md`](../03-subsystem/00-common-schemas.md) — Episode Schema, Conversation Log, Salience Architecture, Integration Criteria

### Claim Strength Legend

This document uses markers to indicate the epistemic status of architectural claims:

| Marker | Meaning | Implication |
|--------|---------|-------------|
| **[Established]** | Derived from triple parallel analysis or physics constraints | Structural necessity, changing requires strong justification |
| **[Derived]** | Follows logically from established claims | Dependent on parent claims, internally consistent |
| **[Hypothesis]** | Design choice that could reasonably be different | Subject to empirical validation, may change |

---

## Executive Summary

Kahuna implements the **Memory subsystem** of the Cognitive Computer architecture. An LLM alone is an incomplete cognitive system — it can perform inference but cannot update its beliefs, maintain persistent memory, or learn from experience. Kahuna completes the LLM by providing these capabilities.

**Position in Cognitive Computer:**
- Kahuna IS the Memory subsystem (G0, G3 operations)
- Kahuna operates as the **compression operator** — transforming human G8+ decisions into G0/G3 structures usable by the LLM
- Kahuna enables session-to-session learning via the consolidation pipeline

**Document Structure:**
1. Part 0: Cognitive Computer Context (positioning)
2. Parts 1-2: Architectural Questions and Decisions
3. Parts 3-4: Component Map and Data Flow
4. Part 5: Subsystem Boundaries (with G-level annotations)
5. Part 6: Integration Contracts
6. Part 7: Dependency Graph
7. Part 8: Cognitive Computer Interfaces
8. Part 9: Bayesian Framing

---

## Part 0: Cognitive Computer Context

### 0.1 Kahuna in the Cognitive Computer

**[Derived]** Kahuna implements the Memory subsystem of the Cognitive Computer architecture.

*Derivation:* The Cognitive Computer requires six functional subsystems for complete cognition. The LLM provides the Inference Core but lacks persistent, updateable memory. Kahuna provides this missing capability.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         KAHUNA IN THE COGNITIVE COMPUTER                                  │
│                                                                                          │
│   THE COGNITIVE COMPUTER                                                                  │
│   ══════════════════════                                                                  │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │ EXECUTIVE FUNCTION (G4-G6)                                                       │   │
│   │ Planning, attention allocation, task management                                  │   │
│   │ Implementation: Orchestrator, CogOS rules                                        │   │
│   └───────────────────────────────────┬─────────────────────────────────────────────┘   │
│                                       │                                                  │
│           ┌───────────────────────────┼───────────────────────────┐                     │
│           │                           │                           │                     │
│           ▼                           ▼                           ▼                     │
│   ┌───────────────┐           ┌───────────────┐           ╔═══════════════╗             │
│   │  PERCEPTION   │           │ INFERENCE CORE│           ║    MEMORY     ║             │
│   │   (G0-G1)     │           │   (G1-G3)     │           ║   (G0, G3)    ║             │
│   │               │──────────▶│               │◀─────────▶║               ║             │
│   │ Vision, STT,  │           │  LLM (Claude, │           ║ ═══ KAHUNA ═══║             │
│   │ parsers       │           │   GPT, etc.)  │           ║               ║             │
│   │               │           │               │           ║ 6 subsystems  ║             │
│   └───────────────┘           └───────┬───────┘           ╚═══════════════╝             │
│                                       │                                                  │
│                    ┌──────────────────┼──────────────────┐                              │
│                    │                  │                  │                              │
│                    ▼                  ▼                  ▼                              │
│           ┌───────────────┐   ┌───────────────┐   ┌───────────────┐                     │
│           │    ACTION     │   │META-COGNITION │   │   Response    │                     │
│           │   (G6-G7)     │   │    (G7)       │   │   to User     │                     │
│           │               │   │               │   │               │                     │
│           │ External tools│   │ Internal tools│   │               │                     │
│           └───────────────┘   └───────────────┘   └───────────────┘                     │
│                                                                                          │
│   ════════════════════════════ G7 BOUNDARY ═════════════════════════════                │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │ HUMAN INTERFACE (G8-G11)                                                         │   │
│   │ Values, goals, identity — provides direction to the system                       │   │
│   │ Kahuna compresses G8+ decisions into G0/G3 structures                            │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 0.2 What Kahuna Provides

| Capability | What LLM Lacks | What Kahuna Provides |
|------------|---------------|---------------------|
| **Persistent Memory** | Context resets each session | Knowledge Base persists across sessions |
| **Updateable Prior** | Weights frozen at training | KB can be modified based on experience |
| **Separable Likelihood** | Prior and likelihood entangled | Retrieval computes relevance separately |
| **Learning** | Cannot update from experience | Consolidation pipeline learns from sessions |
| **Salience** | No importance weighting | Attention subsystem tracks what matters |

### 0.3 G-Level Coverage

**[Derived]** Kahuna operates primarily at G0 and G3 within the Pattern domain.

*Derivation:* From G Theory's 3×4 structure — Memory subsystem provides substrate (G0) and stored rules/patterns (G3). The LLM uses these for G1-G3 operations.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              G THEORY MAPPING                                              │
│                                                                                          │
│  DOMAIN           │ G LEVELS │ COGNITIVE COMPUTER │ KAHUNA ROLE                          │
│  ═════════════════╪══════════╪════════════════════╪══════════════════════════════════   │
│                   │          │                    │                                      │
│  PATTERNS (IS)    │ G0       │ Memory (substrate) │ ▶▶ KB IS the prior P(H)            │
│  What IS?         │ G1       │ Perception/Attn    │    (entries are hypotheses)         │
│                   │ G2       │ Inference Core     │                                      │
│                   │ G3       │ Rule following     │ ▶▶ KB entries are G3 rules         │
│                   │          │                    │                                      │
│  ──────────────────────────────────────────────────────────────────────────────────────  │
│                   │          │                    │                                      │
│  STRATEGIES (DO)  │ G4       │ Executive Function │    [External to Kahuna]              │
│  What to DO?      │ G5       │ Meta-planning      │                                      │
│                   │ G6       │ Symbolic reasoning │                                      │
│                   │ G7       │ Meta-cognition     │    Kahuna contributes:               │
│                   │          │                    │    salience tracking                 │
│                   │          │                    │                                      │
│  ──────────────────────────────────────────────────────────────────────────────────────  │
│                   │          │                    │                                      │
│  VALUES (WANT)    │ G8       │ Human Interface    │ ▶▶ Kahuna = Compression Operator   │
│  What to WANT?    │ G9       │ Human Interface    │    G8+ → G0/G3 structures           │
│                   │ G10      │ Human Interface    │                                      │
│                   │ G11      │ Human Interface    │                                      │
│                   │          │                    │                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 0.4 Kahuna as Compression Operator

**[Derived]** Kahuna serves as the compression operator (P) that transforms human G8+ decisions into G0/G3 structures.

*Derivation:* From G Theory — high-G decisions must be compressed into structures usable by lower-G systems. Humans operate at G8-G11 (values, identity); LLMs operate at G1-G3 (patterns). Kahuna bridges this gap.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         COMPRESSION OPERATOR FUNCTION                                     │
│                                                                                          │
│   Human (G8-G11)                                                                          │
│        │                                                                                 │
│        │ Makes value-level decisions:                                                    │
│        │ • "We prefer clean, simple code"                                                │
│        │ • "Always test before committing"                                               │
│        │ • "This project uses specific patterns"                                         │
│        │ • "Quality standards are X"                                                     │
│        │                                                                                 │
│        ▼                                                                                 │
│   ╔═══════════════════════════════════════════════════════════════════════════════════╗  │
│   ║                                 KAHUNA                                             ║  │
│   ║                                                                                    ║  │
│   ║  Compression Function: P                                                           ║  │
│   ║  Mathematical: G0' = P × G_human_decisions                                         ║  │
│   ║                                                                                    ║  │
│   ║  How compression happens:                                                          ║  │
│   ║  ┌─────────────────────┬──────────────────────────────────────────────────────┐   ║  │
│   ║  │ Human G Level       │ Compressed Into                                      │   ║  │
│   ║  ├─────────────────────┼──────────────────────────────────────────────────────┤   ║  │
│   ║  │ G8 (Preferences)    │ KB entries about what to prioritize                  │   ║  │
│   ║  │ G9 (Values)         │ Rules files specifying constraints                   │   ║  │
│   ║  │ G10 (Evaluations)   │ Quality criteria stored for retrieval               │   ║  │
│   ║  │ G11 (Identity)      │ System prompt, mode configurations                   │   ║  │
│   ║  └─────────────────────┴──────────────────────────────────────────────────────┘   ║  │
│   ║                                                                                    ║  │
│   ╚═══════════════════════════════════════════════════════════════════════════════════╝  │
│        │                                                                                 │
│        │ Provides to LLM as:                                                            │
│        │ • G0 (substrate): Context window content = KB entries                          │
│        │ • G3 (rules): Patterns, conventions, decisions                                 │
│        │                                                                                 │
│        ▼                                                                                 │
│   LLM (G1-G3 native, G4-G6 scaffolded)                                                   │
│        │                                                                                 │
│        │ Uses compressed prior to:                                                       │
│        │ • Follow conventions (G3)                                                       │
│        │ • Generate predictions (G2)                                                     │
│        │ • Focus attention (G1)                                                          │
│        │                                                                                 │
│        ▼                                                                                 │
│   Quality output aligned with human values                                               │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Compression mechanisms in Kahuna:**

| Mechanism | Input (G8+) | Output (G0/G3) | Subsystem |
|-----------|-------------|----------------|-----------|
| **Explicit learning** | User teaches preference | KB entry | Encoding |
| **Consolidation** | Session reveals preferences | Updated KB | Consolidation |
| **Mode configuration** | User selects workflow | Mode rules active | Retrieval |
| **Correction capture** | User corrects mistake | Error entry | Consolidation |

---

## Part 1: Architectural vs. Subsystem Questions

### Classification Criteria

| Question Type | Scope | Answer Now? | Examples |
|--------------|-------|-------------|----------|
| **Architectural** | Where, What, When, Integration | Yes | "Where does decay live?" "What triggers error detection?" |
| **Subsystem** | How, Algorithm, Threshold | No (defer) | "What formula computes importance?" "How is similarity measured?" |

### Gap Classification

#### Critical Gaps

| Gap | Architectural Questions | Subsystem Questions |
|-----|------------------------|---------------------|
| **Conflict Detection** | Where does it live? When does it run? What triggers it? What does it produce? What depends on it? | How does it detect contradictions? What defines "conflict"? |
| **Conflict Resolution** | Where does it live? When does it run? What are its inputs/outputs? What escalation paths exist? | What resolution strategies? How to choose between them? |
| **Importance Scoring** | Where does scoring occur? When is it computed? What signals feed into it? What consumes the scores? | What formula? How are factors weighted? |
| **Relevance Ranking** | Where does ranking happen? What inputs does it receive? What output format? | What algorithm? What embedding model? |
| **Decay Function** | Where does decay run? When is it triggered? What are decay outcomes? | What decay curve? What thresholds? |

#### Significant Gaps

| Gap | Architectural Questions | Subsystem Questions |
|-----|------------------------|---------------------|
| **Consolidation Triggers** | What triggers exist? When do they fire? How do they interact? | How to detect "capacity" limits? |
| **Integration Thresholds** | What decisions are made? What inputs drive decisions? | What similarity threshold = merge? |
| **Source Tracking** | What metadata is stored? When is it captured? What consumes it? | How to represent provenance chains? |
| **Confidence Metadata** | What fields are needed? When is confidence computed? | How to derive confidence values? |
| **Encoding Depth** | Where is depth assessed? What affects depth? What uses depth info? | How to measure depth? |

#### Minor Gaps (Defer Entirely to Subsystem Design)

| Gap | Reason for Deferral |
|-----|---------------------|
| Reconsolidation on retrieval | Architectural impact is minimal—can be added to retrieval subsystem |
| Inference capability | Extension to retrieval—architectural placement clear |
| Metacognition tracking | Metadata extension—placement clear |
| Truth maintenance | Part of error handling subsystem |
| KB file split/merge | Part of consolidation subsystem |

---

## Part 2: Architectural Decisions

### 2.1 Error Handling Subsystem

**[Established]** Error handling is a **first-class subsystem** that intercepts integration proposals before consolidation.

*Derivation:* All three parallels show error detection before commitment—brain detects inconsistencies before consolidation, computers validate before write-commit, AI needs the same gate.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING PLACEMENT                              │
│                                                                          │
│   Integration Stage                                                      │
│        │                                                                 │
│        │ Produces: Update Proposals                                      │
│        ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                  ERROR HANDLING                                  │   │
│   │                                                                  │   │
│   │   ┌───────────────┐     ┌────────────────┐                      │   │
│   │   │   CONFLICT    │────▶│    CONFLICT    │                      │   │
│   │   │   DETECTOR    │     │    RESOLVER    │                      │   │
│   │   └───────────────┘     └────────────────┘                      │   │
│   │          │                      │                                │   │
│   │          ▼                      ▼                                │   │
│   │   Conflict Reports      Resolution Decisions                     │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│        │                                                                 │
│        │ Produces: Validated Proposals (conflicts resolved)              │
│        ▼                                                                 │
│   Consolidation Stage                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

| Aspect | Decision |
|--------|----------|
| **Location** | Between Integration and Consolidation stages |
| **Triggers** | 1. Integration proposes updates (inline) 2. Scheduled consistency scan (background) 3. On retrieval inconsistency (reactive) |
| **Inputs** | Update proposals, existing KB state, source metadata |
| **Outputs** | Validated proposals OR escalation requests |
| **Dependencies** | Depends on: Storage (KB access), Integration (proposals). Depended on by: Consolidation (can't proceed with unresolved conflicts) |

**Escalation Path:**
1. Auto-resolve using rules (recency, source priority, confidence)
2. If unresolvable → mark entries as "conflicted" + flag for human review
3. Conflicted entries surfaced during retrieval with warning

### 2.2 Attention/Salience Subsystem

**[Established]** Salience is computed **inline at multiple points**, not as a separate service.

*Derivation:* Attention is distributed in all three parallels—brain has no central "attention server," computers use distributed cache policies, attention must be computed where information is processed.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SALIENCE COMPUTATION POINTS                           │
│                                                                          │
│   ENCODING PATH                                                          │
│   ─────────────                                                          │
│   New Entry ──► [Initial Salience] ──► Storage                          │
│                  │                                                       │
│                  └── Based on: source type, explicit signals             │
│                                                                          │
│   RETRIEVAL PATH                                                         │
│   ──────────────                                                         │
│   Query ──► Semantic Search ──► [Relevance + Salience Ranking]          │
│                                  │                                       │
│                                  └── Combines: similarity score +        │
│                                      stored salience + recency           │
│                                                                          │
│   ACCESS PATH                                                            │
│   ───────────                                                            │
│   Entry Retrieved ──► [Salience Boost] ──► Update Metadata              │
│                        │                                                 │
│                        └── Increases importance when used                │
│                                                                          │
│   CONSOLIDATION PATH                                                     │
│   ──────────────────                                                     │
│   Decay Cycle ──► [Salience Decay] ──► Update Metadata                  │
│                    │                                                     │
│                    └── Decreases importance over time                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

| Aspect | Decision |
|--------|----------|
| **Location** | Distributed—computed inline at encoding, retrieval, and consolidation |
| **Triggers** | Entry creation, entry retrieval, consolidation cycle |
| **Inputs** | Source type, user signals, access patterns, time since last access |
| **Outputs** | Salience score (0.0-1.0) stored in entry metadata |
| **Dependencies** | Depends on: Storage (metadata access). Depended on by: Retrieval (ranking), Decay (threshold decisions) |

**[Derived]** Salience is **stored with entries** rather than computed on-demand. This allows:
- Consolidation to update scores in batch
- Retrieval to use scores without recomputation
- Decay to operate on stored scores

### 2.3 Decay/Forgetting Subsystem

**[Established]** Decay runs as part of consolidation, with a **dedicated decay stage**.

*Derivation:* All three parallels show forgetting coupled with consolidation—brain decays during sleep consolidation, computers garbage collect during maintenance, decay is a consolidation concern.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DECAY PLACEMENT IN CONSOLIDATION                      │
│                                                                          │
│   Consolidation Stage (existing)                                         │
│        │                                                                 │
│        ├──► Apply Updates                                               │
│        │                                                                 │
│        ├──► [DECAY PROCESSOR]  ◄── NEW COMPONENT                        │
│        │         │                                                       │
│        │         ├── Scan entries by last_accessed                      │
│        │         ├── Apply decay to salience scores                     │
│        │         ├── Threshold check: archive or delete                 │
│        │         └── Output: decay decisions                            │
│        │                                                                 │
│        └──► Reorganize if needed                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

| Aspect | Decision |
|--------|----------|
| **Location** | Within Consolidation stage, after update application |
| **Triggers** | 1. Every consolidation cycle (primary) 2. Capacity threshold exceeded (urgent) |
| **Inputs** | Entry metadata (salience, last_accessed, access_count), capacity limits |
| **Outputs** | Decay actions: score updates, archive decisions, delete decisions |
| **Dependencies** | Depends on: Storage (entry scanning), Salience (current scores). Depended on by: Verification (checks decay results) |

**Decay Outcomes:**
1. **Score reduction** — Entry remains, salience decreases
2. **Archive** — Entry moves to archive directory, removed from active index
3. **Delete** — Entry permanently removed (only for very low salience + old)

**Protection Mechanisms:**
- User-pinned entries exempt from decay
- Entries referenced by other entries protected (dependency tracking)
- Recently accessed entries get salience boost before decay applies

### 2.4 Consolidation Triggers

**[Derived]** Multiple trigger types with different consolidation depths.

*Derivation:* Follows from established claim that consolidation exists; multiple triggers reflect different urgency levels (capacity vs. scheduled vs. explicit).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSOLIDATION TRIGGER SYSTEM                          │
│                                                                          │
│   TRIGGER                     CONSOLIDATION TYPE     DEPTH               │
│   ───────                     ──────────────────     ─────               │
│                                                                          │
│   Session End ─────────────► Full Pipeline           Complete            │
│                               Extract → Integrate →                      │
│                               Error Handle → Consolidate → Verify        │
│                                                                          │
│   Capacity Threshold ──────► Urgent Decay            Partial             │
│   (KB size > limit)          Decay only, no integration                  │
│                                                                          │
│   Time-based (cron) ───────► Maintenance Scan        Partial             │
│   (e.g., daily)              Decay + Verify + Index rebuild              │
│                                                                          │
│   User Request ────────────► On-Demand               Configurable        │
│   (explicit tool call)       User specifies scope                        │
│                                                                          │
│   Learn Tool ──────────────► Quick Capture           Minimal             │
│   (explicit learning)        Categorize + store only                     │
│                               (full integration deferred)                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

| Trigger | Scope | Timing | Pipeline Stages |
|---------|-------|--------|-----------------|
| Session End | Full | Async after session | All 4 stages + decay |
| Capacity Exceeded | KB-wide | Immediate | Decay only |
| Scheduled | KB-wide | Cron (configurable) | Decay + Verify + Reindex |
| User Request | Specified | Immediate | User-specified |
| Learn Tool | Single entry | Immediate | Categorize + Store |

### 2.5 Source/Provenance Tracking

**[Hypothesis]** Source metadata is stored as part of entry metadata, captured at encoding time.

*Rationale:* Could alternatively be stored separately or tracked through references. Choice to embed in entry metadata is a design decision for simplicity.

| Aspect | Decision |
|--------|----------|
| **Location** | Entry metadata field |
| **Captured at** | Encoding time (learn tool, consolidation integration) |
| **Fields** | source_type: user, inferred, observed; source_ref: session ID, file path; capture_time |
| **Consumed by** | Error handling (resolution priority), Retrieval (trust weighting) |

### 2.6 Confidence Metadata

**[Hypothesis]** Confidence is computed at encoding and updated during consolidation.

*Rationale:* Alternative designs could compute confidence on-demand or only at specific checkpoints. This choice favors consistency with salience tracking.

| Aspect | Decision |
|--------|----------|
| **Location** | Entry metadata field |
| **Computed at** | Encoding (initial), Error resolution (may adjust), Consolidation (corroboration) |
| **Range** | 0.0-1.0 |
| **Consumed by** | Error handling (resolution decisions), Retrieval (ranking), UI (uncertainty display) |

---

## Part 3: Complete Component Map

### 3.1 All Components with Architectural Properties

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           KAHUNA COMPONENT MAP                                            │
│                                                                                          │
│  COMPONENT              LOCATION           TRIGGERS                  I/O SUMMARY         │
│  ─────────              ────────           ────────                  ──────────         │
│                                                                                          │
│  MCP TOOLS                                                                               │
│  ─────────                                                                               │
│  kahuna_learn           MCP Server         User invocation           IN: content         │
│                                                                      OUT: entry ID       │
│                                                                                          │
│  kahuna_prepare_context MCP Server         User/mode switch          IN: task, mode      │
│                                                                      OUT: context guide  │
│                                                                                          │
│  kahuna_ask             MCP Server         User query                IN: question        │
│                                                                      OUT: answer + refs  │
│                                                                                          │
│  kahuna_initialize      MCP Server         Project setup             IN: project info    │
│                                                                      OUT: config files   │
│                                                                                          │
│  ENCODING SUBSYSTEM                                                                      │
│  ──────────────────                                                                      │
│  Categorizer            Within learn tool  New content received      IN: raw content     │
│                                                                      OUT: category       │
│                                                                                          │
│  Initial Salience       Within encoding    Entry created             IN: source, signals │
│                                                                      OUT: salience score │
│                                                                                          │
│  STORAGE SUBSYSTEM                                                                       │
│  ─────────────────                                                                       │
│  KB Files               File system        Read/write operations     IN: file operations │
│                                                                      OUT: file contents  │
│                                                                                          │
│  Semantic Index         Vector store       Index operations          IN: embeddings      │
│                                                                      OUT: similarity     │
│                                                                                          │
│  Metadata Store         With KB files      Entry operations          IN: metadata ops    │
│                                                                      OUT: metadata       │
│                                                                                          │
│  RETRIEVAL SUBSYSTEM                                                                     │
│  ───────────────────                                                                     │
│  Query Processor        prepare_context    Context request           IN: task + mode     │
│                                                                      OUT: ranked entries │
│                                                                                          │
│  Relevance Ranker       Within retrieval   Query executed            IN: candidates      │
│                                                                      OUT: ranked list    │
│                                                                                          │
│  Context Writer         prepare_context    Ranking complete          IN: ranked entries  │
│                                                                      OUT: .context-guide │
│                                                                                          │
│  CONSOLIDATION SUBSYSTEM                                                                 │
│  ───────────────────────                                                                 │
│  Extraction Agent       Pipeline stage 1   Session end               IN: conv log        │
│                                                                      OUT: episodes       │
│                                                                                          │
│  Integration Agent      Pipeline stage 2   Extraction complete       IN: episodes + KB   │
│                                                                      OUT: proposals      │
│                                                                                          │
│  Consolidation Agent    Pipeline stage 3   Error handling complete   IN: valid proposals │
│                                                                      OUT: KB updates     │
│                                                                                          │
│  Verification Agent     Pipeline stage 4   Consolidation complete    IN: KB state        │
│                                                                      OUT: verify report  │
│                                                                                          │
│  ERROR HANDLING SUBSYSTEM                                                                │
│  ────────────────────────                                                                │
│  Conflict Detector      After integration  Proposals received        IN: proposals + KB  │
│                         + scheduled scan                             OUT: conflict report│
│                                                                                          │
│  Conflict Resolver      After detection    Conflicts detected        IN: conflict report │
│                                                                      OUT: resolutions    │
│                                                                                          │
│  ATTENTION SUBSYSTEM (distributed)                                                       │
│  ─────────────────────────────────                                                       │
│  Salience Computer      Multiple points    Encoding, retrieval,      IN: signals         │
│                                            consolidation             OUT: score          │
│                                                                                          │
│  DECAY SUBSYSTEM                                                                         │
│  ────────────────                                                                        │
│  Decay Processor        Within consol.     Consolidation cycle       IN: entry metadata  │
│                                            + capacity trigger        OUT: decay actions  │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Status Matrix

| Component | Defined In Architecture | Gap Status | This Document |
|-----------|------------------------|------------|---------------|
| MCP Tools | ✅ Well-defined | - | No change |
| KB Files | ✅ Well-defined | - | No change |
| Semantic Index | ✅ Well-defined | - | No change |
| Extraction Agent | ✅ Well-defined | - | No change |
| Integration Agent | ⚠️ Partial | Missing thresholds | Adds decision points |
| Consolidation Agent | ✅ Well-defined | - | Adds decay stage |
| Verification Agent | ⚠️ Partial | Missing consistency checks | Adds error checking |
| Conflict Detector | ❌ Missing | Critical gap | **NEW** |
| Conflict Resolver | ❌ Missing | Critical gap | **NEW** |
| Salience Computer | ❌ Missing | Critical gap | **NEW** (distributed) |
| Decay Processor | ❌ Missing | P1 gap | **NEW** |
| Relevance Ranker | ⚠️ Implicit | Missing algorithm | Explicit component |

---

## Part 4: Data Flow Diagram

### 4.1 Complete Information Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              KAHUNA DATA FLOW                                             │
│                                                                                          │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│   │                            ACTIVE SESSION                                         │  │
│   │                                                                                   │  │
│   │  USER INPUT ───────────────────────────────────────────────────────────────────► │  │
│   │       │                                                                          │  │
│   │       ▼                                                                          │  │
│   │  ┌─────────────┐    task+mode     ┌─────────────┐    query    ┌─────────────┐   │  │
│   │  │ COPILOT     │─────────────────▶│ RETRIEVAL   │────────────▶│ SEMANTIC    │   │  │
│   │  │ (LLM)       │                  │ SUBSYSTEM   │             │ INDEX       │   │  │
│   │  │             │◀─────────────────│             │◀────────────│             │   │  │
│   │  │             │   context guide  │             │  candidates │             │   │  │
│   │  └──────┬──────┘                  └──────┬──────┘             └──────┬──────┘   │  │
│   │         │                                │                           │          │  │
│   │         │ tool calls                     │ ranked results            │ points   │  │
│   │         ▼                                ▼                           │ into     │  │
│   │  ┌─────────────┐                  ┌─────────────┐                    │          │  │
│   │  │ MCP TOOLS   │                  │ RELEVANCE   │                    ▼          │  │
│   │  │             │                  │ RANKER      │◀──── salience ◀── KB FILES   │  │
│   │  │ learn       │                  │             │                               │  │
│   │  │ ask         │                  └─────────────┘                               │  │
│   │  │ prepare_ctx │                                                                │  │
│   │  └──────┬──────┘                                                                │  │
│   │         │                                                                        │  │
│   │         │ explicit learning                                                      │  │
│   │         ▼                                                                        │  │
│   │  ┌─────────────┐    content+category    ┌─────────────┐                         │  │
│   │  │ ENCODING    │───────────────────────▶│ STORAGE     │                         │  │
│   │  │ SUBSYSTEM   │                        │ SUBSYSTEM   │                         │  │
│   │  │             │◀───────────────────────│             │                         │  │
│   │  │ • Categorize│   entry ID + metadata  │ • KB Files  │                         │  │
│   │  │ • Salience  │                        │ • Index     │                         │  │
│   │  └─────────────┘                        │ • Metadata  │                         │  │
│   │                                         └─────────────┘                         │  │
│   │                                                                                   │  │
│   │  Meanwhile: CONVERSATION LOG accumulates ──────────────────────────────────────► │  │
│   │                                                                                   │  │
│   └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│                                     SESSION ENDS                                         │
│                                          │                                               │
│                                          ▼                                               │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│   │                         CONSOLIDATION PIPELINE                                    │  │
│   │                                                                                   │  │
│   │  CONVERSATION LOG                                                                 │  │
│   │       │                                                                          │  │
│   │       ▼                                                                          │  │
│   │  ┌─────────────┐  episodes   ┌─────────────┐  proposals  ┌─────────────┐        │  │
│   │  │ EXTRACTION  │────────────▶│ INTEGRATION │────────────▶│ ERROR       │        │  │
│   │  │ AGENT       │             │ AGENT       │             │ HANDLING    │        │  │
│   │  │             │             │             │◀────────────│             │        │  │
│   │  │ Parse log   │             │ Find related│  conflicts  │ • Detect    │        │  │
│   │  │ Classify    │             │ Propose upd │             │ • Resolve   │        │  │
│   │  └─────────────┘             └──────┬──────┘             └──────┬──────┘        │  │
│   │                                     │                           │                │  │
│   │                                     │ KB query                  │ validated     │  │
│   │                                     ▼                           │ proposals     │  │
│   │                              ┌─────────────┐                    │                │  │
│   │                              │ STORAGE     │                    │                │  │
│   │                              │ SUBSYSTEM   │                    │                │  │
│   │                              │             │◀───────────────────┘                │  │
│   │                              └──────┬──────┘                                     │  │
│   │                                     │                                            │  │
│   │                                     │ current KB state                           │  │
│   │                                     ▼                                            │  │
│   │  ┌─────────────┐  KB updates ┌─────────────┐  KB state   ┌─────────────┐        │  │
│   │  │ CONSOLIDATE │────────────▶│ STORAGE     │────────────▶│ VERIFICATION│        │  │
│   │  │ AGENT       │             │ SUBSYSTEM   │             │ AGENT       │        │  │
│   │  │             │             │             │             │             │        │  │
│   │  │ • Apply     │             │             │             │ • Consistency│       │  │
│   │  │ • Decay     │             │             │             │ • Integrity  │       │  │
│   │  │ • Reorg     │             │             │             │ • Reindex    │       │  │
│   │  └─────────────┘             └─────────────┘             └─────────────┘        │  │
│   │                                                                                   │  │
│   └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│                               READY FOR NEXT SESSION                                     │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Objects and Their Flows

| Data Object | Produced By | Consumed By | Persistence |
|-------------|-------------|-------------|-------------|
| **Context Guide** | Retrieval → Context Writer | Copilot (LLM) | Session-scoped |
| **KB Entries** | Encoding, Consolidation | Retrieval, Integration | Permanent |
| **Entry Metadata** | Encoding, Salience, Decay | Retrieval, Error Handling, Decay | With entries |
| **Semantic Embeddings** | Encoding, Verification | Retrieval (search) | Index store |
| **Conversation Log** | Copilot session | Extraction Agent | Session-scoped, deleted after consolidation |
| **Episode Summaries** | Extraction Agent | Integration Agent | Pipeline-scoped |
| **Update Proposals** | Integration Agent | Error Handling | Pipeline-scoped |
| **Conflict Reports** | Conflict Detector | Conflict Resolver | Pipeline-scoped |
| **Validated Proposals** | Error Handling | Consolidation Agent | Pipeline-scoped |
| **Decay Decisions** | Decay Processor | Storage (archive/delete) | Pipeline-scoped |
| **Verification Report** | Verification Agent | Logging, alerting | Logged |

---

## Part 5: Subsystem Boundaries

### 5.1 Subsystem Definition

A **subsystem** is a cohesive group of components that:
- Share a common purpose
- Can be designed/implemented independently
- Have a defined interface contract with other subsystems
- Own their internal data structures

### 5.2 Identified Subsystems with G-Level Annotations

**[Established]** Six subsystems with distinct cognitive functions, each operating at specific G levels:

| Subsystem | Claim Strength | Derivation | G Level | Bayesian Role |
|-----------|----------------|------------|---------|---------------|
| **Encoding** | Established | All parallels show input transformation before storage | G0→G3 | Prior expansion |
| **Storage** | Established | Persistent storage is a structural invariant | G0 | Prior maintenance |
| **Retrieval** | Established | Selective retrieval is a structural invariant | G0→G3 | Likelihood computation |
| **Consolidation** | Established | Working→long-term transfer is a structural invariant | G3 | Bayesian update |
| **Error Handling** | Established | Error detection before commitment appears in all parallels | G3 | Belief revision |
| **Attention** | Established | Selective attention/priority is a structural invariant | G0 | Prior weighting |

### 5.3 Subsystem → G Level Mapping

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         KAHUNA SUBSYSTEMS AND G LEVELS                                    │
│                                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│   │ ENCODING SUBSYSTEM                                                G0 → G3         │ │
│   │                                                                                    │ │
│   │ Purpose: Transform raw input into storable entries with metadata                  │ │
│   │ G-Level: Takes raw input (G0), produces structured entries (G3)                   │ │
│   │ Bayesian: Expands P(H) with new hypotheses                                        │ │
│   │                                                                                    │ │
│   │ Components:                                                                        │ │
│   │ • Categorizer — Classifies content by type/topic                                  │ │
│   │ • Initial Salience — Computes starting importance score                           │ │
│   │ • Source Tagger — Captures provenance information                                 │ │
│   │ • Confidence Estimator — Assigns initial confidence                               │ │
│   │                                                                                    │ │
│   │ Owns: Entry creation logic, initial metadata assignment                           │ │
│   │                                                                                    │ │
│   └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│   │ STORAGE SUBSYSTEM                                                      G0         │ │
│   │                                                                                    │ │
│   │ Purpose: Persist and retrieve KB entries and their metadata                       │ │
│   │ G-Level: IS the substrate — where P(H) physically lives                           │ │
│   │ Bayesian: Maintains the prior distribution P(H)                                   │ │
│   │                                                                                    │ │
│   │ Components:                                                                        │ │
│   │ • KB File Manager — CRUD operations on markdown files                             │ │
│   │ • Semantic Index — Vector embeddings for similarity search                        │ │
│   │ • Metadata Store — Entry metadata (salience, source, confidence, timestamps)      │ │
│   │ • Archive Manager — Archived entry storage                                        │ │
│   │                                                                                    │ │
│   │ Owns: File format, index structure, metadata schema                               │ │
│   │                                                                                    │ │
│   └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│   │ RETRIEVAL SUBSYSTEM                                               G0 → G3         │ │
│   │                                                                                    │ │
│   │ Purpose: Find and rank relevant KB entries for a given context                    │ │
│   │ G-Level: Reads G0 (storage), applies G3 rules (ranking), outputs G3 (rules)       │ │
│   │ Bayesian: Computes likelihood P(E|H) — "how relevant is each entry?"              │ │
│   │                                                                                    │ │
│   │ Components:                                                                        │ │
│   │ • Query Processor — Interprets task + mode into search parameters                 │ │
│   │ • Semantic Searcher — Finds candidates via embedding similarity                   │ │
│   │ • Relevance Ranker — Combines similarity, salience, recency                       │ │
│   │ • Context Writer — Produces .context-guide.md                                     │ │
│   │ • Access Tracker — Records retrieval for salience updates                         │ │
│   │                                                                                    │ │
│   │ Owns: Ranking algorithm, context guide format, mode-specific retrieval rules      │ │
│   │                                                                                    │ │
│   └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│   │ CONSOLIDATION SUBSYSTEM                                                G3         │ │
│   │                                                                                    │ │
│   │ Purpose: Transform session experiences into durable knowledge                     │ │
│   │ G-Level: Operates at G3 — applies rules to transform experience into structure    │ │
│   │ Bayesian: Performs P(H_new) = Update(P(H_old), Evidence)                          │ │
│   │                                                                                    │ │
│   │ Components:                                                                        │ │
│   │ • Extraction Agent — Parses conversation logs into episodes                       │ │
│   │ • Integration Agent — Proposes KB updates based on episodes                       │ │
│   │ • Consolidation Agent — Applies validated updates to KB                           │ │
│   │ • Decay Processor — Reduces salience over time, archives stale entries            │ │
│   │ • Verification Agent — Checks KB consistency after updates                        │ │
│   │ • Trigger Manager — Determines when consolidation runs                            │ │
│   │                                                                                    │ │
│   │ Owns: Pipeline orchestration, decay logic, verification rules                     │ │
│   │                                                                                    │ │
│   └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│   │ ERROR HANDLING SUBSYSTEM                                               G3         │ │
│   │                                                                                    │ │
│   │ Purpose: Detect and resolve conflicts in KB                                       │ │
│   │ G-Level: Operates at G3 — applies consistency rules to detect/resolve conflicts   │ │
│   │ Bayesian: Maintains P(H) coherence — ensures no contradictory beliefs             │ │
│   │                                                                                    │ │
│   │ Components:                                                                        │ │
│   │ • Conflict Detector — Identifies contradictions and inconsistencies               │ │
│   │ • Conflict Resolver — Applies resolution strategies                               │ │
│   │ • Escalation Handler — Manages unresolvable conflicts                             │ │
│   │ • Truth Maintainer — Propagates updates to dependent entries (future)             │ │
│   │                                                                                    │ │
│   │ Owns: Conflict detection rules, resolution strategies, escalation policies        │ │
│   │                                                                                    │ │
│   └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│   │ ATTENTION SUBSYSTEM (Distributed)                                      G0         │ │
│   │                                                                                    │ │
│   │ Purpose: Compute and maintain importance/salience scores                          │ │
│   │ G-Level: Operates at G0 — provides weighting to substrate entries                 │ │
│   │ Bayesian: Weights P(H) — not all hypotheses equally important                     │ │
│   │                                                                                    │ │
│   │ Note: Not a traditional subsystem—logic is distributed across:                    │ │
│   │ • Encoding (initial salience)                                                     │ │
│   │ • Retrieval (access tracking, ranking)                                            │ │
│   │ • Consolidation (decay, boosting)                                                 │ │
│   │                                                                                    │ │
│   │ Owns: Salience computation rules (defined centrally, executed distributed)        │ │
│   │                                                                                    │ │
│   │ Relationship to Executive Function (Cognitive Computer):                          │ │
│   │ Salience INFORMS attention but is not attention itself.                           │ │
│   │ Executive Function (external) uses salience to allocate attention.                │ │
│   │                                                                                    │ │
│   └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Subsystem Responsibility Matrix

| Subsystem | Creates | Reads | Updates | Deletes |
|-----------|---------|-------|---------|---------|
| **Encoding** | Entries, initial metadata | - | - | - |
| **Storage** | Index entries | All data | All data | Entries (on request) |
| **Retrieval** | Context guide | Entries, index, metadata | Access timestamps | - |
| **Consolidation** | Episodes, proposals | Conv log, KB | Entries, metadata | Archived entries |
| **Error Handling** | Conflict reports | Proposals, KB | Entry conflicts | - |
| **Attention** | - | Metadata | Salience scores | - |

---

## Part 6: Integration Contracts

### 6.1 Contract Definition

Each subsystem interface is defined by:
- **Operation name**
- **Input schema**
- **Output schema**
- **Preconditions**
- **Postconditions**
- **Error conditions**

### 6.2 Encoding → Storage Contract

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Encoding → Storage                                             │
│                                                                          │
│ Operation: store_entry                                                   │
│                                                                          │
│ Input:                                                                   │
│   entry:                                                                 │
│     content: string          # Markdown content                          │
│     category: string         # Topic/type classification                │
│     metadata:                                                            │
│       source_type: user | inferred | observed                           │
│       source_ref: string     # Session ID or file path                  │
│       confidence: number     # 0.0-1.0                                   │
│       salience: number       # 0.0-1.0 initial importance               │
│                                                                          │
│ Output:                                                                  │
│   entry_id: string           # Unique identifier                         │
│   file_path: string          # Where entry was stored                   │
│   indexed: boolean           # Whether semantic index updated            │
│                                                                          │
│ Preconditions:                                                           │
│   - Content is valid markdown                                            │
│   - Category is recognized                                               │
│   - Metadata fields are within valid ranges                              │
│                                                                          │
│ Postconditions:                                                          │
│   - Entry exists in KB files                                             │
│   - Entry is in semantic index (if indexed=true)                         │
│   - Metadata is stored and queryable                                     │
│                                                                          │
│ Errors:                                                                  │
│   - INVALID_CONTENT: Content parsing failed                              │
│   - UNKNOWN_CATEGORY: Category not in taxonomy                           │
│   - STORAGE_FAILURE: File system error                                   │
│   - INDEX_FAILURE: Embedding/index error (entry still stored)            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Storage → Retrieval Contract

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Storage → Retrieval                                            │
│                                                                          │
│ Operation: semantic_search                                               │
│                                                                          │
│ Input:                                                                   │
│   query: string              # Natural language query                    │
│   filters:                                                               │
│     categories: string[]     # Limit to these categories                │
│     min_salience: number     # Minimum importance threshold              │
│     max_age_days: number     # Recency filter                            │
│   limit: number              # Max results                               │
│                                                                          │
│ Output:                                                                  │
│   results: Array of                                                      │
│     entry_id: string                                                     │
│     file_path: string                                                    │
│     content_preview: string  # First N chars                             │
│     similarity_score: number # 0.0-1.0                                   │
│     metadata: EntryMetadata                                              │
│                                                                          │
│ Preconditions:                                                           │
│   - Index is available                                                   │
│   - Query can be embedded                                                │
│                                                                          │
│ Postconditions:                                                          │
│   - Results ordered by similarity_score descending                       │
│   - All results match filters                                            │
│   - Result count <= limit                                                │
│                                                                          │
│ Errors:                                                                  │
│   - INDEX_UNAVAILABLE: Index not loaded                                  │
│   - EMBEDDING_FAILURE: Query embedding failed                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Integration → Error Handling Contract

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Integration → Error Handling                                   │
│                                                                          │
│ Operation: validate_proposals                                            │
│                                                                          │
│ Input:                                                                   │
│   proposals: Array of                                                    │
│     type: create | update | merge | delete                               │
│     target_entry_id: string | null   # null for create                   │
│     content: string                  # New content                       │
│     metadata: EntryMetadata                                              │
│     related_entries: string[]        # IDs of related entries            │
│                                                                          │
│ Output:                                                                  │
│   validated_proposals: Array of                                          │
│     proposal: Proposal               # Original or modified              │
│     status: valid | resolved | escalated                                 │
│     conflicts: Array of              # If any detected                   │
│       type: direct | implicit | version                                  │
│       conflicting_entry_id: string                                       │
│       description: string                                                │
│       resolution: string | null      # If resolved                       │
│                                                                          │
│ Preconditions:                                                           │
│   - Proposals reference valid entries (for update/merge/delete)          │
│   - KB is accessible for conflict checking                               │
│                                                                          │
│ Postconditions:                                                          │
│   - Each proposal has a status                                           │
│   - Escalated proposals are flagged in KB                                │
│   - Resolved proposals have resolution recorded                          │
│                                                                          │
│ Errors:                                                                  │
│   - ENTRY_NOT_FOUND: Referenced entry doesn't exist                      │
│   - KB_UNAVAILABLE: Cannot access KB for checking                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Error Handling → Consolidation Contract

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Error Handling → Consolidation                                 │
│                                                                          │
│ Operation: get_validated_proposals                                       │
│                                                                          │
│ Input:                                                                   │
│   include_escalated: boolean # Whether to include escalated items        │
│                                                                          │
│ Output:                                                                  │
│   proposals: Array of                                                    │
│     proposal: Proposal                                                   │
│     status: valid | resolved                                             │
│     resolution_applied: boolean                                          │
│                                                                          │
│ Contract:                                                                │
│   - If include_escalated=false, only valid/resolved returned             │
│   - Escalated proposals are NOT passed to consolidation                  │
│   - Consolidation can assume all returned proposals are safe             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.6 Consolidation → Storage Contract

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Consolidation → Storage                                        │
│                                                                          │
│ Operation: apply_updates                                                 │
│                                                                          │
│ Input:                                                                   │
│   updates: Array of                                                      │
│     type: create | update | merge | delete | archive                     │
│     entry_id: string | null                                              │
│     content: string | null                                               │
│     metadata_updates: Partial of EntryMetadata                           │
│                                                                          │
│ Output:                                                                  │
│   results: Array of                                                      │
│     entry_id: string                                                     │
│     type: string             # Operation performed                       │
│     success: boolean                                                     │
│     error: string | null                                                 │
│                                                                          │
│ Postconditions:                                                          │
│   - All successful operations reflected in KB                            │
│   - Index updated for affected entries                                   │
│   - Failures do not affect other operations (atomic per entry)           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.7 Retrieval → Attention Contract

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Retrieval → Attention (Access Tracking)                        │
│                                                                          │
│ Operation: record_access                                                 │
│                                                                          │
│ Input:                                                                   │
│   entry_ids: string[]        # Entries that were retrieved               │
│   context: string            # Why they were retrieved                   │
│                                                                          │
│ Output:                                                                  │
│   updated: number            # Count of entries updated                  │
│                                                                          │
│ Side Effects:                                                            │
│   - Entry.metadata.last_accessed updated                                 │
│   - Entry.metadata.access_count incremented                              │
│   - Entry.metadata.salience gets small boost                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.8 Consolidation → Attention Contract (Decay)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Consolidation → Attention (Decay)                              │
│                                                                          │
│ Operation: apply_decay                                                   │
│                                                                          │
│ Input:                                                                   │
│   scope: all | stale_only                                                │
│   stale_threshold_days: number                                           │
│                                                                          │
│ Output:                                                                  │
│   decay_results:                                                         │
│     entries_processed: number                                            │
│     scores_reduced: number                                               │
│     archived: string[]       # Entry IDs moved to archive                │
│     deleted: string[]        # Entry IDs permanently removed             │
│                                                                          │
│ Postconditions:                                                          │
│   - Salience scores updated based on decay rules                         │
│   - Entries below archive threshold moved                                │
│   - Entries below delete threshold (and in archive) removed              │
│   - Protected entries (pinned, referenced) unaffected                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 7: Subsystem Dependency Graph

### 7.1 Dependency Visualization

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        SUBSYSTEM DEPENDENCY GRAPH                                         │
│                                                                                          │
│                                                                                          │
│                              ┌─────────────┐                                             │
│                              │  ENCODING   │                                             │
│                              │             │                                             │
│                              └──────┬──────┘                                             │
│                                     │                                                    │
│                                     │ stores entries                                     │
│                                     ▼                                                    │
│   ┌─────────────┐            ┌─────────────┐            ┌─────────────┐                 │
│   │  ATTENTION  │◄──────────▶│   STORAGE   │◀──────────▶│  RETRIEVAL  │                 │
│   │ (distributed)│  metadata │             │   search   │             │                 │
│   └─────────────┘            └──────┬──────┘            └──────┬──────┘                 │
│         ▲                          │                          │                         │
│         │                          │ read/write               │ access tracking         │
│         │                          │                          │                         │
│         │                          ▼                          ▼                         │
│         │                   ┌─────────────┐            ┌─────────────┐                  │
│         │                   │   ERROR     │            │  ATTENTION  │                  │
│         │                   │  HANDLING   │            │  (boost)    │                  │
│         │                   └──────┬──────┘            └─────────────┘                  │
│         │                          │                                                    │
│         │                          │ validated proposals                                │
│         │                          ▼                                                    │
│         │                   ┌─────────────┐                                             │
│         └───────────────────│CONSOLIDATION│                                             │
│              decay          │             │                                             │
│                             └─────────────┘                                             │
│                                                                                          │
│                                                                                          │
│   LEGEND:                                                                                │
│   ───────                                                                                │
│   ──────▶  Data flow / dependency                                                        │
│   ◀──────▶ Bidirectional interaction                                                     │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Dependency Matrix

| Subsystem | Depends On | Depended On By |
|-----------|------------|----------------|
| **Encoding** | - | Storage |
| **Storage** | Encoding (entries to store) | Retrieval, Consolidation, Error Handling |
| **Retrieval** | Storage (search/read) | Copilot (via MCP) |
| **Consolidation** | Storage, Error Handling, Attention | - |
| **Error Handling** | Storage (conflict checking) | Consolidation |
| **Attention** | Storage (metadata) | Retrieval (ranking), Consolidation (decay decisions) |

### 7.3 Initialization Order

Based on dependencies, subsystems should initialize in this order:

```
1. Storage          (no dependencies)
2. Encoding         (needs Storage)
3. Attention        (needs Storage for metadata)
4. Error Handling   (needs Storage)
5. Retrieval        (needs Storage, Attention)
6. Consolidation    (needs all above)
```

### 7.4 Runtime Interactions

**During Active Session:**
```
User Request → MCP Tool → Retrieval ←→ Storage
                                   ↓
                              Attention (boost)

User Learn → MCP Tool → Encoding → Storage
```

**During Consolidation:**
```
Trigger → Extraction → Integration → Error Handling → Consolidation → Verification
              ↓              ↓              ↓              ↓              ↓
           (conv log)    (Storage)     (Storage)      (Storage)      (Storage)
                                                          ↓
                                                     Attention (decay)
```

---

## Part 8: Cognitive Computer Interfaces

This section specifies how Kahuna interfaces with other Cognitive Computer subsystems.

### 8.1 Interface Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         KAHUNA INTERFACES TO COGNITIVE COMPUTER                           │
│                                                                                          │
│                                                                                          │
│   EXECUTIVE FUNCTION (Orchestrator)                                                       │
│   ─────────────────────────────────                                                       │
│        │                                                                                 │
│        │ kahuna_prepare_context(task, mode)                                             │
│        │ "What knowledge is relevant for this task?"                                    │
│        ▼                                                                                 │
│   ╔═══════════════════════════════════════════════════════════════════════════════════╗  │
│   ║                                   KAHUNA                                           ║  │
│   ║                                                                                    ║  │
│   ║                              (Memory Subsystem)                                    ║  │
│   ║                                                                                    ║  │
│   ╚═══════════════════════════════════════════════════════════════════════════════════╝  │
│        │                                                                                 │
│        │ Context guide (ranked KB entries)                                               │
│        │ "Here are the relevant entries for your context window"                        │
│        ▼                                                                                 │
│   INFERENCE CORE (LLM)                                                                   │
│   ────────────────────                                                                   │
│        │                                                                                 │
│        │ (Session interactions, tool calls, responses)                                  │
│        │                                                                                 │
│        ▼                                                                                 │
│   ╔═══════════════════════════════════════════════════════════════════════════════════╗  │
│   ║                                   KAHUNA                                           ║  │
│   ║                                                                                    ║  │
│   ║   kahuna_learn(content)      Consolidation pipeline                                ║  │
│   ║   "Store this explicitly"     "Learn from session implicitly"                      ║  │
│   ║                                                                                    ║  │
│   ╚═══════════════════════════════════════════════════════════════════════════════════╝  │
│        ▲                                                                                 │
│        │                                                                                 │
│        │ G8+ decisions (preferences, values, evaluations)                               │
│        │ "Store my values as G3 rules"                                                  │
│        │                                                                                 │
│   HUMAN INTERFACE (G8-G11)                                                               │
│   ────────────────────────                                                               │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Executive Function → Kahuna

**Interface:** `kahuna_prepare_context`

| Aspect | Specification |
|--------|---------------|
| **Caller** | Executive Function (Orchestrator mode, or any mode switch) |
| **Trigger** | Task initiation, mode switch, context refresh |
| **Input** | Task description, current mode, optional filters |
| **Output** | Context guide (markdown) with ranked KB entries |
| **Contract** | Kahuna selects entries that maximize relevance to task |

**Flow:**
1. Executive determines task context
2. Executive calls `kahuna_prepare_context` with task + mode
3. Kahuna's Retrieval subsystem computes relevance
4. Kahuna returns context guide
5. Executive includes context guide in LLM prompt

### 8.3 Kahuna → Inference Core

**Interface:** Context Guide (prompt content)

| Aspect | Specification |
|--------|---------------|
| **Caller** | Kahuna (via MCP tool response) |
| **Delivery** | Context guide included in LLM prompt |
| **Format** | Markdown with structured sections |
| **Content** | Ranked KB entries, salience indicators, confidence markers |
| **Contract** | Provides prior (G0) for LLM's inference |

**What Kahuna provides to LLM:**
- **G0 (Substrate):** KB entries become part of LLM's working context
- **G3 (Rules):** Conventions, patterns, decisions guide LLM behavior

### 8.4 Human → Kahuna (Compression Interface)

**Mechanisms:**

| Mechanism | Human Input (G8+) | Kahuna Output (G0/G3) |
|-----------|------------------|----------------------|
| **Explicit Learning** | User calls `kahuna_learn` with preference | KB entry (G3 rule) |
| **Consolidation** | User corrections in session | Error entries, updated beliefs |
| **Mode Configuration** | User selects workflow | Mode-specific rules active |
| **Approval Gates** | User approves/rejects | Stored as decision patterns |

**Compression Examples:**

| Human Statement (G8+) | Compressed Form (G3) | Storage Location |
|----------------------|---------------------|------------------|
| "I prefer clean, simple code" | `preference: code-style: clean, simple` | KB entry |
| "Always test before committing" | `rule: workflow: test → commit` | KB entry or mode rule |
| "This project uses React" | `context: framework: react` | KB entry |
| "That approach was wrong" | `error: approach-X → approach-Y` | KB entry via consolidation |

### 8.5 Kahuna → Executive Function (Salience Feedback)

**Interface:** Salience signals in retrieved content

| Aspect | Specification |
|--------|---------------|
| **Channel** | Metadata in context guide |
| **Content** | Salience scores, confidence levels, recency |
| **Purpose** | Inform Executive's attention allocation |
| **Contract** | Higher salience = more likely to be important |

**How Executive uses salience:**
- High-salience entries prioritized in context window
- Low-confidence entries flagged for verification
- Recent entries weighted higher for active work

### 8.6 Interface Summary Table

| Interface | Direction | Protocol | Data | G Level |
|-----------|-----------|----------|------|---------|
| **Exec → Kahuna** | Request | MCP tool call | Task + mode | G4 → G0 |
| **Kahuna → LLM** | Context | Prompt content | KB entries | G0 → G1 |
| **Human → Kahuna** | Learn | MCP tool + session | Preferences, corrections | G8+ → G3 |
| **Kahuna → Exec** | Inform | Metadata | Salience, confidence | G0 → G4 |

---

## Part 9: Bayesian Framing

This section consolidates the Bayesian interpretation of Kahuna's subsystems, ensuring consistency with the Cognitive Computer architecture.

### 9.1 The Bayesian Model

**[Established]** Kahuna implements a complete Bayesian inference system where:

| Component | Bayesian Role | Subsystem |
|-----------|---------------|-----------|
| **KB** | Prior P(H) | Storage |
| **Retrieval** | Likelihood P(E\|H) | Retrieval |
| **Consolidation** | Bayesian Update | Consolidation |
| **Error Handling** | Belief Revision | Error Handling |
| **Salience** | Prior Weighting | Attention |

### 9.2 KB = Prior P(H)

**[Established]** The Knowledge Base IS the prior distribution.

*Derivation:* In Bayesian inference, the prior represents beliefs before observing new evidence. The KB contains accumulated beliefs about the project.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    KB AS PRIOR DISTRIBUTION                              │
│                                                                          │
│   Each KB entry is a hypothesis in P(H):                                 │
│   ────────────────────────────────────────                               │
│                                                                          │
│   Entry: "We use 2-space indentation"                                   │
│   H = "The project uses 2-space indentation"                            │
│   P(H) = confidence × salience                                          │
│                                                                          │
│   Entry: "PostgreSQL for production database"                           │
│   H = "PostgreSQL is the production database"                           │
│   P(H) = high confidence (explicit decision)                            │
│                                                                          │
│   The KB structure IS the prior structure:                               │
│   • Categories organize the hypothesis space                            │
│   • Salience weights relative importance                                │
│   • Confidence represents belief strength                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Retrieval = Likelihood P(E|H)

**[Established]** Retrieval computes the likelihood function.

*Derivation:* Likelihood asks "If hypothesis H is true, how well does it explain the evidence E?" In Kahuna, retrieval asks "If this entry is relevant, how well does it fit the current task?"

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RETRIEVAL AS LIKELIHOOD                               │
│                                                                          │
│   Query: "Implement user authentication"                                │
│   E = current task context                                              │
│                                                                          │
│   For each KB entry (hypothesis H):                                      │
│   P(E|H) = "How well does this entry explain/fit the task?"             │
│                                                                          │
│   Entry: "Use JWT for session tokens"                                   │
│   P(E|H) = HIGH (directly relevant to auth)                             │
│                                                                          │
│   Entry: "Use 2-space indentation"                                      │
│   P(E|H) = MEDIUM (general convention, applies)                         │
│                                                                          │
│   Entry: "Database migration patterns"                                  │
│   P(E|H) = LOW (not directly relevant)                                  │
│                                                                          │
│   Ranking = P(H) × P(E|H) = prior × likelihood                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.4 Consolidation = Bayesian Update

**[Established]** Consolidation performs the Bayesian update.

*Derivation:* Bayesian update computes P(H|E) = P(E|H) × P(H) / P(E). In Kahuna, consolidation updates beliefs based on session evidence.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSOLIDATION AS BAYESIAN UPDATE                      │
│                                                                          │
│   Session evidence E = conversation log                                  │
│   Prior P(H) = KB before session                                         │
│   Posterior P(H|E) = KB after consolidation                              │
│                                                                          │
│   Update types:                                                          │
│   ─────────────                                                          │
│                                                                          │
│   1. New hypothesis: P(H_new|E) added to KB                             │
│      "User taught that X is preferred"                                  │
│                                                                          │
│   2. Strengthened hypothesis: P(H|E) > P(H)                             │
│      "User confirmed X in this session"                                 │
│                                                                          │
│   3. Weakened hypothesis: P(H|E) < P(H)                                 │
│      "User contradicted X in this session"                              │
│                                                                          │
│   4. Removed hypothesis: P(H|E) ≈ 0                                     │
│      "X is definitively wrong"                                          │
│                                                                          │
│   Decay = gradual reduction of P(H) for unused hypotheses               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.5 Error Handling = Belief Revision

**[Established]** Error handling maintains coherence of the belief system.

*Derivation:* Bayesian inference assumes a coherent probability distribution. Contradictions violate this. Error handling ensures P(H) remains coherent.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING AS BELIEF REVISION                     │
│                                                                          │
│   Problem: P(A) = 0.8 AND P(not-A) = 0.5                                │
│   This violates probability axioms (should sum to 1.0)                   │
│                                                                          │
│   Conflict detection finds:                                              │
│   Entry A: "Use PostgreSQL" (confidence 0.8)                            │
│   Entry B: "Use SQLite" (confidence 0.5)                                │
│   These are contradictory hypotheses                                    │
│                                                                          │
│   Conflict resolution applies belief revision:                           │
│   • Recency: Keep more recent belief                                    │
│   • Source: Prefer user-explicit over inferred                          │
│   • Confidence: Keep higher confidence                                  │
│   • Escalate: Ask user if unresolvable                                  │
│                                                                          │
│   Result: Coherent P(H) where contradictions are resolved               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.6 Salience = Prior Weighting

**[Established]** Salience weights the prior distribution.

*Derivation:* Not all hypotheses are equally important. Salience assigns relative weights to P(H).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SALIENCE AS PRIOR WEIGHTING                           │
│                                                                          │
│   Without salience: P(H) = uniform over KB entries                      │
│   With salience: P(H) ∝ salience × content                              │
│                                                                          │
│   Entry: "Critical security requirement"                                │
│   Salience = 0.95 → High weight in P(H)                                 │
│                                                                          │
│   Entry: "Experimental pattern tried once"                              │
│   Salience = 0.3 → Low weight in P(H)                                   │
│                                                                          │
│   Salience dynamics:                                                     │
│   • Boost on access: Used knowledge becomes more salient                │
│   • Decay over time: Unused knowledge becomes less salient              │
│   • User pin: Explicitly important knowledge protected                  │
│                                                                          │
│   Result: Dynamic prior that reflects actual usage patterns             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.7 Complete Bayesian Cycle

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         KAHUNA: COMPLETE BAYESIAN CYCLE                                   │
│                                                                                          │
│                                                                                          │
│   1. PRIOR (Storage)                         4. POSTERIOR (Consolidation)                │
│   ──────────────────                         ─────────────────────────────               │
│   KB entries = P(H)                          Updated KB = P(H|E)                         │
│   Weighted by salience                       New beliefs incorporated                    │
│                                                                                          │
│           │                                           ▲                                  │
│           │                                           │                                  │
│           ▼                                           │                                  │
│                                                                                          │
│   2. LIKELIHOOD (Retrieval)                  3. EVIDENCE (Session)                       │
│   ─────────────────────────                  ─────────────────────                       │
│   P(E|H) = relevance ranking                 E = conversation, tool use                  │
│   "How well does entry fit task?"            Implicit + explicit learning                │
│                                                                                          │
│                                                                                          │
│   CYCLE TIMING:                                                                          │
│   ─────────────                                                                          │
│                                                                                          │
│   Active session:    Prior → Likelihood → (LLM inference) → Evidence accumulates        │
│   Session end:       Evidence → Consolidation → Posterior (becomes next Prior)          │
│   Next session:      Prior (updated) → Likelihood → ...                                 │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

### What This Document Establishes

1. **Kahuna's position in the Cognitive Computer** — Memory subsystem implementation operating at G0 and G3
2. **Compression operator role** — Transforms human G8+ decisions into G0/G3 structures usable by LLM
3. **Six subsystems with G-level annotations** — Each subsystem has defined G-level operation and Bayesian role
4. **Clear interfaces to Cognitive Computer** — How Kahuna connects to Executive, Inference Core, and Human Interface
5. **Complete Bayesian framing** — KB=Prior, Retrieval=Likelihood, Consolidation=Update, Error=Revision, Salience=Weighting
6. **All architectural gaps addressed** — Every gap has placement, trigger, I/O definition, and integration points
7. **Complete integration contracts** — Each subsystem interface has defined inputs, outputs, pre/postconditions
8. **Dependency graph** — Clear understanding of what depends on what

### Kahuna's Core Contribution

Kahuna completes the LLM into a learning system:

| What LLM Has | What Kahuna Adds | Result |
|--------------|------------------|--------|
| Fixed prior (weights) | Updateable prior (KB) | Can learn from experience |
| Entangled likelihood | Separable likelihood (retrieval) | Can compute relevance |
| No persistence | Persistent storage | Knowledge survives sessions |
| No salience | Salience scoring | Important things prioritized |
| No conflict handling | Error handling | Beliefs stay coherent |

### What's Deferred to Subsystem Design

| Subsystem | Deferred Questions |
|-----------|-------------------|
| **Encoding** | Categorization algorithm, encoding depth assessment |
| **Storage** | File organization rules, index implementation |
| **Retrieval** | Relevance ranking formula, mode-specific retrieval rules |
| **Consolidation** | Extraction parsing rules *(see also: Episode Schema, Conversation Log Format in [`00-common-schemas.md`](../03-subsystem/00-common-schemas.md))* |
| **Error Handling** | Conflict detection algorithm, resolution strategy selection |
| **Attention** | *(See Salience Architecture in [`00-common-schemas.md`](../03-subsystem/00-common-schemas.md))* |

**Note:** Critical cross-cutting specifications (Episode Schema, Conversation Log Format, Salience Architecture, Integration Decision Criteria) are defined in [`00-common-schemas.md`](../03-subsystem/00-common-schemas.md).

### Next Steps

1. **Subsystem Design Documents** — For each subsystem, create detailed design answering the deferred questions
2. **Interface Specification** — Formalize contracts into TypeScript interfaces
3. **Implementation Planning** — Create implementation plans for each subsystem

---

## Appendix A: Triple Parallel Verification

This section verifies each subsystem against the triple parallel framework (brain, computer, AI).

### Verification Summary

| Subsystem | Brain Analog | Computer Analog | Coherence |
|-----------|--------------|-----------------|-----------|
| **Encoding** | Sensory processing, pattern recognition | Input parsing, normalization | ✅ All parallels show transformation of raw input into processable form |
| **Storage** | Long-term memory (hippocampus, cortical storage) | Disk/database, file systems | ✅ Core structural invariant (Invariant 2: Persistent Storage) |
| **Retrieval** | Cue-based memory activation, recall | Query execution, cache lookup | ✅ Core structural invariant (Invariant 5: Selective Attention/Retrieval) |
| **Consolidation** | Sleep consolidation, schema integration | Write-commit, garbage collection | ✅ Working→long-term transfer appears in all three domains |
| **Error Handling** | Error detection, conflict monitoring (ACC) | Transaction validation, constraint checking | ✅ Pre-commit validation is universal |
| **Attention** | Attentional filtering, salience computation | Priority queues, cache eviction policies | ✅ Core structural invariant (Invariant 5: Selective Attention) |

### Detailed Verification

#### Encoding Subsystem
- **Brain:** Sensory cortices transform raw stimuli into neural representations; categorization occurs in temporal/frontal regions
- **Computer:** Input handlers parse raw data into structured formats; type systems enforce constraints
- **AI:** Must transform user input/observations into storable entries with metadata
- **Coherence:** ✅ Pattern is consistent—all systems need input transformation

#### Storage Subsystem
- **Brain:** Hippocampus for recent memories, distributed cortical storage for long-term
- **Computer:** File systems, databases, with indexing for efficient access
- **AI:** KB files with semantic index for similarity search
- **Coherence:** ✅ Persistent, addressable, organized storage is universal

#### Retrieval Subsystem
- **Brain:** Cue-triggered activation spreads through associative networks
- **Computer:** Query execution against indexes, relevance ranking
- **AI:** Semantic search with salience/recency ranking
- **Coherence:** ✅ Context-driven, filtered, ranked retrieval is universal

#### Consolidation Subsystem
- **Brain:** Sleep-dependent consolidation, schema integration, synaptic pruning
- **Computer:** Write-commit cycles, batch processing, garbage collection
- **AI:** Session-end pipeline with extraction, integration, verification
- **Coherence:** ✅ Working→long-term transfer with integration and cleanup is universal

#### Error Handling Subsystem
- **Brain:** Anterior cingulate cortex detects conflicts; resolution involves prefrontal control
- **Computer:** Transaction validation, constraint checking, rollback on error
- **AI:** Conflict detection on proposals, resolution before consolidation
- **Coherence:** ✅ Validate-before-commit pattern is universal

#### Attention Subsystem (Distributed)
- **Brain:** Distributed attention networks; salience computed by multiple regions
- **Computer:** No central priority service; caching/eviction policies distributed
- **AI:** Salience computed at encoding, retrieval, and consolidation points
- **Coherence:** ✅ Distributed attention is the natural pattern

### Flags and Concerns

**No subsystems lack clear parallels.** All six map coherently to brain, computer, and AI domains.

**One architectural note:** The Attention subsystem being "distributed" rather than a traditional subsystem is itself validated by the triple parallel—neither brain nor computer has a central attention service.

---

## Appendix B: Contract Over-specification Review

Reviewed all integration contracts for "how" vs "what" specification.

| Contract | Status | Notes |
|----------|--------|-------|
| Encoding → Storage | ✅ OK | Specifies data schema, not algorithms |
| Storage → Retrieval | ✅ OK | Specifies query interface, not ranking algorithm |
| Integration → Error Handling | ✅ OK | Specifies proposal format, not detection algorithm |
| Error Handling → Consolidation | ✅ OK | Specifies output format only |
| Consolidation → Storage | ✅ OK | Specifies update operations, not implementation |
| Retrieval → Attention | ✅ OK | Specifies effect (salience boost), not formula |
| Consolidation → Attention | ✅ OK | Specifies decay outcomes, not curve/thresholds |

**All contracts specify WHAT (inputs, outputs, pre/postconditions) not HOW (algorithms, formulas).**

---

## Changelog

- v2.1 (2026-03-08): Added reference to common schemas document
  - Linked to `00-common-schemas.md` for Episode Schema, Conversation Log Format, Salience Architecture, Integration Criteria
  - Updated Related section and Deferred Questions table
- v2.0 (2026-03-08): Aligned with Cognitive Computer Architecture v2.0 and G Theory v7.0
  - Added Part 0: Cognitive Computer Context (positioning Kahuna as Memory subsystem)
  - Added G-level annotations to all 6 subsystems (Part 5.2, 5.3)
  - Added compression operator explanation (Part 0.4)
  - Added Part 8: Cognitive Computer Interfaces
  - Added Part 9: Bayesian Framing (consolidated from static-dynamic-integration)
  - Updated Related links to reference parent documents
- v1.1 (2026-03-07): Added claim strength markers, triple parallel verification, contract review
- v1.0 (2026-03-07): Initial abstract architecture completion