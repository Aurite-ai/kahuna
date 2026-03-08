# The Rule-Responsibility Gradient

**Type:** Foundational Design Document
**Date:** 2026-03-08
**Status:** Draft
**Purpose:** Define the theoretical framework for understanding where AI has value, how to measure automation difficulty, and how Kahuna extends the automatable frontier.

**Related:**
- [`llm-agent-model.md`](llm-agent-model.md) — LLM as Bayesian inference engine; Goal/Rules/Strategies/Opening framework
- [`cognitive-computer-architecture.md`](../01-product/cognitive-computer-architecture.md) — The Cognitive Computer subsystems
- [`meta-cognition.md`](meta-cognition.md) — Meta-cognition as gradient interface manager

---

## Executive Summary

This document introduces the **Rule-Responsibility Gradient** — a framework for understanding where AI can automate work and where human judgment remains essential.

**Core Insight:** Every task sits on a gradient defined by how **enumerative** vs. **generative** its specification is. Enumerative = literal instructions (decisions pre-made). Generative = rules + strategies + goal (decisions derived at runtime). This gradient — not whether we call something "cognitive" or "digital" — determines AI capability.

**Key Claims:**
1. AI capability is highest where derivation load is low (enumerative specification)
2. AI capability diminishes as derivation load increases (generative specification)
3. The far right of the gradient represents 'G' — pure generative capacity, where only Bayes' theorem remains
4. Kahuna shifts tasks leftward by providing better generative structure (rules/strategies), reducing derivation load
5. "Cognitive" vs "digital" labor are emergent properties of this gradient, not the axis itself
6. Rules and strategies are two polarities of the same thing: **generative decision procedures**

---

## Part 1: The Gradient

### 1.1 The Core Concept

Every task can be characterized by two dimensions:

| Dimension | Definition | Examples |
|-----------|------------|----------|
| **Rules** | Pre-defined instructions that constrain decisions | Syntax rules, API specs, style guides, patterns, constraints |
| **Responsibilities** | Decisions that must be made without explicit guidance | What approach to take, what counts as success, what matters |

**The Gradient = Responsibilities / Rules**

- **Low ratio** (many rules, few responsibilities) → High AI capability
- **High ratio** (few rules, many responsibilities) → Human judgment required

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        THE RULE-RESPONSIBILITY GRADIENT                          │
│                                                                                  │
│   LOW RATIO                                                   HIGH RATIO        │
│   ◄─────────────────────────────────────────────────────────────────────────►   │
│                                                                                  │
│   MANY RULES                                                  FEW RULES         │
│   FEW DECISIONS                                               MANY DECISIONS    │
│   ═══════════════                                             ═════════════     │
│                                                                                  │
│   AI executes                                                 Human decides     │
│   Rules determine output                                      Judgment required │
│   Verification is automatic                                   Verification needs│
│                                                               understanding     │
│                                                                                  │
│   EMERGENT PROPERTY:                                          EMERGENT PROPERTY:│
│   What we call "digital labor"                                What we call 'G'  │
│                                                                                  │
│   Examples:                                                   Examples:         │
│   • File I/O                                                  • Goal setting    │
│   • Code generation                                           • Value judgment  │
│   • Text formatting                                           • "Is this good?" │
│   • Pattern matching                                          • Trust decisions │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 The Key Distinction

**The axis is the ratio, not the type of labor.**

Tasks aren't inherently "cognitive" or "digital" — they have a rule/responsibility ratio, and that ratio determines where they sit. What we **call** "cognitive labor" is tasks with high ratios (few rules, many decisions). What we **call** "digital labor" is tasks with low ratios (many rules, few decisions).

This matters because:
- **The ratio is measurable** — Count rules, count open decisions
- **The ratio is predictive** — Higher ratio → lower AI capability
- **The ratio is actionable** — Improve ratio by providing better decision-prompting

### 1.3 Why This Explains AI Capability

AI has been most successful where **rule density is highest**:

| Domain | Rule Density | AI Success |
|--------|--------------|------------|
| **Programming** | Extremely high (syntax, types, APIs) | Early success (Copilot, etc.) |
| **Image generation** | High (rendering rules, physics) | Photorealistic results |
| **Text formatting** | High (grammar, structure) | Near-perfect |
| **Analysis** | Medium (some patterns, some judgment) | Good with guidance |
| **Strategy** | Low (principles, no determinism) | Requires human oversight |
| **Values/Goals** | Near-zero (pure judgment) | Cannot automate |

This isn't coincidence — it's structural. AI learns patterns from rules. More rules = more patterns = better AI.

### 1.4 The Funnel Shape

As you move rightward on the gradient (increasing ratio), the number of distinct tasks **decreases**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        THE RESPONSIBILITY FUNNEL                                 │
│                                                                                  │
│   LOW RATIO (Many rules)                                      HIGH RATIO        │
│                                                                                  │
│   ████████████████████████████████████████████████████████████                  │
│   █ Many tasks, each with many rules                        █                  │
│   █ Programming: syntax, types, APIs, patterns              █                  │
│   █ Design tools: filters, blend modes, layer ops           █                  │
│   ████████████████████████████████████████████████████████████                  │
│             ████████████████████████████████████████████████████                │
│             █ Fewer tasks, mix of rules and open decisions   █                  │
│             █ Analysis: some patterns, some interpretation   █                  │
│             ████████████████████████████████████████████████████                │
│                       ████████████████████████████████████████████              │
│                       █ Fewer still, mostly decisions        █                  │
│                       █ Strategy: principles, not rules      █                  │
│                       ████████████████████████████████████████████              │
│                                 ██████████████████████████████████████          │
│                                 █ Goal-setting, values, intent        █          │
│                                 ██████████████████████████████████████          │
│                                           ██████████████████████████████████    │
│                                           █ ONE: Bayesian inference         █    │
│                                           █ No rules except P(H|E)          █    │
│                                           ██████████████████████████████████    │
│                                                                                  │
│   The funnel narrows because rules can be automated.                            │
│   What remains are pure decisions — converging toward 'G'.                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: The 'G' Asymptote

### 2.1 What Lies at the Far Right?

At the far right of the gradient, you have:
- **ONE rule:** Bayes' theorem — P(H|E) ∝ P(E|H) × P(H)
- **INFINITE responsibilities:** Everything else

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            THE 'G' ASYMPTOTE                                     │
│                                                                                  │
│   BAYES' THEOREM: The only rule at the far right                                │
│   ══════════════════════════════════════════════                                 │
│                                                                                  │
│   P(H|E) = P(E|H) × P(H) / P(E)                                                 │
│                                                                                  │
│   This tells you HOW to update beliefs given evidence.                          │
│   It tells you NOTHING about:                                                   │
│                                                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │                                                                         │    │
│   │   • WHAT hypotheses to consider      (Define H)         RESPONSIBILITY │    │
│   │   • WHAT to believe initially        (Define P(H))      RESPONSIBILITY │    │
│   │   • WHAT counts as evidence          (Define E)         RESPONSIBILITY │    │
│   │   • HOW likely evidence is           (Estimate P(E|H))  RESPONSIBILITY │    │
│   │   • WHAT to do with the answer       (Act on P(H|E))    RESPONSIBILITY │    │
│   │   • WHETHER the result is good       (Evaluate)         RESPONSIBILITY │    │
│   │                                                                         │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│   This is 'G' — the general intelligence factor.                                │
│   ONE rule. INFINITE responsibilities.                                          │
│   Maximum ratio. Minimum AI capability.                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Why 'G' Is the Asymptote

**Observation:** As AI improves, it handles tasks further right on the gradient — managing more responsibilities with less explicit guidance. But it can never reach the far right because:

1. **No rules to learn:** Pattern-matching requires patterns. At the far right, there are none.
2. **Self-referential:** Defining P(H) requires choosing what to believe before seeing evidence.
3. **Value-laden:** Defining success requires values. Values aren't learnable from patterns.

**Conjecture:** 'G' is what remains after you automate everything that CAN be automated. Whatever humans still provide after "maxing out" AI — that's 'G'.

### 2.3 The Residue Principle

As AI capability increases:
- Tasks with low ratios become fully automated
- Tasks with medium ratios become assistable
- The "human-required" threshold shifts rightward

But the rightmost region never fully automates:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        THE RESIDUE PRINCIPLE                                     │
│                                                                                  │
│   2020:  ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             │
│          AI handles ─────────────► Human handles ───────────────────►            │
│                                                                                  │
│   2025:  ██████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░             │
│          AI handles ─────────────────────────► Human handles ──────►             │
│                                                                                  │
│   2030?  ████████████████████████████████████████████████████░░░░░░░             │
│          AI handles ────────────────────────────────────────► Human?             │
│                                                                                  │
│   LIMIT: ████████████████████████████████████████████████████████████░           │
│          AI handles ─────────────────────────────────────────────────► 'G'       │
│                                                                                  │
│   Whatever remains at the LIMIT is 'G' by definition.                           │
│   The ratio approaches infinity. The rules approach zero.                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Decision-Prompting

### 3.1 How AI Handles the Middle

For tasks in the middle of the gradient (neither rule-dense nor pure judgment), AI needs something beyond literal instructions. This is **decision-prompting** — enabling good decisions without specifying each one.

The framework comes from teaching chess (see [`llm-agent-model.md`](llm-agent-model.md)):

| Component | Chess Teaching | AI Prompting | Bayesian Role |
|-----------|---------------|--------------|---------------|
| **Goal** | Checkmate the opponent | What the task should achieve | Posterior target |
| **Rules** | How pieces move | Constraints that must be obeyed | Hard constraints (P=0) |
| **Strategies** | Control center, develop pieces | What tends to work | Prior distribution |
| **Opening** | First moves (e4, d4) | How to start | Trajectory initialization |

**Key insight:** You can't provide literal instructions for chess (too many positions). You provide **decision-prompting** — tools for making good decisions in novel situations. This **lowers the effective ratio** by providing implicit guidance where explicit rules don't exist.

### 3.2 Decision-Prompting Lowers the Ratio

Decision-prompting doesn't add literal rules. It provides:

| Component | How It Lowers Ratio | Example |
|-----------|---------------------|---------|
| **Goal** | Reduces "what are we trying to do?" responsibility | "Match project patterns" vs "write good code" |
| **Rules** | Adds explicit constraints | "Use these conventions" |
| **Strategies** | Adds implicit guidance (prior) | "Prefer approach X when Y" |
| **Opening** | Reduces "how do I start?" responsibility | "Begin with step Z" |

The task's **underlying ratio** doesn't change, but the **effective ratio** decreases because decision-prompting provides guidance where explicit rules don't exist.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DECISION-PROMPTING EFFECT ON RATIO                            │
│                                                                                  │
│   WITHOUT DECISION-PROMPTING                                                     │
│   ══════════════════════════                                                     │
│   Responsibilities: Define goal, choose approach, decide success                │
│   Rules: Generic language syntax, generic patterns                              │
│   Ratio: HIGH → AI struggles                                                    │
│                                                                                  │
│   WITH DECISION-PROMPTING (Goal/Rules/Strategies/Opening)                        │
│   ═══════════════════════════════════════════════════════                        │
│   Responsibilities: Execute within guidance                                     │
│   Rules: Explicit + implicit guidance from G/R/S/O                              │
│   Ratio: LOWER → AI performs better                                             │
│                                                                                  │
│   Decision-prompting doesn't change the TASK.                                   │
│   It changes the EFFECTIVE RATIO by providing guidance.                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 How Kahuna Shifts Tasks Leftward

Kahuna improves **decision-prompting quality** through context:

| Component | Generic (Without Kahuna) | Context-Aware (With Kahuna) |
|-----------|-------------------------|----------------------------|
| **Goal** | "Write good code" | "Match project patterns, pass existing tests" |
| **Rules** | Generic language rules | Project-specific conventions, constraints |
| **Strategies** | Training data heuristics | Project-specific patterns, preferences |
| **Opening** | Generic starting point | Context-informed first steps |

**Result:** Tasks that previously required human guidance become more automatable because better decision-prompting lowers the effective ratio.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    KAHUNA'S VALUE PROPOSITION                                    │
│                                                                                  │
│   WITHOUT KAHUNA                                                                 │
│   ══════════════                                                                 │
│   ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             │
│   Low ratio ──────────────────► High ratio ──────────────────────────►           │
│   (Automatable)                 (Needs human)                                   │
│                                                                                  │
│   WITH KAHUNA                                                                    │
│   ═══════════                                                                    │
│   ██████████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░             │
│   Low ratio ────────────────────────────────────► High ratio ────────►           │
│   (Automatable with context)                      (Still needs human)           │
│                                                                                  │
│   The "automatable frontier" shifts rightward.                                  │
│   Tasks that required human judgment now work with AI + good context.           │
│   The shift happens because better decision-prompting lowers effective ratio.   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Relationship to Triple Parallel

### 4.1 What Triple Parallel Measures

The triple parallel (Brain ↔ Computer ↔ AI) asks: **Does this cognitive function EXIST across all three domains?**

This validates whether a function is structurally necessary (appears in all three) or contingent (domain-specific).

### 4.2 What the Gradient Measures

The gradient asks: **What is the rule-to-responsibility ratio for this function?**

This predicts AI capability and guides intervention design.

| Function | Gradient Position (Ratio) | Implication |
|----------|---------------------------|-------------|
| Memory operations | Low (high rule density) | Highly automatable |
| Pattern retrieval | Low-Medium | Automatable with good context |
| Planning | Medium | Assistable, needs guidance |
| Strategy selection | Medium-High | Human-led, AI supports |
| Meta-cognitive judgment | High (low rule density) | Human provides, AI cannot |

### 4.3 The Combined Framework

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              TRIPLE PARALLEL + RULE-RESPONSIBILITY GRADIENT                      │
│                                                                                  │
│   TRIPLE PARALLEL answers:                                                       │
│   • What cognitive functions must exist?                                        │
│   • Where do they exist across domains?                                         │
│   • Which are structurally necessary vs contingent?                             │
│                                                                                  │
│   GRADIENT answers:                                                              │
│   • What is the rule/responsibility ratio for each function?                    │
│   • What determines AI capability? (The ratio)                                  │
│   • How can we shift tasks leftward? (Better decision-prompting)                │
│                                                                                  │
│   COMBINED:                                                                      │
│   For each cognitive function:                                                  │
│   1. Does it exist? (Triple Parallel)                                           │
│   2. What's its ratio? (Gradient position)                                      │
│   3. Can AI handle it? (Ratio analysis)                                         │
│   4. How to improve? (Decision-prompting quality)                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Implications for Meta-cognition

### 5.1 Meta-cognition on the Gradient

Meta-cognition isn't at ONE position — different meta-cognitive functions have different ratios:

| Meta-cognitive Function | Ratio | AI Capability |
|------------------------|-------|---------------|
| **Self-modification** (mode switching, task creation) | Low-Medium | High — tools exist, rules are clear |
| **Progress tracking** (todo lists, state management) | Medium | Medium — some guidance needed |
| **Error detection** (recognizing failure) | Medium-High | Low — needs feedback to know |
| **Confidence calibration** ("should I trust this?") | High | Very low — judgment required |
| **Goal judgment** ("is this what we want?") | Very High | None — this IS 'G' |

### 5.2 Gradient Interface Management

Meta-cognition's role is to manage the human-AI interface appropriately for the current task's ratio:

| Ratio | AI Behavior | Human Input |
|-------|-------------|-------------|
| Low | Execute autonomously, report results | Initial instruction, review on completion |
| Low-Medium | Draft, present for review | Approval, minor edits |
| Medium | Attempt, surface blockers | Strategy guidance |
| Medium-High | Present options, await decision | Selection, direction |
| High | Provide information only | All substantive decisions |

### 5.3 Why Triple Parallel Is Weak for Meta-cognition

The triple parallel rated meta-cognition as "Moderate" because:

1. **Brain:** Has 'G' — handles the full ratio spectrum internally
2. **Computer:** Distributed monitoring — requires administrator for high-ratio decisions
3. **AI:** Partial — requires user for high-ratio functions

Meta-cognition spans the entire gradient. The low-ratio functions (tools) have strong parallels. The high-ratio functions (judgment) require 'G' and therefore require human participation.

---

## Part 6: Design Implications

### 6.1 For Kahuna Development

1. **Focus on decision-prompting quality** — KB entries should improve Goal, Rules, Strategies, Opening
2. **Measure ratio shift** — Track whether tasks become more automatable with better context
3. **Respect the 'G' boundary** — Don't pretend AI can handle high-ratio functions

### 6.2 For Tool Design

1. **Match tool to ratio** — Low-ratio tools execute; high-ratio tools inform
2. **Surface uncertainty** — When ratio is medium, signal when guidance is needed
3. **Minimize cognitive load** — Optimize the human interface for their bandwidth

### 6.3 For Understanding AI Capability

1. **Ratio predicts capability** — High rule density → high AI capability
2. **'G' is the limit** — No amount of scale crosses the infinite-ratio asymptote
3. **Context is the lever** — Better decision-prompting lowers effective ratio

---

## Summary

### The Framework

| Concept | Definition |
|---------|------------|
| **Gradient** | Spectrum from enumerative (literal instructions, low derivation) to generative (rules + goal, high derivation) |
| **Enumerative** | Literal instructions; decisions pre-made; explicit specification |
| **Generative** | Rules + strategies + goal; decisions derived at runtime; compressed specification |
| **Derivation load** | How much cognitive work (applying rules toward goal) remains to be done |
| **'G'** | Pure generative capacity — derivation when no compression exists; the asymptote |
| **Rules & Strategies** | Two polarities of generative decision procedures (constraints vs. heuristics) |
| **Kahuna's role** | Provide better generative structure → reduce derivation load → extend automatable frontier |

### Key Claims

| Claim | Strength |
|-------|----------|
| AI capability correlates inversely with derivation load | **Observed** (empirically validated) |
| Gradient measures enumerative vs. generative specification | **Derived** (from analysis) |
| Rules and strategies are polarities of generative procedures | **Derived** (same function, different polarity) |
| Gradient narrows rightward (funnel shape) | **Derived** (enumerable gets automated, derivation remains) |
| 'G' is pure generative capacity | **Hypothesis** (strong conjecture) |
| Kahuna reduces derivation load via better generative structure | **Derived** (from Bayesian model of LLM) |

### Relationship to Other Documents

| Document | Relationship |
|----------|-------------|
| [`cognitive-computer-architecture.md`](../01-product/cognitive-computer-architecture.md) | This explains WHERE each subsystem sits on the gradient |
| [`llm-agent-model.md`](llm-agent-model.md) | This explains HOW decision-prompting works (Bayesian framing) |
| [`meta-cognition.md`](meta-cognition.md) | This explains WHY meta-cognition spans the whole gradient |
| [`tools-prompts-framework.md`](tools-prompts-framework.md) | This explains HOW tools implement derivation-appropriate interfaces |

---

## Part 7: The Deeper Concept — Enumerative vs. Generative Specification

### 7.1 The Core Distinction

The Rule-Responsibility Gradient, at its deepest level, measures the degree to which task specification is **enumerative** versus **generative**.

| Enumerative | Generative |
|-------------|------------|
| Literal instructions | Rules + Strategies + Goal |
| Steps pre-computed | Steps derived at runtime |
| Explicit enumeration | Compressed representation |
| "Do A, then B, then C" | "Achieve X by following Y" |
| Agent executes | Agent derives |

**Analogy:** Printing 1-100 with 100 print statements (enumerative) vs. a for-loop (generative). Both produce the same output, but the for-loop is compressed — it requires derivation at runtime.

### 7.2 Literal Instructions vs. Rules

The key distinction that reveals the gradient:

**Literal instructions** = Decisions already made
- "Play e4 to start" (exact move specified)
- Pre-computed; no decision needed
- Agent executes without reasoning

**Rules + Strategies** = How to make decisions
- "Control the center" (principle that guides moves)
- Generative; applies to many situations
- Agent must derive the appropriate action

**The trade-off:**
- More literal instructions → fewer rules needed → less derivation
- Fewer literal instructions → more rules needed → more derivation
- At the limit: zero instructions, just Bayes' theorem → derive everything

### 7.3 Rules and Strategies as Two Polarities

Rules and strategies are **not different things** — they are two polarities of the same underlying concept: **generative decision procedures**.

| Rules (Negative Polarity) | Strategies (Positive Polarity) |
|---------------------------|--------------------------------|
| Constraints | Heuristics |
| What you CAN'T do | What you SHOULD do |
| Eliminate possibilities | Weight possibilities |
| "Don't move the pawn backward" | "Control the center" |

**The coin they share:** Both are functions that take (current state, goal) and inform (next action). Rules constrain the hypothesis space; strategies bias the probability distribution within it.

In Bayesian terms:
- **Rules** = Hard constraints (P = 0 for violations)
- **Strategies** = Soft priors (weighted probabilities)

Together, they form the **generative decision procedure** that derives literal actions from abstract goals.

### 7.4 The Gradient as Derivation Load

The gradient measures **derivation load** — how much cognitive work remains to be done:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DERIVATION LOAD GRADIENT                                  │
│                                                                                  │
│   LOW DERIVATION LOAD                                      HIGH DERIVATION LOAD │
│   ◄─────────────────────────────────────────────────────────────────────────►   │
│                                                                                  │
│   ENUMERATIVE                                              GENERATIVE           │
│   ═════════════                                            ══════════           │
│                                                                                  │
│   Literal instructions                                     Rules + Goal         │
│   Decisions pre-made                                       Decisions derived    │
│   Execute                                                  Reason               │
│   Low abstraction                                          High abstraction     │
│   Many symbols (high entropy)                              Few symbols (compressed)│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Connection to Information Theory

This reframing connects directly to information theory:

**Enumerative specification:**
- High entropy (many symbols needed)
- Incompressible (each step explicit)
- Information in the message itself

**Generative specification:**
- Low entropy (few symbols encode many outputs)
- Highly compressed (rules as compression algorithm)
- Information in the algorithm, not the message

**The gradient measures:** How much information is in the message (literal instructions) vs. how much is in the algorithm (rules/strategies applied to goal)?

**Compression = Rules**
A rule compresses infinitely many literal instructions into one statement:
- "Control the center" encodes a response for every possible board state
- The rule is the compression algorithm
- Applying the rule is decompression (derivation)

### 7.6 The Recursion Structure

Tasks with generative specification have a recursive structure:

```
Task Execution = {
  IF goal_reached THEN terminate
  ELSE apply(rules, strategies, current_state) → action
       execute(action) → new_state
       Task Execution(new_state)
}
```

This is isomorphic to a recursive function:
- **Termination condition** = Goal state
- **Recursive step** = Apply rules/strategies to derive next action
- **Generation at runtime** = Literal steps produced by expansion

The gradient measures how much expansion remains vs. how much is pre-expanded.

### 7.7 'G' as Pure Generative Capacity

At the far right of the gradient:
- Zero literal instructions
- Minimal rules (only Bayes' theorem)
- Abstract goal (undefined until inferred)
- Maximum derivation required

**'G' is pure generative capacity** — the ability to derive decisions from first principles when no compression (rules) is available.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            'G' AS PURE GENERATION                                │
│                                                                                  │
│   At 'G':                                                                        │
│   • No patterns to apply (no compression possible)                              │
│   • Each situation is unique                                                    │
│   • Only Bayes' theorem remains: P(H|E) ∝ P(E|H) × P(H)                         │
│   • But P(H) — the prior — must come from somewhere                             │
│   • That "somewhere" is 'G'                                                     │
│                                                                                  │
│   'G' = The capacity to generate priors when no domain structure exists         │
│   'G' = Pure derivation without compression                                     │
│   'G' = What creates meaning when patterns cannot                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.8 Triple Parallel Validation

Does the enumerative/generative distinction appear across all three domains?

| Domain | Enumerative | Generative |
|--------|-------------|------------|
| **Brain** | Reflexes, instincts (hardcoded responses) | Learned heuristics, reasoning (derived responses) |
| **Computer** | Lookup tables, switch statements | Functions, algorithms, recursion |
| **AI** | Few-shot examples (literal) | System prompts with principles (rules → derivation) |

**In all three domains:**
- Enumerative = pre-computed, explicit, low abstraction
- Generative = derived at runtime, compressed, high abstraction
- Trade-off between specification size and derivation load

**Validation:** The enumerative/generative gradient is a structural invariant across domains.

### 7.9 Implications for Kahuna

If the gradient measures enumerative vs. generative specification:

**Kahuna's role is to provide better generative structure** (rules, strategies, context) that reduces derivation load without reverting to enumeration.

| Without Kahuna | With Kahuna |
|----------------|-------------|
| Generic rules (training) | Domain-specific rules (KB) |
| Weak strategies | Strong strategies (project patterns) |
| High derivation load | Lower derivation load |
| More failures | More successes |

**This is why context matters:** Good context provides the rules and strategies that make generative derivation tractable. Without context, the LLM must derive from first principles — high 'G' requirement.

### 7.10 Summary of the Deeper Concept

The Rule-Responsibility Gradient is fundamentally the **Enumerative-Generative Gradient**:

| Concept | Definition |
|---------|------------|
| **Enumerative** | Literal instructions; decisions pre-made; explicit; high symbol count |
| **Generative** | Rules + strategies + goal; decisions derived at runtime; compressed |
| **Rules** | Generative decision procedures (negative polarity — constraints) |
| **Strategies** | Generative decision procedures (positive polarity — heuristics) |
| **Goal** | Termination condition for the recursive derivation |
| **Derivation load** | How much cognitive work remains (generativity of specification) |
| **'G'** | Pure generative capacity — derivation when no compression exists |

**Why this is more fundamental:**
1. Explains WHY the gradient exists (specification structure, not just "difficulty")
2. Connects to information theory (compression vs. enumeration)
3. Shows rules and strategies as same concept (generative procedures)
4. Explains 'G' as limit (pure derivation, no compression available)
5. Predicts AI capability from specification analysis
6. Guides Kahuna design (provide generative structure, reduce derivation load)

---

## Open Questions

1. **Can we measure derivation load empirically?** What metrics indicate how much derivation a task requires?
2. **Does the 'G' boundary shift over time?** Or is it fixed by the nature of cognition?
3. **What IS 'G' precisely?** Beyond "pure generative capacity"?
4. **How do we know if decision-prompting is improving?** What metrics track effective derivation load reduction?
5. **Is there an optimal Kahuna intervention point?** Where on the gradient does better context have the most impact?
6. **How does the recursive structure relate to hierarchical planning?** Are multi-step tasks nested generative specifications?

---

## Changelog

- v1.0 (2026-03-08): Initial framework — gradient, 'G' asymptote, decision-prompting, relationship to triple parallel
- v1.1 (2026-03-08): Renamed from "Cognitive Labor Gradient" to "Rule-Responsibility Gradient" for precision; clarified that cognitive/digital are emergent properties of ratio, not the axis itself
- v2.0 (2026-03-08): Added Part 7 — The deeper concept (enumerative vs. generative specification); rules and strategies as polarities of generative decision procedures; derivation load as the fundamental measure; 'G' as pure generative capacity
