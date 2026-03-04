# Kahuna MCP - Knowledge Architecture

**Status:** Final
**Date:** 2026-03-04
**Parent:** [README.md](./README.md)

---

## Overview

Kahuna maintains a **global knowledge base** at `~/.kahuna/` that stores classified files from all projects. When a copilot needs context for a task, Kahuna surfaces relevant entries from the knowledge base to the project's `.kahuna/context-guide.md` file.

### Two-Stage Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           KNOWLEDGE FLOW                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STAGE 1: LEARN                                                             │
│   ──────────────                                                             │
│                                                                              │
│   User files ────► kahuna_learn ────► ~/.kahuna/                             │
│   (policies, specs,                   (classified, stored)                   │
│    conversations)                                                            │
│                                                                              │
│   - Files are classified by type                                             │
│   - Metadata added (source, date, project)                                   │
│   - Stored in knowledge base                                                 │
│   - NOT written to project .kahuna/context-guide.md yet                              │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STAGE 2: PREPARE                                                           │
│   ────────────────                                                           │
│                                                                              │
│   Task description ────► kahuna_prepare_context ────► .kahuna/context-guide.md       │
│                                                       (task-relevant)        │
│                                                                              │
│   - Searches knowledge base for relevant entries                             │
│   - Surfaces subset to project's .kahuna/context-guide.md                            │
│   - Copilot reads .kahuna/context-guide.md during task                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Principle: Separation of Storage and Surfacing

| Stage | Tool | What Happens | Output Location |
|-------|------|--------------|-----------------|
| **Learn** | `kahuna_learn` | Classify and store | `~/.kahuna/` |
| **Prepare** | `kahuna_prepare_context` | Search and surface | `project/.kahuna/context-guide.md` |

---

## Knowledge Base: ~/.kahuna/

The global knowledge base lives at `~/.kahuna/`. This folder is:
- **Persistent** - Survives across sessions
- **Global** - Shared across all projects
- **Hidden** - User doesn't interact directly

### Folder Structure

```
~/.kahuna/
├── knowledge/                # Classified knowledge entries (.mdc files)
│   ├── api-design-guidelines.mdc    # Slug-based naming
│   ├── org-context.mdc              # Organization context
│   ├── user-context.mdc             # User preferences
│   └── ...
│
└── integrations/             # Discovered integration descriptors
    └── ...
```

### .mdc Format (Markdown with Context)

All knowledge entries use the `.mdc` format - a single file combining YAML frontmatter metadata with markdown content.

**Example knowledge entry:** `~/.kahuna/knowledge/api-design-guidelines.mdc`

```markdown
---
type: knowledge
title: API Design Guidelines
summary: >
  REST API design standards covering naming conventions, error response format,
  and authentication requirements.
created_at: 2026-02-10T00:00:00Z
updated_at: 2026-02-10T00:00:00Z

source:
  file: api-guidelines.md
  path: /home/user/my-project/docs/api-guidelines.md
  project: /home/user/my-project

classification:
  category: policy
  confidence: 0.92
  reasoning: Contains organizational rules and constraints for API design
  topics:
    - API Design
    - REST Conventions
    - Authentication

status: active
---

[Original file content here]
```

### Classification Categories

Categories determined by LLM agent during `kahuna_learn`:

| Category | Description | Examples |
|----------|-------------|----------|
| **policy** | Business rules, constraints, organizational standards | API guidelines, security policies |
| **requirement** | Requirements, specifications, user stories | PRDs, feature specs |
| **reference** | Technical documentation, API specs, schemas | API docs, architecture docs |
| **decision** | Decision records, rationale, trade-off analyses | ADRs, technology choices |
| **pattern** | Implementation patterns, reusable examples | Code patterns, config templates |
| **context** | General background, overviews, or unclear fit | README files, onboarding docs |

> **Note:** The `integration` category is defined in the type system but currently has a bug preventing its use. Integration detection is handled separately via pattern matching during `kahuna_learn`.

### Integration Discovery

Integrations (external services, APIs, databases) are discovered during `kahuna_learn` through:
1. **Pattern matching** - Detecting service names, connection strings, SDK imports
2. **1Password references** - Extracting credentials references

Discovered integrations are stored in `~/.kahuna/integrations/` and can be:
- Listed via `kahuna_list_integrations`
- Verified via `kahuna_verify_integration`
- Executed via `kahuna_use_integration`

---

## Project Context: .kahuna/context-guide.md

Each project has a `.kahuna/context-guide.md` file that receives surfaced knowledge.

### Folder Structure

```
project/
└── .kahuna/context-guide.md
```

### How .kahuna/context-guide.md Gets Populated

`kahuna_prepare_context` populates `.kahuna/context-guide.md` with task-relevant entries:

1. **Receives** task description
2. **Searches** `~/.kahuna/knowledge/` for relevant entries
3. **Generates** `.kahuna/context-guide.md` with navigation

### README.md Format

```markdown
# Context for: Add rate limiting to the search tool

Surfaced from Kahuna knowledge base on 2026-02-05.

## Relevant Context

| File | Why Relevant |
|------|--------------|
| [api-guidelines.md](./api-guidelines.md) | Contains rate limiting requirements |
| [error-handling.md](./error-handling.md) | Error handling patterns to follow |
| [search-decision.md](./search-decision.md) | Existing search implementation context |

## Getting Started

1. Review the API guidelines for rate limiting requirements
2. Follow error handling patterns for rate limit errors
3. Consider existing search implementation when adding rate limiting

---

*Prepared by Kahuna | Use `kahuna_ask` for additional questions*
```

---

## Tool Interactions

### Tool Categories

| Category | Tools | Data Flow |
|----------|-------|-----------|
| **Building KB** | learn | Files → ~/.kahuna/knowledge/ |
| **Environment** | initialize, prepare_context | ~/.kahuna → .kahuna/context-guide.md |
| **Assistance** | ask | ~/.kahuna/knowledge/ → response |
| **Integrations** | list_integrations, use_integration, verify_integration | ~/.kahuna/integrations/ |

### kahuna_initialize (Environment)

**Creates:**
- Copilot configuration in project `.claude/` directory
- Seeds knowledge base with initial `.mdc` files

**Does not create:** `context-guide.md` (that's `kahuna_prepare_context`)

### kahuna_learn (Building KB)

**Reads:**
- User-provided files/folders (recursive)

**Writes to ~/.kahuna/:**
- New `.mdc` file in `knowledge/[slug].mdc` (slug-based naming, not UUIDs)
- YAML frontmatter with classification metadata
- Markdown content below frontmatter
- Integration descriptors to `integrations/` if detected

**Does NOT write to:** `project/.kahuna/context-guide.md`

### kahuna_prepare_context (Environment)

**Reads:**
- Task description
- `~/.kahuna/knowledge/` entries

**Writes to project/.kahuna/context-guide.md:**
- File paths referencing KB entries (not copies)
- Foundation context (`org-context`, `user-context`) auto-included

### kahuna_ask (Assistance)

**Reads:**
1. `project/.kahuna/context-guide.md` (if exists) - to know what's already surfaced
2. `~/.kahuna/knowledge/` - searches for answer

**Writes:** Nothing (returns text response)

---

## Classification Flow

For `kahuna_learn`, the classification is LLM-powered:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        CLASSIFICATION FLOW                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. RECEIVE FILE                                                            │
│      └── Get file path + optional description                                │
│                                                                              │
│   2. READ CONTENT                                                            │
│      └── Load file content                                                   │
│                                                                              │
│   3. CLASSIFY (LLM Agent - Haiku)                                            │
│      └── Agent uses categorize_file tool to determine:                       │
│          ├── Category (policy, requirement, reference, etc.)                 │
│          ├── Confidence score                                                │
│          ├── Reasoning                                                       │
│          ├── Title (LLM-generated)                                           │
│          ├── Summary                                                         │
│          └── Topics (natural language phrases)                               │
│                                                                              │
│   4. DETECT CONTRADICTIONS                                                   │
│      └── Agent compares with existing KB files                               │
│                                                                              │
│   5. STORE                                                                   │
│      └── Write single .mdc file to ~/.kahuna/knowledge/[slug].mdc            │
│          (YAML frontmatter + markdown content)                               │
│                                                                              │
│   6. REPORT                                                                  │
│      └── Return summary with contradictions if found                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Surfacing Flow (MVP)

For `kahuna_prepare_context`, the MVP surfacing process:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SURFACING FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. RECEIVE TASK                                                           │
│      └── Get task description + optional file hints                         │
│                                                                             │
│   2. PARSE INTENT                                                           │
│      ├── Extract keywords                                                   │
│      ├── Identify topic areas                                               │
│      └── Note file references                                               │
│                                                                             │
│   3. SEARCH KNOWLEDGE BASE                                                  │
│      ├── Scan ~/.kahuna/knowledge/ metadata                                 │
│      ├── Score relevance by:                                                │
│      │   ├── Tag matches                                                    │
│      │   ├── Category matches                                               │
│      │   ├── Title/content keyword matches                                  │
│      │   └── Project relevance (same project = higher)                      │
│      └── Rank results                                                       │
│                                                                             │
│   4. SELECT TOP N                                                           │
│      └── Take most relevant entries (configurable, default: 5-10)           │
│                                                                             │
│   5. SURFACE TO .kahuna/context-guide.md                                            │
│      ├── Clear .kahuna/context-guide.md (task-specific, replaced each task)         │
│      ├── Store paths to relevant entries in .kahuna/context-guide.md                │
│                                                                             │
│   6. REPORT                                                                 │
│      └── Return summary of what was surfaced                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Evolution Path

The knowledge architecture evolves from simple to sophisticated:

### Phase 1: Classify and Copy (MVP)

**kahuna_learn:**
- Accept files
- Basic category classification
- Store original content with metadata

**kahuna_prepare_context:**
- Accept task description
- Simple keyword search on metadata/content
- Compile relevant entries into .kahuna/context-guide.md
- Generate navigation and section headers

**Value:** Files are organized and searchable. Context is surfaced per-task.

### Phase 2: Agent-Enhanced Content

**kahuna_learn improvements:**
- Agents rewrite files into structured markdown
- Extract key points, summaries
- Normalize format for consistency

**kahuna_prepare_context improvements:**
- Agents synthesize new documents from multiple sources
- Pull relevant portions from several files into one context doc
- Prepare context in `~/.kahuna/prepared/`, then copy to project

**Value:** Context is higher quality, more focused.

### Phase 3: Intelligent Knowledge Management

- Semantic search (embeddings)
- Automatic relationship detection
- Conflict/duplicate resolution
- Staleness tracking
- Knowledge graph

**Value:** Knowledge base becomes truly intelligent.

---

## Implementation Status

### Implemented

1. **Knowledge base structure**
   - `~/.kahuna/knowledge/` with flat `.mdc` files
   - Slug-based naming (human-readable)
   - YAML frontmatter with simplified metadata

2. **Classification (kahuna_learn)**
   - LLM-powered categorization (Haiku)
   - Contradiction detection
   - Integration discovery via pattern matching
   - Sensitive data redaction

3. **Surfacing (kahuna_prepare_context)**
   - LLM agent selects relevant KB files
   - Foundation context auto-inclusion (org-context, user-context)
   - Framework selection and boilerplate copying
   - Writes file paths to `.kahuna/context-guide.md`

4. **Q&A (kahuna_ask)**
   - LLM agent synthesizes answers from KB (Sonnet)
   - Aware of already-surfaced context

### Not Implemented

- `kahuna_sync` (conversation processing, git diff)
- Conversation log storage and retrieval
- `~/.kahuna/prepared/` staging directory

---

## Design Decisions

### Why Global Knowledge Base (~/.kahuna)?

**Decision:** Store knowledge globally at `~/.kahuna/` rather than per-project.

**Rationale:**
- Knowledge can apply across projects
- Policies and patterns often shared
- Avoids duplicating common knowledge
- Simpler mental model for users

### Why Separate Learn from Prepare?

**Decision:** Two-stage process: learn (store) then prepare (surface).

**Rationale:**
- Not everything learned is relevant to every task
- Surfacing can be task-specific
- Knowledge base grows over time
- Prepare can be smart about what's relevant

### Why Single File Instead of Multiple Files?

**Decision:** Generate single `.kahuna/context-guide.md` file rather than multiple files.

**Rationale:**
- Copilots read files directly
- No dependency on Kahuna at read time
- Context is portable (can be committed)
- Simpler debugging

### Why .mdc Format Over Folder+JSON?

**Decision:** Use single `.mdc` files (markdown with YAML frontmatter) instead of folders with separate `metadata.json` and `content.md`.

**Rationale:**
- **Simpler structure** - One file instead of two
- **Consistent** - Same format for knowledge entries and conversation logs
- **Self-contained** - Metadata and content together
- **Standard format** - YAML frontmatter is widely understood
- **Easier debugging** - Can read/edit with any text editor

---

## Open Questions

1. **Multi-project knowledge:** Should knowledge be tagged by project? Global search or project-scoped?

## Resolved Questions

**Context regeneration (resolved):** When preparing context for a new task:
- **Overwrite** `.kahuna/context-guide.md` - Entire file is regenerated each time
- This ensures task context is always fresh and relevant

**Foundation context (resolved):**
- `org-context` and `user-context` KB entries are auto-included in every `prepare_context`
- No agent selection required for these foundation entries

---

## Changelog

- v1.0 (2026-02-05): Initial knowledge architecture specification
- v2.0 (2026-02-05): Revised to two-stage model: learn → ~/.kahuna, prepare → .kahuna/context-guide.md
- v2.1 (2026-02-05): Added evolution path, conversation log format, prepared staging
- v2.2 (2026-02-05): Tool categories; assistance tools use .kahuna/context-guide.md + KB; learn accepts folders
- v2.3 (2026-02-05): Changed to .mdc format (YAML frontmatter + markdown) instead of folder+JSON
- v2.4 (2026-02-05): Fixed Tool Interactions to use .mdc; resolved context merging question
- v3.0 (2026-02-05): Promoted to docs/design/; updated links and status to Final
- v3.1 (2026-02-09): Renamed kahuna_setup → kahuna_initialize; removed kahuna_review (now skill-based)
- v3.2 (2026-02-09): Added `integration` category for data sources, tools, and external services
- v4.0 (2026-03-04): Synced with implementation:
  - Fixed folder structure (removed unimplemented config.json, state.json, conversations/, prepared/)
  - Fixed file naming (slug-based, not UUID)
  - Fixed metadata format (simplified: category, confidence, reasoning, title, summary, topics)
  - Fixed classification flow (LLM-only, no heuristics)
  - Removed conversation log format section (not implemented)
  - Updated tool interactions to match implementation
  - Added foundation context auto-inclusion
