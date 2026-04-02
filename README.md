# Kahuna

Kahuna is a context management platform that helps coding copilots succeed with complex tasks. The primary interface is an **MCP server** that provides tools for sending context, retrieving relevant information, managing integrations, and tracking usage. Behind the MCP tools, a **Knowledge Base** of organized markdown files (written by agents, for agents) grows and improves over time.

> **Note:** This repository is in early development. See [Documentation](#documentation) below for architecture and design docs.

## Documentation

**For Users:**
- [MCP Server Documentation](apps/mcp/README.md) — Installation, tools, configuration
- [Advanced Documentation](apps/mcp/docs/ADVANCED.md) — Integrations, vault, KB structure

**For Contributors:**
- [Product Design](docs/design/README.md) — Core concepts, tool specifications
- [Architecture: Repository Infrastructure](docs/architecture/01-repository-infrastructure.md)
- [Architecture: Context Management System](docs/architecture/02-context-management-system.md)

---

## Quick Start (Claude Code)

### Step 1: Add Kahuna

```bash
claude mcp add kahuna -s user -e ANTHROPIC_API_KEY="your-anthropic-api-key" -- npx @aurite-ai/kahuna
```

> **Scope options:**
> - `-s project` — Config stored for current project only
> - `-s user` — Config stored globally (available across all projects)

### Step 2: Set Up Kahuna

In each new project, restart Claude Code and say:

> **"Set up Kahuna"**

This deploys copilot rules to your project and runs first-time onboarding. The copilot will ask a few questions to understand your organization and project context—this only happens once, then Kahuna remembers.

### Step 3: Teach Kahuna Your Context

Share files from anywhere on your system:

> **"learn ~/Downloads/business-policies.pdf"**

Or share entire folders:

> **"learn the docs/ folder"**

Kahuna classifies and stores everything in its knowledge base. This context persists across sessions and projects.

### Step 4: Start Building

When you start a task, Kahuna automatically surfaces relevant context:

> **"build a customer support agent"**

Kahuna finds the relevant policies, examples, and patterns you've taught it.

Use `/mcp` in Claude Code to verify the server is connected.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  YOU                          COPILOT                  KAHUNA   │
│                                                                 │
│  "set up Kahuna"  ─────────►  deploys rules  ─────►  .claude/   │
│                               asks questions          stores    │
│                                                       context   │
│                                                                 │
│  "learn these docs" ───────►  kahuna_learn   ─────►  knowledge  │
│                                                       base      │
│                                                                 │
│  "build feature X" ────────►  kahuna_prepare ─────►  surfaces   │
│                               _context                relevant  │
│                                                       files     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

- 🧠 **Knowledge Base** - Store, categorize, and retrieve context from markdown files
- 🎯 **Smart Context Surfacing** - Automatically surface relevant knowledge for your task
- 🔗 **Integration Management** - Discover, verify, and use external service integrations
- 🔐 **Secure Credential Vault** - Store and manage secrets with multiple provider support
- 📊 **Usage Tracking** - Monitor token consumption and costs per project
- 🚀 **Onboarding System** - Guided setup for organization and project context

## Available Tools

| Tool | Description |
|------|-------------|
| `kahuna_initialize` | Deploys copilot rules, runs onboarding |
| `kahuna_learn` | Adds files to knowledge base with classification |
| `kahuna_prepare_context` | Surfaces relevant knowledge for a task |
| `kahuna_ask` | Quick Q&A against the knowledge base |
| `kahuna_delete` | Remove outdated files from the knowledge base |
| `kahuna_provide_context` | Store org or user context in the knowledge base |
| `kahuna_usage` | View token usage and cost summary for the project |
| `kahuna_list_integrations` | List all discovered integrations and their status |
| `kahuna_use_integration` | Execute operations on discovered integrations |
| `kahuna_verify_integration` | Verify integration credentials and connectivity |
| `health_check` | Verify MCP server connectivity |

---

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9+

### Developer Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp apps/mcp/.env.example apps/mcp/.env

# Build workspace packages
pnpm build

# Run tests
pnpm test
```

## Scripts

| Command          | Description                        |
| ---------------- | ---------------------------------- |
| `pnpm build`     | Build all packages (via Turborepo) |
| `pnpm test`      | Run all tests across workspace     |
| `pnpm lint`      | Lint codebase (Biome)              |
| `pnpm lint:fix`  | Lint and auto-fix issues           |
| `pnpm format`    | Format codebase (Biome)            |
| `pnpm typecheck` | Type-check all packages            |
| `pnpm clean`     | Remove build artifacts and caches  |

### Testing CLI

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `pnpm kahuna-test`   | Run testing CLI                            |
| `pnpm test:create`   | Create a test project from a scenario      |
| `pnpm test:list`     | List available scenarios and test projects |
| `pnpm test:collect`  | Collect results from a test session        |

## Project Structure

```
kahuna/
├── apps/
│   └── mcp/                # MCP server (stdio) — context management tools
│       ├── src/
│       │   ├── knowledge/  # Knowledge base domain logic (agents, storage, surfacing)
│       │   ├── integrations/   # External service integration management
│       │   ├── vault/      # Secure credential management
│       │   ├── usage/      # Token usage and cost tracking
│       │   └── tools/      # MCP tool handlers
│       └── templates/      # Project initialization templates
├── packages/
│   ├── testing/            # QA testing infrastructure (scenarios + CLI)
│   └── vck-templates/      # Copilot configuration templates
└── docs/                   # Documentation
```

## License

MIT
