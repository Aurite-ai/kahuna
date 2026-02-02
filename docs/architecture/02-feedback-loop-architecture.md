# Feedback Loop Architecture

**Status:** Implemented (Phase 1: Minimal Online)
**Last Updated:** 2026-02-02

---

## Overview

This document describes **what data exists** and **how it flows** through Kahuna's feedback loop. This is the core product functionality—everything else exists to support it.

**Current State (Phase 1):**

- ✅ User context → VCK generation → Export works
- ✅ Results can be uploaded back to the system
- ❌ Results do NOT yet influence VCK generation (planned for future AI integration)

This is intentional per the [Feedback Loop Strategy](/.roo/rules/04_FEEDBACK_LOOP_STRATEGY.md)—Phase 1 captures data so learning can happen later.

---

## The Loop at a Glance

```
User creates project
       │
       ▼
User uploads context files ──▶ Stored with project ID
       │
       ▼
User exports VCK ──▶ Context files + VCK templates ──▶ Download
       │
       ▼
User builds agent with copilot (external)
       │
       ▼
User uploads results ──▶ Stored with project ID
       │
       ▼
Analysis produces learnings ──▶ Improve future VCKs (future)
```

---

## Data Entities

### Core Entities

| Entity        | Purpose                                       | Database Model  |
| ------------- | --------------------------------------------- | --------------- |
| Project       | Container for user's work; scopes all content | `Project`       |
| ContextFile   | User-provided business context                | `ContextFile`   |
| VckGeneration | Record of VCK export (history)                | `VckGeneration` |
| BuildResult   | Outcome from agent build attempt              | `BuildResult`   |

### Reference Entity

| Entity | Purpose                         | Owner          |
| ------ | ------------------------------- | -------------- |
| User   | Identity; referenced, not owned | Infrastructure |

---

## Entity Relationships

```
User (infrastructure-owned)
 │
 │ owns (1:many)
 ▼
Project
 │
 ├── contains (1:many) ──▶ ContextFile
 │
 ├── produces (1:many) ──▶ VckGeneration
 │
 └── receives (1:many) ──▶ BuildResult
```

### Relationship Details

**User → Project**

- A user can have many projects
- Each project belongs to exactly one user
- The loop only needs `user_id` - no other user data

**Project → ContextFile**

- A project contains zero or more context files
- Files are scoped to their project
- Files can be added, updated, or removed independently

**Project → VckGeneration**

- A project can produce multiple VCKs over time
- Each VCK is a snapshot: context files at generation time + templates
- VCKs are immutable once created (history, not state)

**Project → BuildResult**

- A project can have multiple build results
- Results may reference which VCK was used
- Results are append-only (history of attempts)

---

## Data Flow: Step by Step

### 1. Project Creation

```
Input:  User ID (from auth)
Action: Create new project record
Output: Project with unique ID, owned by user
```

The project is the **anchor** for everything else in the loop.

### 2. Context Upload

```
Input:  Project ID + file content
Action: Store file associated with project
Output: ContextFile record
```

Context files represent the user's business information. Phase 1 treats these as opaque blobs—the loop doesn't interpret their contents, just stores and retrieves them.

**What gets uploaded:**

- Business policies and rules
- Tool/database descriptions
- Workflow definitions
- Any text the user wants the copilot to know

### 3. VCK Export

```
Input:  Project ID
Action:
  1. Fetch all context files for project
  2. Fetch VCK template files (static, not per-project)
  3. Assemble into VCK structure
  4. Record that a VCK was generated
Output: VCK JSON structure + VckGeneration record
```

The VCK combines two sources:

| Source        | Contains                                           | Origin         |
| ------------- | -------------------------------------------------- | -------------- |
| Context files | User's business information                        | Database       |
| VCK templates | Copilot rules, framework boilerplate, config files | Static/curated |

**VCK template files** are maintained by Kahuna developers in `@kahuna/vck-templates`. They represent accumulated knowledge about what makes copilots succeed.

### 4. Agent Build (External)

This happens **outside Kahuna**. The user:

1. Downloads the VCK
2. Opens it in their coding copilot (Cursor, Claude Code, etc.)
3. Builds an agent with copilot assistance

Kahuna has no visibility into this step until the user returns with results.

### 5. Results Upload

```
Input:  Project ID + structured result data
Action: Store result associated with project
Output: BuildResult record
```

**What gets uploaded (structured fields):**

| Field             | Type | Content                                |
| ----------------- | ---- | -------------------------------------- |
| `code`            | JSON | Generated code artifacts               |
| `docs`            | JSON | Generated documentation                |
| `tests`           | JSON | Generated tests                        |
| `conversationLog` | Text | Conversation logs from copilot session |

Results are the **learning signal**. Without them, the loop cannot improve.

### 6. Analysis (Future Phase)

```
Input:  BuildResult records
Action: Analyze patterns across results
Output: Learnings that improve VCK templates
```

Phase 1 captures results so analysis can happen later. The "learning" step is explicitly deferred.

---

## VCK Structure

A VCK is a JSON structure containing everything a coding copilot needs:

```typescript
interface VCK {
  metadata: {
    projectId: string;
    projectName: string;
    generatedAt: string;
    framework: string;
    copilot: string;
  };
  context: {
    files: Array<{ filename: string; content: string }>;
  };
  templates: {
    copilotConfig: Record<string, string>;
    frameworkFiles: Record<string, string>;
  };
}
```

**Key insight:** The structure will evolve based on what copilots respond to best. This is exactly what the feedback loop discovers.

---

## API Endpoints

All feedback loop endpoints are tRPC procedures in [`apps/api/src/trpc/routers/`](../apps/api/src/trpc/routers/):

| Router    | Procedure  | Purpose                        |
| --------- | ---------- | ------------------------------ |
| `project` | `create`   | Create new project             |
| `project` | `list`     | List user's projects           |
| `project` | `get`      | Get project with context files |
| `project` | `update`   | Rename project                 |
| `project` | `delete`   | Delete project and cascade     |
| `context` | `upload`   | Add context file to project    |
| `context` | `list`     | List files in project          |
| `context` | `get`      | Get single file                |
| `context` | `update`   | Update file content            |
| `context` | `delete`   | Remove file                    |
| `vck`     | `generate` | Generate and return VCK        |
| `vck`     | `history`  | List generation history        |
| `vck`     | `get`      | Get specific generation record |
| `results` | `submit`   | Upload build results           |
| `results` | `list`     | List results for project       |
| `results` | `get`      | Get single result              |

---

## Boundaries

The feedback loop owns its data completely, referencing infrastructure only for user identity.

**Loop depends on infrastructure for:**

- User ID (from authentication)
- Database connection

**Loop does NOT depend on:**

- How users authenticate
- User profile data
- Session management details
- Authorization rules beyond "is this the user's project?"

**Infrastructure does NOT depend on:**

- Any loop entities or operations
- VCK structure or generation logic
- Result analysis

See [System Boundaries](./04-system-boundaries.md) for full separation details.

---

## Phase 1 Scope

For Minimal Online, the goal is completing the loop end-to-end in its simplest form:

| Capability     | Phase 1 Scope                          |
| -------------- | -------------------------------------- |
| Project CRUD   | Create, read, list, update, delete     |
| Context upload | Store files as text blobs              |
| VCK export     | Static templates + user context → JSON |
| Results upload | Store as structured JSON + text        |
| Analysis       | Manual/deferred - just capture data    |

**What's explicitly NOT in Phase 1:**

- Automated analysis of results
- Dynamic VCK template selection
- Multi-framework support (one framework to start)
- Versioning or branching of context

---

## Related Documentation

- [System Boundaries](./04-system-boundaries.md) - Infrastructure/loop separation
- [Foundational Infrastructure](./03-foundational-infrastructure.md) - Auth and middleware
- [Product Vision](./product-vision.md) - High-level product goals
