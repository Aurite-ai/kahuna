# Kahuna Abstract Architecture

**Type:** Design Document
**Date:** 2026-03-07
**Status:** Stable
**Purpose:** Define the abstract architecture: subsystems, components, contracts, and integration points

### Claim Strength Legend

This document uses markers to indicate the epistemic status of architectural claims:

| Marker | Meaning | Implication |
|--------|---------|-------------|
| **[Established]** | Derived from triple parallel analysis or physics constraints | Structural necessity, changing requires strong justification |
| **[Derived]** | Follows logically from established claims | Dependent on parent claims, internally consistent |
| **[Hypothesis]** | Design choice that could reasonably be different | Subject to empirical validation, may change |

---

## Executive Summary

This document completes the abstract architecture for Kahuna by answering **where**, **what**, **when**, and **how components connect**—without specifying **how** each component works internally. The goal is to establish clear subsystem boundaries with defined integration contracts.

**Document Structure:**
1. Architectural vs. Subsystem Question Categorization
2. Architectural Decisions for Each Gap
3. Complete Component Map
4. Data Flow Diagram
5. Subsystem Boundaries
6. Integration Contracts
7. Subsystem Dependency Graph

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
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING PLACEMENT                          │
│                                                                      │
│   Integration Stage                                                  │
│        │                                                             │
│        │ Produces: Update Proposals                                  │
│        ▼                                                             │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                  ERROR HANDLING                              │   │
│   │                                                              │   │
│   │   ┌───────────────┐     ┌────────────────┐                  │   │
│   │   │   CONFLICT    │────▶│    CONFLICT    │                  │   │
│   │   │   DETECTOR    │     │    RESOLVER    │                  │   │
│   │   └───────────────┘     └────────────────┘                  │   │
│   │          │                      │                            │   │
│   │          ▼                      ▼                            │   │
│   │   Conflict Reports      Resolution Decisions                 │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│        │                                                             │
│        │ Produces: Validated Proposals (conflicts resolved)          │
│        ▼                                                             │
│   Consolidation Stage                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────┐
│                    SALIENCE COMPUTATION POINTS                       │
│                                                                      │
│   ENCODING PATH                                                      │
│   ─────────────                                                      │
│   New Entry ──► [Initial Salience] ──► Storage                      │
│                  │                                                   │
│                  └── Based on: source type, explicit signals         │
│                                                                      │
│   RETRIEVAL PATH                                                     │
│   ──────────────                                                     │
│   Query ──► Semantic Search ──► [Relevance + Salience Ranking]      │
│                                  │                                   │
│                                  └── Combines: similarity score +    │
│                                      stored salience + recency       │
│                                                                      │
│   ACCESS PATH                                                        │
│   ───────────                                                        │
│   Entry Retrieved ──► [Salience Boost] ──► Update Metadata          │
│                        │                                             │
│                        └── Increases importance when used            │
│                                                                      │
│   CONSOLIDATION PATH                                                 │
│   ──────────────────                                                 │
│   Decay Cycle ──► [Salience Decay] ──► Update Metadata              │
│                    │                                                 │
│                    └── Decreases importance over time                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────┐
│                    DECAY PLACEMENT IN CONSOLIDATION                  │
│                                                                      │
│   Consolidation Stage (existing)                                     │
│        │                                                             │
│        ├──► Apply Updates                                           │
│        │                                                             │
│        ├──► [DECAY PROCESSOR]  ◄── NEW COMPONENT                    │
│        │         │                                                   │
│        │         ├── Scan entries by last_accessed                  │
│        │         ├── Apply decay to salience scores                 │
│        │         ├── Threshold check: archive or delete             │
│        │         └── Output: decay decisions                        │
│        │                                                             │
│        └──► Reorganize if needed                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────┐
│                    CONSOLIDATION TRIGGER SYSTEM                      │
│                                                                      │
│   TRIGGER                     CONSOLIDATION TYPE     DEPTH           │
│   ───────                     ──────────────────     ─────           │
│                                                                      │
│   Session End ─────────────► Full Pipeline           Complete        │
│                               Extract → Integrate →                  │
│                               Error Handle → Consolidate → Verify    │
│                                                                      │
│   Capacity Threshold ──────► Urgent Decay            Partial         │
│   (KB size > limit)          Decay only, no integration              │
│                                                                      │
│   Time-based (cron) ───────► Maintenance Scan        Partial         │
│   (e.g., daily)              Decay + Verify + Index rebuild          │
│                                                                      │
│   User Request ────────────► On-Demand               Configurable    │
│   (explicit tool call)       User specifies scope                    │
│                                                                      │
│   Learn Tool ──────────────► Quick Capture           Minimal         │
│   (explicit learning)        Categorize + store only                 │
│                               (full integration deferred)            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
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

### 5.2 Identified Subsystems

**[Established]** Six subsystems with distinct cognitive functions:

| Subsystem | Claim Strength | Derivation |
|-----------|----------------|------------|
| **Encoding** | Established | All parallels show input transformation before storage |
| **Storage** | Established | Persistent storage is a structural invariant |
| **Retrieval** | Established | Selective retrieval is a structural invariant |
| **Consolidation** | Established | Working→long-term transfer is a structural invariant |
| **Error Handling** | Established | Error detection before commitment appears in all parallels |
| **Attention** | Established | Selective attention/priority is a structural invariant |

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           SUBSYSTEM BOUNDARIES                                            │
│                                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│   │ ENCODING SUBSYSTEM                                                                 │ │
│   │                                                                                    │ │
│   │ Purpose: Transform raw input into storable entries with metadata                  │ │
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
│   │ STORAGE SUBSYSTEM                                                                  │ │
│   │                                                                                    │ │
│   │ Purpose: Persist and retrieve KB entries and their metadata                       │ │
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
│   │ RETRIEVAL SUBSYSTEM                                                                │ │
│   │                                                                                    │ │
│   │ Purpose: Find and rank relevant KB entries for a given context                    │ │
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
│   │ CONSOLIDATION SUBSYSTEM                                                            │ │
│   │                                                                                    │ │
│   │ Purpose: Transform session experiences into durable knowledge                     │ │
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
│   │ ERROR HANDLING SUBSYSTEM                                                           │ │
│   │                                                                                    │ │
│   │ Purpose: Detect and resolve conflicts in KB                                       │ │
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
│   │ ATTENTION SUBSYSTEM (Distributed)                                                  │ │
│   │                                                                                    │ │
│   │ Purpose: Compute and maintain importance/salience scores                          │ │
│   │                                                                                    │ │
│   │ Note: Not a traditional subsystem—logic is distributed across:                    │ │
│   │ • Encoding (initial salience)                                                     │ │
│   │ • Retrieval (access tracking, ranking)                                            │ │
│   │ • Consolidation (decay, boosting)                                                 │ │
│   │                                                                                    │ │
│   │ Owns: Salience computation rules (defined centrally, executed distributed)        │ │
│   │                                                                                    │ │
│   └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Subsystem Responsibility Matrix

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
┌─────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Encoding → Storage                                         │
│                                                                      │
│ Operation: store_entry                                               │
│                                                                      │
│ Input:                                                               │
│   entry:                                                             │
│     content: string          # Markdown content                      │
│     category: string         # Topic/type classification            │
│     metadata:                                                        │
│       source_type: user | inferred | observed                       │
│       source_ref: string     # Session ID or file path              │
│       confidence: number     # 0.0-1.0                               │
│       salience: number       # 0.0-1.0 initial importance           │
│                                                                      │
│ Output:                                                              │
│   entry_id: string           # Unique identifier                     │
│   file_path: string          # Where entry was stored               │
│   indexed: boolean           # Whether semantic index updated        │
│                                                                      │
│ Preconditions:                                                       │
│   - Content is valid markdown                                        │
│   - Category is recognized                                           │
│   - Metadata fields are within valid ranges                          │
│                                                                      │
│ Postconditions:                                                      │
│   - Entry exists in KB files                                         │
│   - Entry is in semantic index (if indexed=true)                     │
│   - Metadata is stored and queryable                                 │
│                                                                      │
│ Errors:                                                              │
│   - INVALID_CONTENT: Content parsing failed                          │
│   - UNKNOWN_CATEGORY: Category not in taxonomy                       │
│   - STORAGE_FAILURE: File system error                               │
│   - INDEX_FAILURE: Embedding/index error (entry still stored)        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Storage → Retrieval Contract

```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Storage → Retrieval                                        │
│                                                                      │
│ Operation: semantic_search                                           │
│                                                                      │
│ Input:                                                               │
│   query: string              # Natural language query                │
│   filters:                                                           │
│     categories: string[]     # Limit to these categories            │
│     min_salience: number     # Minimum importance threshold          │
│     max_age_days: number     # Recency filter                        │
│   limit: number              # Max results                           │
│                                                                      │
│ Output:                                                              │
│   results: Array of                                                  │
│     entry_id: string                                                 │
│     file_path: string                                                │
│     content_preview: string  # First N chars                         │
│     similarity_score: number # 0.0-1.0                               │
│     metadata: EntryMetadata                                          │
│                                                                      │
│ Preconditions:                                                       │
│   - Index is available                                               │
│   - Query can be embedded                                            │
│                                                                      │
│ Postconditions:                                                      │
│   - Results ordered by similarity_score descending                   │
│   - All results match filters                                        │
│   - Result count <= limit                                            │
│                                                                      │
│ Errors:                                                              │
│   - INDEX_UNAVAILABLE: Index not loaded                              │
│   - EMBEDDING_FAILURE: Query embedding failed                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.4 Integration → Error Handling Contract

```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Integration → Error Handling                               │
│                                                                      │
│ Operation: validate_proposals                                        │
│                                                                      │
│ Input:                                                               │
│   proposals: Array of                                                │
│     type: create | update | merge | delete                           │
│     target_entry_id: string | null   # null for create               │
│     content: string                  # New content                   │
│     metadata: EntryMetadata                                          │
│     related_entries: string[]        # IDs of related entries        │
│                                                                      │
│ Output:                                                              │
│   validated_proposals: Array of                                      │
│     proposal: Proposal               # Original or modified          │
│     status: valid | resolved | escalated                             │
│     conflicts: Array of              # If any detected               │
│       type: direct | implicit | version                              │
│       conflicting_entry_id: string                                   │
│       description: string                                            │
│       resolution: string | null      # If resolved                   │
│                                                                      │
│ Preconditions:                                                       │
│   - Proposals reference valid entries (for update/merge/delete)      │
│   - KB is accessible for conflict checking                           │
│                                                                      │
│ Postconditions:                                                      │
│   - Each proposal has a status                                       │
│   - Escalated proposals are flagged in KB                            │
│   - Resolved proposals have resolution recorded                      │
│                                                                      │
│ Errors:                                                              │
│   - ENTRY_NOT_FOUND: Referenced entry doesn't exist                  │
│   - KB_UNAVAILABLE: Cannot access KB for checking                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.5 Error Handling → Consolidation Contract

```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Error Handling → Consolidation                             │
│                                                                      │
│ Operation: get_validated_proposals                                   │
│                                                                      │
│ Input:                                                               │
│   include_escalated: boolean # Whether to include escalated items    │
│                                                                      │
│ Output:                                                              │
│   proposals: Array of                                                │
│     proposal: Proposal                                               │
│     status: valid | resolved                                         │
│     resolution_applied: boolean                                      │
│                                                                      │
│ Contract:                                                            │
│   - If include_escalated=false, only valid/resolved returned         │
│   - Escalated proposals are NOT passed to consolidation              │
│   - Consolidation can assume all returned proposals are safe         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.6 Consolidation → Storage Contract

```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Consolidation → Storage                                    │
│                                                                      │
│ Operation: apply_updates                                             │
│                                                                      │
│ Input:                                                               │
│   updates: Array of                                                  │
│     type: create | update | merge | delete | archive                 │
│     entry_id: string | null                                          │
│     content: string | null                                           │
│     metadata_updates: Partial of EntryMetadata                       │
│                                                                      │
│ Output:                                                              │
│   results: Array of                                                  │
│     entry_id: string                                                 │
│     type: string             # Operation performed                   │
│     success: boolean                                                 │
│     error: string | null                                             │
│                                                                      │
│ Postconditions:                                                      │
│   - All successful operations reflected in KB                        │
│   - Index updated for affected entries                               │
│   - Failures do not affect other operations (atomic per entry)       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.7 Retrieval → Attention Contract

```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Retrieval → Attention (Access Tracking)                    │
│                                                                      │
│ Operation: record_access                                             │
│                                                                      │
│ Input:                                                               │
│   entry_ids: string[]        # Entries that were retrieved           │
│   context: string            # Why they were retrieved               │
│                                                                      │
│ Output:                                                              │
│   updated: number            # Count of entries updated              │
│                                                                      │
│ Side Effects:                                                        │
│   - Entry.metadata.last_accessed updated                             │
│   - Entry.metadata.access_count incremented                          │
│   - Entry.metadata.salience gets small boost                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.8 Consolidation → Attention Contract (Decay)

```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTRACT: Consolidation → Attention (Decay)                          │
│                                                                      │
│ Operation: apply_decay                                               │
│                                                                      │
│ Input:                                                               │
│   scope: all | stale_only                                            │
│   stale_threshold_days: number                                       │
│                                                                      │
│ Output:                                                              │
│   decay_results:                                                     │
│     entries_processed: number                                        │
│     scores_reduced: number                                           │
│     archived: string[]       # Entry IDs moved to archive            │
│     deleted: string[]        # Entry IDs permanently removed         │
│                                                                      │
│ Postconditions:                                                      │
│   - Salience scores updated based on decay rules                     │
│   - Entries below archive threshold moved                            │
│   - Entries below delete threshold (and in archive) removed          │
│   - Protected entries (pinned, referenced) unaffected                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
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

## Summary

### What This Document Establishes

1. **All gaps addressed at architectural level** — Every gap from the analysis has a placement, trigger, I/O definition, and integration points.

2. **Clear architectural vs. subsystem separation:**
   - Architectural: Where, when, what, integration
   - Subsystem: How, algorithm details, thresholds

3. **Six subsystems with clean boundaries:**
   - Encoding, Storage, Retrieval, Consolidation, Error Handling, Attention

4. **Complete integration contracts** — Each subsystem interface has defined inputs, outputs, pre/postconditions.

5. **Dependency graph** — Clear understanding of what depends on what.

### What's Deferred to Subsystem Design

| Subsystem | Deferred Questions |
|-----------|-------------------|
| **Encoding** | Categorization algorithm, encoding depth assessment |
| **Storage** | File organization rules, index implementation |
| **Retrieval** | Relevance ranking formula, mode-specific retrieval rules |
| **Consolidation** | Extraction parsing rules, integration thresholds, decay function |
| **Error Handling** | Conflict detection algorithm, resolution strategy selection |
| **Attention** | Salience computation formula, factor weights |

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

- v1.1 (2026-03-07): Added claim strength markers, triple parallel verification, contract review
- v1.0 (2026-03-07): Initial abstract architecture completion