# @aurite-ai/kahuna

MCP server providing context management tools for coding copilots. Runs locally via stdio transport — copilots call Kahuna tools to learn from files, surface relevant context, and get answers from the knowledge base.

## Quick Start

```bash
# Check version
npx @aurite-ai/kahuna --version

# View help
npx @aurite-ai/kahuna --help
```

## Installation

### Option 1: npm (Recommended)

```bash
npm install -g @aurite-ai/kahuna
```

Then configure your MCP client to use `kahuna-mcp` as the command.

### Option 2: npx (No Install)

Use directly without installing:

```bash
npx @aurite-ai/kahuna
```

### Option 3: Docker

```bash
docker pull kahuna/mcp
docker run -i kahuna/mcp
```

### Option 4: From Source

```bash
git clone https://github.com/Aurite-ai/kahuna.git
cd kahuna
pnpm install
pnpm --filter @aurite-ai/kahuna build
pnpm --filter @aurite-ai/kahuna bundle
```

## Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Required for LLM-powered tools (learn, ask, prepare-context)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Custom knowledge base location (default: ~/.kahuna/knowledge/)
KAHUNA_KNOWLEDGE_DIR=/path/to/custom/knowledge
```

### Connecting to MCP Clients

**Claude Code / Roo Code:**

```json
{
  "mcpServers": {
    "kahuna": {
      "command": "kahuna-mcp",
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

**Using npx:**

```json
{
  "mcpServers": {
    "kahuna": {
      "command": "npx",
      "args": ["@aurite-ai/kahuna"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

**Using Docker:**

```json
{
  "mcpServers": {
    "kahuna": {
      "command": "docker",
      "args": ["run", "-i", "-e", "ANTHROPIC_API_KEY", "kahuna/mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

## CLI Usage

```bash
kahuna-mcp              # Start the MCP server (stdio transport)
kahuna-mcp --help       # Show help and available tools
kahuna-mcp --version    # Show version information
```

The server communicates via JSON-RPC over stdin/stdout. It's designed to be invoked by MCP-compatible clients, not run directly from the terminal (except for `--help`/`--version`).

## Overview

```
┌─────────────────────┐     MCP (stdio)     ┌─────────────────────┐
│   Coding Copilot    │ ◄────────────────► │   @aurite-ai/kahuna │
│   (Claude, Roo,     │                     │                     │
│    Cursor, etc.)    │                     │  knowledge/ module  │
└─────────────────────┘                     │  ├── agents/        │
                                            │  ├── storage/       │
                                            │  └── surfacing/     │
                                            └─────────────────────┘
                                                      │
                                                reads/writes
                                                      │
                                            ┌─────────▼──────────┐
                                            │  ~/.kahuna/         │
                                            │  knowledge/         │
                                            │  (flat .mdc files)  │
                                            └────────────────────┘
```

## Available Tools

### `kahuna_learn`

Send files or folders to Kahuna to learn from and add to the knowledge base.

- **Input:** `paths: string[]`, `description?: string`
- **Process:** Reads files → LLM categorization agent classifies each → stores as `.mdc` files in `~/.kahuna/knowledge/`
- **Response:** Markdown summary with file table, key topics, and `<hints>`

### `kahuna_prepare_context`

Prepare the `.context-guide.md` file with task-relevant knowledge.

- **Input:** `task: string`, `files?: string[]`
- **Process:** LLM retrieval agent searches KB → selects relevant files → writes references to these files in `.context-guide.md`
- **Response:** Markdown with surfaced files table, "Start Here" section, and `<hints>`

### `kahuna_ask`

Quick Q&A using the knowledge base.

- **Input:** `question: string`
- **Process:** LLM Q&A agent searches KB → reads relevant files → synthesizes answer with source citations
- **Response:** Markdown answer with sources and `<hints>`

### `kahuna_initialize`

Initialize a project with Kahuna copilot configuration (VCK templates).

- **Input:** `targetPath: string`, `overwrite?: boolean`
- **Creates:** `.claude/` config directory, `CLAUDE.md`, copilot rules and skills

### `kahuna_health_check`

Verify the MCP server is running.

- **Input:** `action: "ping"`
- **Response:** Server status confirmation

## Architecture

```
apps/mcp/src/
├── index.ts                # MCP server entry point, tool registration
├── config.ts               # Model identifiers, server constants
├── knowledge/              # Knowledge base domain logic
│   ├── agents/             # Agent prompts, tools, shared runner
│   │   ├── prompts.ts      # System prompts (categorization, retrieval, Q&A)
│   │   ├── knowledge-tools.ts  # Agent tools (list, read, select, categorize)
│   │   └── run-agent.ts    # Shared agentic loop runner
│   ├── storage/            # KB storage service
│   │   ├── types.ts        # KnowledgeEntry, classification types
│   │   ├── knowledge-storage.ts  # CRUD for .mdc files
│   │   └── utils.ts        # Slug generation, frontmatter parsing
│   └── surfacing/          # Context surfacing
│       └── context-writer.ts  # Write .context-guide.md
└── tools/                  # MCP tool handlers (thin wrappers)
    ├── types.ts            # ToolContext, MCPToolResponse, markdownResponse()
    ├── learn.ts            # kahuna_learn handler
    ├── prepare-context.ts  # kahuna_prepare_context handler
    ├── ask.ts              # kahuna_ask handler
    ├── initialize.ts       # kahuna_initialize handler
    └── health-check.ts     # kahuna_health_check handler
```

**Design principle:** Tool handlers are thin wrappers that validate input, call into `knowledge/`, and format markdown responses. Domain logic lives in the `knowledge/` module.

## Development

```bash
# Run in watch mode
pnpm --filter @aurite-ai/kahuna dev

# Run tests
pnpm --filter @aurite-ai/kahuna test

# Watch tests
pnpm --filter @aurite-ai/kahuna test:watch

# Type-check
pnpm --filter @aurite-ai/kahuna typecheck

# Create production bundle
pnpm --filter @aurite-ai/kahuna bundle
```

The MCP server uses **stdio** transport — it reads/writes JSON-RPC over stdin/stdout. Use `dev` for local development; connect via an MCP client.

## License

MIT
