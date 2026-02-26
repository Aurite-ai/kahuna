# Kahuna

Kahuna is a context management platform that helps coding copilots succeed with complex tasks. The primary interface is an **MCP server** that provides tools for sending context, retrieving relevant information, managing integrations, and tracking usage. Behind the MCP tools, a **Knowledge Base** of organized markdown files (written by agents, for agents) grows and improves over time.

> **Note:** This repository is in early development. See [docs/](docs/) for architecture and design documentation.

## Features

- 🧠 **Knowledge Base** - Store, categorize, and retrieve context from markdown files
- 🎯 **Smart Context Surfacing** - Automatically surface relevant knowledge for your task
- 🔗 **Integration Management** - Discover, verify, and use external service integrations
- 🔐 **Secure Credential Vault** - Store and manage secrets with multiple provider support
- 📊 **Usage Tracking** - Monitor token consumption and costs per project
- 🚀 **Onboarding System** - Guided setup for organization and project context

## Prerequisites

- Node.js 18+
- pnpm 9+

## Quick Start

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

## MCP Server Setup

The MCP server allows AI assistants (Claude Desktop, Roo Code, etc.) to interact with Kahuna programmatically via stdio transport.

```bash
# Build the MCP server
pnpm --filter @aurite-ai/kahuna build
```

### Option A: Using Claude MCP CLI (Recommended)

```bash
claude mcp add kahuna -s project -e ANTHROPIC_API_KEY="your-key" -- npx @aurite-ai/kahuna
```

> **Note:** Use `-s user` for global scope (available across all projects).

### Option B: Manual Configuration

Create a `.mcp.json` file in your project directory:

```json
{
  "mcpServers": {
    "kahuna": {
      "command": "npx",
      "args": ["@aurite-ai/kahuna"],
      "env": {
        "ANTHROPIC_API_KEY": "your-key"
      }
    }
  }
}
```

For detailed tool documentation and development instructions, see [apps/mcp/README.md](apps/mcp/README.md).

## Available Tools

| Tool | Description |
|------|-------------|
| `kahuna_learn` | Send files to Kahuna to learn from and add to the knowledge base |
| `kahuna_prepare_context` | Prepare `.context-guide.md` with task-relevant knowledge |
| `kahuna_ask` | Quick Q&A using the knowledge base |
| `kahuna_delete` | Remove outdated files from the knowledge base |
| `kahuna_provide_context` | Store org or user context in the knowledge base |
| `kahuna_usage` | View token usage and cost summary for the project |
| `kahuna_initialize` | Initialize a project with Kahuna copilot configuration |
| `kahuna_list_integrations` | List all discovered integrations and their status |
| `kahuna_use_integration` | Execute operations on discovered integrations |
| `kahuna_verify_integration` | Verify integration credentials and connectivity |
| `health_check` | Verify MCP server connectivity |

## Onboarding Flow

Kahuna uses a two-step onboarding process to understand your context:

1. **Organization Context** - Captures your industry, team structure, constraints, and priorities
2. **Project Context** - Captures the problem, users, and success criteria for the specific project

Say **"set up org context"** or **"set up project context"** to complete onboarding. This enables Kahuna to provide more relevant recommendations aligned with your needs.

## Integration System

Kahuna can discover and manage external service integrations (APIs, databases, messaging systems):

1. **Discover** - Use `kahuna_learn` on files describing your services
2. **List** - Use `kahuna_list_integrations` to see available integrations
3. **Verify** - Use `kahuna_verify_integration` to test credentials/connectivity
4. **Use** - Use `kahuna_use_integration` to execute operations

Supports circuit breaker patterns, retry logic, and secure credential resolution from the vault.

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

## Documentation

- [Architecture: Repository Infrastructure](docs/architecture/01-repository-infrastructure.md)
- [Architecture: Context Management System](docs/architecture/02-context-management-system.md)
- [Product Design](docs/design/README.md)
- [MCP Server Documentation](apps/mcp/README.md)

## License

MIT
