# Developer Patterns Reference

Quick reference for common development patterns in Kahuna 2.0.

---

## Table of Contents

- [tRPC vs Express Routes](#trpc-vs-express-routes)
- [Logging](#logging)
- [Error Handling](#error-handling)
- [User Auth / Session Middleware](#user-auth--session-middleware)
- [Testing Infrastructure](#testing-infrastructure)
- [Schema Structure](#schema-structure)

---

## tRPC vs Express Routes

Kahuna uses both tRPC and Express routes, each for different purposes:

### When to Use Each

| Layer         | Location                       | Purpose                                        |
| ------------- | ------------------------------ | ---------------------------------------------- |
| **tRPC**      | `apps/api/src/trpc/routers/`   | JSON data operations (CRUD, queries, mutations)|
| **Express**   | `apps/api/src/routes/`         | Binary operations, file downloads, special HTTP|

### tRPC Routers

Use tRPC for standard API operations that exchange JSON data:

```typescript
// apps/api/src/trpc/routers/project.ts
export const projectRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.project.create({ ... });
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.project.findMany({ ... });
    }),
});
```

**Examples:** `project.create`, `project.list`, `vck.generate`, `context.upload`

### Express Routes

Use Express for operations requiring special HTTP semantics:

```typescript
// apps/api/src/routes/vck.ts
router.get('/:projectId/download', requireAuth, async (req, res) => {
  // Stream ZIP file to client
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  archive.pipe(res);
});
```

**Examples:**
- `/api/vck/:projectId/download` - ZIP file streaming
- `/api/auth/*` - Cookie handling (login, logout, session management)

### Decision Guide

| Scenario                      | Choice    | Reason                                      |
| ----------------------------- | --------- | ------------------------------------------- |
| CRUD operations               | tRPC      | Type-safe, automatic serialization          |
| Queries returning JSON        | tRPC      | End-to-end type inference                   |
| File downloads (ZIP, binary)  | Express   | Streaming, custom Content-Type              |
| Cookie-based auth flows       | Express   | Direct control over cookies/headers         |
| Webhook endpoints             | Express   | Signature verification, raw body access     |
| Form multipart uploads        | Express   | File streaming, multer middleware           |

---

## Logging

**Implementation:**
- [`apps/api/src/lib/logger.ts`](../../apps/api/src/lib/logger.ts) - Pino logger instance
- [`apps/api/src/middleware/logging.ts`](../../apps/api/src/middleware/logging.ts) - HTTP request logging

### How It Works

Kahuna uses [Pino](https://getpino.io/) for structured logging. The logger provides different output formats based on environment:

| Environment | Output Format                                    |
| ----------- | ------------------------------------------------ |
| Development | Single-line colorized: `INFO: GET /path 200`     |
| Production  | JSON (structured, machine-parseable)             |

### Using the Logger

```typescript
import { logger } from '../lib/logger.js';

// Basic logging
logger.info('Server started');
logger.warn('Deprecated endpoint called');
logger.error({ err }, 'Database connection failed');

// With structured data
logger.info({ projectId, framework }, 'VCK generated');
```

### Log Levels

| Level   | Method           | Use Case                              |
| ------- | ---------------- | ------------------------------------- |
| `fatal` | `logger.fatal()` | Application crash, unrecoverable      |
| `error` | `logger.error()` | Operation failed, needs attention     |
| `warn`  | `logger.warn()`  | Unexpected but handled, degraded mode |
| `info`  | `logger.info()`  | Normal operations, milestones         |
| `debug` | `logger.debug()` | Detailed debugging information        |
| `trace` | `logger.trace()` | Very verbose, step-by-step tracing    |

### Child Loggers

Use child loggers to add consistent context to a group of related logs:

```typescript
const vckLogger = logger.child({ component: 'vck' });

vckLogger.info({ projectId }, 'Starting VCK generation');
// Output includes: { component: 'vck', projectId: '...', ... }
```

### HTTP Request Logging

All HTTP requests are automatically logged by the logging middleware. Each request logs:

| Field       | Description                                   |
| ----------- | --------------------------------------------- |
| `method`    | HTTP method                                   |
| `path`      | Request URL (originalUrl)                     |
| `status`    | HTTP status code                              |
| `duration`  | Request duration in milliseconds              |
| `userId`    | Authenticated user ID or `"anonymous"`        |

### Configuration

Set the log level via environment variable:

```bash
# .env
LOG_LEVEL=info  # Options: fatal, error, warn, info, debug, trace, silent
```

---

## Error Handling

**Implementation:** [`apps/api/src/middleware/error.ts`](../../apps/api/src/middleware/error.ts)

### How It Works

The error middleware catches unhandled exceptions and returns consistent JSON responses. It must be registered **last** in the middleware chain.

### Error Response Format

```json
{ "error": "Error message here" }
```

### HttpError Class

Use `HttpError` to throw errors with specific status codes:

```typescript
import { HttpError } from '../middleware/error.js';

// In an Express route or middleware
throw new HttpError(400, 'Invalid project name');
throw new HttpError(404, 'Project not found');
throw new HttpError(403, 'Not authorized to access this project');
```

### tRPC Errors

For tRPC procedures, use `TRPCError`:

```typescript
import { TRPCError } from '@trpc/server';

throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Project not found',
});

throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'Not your project',
});
```

### Common tRPC Error Codes

| Code            | HTTP Status | Use Case                        |
| --------------- | ----------- | ------------------------------- |
| `UNAUTHORIZED`  | 401         | Not authenticated               |
| `FORBIDDEN`     | 403         | Authenticated but not allowed   |
| `NOT_FOUND`     | 404         | Resource doesn't exist          |
| `BAD_REQUEST`   | 400         | Invalid input                   |
| `CONFLICT`      | 409         | Resource already exists         |

### Development vs Production

| Environment | Behavior                                       |
| ----------- | ---------------------------------------------- |
| Development | Full error message + stack trace in logs       |
| Production  | Generic "Internal server error" for 500 errors |

---

## User Auth / Session Middleware

**Implementation:**
- [`apps/api/src/lib/auth.ts`](../../apps/api/src/lib/auth.ts) - Auth utilities
- [`apps/api/src/middleware/auth.ts`](../../apps/api/src/middleware/auth.ts) - Express middleware
- [`apps/api/src/trpc/context.ts`](../../apps/api/src/trpc/context.ts) - tRPC context

### How Sessions Work

1. User logs in via `/api/auth/login`
2. Server creates `Session` record in database
3. Session ID stored in signed cookie (`kahuna.sid`)
4. Cookie automatically sent with subsequent requests
5. Server validates session on each request

### Session Cookie Settings

| Setting    | Value           | Purpose                           |
| ---------- | --------------- | --------------------------------- |
| `httpOnly` | `true`          | Prevents XSS access               |
| `secure`   | Production only | HTTPS only in production          |
| `sameSite` | `lax`           | CSRF protection                   |
| `maxAge`   | 7 days          | Session duration                  |
| `signed`   | `true`          | Prevents tampering                |

### Accessing User in tRPC Procedures

Use `protectedProcedure` for routes requiring authentication:

```typescript
import { protectedProcedure, router } from '../trpc.js';

export const projectRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ctx.user is guaranteed to exist (type-safe)
      return ctx.prisma.project.create({
        data: {
          name: input.name,
          userId: ctx.user.id,
        },
      });
    }),
});
```

### Accessing User in Express Routes

Use `requireAuth` middleware:

```typescript
import { requireAuth } from '../middleware/auth.js';

router.get('/my-data', requireAuth, (req, res) => {
  // req.user is guaranteed to exist
  // req.userId is the user's ID
  res.json({ userId: req.userId });
});
```

### Optional Authentication

For routes that work differently for authenticated vs anonymous users:

```typescript
import { optionalAuth } from '../middleware/auth.js';

router.get('/public', optionalAuth, (req, res) => {
  if (req.user) {
    // Logged in user
  } else {
    // Anonymous user
  }
});
```

### Auth Utilities

| Function             | Purpose                               |
| -------------------- | ------------------------------------- |
| `hashPassword()`     | Hash password with bcrypt (12 rounds) |
| `verifyPassword()`   | Compare password to hash              |
| `createSession()`    | Create session in database            |
| `validateSession()`  | Validate session ID, return user      |
| `deleteSession()`    | Remove session from database          |
| `setSessionCookie()` | Set session cookie on response        |
| `clearSessionCookie()` | Clear session cookie                |

---

## Testing Infrastructure

**Implementation:** [`packages/testing/`](../../packages/testing/)

### Overview

The testing CLI (`@kahuna/testing`) enables programmatic testing of the feedback loop without browser sessions. It uses a **test auth bypass** mechanism.

### Test Auth Bypass

In `test` or `development` environments, requests with `X-Test-User-Id` header bypass normal cookie authentication:

```typescript
// From apps/api/src/trpc/context.ts
if (allowTestBypass && req.headers['x-test-user-id']) {
  const testUserId = req.headers['x-test-user-id'] as string;
  const testUser = await prisma.user.findUnique({
    where: { id: testUserId },
  });
  return { prisma, user: testUser, isTestContext: true };
}
```

**Constraints:**
- Only works when `NODE_ENV=test` or `NODE_ENV=development`
- User ID must exist in database
- `ctx.isTestContext` flag indicates bypass was used

### CLI Commands

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `pnpm test:init`     | Initialize `.kahuna` config file           |
| `pnpm test:create`   | Create VCK instance from scenario          |
| `pnpm test:submit`   | Submit build results to complete loop      |

### Using the Test Client

```typescript
import { createTestClient } from '@kahuna/testing';

const client = createTestClient({
  baseUrl: 'http://localhost:3000',
  testUserId: 'test-user-id',
});

// Project operations
const project = await client.createProject('My Project');
const projects = await client.listProjects();

// Context operations
await client.createContext(projectId, 'policy.md', '# Policy content');

// VCK operations
const vck = await client.generateVck(projectId);

// Results operations
await client.submitResults({
  projectId,
  code: { 'agent.py': '...' },
  docs: { 'README.md': '...' },
  tests: { 'test_agent.py': '...' },
  conversationLog: '...',
});
```

### Workflow: Manual Testing

```bash
# 1. Initialize configuration (once)
pnpm test:init

# 2. Start the API
pnpm dev:api

# 3. Create a test project from scenario
pnpm test:create level-1-customer-support

# 4. Build the agent with your coding copilot
cd projects/level-1-customer-support-xxx/
# ... build with Claude Code, Cursor, etc.

# 5. Submit results
pnpm test:submit level-1-customer-support-xxx --project <project-id>
```

---

## Schema Structure

**Implementation:** [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma)

### Ownership Model

The schema is divided by ownership domain:

| Domain         | Models                                | Purpose                      |
| -------------- | ------------------------------------- | ---------------------------- |
| Infrastructure | `User`, `Session`                     | Auth and identity            |
| Bridge         | `Project`                             | Links user to loop data      |
| Feedback Loop  | `ContextFile`, `VckGeneration`, `BuildResult` | Core business data  |
| Testing        | `TestSession`, `TestEvaluation`       | VCK quality testing          |

### Model Reference

#### Infrastructure Models

```
User
├── id: String (cuid)
├── email: String (unique)
├── password: String (bcrypt hash)
├── createdAt: DateTime
├── updatedAt: DateTime
└── Relations: sessions[], projects[]

Session
├── id: String (cuid)
├── userId: String → User
├── expiresAt: DateTime
├── createdAt: DateTime
└── Indexes: userId, expiresAt
```

#### Bridge Model

```
Project
├── id: String (cuid)
├── userId: String → User (infrastructure)
├── name: String
├── createdAt: DateTime
├── updatedAt: DateTime
└── Relations: contextFiles[], vckGenerations[], buildResults[]
```

#### Feedback Loop Models

```
ContextFile
├── id: String (cuid)
├── projectId: String → Project
├── filename: String
├── content: String (text)
├── createdAt: DateTime
└── updatedAt: DateTime

VckGeneration
├── id: String (cuid)
├── projectId: String → Project
├── framework: String (default: "langgraph")
├── copilot: String (default: "claude-code")
└── createdAt: DateTime

BuildResult
├── id: String (cuid)
├── projectId: String → Project
├── code: Json (Record<string, string>)
├── docs: Json (Record<string, string>)
├── tests: Json (Record<string, string>)
├── conversationLog: String? (text)
└── createdAt: DateTime
```

### Key Design Principles

1. **Narrow Interface**: Feedback loop only sees `userId`, never auth details
2. **Cascade Deletes**: Deleting a user removes all their data
3. **Immutable History**: `VckGeneration` and `BuildResult` are append-only
4. **JSON for Flexibility**: Build results use JSON columns for file maps

### Common Queries

```typescript
// Get project with all context files
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: { contextFiles: true },
});

// Verify user owns project
const project = await prisma.project.findFirst({
  where: { id: projectId, userId: ctx.user.id },
});
if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

// Get VCK history
const generations = await prisma.vckGeneration.findMany({
  where: { projectId },
  orderBy: { createdAt: 'desc' },
});
```

---

## Quick Reference

### Import Paths

```typescript
// Middleware
import { loggingMiddleware } from '../middleware/logging.js';
import { errorMiddleware, HttpError } from '../middleware/error.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { cookieMiddleware } from '../middleware/cookies.js';

// Logging
import { logger } from '../lib/logger.js';

// Auth utilities
import {
  hashPassword,
  verifyPassword,
  createSession,
  validateSession,
  deleteSession,
  setSessionCookie,
  clearSessionCookie,
} from '../lib/auth.js';

// tRPC
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc.js';
import type { Context } from '../trpc/context.js';

// Prisma
import { prisma } from '../db.js';
```

### Environment Variables

| Variable         | Purpose                   | Example                             |
| ---------------- | ------------------------- | ----------------------------------- |
| `DATABASE_URL`   | SQLite database file      | `file:./dev.db`                     |
| `SESSION_SECRET` | Cookie signing key        | 64+ character random string         |
| `NODE_ENV`       | Environment mode          | `development`, `test`, `production` |
| `CORS_ORIGIN`    | Allowed frontend origin   | `http://localhost:5173`             |
| `PORT`           | API server port           | `3000`                              |
| `LOG_LEVEL`      | Pino log level            | `info`, `debug`, `warn`, `error`    |

---

## Related Documentation

- [Foundational Infrastructure](../architecture/03-foundational-infrastructure.md) - Detailed architecture
- [Feedback Loop Architecture](../architecture/02-feedback-loop-architecture.md) - Data flow and entities
- [System Boundaries](../architecture/04-system-boundaries.md) - Domain separation
