# Cognitive Operating System Architecture

**Type:** Foundational Design Document
**Date:** 2026-03-07
**Status:** Draft
**Purpose:** Define the abstract architecture for how AI copilot systems should structure their rules and prompts, grounded in validated invariants across Operating Systems, Brain Executive Function, and AI Copilots.

**Related:**
- [`orchestrator-os-executive-function.md`](../../../docs/internal/research/orchestrator-os-executive-function.md) — Research validating the four invariants
- [`llm-agent-model.md`](llm-agent-model.md) — LLM as Bayesian inference engine
- [`static-dynamic-integration.md`](../02-architecture/static-dynamic-integration.md) — Static/dynamic system integration

---

## Executive Summary

This document defines the **Cognitive Operating System** (CogOS) — an abstract architecture for AI copilot systems that structures rules and prompts to maximize LLM performance. The architecture is grounded in four structural invariants validated across operating systems, brain executive function, and AI copilots:

1. **Privilege/Protection Hierarchy** — Control state must be protected from task processing
2. **Scheduling/Attention Allocation** — Limited capacity requires selection; switching has costs
3. **Memory Hierarchy and Working Set** — Fast storage is limited; exceeding capacity causes thrashing
4. **Controlled Interface for External Effects** — Processing core affects the world through validated interfaces

**Key insight:** These invariants exist not because of design preferences, but because of fundamental constraints — limited processing capacity, memory hierarchy costs, and resource contention. Any system facing these constraints will converge on similar architectural patterns.

---

## Part 1: The Four Invariants

### 1.1 Why Invariants Matter

Traditional copilot configuration is ad-hoc: add rules when problems arise, remove them when they cause issues, hope for the best. This produces fragile systems that work until they don't.

The CogOS approach is different: **derive architecture from constraints**. If we understand what constraints the system faces, we can derive what architecture must exist. The result is robust, principled, and predictable.

### 1.2 Invariant 1: Privilege/Protection Hierarchy

| OS | Brain | AI Copilot |
|----|-------|------------|
| Kernel vs User space | PFC top-down control vs automatic processing | System prompt vs user input |
| Ring 0 privileged instructions | Goal representations override habits | System instructions shape all responses |

**Underlying Constraint:** Untrusted/automatic processing must not corrupt control state.

**Manifestation in Copilots:**
- System-level instructions cannot be overridden by user messages
- Core behavioral constraints persist across all tasks
- Identity and fundamental capabilities are protected from modification

**Design Implication:** Copilot rules must have a **privilege hierarchy** — some instructions are more protected than others, and lower-privilege content cannot override higher-privilege content.

### 1.3 Invariant 2: Scheduling/Attention Allocation

| OS | Brain | AI Copilot |
|----|-------|------------|
| Process scheduler | Executive attention | Orchestrator/subtask creation |
| Context switching costs | Task switching costs | Prompt switching overhead |
| ~4-item capacity | ~4-item working memory | ~4K-8K meaningful tokens* |

*\*HYPOTHESIS: The mapping of ~4 working memory items to ~4K-8K token chunks is a plausible theoretical parallel, but not empirically validated. The underlying constraint (limited capacity requiring selection) is well-established; the specific quantitative mapping is speculative.*

**Underlying Constraint:** More demands than capacity; must select what processes NOW. Selection has costs.

**Manifestation in Copilots:**
- Context window is finite; cannot load everything
- Each mode switch requires rebuilding context
- Focused prompts outperform broad prompts (Prompt Specificity Principle)

**Design Implication:** Copilot rules must implement **attention allocation** — selecting what context is active, minimizing switches, and keeping working set within capacity.

### 1.4 Invariant 3: Memory Hierarchy and Working Set

| OS | Brain | AI Copilot |
|----|-------|------------|
| RAM (fast) vs Disk (slow) | Working memory vs LTM | Context window vs external storage |
| TLB caches translations | Attention caches active items | Prompt caching |
| Thrashing when working set exceeds RAM | Interference when > 4 items | Lost in middle when context overflows |

**Underlying Constraint:** Fast storage is limited; effective operation requires keeping hot data in fast storage.

**Manifestation in Copilots:**
- Context window is the "RAM" — what the LLM can actively use
- External storage (KB, files, documentation) is the "disk" — slower but unlimited
- Exceeding context capacity degrades performance (lost in middle phenomenon)

**Design Implication:** Rules must distinguish between **always-loaded** (in RAM) and **on-demand** (on disk) content. Working set must fit in context window.

### 1.5 Invariant 4: Controlled Interface for External Effects

| OS | Brain | AI Copilot |
|----|-------|------------|
| System calls | Sensory/motor interfaces | Tool calls / function calling |
| Kernel validates, checks permissions | Brain validates via error monitoring | Application validates, executes, returns |

**Underlying Constraint:** The processing core cannot directly affect the external world; it must request actions through controlled interfaces that can validate and execute.

**Manifestation in Copilots:**
- LLM cannot directly modify files, run commands, or access networks
- All external effects go through tool interfaces
- Tool layer validates requests before execution

**Design Implication:** Rules must define the **tool interface** clearly — what tools exist, when to use them, and what validation occurs.

---

## Part 2: Architectural Layers

### 2.1 The Layer Model

Based on the privilege hierarchy invariant, CogOS defines three architectural layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      COGNITIVE OPERATING SYSTEM LAYERS                   │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────────┐ │
│   │                    LAYER 0: KERNEL                                │ │
│   │                    ────────────────                                │ │
│   │   Identity • Capabilities • Fundamental Constraints                │ │
│   │                                                                    │ │
│   │   ALWAYS LOADED • HIGHEST PRIVILEGE • CANNOT BE OVERRIDDEN        │ │
│   │                                                                    │ │
│   │   Parallel: OS kernel, PFC goal maintenance                       │ │
│   └───────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│   ┌───────────────────────────────────────────────────────────────────┐ │
│   │                    LAYER 1: MODE CONTEXT                          │ │
│   │                    ─────────────────────                           │ │
│   │   Mode-specific rules • Specialized behaviors • Task patterns      │ │
│   │                                                                    │ │
│   │   LOADED PER MODE • MEDIUM PRIVILEGE • EXTENDS KERNEL             │ │
│   │                                                                    │ │
│   │   Parallel: OS drivers/modules, specialized brain regions         │ │
│   └───────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│   ┌───────────────────────────────────────────────────────────────────┐ │
│   │                    LAYER 2: TASK CONTEXT                          │ │
│   │                    ─────────────────────                           │ │
│   │   Dynamic retrieval • User context • Session state                 │ │
│   │                                                                    │ │
│   │   LOADED PER TASK • LOWEST PRIVILEGE • CONSTRAINED BY ABOVE       │ │
│   │                                                                    │ │
│   │   Parallel: User processes, working memory contents               │ │
│   └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer 0: Kernel

**What it contains:**
- Core identity (who is this copilot?)
- Fundamental capabilities (what can it do?)
- Inviolable constraints (what must never happen?)
- Communication standards (how does it interact?)
- Tool interface definitions (how does it affect the world?)

**Characteristics:**
- **Always loaded** — present in every prompt
- **Highest privilege** — cannot be overridden by lower layers
- **Minimal size** — only truly universal content
- **Stable** — changes rarely, with careful consideration

**Example content:**
```
You are Roo, an AI coding assistant.

You have access to tools that let you read/write files, execute commands,
and search codebases. You MUST use tools to verify information rather
than making assumptions.

You MUST NOT:
- Execute commands without user approval
- Modify files outside the project directory
- Make claims about file contents without reading them
```

**OS Parallel:** Like the kernel, Layer 0 defines what the system IS, not what it's currently doing. User code cannot change the kernel's fundamental behavior.

**Brain Parallel:** Like PFC goal maintenance, Layer 0 holds the persistent objectives that shape all processing.

### 2.3 Layer 1: Mode Context

**What it contains:**
- Mode-specific rules (architect mode rules, code mode rules)
- Specialized behaviors (how to plan, how to implement)
- Domain knowledge relevant to the mode
- Mode-specific tool usage patterns

**Characteristics:**
- **Loaded per mode** — only one mode active at a time
- **Medium privilege** — can extend kernel, cannot violate it
- **Moderate size** — more than kernel, less than task context
- **Mode-scoped** — applies only when mode is active

**Example content (Code mode):**
```
## Code Mode Rules

When implementing features:
1. Read relevant files before making changes
2. Write tests alongside implementation
3. Run tests after each significant change
4. Update documentation when changing public APIs

Prefer:
- Small, focused commits
- Explicit over implicit
- Composition over inheritance
```

**OS Parallel:** Like kernel modules or device drivers — specialized functionality loaded when needed, operating within kernel constraints.

**Brain Parallel:** Like specialized brain regions activated for specific task types — language areas for communication, motor regions for action planning.

> **Note on analogy strength:** The parallel "Mode rules ↔ Brain regions ↔ Kernel modules" is a *useful conceptual analogy* but weaker than the four core invariants. The mechanisms differ substantially across domains — brain regions involve neural populations, kernel modules involve code isolation, and mode rules involve prompt text. This mapping is helpful for intuition but should not be treated as a validated structural invariant.

### 2.4 Layer 2: Task Context

**What it contains:**
- Dynamically retrieved knowledge (KB entries, file contents)
- Current task description and requirements
- Session state (what's been done, what's pending)
- Tool outputs and conversation history

**Characteristics:**
- **Loaded per task** — changes frequently during session
- **Lowest privilege** — constrained by both kernel and mode
- **Variable size** — must be actively managed to fit context budget
- **Ephemeral** — may be summarized or discarded as session progresses

**Example content:**
```
## Current Task Context

Task: Implement user authentication for the API

Relevant KB entries:
- Project uses JWT tokens for authentication
- Password hashing uses bcrypt with cost factor 12
- User model is defined in src/models/user.ts

Recent tool outputs:
- [read_file src/models/user.ts]: User model has id, email, passwordHash fields
```

**OS Parallel:** Like user process memory — dynamically allocated, isolated, managed by the system.

**Brain Parallel:** Like working memory contents — the specific items currently being processed.

### 2.5 Layer Interaction Rules

**Privilege Enforcement:**
```
Layer 0 > Layer 1 > Layer 2

- Layer 1 cannot contradict Layer 0
- Layer 2 cannot contradict Layer 1 or Layer 0
- Conflicts resolve in favor of higher-privilege layer
```

**Loading Sequence:**
```
1. Load Layer 0 (always)
2. Load Layer 1 (based on active mode)
3. Load Layer 2 (based on current task)
```

**Size Constraints:**
```
Total context = Layer 0 + Layer 1 + Layer 2 + User message + Response space

Each layer has a budget allocation (see Part 4)
```

---

## Part 3: Static vs Dynamic Content

### 3.1 The Static-Dynamic Spectrum

Content in a copilot system falls on a spectrum from fully static to fully dynamic:

```
STATIC ◄─────────────────────────────────────────────────────────► DYNAMIC

Kernel rules    Mode rules    Project rules    KB entries    Tool outputs
   │               │               │               │              │
   ▼               ▼               ▼               ▼              ▼
Never change   Change rarely   Change sometimes   Task-specific   Per-request
```

### 3.2 What Goes Where

| Content Type | Layer | Static/Dynamic | Rationale |
|-------------|-------|----------------|-----------|
| Identity statement | 0 | Static | Who the copilot IS doesn't change |
| Capability list | 0 | Static | What tools exist is stable |
| Safety constraints | 0 | Static | Safety must be always-on |
| Communication style | 0 | Static | Consistent personality |
| Mode definitions | 1 | Semi-static | Modes change rarely |
| Mode-specific rules | 1 | Semi-static | Evolve with experience |
| Project conventions | 1/2 | Semi-dynamic | Project-specific, but stable within project |
| KB entries | 2 | Dynamic | Retrieved per-task |
| File contents | 2 | Dynamic | Read on demand |
| Conversation history | 2 | Dynamic | Changes every message |
| Tool outputs | 2 | Dynamic | Generated per-request |

### 3.3 The Static-Enables-Dynamic Principle

From the static-dynamic integration research:

> **Static structure enables dynamic computation. Storage IS the prior. Retrieval IS likelihood computation.**

Applied to copilot rules:

- **Static rules define the hypothesis space** — what outputs are even possible
- **Dynamic context updates beliefs within that space** — which outputs are likely given this task
- **Without static structure, dynamic content has no anchor** — the LLM doesn't know how to interpret it

**Example:**
```
Static (Layer 0): "You are a code assistant. You help with programming tasks."
Dynamic (Layer 2): "The user is working on a Python web app using Flask."

The static rule establishes the hypothesis space: coding help.
The dynamic context narrows it: Python, Flask, web apps.

Without the static rule, the Flask context is ambiguous —
is this about cooking, chemistry, or programming?
```

### 3.4 The Prompt Specificity Principle

From the cognitive methodology:

> **LLM performance scales inversely with responsibility breadth.**

This means:
- Narrow, focused prompts produce better outputs than broad, general ones
- Each layer should contain the minimum content necessary for its purpose
- Content that CAN be linked should be linked, not loaded
- Content that is rarely needed should be referenced, not included

**Application to Layers:**

| Layer | Specificity Guideline |
|-------|----------------------|
| Layer 0 | Universal to ALL tasks — if it doesn't apply everywhere, move it lower |
| Layer 1 | Specific to ONE mode — if it applies to multiple modes, move it higher or split it |
| Layer 2 | Specific to THIS task — if it applies to all tasks in mode, move it higher |

### 3.5 Static/Dynamic Guidelines

**Criteria for Static (Always-Loaded) Content:**
- [ ] Applies to every task without exception
- [ ] Cannot be derived from other content
- [ ] Violation would break the system fundamentally
- [ ] Small enough to fit in Layer 0/1 budget

**Criteria for Dynamic (Per-Task) Content:**
- [ ] Varies significantly between tasks
- [ ] Can be retrieved when needed
- [ ] Quality improves with task-specific selection
- [ ] Large or variable in size

**Anti-patterns:**
- ❌ Loading entire project documentation into Layer 0
- ❌ Including rarely-used rules in always-loaded context
- ❌ Dynamic content that contradicts static rules
- ❌ Static rules that change based on task type

---

## Part 4: Context Budget Allocation

### 4.1 The Working Set Problem

From the memory hierarchy invariant:

> **Exceeding context capacity causes thrashing — degraded performance as attention spreads too thin.**

The context window is finite. Modern models range from 8K to 200K+ tokens, but effective utilization drops significantly as context grows (lost in middle phenomenon).

**The working set** = content that must be simultaneously available for good performance

If working set > effective context capacity → degraded performance

### 4.2 Budget Framework

> **HEURISTIC:** The percentage allocations below are practical starting points based on experience, not values derived from invariants. The *principle* (layers need budgets, higher-privilege layers should be smaller) follows from constraints; the *specific percentages* are tunable heuristics. Adjust based on your context window size, task complexity, and observed performance.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONTEXT BUDGET ALLOCATION                             │
│                                                                          │
│   Total Context Window: 100%                                             │
│   ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│   ┌─────────────────┐                                                    │
│   │ Layer 0: Kernel │  5-10%  — Identity, capabilities, constraints      │
│   │                 │          Must be minimal; applies to everything    │
│   └─────────────────┘                                                    │
│                                                                          │
│   ┌─────────────────┐                                                    │
│   │ Layer 1: Mode   │  10-15% — Mode rules, specialized behavior         │
│   │                 │          Larger than kernel, still focused         │
│   └─────────────────┘                                                    │
│                                                                          │
│   ┌─────────────────┐                                                    │
│   │ Layer 2: Task   │  20-30% — KB entries, file contents, tool output   │
│   │                 │          Actively managed; summarize if needed     │
│   └─────────────────┘                                                    │
│                                                                          │
│   ┌─────────────────┐                                                    │
│   │ User Message    │  10-20% — Current request + conversation history   │
│   │                 │          Grows over session; may need compression  │
│   └─────────────────┘                                                    │
│                                                                          │
│   ┌─────────────────┐                                                    │
│   │ Response Space  │  25-40% — Room for the LLM to think and respond    │
│   │                 │          Must be sufficient for complex outputs    │
│   └─────────────────┘                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

### 4.3 Allocation Strategies

**Strategy 1: Fixed Allocation**
```
Assign fixed token budgets to each layer.
Simple but inflexible.

Layer 0: 2K tokens max
Layer 1: 4K tokens max
Layer 2: 8K tokens max
User: 4K tokens max
Response: 8K tokens reserved
```

**Strategy 2: Proportional Allocation**
```
Assign percentages that scale with context window.
Adapts to different models but may waste space.

Layer 0: 5% of window
Layer 1: 10% of window
Layer 2: 25% of window
User: 15% of window
Response: 35% reserved
```

**Strategy 3: Priority-Based Allocation**
```
Allocate from highest to lowest priority, fitting what will fit.
Maximizes important content but complex to implement.

1. Layer 0 (must fit entirely)
2. Response space (must reserve minimum)
3. Layer 1 (must fit entirely)
4. User message (may be summarized if too long)
5. Layer 2 (fill remaining space with ranked content)
```

**Recommendation:** Use Priority-Based Allocation. It ensures critical content always fits while maximizing use of available space.

### 4.4 Context Management Operations

Based on OS memory management patterns:

**Summarization (Parallel: Page compression)**
```
When: Content is large but summary would suffice
How: Compress conversation history, file contents, tool outputs
Preserves: Key information, decisions, outcomes
Loses: Verbatim details, exact wording
```

**Eviction (Parallel: Page replacement)**
```
When: Context budget exceeded
How: Remove least-recently-used or lowest-relevance content
Preserves: Recent, high-relevance content
Loses: Older, lower-relevance content
```

**Caching (Parallel: TLB caching)**
```
When: Same content retrieved repeatedly
How: Keep frequently-accessed content readily available
Benefit: Reduces retrieval latency, improves consistency
```

**Chunking (Parallel: Memory pages)**
```
When: Content is large
How: Split into semantic chunks, retrieve only relevant chunks
Benefit: Finer-grained relevance, better budget utilization
```

### 4.5 Position Strategy

Context position affects attention (primacy and recency effects):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONTEXT POSITION STRATEGY                             │
│                                                                          │
│   TOP (Strong attention)                                                 │
│   ──────────────────────                                                 │
│   Layer 0: Kernel rules                                                  │
│   Layer 1: Mode rules                                                    │
│                                                                          │
│   MIDDLE (Weak attention — "lost in middle")                            │
│   ──────────────────────────────────────────                             │
│   Layer 2: Retrieved context                                             │
│   Older conversation history                                             │
│                                                                          │
│   BOTTOM (Strong attention)                                              │
│   ────────────────────────                                               │
│   Recent conversation                                                    │
│   Current user message                                                   │
│                                                                          │
│   STRATEGY: Place stable, important content at top.                      │
│             Place dynamic, task-specific content near bottom.            │
│             Accept that middle content gets less attention.              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Mode Boundaries and Orchestration

### 5.1 Modes as Specialized Processors

From the scheduling/attention invariant:

> **Context switching has costs. Minimizing switches improves throughput.**

Modes are not just "different personalities" — they are **specialized processing configurations** optimized for specific task types.

**Mode characteristics:**
- Each mode has its own Layer 1 context
- Switching modes requires reloading Layer 1
- Different modes may have different tool access
- Modes trade generality for effectiveness

### 5.2 Mode Boundary Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MODE BOUNDARY MODEL                              │
│                                                                          │
│                        ┌─────────────────────┐                          │
│                        │      KERNEL         │                          │
│                        │   (Layer 0: shared) │                          │
│                        └──────────┬──────────┘                          │
│                                   │                                      │
│              ┌────────────────────┼────────────────────┐                │
│              │                    │                    │                │
│              ▼                    ▼                    ▼                │
│   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐       │
│   │   ARCHITECT      │ │      CODE        │ │      DEBUG       │       │
│   │   (Layer 1)      │ │   (Layer 1)      │ │   (Layer 1)      │       │
│   │                  │ │                  │ │                  │       │
│   │ • Planning rules │ │ • Coding rules   │ │ • Debug rules    │       │
│   │ • Design focus   │ │ • Test focus     │ │ • Analysis focus │       │
│   │ • Doc templates  │ │ • Style guides   │ │ • Log patterns   │       │
│   └──────────────────┘ └──────────────────┘ └──────────────────┘       │
│                                                                          │
│   Each mode is a complete processing configuration.                      │
│   Switching modes = context switch = cost.                               │
│   Modes should be specialized enough to justify the switch cost.         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Note:** The visual parallel to OS kernel modules and brain regions is conceptually helpful but should not be overinterpreted. The *structural pattern* (shared core + specialized configurations) is robust; the *mechanistic details* differ significantly across domains. See note in Part 2.3.

### 5.3 Mode Design Principles

**Principle 1: Single Responsibility**
Each mode should excel at ONE type of task. If a mode does many things, it's not specialized enough.

```
✅ Architect Mode: Plans and designs
✅ Code Mode: Implements and tests
✅ Debug Mode: Investigates and diagnoses

❌ General Mode: Does everything (defeats purpose of modes)
```

**Principle 2: Minimal Overlap**
Modes should have distinct, non-overlapping responsibilities. Overlap creates ambiguity about which mode to use.

```
✅ Architect plans, Code implements (clear boundary)
❌ Architect plans and sometimes codes (ambiguous)
```

**Principle 3: Clear Handoff**
Transitions between modes should be explicit, with defined handoff protocols.

```
Architect → Code:
  Architect produces: Implementation plan with clear steps
  Code receives: Plan + relevant context
  Handoff: Explicit mode switch with context transfer
```

**Principle 4: Worth the Switch Cost**
A mode is only justified if the specialization benefit exceeds the context switch cost.

```
Switch cost: ~2K-4K tokens of mode rules reloaded (HYPOTHESIS: rough estimate)
Benefit: Must exceed this in improved performance

If a mode's rules are only 500 tokens, it may not need to be separate.
```

> *The ~2K-4K token estimate is a hypothesis based on typical mode rule sizes, not a measured value. Actual switch costs depend on your specific mode configurations.*

### 5.4 The Orchestrator's Architectural Function

The Orchestrator is special — it operates at a **meta-level**, managing other modes rather than performing tasks directly.

**OS Parallel:** The Orchestrator is like the **process scheduler**:
- Decides what runs when
- Creates and terminates subtasks
- Manages resource allocation across tasks
- Maintains global state that subtasks cannot access

**Brain Parallel:** The Orchestrator is like **executive function**:
- Maintains goals across task switches
- Allocates attention to competing demands
- Coordinates between specialized processing regions
- Prevents task interference

### 5.5 Orchestrator Capabilities

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR CAPABILITIES                            │
│                                                                          │
│   SUBTASK MANAGEMENT                                                     │
│   ──────────────────                                                     │
│   • Create subtasks with focused context                                 │
│   • Assign subtasks to appropriate modes                                 │
│   • Monitor subtask progress                                             │
│   • Terminate or redirect failing subtasks                               │
│                                                                          │
│   CONTEXT ALLOCATION                                                     │
│   ──────────────────                                                     │
│   • Determine what context each subtask needs                            │
│   • Prevent context bleeding between subtasks                            │
│   • Summarize subtask results for integration                            │
│                                                                          │
│   GLOBAL STATE                                                           │
│   ────────────                                                           │
│   • Maintain task dependencies                                           │
│   • Track overall progress                                               │
│   • Preserve information across mode switches                            │
│                                                                          │
│   ORCHESTRATOR CANNOT:                                                   │
│   ────────────────────                                                   │
│   • Perform implementation work itself                                   │
│   • Access internal state of subtasks                                    │
│   • Override kernel constraints                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Subtask Isolation

From the controlled interface invariant:

> **Subtasks should communicate through defined interfaces, not shared state.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUBTASK ISOLATION MODEL                             │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      ORCHESTRATOR                                │   │
│   │                                                                  │   │
│   │   Global State:                                                  │   │
│   │   • Task graph                                                   │   │
│   │   • Progress tracking                                            │   │
│   │   • Subtask results                                              │   │
│   │                                                                  │   │
│   └──────────────────────────┬──────────────────────────────────────┘   │
│                              │                                           │
│           ┌──────────────────┼──────────────────┐                       │
│           │                  │                  │                       │
│           ▼                  ▼                  ▼                       │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐               │
│   │  Subtask A   │   │  Subtask B   │   │  Subtask C   │               │
│   │              │   │              │   │              │               │
│   │ Own context  │   │ Own context  │   │ Own context  │               │
│   │ Own mode     │   │ Own mode     │   │ Own mode     │               │
│   │ No access to │   │ No access to │   │ No access to │               │
│   │ B or C state │   │ A or C state │   │ A or B state │               │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘               │
│          │                  │                  │                        │
│          └──────────────────┴──────────────────┘                        │
│                             │                                           │
│                    Results flow UP                                      │
│                    (through Orchestrator)                               │
│                                                                          │
│   Benefits:                                                              │
│   • Context pollution prevented                                          │
│   • Failures isolated                                                    │
│   • Parallel execution possible                                          │
│   • Clear accountability                                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Application to Copilot Systems

### 6.1 Implementation Checklist

When applying CogOS to a specific copilot system:

**Layer 0 (Kernel):**
- [ ] Define copilot identity statement (1-2 sentences)
- [ ] List available tool categories
- [ ] Document inviolable constraints (safety, permissions)
- [ ] Specify communication style
- [ ] Keep under 5-10% of context budget

**Layer 1 (Mode Context):**
- [ ] Identify distinct task types requiring specialization
- [ ] Create mode for each distinct type
- [ ] Write mode-specific rules (behaviors, preferences, patterns)
- [ ] Define mode entry/exit conditions
- [ ] Specify what context transfers between modes
- [ ] Keep each mode under 10-15% of context budget

**Layer 2 (Task Context):**
- [ ] Implement retrieval mechanism for relevant content
- [ ] Define relevance criteria for retrieval
- [ ] Implement context compression strategies
- [ ] Track what content is loaded
- [ ] Actively manage to stay within 20-30% budget

**Orchestration:**
- [ ] Define when orchestration is needed vs. direct mode use
- [ ] Specify subtask creation protocol
- [ ] Define handoff format between orchestrator and modes
- [ ] Implement progress tracking mechanism
- [ ] Define failure handling and escalation

### 6.2 Roo Code Application

**Current State Mapping:**

| CogOS Concept | Roo Code Implementation |
|---------------|------------------------|
| Layer 0 | `.roo/rules/` — global rules loaded for all modes |
| Layer 1 | `.roo/rules-{mode}/` — mode-specific rules |
| Layer 2 | File reads, search results, user messages |
| Orchestrator | Orchestrator mode with `new_task` tool |
| Modes | Architect, Code, Debug, Ask, etc. |

**Recommendations:**

1. **Review Layer 0 size:** Ensure global rules are truly universal
2. **Mode specialization:** Each mode should have clear, non-overlapping purpose
3. **Context budget tracking:** Monitor actual token usage per layer
4. **Orchestrator isolation:** Ensure subtasks don't access orchestrator state directly

### 6.3 Kahuna Application

For Kahuna's own copilot rules:

| CogOS Concept | Kahuna Implementation |
|---------------|----------------------|
| Layer 0 | `PROJECT_CONTEXT.md`, core methodology rules |
| Layer 1 | Mode-specific rules (architect, code, etc.) |
| Layer 2 | KB retrieval via `kahuna_prepare_context` |
| Orchestrator | Orchestrator mode creating focused subtasks |
| Knowledge Base | Extended Layer 2 with updateable prior |

**Unique to Kahuna:** The KB serves as both Layer 2 content AND a learning system that improves Layer 2 over time.

### 6.4 Future System Guidance

For copilot systems not yet built:

**Step 1: Identify Constraints**
- What is the context window size?
- What tools will be available?
- What modes/specializations are needed?
- What content will be retrieved dynamically?

**Step 2: Design Layers**
- Layer 0: What is truly universal?
- Layer 1: What modes are needed? What rules per mode?
- Layer 2: What retrieval mechanism? What content types?

**Step 3: Allocate Budget**
- Given context window, what % per layer?
- What compression strategies when budget exceeded?
- What position strategy for content?

**Step 4: Define Orchestration**
- When is orchestration needed?
- What handoff protocol between modes?
- How is global state maintained?

---

## Part 7: Quality Criteria

### 7.1 Architecture Health Metrics

> **HEURISTIC:** These ranges are practical guidelines based on experience, not derived thresholds. Use them as starting points and adjust based on your specific system's performance. The underlying principle (stay within capacity, maintain clear boundaries) is derived; the specific numbers are tunable.

| Metric | Healthy Range | Warning Sign | Claim Strength |
|--------|---------------|--------------|----------------|
| Layer 0 size | < 10% of context | > 15% → too much universal content | HEURISTIC |
| Layer 1 size | < 15% of context per mode | > 20% → mode trying to do too much | HEURISTIC |
| Mode count | 3-7 modes | > 10 → over-specialized; < 3 → under-specialized | HEURISTIC |
| Mode overlap | Minimal | Significant → unclear boundaries | DERIVED |
| Context utilization | 60-80% | > 90% → thrashing risk; < 50% → waste | HEURISTIC |
| Switch frequency | Task-appropriate | Very high → wrong mode selection | DERIVED |

### 7.2 Invariant Compliance Checklist

**Privilege Hierarchy:**
- [ ] Layer 0 content cannot be overridden by user messages
- [ ] Mode rules cannot contradict kernel rules
- [ ] Task content constrained by higher layers

**Scheduling/Attention:**
- [ ] Modes have clear, non-overlapping responsibilities
- [ ] Mode switches are explicit and intentional
- [ ] Focused context produces better results

**Memory Hierarchy:**
- [ ] Context budget actively managed
- [ ] Working set fits in context window
- [ ] Compression strategies defined and used

**Controlled Interface:**
- [ ] All external effects go through tool calls
- [ ] Tool calls are validated before execution
- [ ] Results flow through defined interfaces

### 7.3 Debugging Guide

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Mode ignores kernel rules | Privilege leak | Verify kernel rules at top of context |
| Performance degrades over session | Context thrashing | Implement summarization/eviction |
| Wrong mode selected | Unclear boundaries | Sharpen mode definitions |
| Subtasks interfere with each other | Isolation failure | Verify subtask context separation |
| Orchestrator loses track | Global state corruption | Review state management |
| LLM ignores retrieved context | Position problem | Move important content to boundaries |

---

## Summary

### The Cognitive Operating System Architecture

**Foundation:** Four invariants derived from constraints common to operating systems, brain executive function, and AI copilots:

1. **Privilege/Protection Hierarchy** → Layer model (Kernel, Mode, Task)
2. **Scheduling/Attention Allocation** → Mode specialization, context switching costs
3. **Memory Hierarchy and Working Set** → Context budget allocation, compression strategies
4. **Controlled Interface for External Effects** → Tool calls, validation, defined interfaces

**Key Structures:**

- **Three Layers:** Kernel (always loaded, highest privilege) → Mode (per-mode, medium privilege) → Task (per-task, lowest privilege)
- **Static/Dynamic Spectrum:** Kernel is static, Task is dynamic, Mode is semi-static
- **Context Budget:** Kernel 5-10%, Mode 10-15%, Task 20-30%, User 10-20%, Response 25-40% *(HEURISTIC — adjust based on experience)*
- **Orchestrator:** Meta-level process scheduler, creates subtasks, maintains global state

**Key Principles:**

1. **Derive from constraints, not intuition** — Architecture follows from invariants
2. **Prompt Specificity Principle** — Narrower prompts produce better performance
3. **Static enables dynamic** — Layer 0/1 define the space, Layer 2 selects within it
4. **Switching has costs** — Minimize mode switches, make them explicit
5. **Working set must fit** — Actively manage context to prevent thrashing

### Application

This architecture applies to any copilot system facing the universal constraints: limited context, competing demands, memory hierarchy, need for external effects. The specific implementation varies, but the structural invariants hold.

---

## Changelog

- v1.1 (2026-03-07): Added claim strength annotations (HEURISTIC, HYPOTHESIS) per cogos-review.md analysis
- v1.0 (2026-03-07): Initial architecture definition
