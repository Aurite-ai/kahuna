# Development Workflow

## Overview

This document describes the standard workflow phases for all development tasks in the Kahuna project. These phases apply to features, refactoring, bug fixes, and any other code changes across the TypeScript/Node.js monorepo.

**Note:** This Development Workflow should not always be followed. If the user provides a plan that has already been created (and sometimes already started working on), you should review the plan and relevant materials before switching to the Implementation Phase. If there is a quick or simple request that doesn't require a plan, you may skip creating the plan and use the user's message as the plan. This Development Workflow reflects how software development is typically done.

---

## Workflow Phases

### Phase 1: Discovery

_Goal: Understand the problem and gather necessary context._

- Ask the user clarifying questions if you believe additional context and/or decision-making is needed.
  - NOTE: Keep in mind this is a collaborative process. You may always ask questions at any point in the workflow, not just during Phase 1.
- Review `.roo/rules/02_NAVIGATION_GUIDE.md` (Repository Navigation Guide) to identify relevant documentation
- Read the identified documents from `docs/` to understand the feature area
- Examine source files referenced in the documentation to understand current implementation

### Phase 2: Design (if complexity warrants)

_Goal: Create architectural design for significant features._

- For significant features, create a design document outlining architecture and component interactions
- Include: Architecture decisions, component interactions, API design, data flow diagrams
- Get design approval before proceeding to planning

### Phase 3: Planning

_Goal: Define WHAT and HOW, documenting the plan._

- Create implementation plan using appropriate template from mode-specific rules
- Store in `docs/internal/plans/MM-DD_[descriptive_name].md`
- Include testing as integral part of each implementation phase
- Plan for documentation updates as final step
- Review & Iterate plan until **explicit agreement**
- **Proceed ONLY on approval**

### Phase 4: Implementation

_Goal: Execute the approved plan step-by-step._

- Execute plan step-by-step
- Reference approved plan; confirm current step
- Implement each step fully before proceeding
- Follow coding standards and best practices
- When reaching testing steps, consult `tests/README.md` to locate relevant test files
- Run tests after each implementation phase
- Provide a progress report and consult for next steps after large or complex phases

---

## Testing & Verification

_Goal: Verify changes systematically with tests._

1. Review test setup (`tests/`, test configuration files, fixtures, mocks)
2. Write **simplest meaningful test first.** Avoid mocks initially unless essential/requested
3. Run test(s); analyze output carefully. DO NOT JUST WRITE TESTS. Use `pnpm test` and review the output with the user.
4. Iterate:
   - Fix failures (check code)
   - Expand passing tests incrementally
   - Refactor tests for clarity/reuse (use shared mocks/fixtures)
   - Introduce mocks strategically _after_ basic tests pass or if planned
5. Note test coverage
6. Report results & consult for next actions

**For manual testing:**

1. **Frontend**: Test in browser at http://localhost:5173, check console, verify network requests
2. **Backend**: Use curl/Postman for API testing, check server logs, use Prisma Studio for database state
3. **Type safety**: Run `pnpm check-types` to catch type errors

---

## Key Principles

- **Verify actively:** Check docs and code before acting; state when you need to verify information
- **Confirm understanding** before executing complex tasks
- **Focus on current step/task** - Don't jump ahead
- **Default to simplicity** - Justify complexity when needed
- **Use project structure** to overcome context limits