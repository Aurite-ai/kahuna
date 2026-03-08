# Tools + Prompts: The Primitive Pair Framework

**Type:** Foundational Design Document
**Date:** 2026-03-07
**Status:** Draft
**Purpose:** Formalize tools+prompts as the primitive pair for describing cognitive computer systems, with particular attention to the internal/external tool distinction.

**Related:**
- [`theoretical-foundations.md`](theoretical-foundations.md) — Bayesian/FEP foundations
- [`llm-agent-model.md`](llm-agent-model.md) — LLM as Bayesian inference engine
- [`cognitive-operating-system.md`](cognitive-operating-system.md) — CogOS architecture
- [`static-dynamic-integration.md`](../02-architecture/static-dynamic-integration.md) — Static/dynamic model

---

## Executive Summary

This document formalizes **tools+prompts** as the primitive pair for describing cognitive computer systems at the interface level. The framework distinguishes:

- **Prompts** — What the system sees/reads/considers (cognitive)
- **Tools** — What the system does/causes (digital)

A key insight is that tools divide into two categories:
- **External tools** — Actions that change the world (motor action)
- **Internal tools** — Actions that change the cognitive system itself (meta-cognition)

This framework extends existing Kahuna foundations by providing a minimal vocabulary for describing copilot systems and revealing the relationship between tool design and cognitive architecture.

**Claim Strength:** The framework is DERIVED from triple parallel analysis but its minimality is HYPOTHESIZED and awaits formal validation.

---

## Part 1: The Core Framework

### 1.1 The Primitive Pair

At the interface level, everything in a cognitive computer system can be expressed as either:

| Category | Definition | Examples |
|----------|------------|----------|
| **Prompt** | Information available to the cognitive process | System prompt, mode rules, KB entries, file contents, conversation history |
| **Tool** | Action the cognitive process can invoke | `read_file`, `write_file`, `execute_command`, `new_task`, `switch_mode` |

**Why these are primitive:**
- They cannot be reduced further at the interface level
- All copilot elements can be classified as one or the other
- They are mutually exclusive: a thing is either read (prompt) or done (tool)

### 1.2 What the Framework Describes (and Doesn't)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCOPE OF TOOLS+PROMPTS FRAMEWORK                      │
│                                                                          │
│   SUBSTRATE LEVEL (NOT covered)                                          │
│   ─────────────────────────────                                          │
│   - LLM weights and training                                             │
│   - Attention mechanism internals                                        │
│   - Token embeddings and inference computation                           │
│   - Hardware implementation                                              │
│                                                                          │
│   These are the SUBSTRATE that makes the interface level work.           │
│   They are not consciously available to the cognitive process.           │
│                                                                          │
│   ═══════════════════════════════════════════════════════════════════   │
│                                                                          │
│   INTERFACE LEVEL (covered by tools+prompts)                             │
│   ─────────────────────────────────────────                              │
│   - Everything the system consciously "sees" or "does"                   │
│   - All prompt content (what it reads)                                   │
│   - All tool capabilities (what it can do)                               │
│                                                                          │
│   This is the level at which copilot systems are DESIGNED.               │
│   Prompt engineering and tool design happen here.                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key distinction:** The framework describes the interface, not the mechanism. How prompts are processed (attention, weights) is substrate; what prompts contain is interface.

### 1.3 The Basic Relationship

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BASIC TOOLS + PROMPTS CYCLE                           │
│                                                                          │
│        ┌─────────────────────────────────────────────────────┐           │
│        │                     PROMPTS                         │           │
│        │                                                     │           │
│        │   System prompt + Mode rules + KB entries +         │           │
│        │   User message + Conversation history +             │           │
│        │   Tool outputs from previous calls                  │           │
│        │                                                     │           │
│        └──────────────────────┬──────────────────────────────┘           │
│                               │                                          │
│                               │ read by                                  │
│                               ▼                                          │
│        ┌─────────────────────────────────────────────────────┐           │
│        │                 INFERENCE ENGINE                     │           │
│        │                                                     │           │
│        │   LLM processes all prompts, generates response     │           │
│        │   Response may be text OR tool call                 │           │
│        │                                                     │           │
│        └──────────────────────┬──────────────────────────────┘           │
│                               │                                          │
│                               │ produces                                 │
│                               ▼                                          │
│        ┌─────────────────────────────────────────────────────┐           │
│        │                      OUTPUT                          │           │
│        │                                                     │           │
│        │   Either:                                           │           │
│        │   - Text response → becomes part of next prompt     │           │
│        │   - Tool call → executed, result becomes prompt     │           │
│        │                                                     │           │
│        └──────────────────────┬──────────────────────────────┘           │
│                               │                                          │
│                               │ feeds back                               │
│                               ▼                                          │
│                          [next cycle]                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Observation:** Tool outputs become prompts in subsequent cycles. This means prompts and tools are not just distinct but interrelated — tools produce prompt content.

---

## Part 2: Triple Parallel Validation

### 2.1 The Mapping

The tools+prompts distinction maps to established concepts across domains:

| Domain | Prompts Analog | Tools Analog |
|--------|---------------|--------------|
| **Brain** | Mental contents: thoughts, perceptions, imagination | Actions: motor outputs, behaviors |
| **Computer** | State: memory contents, program data | Operations: I/O, system calls |
| **AI/Copilot** | Context window: all text input | Tool calls: function invocations |

This triple parallel suggests the distinction is not arbitrary but reflects something fundamental about cognitive systems.

### 2.2 The Internal/External Split

Each domain also distinguishes between actions that affect the external world versus actions that affect the cognitive system itself:

| Domain | External Actions | Internal Actions |
|--------|------------------|------------------|
| **Brain** | Motor action (moving, speaking) | Meta-cognition (recalling, imagining, planning) |
| **Computer** | I/O operations (disk, network) | Internal operations (context switch, memory allocation) |
| **AI/Copilot** | External tools (`write_file`, `execute_command`) | Internal tools (`new_task`, `switch_mode`, `kahuna_prepare_context`) |

**Key insight:** Internal actions ARE meta-cognition. They are the cognitive system operating on itself.

### 2.3 Why This Matters

The triple parallel validates that tools+prompts is not an ad-hoc framework but reflects a genuine structural pattern:

> **All information-processing systems that act in the world have:**
> 1. **State they process** (prompts/thoughts/memory)
> 2. **External actions they take** (external tools/motor action/I/O)
> 3. **Internal actions that modify their own processing** (internal tools/meta-cognition/system calls)

This is not coincidence — it emerges from the constraints these systems face.

---

## Part 3: Tool Taxonomy

### 3.1 External vs Internal Tools

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TOOL TAXONOMY                                    │
│                                                                          │
│                             TOOLS                                        │
│                               │                                          │
│              ┌────────────────┴────────────────┐                        │
│              │                                 │                        │
│              ▼                                 ▼                        │
│   ┌─────────────────────┐           ┌─────────────────────┐            │
│   │    EXTERNAL TOOLS   │           │    INTERNAL TOOLS   │            │
│   │                     │           │                     │            │
│   │  Change the world   │           │  Change the system  │            │
│   │  outside the        │           │  itself: memory,    │            │
│   │  cognitive system   │           │  mode, attention    │            │
│   │                     │           │                     │            │
│   │  - write_file       │           │  - new_task         │            │
│   │  - execute_command  │           │  - switch_mode      │            │
│   │  - api_call         │           │  - retrieve_context │            │
│   │  - send_message     │           │  - update_todo_list │            │
│   │                     │           │                     │            │
│   │  Parallel: motor    │           │  Parallel: meta-    │            │
│   │  action in brain    │           │  cognition in brain │            │
│   │                     │           │                     │            │
│   └─────────────────────┘           └─────────────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Internal Tool Subtypes

Internal tools can be further classified by what aspect of the system they modify:

| Subtype | What It Modifies | Examples |
|---------|-----------------|----------|
| **Orchestration** | Task structure, agent spawning | `new_task`, terminate subtask |
| **Mode/Context** | Active rules, specialization | `switch_mode`, load rules |
| **Memory** | Working memory, knowledge access | `kahuna_prepare_context`, `update_todo_list` |
| **Attention** | What is currently salient | Salience updates, focus shifts |

### 3.3 Mixed Tools: Read + Effect

Some tools are primarily about producing information (prompt content) but have side effects:

| Tool | Primary Function | Side Effect |
|------|------------------|-------------|
| `read_file` | Produce file contents (prompt) | May update access timestamps |
| `search_files` | Produce search results (prompt) | Consumes compute resources |
| `kahuna_prepare_context` | Produce KB entries (prompt) | Boosts accessed entry salience |

**Important:** The classification is about primary function, not purity. A tool that primarily produces prompt content is a "read tool" even if it has side effects.

### 3.4 The Privileged Tool Hierarchy

From the CogOS invariants, we know privilege must be protected. Applied to tools:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TOOL PRIVILEGE HIERARCHY                              │
│                                                                          │
│   HIGHEST PRIVILEGE                                                      │
│   ──────────────────                                                     │
│   Orchestration tools: new_task, terminate_task                          │
│   These create/destroy cognitive contexts                                │
│                                                                          │
│   MEDIUM PRIVILEGE                                                       │
│   ────────────────                                                       │
│   Mode/Context tools: switch_mode, load_rules                            │
│   These change what rules apply                                          │
│                                                                          │
│   Memory tools: kahuna_prepare_context, update_todo_list                │
│   These change what knowledge is available                               │
│                                                                          │
│   LOWER PRIVILEGE                                                        │
│   ───────────────                                                        │
│   External tools: write_file, execute_command                            │
│   These change the world but not the cognitive system                   │
│                                                                          │
│   Read tools: read_file, search_files                                    │
│   These produce information with minimal side effects                    │
│                                                                          │
│   The hierarchy matters because:                                         │
│   - Higher privilege = greater impact on system behavior                 │
│   - Should require more trust/verification                               │
│   - Should be restricted to appropriate contexts                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Connection to Existing Foundations

### 4.1 Connection to LLM Agent Model (Bayesian Framing)

The existing LLM Agent Model describes prompts as configuring Bayesian inference:

| Prompt Component | Bayesian Role |
|-----------------|---------------|
| Goal | Posterior target |
| Rules | Constraints (P=0 for violations) |
| Strategies | Prior distribution |
| Opening | Trajectory initialization |

Tools+prompts EXTENDS this by showing how internal tools modify the inference configuration:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              INTERNAL TOOLS AS META-BAYESIAN OPERATIONS                  │
│                                                                          │
│   Each internal tool modifies future inference:                          │
│                                                                          │
│   kahuna_prepare_context(task)                                          │
│   ─────────────────────────────                                          │
│   - Retrieves KB entries relevant to task                                │
│   - This is EVIDENCE retrieval                                           │
│   - Changes P(response | task) by adding knowledge                       │
│   - Bayesian: Updates evidence E in P(H|E)                               │
│                                                                          │
│   switch_mode(new_mode)                                                  │
│   ─────────────────────                                                  │
│   - Changes loaded rules/strategies                                      │
│   - This is PRIOR modification                                           │
│   - Changes what inference preferences apply                             │
│   - Bayesian: Changes the prior P(H)                                     │
│                                                                          │
│   new_task(instructions, mode)                                          │
│   ────────────────────────────                                           │
│   - Creates new inference context                                        │
│   - This is spawning a new Bayesian agent                                │
│   - The new agent has its own prompt configuration                       │
│   - Bayesian: Creates new inference engine                               │
│                                                                          │
│   KEY INSIGHT:                                                           │
│   Internal tools are meta-Bayesian — they operate on the inference       │
│   configuration itself, not just on the evidence or hypothesis space.   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Connection to CogOS Invariants

The four CogOS invariants map directly to tool design:

| Invariant | Tools+Prompts Manifestation |
|-----------|---------------------------|
| **Privilege Hierarchy** | Internal tools have privilege levels; orchestration > mode > memory > external |
| **Scheduling/Attention** | `new_task` IS the scheduling mechanism; `switch_mode` IS attention allocation |
| **Memory Hierarchy** | `kahuna_prepare_context` IS memory retrieval; prompts ARE working memory |
| **Controlled Interface** | ALL external effects go through tool calls; tool interface IS the controlled interface |

**Insight:** The CogOS invariants are essentially design principles for tool systems. They specify HOW tools should be organized and controlled.

### 4.3 Connection to Static-Dynamic Integration

The static-dynamic model says:
- Static structures = KB, mode rules, templates
- Dynamic behavior = runtime computation

Tools+prompts reveals the mechanism:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STATIC → DYNAMIC VIA TOOLS                            │
│                                                                          │
│   STATIC STRUCTURES                TOOLS                  DYNAMIC        │
│   ─────────────────                ─────                  ───────        │
│                                                                          │
│   KB entries        ──────▶  kahuna_prepare_context  ──────▶  Prompt    │
│   (stored)                   (retrieval tool)               (active)    │
│                                                                          │
│   Mode rules        ──────▶  switch_mode             ──────▶  Prompt    │
│   (defined)                  (mode tool)                    (loaded)    │
│                                                                          │
│   Files             ──────▶  read_file               ──────▶  Prompt    │
│   (on disk)                  (read tool)                    (in context)│
│                                                                          │
│   KEY INSIGHT:                                                           │
│   Tools are the BRIDGE between static and dynamic.                       │
│   Retrieval is not just "finding stuff" — it's the tool that            │
│   transforms static structures into dynamic prompt content.              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Design Implications

### 5.1 Prompt Design Principles

**Principle 1: Prompts Define the Cognitive State**

Everything the system can "think about" must be in the prompt. If it's not in the prompt, it doesn't exist for that inference cycle.

**Principle 2: Prompt Space is Limited**

Context windows are finite. Prompt design is fundamentally about what to include and what to omit.

**Principle 3: Prompt Structure Affects Processing**

Position matters (primacy/recency effects). Organization matters (attention to structure). The same content presented differently produces different inference.

### 5.2 Tool Design Principles

**Principle 1: Tools Define Capability**

A prompt without tools is observation only. Tools enable agency. The tool set defines what the system CAN do.

**Principle 2: Internal Tools Enable Meta-Agency**

External tools let the system affect the world. Internal tools let the system affect itself. This is meta-cognition made concrete.

**Principle 3: Tool Privilege Should Match Impact**

Higher-impact tools (orchestration, mode changes) should require more trust and have more restrictions. This is the CogOS privilege hierarchy applied.

### 5.3 System Design Principles

**Principle 1: Balance Cognitive and Digital**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COGNITIVE-DIGITAL BALANCE                             │
│                                                                          │
│   TOO MUCH PROMPT (large context)                                        │
│   ───────────────────────────────                                        │
│   - Slow inference                                                       │
│   - High cost                                                            │
│   - "Lost in middle" degradation                                         │
│   - Attention diluted                                                    │
│                                                                          │
│   TOO MUCH TOOL (constant calls)                                         │
│   ──────────────────────────────                                         │
│   - Overhead per call                                                    │
│   - Latency accumulation                                                 │
│   - Loss of flow                                                         │
│   - Context fragmentation                                                │
│                                                                          │
│   OPTIMAL: Focused prompt + precise tools                                │
│   ─────────────────────────────────────                                  │
│   - Minimal necessary context                                            │
│   - Tools invoked when needed                                            │
│   - Clear boundary between cognition and action                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Principle 2: Internal Tools = Executive Function**

The Orchestrator has broad internal tool access because it IS the executive function. Individual modes have limited internal tools because they are specialized processors, not executives.

**Principle 3: Tool Design IS Architecture Design**

Choosing which tools exist and who can use them IS designing the cognitive architecture. Tool permissions ARE the privilege hierarchy. Tool availability IS capability definition.

### 5.4 Practical Guidelines

**For Prompt Content:**
- Include only what's needed for THIS inference
- Place important content at top or bottom (attention boundaries)
- Structure for scanability (headers, lists)
- Remove content that doesn't inform the current task

**For External Tools:**
- Validate inputs before execution
- Return focused results (not everything, just relevant)
- Include provenance (where did this come from?)
- Handle errors gracefully

**For Internal Tools:**
- Require appropriate privilege level
- Log state changes for debugging
- Provide clear feedback on what changed
- Prevent recursive/oscillating invocations

---

## Part 6: Open Questions

### 6.1 Is This THE Minimal Pair?

**Claim:** Tools and prompts are the minimal primitive pair for describing cognitive computer systems at the interface level.

**Supporting evidence:**
- Triple parallel validation
- All copilot elements classify as one or the other
- Mutually exclusive and collectively exhaustive at interface level

**Counter-considerations:**
- Could there be a third primitive we haven't identified?
- Is "tool" too broad? Should output/action/effect be distinguished?
- Do multi-modal inputs (images, audio) fit cleanly as "prompts"?

**Status:** HYPOTHESIS — needs formal validation or counter-example.

### 6.2 What About Training?

Training changes the LLM's fundamental capabilities. This doesn't fit neatly into tools+prompts because:
- Training changes the substrate, not the interface
- It's not a "tool" the running system can invoke
- It changes what prompts can achieve

**Possible resolution:** Training is substrate modification, outside the interface level that tools+prompts describes. The framework is explicitly scoped to runtime, not training.

### 6.3 What About Emergent Behaviors?

Some capabilities emerge from the LLM training that aren't explicitly designed:
- In-context learning
- Chain-of-thought reasoning
- Self-correction

These happen within the prompt→inference→output cycle but aren't "tools."

**Possible resolution:** These are inference behaviors, part of the substrate that processes prompts. The prompt content may encourage them (e.g., "think step by step") but the behavior itself is not a tool.

### 6.4 How Does This Relate to "Agents"?

An "agent" in current AI discourse is typically:
- An LLM with tool access
- That can take multi-step actions
- With some goal-directed behavior

In tools+prompts terms: An agent is an inference engine with a prompt configuration and tool set, running over multiple cycles.

**Question:** Is there something essential about agents that tools+prompts misses?

**Possible answer:** Goals and persistence. An agent has goals that persist across cycles. The prompt carries them, but their persistence is a higher-level pattern. Tools+prompts describes the components; agency is a pattern built from them.

---

## Summary

### The Framework

**Tools+prompts is the primitive pair for cognitive computer systems at the interface level:**

| Primitive | What It Is | Role |
|-----------|------------|------|
| **Prompt** | Information available to inference | The cognitive content — what the system "thinks about" |
| **Tool** | Action the system can invoke | The digital capability — what the system "does" |

### The Key Distinction

**Tools divide into external (world-changing) and internal (system-changing):**

| Type | Effect | Parallel |
|------|--------|----------|
| External | Changes the world | Motor action (brain), I/O (computer) |
| Internal | Changes the system | Meta-cognition (brain), system calls (computer) |

### The Integration

**Tools+prompts connects to existing foundations:**

| Foundation | Connection |
|------------|------------|
| LLM Agent Model | Internal tools modify the inference configuration (meta-Bayesian) |
| CogOS Invariants | Design principles for tool systems |
| Static-Dynamic | Tools bridge static structures to dynamic prompts |

### Claim Strengths

| Claim | Strength |
|-------|----------|
| Interface level reduces to prompts+tools | DERIVED |
| All copilot elements classify as one | OBSERVED |
| Internal/external maps to meta-cognition | DERIVED |
| This is THE minimal pair | HYPOTHESIS |
| Framework guides design | HYPOTHESIS |

---

## Changelog

- v1.0 (2026-03-07): Initial framework definition
