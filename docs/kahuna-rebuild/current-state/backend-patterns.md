# Backend Patterns Inventory

**Date:** 2026-01-30
**Purpose:** Document current backend architectural patterns for migration planning

---

## 1. tRPC Router Structure

### Aggregation Pattern

- Main router aggregates sub-routers by spreading procedures: `...templatesRouter._def.procedures`
- Sub-routers grouped by domain: templates, library, specification, runtime, generation, deployment
- Allows logical separation while maintaining flat procedure namespace
- Each sub-router is a standalone `router({...})` export

### Procedure Types

- **`userProcedure`** - Authenticated procedures with `ctx.user` available
  - Provides `ctx.user.id` and `ctx.user.email`
  - Handles auth middleware automatically
- **`query`** - Read operations (listWorkflows, getWorkflow, getInputSchema)
- **`mutation`** - Write operations (createWorkflow, updateWorkflow, deleteWorkflow)

### Router File Structure

```
routes/
├── agent-workflows.ts              # Aggregator
├── agent-workflows-templates.ts    # Sub-router
├── agent-workflows-library.ts      # Sub-router
└── ...
```

---

## 2. Service Layer Pattern

### Instantiation

- **Per-request instantiation**: Services created fresh in each procedure
  ```typescript
  const libraryService = new AgentWorkflowLibraryService();
  ```
- No dependency injection framework
- Services are stateless classes

### Service Responsibilities

- Business logic and orchestration
- Prisma database interactions
- External service calls (n8n client)
- Authorization checks (user ownership verification)

### Prisma Interaction

- Direct import: `import { prisma } from "../lib/prisma.js"`
- Services use Prisma client directly for queries
- No repository abstraction layer

---

## 3. Input Validation

### Zod Schema Pattern

- Schemas defined at top of router file, before router definition
- Naming convention: `{operationName}Input` (e.g., `createWorkflowInput`)
- Inline schemas for simpler inputs: `.input(z.object({ workflowId: z.string() }))`

### Schema Examples

```typescript
// Simple
const getWorkflowInput = z.object({
  workflowId: z.string(),
});

// Complex with optional nested objects
const listWorkflowsInput = z.object({
  projectId: z.string().optional(),
  filters: z.object({
    status: z.string().optional(),
    templateType: z.string().optional(),
    search: z.string().optional(),
  }).optional(),
});
```

### Validation Location

- Input validated at router level via `.input(schema)`
- Business validation (ownership, existence) in services

---

## 4. Error Handling

### Router-Level Pattern

- All service calls wrapped in try/catch
- Errors converted to `TRPCError` with appropriate codes
- Error message inspection for code mapping:

```typescript
throw new TRPCError({
  code: error.message.includes("not found") ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
  message: error instanceof Error ? error.message : "Failed to ...",
  cause: error,
});
```

### Error Code Mapping

| Service Error Contains | tRPC Code |
|------------------------|-----------|
| "not found" | `NOT_FOUND` |
| "Unauthorized" | `NOT_FOUND` |
| "unauthorized" | `FORBIDDEN` |
| default | `INTERNAL_SERVER_ERROR` |

### Service-Level Pattern

- Services throw plain `Error` objects
- No custom error classes
- Error messages used for classification

---

## 5. Testing Patterns

### Framework & Organization

- **Vitest** for test runner
- Test file mirrors source: `src/services/foo.service.ts` → `tests/unit/services/foo.service.test.ts`
- Describe blocks match class/method structure:
  ```typescript
  describe("AgentWorkflowLibraryService", () => {
    describe("listWorkflows", () => {
      it("should return workflows for a user", ...);
    });
  });
  ```

### Mocking Approach

- **Module-level mocks** via `vi.mock()` at file top
- Prisma mocked as object with method stubs
- External services (n8n client) mocked via factory pattern
- `vi.clearAllMocks()` in `beforeEach`

```typescript
vi.mock("../../../src/lib/prisma.js", () => ({
  prisma: {
    workflowInstance: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      // ...
    },
  },
}));
```

### Test Coverage Scope

- Happy path scenarios
- Authorization failures (wrong user)
- Not found cases
- Filter/query variations
- No integration tests in this file (unit only)

---

## 6. Observations

### What Works Well

- **Clear separation**: Routers handle HTTP/validation, services handle business logic
- **Consistent patterns**: Predictable code structure across domains
- **Zod integration**: Type-safe validation with good inference
- **Comprehensive unit tests**: Good coverage of service methods

### Areas for Improvement

- **Error handling verbosity**: Same try/catch pattern repeated in every procedure
- **No DI**: Per-request service instantiation; harder to swap implementations
- **String-based error classification**: Fragile; easy to break with message changes
- **Direct Prisma in services**: Tight coupling; harder to test without mocks
- **Some direct Prisma in routers**: [`updateWorkflowStatus`](apps/server/src/routes/agent-workflows-library.ts:290) bypasses service layer
- **No custom error types**: Could improve error handling consistency

### Migration Considerations

- tRPC patterns portable to most frameworks
- Service layer can be reused with minor refactoring
- Test mocking approach works with any test runner
- Consider error handling middleware to reduce boilerplate
- Consider repository pattern if database abstraction needed
