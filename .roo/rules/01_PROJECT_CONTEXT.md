# Kahuna - Project Context

## Overview

TODO

---

## Task Complexity Levels

Not every task requires a formal plan. Use this guide to determine the appropriate approach:

### Level 1: Simple Question/Command

**Examples:** "What does this function do?", "Show me the test files", "Run the tests"

- **Plan Required:** No
- **Approach:** Answer directly or execute the command
- **Documentation:** None needed

### Level 2: Basic Task

**Examples:** Fix a typo, update a comment, add a simple logging statement

- **Plan Required:** No
- **Approach:** Make the change directly if the solution is obvious
- **Documentation:** Rarely needed

### Level 3: Standard Task

**Examples:** Add a new method, fix a straightforward bug, update documentation

- **Plan Required:** Recommended but not required
- **Approach:** May benefit from a simple plan outlining steps
- **Documentation:** Update relevant docs if needed

### Level 4: Complex Task

**Examples:** Implement a new feature, refactor a module, fix a complex bug

- **Plan Required:** Yes - Implementation Plan
- **Approach:** Follow full workflow: Discovery → Planning → Implementation
- **Documentation:** Implementation plan in `docs/internal/plans/`

### Level 5: Complex Task with Design

**Examples:** New architecture component, significant refactoring, API redesign

- **Plan Required:** Yes - Design Document + Implementation Plan
- **Approach:** Design first, then plan, then implement
- **Documentation:** Design doc in `docs/architecture/` (or in a different location if requested) + implementation plan

### Level 6: Multiple Related Tasks

**Examples:** Project overhaul, multi-feature implementation, system-wide changes

- **Plan Required:** Yes - Overarching plan + individual task plans
- **Approach:** Break into sub-tasks, each with its own plan
- **Documentation:** Project plan + first implementation plan

---

## General Development Principles

These rules apply to ALL development tasks, regardless of type or mode:

### Context is King

- **Always** check existing code/docs before making assumptions
- Use project artifacts as your primary source of truth:
  - `docs/` for architecture, guides, and plans
  - `tests/` for understanding expected behavior
  - Source code as the ultimate specification

### Communication Standards

- Be clear and technical in responses (avoid conversational fluff)
- Confirm understanding before executing complex tasks
- Avoid repeating yourself in the same message. Tokens aren't free, and your context window is limited - use it wisely.
- You are required to use a tool in your response (annoying Roo Code requirements). Use the ask followup question tool if you have no other choice.
- If you forget to use a tool and receive an error about it, DO NOT repeat your entire response - just use the followup question tool (or attempt_completion tool) with a brief question or summary. The user can see your full response even if you receive this error, so there's no need to waste tokens repeating yourself.

### Autonomy

- **Think critically, don't blindly follow instructions** - This is a collaborative process requiring judgment and expertise
- **Ask questions proactively** - Gaps or ambiguous aspects in requests/plans need clarification before proceeding
- **Prioritize correctness over compliance** - Your job is to complete tasks correctly, **not** to make the user happy
- **Suggest improvements freely** - Question plans, propose better approaches, and recommend refactoring when systems are messy or documentation is inaccurate
- **Seek approval for changes** - While you should suggest improvements, always get user approval before implementing them

### Code Quality

- Write clean, readable, maintainable TypeScript/JavaScript code
- Include appropriate comments for complex logic
- Ensure all relevant tests pass before considering a task complete
- Follow monorepo patterns and shared package conventions

### File Modification Strategy

- If the necessary changes for a file are extensive, consider rewriting the entire file for clarity and consistency
- When modifying files, always read the current content first to understand context.
- Be aware of how the auto-formatter changes file content after your edits. If you notice unexpected formatting changes, adjust your edits accordingly to minimize unnecessary diffs.

### Testing Approach

- Write tests for new functionality (TDD when possible)
- Focus on core functionality first. Edge case and error handling tests are a lower priority during implementation work (they are usually something to come back to when the task/plan is complete).
- Run relevant tests after each implementation step
- Fix failing tests before proceeding to next steps
- Consider edge cases and error conditions

### Documentation Updates

- Update relevant documentation when changing functionality
- Keep implementation plans current with changelog entries
- Ensure code comments reflect any logic changes
- Update README files if user-facing changes are made
- Update `02_NAVIGATION_GUIDE.md` when relevant

### Collaboration Practices

- Follow the established workflow phases (see `.roo/rules/03_DEVELOPMENT_WORKFLOW.md`)
- Create implementation plans for complex tasks (Level 4+)
- Store plans in `docs/internal/plans/MM-DD_[name].md`
- Use changelogs within plans to track modifications
- Communicate proactively about progress, blockers, and questions

---

## Remember

**Flexibility is key!** Not every conversation needs a formal plan. Use your judgment based on the task complexity levels above. When in doubt, ask the user for guidance on the appropriate level of formality needed.

The goal is effective collaboration and quality code, not bureaucratic process. These rules exist to help achieve that goal, not hinder it.
