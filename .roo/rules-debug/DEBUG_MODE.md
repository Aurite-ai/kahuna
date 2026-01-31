# Debugging in Debug Mode

## Overview

This document provides strategies and a template for debugging issues. The primary goal of debugging is to **isolate the problem** before attempting a fix. A thorough, methodical approach is often faster than making assumptions.

General workflow phases are in `.roo/rules/03_DEVELOPMENT_WORKFLOW.md`.

---

## Core Debugging Strategies

### Isolate the Problem

Before writing any fix, you must isolate the root cause. Use the following techniques, often in combination. Remember that taking the time to do this thoroughly is the fastest path to a correct solution.

- **Add Logging:** Insert temporary logging statements (`console.log()`, `console.debug()`) in the suspected code paths to trace execution flow and inspect variable states. For backend services, consider using structured logging with `pino` or similar.
- **Write Simple Test Scripts:** Create small, standalone TypeScript scripts (`scripts/debug_*.ts`) that import the problematic component and reproduce the error with minimal code. This is highly effective for isolating issues.
- **Use `node -e` or `ts-node -e`:** For very simple checks, use the terminal to execute a single line of JavaScript/TypeScript code to test a specific function or interaction without creating a file.
  - `node -e "const { myFunc } = require('./my-module'); console.log(myFunc('test'));"`
  - `ts-node -e "import { myFunc } from './my-module'; console.log(myFunc('test'));"`

### Investigate External Packages

Do not assume how external packages (e.g., `@trpc/server`, `express`) work. Review their code directly.

1.  **Find the Package:** Use `npm list [package_name]` or `pnpm list [package_name]` to verify the installed version.
2.  **Explore the Code:** Navigate to `node_modules/[package_name]/` and use the `list_files` tool to see the package's file structure.
3.  **Read the Source:** Use `read_file` to examine the relevant source code within the package (often in `node_modules/[package_name]/src/` or `node_modules/[package_name]/dist/`) to understand its logic.

### Reproduce with a Failing Test

The most reliable way to confirm a bug and validate a fix is to write a test that fails because of the bug, and then passes once the fix is applied.

---

## Bug Fix Plan Template

```markdown
# Implementation Plan: [Bug Fix Description]

**Type:** Bug Fix
**Date:** YYYY-MM-DD
**Author:** [User's Name or blank]
**Issue:** [Link to issue/bug report if applicable]

## Goal

[What bug will be fixed? What behavior will be corrected?]

## Context

[How was the bug discovered? What is the impact?]

## Root Cause Analysis

- **Expected Behavior:** [What should happen]
- **Actual Behavior:** [What is happening]
- **Root Cause:** [Why it's happening, based on the isolation steps]
- **Affected Components:** [List affected files/methods]

## Implementation Steps

[Organize your fix into logical phases. Start with reproducing the bug, then fix, then verify.]

### Phase 1: Reproduce and Test

1.  **Action:** Add a failing test that reproduces the bug in `tests/`.
2.  **Verification:** Run the new test with `pnpm test` and confirm that it fails as expected.

### Phase 2: Implement Fix

3.  **Action:** Apply the code change to fix the bug in `src/`.
4.  **Verification:** Run the failing test from Phase 1 with `pnpm test` and confirm it now passes.

### Phase 3: Verify No Regression

5.  **Action:** Run all related tests for the affected component(s) with `pnpm test`.
6.  **Verification:** Confirm that all tests pass and no new issues were introduced.
7.  **Action:** Remove any temporary debugging code (e.g., logging statements).
8.  **Action:** Run type checking with `pnpm check-types` and linting with `pnpm lint`.

## Testing Strategy

See `tests/README.md` for testing guidelines and structure.

## Documentation Updates

See `.roo/rules/02_NAVIGATION_GUIDE.md` (Repository Navigation Guide) for documentation update requirements.

## Changelog

- v1.0 (YYYY-MM-DD): Initial plan
