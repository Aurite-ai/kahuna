# Decision Inventory: Kahuna Rebuild Repository Setup

**Goal:** Identify decisions needed before setting up the new repository.
**Principle:** Boring, standard choices. Simplest thing that works.

---

## 1. Repository Structure

| Decision | Question | Complexity |
|----------|----------|------------|
| Monorepo vs Multi-repo | Single repo with both frontend and backend, or separate repos? | Quick |
| Monorepo Tooling | If monorepo: Turborepo, Nx, pnpm workspaces only, or npm workspaces? | Quick |
| Folder Layout | Where do frontend/backend/shared code live? | Quick |

## 2. Package Manager

| Decision | Question | Complexity |
|----------|----------|------------|
| Package Manager | npm, pnpm, or yarn? | Quick |

## 3. TypeScript Configuration

| Decision | Question | Complexity |
|----------|----------|------------|
| TS Strictness | How strict? `strict: true` or more permissive? | Quick |
| Shared Config | Share tsconfig between frontend/backend or separate? | Quick |
| Target/Module | Node target version, ESM vs CommonJS? | Quick |

## 4. Code Quality Tooling

| Decision | Question | Complexity |
|----------|----------|------------|
| Linter | ESLint only? Which config preset? | Quick |
| Formatter | Prettier? What config? | Quick |
| Pre-commit Hooks | Husky + lint-staged? Or skip for now? | Quick |

## 5. Backend Framework

| Decision | Question | Complexity |
|----------|----------|------------|
| HTTP Framework | Express, Fastify, Hono, or other? | Quick |
| API Style | REST, tRPC, or GraphQL? | Needs Discussion |

## 6. Frontend Specifics

| Decision | Question | Complexity |
|----------|----------|------------|
| Routing | TanStack Router, React Router, or other? | Quick |
| State/Data Fetching | TanStack Query? SWR? Plain fetch? | Quick |
| UI Components | shadcn/ui, Radix, Material UI, or build from scratch? | Quick |
| Styling | Tailwind CSS, CSS modules, styled-components? | Quick |

## 7. Database & ORM

| Decision | Question | Complexity |
|----------|----------|------------|
| Prisma Location | Where does Prisma schema live in the repo? | Quick |
| Migration Strategy | Prisma migrate dev workflow? | Quick |
| Seeding | Need seed data? How to structure? | Quick |

## 8. Authentication

| Decision | Question | Complexity |
|----------|----------|------------|
| Auth Approach | Sessions, JWT, OAuth, or defer auth entirely for MVP? | Needs Discussion |
| Auth Library | Passport.js, custom, third-party service, or none? | Depends on above |

## 9. Testing

| Decision | Question | Complexity |
|----------|----------|------------|
| Test Runner | Vitest, Jest, or other? | Quick |
| Testing Scope | What to test initially? Unit only? Integration? E2E? | Needs Discussion |
| E2E Tool | Playwright, Cypress, or defer? | Can defer |

## 10. Development Environment

| Decision | Question | Complexity |
|----------|----------|------------|
| Local DB | Docker Compose for PostgreSQL? Local install? | Quick |
| Environment Variables | .env approach? What variables needed? | Quick |
| Dev Server Setup | Concurrent frontend/backend? How to run? | Quick |

## 11. CI/CD & Deployment

| Decision | Question | Complexity |
|----------|----------|------------|
| CI Pipeline | GitHub Actions? What checks to run? | Can defer |
| Deployment Target | Where will this run? Cloud, self-hosted? | Can defer |

---

## Summary by Complexity

### Quick Decisions (can decide in ~5 min each)
- Repository structure (monorepo, tooling, layout)
- Package manager
- TypeScript configuration
- Code quality tooling
- Backend HTTP framework
- Frontend routing, state, UI, styling
- Database setup
- Test runner
- Development environment

### Needs Discussion (may have tradeoffs)
- API style (REST vs tRPC)
- Authentication approach
- Testing scope for MVP

### Can Defer (not blocking repo setup)
- Pre-commit hooks
- E2E testing
- CI/CD pipeline
- Deployment target

---

## Next Step

Work through each category and document the decisions in `02-decisions.md`.
