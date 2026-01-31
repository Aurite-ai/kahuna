# Research: Testing Strategy

## Summary

For a TypeScript + Vite + tRPC stack, **Vitest** is the clear choice over Jest. For MVP scope, focus on **unit and integration tests** for backend procedures, deferring E2E testing until post-launch.

---

## Test Runner: Vitest vs Jest

### Options Considered

| Aspect | Vitest | Jest |
|--------|--------|------|
| TypeScript/ESM | Native, zero-config | Requires Babel setup |
| Vite Integration | Shares vite.config.js | Separate config |
| Watch Mode | Smart ES module graph | Git-based, less precise |
| Cold Start | ~200ms | ~2000ms |
| API Compatibility | Jest-compatible | N/A |
| Ecosystem Maturity | Newer | Battle-tested |

### Recommendation: **Vitest**

**Rationale:**
- Zero configuration for TypeScript + Vite + ESM
- Shares config with Vite (no duplication)
- 4x faster cold runs, 30% lower memory
- Jest-compatible API (easy migration if needed)
- Native monorepo support with intelligent watch mode

---

## Testing tRPC + React

### Backend Testing Pattern

Use tRPC's `createCallerFactory` for direct procedure testing without HTTP overhead:

```typescript
// test-helpers.ts
import { createCallerFactory } from './trpc';
import { appRouter } from './router';

export function createTestCaller(ctx = {}) {
  const createCaller = createCallerFactory(appRouter);
  return createCaller({
    // Mock context: db, user, etc.
    ...ctx,
  });
}

// usage in tests
const caller = createTestCaller({ user: mockUser });
const result = await caller.users.getProfile();
```

### Frontend Testing Options

| Approach | Complexity | When to Use |
|----------|------------|-------------|
| Mock tRPC client | Low | Unit testing components |
| MSW (Mock Service Worker) | Medium | Integration testing |
| Real tRPC caller | High | Full integration tests |

### Recommendation: Start Simple

For MVP, focus on **backend procedure tests** using callers. Frontend component tests can use simple mocks or be deferred.

---

## Testing Scope for MVP

### Testing Pyramid for MVP

```
        ╱╲
       ╱  ╲       E2E: Defer until post-launch
      ╱────╲      (3-5 critical flows when needed)
     ╱      ╲
    ╱        ╲    Integration: Key workflows
   ╱──────────╲   (tRPC procedures, DB operations)
  ╱            ╲
 ╱              ╲  Unit: Core business logic
╱────────────────╲ (70-80% coverage on essentials)
```

### Phase-Based Approach

| Phase | Test Focus | Tools |
|-------|------------|-------|
| **Now (MVP)** | Unit + Integration for backend | Vitest |
| **Post-launch** | Add E2E for critical paths | Playwright |
| **Scale-up** | Expand E2E, add visual regression | Playwright |

### E2E Testing: Playwright vs Cypress

| Aspect | Playwright | Cypress |
|--------|------------|---------|
| Browser Support | Chrome, Firefox, Safari, Edge | Chrome-focused |
| Speed | Faster, parallel execution | Slower |
| Language | TypeScript native | JavaScript-first |
| Learning Curve | Moderate | Lower |
| 2024-2025 Momentum | Growing rapidly | Established |

**Recommendation:** Playwright when E2E is needed (better cross-browser, faster, TypeScript-native)

---

## Recommendations

### Test Runner
**Vitest** - Zero-config for our stack, fast, Jest-compatible API

### Initial Testing Strategy (MVP)

1. **Backend first**: Test tRPC procedures using callers
   - Focus on business logic and data validation
   - Use test database or mocks for Prisma

2. **Frontend later**: Defer component testing
   - tRPC + TanStack Query handles most complexity
   - Add tests when component logic becomes complex

3. **E2E deferred**: Add Playwright post-launch
   - Only for critical user flows (auth, core features)
   - Wait until you know what's actually breaking

### Configuration

```
apps/
├── server/
│   ├── vitest.config.ts    # Backend tests
│   └── tests/
└── frontend/
    ├── vitest.config.ts    # Frontend tests (when needed)
    └── tests/
```

### What to Test First

1. **tRPC procedures** - Input validation, business logic
2. **Database operations** - CRUD operations work correctly
3. **Auth flows** - Protected procedures reject unauthorized

### What NOT to Test Yet

- Individual React components
- UI styling/layout
- E2E user flows
- Edge cases and error handling (focus on happy paths)

---

## Decision

| Choice | Selection | Confidence |
|--------|-----------|------------|
| Test Runner | Vitest | High |
| Backend Testing | tRPC callers + Vitest | High |
| Frontend Testing | Defer (or minimal mocks) | Medium |
| E2E Framework | Playwright (when needed) | High |
| Initial Scope | Backend procedures only | High |

**Principle applied:** Simple, standard choices. Test the backend where bugs hurt most, defer UI testing until complexity demands it.
