# Kahuna

Kahuna is a context management platform that helps coding copilots succeed with complex tasks. The primary interface is an **MCP server** that provides tools for sending context, retrieving relevant information, and verifying results. Behind the MCP tools, a **Knowledge Base** of organized markdown files (written by agents, for agents) grows and improves over time.

> **Note:** This repository is in early development. See [docs/](docs/) for architecture and design documentation.

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
pnpm --filter @kahuna/mcp build
```

### Option A: Using Claude MCP CLI (Recommended)

```bash
claude mcp add kahuna --transport stdio -- node /path/to/kahuna/apps/mcp/dist/index.js
```

> **Note:** Update the path to your local kahuna repo directory.

### Option B: Manual Configuration

Create a `.mcp.json` file in your project directory:

```json
{
  "mcpServers": {
    "kahuna": {
      "command": "node",
      "args": ["/path/to/kahuna/apps/mcp/dist/index.js"]
    }
  }
}
```

For detailed tool documentation and development instructions, see [apps/mcp/README.md](apps/mcp/README.md).

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
│   └── mcp/              # MCP server (stdio) — context management tools
├── packages/
│   ├── testing/          # QA testing infrastructure (scenarios + CLI)
│   └── vck-templates/    # VCK content (copilot configs, frameworks)
└── docs/                 # Documentation
```

## Documentation

- [Architecture: Repository Infrastructure](docs/architecture/01-repository-infrastructure.md)
- [Architecture: Context Management System](docs/architecture/02-context-management-system.md)
- [Product Design](docs/design/README.md)
- [Internal Working Docs](docs/internal/README.md)
