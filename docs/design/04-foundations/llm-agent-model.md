# LLM Agent as Bayesian Inference Engine

> **Note:** This document evolved through exploration. Part 6 represents a significant reframing — that an LLM alone is not a complete Bayesian system, and Kahuna's role is to *complete* the LLM's inference capability, not just use it.

**Related:**
- [`theoretical-foundations.md`](theoretical-foundations.md) — Bayesian/FEP foundations
- [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) — Agent architecture

---

## Executive Summary

This document explores a model for understanding LLM agents as Bayesian inference engines, derived from mapping a "chess teaching" framework for prompts onto Bayesian concepts. The model provides principled guidance for prompt structure, tool design, and Kahuna's agent architecture.

**Key insight:** A properly structured prompt transforms an LLM into a focused inference engine by explicitly defining the prior (strategies), constraining the hypothesis space (rules), specifying the target posterior (goal), and seeding the trajectory (opening).

---

## Part 1: The Chess → Bayes Mapping

### 1.1 The Chess Framework for Prompts

When teaching chess, you structure instruction around:

| Component | Chess Meaning | Prompt Analog |
|-----------|---------------|---------------|
| **Goal** | Checkmate the opponent | What the response should achieve |
| **Rules** | How pieces move, what's legal | Constraints that must be obeyed |
| **Strategies** | Control the center, develop pieces | What tends to work regardless of position |
| **Opening** | First moves (e.g., e4, d4) | Where/how to start the response |

### 1.2 The Bayesian Mapping

The proposed mapping:

| Chess | Bayes | Explanation |
|-------|-------|-------------|
| **Goal** | Posterior target | What the inference should converge toward |
| **Rules** | Constraints | Limits the hypothesis space (P=0 for violations) |
| **Strategies** | Priors | General expectations that bias inference |
| **Opening** | Initial conditions | Seeds the sequential inference process |

### 1.3 Validating the Mapping

**Goal → Posterior Target**

In standard Bayesian inference, we compute P(H|E) — the posterior probability of hypothesis H given evidence E. The posterior is the *result* of inference, not its goal.

However, for an LLM agent:
- The "goal" defines what KIND of posterior we want
- It specifies the hypothesis space (what outputs are even under consideration)
- It shapes interpretation of all other components

**Refinement:** The Goal doesn't equal the posterior — it defines the *shape* of the posterior we're trying to achieve. It's the success criterion that makes some posteriors "correct" and others "incorrect."

```
Goal = "Write a function that sorts a list"

This constrains the posterior to:
- Must be code (not prose)
- Must be a function (not a script)
- Must sort (not filter, map, etc.)
- Must operate on lists (not sets, dicts)
```

**Rules → Constraints on Probability Space**

This mapping is direct and strong. Rules set P(output) = 0 for outputs that violate them.

```
Rules: "Use Python 3.10+ syntax. No external dependencies."

Effect: Zero probability mass on:
- Code using Python 2 syntax
- Code importing numpy, pandas, etc.
- Non-Python outputs
```

Rules perform *hard* constraint — they eliminate regions of output space entirely, rather than just making them less likely.

**Strategies → Priors**

Priors P(H) represent beliefs before seeing specific evidence. Strategies are "what tends to work" — general approaches independent of the specific situation.

This mapping is strong because:
- Both represent general knowledge applicable across situations
- Both bias inference without determining it
- Both can be overridden by strong evidence

```
Strategies: "Prefer list comprehensions over loops. Use type hints. Write docstrings."

Effect: Prior probability mass shifted toward:
- [x for x in y] over for-loops
- def func(x: list) -> list: over untyped
- Triple-quoted docstrings
```

**Opening → Initial Conditions**

The Opening seeds the sequential inference process. For LLMs doing autoregressive generation, this is critical because:
- Each token is conditioned on all previous tokens
- The opening establishes trajectory through output space
- Early tokens constrain what's reachable

```
Opening: "Start by defining the function signature with type hints."

Effect: First tokens are likely:
"def sort_list(items: list[int]) -> list[int]:"

This commits the trajectory — subsequent tokens must be consistent with this start.
```

### 1.4 Mapping Verdict

The mapping is **valid but requires refinement**:

| Component | Bayesian Analog | Status |
|-----------|-----------------|--------|
| Goal | Posterior shape/target | ✅ Valid (with refinement) |
| Rules | Hard constraints (P=0) | ✅ Direct mapping |
| Strategies | Prior distribution | ✅ Strong mapping |
| Opening | Trajectory initialization | ✅ Valid (sequential Bayes) |

**Key refinement:** The Goal doesn't map to "posterior" directly. It maps to the *target shape* of the posterior — the criterion by which we judge inference success.

---

## Part 2: The LLM Agent as Bayesian Engine

### 2.1 What's Missing: Likelihood and Evidence

The chess framework covers Goal, Rules, Strategies, Opening. But Bayesian inference requires:

```
P(H|E) ∝ P(E|H) × P(H)
Posterior ∝ Likelihood × Prior
```

What plays the role of **Likelihood** and **Evidence**?

### 2.2 Evidence: The Task/Context

Evidence is the information the agent processes to update its beliefs.

For an LLM agent, Evidence includes:
- The specific task description
- Context provided (files, documentation, examples)
- Tool outputs (search results, file contents)
- Conversation history

```
Evidence E = {
  task: "Sort this list: [3, 1, 4, 1, 5, 9]",
  context: "This is for a real-time system, performance matters",
  tool_output: "File utils.py contains existing helper functions...",
  history: "User previously asked about quicksort"
}
```

### 2.3 Likelihood: Relevance/Fit

The likelihood P(E|H) asks: "If this hypothesis were true, how probable would this evidence be?"

For an LLM agent, this becomes: "If I produce this output, how well does it *explain* or *fit* the context?"

**This is where attention mechanisms shine.** Attention computes relevance — which parts of context matter for producing which parts of output. This is essentially computing:

```
For each output token t and context position c:
  attention(t, c) ≈ P(c is relevant | t is the next token)
```

The attention-weighted context IS the likelihood computation.

### 2.4 The Complete Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LLM AGENT AS BAYESIAN ENGINE                          │
│                                                                          │
│   PROMPT STRUCTURE (Static)                                              │
│   ─────────────────────────                                              │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌────────────┐  │
│   │    GOAL     │   │    RULES    │   │ STRATEGIES  │   │  OPENING   │  │
│   │             │   │             │   │             │   │            │  │
│   │  Posterior  │   │ Constraints │   │   Priors    │   │   Seeds    │  │
│   │   Target    │   │   (P=0)     │   │   P(H)      │   │ Trajectory │  │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬─────┘  │
│          │                 │                 │                 │        │
│          └─────────────────┴─────────────────┴─────────────────┘        │
│                                     │                                    │
│                                     ▼                                    │
│                          ┌─────────────────┐                             │
│                          │  INFERENCE      │                             │
│                          │  CONFIGURATION  │                             │
│                          └────────┬────────┘                             │
│                                   │                                      │
│   RUNTIME (Dynamic)               │                                      │
│   ─────────────────               │                                      │
│                                   ▼                                      │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐     │
│   │  EVIDENCE   │─────────▶│ LIKELIHOOD  │─────────▶│ POSTERIOR   │     │
│   │             │          │             │          │             │     │
│   │ Task/Context│          │  Attention  │          │   Output    │     │
│   │ Tool Output │          │  Relevance  │          │  Tokens     │     │
│   │ History     │          │  Fitting    │          │             │     │
│   └─────────────┘          └─────────────┘          └─────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.5 The Bayesian Update

What "update" happens during LLM inference?

**Within a single generation:**
1. Prior (from training + prompt strategies) establishes initial distribution
2. Evidence (context) is processed via attention (likelihood computation)
3. Posterior (next token probabilities) is computed
4. Token is sampled (Multiple → One collapse)
5. New token becomes part of evidence for next step

**Across tool uses:**
1. Initial inference produces action (tool call)
2. Tool returns new evidence
3. Prior is now conditioned on previous inference + tool result
4. New posterior incorporates updated evidence
5. Repeat until task completion

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-STEP BAYESIAN UPDATE                            │
│                                                                          │
│   Step 1: Initial Inference                                              │
│   ─────────────────────────                                              │
│   P(action₁ | prompt) → action₁ = "read_file(utils.py)"                 │
│                                                                          │
│   Step 2: Evidence Update                                                │
│   ──────────────────────                                                 │
│   E₂ = E₁ + tool_result("def helper(): ...")                            │
│                                                                          │
│   Step 3: Updated Inference                                              │
│   ─────────────────────────                                              │
│   P(action₂ | prompt, action₁, tool_result) → action₂ = "write code"    │
│                                                                          │
│   The posterior from step N becomes part of the prior for step N+1      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.6 The Stacked Bayesian Machines

From the theoretical foundations, cognitive systems are hierarchical:

```
Level 3: KAHUNA (Knowledge Management)
         P(relevant_knowledge | task)
         Prior: KB structure, retrieval heuristics
         Evidence: Current task, query
         Posterior: Context to surface
              │
              │ surfaces context
              ▼
Level 2: LLM (Language Model)
         P(response | context + task)
         Prior: Training distribution + prompt strategies
         Evidence: Task + surfaced context
         Posterior: Response tokens
              │
              │ response influences
              ▼
Level 1: ATTENTION (Within Transformer)
         P(relevance | position)
         Prior: Positional encodings
         Evidence: Token embeddings
         Posterior: Attention weights
```

**Key insight:** Each level runs its own inference loop, and the levels communicate through:
- **Top-down:** Predictions (what I expect to see)
- **Bottom-up:** Prediction errors (what I actually see)

Kahuna's predictions about relevant knowledge shape what the LLM attends to. The LLM's confusion (high perplexity) signals back that different knowledge might be needed.

---

## Part 3: Implications for Prompt/Tool Design

### 3.1 What Makes a Good Prompt

If an LLM agent is a Bayesian inference engine, a good prompt is one that configures the engine well:

| Component | Quality Criteria | Failure Mode if Missing |
|-----------|------------------|------------------------|
| **Goal** | Clear, specific, verifiable | Model doesn't know what success looks like |
| **Rules** | Explicit, complete, non-contradictory | Model produces invalid outputs |
| **Strategies** | Relevant to domain, proven effective | Model relies on generic training priors |
| **Opening** | Concrete, executable first step | Model starts in wrong region of output space |

### 3.2 Prompt Component Checklist

```
GOAL
□ What is the output supposed to achieve?
□ How would someone verify success?
□ What distinguishes good output from mediocre output?

RULES
□ What constraints MUST be obeyed?
□ What would make output invalid regardless of other qualities?
□ Are rules consistent with each other?

STRATEGIES
□ What approaches work well for this type of task?
□ What domain-specific heuristics apply?
□ What should the model prefer when there are options?

OPENING
□ What's the first concrete step?
□ Does the opening commit to the right trajectory?
□ Is the opening achievable given the rules?
```

### 3.3 Failure Mode Predictions

This model predicts specific failure modes:

| Missing Component | Predicted Failure | Example |
|-------------------|-------------------|---------|
| No Goal | Wandering, unfocused output | "Help me with this code" → model lectures about programming generally |
| No Rules | Invalid/unusable output | Generates Python 2 syntax when 3.10+ needed |
| No Strategies | Suboptimal approaches | Uses bubble sort when quicksort would be better |
| No Opening | Wrong trajectory | Starts writing tests before understanding the function |
| Conflicting Rules | Paralysis or arbitrary choice | "Be brief" + "Explain thoroughly" |
| Vague Goal | Technically correct but useless | Sorts the list but ignores performance requirement |

### 3.4 Tool Design Principles

Tools provide evidence. Good evidence sharpens the posterior; bad evidence adds noise.

**Principle 1: Return Focused Information**

```
BAD:  Return entire file when only function signature needed
GOOD: Return just the relevant section with context

Why: More evidence ≠ better evidence. Irrelevant evidence adds noise to likelihood computation.
```

**Principle 2: Include Uncertainty When Possible**

```
BAD:  "Function X does Y"
GOOD: "Function X appears to do Y (based on docstring; implementation may differ)"

Why: Posterior should reflect actual certainty. False confidence corrupts inference.
```

**Principle 3: Structure for Relevance Computation**

```
BAD:  Wall of text
GOOD: Structured output with clear sections

Why: Attention can more easily compute relevance when structure is explicit.
```

**Principle 4: Preserve Provenance**

```
BAD:  "The database schema is..."
GOOD: "From schema.sql (line 42-58): ..."

Why: Source information affects likelihood — official docs vs. Stack Overflow answer.
```

### 3.5 Tool Output as Evidence Update

Each tool call updates the agent's beliefs:

```
BEFORE TOOL CALL
P(correct_implementation | task) = distributed across many possibilities

TOOL: read_file("utils.py")
Returns: "def helper(x): return x * 2"

AFTER TOOL CALL
P(correct_implementation | task, helper_exists) = shifted toward using helper

The tool output eliminated hypotheses that don't use the helper.
```

---

## Part 4: Application to Kahuna's Agents

### 4.1 Agent Prompt Structure Template

Each Kahuna agent should have explicit components:

```markdown
# Agent: [Name]

## Goal
[Clear statement of what inference should produce]

## Rules
[Hard constraints that must be obeyed]

## Strategies
[Heuristics and approaches that work well]

## Opening
[How to begin the task]
```

### 4.2 Extraction Agent

**Goal:** Transform conversation logs into discrete learning episodes.

**Rules:**
- Episodes must be self-contained (understandable without full context)
- Each episode represents ONE piece of knowledge
- Must preserve original meaning (no inference beyond what's stated)
- Must include source attribution (session ID, timestamp)

**Strategies:**
- Look for explicit learning moments ("I learned...", "The answer is...")
- Look for error corrections ("That's wrong because...", "Actually...")
- Look for decisions ("We decided to...", "The approach is...")
- Prefer specific over general (concrete code > abstract discussion)
- When in doubt, extract (false positives easier to prune than false negatives)

**Opening:**
1. Read the session metadata (timestamp, participants)
2. Scan for explicit learning markers
3. Process chronologically, grouping related exchanges

**Bayesian interpretation:**
- Prior: Training on what "learning moments" look like
- Evidence: Specific conversation text
- Likelihood: How well does this text match learning patterns?
- Posterior: Extracted episodes with confidence

### 4.3 Integration Agent

**Goal:** Propose KB updates that incorporate new episodes into existing knowledge.

**Rules:**
- Proposals must maintain KB consistency
- Must reference existing entries being modified
- Cannot create duplicate entries for same knowledge
- Must include proper metadata (source, confidence, category)

**Strategies:**
- Query KB for related entries before proposing new ones
- Prefer updates over new entries when knowledge overlaps
- Connect new knowledge to existing structure (categories, links)
- Higher confidence for explicit user statements, lower for inferences
- When uncertain between update and new entry, propose as new with link

**Opening:**
1. For each episode, generate semantic query
2. Retrieve related KB entries (top 5-10)
3. Classify as: new entry, update existing, merge multiple, or skip

**Bayesian interpretation:**
- Prior: KB structure (what categories exist, how knowledge is organized)
- Evidence: Episode content + related KB entries
- Likelihood: How well does proposed update fit KB structure?
- Posterior: Update proposal with confidence

### 4.4 Conflict Detector

**Goal:** Identify contradictions between proposals and existing KB.

**Rules:**
- Contradiction = cannot both be true
- Contradiction ≠ different (distinct but compatible facts)
- Must identify WHICH entries conflict
- Must explain WHY they conflict

**Strategies:**
- Compare semantic meaning, not just text
- Check for logical inconsistencies (A says X, B says not-X)
- Check for implicit conflicts (A implies X, B implies not-X)
- Consider time/context (may not conflict if from different contexts)
- Weight by confidence (high-confidence entry vs low-confidence proposal)

**Opening:**
1. Take proposal and potentially conflicting entries
2. Identify the core claim of each
3. Check for direct contradiction
4. Check for implicit contradiction
5. Report findings with confidence

**Bayesian interpretation:**
- Prior: What kinds of contradictions exist in this domain?
- Evidence: Proposal content + existing entry content
- Likelihood: Given these contents, how likely is contradiction?
- Posterior: Conflict report with confidence level

### 4.5 Conflict Resolver

**Goal:** Determine which version to keep when conflicts exist.

**Rules:**
- Must choose: keep proposal, keep existing, or escalate
- Escalate if: both high confidence, unclear which is correct
- Resolution must be justified
- Must not lose information unnecessarily

**Strategies:**
- Recency often wins (newer information supersedes)
- Source priority: user explicit > user implicit > inferred
- Confidence comparison: higher confidence wins
- When close, prefer more specific over more general
- Can sometimes resolve by scoping (both true in different contexts)

**Opening:**
1. Compare confidence levels
2. Compare source types
3. Compare recency
4. If clear winner, resolve
5. If unclear, escalate with explanation

**Bayesian interpretation:**
- Prior: Resolution heuristics (recency, source, confidence)
- Evidence: Conflict details, entry metadata
- Likelihood: Given this evidence, which resolution is correct?
- Posterior: Resolution decision with confidence

### 4.6 Relevance Ranker

**Goal:** Rank KB entries by relevance to current task.

**Rules:**
- Must consider semantic similarity
- Must consider salience (importance scores)
- Must consider recency
- Must respect mode context (different modes need different knowledge)

**Strategies:**
- Semantic similarity is primary signal
- Salience modulates similarity (high salience boosts relevant entries)
- Recency matters for volatile knowledge (tech details change)
- Mode context shapes relevance (architect mode ≠ code mode)
- Diversity: avoid returning redundant entries

**Opening:**
1. Embed the query
2. Retrieve candidates by similarity
3. Apply salience weighting
4. Apply mode-specific adjustments
5. Diversify results

**Bayesian interpretation:**
- Prior: Salience scores (pre-computed importance)
- Evidence: Query embedding, mode context
- Likelihood: How well does each entry match the query + mode?
- Posterior: Ranked list with relevance scores

### 4.7 Inter-Agent Information Flow

Agents pass posteriors to each other:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AGENT PIPELINE AS BAYESIAN CHAIN                      │
│                                                                          │
│   Extraction         Integration        Error Handling     Consolidation │
│   ──────────         ───────────        ──────────────     ─────────────│
│                                                                          │
│   P(episodes|        P(proposals|       P(valid|           P(KB_new|    │
│     conv_log)   →      episodes,   →      proposals,   →     valid_     │
│                        KB)                KB)                proposals)  │
│                                                                          │
│   Episodes with      Proposals with     Validated          Applied      │
│   confidence    →    confidence    →    proposals     →    updates      │
│                                                                          │
│   Each agent's posterior becomes evidence for the next agent            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Critical insight:** Confidence must propagate. If Extraction is uncertain about an episode, Integration should incorporate that uncertainty. If Integration is uncertain about a proposal, Error Handling should use that information.

---

## Part 5: Methodology Implications

### 5.1 For Cognitive Software Development

This model connects to the cognitive software development methodology:

**Information Structure First**
Before designing an agent, define:
- What hypothesis space does it operate in?
- What prior should it have?
- What evidence will it receive?
- What posterior should it produce?

**Computational Model via Bayes**
Each agent's computational goal can be specified as:
```
Given: Prior P(H), Evidence E
Compute: Posterior P(H|E)
Where: H = [hypothesis space], E = [evidence types]
```

**Marr's Levels for Agents**

| Level | Question | Agent Specification |
|-------|----------|---------------------|
| Computational | What is computed? | P(output | input, prior, rules) |
| Algorithmic | How is it computed? | Prompt structure + LLM inference |
| Implementational | Physical realization? | Specific model, context window, tools |

### 5.2 Agent Design Process

1. **Define the posterior**: What does the agent produce? What are valid outputs?

2. **Define the evidence**: What information does the agent receive? In what format?

3. **Define the prior**: What should the agent assume before seeing evidence? What strategies work?

4. **Define the constraints**: What outputs are invalid regardless of evidence?

5. **Write the prompt**: Map Goal, Rules, Strategies, Opening to the above

6. **Test the inference**: Does the agent produce appropriate posteriors for various evidence?

### 5.3 Quality Metrics

If agents are inference engines, quality metrics should reflect inference quality:

| Metric | Meaning | How to Measure |
|--------|---------|----------------|
| **Calibration** | Confidence matches accuracy | Check if 80% confidence events happen 80% of time |
| **Sharpness** | Posterior is focused, not diffuse | Measure entropy of outputs |
| **Coverage** | True output in high-probability region | Track how often correct answer is top-ranked |
| **Consistency** | Same evidence → same posterior | Test with repeated inputs |

### 5.4 Debugging as Diagnosis

When an agent fails, diagnose which component failed:

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Confident but wrong | Bad prior (strategies) | Update strategies with domain knowledge |
| Uncertain when should be clear | Evidence not processed correctly | Improve evidence formatting |
| Valid but suboptimal | Goal too loose | Sharpen goal criteria |
| Invalid output | Missing rules | Add explicit constraints |
| Never starts right | Bad opening | Provide better first step |

---

## Summary

### The Model

An LLM agent with a properly structured prompt becomes a Bayesian inference engine:

- **Goal** → Target posterior shape (what success looks like)
- **Rules** → Hard constraints (P=0 for violations)
- **Strategies** → Prior distribution (what to expect)
- **Opening** → Trajectory initialization (where to start)
- **Evidence** → Task/context/tool outputs (what's observed)
- **Likelihood** → Attention/relevance computation (what fits)
- **Posterior** → Output distribution (what to produce)

### Key Insights

1. **Prompts configure inference**, they don't specify outputs
2. **Missing components cause predictable failures**
3. **Tools provide evidence updates** — quality of evidence matters
4. **Agent pipelines are Bayesian chains** — posteriors become priors
5. **Confidence must propagate** — uncertainty should flow through pipeline

### For Kahuna

- Each agent should have explicit Goal, Rules, Strategies, Opening
- Agents pass posteriors (with confidence) to downstream agents
- The KB acts as a prior distribution over relevant knowledge
- Retrieval computes P(relevant | task) — a Bayesian posterior
- Consolidation minimizes free energy across the KB

### For Methodology

- Agent design is inference design
- Specify the posterior first, then derive the prompt
- Quality = calibration + sharpness + coverage
- Debug by diagnosing which Bayesian component failed

---

## Part 6: The Incomplete LLM — Kahuna as Bayesian Completion

### 6.1 The Problem: LLMs Are Not Complete Bayesian Systems

Looking back at Part 2, we identified a gap: what plays the role of **Likelihood** in LLM inference?

We said "attention mechanisms" — but let's scrutinize this.

**What Bayes requires:**
```
P(H|E) ∝ P(E|H) × P(H)

- P(H): Prior beliefs about hypotheses
- P(E|H): Likelihood — how probable is this evidence IF this hypothesis is true?
- P(H|E): Posterior — updated beliefs after seeing evidence
```

**What an LLM actually computes:**
```
P(next_token | context)

Where context = everything in the prompt + generation so far
```

The LLM doesn't have an explicit likelihood function. It doesn't ask "if my output hypothesis is true, how well does that explain the context?" It directly predicts tokens conditioned on context.

**The missing piece:** An LLM has:
- ✅ Prior (training distribution)
- ❓ Likelihood (implicit, baked into weights — not separable)
- ✅ Posterior (output distribution)

But the likelihood and prior are **entangled** in the weights. You can't update the prior without retraining. You can't change what "explains" the context without retraining.

### 6.2 The Prompt as Surrogate Prior

What does a prompt actually do?

It doesn't change P(H) — the model's prior is fixed in its weights.

Instead, it **conditions** the inference:
```
P(output | prompt) ≠ P(output)

The prompt shifts the distribution, but not by updating beliefs.
It works by changing WHAT IS BEING CONDITIONED ON.
```

This is like computing P(H|E) by choosing E carefully, not by having flexible P(H).

**Limitation:** The prompt can only activate what's already in the weights. It can't teach the model new priors — only select among learned ones.

### 6.3 Kahuna Completes the System

Here's the key insight: **Kahuna provides what the LLM lacks.**

| Component | LLM Alone | LLM + Kahuna |
|-----------|-----------|--------------|
| **Prior** | Fixed in weights, implicit | KB = explicit prior that can be updated |
| **Likelihood** | Entangled with prior | Retrieval relevance = likelihood computation |
| **Evidence** | Limited to context window | Full KB + project history |
| **Update** | None (inference only) | Consolidation updates the KB |

**Kahuna IS the updateable prior.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LLM + KAHUNA = COMPLETE BAYESIAN SYSTEM              │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                         KAHUNA                                   │   │
│   │                                                                  │   │
│   │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │   │
│   │   │ KNOWLEDGE   │     │ RETRIEVAL   │     │CONSOLIDATION│       │   │
│   │   │ BASE        │     │             │     │             │       │   │
│   │   │             │     │ Computes    │     │ Updates     │       │   │
│   │   │ Updateable  │────▶│ P(E|H)      │     │ P(H)        │◀──────│   │
│   │   │ Prior       │     │ relevance   │     │ the prior   │       │   │
│   │   └─────────────┘     └──────┬──────┘     └──────┬──────┘       │   │
│   │                              │                   │               │   │
│   └──────────────────────────────┼───────────────────┼───────────────┘   │
│                                  │                   │                    │
│                                  │ relevant context  │ learning signals   │
│                                  ▼                   ▲                    │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │                           LLM                                     │   │
│   │                                                                   │   │
│   │   Fixed prior (training) + Kahuna context → Output               │   │
│   │                                                                   │   │
│   │   P(output | task, kahuna_context)                               │   │
│   │                                                                   │   │
│   └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   The LLM computes inference.                                            │
│   Kahuna provides the updateable prior and likelihood.                   │
│   Together, they form a complete learning system.                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.4 What Stacking Enables

You asked: "What does layering do that pure Bayes cannot?"

**Single-layer Bayes is limited:**
- Fixed hypothesis space
- Single prior distribution
- All inference at one level of abstraction

**Stacked Bayesian systems enable:**

**1. Hierarchical Abstraction**
Each layer operates at a different abstraction level:
- Level 1 (Attention): "Which tokens are relevant to each other?"
- Level 2 (LLM): "What's the right response given context?"
- Level 3 (Kahuna): "What knowledge is relevant to this task?"

Higher layers don't compute the same thing faster — they compute **different things**.

**2. Separation of Concerns**
- Lower layers: fast, parallel, pattern-matching
- Higher layers: slow, sequential, planning
- Each layer can be optimized independently

**3. Compositional Learning**
The LLM learns language patterns. Kahuna learns project-specific knowledge. Neither needs to learn the other's domain. They compose.

**4. Temporal Abstraction**
- LLM: No memory across sessions (context window only)
- Kahuna: Memory that persists and consolidates
- Together: Learning that accumulates over time

### 6.5 The Larger System View

Stepping back further:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        THE COMPLETE COGNITIVE SYSTEM                     │
│                                                                          │
│                              ┌─────────────┐                             │
│                              │    USER     │                             │
│                              │             │                             │
│                              │ Goals/Tasks │                             │
│                              └──────┬──────┘                             │
│                                     │                                    │
│                                     ▼                                    │
│   Layer 4: ORCHESTRATION ────────────────────────────────────────────   │
│            Task decomposition, planning, verification                    │
│            P(subtasks | goal)                                            │
│                                     │                                    │
│                                     ▼                                    │
│   Layer 3: KNOWLEDGE (Kahuna) ───────────────────────────────────────   │
│            What context is relevant?                                     │
│            P(knowledge | task) ← UPDATEABLE                              │
│                                     │                                    │
│                                     ▼                                    │
│   Layer 2: LANGUAGE (LLM) ───────────────────────────────────────────   │
│            What's the right response?                                    │
│            P(output | context) ← fixed weights                           │
│                                     │                                    │
│                                     ▼                                    │
│   Layer 1: ATTENTION (Transformer) ──────────────────────────────────   │
│            What tokens relate to what?                                   │
│            P(attention | positions)                                      │
│                                     │                                    │
│                                     ▼                                    │
│                              ┌─────────────┐                             │
│                              │   OUTPUT    │                             │
│                              └─────────────┘                             │
│                                                                          │
│   Each layer:                                                            │
│   - Receives predictions from above                                      │
│   - Sends prediction errors up                                           │
│   - Computes its own posterior                                           │
│   - Has its own update mechanism (or doesn't)                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**What emerges from this stack that doesn't exist in any single layer?**

1. **Grounded Learning**: The LLM can't learn from experience (weights fixed). Kahuna can. Together, the system learns from what actually happens.

2. **Contextual Adaptation**: The LLM treats all tokens equally (no domain knowledge). Kahuna knows what matters HERE. Together, inference is domain-aware.

3. **Long-horizon Coherence**: The LLM has limited context. Kahuna provides persistent memory. Together, work can span sessions.

4. **Error Correction**: The LLM has no feedback loop to its weights. Kahuna can detect and correct errors over time. Together, mistakes become learnings.

### 6.6 Reframing Kahuna's Purpose

This reframes what Kahuna IS:

**Old view:** Kahuna is a tool that helps LLMs work better.

**New view:** Kahuna completes the LLM into a full cognitive system.

Without Kahuna, the LLM is a sophisticated pattern-matcher that can't:
- Update its beliefs based on experience
- Separate likelihood from prior
- Maintain coherent knowledge over time
- Learn from its mistakes

With Kahuna, the LLM becomes part of a system that CAN do all these things.

**This is why you can't analyze the LLM alone** — it's incomplete. The unit of analysis is LLM + Knowledge Management + Orchestration. Kahuna isn't an add-on; it's a necessary component for the system to function as a learning agent.

### 6.7 Implications for Design

If Kahuna completes the LLM, then:

**1. KB Structure = Prior Structure**
How we organize the KB directly shapes the prior distribution. Category structure, entry linking, salience scores — these ARE the prior.

**2. Retrieval = Likelihood Computation**
Retrieval isn't just "finding relevant stuff." It's computing P(this knowledge | this task). The retrieval algorithm IS the likelihood function.

**3. Consolidation = Bayesian Update**
Consolidation isn't just "saving things." It's updating P(H) — the prior — based on new evidence. This is where learning happens.

**4. The Prompt Is Just Conditioning**
The prompt's role is smaller than we thought. It conditions the LLM's inference, but Kahuna provides the real prior.

**5. Quality = Calibration Across Layers**
The system works when layers are calibrated — when Kahuna's sense of "relevant" matches what actually helps the LLM succeed.

### 6.8 What Stacking "Enables" — A Conjecture

You asked what stacking enables beyond what single-layer Bayes can do.

**Conjecture:** Stacking enables **domain separation with information flow**.

- Each layer has its own prior, likelihood, and posterior
- But layers communicate through predictions and errors
- This allows each layer to specialize without losing integration

Single-layer Bayes must represent EVERYTHING in one hypothesis space. Stacking allows different hypothesis spaces at different abstraction levels, connected by message-passing.

This might be why biological cognition is hierarchical — it's not just efficiency, it's the only way to handle multi-scale abstraction without combinatorial explosion.

---

## Open Questions

1. **How to represent confidence computationally?** Agents should output confidence, but how to extract this from LLM outputs reliably?

2. **How to handle confidence propagation?** If agent A is 70% confident and agent B is 80% confident given A's output, what's the joint confidence?

3. **What's the right granularity for strategies?** Too specific = overfitting to examples. Too general = no better than training prior.

4. **How to validate priors?** How do we know if our strategies are actually good priors for the task?

5. **How to handle multi-modal posteriors?** Sometimes there are multiple "correct" outputs — how should the agent represent this?

6. **How should layers calibrate?** What makes Kahuna's "relevance" match what actually helps the LLM? How do we detect miscalibration?

7. **What's the feedback mechanism?** How does the LLM's success/failure inform Kahuna's retrieval and consolidation?

8. **Is there an optimal layer structure?** Are 3-4 layers optimal? Would more help? Would fewer suffice?
