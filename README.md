# Kahuna

Kahuna helps non-technical users build AI agents by generating **Vibe Code Kits (VCKs)**—downloadable packages containing copilot configuration, business context, framework rules, and boilerplate code that give coding assistants (Claude Code, Cursor, Codex, etc.) everything they need to succeed. The platform's core value comes from its feedback loop: user context flows into VCK generation, the coding copilot builds an agent, results are analyzed, and learnings improve future VCKs. This loop is developed empirically—through rapid testing and measurement rather than upfront design—because optimal VCK quality can only be discovered, not predicted.

> **Note:** This repository is in early infrastructure setup. See [docs/](docs/) for architecture and design documentation.

## Prerequisites

- Node.js 18+
- pnpm 9+

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Start development
pnpm dev
```

## Scripts

| Command          | Description                   |
| ---------------- | ----------------------------- |
| `pnpm dev`       | Start all development servers |
| `pnpm dev:web`   | Start frontend only           |
| `pnpm dev:api`   | Start backend only            |
| `pnpm build`     | Build all packages            |
| `pnpm start`     | Start production servers      |
| `pnpm lint`      | Lint codebase                 |
| `pnpm lint:fix`  | Lint and auto-fix issues      |
| `pnpm format`    | Format codebase               |
| `pnpm typecheck` | Type-check all packages       |
| `pnpm test`      | Run all tests                 |
| `pnpm clean`     | Remove build artifacts        |

## Project Structure

```
kahuna/
├── apps/
│   ├── web/          # React frontend (Vite)
│   └── api/          # Express backend
├── packages/
│   └── shared/       # Shared types & utilities
└── docs/             # Documentation
```

## Documentation

- [Architecture Overview](docs/architecture/01-repository-infrastructure.md)
- [Product Vision](docs/architecture/product-vision.md)
- [Internal Working Docs](docs/internal/README.md)
