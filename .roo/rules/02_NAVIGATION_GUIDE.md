# Repository Navigation Guide

This guide helps developers and AI copilots locate files and understand the project structure.

---

## Quick Reference

| Looking for...              | Location             |
| --------------------------- | -------------------- |
| Project setup               | `README.md`          |
| Architecture/design docs    | `docs/architecture/` |
| Design documents            | `docs/design/`       |
| How-to guides               | `docs/guides/`       |
| Reference materials         | `docs/reference/`    |
| Working docs (current task) | `docs/internal/`     |
| Copilot rules               | `.roo/rules/`        |

---

## Documentation Flow

Documentation moves from working space to permanent:

```
        Task
          │
          ▼
   docs/internal/          ← Working docs (task artifacts)
          │
          ▼
      Promote?
       │     │
      YES    NO
       │     │
       ▼     ▼
    docs/   docs/internal/archive/   ← Permanent or historical
```

**Permanent** (`docs/`): Realized, long-lived documentation. Move (don't copy) working docs here when they become permanent.

**Working** (`docs/internal/`): Task artifacts - research, designs, plans, analyses. Scoped to the current task.

---

## Documentation Structure

### Permanent (`docs/`)

```
docs/
├── architecture/           # Approved infrastructure designs
├── design/                 # Product & feature design docs
├── guides/                 # How-to instructions
└── reference/              # Long-term reference materials
```

### Architecture Documents

| Document                          | Contents                                               |
| --------------------------------- | ------------------------------------------------------ |
| `01-repository-infrastructure.md` | Monorepo setup, tooling, TypeScript config              |
| `02-context-management-system.md` | Knowledge module architecture, tool pipeline, agents    |

### Design Documents

| Document                       | Contents                                    |
| ------------------------------ | ------------------------------------------- |
| `README.md`                    | Product overview, core concepts, index      |
| `tool-specifications.md`       | MCP tool specs, schemas, response formats   |
| `knowledge-architecture.md`    | Knowledge base structure, file formats      |
| `user-journey.md`              | End-to-end copilot usage flow               |
| `copilot-configuration.md`     | VCK and copilot config design               |

### Working (`docs/internal/`)

```
docs/internal/
├── research/              # Research reports
├── designs/               # Design documents
├── plans/                 # Implementation plans
├── analyses/              # Reviews, assessments
├── tasks/                 # Multi-document task workspaces
├── notes/                 # Scratch, decisions, misc
└── archive/               # Completed/obsolete work
```

**Note:** `docs/internal/prompts/` contains user-authored prompts. Do not read from this folder unless explicitly instructed.

Orchestrator subtask prompts specify exact paths. See `.roo/rules-orchestrator/ORCHESTRATOR_MODE.md` for structure decisions.

---

## Naming Conventions

### Permanent Documentation

| Type         | Pattern         | Example                           |
| ------------ | --------------- | --------------------------------- |
| Architecture | `NN-[topic].md` | `01-repository-infrastructure.md` |
| Guide        | `[task].md`     | `development-setup.md`            |

### Working Documentation

| Type            | Single Doc              | Multiple Related      |
| --------------- | ----------------------- | --------------------- |
| Research        | `research/{topic}.md`   | `research/{project}/` |
| Design          | `designs/{topic}.md`    | `designs/{project}/`  |
| Plan            | `plans/MM-DD_{name}.md` | `plans/{project}/`    |
| Analysis        | `analyses/{topic}.md`   | `analyses/{project}/` |
| Multi-type task | —                       | `tasks/{task-name}/`  |

---

## Source Code

```
apps/
└── mcp/                    # MCP server (stdio) — context management tools for copilots
    ├── src/
    │   ├── knowledge/      # Knowledge base domain logic
    │   │   ├── agents/     # Agent prompts, tools, shared runner
    │   │   ├── storage/    # KB storage service, types, utilities
    │   │   └── surfacing/  # Context writer
    │   ├── tools/          # MCP tool handlers (learn, ask, prepare-context, health-check, initialize)
    │   ├── config.ts       # Centralized configuration (models, server constants)
    │   └── index.ts        # Server entry point
    └── templates/          # VCK templates (bundled with MCP server)
        ├── copilot-configs/  # Copilot configuration templates (claude-code, roo-code, etc.)
        ├── frameworks/       # Framework boilerplate templates
        └── knowledge-base/   # KB seed files (.mdc) copied during initialize

packages/
└── testing/                # QA testing infrastructure
    ├── scenarios/          # Test scenarios (customer-support-agent, etc.)
    └── src/                # CLI: create, list, collect commands
```

### Claude Code Configuration (`.claude/`)

The `copilot-configs/claude-code/.claude/` directory contains Claude Code's rule system. Understanding the terminology helps avoid confusion when working across Roo Code and Claude Code:

```
.claude/
├── CLAUDE.md           # System prompt (loaded at conversation start)
├── settings.json       # Other settings (mostly tool permission settings)
├── agents/             # Subagents (spawn new conversations)
│   ├── architect.md
│   └── implementer.md
└── skills/             # Procedures (run in current conversation)
    ├── documentation/
    └── verification/
```

| Claude Code | Purpose | Roo Code Equivalent |
|-------------|---------|---------------------|
| `CLAUDE.md` | System prompt loaded at start | `.roo/rules/` global rules |
| `agents/` | Subagents with **new conversation** context | Modes via `new_task` tool |
| `skills/` | Procedures in **same conversation** | Inline instructions (no equivalent) |
| `settings.json` | IDE settings | — |

**Key distinction:** Agents create fresh conversations with their own context window. Skills execute within the parent conversation, inheriting its full context.

---

## Configuration Files

| File                   | Purpose                              |
| ---------------------- | ------------------------------------ |
| `package.json`         | Root scripts, shared devDependencies |
| `pnpm-workspace.yaml`  | Workspace package locations          |
| `turbo.json`           | Task runner configuration            |
| `tsconfig.base.json`   | Shared TypeScript settings           |
| `biome.json`           | Linting and formatting               |
| `apps/mcp/.env.example`| MCP server environment template      |
