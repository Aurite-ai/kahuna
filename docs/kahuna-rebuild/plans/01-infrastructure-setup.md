# Implementation Plan: Repository Infrastructure

**Type:** Infrastructure Setup
**Date:** 2025-01-31
**Design Doc:** [`docs/kahuna-rebuild/design/01-repository-infrastructure.md`](../design/01-repository-infrastructure.md)

## Overview

Set up the Kahuna monorepo infrastructure with pnpm workspaces, Turborepo, Biome, and TypeScript configuration for `web`, `api`, and `shared` packages.

## Prerequisites

- Node.js 18+ installed
- pnpm 9+ installed (`npm install -g pnpm`)
- New repository initialized (or empty directory)

---

## Phase 1: Root Configuration

Create the foundational monorepo configuration files.

### Files to Create

1. **`pnpm-workspace.yaml`** - Workspace definition (Section 2)
2. **`turbo.json`** - Task runner config (Section 3)
3. **`tsconfig.base.json`** - Shared TypeScript settings (Section 4)
4. **`biome.json`** - Linting and formatting (Section 5)
5. **`package.json`** - Root scripts and devDependencies (Section 6)
6. **`.vscode/settings.json`** - Editor settings (Section 7)
7. **`.vscode/extensions.json`** - Recommended extensions (Section 7)
8. **`.env.example`** - Environment template (Section 8)
9. **`.gitignore`** - Git ignore patterns (Section 9)
10. **`README.md`** - Project documentation (Section 10)

### Verification

```bash
pnpm install
pnpm lint  # Should run Biome (no files to lint yet, but command works)
```

---

## Phase 2: Shared Package

Create the `@kahuna/shared` package for shared types and utilities.

### Files to Create

1. **`packages/shared/package.json`**
   ```json
   {
     "name": "@kahuna/shared",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "import": "./dist/index.js"
       }
     },
     "scripts": {
       "build": "tsc",
       "typecheck": "tsc --noEmit"
     }
   }
   ```

2. **`packages/shared/tsconfig.json`** - Extends base (Section 4)

3. **`packages/shared/src/index.ts`**
   ```typescript
   export * from './types.js';
   export * from './constants.js';
   ```

4. **`packages/shared/src/types.ts`** - Placeholder types
5. **`packages/shared/src/constants.ts`** - Placeholder constants

### Verification

```bash
pnpm --filter @kahuna/shared build
pnpm typecheck
```

---

## Phase 3: API Application Scaffold

Create the `@kahuna/api` Express backend scaffold.

### Files to Create

1. **`apps/api/package.json`**
   ```json
   {
     "name": "@kahuna/api",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "tsx watch src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js",
       "typecheck": "tsc --noEmit"
     },
     "dependencies": {
       "@kahuna/shared": "workspace:*",
       "express": "^4.21.0"
     },
     "devDependencies": {
       "@types/express": "^5.0.0",
       "@types/node": "^22.0.0",
       "tsx": "^4.19.0"
     }
   }
   ```

2. **`apps/api/tsconfig.json`** - NodeNext config (Section 4)

3. **`apps/api/src/index.ts`** - Minimal Express server
   ```typescript
   import express from 'express';

   const app = express();
   const PORT = process.env.PORT || 3000;

   app.get('/health', (_req, res) => {
     res.json({ status: 'ok' });
   });

   app.listen(PORT, () => {
     console.log(`API running on http://localhost:${PORT}`);
   });
   ```

### Verification

```bash
pnpm --filter @kahuna/api dev
# In another terminal: curl http://localhost:3000/health
```

---

## Phase 4: Web Application Scaffold

Create the `@kahuna/web` Vite + React frontend scaffold.

### Files to Create

1. **`apps/web/package.json`**
   ```json
   {
     "name": "@kahuna/web",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "typecheck": "tsc --noEmit"
     },
     "dependencies": {
       "@kahuna/shared": "workspace:*",
       "react": "^18.3.0",
       "react-dom": "^18.3.0"
     },
     "devDependencies": {
       "@types/react": "^18.3.0",
       "@types/react-dom": "^18.3.0",
       "@vitejs/plugin-react": "^4.3.0",
       "vite": "^6.0.0"
     }
   }
   ```

2. **`apps/web/tsconfig.json`** - React config with paths (Section 4)

3. **`apps/web/vite.config.ts`**
   ```typescript
   import react from '@vitejs/plugin-react';
   import { resolve } from 'path';
   import { defineConfig } from 'vite';

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': resolve(__dirname, './src'),
       },
     },
   });
   ```

4. **`apps/web/index.html`** - HTML entry point
5. **`apps/web/src/main.tsx`** - React entry point
6. **`apps/web/src/App.tsx`** - Root component

### Verification

```bash
pnpm --filter @kahuna/web dev
# Open http://localhost:5173 in browser
```

---

## Phase 5: Full Verification

Verify all commands work correctly across the monorepo.

### Commands to Test

```bash
# Install all dependencies
pnpm install

# Build all packages (should build shared first, then apps)
pnpm build

# Type-check all packages
pnpm typecheck

# Lint all files
pnpm lint

# Run both dev servers
pnpm dev

# Clean build artifacts
pnpm clean
```

### Expected Results

- `pnpm build` succeeds with `dist/` folders in all packages
- `pnpm typecheck` reports no errors
- `pnpm lint` runs Biome with no errors (or only intentional warnings)
- `pnpm dev` starts both web and api servers
- Workspace dependencies resolve correctly (`@kahuna/shared` importable from both apps)

---

## Notes for Code Mode

- All configuration file contents are in the design doc - copy directly
- Use latest stable versions for packages (versions shown are minimums)
- The API will be expanded with tRPC, Prisma in subsequent phases
- The web app will be expanded with TanStack Router, shadcn/ui in subsequent phases
