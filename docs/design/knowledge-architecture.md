# Kahuna MCP - Knowledge Architecture

**Status:** Final
**Date:** 2026-02-05
**Parent:** [README.md](./README.md)

---

## Overview

Kahuna maintains a **global knowledge base** at `~/.kahuna/` that stores classified files from all projects. When a copilot needs context for a task, Kahuna surfaces relevant entries from the knowledge base to the project's `.context-guide.md` file.

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
│   - NOT written to project .context-guide.md yet                              │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STAGE 2: PREPARE                                                           │
│   ────────────────                                                           │
│                                                                              │
│   Task description ────► kahuna_prepare_context ────► .context-guide.md       │
│                                                       (task-relevant)        │
│                                                                              │
│   - Searches knowledge base for relevant entries                             │
│   - Surfaces subset to project's .context-guide.md                            │
│   - Copilot reads .context-guide.md during task                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Principle: Separation of Storage and Surfacing

| Stage | Tool | What Happens | Output Location |
|-------|------|--------------|-----------------|
| **Learn** | `kahuna_learn` | Classify and store | `~/.kahuna/` |
| **Prepare** | `kahuna_prepare_context` | Search and surface | `project/.context-guide.md` |

---

## Knowledge Base: ~/.kahuna/

The global knowledge base lives at `~/.kahuna/`. This folder is:
- **Persistent** - Survives across sessions
- **Global** - Shared across all projects
- **Hidden** - User doesn't interact directly

### Folder Structure

```
~/.kahuna/
├── config.json               # Global Kahuna configuration
├── state.json                # Processing state, sync tracking
│
├── knowledge/                # Classified knowledge entries (.mdc files)
│   ├── [uuid-1].mdc          # Knowledge entry with frontmatter
│   ├── [uuid-2].mdc
│   └── ...
│
├── conversations/            # Processed conversation summaries (.mdc files)
│   ├── [session-id-1].mdc
│   ├── [session-id-2].mdc
│   └── ...
│
└── prepared/                 # Staged context for projects (future)
    └── [project-hash]/       # Prepared context ready to copy
        └── ...
```

### .mdc Format (Markdown with Context)

All knowledge entries use the `.mdc` format - a single file combining YAML frontmatter metadata with markdown content. This is simpler than folder+JSON and consistent with how conversation logs are stored.

**Example knowledge entry:** `~/.kahuna/knowledge/uuid-1234.mdc`

```markdown
---
id: uuid-1234
type: policy
title: API Design Guidelines
source:
  file: /path/to/original/api-guidelines.md
  project: customer-support-agent
  date: 2026-02-05T14:30:00Z
classification:
  category: policy
  subcategory: api-design
  tags:
    - rest
    - api
    - guidelines
  confidence: 0.92
status: active
---

# API Design Guidelines

**Original file:** /projects/support-agent/docs/api-guidelines.md

## Summary

REST API design standards for the organization.

## Key Points

- Use resource nouns, not verbs
- Standard error response format
- JWT authentication required
- Rate limiting: 100 req/min

## Full Content

[Original file content or reference]
```

### Classification Categories

MVP categories (agents determine during learn):

| Category | Description | Examples |
|----------|-------------|----------|
| **policy** | Business rules, constraints | API guidelines, security policies |
| **requirement** | What the system must do | Feature specs, user stories |
| **reference** | Background information | Documentation, specs |
| **decision** | Choices with rationale | Architecture decisions |
| **pattern** | Reusable approaches | Code patterns, workflows |
| **context** | General background | Company info, domain knowledge |

---

## Project Context: .context-guide.md

Each project has a `.context-guide.md` file that receives surfaced knowledge.

### Folder Structure

```
project/
└── .context-guide.md
```

### How .context-guide.md Gets Populated

`kahuna_prepare_context` populates `.context-guide.md` with task-relevant entries:

1. **Receives** task description
2. **Searches** `~/.kahuna/knowledge/` for relevant entries
3. **Generates** `.context-guide.md` with navigation

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
| **Building KB** | learn, sync | Files → ~/.kahuna |
| **Environment** | initialize, prepare_context | ~/.kahuna → .context-guide.md |
| **Assistance** | ask | .context-guide.md + ~/.kahuna → response |

### kahuna_initialize (Environment)

**Creates:**
- `project/.context-guide.md` (minimal initial version)

**Does not create:** Knowledge base entries (that's `kahuna_learn`)

> **Note:** Verification/review functionality is handled by a copilot skill rather than an MCP tool. See [copilot-configuration.md](./copilot-configuration.md).

### kahuna_learn (Building KB)

**Reads:**
- User-provided files/folders (recursive)

**Writes to ~/.kahuna/:**
- New `.mdc` file in `knowledge/[uuid].mdc`
- YAML frontmatter with classification metadata
- Markdown content below frontmatter

**Does NOT write to:** `project/.context-guide.md`

### kahuna_prepare_context (Environment)

**Reads:**
- Task description
- `~/.kahuna/knowledge/` entries
- `~/.kahuna/conversations/` summaries

**Writes to project/.context-guide.md:**
- Surfaced knowledge entries

### kahuna_ask (Assistance)

**Reads (in order):**
1. `project/.context-guide.md` (if exists) - checked first
2. `~/.kahuna/knowledge/` - fallback/additional

**Writes:** Nothing (returns text response)

### kahuna_sync (Building KB)

**Reads:**
- Conversation logs
- Git diff (future)

**Writes to ~/.kahuna/:**
- Processed conversations to `conversations/`
- Extracted knowledge to `knowledge/`

---

## Classification Flow (MVP)

For `kahuna_learn`, the MVP classification process:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        CLASSIFICATION FLOW                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. RECEIVE FILE                                                            │
│      └── Get file path + optional description                                │
│                                                                              │
│   2. READ CONTENT                                                            │
│      └── Load file, detect format (md, txt, code, etc.)                      │
│                                                                              │
│   3. CLASSIFY (heuristics first, LLM if needed)                              │
│      ├── Check filename patterns (policy, spec, requirements)                │
│      ├── Check content patterns (headings, structure)                        │
│      └── Use LLM for ambiguous cases                                         │
│                                                                              │
│   4. EXTRACT METADATA                                                        │
│      ├── Title (from content or filename)                                    │
│      ├── Tags (from content analysis)                                        │
│      └── Summary (LLM-generated if needed)                                   │
│                                                                              │
│   5. STORE                                                                   │
│      └── Write single .mdc file to ~/.kahuna/knowledge/[uuid].mdc            │
│          (YAML frontmatter + markdown content)                               │
│                                                                              │
│                                                                              │
│   6. REPORT                                                                  │
│      └── Return summary of what was learned                                  │
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
│   5. SURFACE TO .context-guide.md                                            │
│      ├── Clear .context-guide.md (task-specific, replaced each task)         │
│      ├── Store paths to relevant entries in .context-guide.md                │
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
- Compile relevant entries into .context-guide.md
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

## MVP Scope

### Build First

1. **Knowledge base structure**
   - `~/.kahuna/knowledge/` folder structure
   - `~/.kahuna/conversations/` for processed conversation logs
   - `metadata.json` format
   - Basic file storage

2. **Classification (kahuna_learn)**
   - Accept files
   - Basic category classification (heuristics)
   - Store original content with metadata

3. **Surfacing (kahuna_prepare_context)**
   - Accept task description
   - Simple keyword search
   - Compile relevant entries into .context-guide.md
   - Generate navigation and section headers

4. **Conversation integration**
   - Processed conversation logs (existing format) are searchable
   - Surfaced when relevant to task

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

**Decision:** Generate single `.context-guide.md` file rather than multiple files.

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

## Conversation Log Format

Processed conversation logs use the same `.mdc` format, stored in `~/.kahuna/conversations/`.

**Example:** `~/.kahuna/conversations/c1e44692-bca2-4899-974e-cd272d8ea936.mdc`

```markdown
---
title: Build TechFlow AI Customer Support Agent
session_id: c1e44692-bca2-4899-974e-cd272d8ea936
source: /path/to/original.jsonl
date: 2026-01-29
task_type: implementation
outcome: completed
confidence: 0.95
---

# Build TechFlow AI Customer Support Agent

## Summary

[What was accomplished in this session]

## Decisions Made

1. **Decision title** - Rationale
2. **Another decision** - Rationale

## Files Created

- /path/to/file1.md
- /path/to/file2.py

## Files Modified

- /path/to/existing1.py
- /path/to/existing2.py

---
*Generated by Kahuna conversation processor*
```

**Key frontmatter fields:**
- `task_type`: implementation, design, debugging, research, refactoring
- `outcome`: completed, blocked, in-progress, abandoned
- `confidence`: How confident the processor is in the summary

---

## Open Questions

1. **Multi-project knowledge:** Should knowledge be tagged by project? Global search or project-scoped?

2. **Prepared staging:** Should context be prepared in `~/.kahuna/prepared/` first, then copied?

## Resolved Questions

**Context regeneration (resolved):** When preparing context for a new task:
- **Overwrite** `.context-guide.md` - Entire file is regenerated each time
- This ensures task context is always fresh and relevant

---

## Changelog

- v1.0 (2026-02-05): Initial knowledge architecture specification
- v2.0 (2026-02-05): Revised to two-stage model: learn → ~/.kahuna, prepare → .context-guide.md
- v2.1 (2026-02-05): Added evolution path, conversation log format, prepared staging
- v2.2 (2026-02-05): Tool categories; assistance tools use .context-guide.md + KB; learn accepts folders
- v2.3 (2026-02-05): Changed to .mdc format (YAML frontmatter + markdown) instead of folder+JSON
- v2.4 (2026-02-05): Fixed Tool Interactions to use .mdc; resolved context merging question
- v3.0 (2026-02-05): Promoted to docs/design/; updated links and status to Final
- v3.1 (2026-02-09): Renamed kahuna_setup → kahuna_initialize; removed kahuna_review (now skill-based)
