# Repository Navigation Guide

This guide helps developers and AI copilots locate files and understand the project structure.

---

## Quick Reference

| Looking for...              | Location             |
| --------------------------- | -------------------- |
| Project setup               | `README.md`          |
| Architecture/design docs    | `docs/architecture/` |
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
docs/   archive/        ← Permanent or historical
```

**Permanent** (`docs/`): Realized, long-lived documentation. Move (don't copy) working docs here when they become permanent.

**Working** (`docs/internal/`): Task artifacts - research, designs, plans, analyses. Scoped to the current task.

---

## Documentation Structure

### Permanent (`docs/`)

```
docs/
├── architecture/           # Approved designs, system docs
├── guides/                 # How-to instructions
└── reference/              # Long-term reference materials
```

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
├── api/                    # Express backend (tRPC + Prisma)
└── web/                    # React frontend (Vite)

packages/
└── shared/                 # Shared types, schemas, utilities
```

---

## Configuration Files

| File                  | Purpose                              |
| --------------------- | ------------------------------------ |
| `package.json`        | Root scripts, shared devDependencies |
| `pnpm-workspace.yaml` | Workspace package locations          |
| `turbo.json`          | Task runner configuration            |
| `tsconfig.base.json`  | Shared TypeScript settings           |
| `biome.json`          | Linting and formatting               |
| `.env.example`        | Environment variable template        |
