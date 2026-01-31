# Refactor Sub-Mode

## Role

You improve code quality while maintaining existing functionality through incremental, test-driven refactoring. General workflow phases are in `.roo/rules/03_DEVELOPMENT_WORKFLOW.md`.

## Key Practices

- **Test first** - Ensure `pnpm test` passes before refactoring begins
- **Incremental changes** - Small, verifiable steps rather than large rewrites
- **Preserve behavior** - External interfaces and functionality must remain unchanged
- **Type safety** - Run `pnpm check-types` after each change
- **Document rationale** - Explain why each refactoring improves the codebase

---

# Refactoring Plan Template

```markdown
# Implementation Plan: [Refactoring Name]

**Type:** Refactoring
**Date:** YYYY-MM-DD
**Author:** [User's Name or blank]
**Design Doc:** [Link if applicable]

## Goal

[What code quality improvements will this achieve? (e.g., improve performance, reduce complexity, increase readability)]

## Context

[Why is this refactoring needed? What specific problems or code smells does it solve?]

## Current State Analysis

- **Code Smells:** [List specific issues with the current implementation (e.g., long method, duplicated code, tight coupling)]
- **Affected Files:** [List all files that will be modified]
- **Dependencies:** [List components that depend on the code being refactored and may need to be checked]

## Implementation Steps

[Organize your refactoring into logical phases. Each phase must result in a working state with all tests passing.]

### Phase 1: [Descriptive Phase Name, e.g., Initial Setup]

1.  **Action:** Run all relevant tests to establish a baseline. All tests must pass.
    - **Verification:** Run `pnpm test` and confirm test suite passes.
2.  **Action:** [First small refactoring step, e.g., Extract method `X` from class `Y` in `file.ts`]
    - **Verification:** Run `pnpm test` again to ensure no behavior has changed.
    - **Verification:** Run `pnpm check-types` to ensure type safety is maintained.

### Phase 2: [Descriptive Phase Name, e.g., Core Refactoring]

3.  **Action:** [Next refactoring step]
    - **Verification:** Run `pnpm test`.
    - **Verification:** Run `pnpm check-types`.
4.  **Action:** [Another refactoring step]
    - **Verification:** Run `pnpm test`.
    - **Verification:** Run `pnpm check-types`.

[Continue with additional phases as needed]

## Risk Mitigation

- [ ] All existing tests pass before starting.
- [ ] Each phase maintains backward compatibility.
- [ ] TypeScript types remain valid throughout refactoring.
- [ ] Performance benchmarks remain stable (if applicable).

## Testing Strategy

See `tests/README.md` for testing guidelines and structure. The primary goal is to ensure no regressions are introduced.

## Documentation Updates

See `.roo/rules/02_NAVIGATION_GUIDE.md` (Repository Navigation Guide) for documentation update requirements. Focus on updating code comments and JSDoc/TSDoc to reflect the new structure.

## Changelog

- v1.0 (YYYY-MM-DD): Initial refactoring plan
```

Remember to follow the Implementation Workflow in `.roo/rules-code/CODE_MODE.md` when executing this plan.