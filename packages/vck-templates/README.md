# @kahuna/vck-templates

Static VCK (Vibe Code Kit) content — copilot configurations and framework scaffolds that `kahuna_initialize` copies into new projects.

## Overview

When a copilot calls `kahuna_initialize`, this package provides the template files that bootstrap a project with:
- **Copilot configuration** — Rules, settings, and skills for Claude Code
- **Framework scaffold** — Boilerplate project structure (currently LangGraph/Python)

## Templates

```
templates/
├── copilot-configs/
│   └── claude-code/        # .claude/ directory structure
│       └── .claude/        # Settings, rules, skills
├── frameworks/
│   └── langgraph/          # LangGraph Python project scaffold
│       ├── pyproject.toml
│       ├── main.py
│       └── src/agent/      # graph.py, state.py, tools.py
├── project-env             # .env template
└── project-gitignore       # .gitignore template
```

## Source

```
src/
├── index.ts        # Public exports
├── types.ts        # Template type definitions
├── templates.ts    # Template path resolution
└── generator.ts    # Template generation logic
```

## Usage

This package is consumed by `@kahuna/mcp`'s `initialize` tool handler and by `@kahuna/testing`'s `create` command. It is not used directly.

```typescript
import { generateProject } from '@kahuna/vck-templates';
```
