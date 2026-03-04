# Kahuna - Knowledge Architecture

**Status:** Draft
**Date:** 2026-03-04
**Parent:** [README.md](./README.md)

---

## Overview

Kahuna's knowledge architecture is a **Context Management System (CMS)** that enables copilots to learn from user-provided information and surface relevant context for tasks. The system handles knowledge at multiple scope levels (user, organization, project) and manages the flow of context between them.

### Core Principles

1. **Separation of Learning and Surfacing** — Knowledge ingestion and context retrieval are distinct operations with different goals
2. **Project Isolation by Default** — Knowledge learned in a project stays in that project unless explicitly promoted
3. **Confidence-Based Promotion** — Cross-project knowledge requires high confidence; uncertain knowledge stays project-scoped
4. **Foundation Context Always Available** — User and organization context is always included regardless of project

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CONTEXT MANAGEMENT SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────┐    │
│  │  CONTEXT LEARNING SYSTEM        │    │  CONTEXT SURFACING SYSTEM       │    │
│  │                                 │    │                                 │    │
│  │  Ingests new knowledge          │    │  Retrieves relevant context     │    │
│  │  Maintains existing knowledge   │    │  for copilot tasks              │    │
│  │                                 │    │                                 │    │
│  │  Tools:                         │    │  Tools:                         │    │
│  │  - kahuna_learn                 │    │  - kahuna_prepare_context       │    │
│  │  - kahuna_provide_context       │    │  - kahuna_ask                   │    │
│  │                                 │    │                                 │    │
│  └─────────────────────────────────┘    └─────────────────────────────────┘    │
│                                                                                 │
│                        ┌─────────────────────────────────────────┐              │
│                        │           KNOWLEDGE BASE                │              │
│                        │           ~/.kahuna/                    │              │
│                        │                                         │              │
│                        │   Global knowledge + Project knowledge  │              │
│                        │   Scoped by level                       │              │
│                        └─────────────────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Context Levels

Knowledge exists at different scope levels, forming a hierarchy:

```
┌───────────────────────────────────────────────────────────────────┐
│                         USER CONTEXT                              │
│   Personal preferences, working style, individual patterns        │
│   Always included. Never project-specific.                        │
├───────────────────────────────────────────────────────────────────┤
│                     ORGANIZATION CONTEXT                          │
│   Company policies, domain knowledge, tech stack preferences      │
│   Always included. Applies across all projects.                   │
├───────────────────────────────────────────────────────────────────┤
│                 MULTI-PROJECT KNOWLEDGE                           │
│   Patterns, policies, decisions applicable to multiple projects   │
│   Surfaced when relevant. Not always project-specific.            │
├───────────────────────────────────────────────────────────────────┤
│                       PROJECT CONTEXT                             │
│   Project-specific decisions, architecture, implementation        │
│   Isolated by default. Primary storage location for new knowledge │
└───────────────────────────────────────────────────────────────────┘
```

### Foundation Context

**User context** and **organization context** are **foundation context** — they are always included when surfacing context, without agent selection. These represent stable, cross-cutting information that applies regardless of the specific task or project.

### Project Isolation

New knowledge is stored at the **project level by default**. This prevents context bleed between unrelated projects. Knowledge can be promoted to higher levels (multi-project or org) when there's high confidence it applies broadly.

---

## Context Learning System

The Context Learning System handles knowledge ingestion and maintenance. It has two internal flows:

### Learn Flow

When new information arrives via `kahuna_learn`:

1. **Classify** — Determine category, topics, and scope applicability
2. **Evaluate Scope** — Assess whether this is project-specific or broadly applicable
3. **Store** — Write to appropriate location based on scope decision
4. **Report** — Return summary to copilot, including any contradictions detected

### Maintenance Flow

After the learn flow completes, the maintenance flow reviews existing knowledge:

1. **Triggered by** — Completion of learn flow (new knowledge provides additional context)
2. **Reviews** — Existing project-level entries for potential promotion
3. **Evaluates** — Cross-project patterns, staleness, contradictions
4. **Actions** — Promote, archive, flag for user attention, or leave as-is

### Scope Decision Logic

When determining where to store knowledge:

| Confidence | Scope Assessment | Action |
|------------|------------------|--------|
| **High** | Clearly org-wide | Store at org level |
| **High** | Clearly multi-project | Store at multi-project level |
| **Low/Medium** | Uncertain | Store at project level, flag for later review |
| **Any** | Clearly project-specific | Store at project level |

The bias is toward **project-level storage** when uncertain. This is conservative — it prevents over-sharing while allowing promotion later when more evidence accumulates.

---

## Context Surfacing System

The Context Surfacing System retrieves relevant knowledge for copilot tasks.

### Prepare Context Flow

When `kahuna_prepare_context` is called:

1. **Receive** — Task description and optional hints
2. **Include Foundation** — Always add user-context and org-context
3. **Search** — Find relevant entries across appropriate scope levels
4. **Select** — Choose most relevant entries for the task
5. **Surface** — Write to project's `.kahuna/context-guide.md`

### Search Scope Logic

The surfacing system searches across scope levels with different priorities:

| Level | Priority | When Searched |
|-------|----------|---------------|
| Foundation (user, org) | Always | Every prepare_context call |
| Current Project | High | Always for current project |
| Multi-Project | Medium | When task might benefit from cross-project patterns |
| Other Projects | Low | When explicitly relevant (related projects, predecessors) |

### Cross-Project Retrieval

Rather than requiring all useful knowledge to be promoted, the surfacing system can search **sideways** across related projects when appropriate. This handles cases like:

- **Related projects** — Frontend and backend of the same product
- **Predecessor projects** — Abandoned attempt, lessons learned
- **Shared libraries** — Common code used across multiple projects

---

## Project Identity

A "project" in Kahuna is the **workspace where `kahuna_initialize` was run**. This is the simplest useful definition.

### Identity Mechanism

- **Current approach:** Workspace path (e.g., `/home/user/my-project`)
- **Storage:** Project knowledge stored in project-specific subfolder within KB

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Path-based | Simple, unambiguous | Breaks if project moved |
| Name-based | Survives moves | Collision risk |
| Git remote | Survives clone/move | Not all projects have git |
| Hybrid | Flexible | Complex |

For now, **path-based identity** is sufficient. More sophisticated identity can be added when real problems emerge.

---

## Knowledge Base Structure

```
~/.kahuna/
├── knowledge/                    # Org-level and multi-project knowledge
│   ├── org-context.mdc          # Organization context (foundation)
│   ├── user-context.mdc         # User preferences (foundation)
│   └── [slug].mdc               # Other org-level entries
│
└── projects/                     # Project-specific knowledge
    ├── [project-id]/
    │   └── knowledge/
    │       └── [slug].mdc
    └── [project-id]/
        └── knowledge/
            └── [slug].mdc
```

### .mdc Format

All knowledge entries use the `.mdc` format — markdown with YAML frontmatter:

```yaml
---
type: knowledge
title: Entry Title
summary: Brief description
created_at: 2026-03-04T00:00:00Z
updated_at: 2026-03-04T00:00:00Z

source:
  file: original-filename.md
  path: /full/path/to/file.md
  project: /workspace/path

classification:
  category: policy | requirement | reference | decision | pattern | context
  confidence: 0.0-1.0
  reasoning: Why this classification
  topics:
    - Natural language topic phrases

scope:
  level: user | org | multi-project | project
  promotion_candidate: true | false

status: active | archived
---

[Content here]
```

---

## Open Questions

### Scope & Boundaries
- What specific criteria make knowledge "obviously org-level" vs "uncertain"?
- How does the maintenance flow decide when to promote?

### Cross-Project
- How does the system identify "related projects"?
- What signals indicate that cross-project search would be valuable?

### Identity Lifecycle
- How are projects renamed or merged?
- What happens to orphaned project folders?

---

## Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Project isolation by default** | Prevents context pollution between unrelated projects |
| D2 | **Confidence-based promotion** | Conservative approach — uncertain knowledge stays local |
| D3 | **Foundation context always included** | User and org context applies everywhere |
| D4 | **Learn triggers maintenance** | Fresh context helps maintenance make better decisions |
| D5 | **Path-based project identity** | Simplest approach that works; can evolve later |
| D6 | **Cross-project search over eager promotion** | Don't move knowledge up; search sideways when needed |

---

## Changelog

- v5.0 (2026-03-04): Complete rewrite as abstract design document
  - Introduced CMS architecture with CLS/CSS subsystems
  - Added context levels hierarchy
  - Added scope decision logic with confidence model
  - Added maintenance flow concept
  - Removed implementation-specific details (moved to architecture doc)
