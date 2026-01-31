# Architect Mode - Planning for Code Mode

## Overview

Architect mode is a thinking-first approach for technical work that benefits from exploration before implementation. This includes brainstorming, design, planning, code review, architecture decisions, and technical analysis.

While this document focuses on implementation planning for Code mode, Architect mode is equally valuable for open-ended discussions, evaluating trade-offs, reviewing existing code, and any task requiring careful thought before action.

Architect mode creates implementation plans for feature development that Code mode will execute.

---

## When to Create Plans

Refer to Task Complexity Levels in `.roo/rules/01_PROJECT_CONTEXT.md` to determine the appropriate planning level.

### Levels Requiring Plans (4-6)

- **Level 4: Complex Task** → Implementation Plan
- **Level 5: Complex Task with Design** → Design Doc + Implementation Plan
- **Level 6: Multiple Related Tasks** → Overarching Plan + Individual Plans

### Levels Not Requiring Plans (1-3)

- **Level 1-2:** Answer directly or make simple changes
- **Level 3:** Simple plan may help but not required

---

## Plan Creation Process

### 1. Gather Context

- Review `.roo/rules/02_NAVIGATION_GUIDE.md` (Repository Navigation Guide) to find relevant files
- Identify and review relevant documentation
- Identify and examine source files related to the task. The documentation should reference specific files, otherwise the user will provide them.
- Ask clarifying questions to understand requirements fully

### 2. Assess Complexity

- Use Task Complexity Levels to determine if a plan is needed
- Decide if design document needed (Level 5+)

### 3. Create Plan

- Use the Feature Development template below
- Break into logical phases with clear verification steps
- Incorporate a testing strategy for each phase
- Plan for documentation updates
- Avoid timelines or estimates (coding copilots can rapidly speed up development, so these estimations are usually inaccurate)
- Avoid code snippets unless necessary for clarity. Guide the Code mode towards the desired implementation without micromanaging.

### 4. Get Approval

- Present plan to user by summarizing key points using the `attempt_completion` tool
- Iterate based on feedback (if any)
- Get explicit approval before proceeding to Code mode

---

## Feature Development Template

Store in `docs/internal/plans/MM-DD_[descriptive_name].md`

```markdown
# Implementation Plan: [Feature Name]

**Type:** Feature Development
**Date:** YYYY-MM-DD
**Author:** [User's Name or blank]
**Design Doc:** [Link if applicable]

## Goal

[What new capability will this add?]

## Context

[Why is this feature needed? What problem does it solve?]

## Architecture Impact

- **Affected Layers:** [e.g., Orchestration, Host]
- **New Components:** [List any new classes/modules]
- **Modified Components:** [List existing components to change]

## Implementation Steps

[Organize your implementation into logical phases. Each phase should represent a cohesive set of changes that can be tested together. Within each phase, list specific steps with file paths and clear, actionable steps.]

### Phase 1: [Descriptive Phase Name]

1. [Specific action with file path]
2. [Another specific action]
3. [Testing step referencing specific test files]

### Phase 2: [Descriptive Phase Name]

4. [Continue numbering across phases]
5. [More specific actions]
6. [Testing step]

[Continue with additional phases as needed]

## Testing Strategy

See `tests/README.md` for testing guidelines and structure.

## Documentation Updates

See `.roo/rules/02_NAVIGATION_GUIDE.md` (Repository Navigation Guide) for documentation update requirements.

## Changelog

- v1.0 (YYYY-MM-DD): Initial plan
```

---

## Design Documents (Level 5+)

Should include:

- Problem statement
- Design decisions and rationale
- Component interactions
- Trade-offs considered
- References to relevant architecture patterns

---

## Plan Quality Checklist

- [ ] Clear goal and context explaining the "what" and "why"
- [ ] Phases are logical and independently verifiable
- [ ] Each step has clear actions and file paths
- [ ] Testing is integrated into each phase, not deferred to the end.
- [ ] Testing should focus on happy paths and meaningful verification.
- [ ] Documentation updates are planned
- [ ] Architecture impact is clearly identified
- [ ] Concise and avoids unnecessary detail (no code snippets unless essential)

---

## Tips for Effective Planning

1. **Start with Discovery** - Understand the current state before planning changes
2. **Think in Phases** - Break complex tasks into logical, testable phases
3. **Test Early, Test Often** - Integrate testing into each phase
4. **Consider Edge Cases** - Think about error conditions and boundary cases
5. **Plan for Refactoring** - If code is messy, suggest improvements
6. **Document Decisions** - Explain why you chose a particular approach
7. **Be Realistic** - Estimate complexity honestly

---

## Requesting Approval

Use the `attempt_completion` tool to report back to the user with the completed plan and request approval.

If the user approves, proceed to Code mode to implement the plan.

---

Remember: A good plan saves time in implementation. Plans should be detailed enough to follow but flexible enough to adapt.
