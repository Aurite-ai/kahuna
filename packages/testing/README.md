# @aurite-ai/kahuna-testing

QA testing infrastructure for evaluating Kahuna's VCK (Vibe Code Kit) quality. Provides a CLI for creating test projects, running copilot sessions against scenarios, and collecting results.

## Overview

The testing package evaluates whether Kahuna's copilot configurations help coding copilots succeed at real tasks. Each **scenario** defines a project a "vibe coder" might build, with requirements at varying complexity levels.

## CLI Commands

### `create` — Create a test project

Assembles an isolated test project from a VCK template + scenario:

```bash
pnpm kahuna-test create <scenario>
pnpm kahuna-test create customer-support-agent --name my-test
```

The created project combines:
- Framework scaffold (from `@aurite-ai/kahuna-vck-templates`)
- Copilot configuration (`.claude/` rules and settings)
- Scenario context (`project-context.md` and `knowledge-base/`)

### `list` — Show available scenarios

```bash
pnpm kahuna-test list
```

Lists all scenarios in `scenarios/` and any existing test projects.

### `collect` — Gather results

```bash
pnpm kahuna-test collect <project> --tester "Name"
```

Collects results from a completed test session for evaluation.

## Scenarios

Each scenario contains standardized documents:

| File | Purpose |
|------|---------|
| `project-context.md` | Context file for the copilot (copied to test project) |
| `requirements.md` | Full technical requirements (evaluation reference) |
| `user-prompts.md` | Natural language prompts simulating a non-technical user |
| `evaluation-criteria.md` | Rubric for scoring copilot performance |
| `knowledge-base/` | (Optional) Business context files for the copilot |

### Available Scenarios

| Scenario | Complexity | Focus |
|----------|------------|-------|
| `customer-support-agent` | Foundation | Tool usage, file security, basic agent patterns |
| `stock-market-reporter` | Integration | API auth, tool selection, output formatting |
| `seo-analysis-reporter` | Architecture | Complex integrations, design decisions, LLM analysis |

See [scenarios/README.md](scenarios/README.md) for the full testing methodology.

## Project Structure

```
packages/testing/
├── bin/kahuna-test.js      # CLI entry point
├── scenarios/              # Test scenario definitions
│   ├── customer-support-agent/
│   ├── stock-market-reporter/
│   └── seo-analysis-reporter/
└── src/
    ├── cli.ts              # Commander program setup
    ├── types.ts            # Shared type definitions
    ├── utils.ts            # Path and file utilities
    └── commands/
        ├── create.ts       # Assemble test project
        ├── list.ts         # Show scenarios + projects
        └── collect.ts      # Gather session results
```
