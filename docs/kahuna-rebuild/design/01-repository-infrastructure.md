# Design: Repository Infrastructure

**Date:** 2025-01-30
**Status:** Approved
**Author:** Collaborative design session

## Overview

This document defines the repository infrastructure for the new Kahuna repository, covering directory structure, package management, TypeScript configuration, code quality tooling, and development workflows.

---

## Summary of Decisions

| Area                   | Decision                               |
| ---------------------- | -------------------------------------- |
| **Monorepo**           | Yes - essential for tRPC type sharing  |
| **Package Manager**    | pnpm 9.x with workspaces               |
| **Monorepo Tooling**   | pnpm workspaces + minimal Turborepo    |
| **Linting/Formatting** | Biome (replaces ESLint + Prettier)     |
| **App Naming**         | `web/` (frontend) and `api/` (backend) |
| **Package Scope**      | `@kahuna/*`                            |
| **Shared Packages**    | `packages/shared/` initially           |
| **TypeScript**         | Simple extends pattern, strict mode    |

---

## 1. Directory Structure

```
kahuna/
├── .github/                    # GitHub Actions (future)
├── .vscode/
│   ├── settings.json          # Editor settings
│   └── extensions.json        # Recommended extensions
├── apps/
│   ├── web/                   # React frontend (Vite)
│   │   ├── src/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── api/                   # Express backend (tRPC + Prisma)
│       ├── src/
│       ├── prisma/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/                # Shared types, schemas, utilities
│       ├── src/
│       │   ├── index.ts
│       │   ├── types.ts
│       │   ├── schemas.ts
│       │   └── constants.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/                      # Documentation
├── biome.json                 # Linting + formatting config
├── tsconfig.base.json         # Shared TypeScript settings
├── turbo.json                 # Turborepo task config
├── pnpm-workspace.yaml        # Workspace definition
├── package.json               # Root scripts, shared devDeps
├── pnpm-lock.yaml             # Lockfile (auto-generated)
├── .env.example               # Environment template
├── .gitignore
└── README.md
```

---

## 2. pnpm Workspace Configuration

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Package Naming Convention

- Scope: `@kahuna`
- Apps: `@kahuna/web`, `@kahuna/api`
- Packages: `@kahuna/shared`

### Workspace Dependencies

Use `workspace:*` protocol for internal dependencies:

```json
{
  "dependencies": {
    "@kahuna/shared": "workspace:*"
  }
}
```

---

## 3. Turborepo Configuration

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "start": {
      "dependsOn": ["build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

**Why Turbo:** Provides explicit task dependency graph and caching. Minimal config, easy to remove if not needed.

---

## 4. TypeScript Configuration

### Architecture: Project References

TypeScript project references enable the IDE to understand cross-package dependencies without requiring a build step. This architecture uses:

- **`tsconfig.base.json`** - Shared compiler options (strict, target, lib, etc.)
- **`tsconfig.json`** (root) - Project references for IDE navigation
- **Per-package `tsconfig.json`** - Extends base, adds `composite: true`, references dependencies

```
┌─────────────────────────────────────────────────┐
│ tsconfig.json (root)                            │
│   references: [shared, api, web]                │
│                                                 │
│ tsconfig.base.json                              │
│   compilerOptions only (no references)          │
│                                                 │
│ packages/shared/tsconfig.json                   │
│   extends: base, composite: true                │
│                                                 │
│ apps/api/tsconfig.json                          │
│   extends: base, composite: true                │
│   references: [shared]                          │
│                                                 │
│ apps/web/tsconfig.json                          │
│   extends: base, composite: true                │
│   references: [shared]                          │
└─────────────────────────────────────────────────┘
```

### Root Config: `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "packages/shared" },
    { "path": "apps/api" },
    { "path": "apps/web" }
  ]
}
```

**Note:** `"files": []` prevents the root config from compiling anything - it only defines the project graph.

### Base Config: `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true
  }
}
```

### Frontend: `apps/web/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/shared" }]
}
```

### Backend: `apps/api/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/shared" }]
}
```

### Shared: `packages/shared/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### Key Decisions

| Setting                     | Value      | Rationale                                              |
| --------------------------- | ---------- | ------------------------------------------------------ |
| `composite`                 | `true`     | Enables project references for IDE support             |
| `strict`                    | `true`     | Modern TypeScript standard                             |
| `noUncheckedIndexedAccess`  | `false`    | Matches current codebase, can enable later             |
| `moduleResolution` (web)    | `bundler`  | Vite handles resolution                                |
| `moduleResolution` (api)    | `NodeNext` | Native ESM with `.js` extensions                       |
| `moduleResolution` (shared) | `bundler`  | Extensionless imports, consumed by both apps via dist/ |

### Import Extensions

With project references, the shared package uses `bundler` resolution (no `.js` extensions):

```typescript
// packages/shared/src/index.ts
export * from "./types"; // ✓ bundler resolution
export * from "./constants"; // ✓ no .js extension needed
```

Both consumers (api and web) import `@kahuna/shared` through the package.json `exports` field, which resolves to the compiled `dist/` output. This works with both `NodeNext` (api) and `bundler` (web) resolution.

---

## 5. Biome Configuration

### `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5",
      "semicolons": "always"
    }
  }
}
```

### Formatting Decisions

| Setting         | Value    | Rationale                     |
| --------------- | -------- | ----------------------------- |
| Line width      | 100      | Wider for LLM prompts in code |
| Quotes          | Single   | TypeScript convention         |
| Semicolons      | Always   | Explicit, avoids ASI issues   |
| Trailing commas | `es5`    | Objects/arrays only           |
| Indent          | 2 spaces | Standard                      |

---

## 6. Root Package.json

```json
{
  "name": "kahuna",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "turbo dev --filter @kahuna/web",
    "dev:api": "turbo dev --filter @kahuna/api",
    "build": "turbo build",
    "start": "turbo start",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "clean": "rm -rf apps/*/dist packages/*/dist node_modules/.cache .turbo"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "turbo": "^2.0.0",
    "typescript": "^5.9.0"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 7. VS Code Integration

### `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit"
  }
}
```

### `.vscode/extensions.json`

```json
{
  "recommendations": ["biomejs.biome"]
}
```

---

## 8. Environment Configuration

### `.env.example`

```bash
# ===========================================
# Database
# ===========================================
DATABASE_URL="postgresql://user:password@localhost:5432/kahuna"

# ===========================================
# Server
# ===========================================
PORT=3000
NODE_ENV=development

# ===========================================
# Frontend (Vite)
# ===========================================
VITE_API_URL=http://localhost:3000

# ===========================================
# Authentication (TBD - session-based)
# ===========================================
# SESSION_SECRET=your-secret-here

# ===========================================
# AI Services (as needed)
# ===========================================
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
```

---

## 9. Git Configuration

### `.gitignore`

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Prisma
*.db
*.db-journal

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Cache
.cache/
*.tsbuildinfo
.turbo/

# Temporary
tmp/
temp/
```

---

## 10. README Template

```markdown
# Kahuna

AI-powered platform for translating business workflows into automated AI agents.

## Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL

## Quick Start

\`\`\`bash

# Install dependencies

pnpm install

# Set up environment

cp .env.example .env

# Edit .env with your values

# Run database migrations

pnpm --filter @kahuna/api db:migrate

# Start development

pnpm dev
\`\`\`

## Scripts

| Command            | Description                   |
| ------------------ | ----------------------------- |
| \`pnpm dev\`       | Start all development servers |
| \`pnpm dev:web\`   | Start frontend only           |
| \`pnpm dev:api\`   | Start backend only            |
| \`pnpm build\`     | Build all packages            |
| \`pnpm start\`     | Start production servers      |
| \`pnpm lint\`      | Lint codebase                 |
| \`pnpm typecheck\` | Type-check all packages       |
| \`pnpm test\`      | Run all tests                 |

## Project Structure

\`\`\`
kahuna/
├── apps/
│ ├── web/ # React frontend
│ └── api/ # Express backend
├── packages/
│ └── shared/ # Shared types & utilities
└── docs/ # Documentation
\`\`\`
```

---

## Open Questions for Future Design Phases

1. **Authentication** - Session-based auth design (separate design doc)
2. **Database Schema** - Prisma schema design
3. **API Layer** - tRPC router structure
4. **Frontend Routing** - TanStack Router setup
5. **Testing Strategy** - Vitest configuration and patterns
6. **CI/CD** - GitHub Actions workflow

---

## References

- [Research: Repository Structure](../research/01-repo-structure.md)
- [Research: TypeScript Tooling](../research/02-typescript-tooling.md)
- [Current State Summary](../current-state/SUMMARY.md)
