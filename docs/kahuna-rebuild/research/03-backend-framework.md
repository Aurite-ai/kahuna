# Backend Framework & API Style Research

**Date:** 2025-01-30
**Purpose:** Research backend framework and API design for Kahuna rebuild

---

## Summary

For a TypeScript monorepo with React frontend building an internal business application:

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| HTTP Framework | **Express** | Battle-tested ecosystem, vast middleware, proven stability |
| API Style | **tRPC** | End-to-end type safety, zero codegen, fastest iteration |
| Project Structure | Service layer pattern | Clean separation, testable, maintainable |

---

## HTTP Framework: Express vs Fastify vs Hono

### Options Considered

| Framework | Pros | Cons |
|-----------|------|------|
| **Express** | Largest ecosystem, most middleware, battle-tested, extensive docs | Slower (~19k req/s), requires manual TS typing |
| **Fastify** | Faster (~45k req/s), native TS support, built-in validation | Smaller ecosystem than Express, learning curve |
| **Hono** | Fastest (~66k req/s), excellent TS, tiny bundle | Newest, smallest ecosystem, edge-focused |

### Recommendation: Express

**Why Express over Fastify/Hono:**

1. **Ecosystem maturity** - Thousands of middleware packages, every problem has a solution
2. **Documentation abundance** - More tutorials, Stack Overflow answers, examples
3. **tRPC integration** - Well-documented Express adapter, proven combination
4. **Team familiarity** - Most TypeScript developers know Express
5. **"Simple, standard choices"** - Express is the most standard Node.js choice

**Trade-off acknowledged:** Fastify is faster and has better native TypeScript support. For an internal business app where we're not serving millions of requests, Express's ecosystem advantages outweigh Fastify's performance benefits.

**Note:** If performance becomes critical, migrating from Express to Fastify is straightforward since both use similar patterns.

---

## API Style: REST vs tRPC vs GraphQL

### Options Considered

| Style | Pros | Cons |
|-------|------|------|
| **REST** | Universal, well-understood, works with any client | Manual type maintenance, more boilerplate |
| **tRPC** | Auto end-to-end types, zero codegen, fast iteration | TypeScript-only, single frontend assumption |
| **GraphQL** | Flexible queries, great for multiple clients | Schema overhead, N+1 risks, more complex |

### Recommendation: tRPC

**Why tRPC for Kahuna:**

1. **Single frontend** - We have one React app, not multiple clients or a public API
2. **End-to-end type safety** - Server changes immediately propagate to client types
3. **Zero code generation** - Unlike GraphQL, no build step for types
4. **Development speed** - Research shows 35-40% faster than REST, 20-25% faster than GraphQL
5. **React Query integration** - tRPC uses TanStack Query under the hood

**When we'd reconsider:**
- If we needed a public API (REST would be more appropriate)
- If we had multiple frontends with different data needs (GraphQL)
- If we needed to support non-TypeScript clients (REST)

---

## Project Structure

### Recommended Pattern

```
apps/server/
├── src/
│   ├── routes/          # tRPC routers (organized by domain)
│   │   ├── users.ts
│   │   ├── workflows.ts
│   │   └── index.ts     # Root router combining all routers
│   ├── services/        # Business logic (database operations, etc.)
│   │   ├── users.service.ts
│   │   └── workflows.service.ts
│   ├── lib/             # Shared utilities
│   │   ├── db.ts        # Prisma client
│   │   └── trpc.ts      # tRPC setup
│   └── index.ts         # Express server entry point
├── prisma/
│   └── schema.prisma
└── package.json
```

### Key Principles

1. **Routes** - Handle HTTP/tRPC concerns, input validation, call services
2. **Services** - Pure business logic, no HTTP awareness, testable in isolation
3. **Lib** - Shared utilities, database client, tRPC configuration
4. **Separation** - Routes never touch database directly, services never touch HTTP

### tRPC + Express Integration

```typescript
// Simple setup pattern
import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routes';

const app = express();
app.use('/trpc', trpcExpress.createExpressMiddleware({ router: appRouter }));
```

---

## Final Recommendations

| Component | Choice | Confidence |
|-----------|--------|------------|
| HTTP Framework | Express | High - proven, ecosystem, simplicity |
| API Style | tRPC | High - perfect fit for single-frontend TS app |
| Validation | Zod | High - tRPC native, runtime + compile time |
| Structure | Service layer | High - standard, testable pattern |

### Stack Summary

```
Frontend (React)
    ↓ tRPC client (auto-typed)
Backend (Express + tRPC)
    ↓ Services (business logic)
Database (Prisma + PostgreSQL)
```

This gives us:
- **Type safety** from database to UI
- **Fast iteration** with instant type feedback
- **Standard patterns** that are well-documented
- **Simplicity** over sophistication
