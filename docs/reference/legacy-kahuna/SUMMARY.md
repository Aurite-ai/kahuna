# Current Architecture Inventory: Synthesis Summary

**Date:** 2026-01-30
**Purpose:** Consolidated reference for new repository design decisions

---

## 1. Current Stack Overview

### Key Technologies

| Layer | Current | Version |
|-------|---------|---------|
| **Package Manager** | pnpm | 9.x |
| **Build Orchestration** | Turborepo | 2.5+ |
| **Runtime** | Node.js | 18+ |
| **Language** | TypeScript | 5.9 |
| **HTTP Framework** | Express | 4.x |
| **API Layer** | tRPC | 11.5+ |
| **Validation** | Zod | 4.x |
| **ORM** | Prisma | 6.x |
| **Database** | PostgreSQL | — |
| **Auth** | Clerk | — |
| **Frontend** | React | 18 |
| **Bundler** | Vite | — |
| **Router** | TanStack Router | — |
| **Data Fetching** | tRPC + React Query | — |
| **UI Components** | shadcn/ui | 40+ components |
| **Styling** | Tailwind CSS | — |
| **Testing** | Vitest | — |

### Monorepo Structure

```
kahuna/
├── apps/
│   ├── frontend/          # React + Vite + TanStack
│   └── server/            # Express + tRPC + Prisma
└── packages/
    ├── credentials/       # Credential management
    ├── shared/            # Shared utilities
    ├── ui/                # Shared React components
    ├── eslint-config/     # Shared ESLint
    └── typescript-config/ # Shared TypeScript
```

---

## 2. Architecture Patterns (Keep)

### Backend

| Pattern | Why Keep |
|---------|----------|
| **tRPC + Zod validation** | End-to-end type safety, zero codegen, great DX |
| **Service layer separation** | Routers handle HTTP, services handle business logic |
| **Prisma ORM** | Type-safe queries, excellent TS integration |
| **Router aggregation** | Logical grouping with flat procedure namespace |
| **Vitest testing** | Fast, good mocking, mirrors source structure |

### Frontend

| Pattern | Why Keep |
|---------|----------|
| **tRPC client (4-line setup)** | Simple, typed, React Query under the hood |
| **TanStack Router (file-based)** | Type-safe routing, automatic code splitting |
| **shadcn/ui components** | Consistent UI, copy-paste portable, customizable |
| **react-hook-form** | Framework-agnostic, good validation integration |
| **Tailwind CSS** | Utility-first, consistent styling |
| **sonner toasts** | Simple notification pattern |

### Cross-Cutting

| Pattern | Why Keep |
|---------|----------|
| **Monorepo structure** | Shared code, unified tooling, atomic changes |
| **pnpm workspaces** | Disk efficiency, strict deps, good filtering |
| **Server state via React Query** | No Redux/Zustand needed, caching handled |

---

## 3. Architecture Patterns (Improve)

### Backend

| Pattern | Issue | Improvement |
|---------|-------|-------------|
| **Per-request service instantiation** | No DI, harder to swap/test | Consider DI pattern or module-level singletons |
| **String-based error classification** | Fragile (`error.message.includes("not found")`) | Custom error classes with codes |
| **Repetitive try/catch in routers** | Boilerplate in every procedure | Error handling middleware |
| **Direct Prisma in some routers** | Inconsistent (e.g., `updateWorkflowStatus`) | Always go through service layer |
| **No repository abstraction** | Tight coupling to Prisma | Consider if needed for testability |
| **Plain Error objects** | No type discrimination | Typed application errors |

### Frontend

| Pattern | Issue | Improvement |
|---------|-------|-------------|
| **Large page files** | 649 lines in some files | Extract modal/dialog components |
| **`any` types in props** | Type safety gaps | Proper interfaces |
| **No data prefetching** | Waterfalls on navigation | Use TanStack Router loaders |
| **Mixed styling patterns** | Some inline, some Tailwind | Consistent utility-first |
| **Manual tab/step state** | Complex modal state management | Consider multi-step form library |

### Auth

| Pattern | Issue | Improvement |
|---------|-------|-------------|
| **Clerk dependency** | Third-party vendor lock-in | Session-based auth for new repo |

---

## 4. Migration Considerations

### Code That Can Move As-Is

- **tRPC router definitions** - Portable patterns
- **Service layer classes** - Business logic reusable
- **Zod schemas** - Validation logic unchanged
- **Prisma schema** - Database models transfer directly
- **shadcn/ui components** - Copy-paste friendly
- **React components** - Standard React patterns
- **Vitest tests** - Same runner, same mocking approach

### Code That Needs Adaptation

| Component | Adaptation Needed |
|-----------|-------------------|
| **Auth integration** | Replace Clerk with session-based auth |
| **tRPC context** | Update for new auth approach |
| **Protected procedures** | New auth middleware pattern |
| **Frontend auth hooks** | Replace `useAuth()` with session hooks |
| **Service instantiation** | Add DI if adopting that pattern |
| **Error handling** | Implement custom error classes |

### Dependencies: Keep vs Replace

| Keep | Replace | Rationale |
|------|---------|-----------|
| pnpm | — | Same tool |
| Express | — | Same choice |
| tRPC | — | Same choice |
| Zod | — | Same choice |
| Prisma | — | Same choice |
| Vite | — | Same choice |
| TanStack Router | — | Same choice |
| React Query | — | Same (via tRPC) |
| shadcn/ui | — | Same choice |
| Tailwind | — | Same choice |
| Vitest | — | Same choice |
| — | Turborepo | pnpm workspaces alone (simpler) |
| — | ESLint + Prettier | Biome (faster, simpler) |
| — | Clerk | Session-based auth (no vendor) |

---

## 5. Key Differences: Current → New

| Aspect | Current | New (Research) | Rationale |
|--------|---------|----------------|-----------|
| **Monorepo Tooling** | Turborepo | pnpm workspaces only | Simpler; add Turbo later if needed |
| **Linting/Formatting** | ESLint 9.x + custom | Biome | Faster, single config, fresh start |
| **Authentication** | Clerk (third-party) | Session-based (manual or Lucia) | No vendor lock-in, simpler model |
| **Error Handling** | String matching | Custom error classes + middleware | Type safety, less boilerplate |
| **Service DI** | Per-request `new Service()` | TBD (consider DI container) | Better testability |
| **Frontend Data Loading** | Client-side only | Router loaders (prefetch) | Better UX, no waterfalls |

### Unchanged Choices

These current choices align with research recommendations:

- Express as HTTP framework
- tRPC for API layer
- Prisma for ORM
- PostgreSQL for database
- Vite + React + TanStack Router
- shadcn/ui + Tailwind
- Vitest for testing
- Service layer pattern (with improvements)

---

## Summary

**Core stack is solid** - The fundamental technology choices (Express, tRPC, Prisma, Vite, TanStack, shadcn/ui) are validated by research and should carry forward.

**Simplification opportunities** - Drop Turborepo (for now), switch to Biome, replace Clerk with session auth.

**Pattern improvements** - Error handling, DI/service instantiation, route prefetching, and component extraction will improve maintainability.

**Migration path is smooth** - Most code is portable with targeted adaptations for auth and error handling.
