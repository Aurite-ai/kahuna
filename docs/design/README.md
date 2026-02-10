# Kahuna MCP - Product Design

**Status:** Final
**Date:** 2026-02-05
**Scope:** Claude Code + LangGraph (initial release)

> **Implementation note:** These documents capture product-level design intent. For current implementation details (architecture, file formats, agent specifics), see [Architecture: Context Management System](../architecture/02-context-management-system.md).

---

## Document Index

| Document | Audience | Contents |
|----------|----------|----------|
| **This document** | Everyone | Product overview, core concepts, design decisions |
| [user-journey.md](./user-journey.md) | Everyone | Day 1 → Month 2 user scenarios |
| [tool-specifications.md](./tool-specifications.md) | Implementers | Detailed MCP tool specs |
| [knowledge-architecture.md](./knowledge-architecture.md) | Implementers | Knowledge base structure and flows |
| [copilot-configuration.md](./copilot-configuration.md) | Implementers | Files created by `kahuna_initialize` |

---

## 1. Product Overview

### What Is Kahuna MCP?

Kahuna MCP is an MCP server that transforms empty folders into structured agent development environments for "vibe coders" building LangGraph agents with Claude Code.

**Target Users:** Non-developer "vibe coders" - employees building business agents without formal developer training.

**Core Problem:** Coding copilots are powerful but forgetful. Every session starts fresh. Users repeat themselves. Copilots make the same mistakes twice. Knowledge is lost between sessions.

**Core Value Proposition:** "Surfacing information instead of querying for it."

Unlike tools like Context7 that expect copilots to know what to query, Kahuna's agents determine what context is relevant and surface it proactively. The copilot doesn't ask "what do I need?" - Kahuna tells it.

### What Kahuna Is NOT

- **Not a RAG system** - RAG retrieves code snippets based on queries. Kahuna proactively surfaces synthesized knowledge at the right time.
- **Not just storage** - Traditional knowledge bases store and retrieve. Kahuna's agents synthesize, organize, and surface.
- **Not a memory feature** - Built-in copilot memory is shallow (preferences, names). Kahuna captures deep context: decisions, policies, requirements, project-specific patterns.

### What Kahuna IS

**Kahuna is an agent-powered documentation generator.** Its agents:
1. **Ingest** files and conversation logs
2. **Synthesize** structured markdown capturing the relevant knowledge
3. **Organize** the knowledge base structure (agents decide how)
4. **Surface** the right context at the right time

---

## 2. Core Concepts

### 2.1 Two Knowledge Input Channels

Kahuna accepts knowledge from two sources:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KNOWLEDGE INPUTS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CONVERSATIONS                          USER FILES                          │
│   ─────────────                          ──────────                          │
│                                                                              │
│   Claude Code session logs               Policies, specs, requirements       │
│   contain implicit knowledge:            contain explicit knowledge:         │
│                                                                              │
│   • Decisions made and why               • Business rules                    │
│   • Alternatives considered              • API specifications                │
│   • Problems encountered                 • Compliance requirements           │
│   • Lessons learned                      • Technical constraints             │
│   • User preferences                     • Reference documentation           │
│                                                                              │
│   Kahuna EXTRACTS this knowledge         Kahuna CLASSIFIES and STORES       │
│   from conversation patterns             for appropriate retrieval           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   KNOWLEDGE BASE    │
                    │                     │
                    │   context/          │
                    │   ├── decisions/    │
                    │   ├── patterns/     │
                    │   ├── policies/     │
                    │   └── reference/    │
                    └─────────────────────┘
```

**The "Throw Files at Kahuna" Pattern:**

The copilot can send any file to Kahuna with minimal explanation:

> "Here's our company's API design guidelines"

Kahuna's agents:
1. Classify what kind of knowledge this is (policy, spec, reference, etc.)
2. Determine if/how it should affect the knowledge base
3. Store it appropriately for later surfacing
4. Report back what was done

The copilot MAY provide context ("this is our security policy"), but the goal is for Kahuna to figure it out.

### 2.2 Conversations as Semantic Changelog

**The Thesis:** Conversation logs capture knowledge that files cannot.

| Files tell you | Conversations tell you |
|----------------|------------------------|
| What code exists | Why it was written that way |
| Current state | What alternatives were considered |
| The destination | The journey |

A git diff shows "added timeout variable." The conversation reveals: the user was experiencing timeouts on large queries, Promise.all with timeout fallback was chosen over other approaches, and how to verify the fix works.

**Application:** Kahuna agents extract the "why" and "how" from conversations, not just the "what" from files.

### 2.3 Surfacing, Not Storage

> "The value isn't in storing knowledge - it's in surfacing the right knowledge at the right time."

**Wrong:** User manually queries a knowledge base
**Right:** Copilot automatically receives relevant context for the current task

The copilot describes what it's doing, and Kahuna's agents determine what's relevant. This is the inverse of RAG-style "query and retrieve."

### 2.4 Files as Interface

The `context/` folder is the interface between Kahuna and the copilot.

```
project/
└── context/
    ├── README.md           # Navigation guide (auto-generated by agents)
    ├── [curated]/          # Initial patterns from kahuna_initialize (e.g., langgraph/)
    └── task/               # Task-specific context (replaced per task)
```

**Initial structure:** `kahuna_initialize` pre-populates `context/` with curated patterns (e.g., `langgraph/` folder with best practices). This provides Day 1 value.

**Subsequent structure:** Agents extend the structure based on content. The curated patterns persist, while `context/task/` is cleared and repopulated for each new task via `kahuna_prepare_context`.

**Why files?** Copilots already know how to read files and follow links. No special retrieval protocol needed. The knowledge base is structured markdown that copilots navigate naturally.

### 2.5 Two-Stage Processing

```
DETECT → CLASSIFY → GATE → PROCESS
         [No LLM cost]     [LLM cost]
```

Only content that passes the gate incurs LLM costs. Use heuristics and pattern matching first, reserve agent processing for what actually needs it.

### 2.6 LLM-Catered Responses with Steering Hints

All tool responses include actionable hints guiding what to do next:

```markdown
<hints>
## What You Can Do Next

- **Read the full decision**: Use `read_file` on `context/decisions/search-approach.md`
- **Check the policy**: The API guidelines affect how you should implement this
- **Start implementation**: The decision above provides the rationale you need
</hints>
```

---

## 3. MCP Tools

Four active tools (plus one deferred) in three categories. See [tool-specifications.md](./tool-specifications.md) for detailed specs.

| Category | Tools | Purpose |
|----------|-------|---------|
| **Building Knowledge Base** | `kahuna_learn`, `kahuna_sync` (deferred) | Populate ~/.kahuna with knowledge |
| **Environment Setup** | `kahuna_initialize`, `kahuna_prepare_context` | Prepare project for development |
| **Assistance** | `kahuna_ask` | Use context + KB to help copilot |

> **Note:** Verification/review is handled through a copilot skill rather than an MCP tool. See [copilot-configuration.md](./copilot-configuration.md) for skill details.

---

## 4. Cold Start Strategy

**Problem:** Users want Day 1 value, but conversation-based knowledge requires history.

**Solution:** Layered value delivery

| Layer | Source | Day 1? | Description |
|-------|--------|--------|-------------|
| 1. Curated Patterns | Kahuna-provided | ✅ Yes | LangGraph best practices |
| 2. Project Structure | Init template | ✅ Yes | Boilerplate that embodies patterns |
| 3. User Files | Policies, specs | ✅ Yes | Immediate if user has existing docs |
| 4. Project Decisions | Extracted from work | After first task | Specific to this project |
| 5. Historical Context | Accumulated | Over time | Rich "why" from conversations |

**Day 1 is not empty:**
- Curated LangGraph patterns provide real guidance
- If user has existing policy docs, they can send them immediately
- Task context steering works even without project history

---

## 5. Design Decisions

### 5.1 Two Input Channels (Conversations + Files)

**Decision:** Kahuna accepts knowledge from both conversation logs AND user-provided files.

**Rationale:**
- Conversations capture implicit knowledge (decisions, rationale, lessons)
- User files provide explicit knowledge (policies, requirements, specs)
- Both are valuable; neither is sufficient alone
- "Throw files at it" is a natural user mental model

### 5.2 Files as Interface

**Decision:** Request Task Context writes to `context/task/` rather than returning content directly.

**Rationale:**
- Copilots already know how to read files
- No special parsing of tool output needed
- Context persists if copilot needs to re-read
- Consistent model across all knowledge access

### 5.3 Single Natural Language Parameter

**Decision:** Most tools accept a single natural language parameter rather than complex structured inputs.

**Rationale:**
- Fewer parameters = fewer LLM mistakes
- Natural language is how copilots think
- The tool can be smarter about parsing intent

### 5.4 Agent-Determined Structure

**Decision:** Agents determine the `context/` folder structure based on content, rather than predefined categories.

**Rationale:**
- Fits "agents figure it out" philosophy
- Avoids premature categorization decisions
- Can iterate on structure approach without changing design
- `README.md` provides navigation regardless of structure

### 5.5 Automatic Classification

**Decision:** Kahuna classifies incoming files automatically; copilot provides optional hints.

**Rationale:**
- Reduces copilot cognitive load
- "Throw files at it" pattern is more natural
- Hints can improve classification but aren't required
- Agents can ask for clarification if truly ambiguous

### 5.6 Curated Patterns for Cold Start

**Decision:** Init pre-populates `context/` with LangGraph-specific starter content.

**Rationale:**
- Users need Day 1 value
- LangGraph has established best practices
- Content can evolve as project develops

### 5.7 Claude Code + LangGraph Focus

**Decision:** Initial release targets only Claude Code + LangGraph.

**Rationale:**
- One-month timeline requires focus
- LangGraph is the dominant agent framework
- Claude Code has accessible conversation logs
- Can expand later

---

## 6. Out of Scope (Deferred)

| Feature | Reason | Future Phase |
|---------|--------|--------------|
| PR Review Action | Requires GitHub infrastructure | Phase 2 |
| Deployment Skills | Not core to knowledge management | Phase 2 |
| Multi-project Knowledge | Adds complexity | Phase 3 |
| Other Copilots | Different log formats | After validation |
| Other Frameworks | Focus first | After validation |
| Vector/Semantic Search | Keyword sufficient for MVP | If scale requires |

---

## Changelog

- v1.0 (2026-02-05): Initial authoritative design consolidating documents 00-08
- v1.1 (2026-02-05): Added file-based knowledge input; restructured as overview document
- v1.2 (2026-02-05): Clarified Kahuna as agent-powered documentation generator; adopted agent-determined structure for context/
- v1.3 (2026-02-05): Finalized tool names: setup, learn, prepare_context, ask, review, sync
- v1.4 (2026-02-05): Two-stage architecture; tool categories; assistance tools use context + KB
- v1.5 (2026-02-05): Added 09d-copilot-configuration.md to document index; updated 09b/09c status
- v1.6 (2026-02-05): Clarified context/ structure (curated + task/); fixed ~/.kahuna as global; aligned status terminology
- v2.0 (2026-02-05): Promoted to docs/design/; restructured as conceptual overview (technical details moved to companion docs)
- v2.1 (2026-02-09): Renamed kahuna_setup → kahuna_initialize; removed kahuna_review (now skill-based); updated tool table
