# Foundational Infrastructure

**Status:** Implemented (Phase 1: Minimal Online)
**Last Updated:** 2026-02-02

---

## Overview

This document describes Kahuna's foundational infrastructure—the stable base that supports the feedback loop without constraining it.

**Design Principle:** Keep the interface between infrastructure and feedback loop as narrow as possible. The loop needs exactly two things from infrastructure: a user ID and a database connection.

---

## Architecture Summary

```
Request → Express Middleware → tRPC Handler → Response
              │
              ├── CORS (cross-origin)
              ├── JSON parsing
              ├── Cookie parsing (signed)
              ├── Logging (all requests)
              └── Error handling (catches exceptions)
                      │
                      ▼
              tRPC Context Creation
                      │
                      ▼
              tRPC Procedures (public or protected)
```

---

## Prisma Schema

### Foundation Tables (Infrastructure-Owned)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  sessions Session[]
  projects Project[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

### Bridge Table (Shared Ownership)

```prisma
model Project {
  id        String   @id @default(cuid())
  userId    String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Infrastructure relation (user ownership)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Loop relations
  contextFiles   ContextFile[]
  vckGenerations VckGeneration[]
  buildResults   BuildResult[]

  @@index([userId])
}
```

### Schema Notes

| Model   | Owner          | Purpose                                    |
| ------- | -------------- | ------------------------------------------ |
| User    | Infrastructure | Identity and authentication                |
| Session | Infrastructure | Session persistence for auth               |
| Project | Shared         | Scopes all feedback loop content to a user |

**Why Project is shared:** The `Project` model bridges domains. Infrastructure creates it (tied to user), but the feedback loop fills it with content.

---

## Middleware

All middleware lives in [`apps/api/src/middleware/`](../apps/api/src/middleware/).

### Cookie Parsing

Uses `cookie-parser` with signed cookies for session management.

**Session cookie settings:**

| Setting    | Value                | Rationale                                 |
| ---------- | -------------------- | ----------------------------------------- |
| `httpOnly` | `true`               | Prevents XSS access to session cookie     |
| `secure`   | `true` in production | HTTPS only                                |
| `sameSite` | `'lax'`              | CSRF protection while allowing navigation |
| `maxAge`   | 7 days               | Reasonable for internal tool              |
| `signed`   | `true`               | Prevents cookie tampering                 |

### Logging Middleware

JSON-formatted request logging for debugging and audit:

```json
{
  "timestamp": "2026-02-02T00:00:00.000Z",
  "method": "POST",
  "path": "/trpc/project.create",
  "status": 200,
  "duration": 45,
  "userId": "clxyz..."
}
```

### Error Handling Middleware

Catches unhandled errors and returns consistent responses:

- Development: Full error message and stack trace
- Production: Generic "Internal server error" message

---

## Authentication

Auth routes are Express routes (outside tRPC) for direct cookie handling.

**Base path:** `/api/auth/*`

| Endpoint             | Method | Purpose                         |
| -------------------- | ------ | ------------------------------- |
| `/api/auth/register` | POST   | Create account + session        |
| `/api/auth/login`    | POST   | Validate credentials + session  |
| `/api/auth/logout`   | POST   | Clear session                   |
| `/api/auth/me`       | GET    | Get current user (if logged in) |

**Implementation:** [`apps/api/src/routes/auth.ts`](../apps/api/src/routes/auth.ts)

### Password Hashing

- Algorithm: bcrypt
- Cost factor: 12 rounds
- Helper functions in [`apps/api/src/lib/auth.ts`](../apps/api/src/lib/auth.ts)

### Session Management

Sessions are stored in the `Session` table with expiration. The session ID is stored in a signed cookie (`kahuna.sid`).

---

## tRPC Integration

### File Organization

```
apps/api/src/trpc/
├── context.ts        # Context creation
├── trpc.ts           # Base procedures and router
├── router.ts         # App router composition
└── routers/          # Domain routers
    ├── project.ts
    ├── context.ts
    ├── vck.ts
    └── results.ts
```

### Context Creation

The tRPC context provides authenticated user info to all procedures:

```typescript
// apps/api/src/trpc/context.ts
export async function createContext({ req, res }) {
  // Read session ID from signed cookie
  const sessionId = req.signedCookies["kahuna.sid"];
  let user = null;

  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (session && session.expiresAt > new Date()) {
      user = session.user;
    }
  }

  return { prisma, user };
}
```

### Procedure Types

```typescript
// apps/api/src/trpc/trpc.ts

// Public procedures - no auth required
export const publicProcedure = t.procedure;

// Protected procedures - requires authenticated user
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

### The Narrow Interface

This is how the feedback loop receives what it needs:

```typescript
// In any feedback loop router
export const projectRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ctx.user.id - The authenticated user's ID (from infrastructure)
      // ctx.prisma - Database connection (from infrastructure)
      // Everything else is loop logic

      return ctx.prisma.project.create({
        data: {
          name: input.name,
          userId: ctx.user.id,
        },
      });
    }),
});
```

**What the loop receives:**

- `ctx.user.id` - Opaque string identifying the user
- `ctx.prisma` - Database connection for loop tables

**What the loop does NOT receive:**

- User's password hash
- Session details
- Authentication method
- Any infrastructure internals

---

## Testing Door

For programmatic testing of the feedback loop without browser sessions:

```typescript
// apps/api/src/trpc/context.ts
if (
  (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") &&
  req.headers["x-test-user-id"]
) {
  const testUserId = req.headers["x-test-user-id"] as string;
  const testUser = await prisma.user.findUnique({
    where: { id: testUserId },
  });

  return { prisma, user: testUser };
}
```

**Constraints:**

- Only works when `NODE_ENV=test` or `NODE_ENV=development`
- Requires valid user ID (must exist in database)
- Used by `@kahuna/testing` CLI for manual testing

---

## Express Application Setup

```typescript
// apps/api/src/app.ts
const app = express();

// Global middleware (order matters)
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieMiddleware);
app.use(loggingMiddleware);

// Auth routes (outside tRPC)
app.use("/api/auth", authRouter);

// tRPC API
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// Error handling (must be last)
app.use(errorMiddleware);
```

---

## Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kahuna"

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Authentication
SESSION_SECRET=generate-a-64-character-random-string-here
```

**Generation hint (SESSION_SECRET):** `openssl rand -base64 48`

---

## MVP Scope

| Include             | Exclude          |
| ------------------- | ---------------- |
| Sign up             | Teams            |
| Log in              | Roles            |
| Log out             | Permissions      |
| Session persistence | Profile settings |
| Auth state check    | Password reset   |
|                     | OAuth providers  |

---

## Related Documentation

- [Feedback Loop Architecture](./02-feedback-loop-architecture.md) - Data flow
- [System Boundaries](./04-system-boundaries.md) - Domain separation
- [Repository Infrastructure](./01-repository-infrastructure.md) - Tooling setup
