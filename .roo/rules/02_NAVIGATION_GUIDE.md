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

Design documents are organized hierarchically in `docs/design/`:

```
docs/design/
├── README.md                           # Index and navigation
├── 01-product/                         # Product-level design
│   └── kahuna-product-model.md         # Core product concepts
├── 02-architecture/                    # System architecture
│   ├── abstract-architecture.md        # High-level architecture
│   └── static-dynamic-integration.md   # Static/dynamic system integration
├── 03-subsystem/                       # Subsystem designs
└── 04-foundations/                     # Theoretical foundations
    ├── llm-agent-model.md              # LLM agent completion model
    └── theoretical-foundations.md      # Cognitive methodology theory
```

### Reference Documents

| Document                       | Contents                                               |
| ------------------------------ | ------------------------------------------------------ |
| `cognitive-methodology.md`     | Detailed cognitive SW dev methodology, theory, glossary |

Legacy Kahuna documentation is preserved in `docs/reference/legacy-kahuna/` for historical reference.

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
└── mcp/                        # MCP server (stdio) — context management tools for copilots
    ├── src/
    │   ├── integrations/       # External integration support
    │   │   ├── execution/      # HTTP executor, circuit breaker, retry logic
    │   │   └── verification/   # Integration verification
    │   ├── knowledge/          # Knowledge base domain logic
    │   │   ├── agents/         # Agent prompts, tools, shared runner
    │   │   ├── storage/        # KB storage service, types, utilities
    │   │   └── surfacing/      # Context writer, file tree, framework copier
    │   ├── templates/          # Template index
    │   ├── tools/              # MCP tool handlers
    │   ├── usage/              # Usage tracking and pricing
    │   ├── vault/              # Secrets management (1Password, env providers)
    │   ├── config.ts           # Centralized configuration
    │   └── index.ts            # Server entry point
    └── templates/              # Static template files
        ├── copilot-configs/    # Copilot configuration templates
        ├── frameworks/         # Framework boilerplate templates
        ├── knowledge-base/     # KB seed files (.mdc)
        └── project-env/        # Project environment templates

packages/
├── testing/                    # QA testing infrastructure
│   ├── scenarios/              # Test scenarios
│   └── src/                    # CLI: create, list, collect commands
└── vck-templates/              # (legacy) VCK templates
```

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
