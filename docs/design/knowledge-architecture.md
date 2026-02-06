# Kahuna MCP - Knowledge Architecture

**Status:** Final
**Date:** 2026-02-05
**Parent:** [README.md](./README.md)

---

## Overview

Kahuna maintains a **global knowledge base** at `~/.kahuna/` that stores classified files from all projects. When a copilot needs context for a task, Kahuna surfaces relevant entries from the knowledge base to the project's `context/` folder.

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
│   - NOT written to project context/ yet                                      │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STAGE 2: PREPARE                                                           │
│   ────────────────                                                           │
│                                                                              │
│   Task description ────► kahuna_prepare_context ────► project/context/       │
│                                                       (task-relevant)        │
│                                                                              │
│   - Searches knowledge base for relevant entries                             │
│   - Surfaces subset to project's context/ folder                             │
│   - Copilot reads context/ during task                                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Principle: Separation of Storage and Surfacing

| Stage | Tool | What Happens | Output Location |
|-------|------|--------------|-----------------|
| **Learn** | `kahuna_learn` | Classify and store | `~/.kahuna/` |
| **Prepare** | `kahuna_prepare_context` | Search and surface | `project/context/` |

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

## Project Context: context/

Each project has a `context/` folder that receives surfaced knowledge.

### Folder Structure

```
project/
└── context/
    ├── README.md             # Navigation index (always present)
    └── [surfaced entries]    # Varies per task
```

### How context/ Gets Populated

`kahuna_prepare_context` populates `context/` with task-relevant entries:

1. **Receives** task description
2. **Searches** `~/.kahuna/knowledge/` for relevant entries
3. **Copies/transforms** relevant content to `project/context/`
4. **Generates** `README.md` with navigation

### Example: Populated context/

**Task:** "Add rate limiting to the search tool"

```
project/context/
├── README.md                 # Navigation for this task
├── api-guidelines.md         # Surfaced: has rate limiting info
├── error-handling.md         # Surfaced: error patterns
└── search-decision.md        # Surfaced: search implementation context
```

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
| **Environment** | setup, prepare_context | ~/.kahuna → context/ |
| **Assistance** | ask, review | context/ + ~/.kahuna → response |

### kahuna_setup (Environment)

**Creates:**
- `project/context/README.md` (minimal initial version)

**Does not create:** Knowledge base entries (that's `kahuna_learn`)

### kahuna_learn (Building KB)

**Reads:**
- User-provided files/folders (recursive)

**Writes to ~/.kahuna/:**
- New `.mdc` file in `knowledge/[uuid].mdc`
- YAML frontmatter with classification metadata
- Markdown content below frontmatter

**Does NOT write to:** `project/context/`

### kahuna_prepare_context (Environment)

**Reads:**
- Task description
- `~/.kahuna/knowledge/` entries
- `~/.kahuna/conversations/` summaries

**Writes to project/context/:**
- Surfaced knowledge entries
- Generated `README.md`

### kahuna_ask (Assistance)

**Reads (in order):**
1. `project/context/` (if exists) - checked first
2. `~/.kahuna/knowledge/` - fallback/additional

**Writes:** Nothing (returns text response)

### kahuna_review (Assistance)

**Reads (in order):**
1. `project/context/` (if exists) - checked first for patterns/policies
2. `~/.kahuna/knowledge/` - fallback/additional patterns
3. Files being reviewed

**Writes:** Nothing (returns analysis)

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
│   5. SURFACE TO context/                                                    │
│      ├── Clear context/task/ (task-specific, replaced each task)            │
│      ├── Preserve context/[curated]/ (e.g., langgraph/)                     │
│      ├── Copy/transform selected entries to context/task/                   │
│      └── Regenerate README.md with updated navigation                       │
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
- Copy relevant files to project's context/
- Generate README.md

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
   - Copy relevant entries to context/
   - Generate README.md

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

### Why Copy to context/ Instead of Links?

**Decision:** Copy surfaced content to `context/` rather than symlinks.

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

**Context merging (resolved):** When preparing context for a new task:
- **Clear and replace** `context/task/` - Task-specific context is replaced each time
- **Preserve** curated content like `context/langgraph/` - Initial patterns from `kahuna_setup` persist
- This ensures task context is always fresh while maintaining foundational patterns

---

## Changelog

- v1.0 (2026-02-05): Initial knowledge architecture specification
- v2.0 (2026-02-05): Revised to two-stage model: learn → ~/.kahuna, prepare → context/
- v2.1 (2026-02-05): Added evolution path, conversation log format, prepared staging
- v2.2 (2026-02-05): Tool categories; assistance tools use context/ + KB; learn accepts folders
- v2.3 (2026-02-05): Changed to .mdc format (YAML frontmatter + markdown) instead of folder+JSON
- v2.4 (2026-02-05): Fixed Tool Interactions to use .mdc; resolved context merging question
- v3.0 (2026-02-05): Promoted to docs/design/; updated links and status to Final
