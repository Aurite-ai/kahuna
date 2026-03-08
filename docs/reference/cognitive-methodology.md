# Cognitive Software Development Methodology (Reference)

This document contains detailed methodology, theory, and techniques for cognitive software development. For actionable rules and quick reference, see [`.roo/rules/03_COGNITIVE_SOFTWARE_DEVELOPMENT.md`](../../.roo/rules/03_COGNITIVE_SOFTWARE_DEVELOPMENT.md).

---

## Table of Contents

- [Theoretical Foundations](#theoretical-foundations)
- [The Derivation Pattern](#the-derivation-pattern)
- [Validation Techniques](#validation-techniques)
- [The Three Pillars Methodology](#the-three-pillars-methodology)
- [Development Process](#development-process)
- [Anti-Patterns (Full Descriptions)](#anti-patterns-full-descriptions)
- [Context](#context)
- [Glossary](#glossary)
- [Changelog](#changelog)

---

## Theoretical Foundations

### Information Structure Foundation

When studying the brain for inspiration, we cannot replicate its mechanisms (neurons, synaptic plasticity, neurochemistry). But we can observe the **patterns that emerge** from how information is structured.

The brain didn't invent consolidation. Consolidation is what ANY system must do when it has:
- Limited working capacity
- Ongoing information intake
- Need for long-term retention

The structure creates the necessity. The mechanism follows.

#### The Translation Principle

| What We DON'T Translate | What We DO Translate |
|------------------------|---------------------|
| Neural mechanisms | Information structures |
| Biological processes | Emergent patterns |
| Brain architecture | Interface requirements |

When we look at how the brain handles memory consolidation, we ask: **What about the information structure made this operation necessary?** Not: "How do neurons do this?"

### The LLM Completion Model

An LLM alone is not a complete cognitive system. It lacks:
- **Updateable beliefs** — Weights are fixed post-training
- **Persistent memory** — Forgets between sessions
- **Learning** — Cannot improve from experience

Kahuna "completes" the LLM by providing what's missing:

| Missing Capability | Kahuna Component | How It Helps |
|-------------------|------------------|--------------|
| Updateable beliefs | Knowledge Base | External, modifiable storage |
| Persistent memory | KB files | Survive session boundaries |
| Learning | Consolidation | Updates KB from experience |
| Selective attention | Retrieval | Surfaces relevant context |

#### The Static-Dynamic Integration

```
┌─────────────────────────────────────────────────────────────────┐
│   STATIC (Kahuna)              DYNAMIC (LLM)                    │
│                                                                 │
│   KB files ────────────────────► Context window                │
│   (persistent storage)           (working memory)               │
│                                                                 │
│   Retrieval ───────────────────► Attention                     │
│   (selective surfacing)          (in-context relevance)        │
│                                                                 │
│   Consolidation ◄──────────────── Generation                   │
│   (learning)                      (produces learnable content)  │
└─────────────────────────────────────────────────────────────────┘
```

This separation enables:
- Static structure to guide dynamic computation
- Dynamic computation to improve static structure over time
- Clear boundaries for what each system handles

---

## The Derivation Pattern

This pattern emerged from successful theoretical work and should guide future cognitive software design:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THE DERIVATION PATTERN                           │
│                                                                     │
│   1. PHYSICS CONSTRAINTS (Strong foundation)                       │
│      Energy, channel capacity, noise, uncertainty                  │
│                          │                                          │
│                          ▼                                          │
│   2. TRIPLE PARALLEL OBSERVATION (Empirical validation)            │
│      What do brain, computer, AI all share?                        │
│                          │                                          │
│                          ▼                                          │
│   3. STRUCTURAL INVARIANTS (Derived necessity)                     │
│      Properties that MUST exist given constraints + observation    │
│                          │                                          │
│                          ▼                                          │
│   4. COMPUTATIONAL FUNCTIONS (Substrate-independent)               │
│      What operations must the system perform?                      │
│                          │                                          │
│                          ▼                                          │
│   5. INTERFACE CONTRACTS (Integration-ready)                       │
│      What goes in, what comes out, what preconditions?             │
│                          │                                          │
│                          ▼                                          │
│   6. SUBSYSTEM DESIGN (Implementation)                             │
│      How does each subsystem work internally?                      │
│                                                                     │
│   Note: Each level has explicit claim strength.                    │
│   Don't build on hypotheses as if they were derivations.           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Abstraction Level Examples

| Level | Status | Example |
|-------|--------|---------|
| **Too Abstract** | ❌ Avoid | "Brain and AI ARE mathematically identical" |
| **Too Abstract** | ❌ Avoid | "Systems work BECAUSE they minimize free energy" |
| **Just Right** | ✅ Use | "Retrieval subsystem queries index, returns ranked candidates" |
| **Just Right** | ✅ Use | "Consolidation pipeline: Extract → Integrate → Verify" |
| **Too Concrete** | ❌ Avoid | "Use cosine similarity with threshold 0.7" |
| **Too Concrete** | ❌ Avoid | "Synaptic plasticity mechanisms" |

---

## Validation Techniques

### Triple Parallel Validation

Use brain ↔ computer ↔ AI comparison to **validate** design decisions. If all three domains show the same pattern, it's likely a structural necessity rather than an arbitrary design choice.

```
     BRAIN                 COMPUTER               AI/LLM
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                     SHARED PATTERN?
                              │
              ┌───────────────┴───────────────┐
              │                               │
        YES: Structural                 NO: Domain-specific
            necessity                    design choice
```

#### How to Apply It

For each design decision, ask:
1. **How does the brain do this?** (Cognitive science literature)
2. **How does traditional computing do this?** (Computer architecture)
3. **What's the common pattern?** (The structural invariant)

#### Five Structural Invariants (Validated)

These appear across all three domains:

| Invariant | Brain | Computer | AI/Kahuna |
|-----------|-------|----------|-----------|
| **Limited Working Capacity** | Working memory (7±2 items) | RAM is finite | Context window limits |
| **Persistent Storage** | Long-term memory | Disk/database | KB files |
| **Central Coordination** | Executive function | CPU/OS | LLM orchestrator |
| **Specialized Processing** | Visual cortex, etc. | GPU, NIC | Specialized agents |
| **Selective Attention** | Attention filters | Caching/eviction | Retrieval ranking |

#### Triple Parallel Limitations

Not all mappings are equally strong:

| Subsystem | Brain Analog | Computer Analog | Validity |
|-----------|--------------|-----------------|----------|
| Encoding | ✅ Strong | ✅ Strong | High |
| Storage | ✅ Strong | ✅ Strong | High |
| Retrieval | ✅ Strong | ✅ Strong | High |
| Error Handling | ✅ Strong | ✅ Strong | High |
| Consolidation | ✅ Strong | ⚠️ Partial | Medium-High |
| Attention | ✅ Strong | ⚠️ Weak | Medium |

**Acknowledge weak mappings.** Don't claim triple-parallel validation where computer analogs are forced. The design is still valid — just not triple-validated.

### Claim Strength Classification

Every claim should state its basis. This prevents overreach and enables appropriate confidence.

| Level | Basis | How to State | Example |
|-------|-------|--------------|---------|
| **[Established]** | Physics or triple parallel | State without qualification | "Context windows are finite" |
| **[Derived]** | Follows logically from established | State as derived | "Retrieval must exist because capacity is limited" |
| **[Observed]** | Appears across domains but not derived | State as observation | "Brain and AI show similar structure" |
| **[Hypothesis]** | Design choice, testable | State explicitly | "We hypothesize consolidation at session end works best" |

**The Classification Rule:**
> Every design decision should trace to a claim with known strength. Don't build on hypotheses as if they were established.

### Bayesian Model as Design Heuristic

The Bayesian framing provides useful intuition for cognitive system design:

| Component | Bayesian Role | Kahuna Implementation |
|-----------|---------------|----------------------|
| **Knowledge Base** | Prior P(H) | Persistent beliefs about the project |
| **Retrieval** | Posterior approximation | What's relevant given current task |
| **Consolidation** | Bayesian update | New evidence updates beliefs |

#### How to Use It

✅ **Use as intuition:** "KB is like a prior — it shapes what the LLM expects"
✅ **Use for design guidance:** "Consolidation should update beliefs, not replace them"
✅ **Use for communication:** "Retrieval finds what's most probable given context"

❌ **Don't claim rigor:** The KB doesn't sum to 1, retrieval isn't formal likelihood
❌ **Don't derive math:** You can't calculate exact posteriors from this model
❌ **Don't reify the framework:** Bayesian describes the system; it doesn't explain why it works

#### The Correct Framing

Say this:
> "Kahuna is **Bayesian-inspired** — the KB functions as an approximate prior, retrieval approximates posterior computation, and consolidation implements belief revision."

Not this:
> "Kahuna IS a Bayesian system that computes P(H|E)."

---

## The Three Pillars Methodology

```
┌─────────────────────────────────────────────────────────────────┐
│  1. INFORMATION STRUCTURE (Reference)                           │
│     What structure must exist for effective LLM operation?      │
│     Derived from: Brain's memory patterns, LLM constraints      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. COGNITIVE COMPUTER SCIENCE (Working Medium)                 │
│     How do we reason about cognitive operations?                │
│     Provides: Computational models, interface definitions       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. MARR'S FRAMEWORK (Translation)                              │
│     How do we translate models to implementation?               │
│     Levels: Computational → Algorithmic → Implementational      │
└─────────────────────────────────────────────────────────────────┘
```

### Pillar 1: Information Structure

Before designing any feature, answer:

1. **What information must be represented?**
   - Types, categories, relationships
   - Temporal properties (recency, staleness)
   - Scope properties (local, global, hierarchical)

2. **What constraints exist on this information?**
   - Capacity limits (context windows, storage)
   - Access patterns (retrieval requirements)
   - Consistency requirements (can contradictions exist?)

3. **What structure naturally emerges from these requirements?**
   - Hierarchies, networks, sequences
   - Indexing needs
   - Boundary definitions

The structure is not designed — it is **derived** from requirements and constraints.

### Pillar 2: Cognitive Computer Science

Cognitive computer science treats cognitive functions as **computational modules** with defined interfaces. This enables reasoning about cherry-picked systems without understanding the whole.

#### Defining Computational Models

For each cognitive function, specify:

```
┌─────────────────────────────────────┐
│  FUNCTION: [Name]                   │
│                                     │
│  GOAL: What problem does it solve?  │
│                                     │
│  INPUTS:                            │
│  - What information does it need?   │
│  - What format/structure?           │
│                                     │
│  OUTPUTS:                           │
│  - What does it produce?            │
│  - What format/structure?           │
│                                     │
│  INTERFACES:                        │
│  - What other systems connect?      │
│  - What do they provide/receive?    │
└─────────────────────────────────────┘
```

#### Model Discovery Process

Models come from three sources, typically in order:

1. **Research** — Cognitive science literature has computational models
   - Memory consolidation, attention mechanisms, schema integration
   - Use these as starting points, not gospel

2. **Derivation** — From information structure, derive necessary operations
   - If structure has X property, it must support Y operation
   - Logical necessity, not design choice

3. **Empirical Discovery** — Build, test, learn what's missing
   - Some operations only reveal themselves in practice
   - This is where the empirical philosophy applies

#### Handling Interconnections

Cognitive systems are interconnected. Cherry-picking one system exposes connections to others.

**Solution: Interface-first design**

1. **Identify the interface** — What does this system receive? What does it provide?
2. **Stub the connections** — Assume other systems provide ideal inputs
3. **Implement the core** — Build the cherry-picked system
4. **Later: Complete connections** — Replace stubs with real implementations

This is dependency injection for cognitive modules.

### Pillar 3: Marr's Framework

Marr's three levels provide the translation from cognitive model to implementation.

#### Level 1: Computational

**Question:** What is the goal of the computation?

- Define the input-output mapping
- Specify what problem is being solved
- This level is **universal** — same for brain and software

Example: "Given a new piece of information and existing knowledge, determine if they're compatible."

#### Level 2: Algorithmic

**Question:** What process achieves the goal?

- Describe the procedure abstractly
- Inspired by cognitive research but adapted for our substrate
- Multiple algorithms can achieve the same computation

Example: "Compare semantic embeddings of new info with existing entries, flag conflicts above threshold."

#### Level 3: Implementational

**Question:** How is this realized in our system?

- Concrete code, agents, files, APIs
- Constrained by algorithm but with implementation choices
- This is where LLM-specific considerations apply

Example: "Agent receives new entry, calls embedding API, queries vector store, returns conflict list."

---

## Development Process

### Phase 1: Model Definition

Before implementation, establish computational models for all core systems:

1. **Enumerate systems** — What cognitive functions does the software require?
2. **Define each model** — Goal, inputs, outputs, interfaces
3. **Map relationships** — How do systems connect? What are the interface contracts?

This creates a **cognitive architecture** independent of implementation.

### Phase 2: Parallel Development

Cognitive systems are interconnected. Developing one in isolation creates integration debt.

**Approach: Grow all systems together**

```
                    PARALLEL DEVELOPMENT APPROACH

    ┌─────────┬─────────┬─────────┬─────────┬─────────┬──────────┐
    │ Storage │Encoding │Retrieval│ Consol. │ Error   │ Attention│
    ├─────────┼─────────┼─────────┼─────────┼─────────┼──────────┤
L1  │ ████████│█████████│█████████│█████████│█████████│██████████│
    ├─────────┼─────────┼─────────┼─────────┼─────────┼──────────┤
L2  │ ████████│█████████│█████████│█████████│█████████│██████████│
    ├─────────┼─────────┼─────────┼─────────┼─────────┼──────────┤
L3  │ ████████│█████████│█████████│█████████│█████████│██████████│
    └─────────┴─────────┴─────────┴─────────┴─────────┴──────────┘
```

- Work across the architecture, not deep into one part
- Keep systems at similar levels of definition
- Interfaces stabilize through simultaneous development
- Constraints from one system inform others early

This prevents the situation where one system is fully defined while another is undefined, creating artificial constraints.

### Phase 3: Translation

Apply Marr's framework to translate each model:

1. Confirm computational specification (Level 1)
2. Design algorithm appropriate for LLM substrate (Level 2)
3. Implement concretely (Level 3)

### Phase 4: Empirical Validation

After translation, test empirically:

- Does the implementation achieve the computational goal?
- Do interconnected systems integrate correctly?
- What was missed that needs to feed back into models?

This is where the empirical development philosophy applies — but now with a foundation to test against.

---

## Anti-Patterns (Full Descriptions)

These patterns failed during theoretical derivation work. Avoid them.

### Anti-Pattern 1: Mathematical Identity Claims

**The mistake:** "Brain and AI are mathematically identical because both can be described with Bayes."

**Why it fails:** The same math describing two things doesn't make them the same thing. "Can be described with similar math" ≠ "ARE identical."

**What to do instead:** Say "can be similarly described" not "ARE the same."

### Anti-Pattern 2: QM Integration

**The mistake:** Trying to incorporate quantum mechanics as a foundation layer or fourth domain.

**Why it fails:**
- QM has interference (amplitudes, not probabilities) — no brain/AI analog
- Non-locality (entanglement) — no brain/AI analog
- "What believes at the quantum level?" — no agent to anchor inference

**What to do instead:** Stay with triple parallel (brain, computer, AI). QM is philosophical inspiration, not engineering guidance.

### Anti-Pattern 3: Emergence Without Mechanism

**The mistake:** "X emerges from Y" without showing the derivation.

**Why it fails:** "Emergence" becomes a placeholder for "we can't explain this." No explanatory power.

**What to do instead:** Either show the derivation chain, or acknowledge "we observe X but don't derive it."

### Anti-Pattern 4: Necessity From Constraints

**The mistake:** "Physics constraints REQUIRE this specific architecture."

**Why it fails:** Constraints create possibility spaces, not single points. Multiple architectures can satisfy the same constraints.

**What to do instead:** Say "constraints allow" or "constraints create pressure toward" not "constraints require."

### Anti-Pattern 5: Framework Reification

**The mistake:** "Systems work BECAUSE they minimize free energy."

**Why it fails:** FEP/Bayesian frameworks are descriptive lenses, not explanatory theories. FEP may be unfalsifiable (everything can be described as minimizing free energy).

**What to do instead:** Use frameworks as design heuristics. Say "within the FEP framework, this can be described as..." not "this works because of FEP."

### Anti-Pattern 6: Sequential Subsystem Design

**The mistake:** Fully designing one subsystem before defining others.

**Why it fails:** Creates integration debt. One subsystem gets fully specified while others remain vague, leading to artificial constraints.

**What to do instead:** Parallel development — grow all subsystems at similar levels of definition. Define interfaces before algorithms.

---

## Context

### What This Changes

#### Previous Approach (Empirical-Only)

- Build something that seems right
- Test it empirically
- Iterate based on results
- Problem: No foundation to iterate from

#### New Approach (Cognitive + Empirical)

- Define information structure
- Derive necessary operations
- Build computational models
- Translate to implementation
- Validate empirically
- Iterate based on model-informed hypotheses

The empirical phase becomes more productive because you know what you're testing and why.

### Relationship to Empirical Development

This methodology **extends** empirical development, not replaces it:

- Empirical philosophy: "You must learn through rapid experiments"
- Cognitive methodology: "Here's how to design experiments worth running"

The empirical mindset remains essential for validation. The cognitive framework provides structure for what to build and test.

### When To Use This Methodology

| Use Cognitive Software Development When | Use Traditional Development When |
|----------------------------------------|----------------------------------|
| System processes knowledge/information | System processes data mechanically |
| "Attention" or "relevance" matters | All inputs treated equally |
| Memory/retrieval is a core function | Stateless or simple state |
| Decisions under uncertainty | Deterministic logic |
| LLMs or cognitive components involved | No cognitive components |

Not all software is cognitive software. But Kahuna is deeply cognitive — every component benefits from this approach.

---

## Glossary

| Term | Definition |
|------|------------|
| **Information Structure** | The abstract organization of information that enables cognitive operations |
| **Cognitive Computer Science** | Computational study of cognition; treats cognitive functions as information-processing modules |
| **Computational Model** | Specification of a cognitive function: goal, inputs, outputs, interfaces |
| **Marr's Framework** | Three-level analysis: computational, algorithmic, implementational |
| **Interface** | The contract between cognitive modules — what each provides and requires |
| **Cherry-picking** | Selecting specific cognitive functions to model without modeling the whole |
| **Triple Parallel** | Brain ↔ Computer ↔ AI comparison used to validate design decisions |
| **Structural Invariant** | Property that appears across all information processing systems due to constraints |
| **Claim Strength** | Classification of claims as Established, Derived, Observed, or Hypothesis |
| **Framework Reification** | The error of treating descriptive frameworks as explanatory theories |

---

## Changelog

- v2.0 (2026-03-07): Major revision incorporating methodology insights from cognitive architecture session
  - Added "The Derivation Pattern" section
  - Added "Triple Parallel Validation" section with structural invariants
  - Added "Claim Strength Classification" section
  - Added "Bayesian Model as Design Heuristic" section
  - Added "The LLM Completion Model" section
  - Added "Anti-Patterns: What to Avoid" section
  - Added parallel development approach
  - Added quick reference checklists
  - Updated glossary with new terms
- v1.0 (2026-03-04): Initial methodology definition
