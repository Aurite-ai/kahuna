# Kahuna

AI-powered platform for translating business workflows into automated AI agents.

## Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
pnpm --filter @kahuna/api db:migrate

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
| `pnpm typecheck` | Type-check all packages       |
| `pnpm test`      | Run all tests                 |

## Project Structure

```
kahuna/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express backend
├── packages/
│   └── shared/       # Shared types & utilities
└── docs/             # Documentation
```
