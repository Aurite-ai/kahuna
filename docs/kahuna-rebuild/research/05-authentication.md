# Research: Authentication Approach

**Date:** 2025-01-30
**Status:** Complete

## Summary

For an MVP internal business tool with Express + tRPC + Prisma, **session-based authentication with email/password** is the recommended approach. Use either **Lucia** (modern, TypeScript-first) or a **manual setup** with `express-session` + `bcrypt` + Prisma session store.

---

## Options Considered

### Authentication Libraries

| Library | Express Fit | Prisma Support | Best For | Trade-offs |
|---------|-------------|----------------|----------|------------|
| **Lucia** | Excellent | Official adapter | Modern TypeScript apps, session-based | Fewer OAuth providers OOTB |
| **Passport.js** | Excellent | Via adapters | OAuth strategies, established patterns | More boilerplate, less TypeScript-native |
| **Better Auth** | Moderate | Plugin available | Full-featured (2FA, orgs) | Heavier, less Express-optimized |
| **Auth.js** | Poor | Adapter exists | Next.js apps | Not designed for vanilla Express |

### Session vs JWT

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Sessions** | Easy revocation, server-controlled, simpler security model | Requires session store | Internal apps, business tools |
| **JWT** | Stateless, microservices-friendly | Hard to revoke, larger payloads | Public APIs, distributed systems |

**Verdict:** Sessions are preferred for internal business apps - easier to manage, revoke, and audit.

---

## tRPC Integration Pattern

Authentication integrates cleanly with tRPC via context:

```typescript
// 1. Create context with session data
export async function createContext({ req }: { req: Request }) {
  return {
    session: req.session,
    user: req.session?.userId ? await getUser(req.session.userId) : null
  };
}

// 2. Define public and protected procedures
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { user: ctx.user } }); // Narrowed type
});

// 3. Use in routers
export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.user),
  publicInfo: publicProcedure.query(() => 'Public data')
});
```

---

## Recommendation

### For MVP: Manual Session Setup

**Why:** Maximum simplicity, minimal dependencies, full control, easy to understand.

**Core dependencies:**
- `express-session` - Session middleware
- `bcrypt` - Password hashing
- `@quixo3/prisma-session-store` or `connect-pg-simple` - Prisma/PostgreSQL session store

**Implementation outline:**
1. Add `User` and `Session` models to Prisma schema
2. Create `/login`, `/logout`, `/register` Express routes (outside tRPC for cookie handling)
3. Populate tRPC context with session user
4. Create `protectedProcedure` middleware for authenticated routes

### Upgrade Path

| Phase | Enhancement |
|-------|-------------|
| MVP | Email/password + sessions |
| Phase 2 | Add OAuth (Google) via Passport.js strategy or Lucia |
| Phase 3 | Add 2FA, password reset emails if needed |

### Production Checklist

- [ ] Strong `SESSION_SECRET` (64+ random chars)
- [ ] HTTPS in production (`secure: true` cookie)
- [ ] Rate limiting on auth endpoints
- [ ] `helmet.js` for security headers
- [ ] CSRF protection if using forms

---

## Alternatives Not Chosen

- **Lucia:** Good choice, but adds a dependency. Consider if OAuth is needed early.
- **Passport.js:** Overkill for email/password only; valuable if multiple OAuth providers needed.
- **Auth.js:** Designed for Next.js, poor Express fit.
- **JWT:** Unnecessary complexity for internal session-based app.

---

## References

- [tRPC Authorization Docs](https://trpc.io/docs/server/authorization)
- [tRPC Context Docs](https://trpc.io/docs/server/context)
- [Express Session Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
