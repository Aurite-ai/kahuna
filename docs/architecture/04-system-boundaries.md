# System Boundaries

**Status:** Implemented (Phase 1: Minimal Online)
**Last Updated:** 2026-02-02

---

## Overview

This document defines how Kahuna's two main concerns—foundational infrastructure and the feedback loop—coexist without conflict. The separation is designed to enable rapid iteration on the feedback loop while keeping infrastructure stable.

**Key insight:** The feedback loop is the product. Everything else exists to support it or stay out of its way.

---

## The Two Domains

### Domain 1: Foundational Infrastructure

Infrastructure that every web application needs, regardless of specific product features:

- **Authentication** - Who is making requests?
- **Authorization** - What can they access?
- **Request Handling** - Middleware, validation, error handling
- **Data Persistence** - Database schema, migrations
- **API Layer** - tRPC routers, procedures

These are **stable concerns**—they change infrequently once established.

### Domain 2: Feedback Loop

The core product functionality that will iterate rapidly:

- **Context Collection** - Gathering user business information
- **VCK Generation** - Transforming context into downloadable kits
- **Results Capture** - Receiving build outcomes and conversation logs
- **Analysis & Learning** - Improving future VCK quality (future)

This is the **volatile concern**—it must change freely during Phase 1 and beyond.

---

## Interaction Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        Request Flow                             │
│                                                                 │
│   User ──▶ Auth ──▶ Middleware ──▶ Router ──▶ ???               │
│                                              │                  │
│                                    ┌─────────┴─────────┐        │
│                                    │                   │        │
│                                    ▼                   ▼        │
│                           ┌────────────┐      ┌────────────┐    │
│                           │ Foundation │      │  Feedback  │    │
│                           │  Features  │      │    Loop    │    │
│                           └────────────┘      └────────────┘    │
│                                    │                   │        │
│                                    └─────────┬─────────┘        │
│                                              │                  │
│                                              ▼                  │
│                                        ┌──────────┐             │
│                                        │ Database │             │
│                                        └──────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Shared Resources

| Resource               | How Shared                                      |
| ---------------------- | ----------------------------------------------- |
| Request entry point    | Both receive requests through same API layer    |
| Authentication context | Both need to know which user is making requests |
| Database               | Both persist data to the same PostgreSQL        |

### Independent Concerns

| Aspect           | Independence                               |
| ---------------- | ------------------------------------------ |
| Business logic   | Foundation knows nothing about VCKs        |
| Iteration speed  | Foundation is stable; loop changes rapidly |
| Testing strategy | Different validation requirements          |

---

## Separation Strategy

### Principle: Narrow Interface, Wide Independence

The feedback loop depends on infrastructure through the **narrowest possible interface**:

```
Feedback Loop needs from Infrastructure:
├── User ID (from auth)
├── Database connection (ctx.prisma)
└── That's it
```

Everything else is internal to the loop and can change without coordinating with infrastructure.

### What This Means Concretely

| Concern                   | Owned By            | Impact on Loop                      |
| ------------------------- | ------------------- | ----------------------------------- |
| User authentication       | Infrastructure      | Loop receives authenticated user ID |
| Session management        | Infrastructure      | Loop doesn't care how sessions work |
| Database schema for users | Infrastructure      | Loop has its own tables             |
| Database schema for VCKs  | Loop                | Infrastructure doesn't touch these  |
| Request validation        | Shared middleware   | Both use same patterns              |
| Error handling            | Shared middleware   | Both use same patterns              |
| Business logic            | Separate per domain | No sharing                          |

---

## Database Boundary

The database is the primary shared resource. All models live in a single `schema.prisma` file, but ownership is clearly separated:

```
Database Tables (single schema.prisma)
├── Foundation Tables (stable, owned by infrastructure)
│   ├── User
│   ├── Session
│   └── [future: Team, Role]
│
├── Bridge Table (shared ownership)
│   └── Project
│
├── Loop Tables (volatile, owned by feedback loop)
│   ├── ContextFile
│   ├── VckGeneration
│   └── BuildResult
│
└── Testing Tables (owned by testing infrastructure)
    ├── TestSession
    └── TestEvaluation
```

### Design Principle

Loop tables reference `User.id` as a foreign key but treat users as an opaque concept. The loop doesn't care about:

- How users authenticate
- What profile data exists
- Whether users belong to teams

This allows infrastructure to evolve user management without touching loop code.

---

## API Layer Organization

Both domains expose functionality through tRPC, but in separate routers:

```
tRPC Router Structure
├── project.*     (Loop - entry point, shared ownership)
├── context.*     (Loop - business context)
├── vck.*         (Loop - generation)
└── results.*     (Loop - capture)

Express Routes (outside tRPC)
├── /api/auth/*   (Infrastructure - authentication)
```

**Note:** Auth routes are Express routes rather than tRPC procedures because they need direct cookie manipulation.

---

## Package Structure

```
packages/
├── shared/              # @kahuna/shared - Types, constants, utilities
├── vck-templates/       # @kahuna/vck-templates - VCK content
│   └── templates/
│       ├── copilot-configs/   # Copilot rules by provider
│       └── frameworks/        # Agent framework scaffolds
└── testing/             # @kahuna/testing - Test scenarios and CLI
    └── scenarios/       # Test scenario definitions
```

**Why packages?**

- **Templates are product content** - They ship in VCKs, need proper versioning
- **Scenarios are test fixtures** - Separate from production code
- **Consistent imports** - Both API and CLI tools import via package names

---

## The Testing Door

Per the feedback loop strategy, we need a "testing door" for programmatic loop validation:

```
┌──────────────────────────────────────────────────────────┐
│                    API Entry Points                       │
│                                                          │
│   Web UI ──────────┐                                     │
│                    ├──▶ Standard Auth ──▶ Loop Routers   │
│   Testing Door ────┘                                     │
│        │                                                 │
│        └──▶ X-Test-User-Id header in dev/test mode       │
└──────────────────────────────────────────────────────────┘
```

The testing door:

- Uses the **same loop code** as production requests
- Has **simplified auth** (X-Test-User-Id header)
- Exists from Phase 1 to enable rapid iteration
- Only available in development/test environments

---

## Visual Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         Kahuna MVP                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Shared: Request Handling                    │   │
│  │         (Auth middleware, validation, errors)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│              ┌───────────────┴───────────────┐                  │
│              │                               │                  │
│              ▼                               ▼                  │
│  ┌─────────────────────┐       ┌─────────────────────────────┐ │
│  │   Infrastructure    │       │       Feedback Loop         │ │
│  │                     │       │                             │ │
│  │  • User auth        │       │  • Context collection       │ │
│  │  • Session mgmt     │       │  • VCK generation           │ │
│  │  • User CRUD        │       │  • Results capture          │ │
│  │                     │       │  • Analysis/learning (TBD)  │ │
│  │  Stable, changes    │       │  Volatile, changes          │ │
│  │  infrequently       │       │  constantly                 │ │
│  └─────────┬───────────┘       └─────────────┬───────────────┘ │
│            │                                 │                  │
│            │      User.id reference          │                  │
│            └───────────────┬─────────────────┘                  │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      PostgreSQL                          │   │
│  │   [user tables]              [loop tables]               │   │
│  │   Owned by infra             Owned by loop               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Conflict Prevention Checklist

When designing or implementing either domain, verify:

**For Infrastructure changes:**

- [ ] Does this require loop code to change? (Should be NO)
- [ ] Does this add columns to loop tables? (Should be NO)
- [ ] Does this change how user ID is provided to requests? (Should be NO)

**For Loop changes:**

- [ ] Does this require infrastructure code to change? (Should be NO)
- [ ] Does this depend on user data beyond ID? (Should be NO)
- [ ] Does this add requirements to auth/middleware? (Should be NO)

If any answer is YES, reconsider the design to restore independence.

---

## Alignment with Empirical Development

This design supports the [empirical philosophy](/.roo/rules/03_EMPIRICAL_DEVELOPMENT.md) by:

1. **Minimizing loop dependencies** - The loop can iterate without infrastructure coordination
2. **Keeping interfaces narrow** - Less coupling = faster experiments
3. **Avoiding premature complexity** - Infrastructure is minimal (just auth)
4. **Enabling the testing door** - Infrastructure explicitly supports programmatic testing

---

## Related Documentation

- [Feedback Loop Architecture](./02-feedback-loop-architecture.md) - Data flow details
- [Foundational Infrastructure](./03-foundational-infrastructure.md) - Auth and middleware
- [Feedback Loop Strategy](/.roo/rules/04_FEEDBACK_LOOP_STRATEGY.md) - Development philosophy
