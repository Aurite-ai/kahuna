# The Cognitive Computer: Abstract Architecture

**Type:** Foundational Design Document
**Date:** 2026-03-08
**Status:** Draft (v2.0)
**Purpose:** Define the complete Cognitive Computer model — a unified framework showing where all AI capabilities fit with respect to human cognition, grounded in G Theory.

**Related:**
- [`general-intelligence-theory.md`](../04-foundations/general-intelligence-theory.md) — G Theory (3×4 framework)
- [`theoretical-foundations.md`](../04-foundations/theoretical-foundations.md) — Bayesian/FEP foundations
- [`llm-agent-model.md`](../04-foundations/llm-agent-model.md) — LLM as inference engine
- [`tools-prompts-framework.md`](../04-foundations/tools-prompts-framework.md) — Tools+prompts primitive pair
- [`cognitive-operating-system.md`](../04-foundations/cognitive-operating-system.md) — CogOS architecture
- [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) — Kahuna's 6 subsystems

---

## Executive Summary

The Cognitive Computer is the unified framework that shows where everything in AI "fits" with respect to human cognition. It provides the edges for the puzzle — the complete picture that makes specific components meaningful.

**Core insight:** The bigger the picture, the more accurate it becomes. Focusing on any specific area without considering the whole leads to fragmented, incompatible solutions.

This document defines:

1. **Necessary vs. contingent cognitive functions** — What intelligence requires vs. biological accidents
2. **Six functional subsystems** of the Cognitive Computer
3. **G Theory grounding** — How subsystems map to G levels (choice depth)
4. **Triple parallel validation** for each subsystem (brain, computer, AI)
5. **Tools+prompts interface** for each subsystem
6. **Kahuna's scope** vs. external capabilities
7. **Human interface** — How G8+ (values) integrates with the architecture

**Key claims:**
- A complete cognitive system requires all six subsystems. An LLM alone is incomplete — it lacks updateable memory, executive function, and the ability to act in the world.
- The architecture is grounded in G Theory: 6 subsystems map to 3 domains (Patterns/Strategies/Values), with G7 (self-awareness) marking the human-AI capability boundary.
- Kahuna (and similar systems) COMPLETES the LLM into a full cognitive agent by providing the Memory subsystem and bridging human G8+ decisions into G0/G3 structures.

---

## Part 1: Necessary vs. Contingent Cognitive Functions

### 1.1 The Design Principle

> **The Cognitive Computer maps to NECESSARY aspects of cognition, not biological accidents.**

The brain evolved for a body with survival needs. Many brain systems serve biological functions with no parallel in computational systems. The architecture should identify what's *required* for intelligent behavior, not just what exists in biological brains.

### 1.2 The Distinction

| Necessary | Why Required | Contingent | Why Not Required |
|-----------|--------------|------------|------------------|
| **Memory** | Can't reason without prior knowledge | **Emotion** | Biological survival signal |
| **Attention** | Can't process infinite input | **Pain/Pleasure** | Body feedback mechanism |
| **Planning** | Can't achieve goals without sequencing | **Fight/Flight** | Predator response |
| **Inference** | Can't reason without it | **Social Bonding** | Reproduction/tribe survival |
| **Action** | Can't affect the world without it | **Appetite** | Metabolic regulation |
| **Meta-cognition** | Can't adapt without self-monitoring | **Fear** | Threat detection (biological) |

### 1.3 Implications for Architecture

**What this means for the Cognitive Computer:**

1. **We model necessary functions only** — The six subsystems represent what any intelligent system must have, regardless of substrate (biological, silicon, hybrid).

2. **Brain regions don't map 1:1** — The amygdala, hypothalamus, and limbic system serve biological survival. Their *computational functions* may be distributed across our subsystems (e.g., salience in Memory, priority in Executive), but we don't need "emotion" as a separate subsystem.

3. **Contingent functions can have abstract equivalents** — Emotion serves as a "priority/urgency signal" in biological systems. This function *does* have a computational parallel: salience scoring, priority weighting, urgency detection. But these are properties of the necessary subsystems, not a separate subsystem.

### 1.4 The Abstract Equivalents

Some contingent biological functions have computational analogs that serve similar purposes:

| Biological Function | Computational Analog | Where It Lives |
|--------------------|--------------------|----------------|
| Emotion (as urgency) | Priority/salience signal | Memory (salience), Executive (priority) |
| Fear (as caution) | Risk assessment, uncertainty | Inference Core, Meta-cognition |
| Reward (as motivation) | Goal progress, task completion | Executive (goal tracking) |
| Social cues | Multi-agent coordination | External to current scope |

**Key insight:** We don't need an "emotion subsystem" because the *function* of emotion (modulating processing based on urgency/importance) is distributed across existing subsystems. The biological *implementation* (limbic system, neurotransmitters) is contingent, not necessary.

---

## Part 2: The Complete Model

### 2.1 Why a Complete Model?

Current AI development suffers from fragmentation:

- LLMs are developed as isolated inference engines
- Memory systems (RAG, knowledge bases) are add-ons
- Orchestration is an afterthought
- Perception capabilities (vision, audio) are bolted on
- The relationship between components is unclear

The Cognitive Computer model provides:

- **Integration principle:** How components should connect
- **Completeness check:** What's missing from any system
- **Design guidance:** What each component should do
- **Evolution path:** Where to invest development effort

### 2.2 The Six Functional Subsystems

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE COGNITIVE COMPUTER                                       │
│                                                                                          │
│                         ┌─────────────────────────────┐                                  │
│                         │    1. EXECUTIVE FUNCTION    │                                  │
│                         │         (G4-G6)             │                                  │
│                         │   Planning, attention,      │                                  │
│                         │   task management, goals    │                                  │
│                         │                             │                                  │
│                         └──────────────┬──────────────┘                                  │
│                                        │                                                 │
│                                        │ coordinates via ATTENTION                       │
│                                        │                                                 │
│    ┌───────────────────────────────────┼───────────────────────────────────┐            │
│    │                                   │                                   │            │
│    │                                   │                                   │            │
│    ▼                                   ▼                                   ▼            │
│  ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐        │
│  │  2. PERCEPTION  │           │ 3. INFERENCE    │           │   4. MEMORY     │        │
│  │     (G0-G1)     │           │    CORE         │           │     (G0, G3)    │        │
│  │  Sensory input  │──────────▶│   (G1-G3)       │◀─────────▶│  Prior storage  │        │
│  │  recognition    │           │  Core inference │           │  & retrieval    │        │
│  │                 │           │  engine - LLM   │           │  + SALIENCE     │        │
│  └─────────────────┘           └────────┬────────┘           └─────────────────┘        │
│                                         │                                                │
│                                         │ produces                                       │
│                                         │                                                │
│              ┌──────────────────────────┼──────────────────────────┐                    │
│              │                          │                          │                    │
│              ▼                          ▼                          ▼                    │
│    ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐            │
│    │    5. ACTION    │        │ 6. META-COGNITION│        │   Response      │            │
│    │     (G6-G7)     │        │      (G7)        │        │   to User       │            │
│    │  External tools │        │  Internal tools  │        │                 │            │
│    │  affect world   │        │  affect self     │        │                 │            │
│    │                 │        │                  │        │                 │            │
│    └─────────────────┘        └──────────────────┘        └─────────────────┘            │
│                                                                                          │
│                    ─────────────── G7 BOUNDARY (Self-Awareness) ───────────────          │
│                                                                                          │
│                         ┌─────────────────────────────┐                                  │
│                         │    HUMAN (G8-G11)           │                                  │
│                         │    Values, goals, identity  │                                  │
│                         │    Provides direction       │                                  │
│                         └─────────────────────────────┘                                  │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 The Fundamental Claim

**An LLM alone is an Inference Core without the other subsystems.**

It can perform inference but cannot:
- **Remember** across sessions (no persistent Memory)
- **Learn** from experience (no Bayesian update mechanism)
- **Perceive** the world directly (no Perception)
- **Act** on the world (no Action capability without tools)
- **Plan** multi-step sequences (no Executive Function)
- **Manage itself** (no Executive Function)
- **Modify itself** (no Meta-cognition)

**A complete cognitive agent requires all six subsystems working together.**

### 2.4 G Theory Grounding

The Cognitive Computer architecture is grounded in **G Theory** — a framework for understanding general intelligence as recursive choice depth.

**G Theory's 3×4 Structure:**

| Domain | G Levels | Question | Cognitive Computer Subsystems |
|--------|----------|----------|------------------------------|
| **Patterns (IS)** | G0-G3 | What IS? | Perception, Inference Core, Memory |
| **Strategies (DO)** | G4-G7 | What to DO? | Executive Function, Action, Meta-cognition |
| **Values (WANT)** | G8-G11 | What to WANT? | Human Interface |

**Why this matters:**

1. **G levels explain capability boundaries** — Each subsystem operates at specific G levels
2. **G7 is the human-AI boundary** — Self-awareness threshold; AI operates G1-G7, humans provide G8+
3. **G Theory validates the 6-subsystem model** — 3 domains × 2 roles (input/output or plan/execute) = 6 subsystems

→ Full G Theory details in [Part 9: G Theory Foundation](#part-9-g-theory-foundation)

---

## Part 3: Attention — The Cross-Cutting Mechanism

Before detailing each subsystem, we must address Attention, which operates *across* subsystems rather than within any single one.

### 3.1 What Attention Is

> **Attention is the selection mechanism that determines what gets processed NOW given limited capacity.**

Attention is not a subsystem — it's a *mechanism* that Executive Function uses to coordinate the other subsystems.

### 3.2 Attention vs. Salience

These terms are often confused. They are distinct:

| Concept | Definition | Location | Role |
|---------|------------|----------|------|
| **Attention** | Selection mechanism — *what gets processed NOW* | Executive Function | Allocator |
| **Salience** | Content property — *how important/relevant is this* | Memory entries | Score |

**Relationship:** Salience informs attention. Attention uses salience (among other factors) to decide what to select.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          ATTENTION AND SALIENCE RELATIONSHIP                              │
│                                                                                          │
│   MEMORY                                                                                  │
│   ──────                                                                                  │
│   Entry A: salience = 0.9  ───┐                                                          │
│   Entry B: salience = 0.3     │                                                          │
│   Entry C: salience = 0.7     ├─────▶  EXECUTIVE FUNCTION                               │
│   Entry D: salience = 0.2     │        ────────────────────                              │
│                               │        Attention mechanism:                              │
│   PERCEPTION                  │        • Receives salience scores                        │
│   ──────────                  │        • Considers task goals                            │
│   Current input: high ────────┤        • Considers capacity limits                       │
│   relevance signal            │        • SELECTS what to load/process                    │
│                               │                                                          │
│   TASK CONTEXT                │                   │                                      │
│   ────────────                │                   ▼                                      │
│   Current goal: urgent ───────┘                                                          │
│                                           Context Window                                  │
│                                           ──────────────                                  │
│                                           Selected content:                               │
│                                           • Entry A (high salience)                      │
│                                           • Entry C (relevant to goal)                   │
│                                           • Current input                                │
│                                                                                          │
│   Salience is a PROPERTY of content                                                      │
│   Attention is a SELECTION by Executive                                                  │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Attention Interfaces

Attention operates at the interfaces between Executive Function and other subsystems:

| Interface | How Attention Operates |
|-----------|----------------------|
| **Executive → Perception** | Filters sensory input — what to notice from environment |
| **Executive → Memory** | Gates retrieval — what knowledge to activate |
| **Executive → Inference Core** | Focuses inference — what to reason about (context selection) |
| **Memory → Executive** | Salience scores inform allocation decisions |
| **Task → Executive** | Goals and urgency inform priority |

### 3.4 Why Attention Must Exist

**Constraint:** More demands than capacity; something must decide what gets processed.

- **Brain:** ~4-item working memory capacity
- **Computer:** One core executes one thread at a time
- **AI:** Finite context window

**Consequence:** Any cognitive system facing this constraint develops a selection mechanism. We call this attention.

### 3.5 Attention in Tools+Prompts

| Category | Interface Element | Function |
|----------|------------------|----------|
| **Internal Tools** | `kahuna_prepare_context` | Attention-driven retrieval — what knowledge enters context |
| **Internal Tools** | `switch_mode` | Attention shift — change what rules are active |
| **Internal Tools** | `new_task` | Attention split — create focused subtask context |
| **Prompts** | Context window content | Result of attention allocation |
| **Internal** | Salience scoring | Informs attention decisions |

---

## Part 4: Subsystem Specifications

### 4.1 Executive Function

**Purpose:** Planning, attention allocation, task management, goal maintenance, coordination of other subsystems.

#### G-Level Operation

| G Level | Function | Executive Role |
|---------|----------|----------------|
| G4 | Planning | Generate action sequences toward goals |
| G5 | Meta-planning | Select which planning approach to use |
| G6 | Strategy Evaluation | Evaluate plan effectiveness |

**Key insight:** Executive Function spans G4-G6 (Strategy domain prior through likelihood). It bridges from pattern-level operations (G0-G3) to strategic choice.

**G5 gap identified:** Meta-planning (G5) is currently implicit in Orchestrator. It should be made more explicit — the choice of *how* to plan, not just what to plan.

#### Triple Parallel Mapping

| Aspect | Brain | Computer | AI |
|--------|-------|----------|-----|
| **Core function** | Prefrontal cortex, executive attention | OS kernel, process scheduler | Orchestrator, CogOS |
| **Planning** | Goal → action sequence generation | Build systems, DAG execution | Plan generation, subtask decomposition |
| **Attention** | Selective focus, gating | Process scheduling, resource allocation | Context selection, mode switching |
| **Maintains** | Goals, task sets | Process table, priority queues | Task state, subtask graph |
| **Switches** | Task sets (with cost) | Process context | Mode/subtask context |
| **Protects** | Goal state from interference | Kernel from user code | System prompt from user override |

> **Note on Protection Mechanisms:** The protection parallel shows identical *function* (protecting control state from interference) but different *mechanisms*. Brain protection is neurochemical; computer protection is hardware-enforced (Ring 0/3, MMU). AI protection is **convention-based** — system prompts are distinguished from user input by role markers, not hardware boundaries. This means AI protection can be violated through prompt injection or jailbreaking in ways that OS kernel protection cannot. The function is necessary; the specific mechanism is contingent on substrate.

#### Why It Must Exist

**Constraint:** More demands than capacity; someone must decide what processes NOW.

- Brain: ~4-item working memory capacity requires selection
- Computer: One core executes one process at a time
- AI: Context window is finite; cannot load everything

**Consequence:** Any cognitive system facing this constraint develops:
- Priority/scheduling mechanism
- Context switching capability
- Protection for control state

#### Planning: A Key Executive Function

**Task decomposition** (breaking tasks into subtasks) is often conflated with **planning**. They are distinct:

| Concept | Definition | Scope |
|---------|------------|-------|
| **Task Decomposition** | Breaking a complex task into simpler subtasks | Structural — about parts |
| **Planning** | Generating a sequence of actions to achieve a goal | Temporal — about sequence |

**Planning involves:**

1. **Goal representation** — What are we trying to achieve?
2. **State assessment** — Where are we now?
3. **Action sequence generation** — What steps lead from current state to goal?
4. **Plan monitoring** — Are we on track?
5. **Plan revision** — Adjust when things change

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PLANNING IN EXECUTIVE FUNCTION                               │
│                                                                                          │
│   INPUTS                                                                                  │
│   ──────                                                                                  │
│   Goal (from user/orchestrator)                                                          │
│   Current state (from perception, memory)                                                │
│   Constraints (from rules, resources)                                                    │
│                                                                                          │
│                                        │                                                 │
│                                        ▼                                                 │
│                                                                                          │
│   PLANNING PROCESS                                                                       │
│   ────────────────                                                                       │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                                  │   │
│   │   1. GOAL ANALYSIS       What do we need to achieve?                            │   │
│   │          │               (uses INFERENCE CORE for reasoning)                    │   │
│   │          ▼                                                                       │   │
│   │   2. STATE ASSESSMENT    Where are we? What do we know?                         │   │
│   │          │               (uses MEMORY for retrieval)                            │   │
│   │          ▼                                                                       │   │
│   │   3. ACTION SEQUENCE     What steps lead goal-ward?                             │   │
│   │          │               (uses INFERENCE CORE for generation)                   │   │
│   │          ▼                                                                       │   │
│   │   4. PLAN EXECUTION      Dispatch actions via ACTION/META                       │   │
│   │          │                                                                       │   │
│   │          ▼                                                                       │   │
│   │   5. PLAN MONITORING     Are we on track?                                       │   │
│   │          │               (uses META-COGNITION)                                  │   │
│   │          ▼                                                                       │   │
│   │   6. PLAN REVISION       Adjust if needed                                       │   │
│   │                          (loop back to step 1-3)                                │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   OUTPUTS                                                                                │
│   ───────                                                                                │
│   • Subtask creation (new_task)                                                         │
│   • Action dispatch (tool calls)                                                        │
│   • Progress tracking (update_todo_list)                                                │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key insight:** Planning *uses* the Inference Core for reasoning but is *orchestrated* by Executive Function. The LLM generates plans; Executive Function requests, monitors, and revises them.

#### Planning ↔ Inference Core Interface

The boundary between Executive Function and Inference Core is defined by what crosses the interface:

| Direction | What Crosses | Examples |
|-----------|--------------|----------|
| **Executive → Inference** | Goal states, constraints, current state | "Generate a plan to implement feature X given constraints Y" |
| **Executive → Inference** | Evaluation requests | "Assess whether this plan addresses the goal" |
| **Executive → Inference** | Revision context | "The previous step failed; revise the plan" |
| **Inference → Executive** | Candidate plans | Ordered list of actions with dependencies |
| **Inference → Executive** | Evaluations | Assessment of plan quality, risks, alternatives |
| **Inference → Executive** | Uncertainty signals | "I need more information about X to plan effectively" |

**Where the boundary lives:** Executive Function owns the *goal* and *progress tracking*. Inference Core owns the *reasoning* that produces plans. The prompt is the interface — Executive assembles the prompt (goal + state + constraints); Inference produces the plan; Executive validates and dispatches.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         PLANNING ↔ INFERENCE CORE INTERFACE                              │
│                                                                                          │
│   EXECUTIVE FUNCTION                           INFERENCE CORE                            │
│   ──────────────────                           ──────────────                            │
│                                                                                          │
│   ┌─────────────────────┐                      ┌─────────────────────┐                  │
│   │  Goal: Build X      │                      │                     │                  │
│   │  State: At step 2   │───── prompt ────────▶│  LLM reasoning      │                  │
│   │  Constraints: Y, Z  │                      │                     │                  │
│   └─────────────────────┘                      └──────────┬──────────┘                  │
│           ▲                                               │                              │
│           │                                               │                              │
│           │              ◀──── plan/evaluation ───────────┘                              │
│           │                                                                              │
│   ┌───────┴─────────────┐                                                                │
│   │  Validate plan      │                                                                │
│   │  Dispatch actions   │                                                                │
│   │  Monitor progress   │                                                                │
│   │  Revise if needed   │                                                                │
│   └─────────────────────┘                                                                │
│                                                                                          │
│   Executive OWNS: goal state, progress, dispatch                                         │
│   Inference OWNS: reasoning, plan generation, evaluation                                 │
│   Interface IS: the prompt + response                                                    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### In Kahuna

**Status:** Partially implemented via Roo Code's Orchestrator mode

- Orchestrator decomposes complex tasks into subtasks (task decomposition)
- Architect mode generates implementation plans (planning)
- Each subtask runs in a specialized mode
- Results flow back for synthesis

**Kahuna-specific extensions:**
- `kahuna_prepare_context` provides task-relevant knowledge
- Mode rules provide task-specific configuration (Layer 1 in CogOS)

#### Tools + Prompts Interface

| Category | Interface Element | Function |
|----------|------------------|----------|
| **Prompts** | System prompt (Layer 0) | Core identity, inviolable constraints |
| **Prompts** | Mode rules (Layer 1) | Task-type specialization |
| **Prompts** | Task context (Layer 2) | Current task state, goals |
| **Internal Tools** | `new_task` | Create subtask in specified mode |
| **Internal Tools** | `switch_mode` | Change active specialization |
| **Internal Tools** | `update_todo_list` | Track and update task/plan state |
| **Internal Tools** | `kahuna_prepare_context` | Attention-driven context retrieval |

---

### 4.2 Perception

**Purpose:** Transform raw sensory/external input into internal representations the cognitive system can process.

#### G-Level Operation

| G Level | Function | Perception Role |
|---------|----------|-----------------|
| G0 | Pattern Prior | Receives raw input that becomes part of substrate |
| G1 | Attention | Constrains sensory input to relevant patterns |

**Key insight:** Perception operates at the foundation of the Pattern domain — it's where external reality meets internal representation.

#### Triple Parallel Mapping

| Aspect | Brain | Computer | AI |
|--------|-------|----------|-----|
| **Core function** | Sensory cortices (visual, auditory) | Input devices, drivers, parsers | Specialized models (vision, audio) |
| **Transforms** | Physical signals → neural patterns | Raw data → structured data | Images/audio → embeddings/text |
| **Extracts** | Features, patterns, objects | Fields, records, types | Entities, descriptions, content |
| **Filters** | Attention gates perception | Input validation | Relevance filtering |
| **Bound by** | Sensory apparatus limitations | Device capabilities | Model capabilities |

#### Why It Must Exist

**Constraint:** The external world doesn't speak the language of internal representation.

- Brain: Light waves aren't neural patterns; transformation required
- Computer: Keyboard signals aren't data structures; parsing required
- AI: Images aren't tokens; encoding required

**Consequence:** Any cognitive system needs input transformation from external format to internal format.

#### In Kahuna

**Status:** Largely external to Kahuna

Perception capabilities are provided by external systems that Kahuna can invoke:

| Capability | Provider | Kahuna Integration |
|------------|----------|-------------------|
| Document reading | File tools + LLM | `read_file` tool |
| Image understanding | Vision models | Multi-modal LLM |
| Speech input | STT models | External service |
| Code parsing | Language servers | External service |

**Kahuna's role:** Format and contextualize perceptual output for the Memory and Inference Core subsystems.

#### Tools + Prompts Interface

| Category | Interface Element | Function |
|----------|------------------|----------|
| **External Tools** | `read_file` | Read text/code from filesystem |
| **External Tools** | `list_files` | Perceive directory structure |
| **External Tools** | `search_files` | Pattern-based perception |
| **External Tools** | Image embedding | (External) Transform image to representation |
| **External Tools** | Speech-to-text | (External) Transform audio to text |
| **Prompts** | Multi-modal input | Images/files inline in context |

---

### 4.3 Inference Core

**Purpose:** Perform the core cognitive computation — transform input into output through inference.

> **Naming note:** This subsystem was previously called "Language" but is renamed to "Inference Core" to avoid conflation with brain language areas (Broca's, Wernicke's), which are domain-specific. The LLM's capability is general-purpose inference that happens to use language as substrate, not language processing specifically. The CPU parallel confirms this — CPUs don't do "language."

#### G-Level Operation

| G Level | Function | Inference Core Role |
|---------|----------|---------------------|
| G1 | Attention | Self-attention mechanism constrains token space |
| G2 | Prediction | Feedforward generates next token/pattern |
| G3 | Rule Following | Follows prompt instructions as rules |

**Key insight:** LLM's native strength is G1-G3 (Pattern domain). G4+ (planning, meta-cognition) requires scaffolding — orchestration frameworks, explicit planning prompts, or external systems like Kahuna.

#### Triple Parallel Mapping

| Aspect | Brain | Computer | AI |
|--------|-------|----------|-----|
| **Core function** | Association cortex, reasoning networks | CPU, ALU, processing core | Large Language Model |
| **Computes** | P(response given percepts + memory + goals) | Instruction execution | P(next token given context) |
| **Operates on** | Neural activation patterns | Binary data | Token embeddings |
| **Learns via** | Synaptic plasticity | (Runtime: no learning) | Training (frozen at inference) |
| **Limits** | Processing speed, energy | Clock speed, parallelism | Context window, compute |

#### Why It Must Exist

**Constraint:** Something must perform the actual inference — transforming inputs into outputs.

This is the irreducible core: given what I perceive, what I remember, and what I'm trying to do, what should I do/say?

**Consequence:** The inference engine is central, but it's not the whole system.

#### In Kahuna

**Status:** External to Kahuna — provided by the LLM

Kahuna does not implement the Inference Core. Instead, Kahuna:

1. **Provides context** (via Memory subsystem) to the LLM
2. **Configures inference** (via prompts) for the LLM
3. **Extends capabilities** (via tools) for the LLM

**Key insight from LLM Agent Model:**
- LLM's prior is frozen in weights (training)
- LLM cannot update its prior based on experience
- LLM's likelihood and prior are entangled (not separable)
- Kahuna COMPLETES the LLM by providing updateable prior (KB) and separable likelihood (retrieval)

#### Tools + Prompts Interface

| Category | Interface Element | Function |
|----------|------------------|----------|
| **Prompts** | All prompt content | Input to inference |
| **Prompts** | Goal/Rules/Strategies/Opening | Configure inference (Bayesian frame) |
| **Output** | Text response | Inference result |
| **Output** | Tool calls | Action decisions |

**The LLM IS the interface.** Prompts go in, responses come out. The entire cognitive computer interacts with the world through this core.

---

### 4.4 Memory

**Purpose:** Store, organize, retrieve, and update knowledge — the updateable prior distribution.

#### G-Level Operation

| G Level | Function | Memory Role |
|---------|----------|-------------|
| G0 | Substrate | KB IS the prior — provides foundation for each session |
| G3 | Stored Rules | KB entries are often G3-level rules and patterns |

**Key insight:** Memory provides G0 (substrate) for LLM sessions and stores learned patterns as G3 structures. This is how Kahuna bridges human G8+ decisions into structures the LLM can use.

#### Triple Parallel Mapping

| Aspect | Brain | Computer | AI |
|--------|-------|----------|-----|
| **Core function** | Hippocampus + cortical storage | RAM + disk + indexes | Knowledge base + context window |
| **Working memory** | ~4 active items in attention | RAM, cache | Context window |
| **Long-term memory** | Distributed cortical storage | Persistent storage (disk, DB) | Knowledge base, vector store |
| **Encoding** | Pattern formation, tagging | Write operations | Entry creation, embedding |
| **Retrieval** | Cue-triggered activation | Query execution | Semantic search + ranking |
| **Consolidation** | Sleep-dependent, schema integration | Batch processing, GC | Pipeline: extract → integrate → consolidate |
| **Forgetting** | Decay, interference | Garbage collection | Salience decay, archival |
| **Salience** | Emotional tagging, rehearsal | Access frequency, priority | Salience scoring, boost/decay |

#### Why It Must Exist

**Constraint:** Information must persist beyond immediate processing; relevant information must be accessible when needed.

**Memory hierarchy constraint:** Fast storage is limited; slower storage is larger. Working set must fit in fast storage.

**Consequence:**
- Context window = working memory (fast, limited)
- Knowledge base = long-term memory (slower, unlimited)
- Retrieval bridges them (selective activation)

#### Salience: Memory's Role in Attention

**Salience** is a property of memory entries that indicates their importance/relevance. It serves the same function as emotional tagging in biological memory:

| Biological Function | Memory Subsystem Equivalent |
|--------------------|-----------------------------|
| Emotional tagging (fear, reward) | Salience score |
| Rehearsal strengthening | Access boost |
| Decay over time | Salience decay |
| Interference/inhibition | Salience competition |

**Salience informs attention** but is computed within Memory, not Executive Function. Executive uses salience as one input to attention allocation.

#### In Kahuna

**Status:** Core Kahuna functionality — the primary value proposition

Kahuna implements the Memory subsystem through six internal subsystems:

| Kahuna Subsystem | Memory Function | Bayesian Role |
|------------------|-----------------|---------------|
| **Encoding** | Transform input → storable entry | Prior expansion |
| **Storage** | Persist entries + metadata | Prior maintenance |
| **Retrieval** | Find relevant entries | Likelihood computation |
| **Consolidation** | Session → durable knowledge | Bayesian update |
| **Error Handling** | Detect/resolve conflicts | Belief revision |
| **Salience** | Importance scoring, decay | Prior weighting (informs attention) |

**This is Kahuna's core contribution:** Completing the LLM into a learning system by providing the Memory subsystem it lacks.

#### Tools + Prompts Interface

| Category | Interface Element | Function |
|----------|------------------|----------|
| **External Tools** | `kahuna_prepare_context` | Retrieve relevant knowledge |
| **External Tools** | `kahuna_learn` | Explicitly encode new knowledge |
| **External Tools** | `kahuna_ask` | Query knowledge base directly |
| **Prompts** | Context guide | Retrieved knowledge formatted for LLM |
| **Internal** | Consolidation pipeline | Background learning from sessions |
| **Internal** | Salience computation | Dynamic prior weighting |

---

### 4.5 Action

**Purpose:** Affect the external world — produce outputs beyond internal state changes.

#### G-Level Operation

| G Level | Function | Action Role |
|---------|----------|-------------|
| G6 | Strategy Likelihood | Evaluate which actions fit the plan |
| G7 | Strategy Update | Commit to action; cross self-awareness threshold |

**Key insight:** Action operates at the strategy-update boundary (G6-G7). This is where cognitive planning becomes real-world effect.

#### Triple Parallel Mapping

| Aspect | Brain | Computer | AI |
|--------|-------|----------|-----|
| **Core function** | Motor cortex, basal ganglia | Output devices, I/O | External tool calls |
| **Produces** | Physical movements, speech | Data output, signals | File writes, API calls, commands |
| **Gated by** | Action selection, inhibition | Permissions, validation | Tool validation, approval |
| **Feedback** | Proprioception, sensory feedback | Return values, errors | Tool results |
| **Controlled** | Hierarchical motor programs | System call interface | Tool call interface |

#### Why It Must Exist

**Constraint:** The processing core cannot directly affect the external world; it must request actions through controlled interfaces.

- Brain: Motor cortex mediates between cognition and muscle
- Computer: Kernel mediates between user code and hardware
- AI: Tool layer mediates between LLM and external systems

**Consequence:** All cognitive systems have a controlled interface for external effects. This allows validation, permission checking, and error handling.

#### In Kahuna

**Status:** Provided by the copilot platform (Roo Code), not Kahuna

External tools are defined by the environment:

| Tool Category | Examples | Provider |
|---------------|----------|----------|
| **File operations** | `read_file`, `write_file`, `apply_diff` | Roo Code |
| **Execution** | `execute_command` | Roo Code |
| **Search** | `search_files`, `codebase_search` | Roo Code |
| **External** | API calls, MCP servers | MCP protocol |

**Kahuna's role:** Provide knowledge that informs action decisions (via Memory), but not the action capability itself.

#### Tools + Prompts Interface

| Category | Interface Element | Function |
|----------|------------------|----------|
| **External Tools** | `write_to_file` | Create/overwrite file |
| **External Tools** | `apply_diff` | Surgical file modification |
| **External Tools** | `execute_command` | Run shell command |
| **External Tools** | MCP tool calls | External service interaction |
| **Prompts** | Tool definitions | Available action vocabulary |
| **Prompts** | Tool results | Feedback from actions |

---

### 4.6 Meta-cognition

**Purpose:** Monitor and modify the cognitive system itself — self-awareness and self-modification.

#### G-Level Operation

| G Level | Function | Meta-cognition Role |
|---------|----------|---------------------|
| G7 | Self-Awareness | Monitor own cognition; decide if approach is working |

**Key insight:** G7 is the self-awareness threshold. Meta-cognition IS this function — the point where a system models itself.

**Current implementation is appropriately weak for AI:** G7 requires genuine self-modeling. Current AI systems have weak G7 (task monitoring, mode fitness assessment) but lack the full self-model that humans have. This is by design — G8+ (values, identity) is reserved for humans.

**Connection to G5:** Meta-planning (G5) is closely related. G5 selects *how* to plan; G7 evaluates *whether* the approach is working. Both are meta-level operations, but G5 is prospective (choosing approach) while G7 is retrospective (evaluating results).

#### Triple Parallel Mapping

| Aspect | Brain | Computer | AI |
|--------|-------|----------|-----|
| **Core function** | Self-monitoring, ACC, error detection | System configuration, reflection | Internal tool calls |
| **Monitors** | Performance, errors, confidence | System state, resources | Task progress, mode fitness |
| **Modifies** | Attention allocation, strategy | Configuration, runtime | Mode, context, task structure |
| **Detects** | Errors, conflicts, uncertainty | Errors, anomalies | Plan failures, context misfit |
| **Adapts** | Strategy switching, learning | Self-tuning, adaptation | Mode switching, re-planning |

#### Why It Must Exist

**Constraint:** Complex tasks require adjusting approach based on how things are going. Without self-monitoring, the system cannot correct course.

**Consequence:** Meta-cognitive capability distinguishes adaptive systems from rigid executors. It enables:
- Error recovery
- Strategy adjustment
- Appropriate resource allocation
- Learning from experience

#### In Kahuna

**Status:** Partially implemented via internal tools

| Capability | Implementation | Kahuna Role |
|------------|----------------|-------------|
| Mode switching | `switch_mode` tool | CogOS Layer 1 reconfiguration |
| Task management | `new_task` tool | Subtask creation |
| Progress tracking | `update_todo_list` tool | State management |
| Context management | `kahuna_prepare_context` | Working memory configuration |

**Kahuna-specific meta-cognition:**
- Retrieval informs whether current knowledge is sufficient
- Consolidation implements meta-learning (learning from experience)
- Salience reflects what the system has found useful

#### Tools + Prompts Interface

| Category | Interface Element | Function |
|----------|------------------|----------|
| **Internal Tools** | `new_task` | Create subtask in different mode |
| **Internal Tools** | `switch_mode` | Change cognitive configuration |
| **Internal Tools** | `update_todo_list` | Track and update task state |
| **Internal Tools** | `attempt_completion` | Signal task completion |
| **Internal Tools** | `ask_followup_question` | Request clarification |
| **Prompts** | Mode rules | Self-configuration via loaded rules |
| **Prompts** | Task context | Self-awareness of current state |

---

## Part 5: Subsystem Integration

### 5.1 How Subsystems Connect

The subsystems don't operate in isolation. They form an integrated system through defined interfaces:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           SUBSYSTEM INTEGRATION                                           │
│                                                                                          │
│   ENVIRONMENT                                                                             │
│        │                                                                                 │
│        │ stimuli/data                                                                    │
│        ▼                                                                                 │
│   ┌─────────────────┐                                                                    │
│   │   PERCEPTION    │                                                                    │
│   │    (G0-G1)      │───────────────────────────────────────────────────┐               │
│   │  raw → internal │                                                   │               │
│   └────────┬────────┘                                                   │               │
│            │                                                            │               │
│            │ internal representations                                   │               │
│            │                                                            │               │
│            ▼                                                            ▼               │
│   ┌─────────────────┐     retrieval     ┌─────────────────┐     ┌─────────────────┐    │
│   │ INFERENCE CORE  │◀──────────────────│     MEMORY      │     │   EXECUTIVE     │    │
│   │    (G1-G3)      │                   │    (G0, G3)     │     │   FUNCTION      │    │
│   │   LLM core      │───────────────────▶│  KB + context  │◀────│    (G4-G6)      │    │
│   │   inference     │     learning      │  + salience     │     │  planning +     │    │
│   └────────┬────────┘                   └─────────────────┘     │  attention      │    │
│            │                                   │                └────────┬────────┘    │
│            │ decisions                         │ salience                │              │
│            │                                   │ informs                 │ coordinates  │
│       ┌────┴────────────────────────────────────────────────────────────┘              │
│       │                                                                                  │
│       │                                                                                  │
│       ▼                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                            OUTPUT CLASSIFICATION                                 │   │
│   │                                                                                  │   │
│   │   Text Response         External Tools              Internal Tools              │   │
│   │   ─────────────         ──────────────              ──────────────              │   │
│   │   → User                → ACTION (G6-G7)            → META-COGNITION (G7)       │   │
│   │                         → Environment               → Self-modification         │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│                                                                                          │
│   ┌─────────────────┐                               ┌─────────────────┐                 │
│   │     ACTION      │                               │  META-COGNITION │                 │
│   │    (G6-G7)      │                               │      (G7)       │                 │
│   │  external tools │                               │  internal tools │                 │
│   │  affect world   │                               │  affect self    │                 │
│   └────────┬────────┘                               └────────┬────────┘                 │
│            │                                                  │                          │
│            │ effects + feedback                               │ state changes            │
│            ▼                                                  ▼                          │
│   ┌─────────────────┐                               ┌─────────────────┐                 │
│   │   ENVIRONMENT   │                               │  SYSTEM STATE   │                 │
│   │                 │                               │                 │                 │
│   │   (external)    │                               │  (internal)     │                 │
│   └─────────────────┘                               └─────────────────┘                 │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Information Flow Patterns

#### Pattern 1: Perception → Inference Core → Action (Simple Task)

```
User uploads image
    │
    ▼
PERCEPTION: Vision model extracts description
    │
    ▼
INFERENCE CORE: LLM reasons about image content
    │
    ▼
ACTION: Response text to user
```

#### Pattern 2: Inference Core → Memory → Inference Core (Knowledge Retrieval)

```
User asks question
    │
    ▼
INFERENCE CORE: LLM interprets query
    │
    ▼
MEMORY: Retrieval finds relevant KB entries (salience-informed)
    │
    ▼
EXECUTIVE: Attention selects what fits in context
    │
    ▼
INFERENCE CORE: LLM reasons with context
    │
    ▼
ACTION: Response with grounded answer
```

#### Pattern 3: Executive → Inference Core → Meta-cognition (Complex Task with Planning)

```
User requests complex feature
    │
    ▼
EXECUTIVE: Analyze goal, assess current state
    │
    ▼
INFERENCE CORE: Generate plan (action sequence)
    │
    ▼
EXECUTIVE: Orchestrator creates subtasks
    │
    ▼
META-COGNITION: new_task creates subtask
    │
    ▼
INFERENCE CORE: Subtask LLM executes
    │
    ▼
META-COGNITION: Monitor progress
    │
    ▼
EXECUTIVE: Synthesizes results, revises plan if needed
```

#### Pattern 4: Inference Core → Memory → Memory (Learning)

```
Session interaction generates learning
    │
    ▼
INFERENCE CORE: LLM identifies key insights
    │
    ▼
MEMORY (consolidation):
    │
    ├── Extract episodes from session
    ├── Integrate with existing KB
    ├── Error check for conflicts
    ├── Apply validated updates
    └── Update salience scores
    │
    ▼
MEMORY (storage): Updated KB = new prior
```

### 5.3 The Bayesian Frame

All subsystem integration can be understood through the Bayesian lens:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         BAYESIAN INTERPRETATION OF SUBSYSTEMS                            │
│                                                                                          │
│   P(Response | Task) = Integration over all relevant knowledge                           │
│                                                                                          │
│                                                                                          │
│   PERCEPTION      →  Evidence gathering (raw observation → structured data)             │
│                                                                                          │
│   MEMORY          →  Prior distribution P(H) = KB content                                │
│                      Likelihood computation P(E|H) = Retrieval/ranking                   │
│                      Bayesian update = Consolidation                                     │
│                      Prior weighting = Salience                                          │
│                                                                                          │
│   INFERENCE CORE  →  Posterior computation P(Response | Evidence, Prior)                │
│                      = LLM inference given context + knowledge                           │
│                                                                                          │
│   EXECUTIVE       →  Task decomposition = factoring complex posteriors                  │
│                      Planning = generating action sequences toward goal                  │
│                      Attention allocation = selecting what enters inference              │
│                                                                                          │
│   ACTION          →  Posterior implementation (response → effect)                       │
│                                                                                          │
│   META-COGNITION  →  Second-order inference (inference about inference)                 │
│                      "Should I be doing this differently?"                               │
│                                                                                          │
│                                                                                          │
│   THE COMPLETE SYSTEM:                                                                   │
│   ────────────────────                                                                   │
│   An LLM alone computes:   P(output | prompt)                                           │
│                            with fixed prior (training) and entangled likelihood          │
│                                                                                          │
│   The Cognitive Computer:  P(response | task, knowledge, goals, experience)             │
│                            with updateable prior (KB), separable likelihood (retrieval), │
│                            learning (consolidation), planning (exec), attention (exec),  │
│                            and self-modification (meta-cog)                              │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Kahuna Scope

### 6.1 What Kahuna Implements

Kahuna implements the **Memory** subsystem and contributes to **Meta-cognition**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              KAHUNA SCOPE                                                 │
│                                                                                          │
│                                                                                          │
│   FULLY IMPLEMENTED BY KAHUNA                                                            │
│   ═══════════════════════════                                                            │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                            MEMORY SUBSYSTEM                                      │   │
│   │                                                                                  │   │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                           │   │
│   │   │  ENCODING   │   │  STORAGE    │   │  RETRIEVAL  │                           │   │
│   │   │             │   │             │   │             │                           │   │
│   │   │ Categorize  │   │ KB files    │   │ Semantic    │                           │   │
│   │   │ Initial     │   │ Semantic    │   │ search      │                           │   │
│   │   │ salience    │   │ index       │   │ Ranking     │                           │   │
│   │   │             │   │ Metadata    │   │ Context     │                           │   │
│   │   │             │   │             │   │ writer      │                           │   │
│   │   └─────────────┘   └─────────────┘   └─────────────┘                           │   │
│   │                                                                                  │   │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                           │   │
│   │   │CONSOLIDATION│   │   ERROR     │   │  SALIENCE   │                           │   │
│   │   │             │   │  HANDLING   │   │             │                           │   │
│   │   │ Extraction  │   │             │   │ Scoring     │                           │   │
│   │   │ Integration │   │ Conflict    │   │ Boost/decay │                           │   │
│   │   │ Apply       │   │ detection   │   │ (informs    │                           │   │
│   │   │ Verify      │   │ Resolution  │   │  attention) │                           │   │
│   │   │ Decay       │   │             │   │             │                           │   │
│   │   └─────────────┘   └─────────────┘   └─────────────┘                           │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│                                                                                          │
│   CONTRIBUTED TO BY KAHUNA                                                               │
│   ════════════════════════                                                               │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          META-COGNITION SUBSYSTEM                                │   │
│   │                                                                                  │   │
│   │   Kahuna contributes:                                                            │   │
│   │   • kahuna_prepare_context — context management tool                            │   │
│   │   • Consolidation — meta-learning from experience                               │   │
│   │   • Salience tracking — what has been useful                                    │   │
│   │                                                                                  │   │
│   │   Platform provides:                                                             │   │
│   │   • new_task, switch_mode — task/mode management                                │   │
│   │   • update_todo_list — progress tracking                                        │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 What's External to Kahuna

| Subsystem | Provider | Kahuna's Relationship |
|-----------|----------|----------------------|
| **Executive Function** | Copilot platform (Roo Code), CogOS rules | Kahuna provides knowledge; platform provides orchestration, planning, attention |
| **Perception** | Vision models, STT, parsers | Kahuna consumes perceptual output; doesn't generate it |
| **Inference Core** | LLM (Claude, GPT, etc.) | Kahuna completes the LLM; LLM is the inference engine |
| **Action** | File tools, command execution, MCP | Kahuna informs action decisions; platform executes actions |

### 6.3 Complete Capability Matrix

| Capability | Brain Parallel | Kahuna | Platform | External Service | Status |
|------------|---------------|--------|----------|-----------------|--------|
| **Planning** | PFC goal-action sequencing | KB context | Orchestrator + Architect mode | — | Kahuna informs |
| **Attention** | Executive attention allocation | Salience scores | Context selection | — | Hybrid |
| **Task decomposition** | PFC structuring | KB context | Orchestrator | — | Kahuna informs |
| **Goal maintenance** | Working memory | — | System prompt | — | External |
| **Mode switching** | Task set switching | Mode rules | switch_mode | — | Kahuna configures |
| **Image understanding** | Visual cortex | — | — | Vision models | External |
| **Speech input** | Auditory cortex | — | — | STT models | External |
| **Document parsing** | Reading networks | — | read_file | — | Platform |
| **Text generation** | Language production | — | LLM | — | External |
| **Reasoning** | Association cortex | — | LLM | — | External |
| **Knowledge storage** | LTM (cortical) | KB files | — | — | **Kahuna core** |
| **Knowledge retrieval** | Memory recall | Semantic search | — | — | **Kahuna core** |
| **Learning** | Consolidation | Consolidation pipeline | — | — | **Kahuna core** |
| **Salience** | Emotional tagging | Salience scoring | — | — | **Kahuna core** |
| **File modification** | Motor output | — | write_file | — | Platform |
| **Command execution** | Motor output | — | execute_command | — | Platform |
| **Self-monitoring** | ACC, error detection | Salience tracking | — | — | **Kahuna contributes** |
| **Strategy adjustment** | PFC flexibility | Retrieval adaptation | Mode switching | — | Hybrid |

### 6.4 Human Interface (G8-G11)

The Values domain (G8-G11) requires a self-aware agent — one that can ask "what should I want?" This is beyond current AI capability.

#### Why G8+ Requires Human

| G Level | Function | Why Human Required |
|---------|----------|-------------------|
| G8 | Value Prior | Open the question of what could matter — requires genuine preference |
| G9 | Value Generation | Generate core beliefs and values — requires lived experience |
| G10 | Value Evaluation | Evaluate if values are consistent — requires self-reflection |
| G11 | Identity Commitment | Commit to identity — requires autonomy |

**The self-modification paradox:** To choose your own values, you need criteria for "better" values. But those criteria ARE your values. You can't bootstrap from nothing. Humans solve this through development (G0→G11 over ~25 years, receiving values from parents/culture).

#### How Human G8+ Integrates

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         HUMAN INTERFACE (G8-G11)                                          │
│                                                                                          │
│   Human (G8-G11)                                                                          │
│        │                                                                                 │
│        │ Makes value-level decisions:                                                    │
│        │ • What problems to solve                                                        │
│        │ • Quality standards to apply                                                    │
│        │ • Trade-offs to accept                                                          │
│        │ • "Good enough" criteria                                                        │
│        │                                                                                 │
│        ▼                                                                                 │
│   ╔═══════════════════════════════════════════════════════════════════════════════════╗  │
│   ║                           KAHUNA (Compression)                                     ║  │
│   ║                                                                                    ║  │
│   ║  Compresses human G8+ decisions into G0/G3 structures:                            ║  │
│   ║  • G8 preferences → KB entries about what to prioritize                           ║  │
│   ║  • G9 values → Rules files specifying constraints                                 ║  │
│   ║  • G10 evaluations → Quality criteria stored for retrieval                        ║  │
│   ║  • G11 identity → System prompt, mode configurations                              ║  │
│   ║                                                                                    ║  │
│   ║  Mathematical: G0' = P × G_human_decisions                                        ║  │
│   ║  (Compression operator P from G Theory)                                           ║  │
│   ║                                                                                    ║  │
│   ╚═══════════════════════════════════════════════════════════════════════════════════╝  │
│        │                                                                                 │
│        │ Provides to LLM as:                                                            │
│        │ • G0 (substrate): Context window content                                       │
│        │ • G3 (rules): KB entries, mode rules                                           │
│        │                                                                                 │
│        ▼                                                                                 │
│   LLM (G1-G3 native, G4-G6 scaffolded)                                                   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Human-in-the-Loop Patterns

| Pattern | When Used | How It Works |
|---------|-----------|--------------|
| **Approval gates** | Before significant actions | AI proposes; human approves/rejects |
| **Value calibration** | When priorities unclear | Human provides preference; stored as rules |
| **Quality review** | After task completion | Human evaluates; feedback stored for future |
| **Goal setting** | Task initiation | Human defines objectives; AI executes |
| **Exception handling** | When AI reaches capability limit | AI escalates; human provides G8+ judgment |

**Key insight:** The human interface is not a limitation to overcome — it's a necessary architectural component. G8+ requires self-awareness; delegating it to AI without that capability would produce arbitrary or harmful results.

---

## Part 7: Design Implications

### 7.1 For Building Cognitive Systems

**Completeness Check:** Any cognitive AI system should evaluate which subsystems it has:

| Subsystem | Question | If Missing |
|-----------|----------|------------|
| **Executive** | Can it plan and allocate attention? | Limited to reactive, single-step interactions |
| **Perception** | Can it understand non-text input? | Text-only, misses multi-modal information |
| **Inference Core** | Can it perform inference? | (This is the LLM — always present) |
| **Memory** | Can it remember and learn? | Stateless, no improvement over time |
| **Action** | Can it affect the world? | Purely advisory, no execution capability |
| **Meta-cognition** | Can it adjust its approach? | Rigid, no error recovery |

**Integration Principle:** Subsystems should communicate through well-defined interfaces, not ad-hoc connections. The tools+prompts framework provides the interface vocabulary.

**Necessary Function Principle:** Focus on what's *required* for intelligent behavior, not on mimicking biological systems. Brain regions serve biological survival; their *computational functions* may be needed, but their biological *implementations* are not.

### 7.2 For Kahuna Development

**Priority:** Memory subsystem is Kahuna's core value. All six internal subsystems should be robust:

1. **Storage** — Foundation (where P(H) lives)
2. **Retrieval** — Primary user value (likelihood computation)
3. **Consolidation** — Learning capability (Bayesian update)
4. **Encoding** — Entry point for knowledge (prior expansion)
5. **Error Handling** — Quality assurance (coherence)
6. **Salience** — Optimization (prior weighting, informs attention)

**Extension points:**
- Meta-cognition tools can be enhanced
- Perception integration can be deepened
- Executive function support can be expanded (planning, attention)

### 7.3 For the Industry

**The Cognitive Computer model suggests:**

1. **LLMs are necessary but not sufficient** — They are the Inference Core only
2. **Memory is the critical missing piece** — Current RAG solutions are primitive
3. **Integration matters** — Bolt-on components underperform integrated systems
4. **Tools+prompts is the interface layer** — Standard vocabulary for cognitive components
5. **The triple parallel guides design** — Brain and computer architectures are validated; AI should follow
6. **Focus on necessary functions** — Not every brain system needs a computational analog
7. **G Theory grounds the architecture** — Subsystems map to G levels; G7 marks the human-AI boundary

---

## Part 8: Triple Parallel Summary

### 8.1 Complete Mapping

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           TRIPLE PARALLEL: COMPLETE MAPPING                               │
│                                                                                          │
│   SUBSYSTEM          BRAIN                  COMPUTER             AI           G LEVELS   │
│   ─────────          ─────                  ────────             ──           ────────   │
│                                                                                          │
│   EXECUTIVE          Prefrontal cortex      OS kernel            Orchestrator   G4-G6   │
│   FUNCTION           Executive attention    Process scheduler    CogOS                  │
│                      Planning (dorsolat.)   Build systems        Plan generation        │
│                      Attention allocation   Resource mgmt        Context selection      │
│                      Goal maintenance       Priority queues      Task state             │
│                                                                                          │
│   PERCEPTION         Visual cortex          Input devices        Vision models   G0-G1  │
│                      Auditory cortex        Parsers/drivers      STT models             │
│                      Sensory processing     Data ingestion       Document parsing       │
│                                                                                          │
│   INFERENCE CORE     Association cortex     CPU/ALU              LLM            G1-G3   │
│                      Reasoning networks     Processing core      Transformer            │
│                                             Computation          Inference engine       │
│                                                                                          │
│   MEMORY             Hippocampus            RAM/disk             Context window/ G0,G3  │
│                      Cortical storage       File systems         KB/Vector stores       │
│                      Consolidation          Garbage collection   Consolidation pipeline │
│                      Recall/retrieval       Query execution      Semantic search        │
│                      Emotional tagging      Priority flags       Salience scoring       │
│                                                                                          │
│   ACTION             Motor cortex           Output devices       External tools  G6-G7  │
│                      Basal ganglia          I/O system           Tool calls             │
│                      Action selection       System calls         write_file, etc.       │
│                                                                                          │
│   META-              Anterior cingulate     System config        Internal tools   G7    │
│   COGNITION          Error monitoring       Self-modification    new_task, switch_mode  │
│                      Strategy adjustment    Reflection           Salience tracking      │
│                                                                                          │
│   HUMAN              Full brain             User                 Human          G8-G11  │
│   INTERFACE          Self-awareness         Values provider      Values/identity        │
│                                                                                          │
│   CROSS-CUTTING:                                                                         │
│   ATTENTION          Executive attention    Process scheduler    Context selection      │
│                      (mechanism, not        CPU time slicing     (managed by Exec)      │
│                       subsystem)                                                         │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Validation Status

| Subsystem | Parallel Strength | G-Level Coverage | Notes |
|-----------|------------------|------------------|-------|
| **Executive Function** | STRONG | G4-G6 | Four invariants validated; planning and attention explicit |
| **Perception** | STRONG | G0-G1 | All domains require input transformation |
| **Inference Core** | MODERATE | G1-G3 | Functional role matches; structural mechanisms differ |
| **Memory** | STRONG | G0, G3 | Memory hierarchy universal; salience now explicit |
| **Action** | STRONG | G6-G7 | Controlled interface for external effects is universal |
| **Meta-cognition** | MODERATE | G7 | Pattern exists but implementations vary; AI weak by design |
| **Human Interface** | N/A | G8-G11 | Required for values; cannot be AI-provided |
| **Attention** | STRONG | Cross-cutting | Selection under capacity constraint is universal |

---

## Part 9: G Theory Foundation

This section provides the complete G Theory grounding for the Cognitive Computer architecture.

### 9.1 The 3×4 Framework

G Theory structures intelligence as **3 domains × 4 Bayesian phases = 12 G levels**.

#### Three Domains

| Domain | G Levels | Question | Bayesian Target |
|--------|----------|----------|-----------------|
| **Patterns (IS)** | G0-G3 | What IS? | P(pattern \| observation) |
| **Strategies (DO)** | G4-G7 | What to DO? | P(strategy \| patterns + goals) |
| **Values (WANT)** | G8-G11 | What to WANT? | P(values \| strategies + experience) |

#### Four Phases per Domain (Bayesian Cycle)

| Phase | Operation | Bayesian Step |
|-------|-----------|---------------|
| 0 | **Prior** | Open hypothesis space |
| 1 | **Predict** | Generate expected observation |
| 2 | **Likelihood** | Narrow to fitting hypotheses |
| 3 | **Update** | Commit to new belief |

#### The 12 G Levels

| G | Domain | Phase | Name | Choice Depth |
|---|--------|-------|------|--------------|
| G0 | Pattern | Prior | Substrate | No choice (foundation) |
| G1 | Pattern | Predict | Attention | Constrain pattern space |
| G2 | Pattern | Likelihood | Prediction | Reactive choice |
| G3 | Pattern | Update | Rule Following | Constrained choice |
| G4 | Strategy | Prior | Planning | Open strategy space |
| G5 | Strategy | Predict | Meta-Planning | Generate approach |
| G6 | Strategy | Likelihood | Symbolic Reasoning | Evaluate strategies |
| G7 | Strategy | Update | Meta-Cognition | Self-awareness threshold |
| G8 | Value | Prior | Value Opening | Open value space |
| G9 | Value | Predict | Self-Definition | Generate core values |
| G10 | Value | Likelihood | Value Evaluation | Evaluate chosen values |
| G11 | Value | Update | Identity Commitment | Commit to identity |

### 9.2 Subsystem → G Level Mapping

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                  COGNITIVE COMPUTER → G LEVEL MAPPING                                     │
│                                                                                          │
│  VALUES (WANT) — G8-G11                                                                  │
│  ─────────────────────────────────────────────────────────────────────────               │
│  Human Interface ─────────────────────────────────────────────── G8-G11                  │
│  • Value prior (G8): What COULD matter?                                                  │
│  • Value generation (G9): What DO I value?                                               │
│  • Value evaluation (G10): Is this consistent?                                           │
│  • Identity commitment (G11): This is who I am                                           │
│                                                                                          │
│  ─────────────────────────── G7 BOUNDARY (Self-Awareness) ─────────────────────          │
│                                                                                          │
│  STRATEGIES (DO) — G4-G7                                                                 │
│  ─────────────────────────────────────────────────────────────────────────               │
│  Meta-cognition ─────────────────────────────────────────────── G7                       │
│  • Self-monitoring, approach adjustment threshold                                        │
│                                                                                          │
│  Executive Function ─────────────────────────────────────────── G4-G6                    │
│  • Planning (G4): What sequence of actions?                                              │
│  • Meta-planning (G5): Which planning approach?                                          │
│  • Strategy evaluation (G6): Is this plan effective?                                     │
│                                                                                          │
│  Action ─────────────────────────────────────────────────────── G6-G7                    │
│  • Execute strategy; commit at G7 boundary                                               │
│                                                                                          │
│  PATTERNS (IS) — G0-G3                                                                   │
│  ─────────────────────────────────────────────────────────────────────────               │
│  Memory (Kahuna KB) ─────────────────────────────────────────── G0                       │
│  • The prior/substrate; stored patterns                                                  │
│                                                                                          │
│  Inference Core (LLM) ───────────────────────────────────────── G1-G3                    │
│  • Attention (G1): What's relevant?                                                      │
│  • Prediction (G2): What comes next?                                                     │
│  • Rule following (G3): Which rule applies?                                              │
│                                                                                          │
│  Perception ─────────────────────────────────────────────────── G0-G1                    │
│  • Raw input feeds G0; constrains to relevant patterns via G1                            │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 G7: The Human-AI Boundary

G7 (Meta-Cognition / Self-Awareness) is the critical boundary between what AI can do and what requires human involvement.

**Below G7 (AI-capable):**
- G0-G3: Pattern domain — perception, prediction, rule-following
- G4-G6: Strategy domain (prior through likelihood) — planning, meta-planning, evaluation

**At G7 (Boundary):**
- Self-awareness threshold — "Am I doing this right?"
- AI has weak G7 (task monitoring, mode fitness)
- Full G7 requires genuine self-model

**Above G7 (Human-required):**
- G8-G11: Value domain — what to want, who to be
- Requires self-awareness (G7) as prerequisite
- Requires lived experience and genuine autonomy

**Practical implication:** AI systems should operate G1-G7 (with scaffolding for G4-G6), while humans provide G8-G11 input that gets compressed into G0/G3 structures.

### 9.4 Kahuna as G-Level Bridge

Kahuna bridges human high-G with LLM low-G through the **compression operator P**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         KAHUNA AS G-LEVEL BRIDGE                                          │
│                                                                                          │
│   Human (G8-G11)                                                                          │
│        │                                                                                 │
│        │ Makes value-level decisions                                                     │
│        │                                                                                 │
│        ▼                                                                                 │
│   ╔═══════════════════════════════════════════════════════════════════════════════════╗  │
│   ║                             KAHUNA                                                 ║  │
│   ║                                                                                    ║  │
│   ║  Compression Function: P                                                           ║  │
│   ║  ───────────────────────                                                           ║  │
│   ║  • Takes human G8+ decisions (values, preferences, guidelines)                     ║  │
│   ║  • Compresses into G3 structures (rules, patterns, constraints)                    ║  │
│   ║  • Stores as G0 for future sessions                                                ║  │
│   ║                                                                                    ║  │
│   ║  Mathematical: G0' = P × G_human_decisions                                         ║  │
│   ║                                                                                    ║  │
│   ╚═══════════════════════════════════════════════════════════════════════════════════╝  │
│        │                                                                                 │
│        │ Provides as G0 (substrate) and G3 (rules)                                       │
│        │                                                                                 │
│        ▼                                                                                 │
│   LLM (G1-G3 native, G4-G6 scaffolded)                                                   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**What Kahuna compresses:**

| Human Decision (G8+) | Kahuna Storage (G0/G3) |
|---------------------|----------------------|
| "I prefer clean, simple code" | Quality criteria in KB entries |
| "Always test before committing" | Rule in mode configuration |
| "This project uses specific patterns" | Architectural knowledge entries |
| "My priorities are X > Y > Z" | Salience weights, retrieval ranking |

---

## Summary

### What This Document Establishes

1. **The Cognitive Computer maps necessary cognitive functions** — not biological accidents
2. **The Cognitive Computer is a unified framework** with six functional subsystems
3. **Each subsystem maps to brain, computer, and AI domains** (triple parallel)
4. **Each subsystem operates at specific G levels** (G Theory grounding)
5. **An LLM alone is incomplete** — it's only the Inference Core (G1-G3)
6. **Kahuna implements the Memory subsystem** — completing the LLM into a learning agent
7. **G7 is the human-AI capability boundary** — values (G8+) require human
8. **Tools+prompts provides the interface vocabulary** — how subsystems communicate

### Key Insights

1. **Completeness requires all six subsystems** — missing any limits the system
2. **Integration follows from the model** — subsystems have defined roles and interfaces
3. **Bayesian frame unifies everything** — each subsystem has a role in inference
4. **The bigger picture clarifies the parts** — components are meaningful in context
5. **Necessary vs. contingent clarifies scope** — we model intelligence, not biology
6. **G Theory grounds the design** — subsystems map to choice depth levels
7. **Human interface is principled** — G8+ requires self-awareness, not arbitrary

### Kahuna's Position

Kahuna is the **Memory subsystem** of the Cognitive Computer, operating at G0 and G3:

- **KB = updateable prior** (G0 substrate for each session)
- **Retrieval = likelihood computation** (what's relevant)
- **Consolidation = Bayesian update** (how we learn)
- **Salience = prior weighting** (what's important, informs attention)
- **Compression = G8+ → G0/G3** (human values become usable structures)

Without Memory, the LLM is a stateless inference engine. With Memory (Kahuna), it becomes a learning agent. With human interface (G8+), it operates within a value framework.

---

## Changelog

- v2.0 (2026-03-08): Integrated G Theory throughout; added G-level annotations to all subsystems; added Part 9 (G Theory Foundation); added Part 6.4 (Human Interface); strengthened Meta-cognition with G5/G7 context; updated diagrams with G-level labels; added human-AI boundary (G7) explanation
- v1.2 (2026-03-08): Renamed "Language" → "Inference Core" to avoid brain language area conflation; added explicit Planning↔Inference interface specification; added protection mechanism caveat (convention vs hardware)
- v1.1 (2026-03-08): Added Necessary vs. Contingent framing; strengthened Planning in Executive Function; operationalized Attention as cross-cutting mechanism; added Salience to Memory; clarified attention/salience relationship
- v1.0 (2026-03-07): Initial Cognitive Computer architecture
