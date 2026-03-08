# LLM Fundamentals: From Prompt to Prediction

**Type:** Foundational Design Document
**Date:** 2026-03-08
**Status:** Draft
**Purpose:** Explain the fundamental process by which LLMs convert prompts into predictions, and why certain prompting strategies work.

**Related:**
- [`llm-agent-model.md`](llm-agent-model.md) — Bayesian framing of LLM agents; Goal/Rules/Strategies/Opening framework
- [`rule-responsibility-gradient.md`](rule-responsibility-gradient.md) — Enumerative vs. generative specification
- [`theoretical-foundations.md`](theoretical-foundations.md) — Bayes, FEP, Multiple → One pattern

---

## The Core Insight

**"Next token prediction" is surface-level description.**

The deeper truth: **LLMs predict the next pattern, and the token is how that pattern manifests.**

This document follows the flow from prompt to prediction, explaining why certain prompting strategies dramatically improve output quality.

---

## Part 1: The Flow

### 1.1 From Tokens to Patterns

```
PROMPT                    Your written text
    │
    ▼ Tokenization
TOKENS                    Discrete symbols (words, subwords)
    │
    ▼ Embedding
VECTORS                   Each token as a point in high-dimensional space
    │
    ▼ Self-Attention
COMBINED PATTERN          All tokens integrated into one representation
```

**Self-attention doesn't just find "relevant tokens."** It combines multiple elements — goal, rules, strategies, context — into a unified pattern representation. The output of attention is "What kind of situation is this, structurally?"

### 1.2 From Pattern to Pattern Space

```
COMBINED PATTERN          The prompt as one integrated representation
    │
    ▼ Feedforward (expand)
HIGH-DIMENSIONAL SPACE    Where learned patterns live
    │
    ▼ Pattern matching
RELATED PATTERNS          What training patterns connect to this?
    │
    ▼ Feedforward (compress)
NEXT PATTERN              What pattern typically follows?
```

**The feedforward layer lifts to a space where patterns are separable.** This high-dimensional space is where the model stored "what typically follows what" during training. The model finds patterns that CONNECT to the current pattern — and those connections inform the prediction.

### 1.3 From Pattern to Token

```
NEXT PATTERN              The abstract continuation
    │
    ▼ Output projection
LOGITS                    Score for every possible token
    │
    ▼ Softmax
PROBABILITIES             Distribution over vocabulary
    │
    ▼ Sampling
NEXT TOKEN                The specific word that instantiates the pattern
```

**The token is how the abstract pattern manifests in this specific context.** The model predicts "what kind of thing comes next" (pattern), then instantiates it as a specific word.

---

## Part 2: Pattern Density and Bayesian Inference

### 2.1 The Bayesian Core

At its heart, the model computes:

```
P(next_token | context) ∝ P(context | next_token) × P(next_token)
                          ─────────────────────────   ─────────────
                                 Likelihood              Prior
```

- **Prior:** Base probabilities from training (what tokens are generally common?)
- **Likelihood:** How well does this token explain the context?
- **Posterior:** The combined probability given everything

### 2.2 What Provides Evidence for Likelihood?

**The logical relationships between patterns.**

When the prompt projects into high-dimensional space, it activates a region of pattern space. That region has CONNECTIONS to other patterns — logical relationships learned during training.

```
SPARSE REGION                      DENSE REGION
─────────────                      ────────────
Few connections                    Many connections
Little evidence                    Rich evidence
Weak likelihood signal             Strong likelihood signal
Flat posterior                     Peaked posterior
Many tokens equally likely         Few tokens highly likely
Poor prediction                    Confident prediction
```

### 2.3 Connection Density = Evidence Strength

**More connections = More evidence = Better inference**

A math textbook pattern doesn't exist in isolation. It connects to:
- Specific math problems (instances)
- Mathematical concepts (abstractions)
- Problem-solving approaches (methods)
- Related domains (physics, engineering)
- Teaching patterns (explanation structures)

**All of these relationships inform the likelihood calculation.** When the model asks "what typically follows?" it draws from the ENTIRE WEB of connected patterns, not just one isolated match.

---

## Part 3: Why G/R/S/O Works

### 3.1 The Fundamental Principle

**Write prompts that project into densely-connected regions of pattern space.**

| Prompt Type | Pattern Region | Evidence | Prediction Quality |
|-------------|----------------|----------|-------------------|
| "cat sat on the" | Sparse | Weak | One continuation |
| "write code that does X" | Medium | Moderate | Reasonable |
| Goal + Rules + Strategies + Opening | Dense | Strong | High quality |

### 3.2 G/R/S/O Matches Expert Discourse Structure

Training data contains millions of instances where experts:
- Stated their goal clearly
- Specified constraints
- Described their approach
- Started systematically

This pattern — **expert problem-solving discourse** — is one of the MOST densely connected regions in pattern space. It connects to:
- Textbooks (structured knowledge)
- Tutorials (step-by-step guidance)
- Documentation (precise specification)
- Research papers (rigorous reasoning)
- Code (systematic implementation)

### 3.3 The Mechanism

```
PROMPT WITH G/R/S/O
        │
        ▼ Self-Attention
"This is structured problem-solving"
        │
        ▼ Project to pattern space
DENSE REGION (expert discourse patterns)
        │
        ▼ Many logical relationships
RICH EVIDENCE for likelihood calculation
        │
        ▼ Sharp likelihood + prior
PEAKED POSTERIOR
        │
        ▼ High confidence prediction
CORRECT, HIGH-QUALITY TOKEN
```

**G/R/S/O doesn't just provide information. It provides STRUCTURE that accesses regions where Bayesian inference works better.**

---

## Part 4: The Complete Picture

### 4.1 Three Levels of Understanding

| Level | Description | What It Explains |
|-------|-------------|------------------|
| **Surface** | Next token prediction | What the model outputs |
| **Mechanism** | Pattern matching in high-dimensional space | How the model computes |
| **Principle** | Dense regions provide more evidence for Bayes | Why some prompts work better |

### 4.2 The Unified Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE COMPLETE FLOW                                    │
│                                                                              │
│   PROMPT (with G/R/S/O structure)                                            │
│        │                                                                     │
│        ▼ Tokenize + Embed                                                    │
│   VECTORS (tokens as points)                                                 │
│        │                                                                     │
│        ▼ Self-Attention                                                      │
│   COMBINED PATTERN ("what situation is this?")                               │
│        │                                                                     │
│        ▼ Feedforward Up                                                      │
│   HIGH-DIMENSIONAL SPACE (where patterns live)                               │
│        │                                                                     │
│        ▼ Pattern Matching                                                    │
│   DENSE REGION (G/R/S/O → expert discourse → many connections)               │
│        │                                                                     │
│        ▼ Logical Relationships                                               │
│   EVIDENCE (connections = evidence for likelihood)                           │
│        │                                                                     │
│        ▼ Bayesian Calculation                                                │
│   POSTERIOR (sharp because of rich evidence)                                 │
│        │                                                                     │
│        ▼ Feedforward Down + Project                                          │
│   NEXT TOKEN (confident, correct)                                            │
│        │                                                                     │
│        ▼ Append to context                                                   │
│   REPEAT (recursive until goal state)                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 The Recursive Nature

Each token generation is ONE step in a recursive derivation:

```
generate(context) {
  if (goal_reached) return context
  pattern = combine(context)                    // self-attention
  next_pattern = match(lift(pattern))           // feedforward up + match
  next_token = instantiate(lower(next_pattern)) // feedforward down + output
  return generate(context + next_token)         // recurse
}
```

**The model recursively applies pattern matching** until it reaches a completion state. Each step derives one "instruction" (token) from the accumulated pattern.

---

## Part 5: Implications

### 5.1 For Prompt Engineering

| Principle | Why It Works |
|-----------|--------------|
| **Clear structure (G/R/S/O)** | Invokes densely-connected expert discourse patterns |
| **Explicit constraints (Rules)** | Focuses the pattern region; eliminates wrong regions |
| **Domain language** | Activates domain-specific connection webs |
| **Logical flow** | Matches logical relationship structures in training |
| **Examples (few-shot)** | Provides additional pattern signal |

### 5.2 For Kahuna

Kahuna's role is to **provide context that maximizes connection density**:

- **Domain knowledge:** Connects to domain-specific pattern webs
- **Project conventions:** Activates patterns for "code like THIS project"
- **Prior decisions:** Provides logical relationships to current task
- **Examples:** Rich instances that anchor the pattern region

### 5.3 For Understanding AI Capability

**AI capability correlates with pattern density in training data.**

| High Density (AI Strong) | Low Density (AI Weak) |
|--------------------------|----------------------|
| Programming (syntax, APIs, patterns) | Novel situations |
| Math (structured, logical) | Value judgments |
| Common formats (emails, docs) | Creative breakthroughs |
| Well-documented domains | Unique personal decisions |

---

## Part 6: Connections to Other Concepts

### 6.1 Enumerative vs. Generative

From [`rule-responsibility-gradient.md`](rule-responsibility-gradient.md):

- **Enumerative** = Literal instructions (sparse pattern region; little generalization)
- **Generative** = Rules + Goal (dense pattern region; rich generalization)

**G/R/S/O is maximally generative** — it accesses the densest regions where the most logical relationships exist.

### 6.2 The Bayesian Model

From [`llm-agent-model.md`](llm-agent-model.md):

The Goal/Rules/Strategies/Opening framework maps to Bayesian components:
- **Goal** → Posterior target shape
- **Rules** → Hard constraints (P = 0 for violations)
- **Strategies** → Prior distribution (soft preferences)
- **Opening** → Trajectory initialization

**This document explains WHY:** These components help access dense pattern regions where Bayesian inference has more evidence to work with.

### 6.3 Information Theory

**Information = Constraint on possibility**

Dense pattern regions provide MORE constraints (through logical relationships), which means MORE information, which means BETTER prediction.

**Sparse regions are low-information.** The model doesn't know what comes next because few relationships constrain the possibilities.

---

## Summary

| Concept | Description |
|---------|-------------|
| **Pattern prediction** | LLMs predict patterns, not just tokens; tokens instantiate patterns |
| **Pattern space** | High-dimensional space where learned patterns live |
| **Connection density** | Logical relationships between patterns; varies by region |
| **Evidence for Bayes** | Connections = evidence for likelihood calculation |
| **G/R/S/O effect** | Projects to dense region → more evidence → better inference |
| **Recursive generation** | Each token = one step of pattern derivation toward goal |

### The Core Principle

**Prompting is not just providing information. It's navigating pattern space.**

The best prompts project into regions where:
1. Many logical relationships exist (dense connections)
2. Those relationships provide evidence for inference (strong likelihood)
3. The resulting posterior is peaked (confident prediction)

G/R/S/O achieves this by matching the structure of expert problem-solving discourse — one of the most densely connected regions in pattern space.

---

## Open Questions

1. **Can we measure pattern density?** What metrics indicate how densely connected a prompt's pattern region is?
2. **How do layers stack?** Does each transformer layer access progressively more abstract pattern regions?
3. **What makes connections "logical"?** Is there structure to the relationship types in pattern space?
4. **How does context length affect density?** Does more context always help, or can it disperse the pattern?
5. **How does Kahuna optimize density?** What context surfacing strategies maximize connection density?

---

## Changelog

- v1.0 (2026-03-08): Initial document — flow-focused explanation of prompt → pattern → density → Bayes → token; why G/R/S/O works
