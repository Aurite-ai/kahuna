# Kahuna Product Model

**Type:** Product Definition
**Date:** 2026-03-07
**Status:** Stable

**Related Documentation:**
- [`../02-architecture/abstract-architecture.md`](../02-architecture/abstract-architecture.md) — Technical architecture (planned)
- [`../04-foundations/llm-agent-model.md`](../04-foundations/llm-agent-model.md) — Theoretical foundation (planned)

---

## Executive Summary

This document defines Kahuna at the product level: who it's for, what value it creates, and what it does. It grounds the technical architecture in concrete use cases and identifies any gaps between capabilities and architecture.

**Key Insight:** Kahuna is more general than "coding copilot extension" - it's cognitive hardware that could power ANY copilot. This document defines both the universal core and the coding-specific specialization.

---

## Part 0: Layered Product Model

### The Realization

Kahuna isn't just a coding copilot extension. It's **cognitive hardware** - a general-purpose memory and learning system that completes any LLM-based copilot. The same architecture that helps a coding copilot remember project conventions could help:

- A **gaming copilot** remember player preferences, game state, and strategies
- A **research copilot** accumulate domain knowledge across papers and experiments
- A **personal assistant** learn user habits, preferences, and routines
- A **customer support copilot** build organizational knowledge from interactions

This suggests a layered model:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DOMAIN SPECIALIZATIONS                           │
│                                                                      │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │
│   │  Kahuna for │   │  Kahuna for │   │  Kahuna for │    ...        │
│   │   Coding    │   │   Gaming    │   │  Research   │               │
│   │             │   │             │   │             │               │
│   │ Categories  │   │ Categories  │   │ Categories  │               │
│   │ Patterns    │   │ Patterns    │   │ Patterns    │               │
│   │ Templates   │   │ Templates   │   │ Templates   │               │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘               │
│          │                 │                 │                       │
│          └─────────────────┼─────────────────┘                       │
│                            │                                         │
│                            ▼                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      KAHUNA CORE                              │   │
│   │                                                               │   │
│   │   Universal Cognitive Hardware                                │   │
│   │   • Six Subsystems (Encoding, Storage, Retrieval, ...)       │   │
│   │   • Domain-agnostic operations                                │   │
│   │   • Specialization interface                                  │   │
│   │                                                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Why This Matters

1. **Architecture validation** - The abstract architecture is already domain-agnostic (good sign)
2. **Market positioning** - Kahuna is infrastructure, not a vertical product
3. **Development focus** - Build core well, specializations become configuration
4. **Future optionality** - Gaming copilot is possible without architectural changes

---

## Part 0.1: Kahuna Core (Cognitive Hardware)

### What Makes It Universal

Kahuna Core provides **cognitive completion** for any LLM-based copilot. An LLM alone can't:
- Update its beliefs based on experience
- Maintain knowledge beyond the context window
- Learn from mistakes across sessions

Kahuna Core adds these capabilities **regardless of domain**.

### Universal Subsystems

All six subsystems from the abstract architecture are domain-agnostic:

| Subsystem | Universal Function |
|-----------|-------------------|
| **Encoding** | Transform any input into storable entries with metadata |
| **Storage** | Persist markdown KB entries (content-neutral format) |
| **Retrieval** | Semantic similarity search (works on any text) |
| **Consolidation** | Extract learnings from any conversation |
| **Error Handling** | Detect logical contradictions (domain-independent) |
| **Attention** | Manage salience/decay (time-based, universal) |

### Universal Operations

The core cognitive operations work for any domain:

| Operation | Description | Domain Independence |
|-----------|-------------|---------------------|
| **Learn** | Capture explicit knowledge | Content is domain-specific, operation is universal |
| **Extract** | Find implicit learnings in conversation | Pattern matching works on any content |
| **Integrate** | Connect new knowledge to existing | Graph operations, not domain logic |
| **Retrieve** | Find relevant context | Semantic similarity is content-agnostic |
| **Decay** | Reduce salience over time | Time-based, not content-based |
| **Resolve** | Fix contradictions | Logical consistency, not domain rules |

### Universal Data Structures

| Structure | Content | Why Universal |
|-----------|---------|---------------|
| **KB Entry** | Markdown with frontmatter | Plain text, any content |
| **Metadata** | Salience, confidence, source, timestamps | Domain-independent attributes |
| **Semantic Index** | Embeddings | Works on any text |
| **Episode** | Extracted conversation segment | Structured by conversation, not domain |

### What Core Does NOT Include

Core explicitly excludes domain-specific elements:

- ❌ Knowledge categories (what topics exist)
- ❌ Extraction patterns (what to look for)
- ❌ Mode definitions (what workflows exist)
- ❌ Relevance heuristics (what's important for this domain)
- ❌ Initial knowledge seeds (domain documentation)
- ❌ Tool schemas (domain-specific parameters)

These are provided by the **Specialization Layer**.

---

## Part 0.2: Specialization Interface

### How Domains Customize Kahuna

A specialization provides domain-specific configuration without modifying core:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SPECIALIZATION INTERFACE                          │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │ CATEGORY TAXONOMY                                              │ │
│   │                                                                │ │
│   │ What types of knowledge exist in this domain?                  │ │
│   │ • Coding: conventions, decisions, patterns, errors, APIs      │ │
│   │ • Gaming: strategies, preferences, game-state, achievements   │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │ EXTRACTION PATTERNS                                            │ │
│   │                                                                │ │
│   │ What should the Extraction Agent look for?                     │ │
│   │ • Coding: corrections, decisions, preferences, errors         │ │
│   │ • Gaming: strategy changes, difficulty preferences, progress  │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │ MODE DEFINITIONS                                               │ │
│   │                                                                │ │
│   │ What workflow modes exist?                                     │ │
│   │ • Coding: architect, code, debug, review                       │ │
│   │ • Gaming: combat, exploration, inventory, social              │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │ RELEVANCE HEURISTICS                                           │ │
│   │                                                                │ │
│   │ What makes knowledge relevant in this context?                 │ │
│   │ • Coding: current file type, task type, recent errors         │ │
│   │ • Gaming: current quest, location, equipped items             │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │ KNOWLEDGE SEEDS                                                │ │
│   │                                                                │ │
│   │ What initial knowledge does the KB start with?                 │ │
│   │ • Coding: framework docs, best practices, common patterns     │ │
│   │ • Gaming: game mechanics, item databases, quest guides        │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │ TOOL CUSTOMIZATION                                             │ │
│   │                                                                │ │
│   │ Domain-specific tool parameters and behaviors                  │ │
│   │ • Coding: file paths, language detection, mode awareness      │ │
│   │ • Gaming: game session ID, character state, game platform     │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Specialization Package Structure

A specialization is a configuration package:

```
kahuna-for-coding/
├── taxonomy.yaml           # Category definitions
├── extraction-patterns/    # What to extract from conversations
│   ├── corrections.yaml
│   ├── decisions.yaml
│   └── preferences.yaml
├── modes/                  # Workflow mode definitions
│   ├── architect.yaml
│   ├── code.yaml
│   └── debug.yaml
├── relevance/              # Context-specific retrieval rules
│   └── file-type-hints.yaml
├── seeds/                  # Initial KB content
│   └── best-practices/
└── tools/                  # Tool schema customization
    └── learn-schema.yaml
```

### Interface Contract

A specialization implements this interface:

```typescript
interface KahunaSpecialization {
  // Identity
  id: string;                    // e.g., "coding", "gaming"
  name: string;                  // e.g., "Kahuna for Coding"
  version: string;

  // Category taxonomy
  categories: CategoryDefinition[];

  // Extraction configuration
  extractionPatterns: ExtractionPattern[];

  // Mode definitions
  modes: ModeDefinition[];

  // Relevance configuration
  relevanceHeuristics: RelevanceHeuristic[];

  // Initial KB content
  seeds: KnowledgeSeed[];

  // Tool customization
  toolSchemas: ToolSchemaOverride[];
}
```

---

## Part 0.3: Kahuna for Coding (First Specialization)

### Overview

Kahuna for Coding is the first and primary specialization. It configures Kahuna Core for software development workflows.

### Category Taxonomy

| Category | Description | Example |
|----------|-------------|---------|
| **convention** | Coding style, formatting, naming | "Use 2-space indentation" |
| **decision** | Architectural choice with rationale | "Using PostgreSQL because..." |
| **pattern** | Reusable implementation pattern | "Repository pattern for data access" |
| **error** | Mistake and correction | "Don't use deprecated X API" |
| **api** | External API usage knowledge | "Auth endpoint requires Bearer token" |
| **preference** | User preference for workflow | "Prefer functional over OOP" |
| **context** | Project-specific context | "This repo uses monorepo structure" |

### Extraction Patterns

| Pattern | Trigger | What's Captured |
|---------|---------|-----------------|
| **Correction** | "No, don't do X, do Y" | Error entry: X is wrong, Y is right |
| **Decision** | "Let's use X because..." | Decision entry with rationale |
| **Preference** | "I prefer...", "Always..." | Preference entry |
| **Explanation** | User explains why code works a certain way | Context entry |
| **Error Resolution** | User fixes copilot mistake | Error entry with correction |

### Mode Definitions

| Mode | Purpose | Retrieval Bias |
|------|---------|----------------|
| **architect** | Design, planning | Decisions, patterns, context |
| **code** | Implementation | Conventions, patterns, APIs |
| **debug** | Troubleshooting | Errors, recent changes, patterns |
| **review** | Code review | Conventions, decisions, errors |

### Relevance Heuristics

| Context Signal | Relevance Boost |
|----------------|-----------------|
| Current file type matches entry | +0.3 |
| Entry mentions current directory | +0.2 |
| Entry was accessed in similar mode | +0.15 |
| Entry mentions error user just encountered | +0.4 |
| Entry is recent and high-confidence | +0.2 |

### Knowledge Seeds

Initial KB content for new projects:

- Language-specific best practices (TypeScript, Python, etc.)
- Framework conventions (React, Node.js, etc.)
- Common error patterns and solutions
- Project structure templates

### Tool Customization

| Tool | Customization |
|------|---------------|
| `kahuna_learn` | Accepts `category` hint, defaults to auto-categorization |
| `kahuna_prepare_context` | Mode-aware retrieval, file-type hints |
| `kahuna_ask` | Code-specific question interpretation |

### Why This Specialization Works

1. **Natural fit** - Software development has clear knowledge types
2. **Observable patterns** - Coding conversations have recognizable structures
3. **Valuable retrieval** - Code context is highly specific and reusable
4. **Mode alignment** - Roo Code's modes map to retrieval strategies

---

## Part 0.4: Architecture Validation

### Does the Abstract Architecture Support This Model?

**Yes, with minor additions.**

| Aspect | Current State | Required Change |
|--------|---------------|-----------------|
| **Subsystems** | Already domain-agnostic | ✅ None |
| **Data structures** | Already generic | ✅ None |
| **Integration contracts** | Already abstract | ✅ None |
| **Encoding** | Needs category parameter | ⚠️ Add specialization config |
| **Extraction** | Needs pattern configuration | ⚠️ Add specialization config |
| **Retrieval** | Needs relevance customization | ⚠️ Add specialization config |

### Required Architecture Additions

1. **Specialization loader** - Load and validate specialization package
2. **Config injection** - Pass specialization config to subsystems
3. **Template engine** - Apply specialization seeds to new KB

### Architecture Diagram Update

```
┌─────────────────────────────────────────────────────────────────────┐
│                           KAHUNA RUNTIME                             │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │ SPECIALIZATION LAYER                                           │ │
│   │                                                                │ │
│   │   ┌─────────────┐                                              │ │
│   │   │ Spec Loader │ ──▶ Loaded Specialization Config             │ │
│   │   └─────────────┘                                              │ │
│   │          │                                                     │ │
│   │          ▼                                                     │ │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │ │
│   │   │ Categories  │   │ Patterns    │   │ Heuristics  │ ...      │ │
│   │   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘          │ │
│   │          │                 │                 │                 │ │
│   └──────────┼─────────────────┼─────────────────┼─────────────────┘ │
│              │                 │                 │                   │
│              ▼                 ▼                 ▼                   │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │ CORE LAYER                                                     │ │
│   │                                                                │ │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│   │   │ ENCODING │  │ STORAGE  │  │ RETRIEVAL│  │ CONSOL.  │ ...  │ │
│   │   │          │  │          │  │          │  │          │      │ │
│   │   │ uses     │  │          │  │ uses     │  │ uses     │      │ │
│   │   │ taxonomy │  │          │  │heuristics│  │ patterns │      │ │
│   │   └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Validation Summary

| Question | Answer |
|----------|--------|
| Is the core domain-agnostic? | ✅ Yes - all six subsystems work on generic content |
| Are specialization points clear? | ✅ Yes - taxonomy, patterns, heuristics, seeds |
| Any architectural changes needed? | ⚠️ Minor - add specialization loader and config injection |
| Can gaming copilot use same core? | ✅ Yes - different specialization package |

---

## Part 0.5: Future Specializations

### Kahuna for Gaming (Concept)

A gaming copilot could use Kahuna Core with a gaming specialization:

| Element | Coding | Gaming |
|---------|--------|--------|
| **Categories** | convention, decision, pattern | strategy, preference, progress, lore |
| **Extraction** | corrections, decisions | strategy changes, difficulty feedback, achievements |
| **Modes** | architect, code, debug | combat, exploration, inventory |
| **Relevance** | file type, error context | quest, location, equipped items |
| **Seeds** | framework docs | game mechanics, item databases |

### Other Potential Specializations

| Domain | Key Knowledge Types | Value Proposition |
|--------|--------------------|--------------------|
| **Research** | Papers, experiments, hypotheses | Accumulate domain knowledge across studies |
| **Customer Support** | Solutions, escalations, policies | Build org knowledge from interactions |
| **Personal Assistant** | Habits, preferences, routines | Learn user patterns over time |
| **Writing** | Style, preferences, research | Remember voice and accumulated research |

### Development Path

1. **Build Core well** - Invest in domain-agnostic infrastructure
2. **Prove Coding specialization** - Validate the model works
3. **Extract patterns** - What's truly reusable vs. coding-specific
4. **Expand** - Gaming or other domains when market opportunity exists

---

## Part 1: Value Proposition

### Who Is Kahuna For?

**Primary user:** Developer using a coding copilot (Roo Code, Cursor, Claude Code, etc.)

**User context:**
- Works on complex, long-running projects
- Relies on copilots for significant portions of work
- Frustrated by copilots "forgetting" context between sessions
- Spends time re-explaining the same things repeatedly

### What Problem Does It Solve?

**Core problem:** Copilots lack persistent memory.

Each conversation starts from zero. What the copilot "learned" yesterday must be re-explained today. The context window is a bottleneck — you can't fit your entire project in it, so the copilot operates with incomplete information.

**Specific pain points:**

| Pain Point | Description |
|------------|-------------|
| **Repetitive context-setting** | User must re-explain architecture, conventions, and decisions every session |
| **Lost learnings** | Insights discovered in one conversation don't carry to the next |
| **Inconsistent quality** | Some sessions go well, others require heavy correction |
| **Context degradation** | As projects grow, copilot effectiveness decreases |
| **Manual knowledge management** | User must maintain docs/rules manually for copilot to use |

**Root cause:** An LLM alone is an incomplete cognitive system. It can perform inference but cannot:
- Update its beliefs based on experience
- Maintain knowledge beyond the context window
- Learn from its mistakes across sessions

### What's the Core Promise?

> **Each conversation better than the last.**

The copilot remembers what it learned. It applies past lessons to new problems. It maintains a growing knowledge base that makes it more effective over time.

**Concrete manifestation:**
- Session 5 doesn't require re-explaining what was taught in session 1
- Decisions made in one conversation inform future conversations
- The copilot catches its own mistakes by referencing past corrections
- Project knowledge accumulates, not resets

### Value Equation

```
Kahuna's value = (Time saved on context-setting)
               + (Quality improvement from persistent learning)
               + (Reduced cognitive load from automated knowledge management)
               - (Setup and maintenance cost)
```

---

## Part 2: Capabilities

### 2.1 Capability Categories

Kahuna's capabilities group into four domains:

```
┌─────────────────────────────────────────────────────────────────────┐
│                       KAHUNA CAPABILITIES                            │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                      LEARNING                                  │ │
│   │                                                                │ │
│   │   How knowledge gets INTO the system                          │ │
│   │   • Explicit capture (user teaches)                           │ │
│   │   • Implicit extraction (learns from conversation)            │ │
│   │   • Integration (connects new to existing)                    │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                      RETRIEVAL                                 │ │
│   │                                                                │ │
│   │   How knowledge gets OUT of the system                        │ │
│   │   • Context surfacing (what's relevant now)                   │ │
│   │   • Knowledge queries (what do we know about X?)              │ │
│   │   • Exploration (what knowledge exists?)                      │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                     MAINTENANCE                                │ │
│   │                                                                │ │
│   │   How knowledge stays HEALTHY                                 │ │
│   │   • Error correction (fix discrepancies)                      │ │
│   │   • Reorganization (improve structure)                        │ │
│   │   • Decay (archive stale knowledge)                           │ │
│   │   • Consistency (resolve conflicts)                           │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                       TRUST                                    │ │
│   │                                                                │ │
│   │   How user TRUSTS the system                                  │ │
│   │   • Provenance (where did this come from?)                    │ │
│   │   • Confidence (how certain is this?)                         │ │
│   │   • Transparency (what does Kahuna know/not know?)            │ │
│   │   • Control (user can override/correct)                       │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Learning Capabilities

| Capability | Description | Value Provided |
|------------|-------------|----------------|
| **Explicit learning** | User explicitly teaches something via `learn` tool | User can directly add knowledge; copilot remembers |
| **Implicit extraction** | System extracts learnings from conversation logs | Knowledge accumulates without explicit user action |
| **Pattern recognition** | Identifies recurring patterns across sessions | Surfaces insights user might not notice |
| **Error learning** | When user corrects copilot, captures the correction | Same mistake not repeated |
| **Decision capture** | Records decisions with rationale | Future work aligned with past decisions |
| **Integration** | Connects new knowledge to existing KB entries | Knowledge is structured, not scattered |

### 2.3 Retrieval Capabilities

| Capability | Description | Value Provided |
|------------|-------------|----------------|
| **Context surfacing** | Automatically provides relevant KB entries for current task | Copilot has relevant context without user action |
| **Query answering** | Answers questions about accumulated knowledge | User can interrogate what the system knows |
| **Knowledge exploration** | Browse/search the knowledge base | User can discover what's there |
| **Mode-aware retrieval** | Different contexts surface for different work modes | Architect vs. Code mode gets different knowledge |
| **Relevance ranking** | Most relevant entries surfaced first | Context window used efficiently |

### 2.4 Maintenance Capabilities

| Capability | Description | Value Provided |
|------------|-------------|----------------|
| **Discrepancy detection** | Identifies contradictions in KB | Problems found before they cause issues |
| **Automatic correction** | Fixes issues when confident | Maintenance happens without user effort |
| **Escalation** | Asks user when uncertain | Critical decisions stay with user |
| **Reorganization** | Restructures KB for better retrieval | Knowledge stays findable as it grows |
| **Decay/archiving** | Removes stale knowledge | KB doesn't get cluttered with outdated info |
| **Consistency enforcement** | Ensures KB doesn't contradict itself | Copilot doesn't give conflicting advice |

### 2.5 Trust Capabilities

| Capability | Description | Value Provided |
|------------|-------------|----------------|
| **Source tracking** | Records where knowledge came from | User can assess reliability |
| **Confidence scoring** | Each entry has a confidence level | User knows how certain the system is |
| **Uncertainty surfacing** | Explicitly flags low-confidence knowledge | User knows when to be cautious |
| **Override capability** | User can correct/update any entry | User stays in control |
| **Transparency reports** | User can see what Kahuna knows/doesn't know | No black box behavior |

---

## Part 3: Key Scenarios

### 3.1 Learning Scenarios

#### Scenario: Explicit Teaching

**Situation:** User wants the copilot to remember their preferred error handling pattern.

**What happens:**
1. User calls `kahuna_learn` with the pattern
2. Kahuna categorizes it (coding convention)
3. Kahuna stores with high confidence (user-explicit source)
4. Future sessions retrieve this when error handling is discussed

**User experience:**
- User: "Remember: we use Result types for error handling, not exceptions."
- Kahuna: "Got it. Stored as a coding convention."
- [Next session]
- User: "Implement this function..."
- Copilot: [Uses Result types, referencing the stored convention]

**Value delivered:** User teaches once, copilot remembers forever.

---

#### Scenario: Implicit Learning from Correction

**Situation:** User corrects a mistake the copilot made.

**What happens:**
1. Copilot suggests using a deprecated API
2. User: "No, we don't use the X API anymore. Use Y."
3. Kahuna extracts this correction during consolidation
4. Creates KB entry: "X API deprecated, use Y instead"
5. Future sessions retrieve this when X or Y is relevant

**User experience:**
- No explicit action needed
- Correction is captured automatically
- Same mistake not made again

**Value delivered:** Learning from mistakes without explicit teaching.

---

#### Scenario: Pattern Discovery

**Situation:** Kahuna notices a recurring pattern across multiple sessions.

**What happens:**
1. Integration agent notices: "User has corrected indentation style 3 times"
2. Creates entry: "Indentation: use 2 spaces, not tabs"
3. Surfaces this to user for confirmation
4. User confirms, entry becomes high-confidence

**User experience:**
- Kahuna: "I've noticed you prefer 2-space indentation. Should I remember this?"
- User: "Yes"
- [Future sessions use correct indentation]

**Value delivered:** System learns without explicit teaching.

---

### 3.2 Retrieval Scenarios

#### Scenario: Context Surfacing for New Task

**Situation:** User starts working on authentication, project has relevant past context.

**What happens:**
1. User: "Let's implement user authentication"
2. Copilot calls `kahuna_prepare_context` with task
3. Kahuna retrieves relevant entries:
   - Previous auth design decisions
   - Security requirements discussed before
   - Related API patterns used elsewhere
4. Returns context guide with ranked entries

**User experience:**
- Copilot immediately has relevant context
- User doesn't need to re-explain past decisions
- Implementation aligned with previous work

**Value delivered:** Past context automatically available.

---

#### Scenario: Answering a Knowledge Question

**Situation:** User wants to know what decisions were made about caching.

**What happens:**
1. User: "What do we know about our caching strategy?"
2. Copilot calls `kahuna_ask` with question
3. Kahuna retrieves all caching-related entries
4. Synthesizes answer with references

**User experience:**
- User: "What's our caching strategy?"
- Kahuna: "Based on previous discussions: Redis for session cache, CDN for static assets, no application-level caching yet. [References: session-123, session-145]"

**Value delivered:** Accumulated knowledge is queryable.

---

### 3.3 Maintenance Scenarios

#### Scenario: Automatic Discrepancy Fix

**Situation:** KB has conflicting information about database choice.

**What happens:**
1. Error handling detects conflict:
   - Entry A (2 weeks ago): "Using PostgreSQL"
   - Entry B (today): "Using SQLite for now"
2. Resolution strategy: recency wins
3. Update A to mark as superseded by B
4. No user action needed

**User experience:**
- User never sees the conflict
- Copilot consistently references SQLite

**Value delivered:** Self-healing knowledge base.

---

#### Scenario: Escalation to User

**Situation:** KB has conflicting information with equal confidence.

**What happens:**
1. Error handling detects conflict:
   - Entry A (user-explicit): "Always use TypeScript"
   - Entry B (user-explicit): "This module should stay in JavaScript for compatibility"
2. Cannot auto-resolve (both high confidence, user-explicit)
3. Escalate to user on next session

**User experience:**
- Kahuna: "I have conflicting info about TypeScript usage. Should we always use TypeScript, or is JavaScript acceptable for compatibility modules?"
- User: "Both are true. TypeScript default, but JS allowed for compatibility."
- Kahuna: [Updates entries to reflect nuance]

**Value delivered:** User in control of important decisions.

---

#### Scenario: Knowledge Decay

**Situation:** Old framework documentation is no longer relevant.

**What happens:**
1. Decay processor scans entries by last_accessed
2. Entry about "React 17 patterns" hasn't been accessed in 6 months
3. Salience score drops below threshold
4. Entry archived (not deleted)
5. User can still access if needed, but not surfaced by default

**User experience:**
- KB stays relevant to current work
- Old knowledge doesn't clutter retrieval
- Nothing permanently lost

**Value delivered:** KB stays clean without manual curation.

---

### 3.4 Trust Scenarios

#### Scenario: Confidence-Aware Suggestion

**Situation:** Copilot needs to make a suggestion based on low-confidence knowledge.

**What happens:**
1. Copilot retrieves entry about API design
2. Entry is marked: confidence=0.6, source=inferred
3. Copilot includes uncertainty in response

**User experience:**
- Copilot: "Based on previous discussions, it seems like you prefer REST over GraphQL, but I'm not certain. Would you like to confirm?"

**Value delivered:** User knows when to be cautious.

---

#### Scenario: Source Transparency

**Situation:** User wants to know where a recommendation came from.

**What happens:**
1. Copilot makes recommendation based on KB
2. User: "Why are you suggesting that?"
3. Copilot references source entries with provenance

**User experience:**
- User: "Why did you use this pattern?"
- Copilot: "Based on your explicit teaching in session abc-123 on Jan 15: 'We use the repository pattern for data access.'"

**Value delivered:** No black box behavior.

---

## Part 4: Architecture Mapping

### 4.1 Capability to Subsystem Mapping

| Capability | Primary Subsystem | Supporting Subsystems |
|------------|-------------------|----------------------|
| **Explicit learning** | Encoding | Storage |
| **Implicit extraction** | Consolidation (Extraction Agent) | Storage |
| **Pattern recognition** | Consolidation (Integration Agent) | Storage, Attention |
| **Error learning** | Consolidation (Extraction Agent) | Error Handling |
| **Decision capture** | Consolidation (Extraction Agent) | Storage |
| **Integration** | Consolidation (Integration Agent) | Error Handling, Storage |
| **Context surfacing** | Retrieval | Storage, Attention |
| **Query answering** | Retrieval | Storage |
| **Knowledge exploration** | Retrieval | Storage |
| **Mode-aware retrieval** | Retrieval | Storage |
| **Relevance ranking** | Retrieval (Relevance Ranker) | Attention |
| **Discrepancy detection** | Error Handling (Conflict Detector) | Storage |
| **Automatic correction** | Error Handling (Conflict Resolver) | Storage |
| **Escalation** | Error Handling (Escalation Handler) | — |
| **Reorganization** | Consolidation (Consolidation Agent) | Storage |
| **Decay/archiving** | Consolidation (Decay Processor) | Attention, Storage |
| **Consistency enforcement** | Error Handling | Consolidation |
| **Source tracking** | Encoding | Storage |
| **Confidence scoring** | Encoding, Consolidation | Attention |
| **Uncertainty surfacing** | Retrieval | — |
| **Override capability** | Encoding | Storage, Error Handling |
| **Transparency reports** | Retrieval | Storage |

### 4.2 Capability Support Assessment

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ARCHITECTURE SUPPORT MATRIX                         │
│                                                                      │
│   ✅ = Fully supported by architecture                              │
│   ⚠️  = Partially supported (needs subsystem design)                 │
│   ❌ = Not supported (gap)                                          │
│                                                                      │
│   LEARNING                           RETRIEVAL                       │
│   ────────                           ─────────                       │
│   ✅ Explicit learning               ✅ Context surfacing            │
│   ✅ Implicit extraction             ✅ Query answering              │
│   ⚠️  Pattern recognition             ⚠️  Knowledge exploration       │
│   ⚠️  Error learning                  ✅ Mode-aware retrieval        │
│   ⚠️  Decision capture                ✅ Relevance ranking           │
│   ✅ Integration                                                     │
│                                                                      │
│   MAINTENANCE                        TRUST                           │
│   ───────────                        ─────                           │
│   ✅ Discrepancy detection           ✅ Source tracking              │
│   ✅ Automatic correction            ✅ Confidence scoring           │
│   ✅ Escalation                      ⚠️  Uncertainty surfacing       │
│   ⚠️  Reorganization                  ⚠️  Override capability         │
│   ✅ Decay/archiving                 ❌ Transparency reports         │
│   ✅ Consistency enforcement                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Data Flow Through Architecture

```
                            USER ACTION
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            Explicit Learn              Task Request
                    │                       │
                    ▼                       ▼
            ┌───────────┐           ┌───────────┐
            │ ENCODING  │           │ RETRIEVAL │
            │           │           │           │
            │ Categorize│           │ Search    │
            │ Score     │           │ Rank      │
            │ Tag       │           │ Surface   │
            └─────┬─────┘           └─────┬─────┘
                  │                       │
                  ▼                       ▼
            ┌───────────┐           Context Guide
            │ STORAGE   │◀──────────────to copilot
            │           │
            │ KB Files  │
            │ Index     │
            │ Metadata  │
            └─────┬─────┘
                  │
                  │ session ends
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONSOLIDATION PIPELINE                            │
│                                                                      │
│   Conversation   ──▶  Episodes  ──▶  Proposals  ──▶  KB Updates     │
│   Log                                                                │
│                                                                      │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌─────────┐ │
│   │ EXTRACTION│────▶│INTEGRATION│────▶│   ERROR   │────▶│ CONSOL- │ │
│   │   AGENT   │     │   AGENT   │     │  HANDLING │     │ IDATION │ │
│   └───────────┘     └───────────┘     └───────────┘     └─────────┘ │
│                                                                      │
│   Implicit         Connect to KB     Detect/resolve    Apply updates│
│   extraction                         conflicts         Decay/reorg  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Gaps

### 5.1 Gaps Between Capabilities and Architecture

| Gap | Capability Affected | Description | Severity |
|-----|---------------------|-------------|----------|
| **Pattern recognition** | Implicit learning | Integration Agent detects conflicts but pattern recognition across sessions not explicitly designed | Medium |
| **Error learning** | Learning | Extraction Agent extracts episodes but doesn't have specific logic for "user corrected copilot" patterns | Medium |
| **Decision capture** | Learning | No specific entry type or processing for "decisions" vs general knowledge | Low |
| **Knowledge exploration** | Retrieval | No browse/explore UI or tool specified | Low |
| **Reorganization** | Maintenance | Consolidation Agent "reorganizes" but criteria/process undefined | Medium |
| **Transparency reports** | Trust | No capability for "what does Kahuna know" reporting | Low |
| **Override capability** | Trust | MCP tools exist but override/correct workflow not defined | Low |
| **Uncertainty surfacing** | Trust | Confidence stored but no defined way to surface it to user | Medium |

### 5.2 Gap Analysis

**Pattern Recognition Gap:**
- Current architecture extracts individual episodes and integrates them
- No component specifically looks for patterns ACROSS entries
- This could be added as a stage in Integration Agent or as a separate background agent

**Error Learning Gap:**
- Extraction Agent extracts "learning moments" generically
- Should have specific patterns for corrections: "No, don't do X, do Y instead"
- This is a subsystem design question, not architectural

**Uncertainty Surfacing Gap:**
- Confidence is computed and stored (Encoding, Attention)
- Retrieved entries include metadata
- No defined way for copilot to USE this confidence
- Need: Context guide format that includes confidence, or separate endpoint

### 5.3 Recommended Actions

| Gap | Recommended Action | When |
|-----|-------------------|------|
| Pattern recognition | Add to Integration Agent subsystem design | Subsystem design phase |
| Error learning | Add extraction patterns for corrections | Subsystem design phase |
| Decision capture | Define "decision" entry type | Subsystem design phase |
| Knowledge exploration | Add optional MCP tool | V2 |
| Reorganization | Define reorganization triggers/criteria | Subsystem design phase |
| Transparency reports | Add health/status MCP tool | V2 |
| Override capability | Define correction workflow | Subsystem design phase |
| Uncertainty surfacing | Include confidence in context guide format | Subsystem design phase |

---

## Part 6: Success Metrics

How do we know Kahuna is delivering value?

### 6.1 Learning Effectiveness

| Metric | What It Measures | Target |
|--------|------------------|--------|
| KB growth rate | Knowledge accumulation | Consistent growth per session |
| Explicit vs implicit ratio | Balance of learning modes | >50% implicit (learning without user effort) |
| Reuse rate | How often stored knowledge is retrieved | Majority of entries retrieved at least once |

### 6.2 Retrieval Quality

| Metric | What It Measures | Target |
|--------|------------------|--------|
| Context relevance | User finds surfaced context helpful | >80% relevant |
| Retrieval latency | Time to surface context | <1s for prepare_context |
| Coverage | How often relevant knowledge exists | Increases over time |

### 6.3 Maintenance Health

| Metric | What It Measures | Target |
|--------|------------------|--------|
| Conflict rate | How often conflicts detected | Decreases over time |
| Auto-resolution rate | Conflicts fixed without user | >90% |
| Decay effectiveness | Stale entries removed | KB size stays manageable |

### 6.4 User Trust

| Metric | What It Measures | Target |
|--------|------------------|--------|
| Override frequency | User corrections | Decreases over time |
| Escalation acceptance | User agrees with escalations | >80% |
| Confidence calibration | High-confidence = correct | Correlation >0.8 |

---

## Summary

### Value Proposition

Kahuna is memory for the coding copilot. It solves the problem of copilots forgetting context between sessions. The promise: each conversation better than the last.

### Capabilities

Four capability domains:
1. **Learning** — How knowledge gets in
2. **Retrieval** — How knowledge gets out
3. **Maintenance** — How knowledge stays healthy
4. **Trust** — How users trust the system

### Architecture Support

The current architecture supports most capabilities:
- **Fully supported:** Core learning, retrieval, maintenance, trust capabilities
- **Partially supported:** Pattern recognition, error learning, uncertainty surfacing
- **Gaps:** Transparency reports, knowledge exploration

### Key Insight

Kahuna doesn't just help copilots — it **completes** them. An LLM alone is an incomplete cognitive system. Kahuna provides the updateable prior (KB), the likelihood computation (retrieval), and the learning mechanism (consolidation) that turn the LLM into a system that can actually learn from experience.

---

## Changelog

- v2.1 (2026-03-07): Promoted to permanent documentation, cleaned up internal references
- v2.0 (2026-03-07): Added layered product model (Core + Specializations)
  - Part 0: Layered model overview with architecture diagram
  - Part 0.1: Kahuna Core definition (universal cognitive hardware)
  - Part 0.2: Specialization Interface definition
  - Part 0.3: Kahuna for Coding (first specialization)
  - Part 0.4: Architecture validation against layered model
  - Part 0.5: Future specializations (gaming copilot concept)
- v1.0 (2026-03-07): Initial product model definition
