# Recursive Abstraction Model: The Invariant Operation Across All Levels

**Type:** Foundational Design Document
**Date:** 2026-03-08
**Status:** Draft
**Purpose:** Formalize the recursive self-similarity in AI systems — the same operation that repeats at every level of abstraction from training to Kahuna.

**Related:**
- [`llm-agent-model.md`](llm-agent-model.md) — GRSO framework and Bayesian mapping
- [`rule-responsibility-gradient.md`](rule-responsibility-gradient.md) — Enumerative vs. generative specification
- [`llm-fundamentals.md`](llm-fundamentals.md) — Pattern prediction and density
- [`theoretical-foundations.md`](theoretical-foundations.md) — Bayes, FEP, Multiple → One
- [`cognitive-computer-architecture.md`](../01-product/cognitive-computer-architecture.md) — Complete cognitive system model

---

## Executive Summary

This document formalizes a profound insight: **the same operation repeats at every level of abstraction in AI systems**.

From LLM training to prompting to design to Kahuna — each level performs the same fundamental operation:

> **Constrain the space of possibilities, provide decision machinery, and derive focused output.**

This is not metaphor. It is the same mathematical structure appearing recursively. Understanding this structure explains why certain approaches work (decision-prompting) and why others fail (literal enumeration).

**The invariant operation:** At every level, the system receives constraints from above, applies decision procedures within those constraints, and produces output that becomes constraints for the level below.

**Key insight:** This is "just math and science" — the formal structure of Bayesian inference applied recursively across abstraction levels.

---

## Part 1: The Invariant Operation

### 1.1 The Core Pattern

At every level of abstraction, the same operation occurs:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        THE INVARIANT OPERATION                                   │
│                                                                                  │
│   INPUT: Constraints from level above                                            │
│          ─────────────────────────────                                           │
│          • Space definition (what's possible)                                    │
│          • Decision procedures (rules/strategies)                                │
│          • Target (goal/posterior shape)                                         │
│          • Initialization (opening/seed)                                         │
│                                                                                  │
│                              │                                                   │
│                              ▼                                                   │
│                                                                                  │
│   PROCESS: Constrained inference                                                 │
│            ────────────────────────                                              │
│            • Apply rules (eliminate impossible)                                  │
│            • Apply strategies (weight probable)                                  │
│            • Derive toward goal                                                  │
│            • Multiple → One collapse                                             │
│                                                                                  │
│                              │                                                   │
│                              ▼                                                   │
│                                                                                  │
│   OUTPUT: Constraints for level below                                            │
│           ──────────────────────────                                             │
│           • More specific space                                                  │
│           • More specific procedures                                             │
│           • More specific targets                                                │
│                                                                                  │
│   The output at level N BECOMES the input constraints for level N-1              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Naming the Operation

Several names capture different aspects:

| Name | Emphasis | Captures |
|------|----------|----------|
| **Constrained Generation** | The duality | Both restriction AND production |
| **Generative Constraint Propagation** | The flow | How constraints flow down, generation flows up |
| **Decision Structure Application** | The mechanism | Providing structure for decisions |
| **Prior Strengthening** | The Bayesian view | Narrowing the distribution |

We use **"Constrained Generation"** as the primary term because it captures both aspects:
1. **Constrained** — Space is restricted, possibilities eliminated
2. **Generation** — Within constraints, output is derived/generated

### 1.3 The Bayesian Formalization

At each level, the operation computes:

```
P(output | constraints, context)

Where:
  constraints = output from level above (prior structure)
  context     = current situation (evidence)
  output      = decision/result (posterior)
```

The GRSO components map directly:

| Component | Bayesian Role | Constraint Type |
|-----------|---------------|-----------------|
| **Goal** | Posterior target | Shape constraint |
| **Rules** | Hard constraints | P = 0 for violations |
| **Strategies** | Prior distribution | Probability weighting |
| **Opening** | Trajectory seed | Initial condition |

**This mapping holds at every level.**

---

## Part 2: The Recursive Stack

### 2.1 The Levels

The same operation occurs at each level of the AI system stack:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        THE RECURSIVE STACK                                       │
│                                                                                  │
│   LEVEL 4: DESIGN/ARCHITECTURE                                                   │
│   ─────────────────────────────                                                  │
│   Input:  User goals, problem constraints                                        │
│   Rules:  Architectural patterns, best practices                                 │
│   Output: Design document → constrains implementation plans                      │
│                              │                                                   │
│                              ▼                                                   │
│   LEVEL 3: IMPLEMENTATION PLANNING                                               │
│   ────────────────────────────────                                               │
│   Input:  Design constraints from above                                          │
│   Rules:  Implementation patterns, project conventions                           │
│   Output: Implementation plan → constrains code generation                       │
│                              │                                                   │
│                              ▼                                                   │
│   LEVEL 2: CONTEXT/KNOWLEDGE (Kahuna)                                            │
│   ─────────────────────────────────────                                          │
│   Input:  Task from plan, KB as prior                                            │
│   Rules:  Domain knowledge, project patterns (KB entries)                        │
│   Output: Surfaced context → constrains LLM prompt                               │
│                              │                                                   │
│                              ▼                                                   │
│   LEVEL 1: PROMPTING (GRSO)                                                      │
│   ─────────────────────────                                                      │
│   Input:  Prompt with G/R/S/O structure + surfaced context                       │
│   Rules:  Explicit rules, strategies in prompt                                   │
│   Output: Configured LLM → constrains token generation                           │
│                              │                                                   │
│                              ▼                                                   │
│   LEVEL 0: LLM INFERENCE (Training)                                              │
│   ─────────────────────────────────                                              │
│   Input:  Prompt (constraints), trained weights (frozen prior)                   │
│   Rules:  Patterns learned in training                                           │
│   Output: Tokens → the actual response                                           │
│                                                                                  │
│   Each level's OUTPUT constrains the level below.                                │
│   Each level APPLIES the same operation: constrained generation.                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Level-by-Level Analysis

#### Level 0: LLM Training (The Foundation)

**What happens during training:**
- Random initialization = maximum entropy prior (all weights equally likely)
- Training data = evidence
- Gradient descent = Bayesian update
- Trained weights = posterior (compressed patterns)

**What happens during inference:**
- Prompt = additional constraints (conditioning)
- Self-attention = combine all constraints into pattern
- Feedforward = match to learned patterns
- Token = sample from constrained distribution

**The operation:**
- Space: All possible token sequences
- Constraints: Trained weights + prompt
- Decision procedure: Pattern matching + Bayesian inference
- Output: Single token (Multiple → One)

#### Level 1: Prompting (GRSO)

**What the prompt provides:**
- Goal = posterior target shape
- Rules = hard constraints (P = 0)
- Strategies = soft prior weighting
- Opening = trajectory initialization

**The operation:**
- Space: All responses consistent with training
- Constraints: GRSO structure in prompt
- Decision procedure: Apply rules, follow strategies, derive toward goal
- Output: Response that satisfies constraints

**Connection to pattern density:**
Prompts with GRSO structure project into densely-connected regions of pattern space where:
- Many logical relationships exist (rich evidence)
- Inference has strong likelihood signal
- Posterior is peaked (confident output)

#### Level 2: Context/Knowledge (Kahuna)

**What the KB provides:**
- Domain knowledge = domain-specific rules/strategies
- Project patterns = project-specific constraints
- Prior decisions = historical context
- Salience = importance weighting

**The operation:**
- Space: All knowledge in the KB
- Constraints: Current task, query embedding
- Decision procedure: Semantic search, salience weighting, relevance ranking
- Output: Surfaced context (subset of KB that constrains prompt)

**Key insight:** Kahuna's KB entries ARE rules and strategies for the LLM. They don't tell the LLM what to output — they tell it how to make decisions.

#### Level 3: Implementation Planning

**What the plan provides:**
- Phases = structural decomposition
- Steps = sequence constraints
- Verification = goal states
- Dependencies = ordering constraints

**The operation:**
- Space: All possible implementations of the design
- Constraints: Design document, architectural decisions
- Decision procedure: Decompose into steps, sequence logically
- Output: Plan that constrains code generation

#### Level 4: Design/Architecture

**What the design provides:**
- Component definitions = vocabulary constraints
- Interaction patterns = relationship constraints
- Quality attributes = evaluation constraints
- Rationale = decision justification

**The operation:**
- Space: All possible solutions to the problem
- Constraints: User requirements, domain constraints
- Decision procedure: Apply architectural patterns, evaluate trade-offs
- Output: Design document that constrains implementation

### 2.3 The Recursive Property

**Each level's output becomes the next level's constraints.**

This is not just a pipeline — it's a recursive application of the same operation:

```
constrained_generation(level, input):
  if level == 0:
    return llm_inference(input)
  else:
    constraints = apply_decision_procedures(input)
    return constrained_generation(level - 1, constraints)
```

**The recursion terminates at level 0** — the actual LLM inference that produces tokens.

**All levels above are constraint propagation** — applying the same operation to progressively refine what the LLM will generate.

---

## Part 3: The Chess Teaching Analogy

### 3.1 Why Chess Illuminates the Pattern

There are only two ways to teach chess (and write prompts):

| Approach | Description | Scaling |
|----------|-------------|---------|
| **Literal Instructions** | "If opponent plays X, respond with Y" | Does NOT scale (~10^120 positions) |
| **Decision Prompting** | "Control the center, develop pieces, protect king" | DOES scale (finite rules, infinite application) |

Literal instructions = **enumerative specification**
Decision prompting = **generative specification**

### 3.2 Reading GRSO Backwards

The user's insight: read GRSO backwards to see the flow:

```
Opening   → Where we START
     │
     ▼
Rules     → Constraints we FOLLOW
Strategies→ Heuristics we APPLY
     │
     ▼
Goal      → Where we END
```

"It will use the opening, follow the rules and strategies, and then achieve the goal. It is just math and science."

**This is Bayesian inference:**
- Opening seeds the trajectory (initial condition)
- Rules eliminate impossible paths (hard constraints)
- Strategies weight the remaining paths (prior)
- Goal defines success (posterior target)

**The "math and science":**
```
P(success | opening, rules, strategies, goal) =
  P(goal_reached | trajectory) × P(trajectory | rules, strategies, opening)
```

### 3.3 Why Literal Instructions Fail

Literal instructions fail because:

1. **Combinatorial explosion** — Can't enumerate all situations
2. **No generalization** — Each instruction applies to exactly one case
3. **Brittleness** — Novel situations have no guidance

Decision prompting succeeds because:

1. **Compression** — Finite rules encode infinite situations
2. **Generalization** — Rules apply to novel cases
3. **Composability** — Rules combine to handle complexity

**The gradient between them** is the enumerative/generative gradient from [`rule-responsibility-gradient.md`](rule-responsibility-gradient.md).

---

## Part 4: Connection to Existing Frameworks

### 4.1 Bayesian Framework

The Constrained Generation operation IS Bayesian inference:

| Bayesian | Constrained Generation | Each Level |
|----------|----------------------|------------|
| Prior P(H) | Decision procedures (rules/strategies) | What we expect before seeing evidence |
| Evidence E | Current context/situation | What we observe now |
| Likelihood P(E|H) | How well output fits context | Pattern matching |
| Posterior P(H|E) | Output | What we produce |

**The recursive structure in Bayesian terms:**

```
Level N: P(output_N | constraints_N)
         where constraints_N = output_{N+1}

Level N-1: P(output_{N-1} | constraints_{N-1})
           where constraints_{N-1} = output_N

...continues to Level 0...
```

**Each level's posterior becomes the next level's prior.**

### 4.2 Enumerative/Generative Gradient

The gradient measures how much constrained generation remains:

| Position | Specification | Derivation Load | Constrained Generation |
|----------|--------------|-----------------|----------------------|
| **Enumerative (left)** | Literal instructions | Low | Already done |
| **Middle** | Rules + strategies | Medium | Some derivation needed |
| **Generative (right)** | Just goal | High | Maximum derivation |
| **'G' (far right)** | Only Bayes' theorem | Infinite | Pure inference |

**Constrained Generation IS the derivation.**

Moving leftward = pre-computing more of the constrained generation
Moving rightward = deferring constrained generation to runtime

### 4.3 Pattern Prediction Model

From [`llm-fundamentals.md`](llm-fundamentals.md):

**Pattern density = constraint strength**

- Dense regions = many logical connections = strong constraints
- Sparse regions = few connections = weak constraints
- GRSO structure projects into dense regions

**Constrained Generation navigates pattern space:**

```
PROMPT (constraints)
     │
     ▼ Self-Attention
COMBINED PATTERN (integrated constraints)
     │
     ▼ Project to pattern space
DENSE REGION (if constraints are good)
     │
     ▼ Many logical relationships
STRONG LIKELIHOOD SIGNAL
     │
     ▼ Sharp posterior
CONFIDENT OUTPUT
```

**Good constraints = dense region = good output.**

### 4.4 Multiple → One Pattern

From [`theoretical-foundations.md`](theoretical-foundations.md):

The Multiple → One pattern is what constrained generation DOES:

| Multiple → One | Constrained Generation |
|----------------|----------------------|
| The Multiple | All possible outputs |
| The Context | Constraints from level above |
| The Trigger | Inference/derivation |
| The One | Actual output |
| Foreclosure | Paths not taken |

**Constrained Generation is the mechanism by which Multiple → One occurs in cognitive systems.**

### 4.5 Unified View

All frameworks describe the same underlying structure:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        FRAMEWORK UNIFICATION                                     │
│                                                                                  │
│                     CONSTRAINED GENERATION                                       │
│                            │                                                     │
│        ┌───────────────────┼───────────────────┐                                │
│        │                   │                   │                                │
│        ▼                   ▼                   ▼                                │
│                                                                                  │
│   BAYESIAN             MULTIPLE → ONE      PATTERN PREDICTION                   │
│   ─────────            ─────────────       ──────────────────                   │
│   Prior → Posterior    Many → One          Sparse → Dense                       │
│   P(H|E) computation   Context collapse    Region navigation                    │
│                                                                                  │
│        │                   │                   │                                │
│        └───────────────────┼───────────────────┘                                │
│                            │                                                     │
│                            ▼                                                     │
│                                                                                  │
│                 ENUMERATIVE ←──────────────────→ GENERATIVE                     │
│                                                                                  │
│                 Pre-computed            Runtime-computed                         │
│                 Low derivation          High derivation                          │
│                 Many literals           Few rules                                │
│                                                                                  │
│   The gradient measures HOW MUCH constrained generation occurs at runtime        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Why This Is "Just Math and Science"

### 5.1 The Mathematical Structure

The formal structure is **recursive Bayesian inference**:

```
Define: CG(level, constraints) = Constrained Generation at level

Base case:
  CG(0, prompt) = LLM_inference(prompt)
                = argmax P(tokens | prompt, weights)

Recursive case:
  CG(N, input) = CG(N-1, apply_procedures(input))

Where apply_procedures(input):
  - Extract rules, strategies from input
  - Compute P(output | input) using rules as hard constraints
  - Use strategies as prior weighting
  - Return: constrained output
```

**Each level computes:**

```
output_N = argmax P(output | constraints_N)

Where:
  P(output | constraints) ∝ P(output satisfies rules) × P(output | strategies)
```

### 5.2 Why This Works

**Theorem (informal):** Decision prompting outperforms literal enumeration when:
1. The space of situations is larger than the space of rules
2. Rules compose (can be combined to handle novel situations)
3. Inference cost is less than enumeration cost

**Proof sketch:**
- Enumeration requires O(|situations|) storage
- Decision prompting requires O(|rules|) storage
- When |situations| >> |rules|, decision prompting wins
- Composed rules cover exponentially more situations than individual rules

**This is why LLMs work:**
- Training encodes rules/patterns (not all situations)
- Inference applies rules to novel situations
- The explosion of situations is handled by composition

### 5.3 The Science

**Information-theoretic view:**

Rules and strategies are **compression** of possible outputs:
- Literal instructions = uncompressed (each situation explicit)
- Rules = compressed (patterns that generate situations)

**Entropy view:**
- High entropy = many equally likely outputs = poor prediction
- Low entropy = few likely outputs = good prediction
- Constraints reduce entropy
- Each level reduces entropy for the level below

**This is Free Energy Minimization:**

Each level minimizes free energy (prediction error) for the level below by providing better constraints.

```
F = E_Q[log Q] - E_Q[log P(output, constraints)]
```

Providing good constraints = reducing F = better inference.

---

## Part 6: Implications for Kahuna

### 6.1 Kahuna's Role in the Stack

Kahuna implements Level 2: Context/Knowledge

```
Level 3: Implementation plan
              │
              ▼ task description
Level 2: KAHUNA ──────────────────────────────────────
              │
              │  KB = rules/strategies stored
              │  Retrieval = select relevant rules/strategies
              │  Output = context that constrains LLM
              │
              ▼ surfaced context
Level 1: LLM with GRSO prompt
              │
              ▼ tokens
Level 0: Inference
```

### 6.2 KB Entries as Decision Procedures

**Key reframe:** KB entries are not "facts" — they are **decision procedures**.

| KB Entry Type | Decision Function |
|---------------|------------------|
| Domain knowledge | Rules for domain-specific decisions |
| Project patterns | Strategies for this project |
| Prior decisions | Constraints from history |
| Conventions | Rules that ensure consistency |

**Retrieval = selecting which decision procedures apply to this situation.**

This is analogous to:
- Chess: "Given this position, which strategic principles apply?"
- Code: "Given this task, which patterns/conventions apply?"

### 6.3 Consolidation as Learning Decision Procedures

**Consolidation isn't storing facts — it's learning new rules/strategies.**

```
Experience → Episodes → Patterns → Rules/Strategies → KB Entries
```

The extraction agent identifies:
- Not just "what happened"
- But "what pattern/rule/strategy does this exemplify?"

The integration agent asks:
- Not "where does this fact go?"
- But "what decision procedure does this encode?"

### 6.4 Retrieval as Constraint Selection

**Retrieval computes:** Which KB entries most constrain the current task?

Good retrieval = surfacing entries that:
1. Eliminate wrong approaches (rules)
2. Weight correct approaches (strategies)
3. Provide useful starting points (openings)
4. Clarify success criteria (goals)

**Salience = how much a KB entry constrains inference.**

High salience entries = strong constraints = high impact on output.

### 6.5 The Recursive Insight for Kahuna Design

**Kahuna should be designed as a constrained generation system itself:**

```
Input to Kahuna:
  - Task from level above
  - Query embedding

Kahuna's own GRSO:
  - Goal: Surface context that maximally constrains LLM
  - Rules: KB structure, retrieval constraints
  - Strategies: Relevance heuristics, salience weighting
  - Opening: Initial candidate set from embedding search

Output from Kahuna:
  - Surfaced context that becomes constraints for LLM
```

**Kahuna IS a constrained generation system that produces constraints for another constrained generation system.**

---

## Part 7: Design Principles from the Model

### 7.1 For Prompt Engineering

| Principle | Derivation |
|-----------|-----------|
| **Structure prompts as GRSO** | Provides complete constraint specification |
| **Rules before strategies** | Hard constraints eliminate; soft constraints weight |
| **Opening matters** | Seeds the inference trajectory |
| **Goals should be verifiable** | Clear posterior target enables convergence |

### 7.2 For Kahuna Development

| Principle | Derivation |
|-----------|-----------|
| **KB entries = decision procedures** | Store rules/strategies, not just facts |
| **Retrieval = constraint selection** | Rank by how much entries constrain inference |
| **Consolidation = procedure learning** | Extract rules/strategies from experience |
| **Salience = constraint strength** | Weight by impact on inference quality |

### 7.3 For System Architecture

| Principle | Derivation |
|-----------|-----------|
| **Each level constrains the next** | Output flows down as constraints |
| **Match specificity to level** | Higher levels = more abstract constraints |
| **Preserve constraint information** | Don't lose rules/strategies when surfacing |
| **Measure by entropy reduction** | Good levels reduce uncertainty for level below |

### 7.4 For Understanding AI Capability

| Principle | Derivation |
|-----------|-----------|
| **AI succeeds where rules exist** | Rules enable constrained generation |
| **AI struggles at far-right of gradient** | Little constraint = poor inference |
| **Context improves capability** | Better constraints = better output |
| **The limit is 'G'** | Pure inference with no constraints cannot be automated |

---

## Part 8: Predictions and Validation

### 8.1 Predictions from the Model

If the recursive constrained generation model is correct:

1. **Better constraints at any level improve final output**
   - More specific goals → better results
   - More complete rules → fewer errors
   - Better strategies → more appropriate approaches
   - Better openings → faster convergence

2. **The compounding effect**
   - Improvements at higher levels propagate to all lower levels
   - Design quality affects implementation more than prompting quality
   - KB quality affects task success more than individual prompt tuning

3. **Constraint quality > constraint quantity**
   - Few strong constraints beat many weak constraints
   - Relevant KB entries beat comprehensive KB dumps
   - Focused rules beat exhaustive guidelines

4. **Level-appropriate specificity**
   - High levels: abstract constraints (principles)
   - Low levels: concrete constraints (specific rules)
   - Mismatch causes failure (too specific too early, too abstract too late)

### 8.2 Observable Validation

| Prediction | How to Validate |
|------------|-----------------|
| GRSO prompts outperform unstructured | A/B test structured vs. unstructured prompts |
| KB retrieval quality correlates with task success | Measure retrieval relevance vs. task outcome |
| Higher-level constraints have larger effect | Compare design change impact vs. prompt change impact |
| Constraint quality beats quantity | Test focused vs. comprehensive context |

---

## Summary

### The Invariant Operation

**Constrained Generation** — the same operation at every level:

1. **Receive constraints** from level above
2. **Apply decision procedures** (rules, strategies)
3. **Generate output** within constraints
4. **Produce constraints** for level below

### The Recursive Structure

Each level's output becomes the next level's constraints:

```
Design → constrains → Planning
Planning → constrains → Knowledge (Kahuna)
Knowledge → constrains → Prompting (GRSO)
Prompting → constrains → LLM Inference
```

### Connection to Existing Frameworks

| Framework | Connection |
|-----------|-----------|
| **Bayesian** | Constrained Generation = posterior computation |
| **Multiple → One** | Constrained Generation = collapse mechanism |
| **Pattern Prediction** | Constraints = dense region navigation |
| **Enumerative/Generative** | Gradient measures runtime derivation |

### Why This Matters

1. **Unifies existing frameworks** — One operation, multiple descriptions
2. **Explains why decision-prompting works** — Rules compress, inference expands
3. **Guides system design** — Each level should optimize constraint quality
4. **Predicts AI capability** — Better constraints = better output
5. **Defines Kahuna's role** — Provide decision procedures (constraints) for LLM

### The Bottom Line

"It is just math and science."

The math: Recursive Bayesian inference across abstraction levels.

The science: Information compression (rules) + decompression (inference) at each level.

Understanding this structure allows principled design of AI systems at every level, from training to Kahuna to prompt engineering.

---

## Open Questions

1. **Optimal number of levels?** Is there an ideal depth for the stack?
2. **Constraint quality metrics?** How to measure how well constraints constrain?
3. **Level boundaries?** When should a constraint be at level N vs. N-1?
4. **Constraint conflict resolution?** When constraints from different levels conflict?
5. **Dynamic constraint adaptation?** How should constraints change during execution?
6. **Meta-constraint learning?** Can the system learn better constraint structures?

---

## Changelog

- v1.0 (2026-03-08): Initial formalization — recursive constrained generation across abstraction levels
