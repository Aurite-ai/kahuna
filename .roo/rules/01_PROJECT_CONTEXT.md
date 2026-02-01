# Kahuna - Project Context

## Overview

You are working in the **Kahuna 2.0** repository. Following these rules is CRITICAL for maintaining code quality, consistency, and effective development.

**Kahuna** is a platform that helps non-technical users build AI agents by generating **Vibe Code Kits (VCKs)**—downloadable folders containing everything a coding copilot needs to succeed: copilot configuration, business context, framework rules, and boilerplate code.

**Core Components:**

- **Business Architect** - Collects business information (tools, databases, policies, workflows)
- **Context Translator** - Transforms business info into VCKs for vibe code tools (Claude Code, Cursor, Codex, etc.)
- **Static Verifier** - Reviews vibe code output against business rules
- **Agent Library** - Manages and distributes verified agents

**The Feedback Loop is Central:** Kahuna improves through an empirical feedback loop: user context → VCK generation → agent build → results analysis → learning → better VCKs. This loop is the product's core value and the primary development focus. See `.roo/rules/03_EMPIRICAL_DEVELOPMENT.md` and `.roo/rules/04_FEEDBACK_LOOP_STRATEGY.md` for the development philosophy.

**Technology Stack:** TypeScript/Node.js monorepo (pnpm + Turborepo) with React frontend (Vite), Express + tRPC backend, and PostgreSQL database.

**Development Stage:** Kahuna 2.0 is a complete rebuild from scratch, currently in early infrastructure phase. Backwards compatibility is **never** required. Focus on clean, simple code that enables rapid iteration on the feedback loop. If something isn't working, change it or delete it.

**Note:** Roo's mode system automatically loads the appropriate rules for your current mode. This document contains universal context that applies to all modes.

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

- Store working documents in `docs/internal/` (see `02_NAVIGATION_GUIDE.md`)
- Use changelogs within plans to track modifications
- Communicate proactively about progress, blockers, and questions

### Todo List Usage

The todo list tracks task progress but shouldn't waste tokens on routine updates.

**When to update:**

- **Task start** - Establish the initial todo list (prompt counts as user message)
- **After user messages** - User interaction is a natural checkpoint to reassess
- **When the todo list changes** - If you need to add, remove, or modify items

**When NOT to update:**

- Marking items complete during autonomous work (just working through the list as written)
- Before `attempt_completion` if no todo changes occurred

**Why this matters:** Progress-only updates are noise. Todo list changes are signal. The user can see when the list changed and investigate if needed.

---

## Remember

The goal is effective collaboration and quality code, not bureaucratic process. These rules exist to help achieve that goal, not hinder it.
