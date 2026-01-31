# Repository Navigation Guide

This guide helps developers and AI copilots quickly locate files and understand the project structure.

---

## Quick Reference

| Looking for...             | Location                        |
| -------------------------- | ------------------------------- |
| Project setup instructions | `README.md`                     |
| Architecture/design docs   | `docs/architecture/`            |
| How-to guides              | `docs/guides/`                  |
| Implementation plans       | `docs/internal/plans/`          |
| Tech research              | `docs/internal/research/`       |
| Kahuna 1.0 analysis        | `docs/reference/legacy-kahuna/` |
| Copilot rules              | `.roo/rules/`                   |

---

## Documentation (`docs/`)

```
docs/
├── architecture/           # Approved design documents
│   ├── 01-repository-infrastructure.md
│   └── product-vision.md
├── guides/                 # How-to guides (future)
├── reference/
│   └── legacy-kahuna/      # Kahuna 1.0 analysis
└── internal/               # Non-team-facing docs
    ├── research/           # Tech research
    ├── plans/              # Implementation plans
    └── notes/              # Decision logs, scratch
```

### Finding Information

- **"How does X work?"** → `docs/architecture/`
- **"How do I do X?"** → `docs/guides/`
- **"What was decided?"** → `docs/internal/notes/` or `docs/internal/research/`
- **"What's the plan?"** → `docs/internal/plans/`

---

## Source Code

```
apps/
├── api/                    # Express backend (tRPC + Prisma)
│   └── src/
└── web/                    # React frontend (Vite)
    └── src/

packages/
└── shared/                 # Shared types, schemas, utilities
    └── src/
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

---

## Conventions

### Implementation Plans

- Location: `docs/internal/plans/MM-DD_[name].md`
- Example: `docs/internal/plans/01-31_docs-structure.md`

### Design Documents

- Location: `docs/architecture/[topic].md`
- Numbered for sequencing: `01-repository-infrastructure.md`

### Research Notes

- Location: `docs/internal/research/NN-[topic].md`
- Numbered to track decision sequence
