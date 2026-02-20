# @aurite-ai/kahuna

MCP server providing context management tools for coding copilots. Runs locally via stdio transport — copilots call Kahuna tools to learn from files, surface relevant context, and get answers from the knowledge base.

## Quick Start (Claude Code)

**Two commands to get started:**

```bash
# Step 1: Add Kahuna to your MCP config
claude mcp add kahuna -s user -- npx @aurite-ai/kahuna

# Step 2: Set your API key (add to ~/.zshrc or ~/.bashrc for persistence)
export ANTHROPIC_API_KEY="sk-ant-..."
```

That's it! Restart Claude Code and Kahuna tools will be available. Use `/mcp` in Claude Code to verify the server is connected.

**Verify the package is accessible:**

```bash
npx @aurite-ai/kahuna --version
npx @aurite-ai/kahuna --help
```

> **Note:** See [Other Installation Methods](#other-installation-methods) below for npm global install, Docker, or building from source.

## Other Installation Methods

### npm (Global Install)

```bash
npm install -g @aurite-ai/kahuna
```

Then configure your MCP client to use `kahuna-mcp` as the command.

### npx (No Install)

Use directly without installing (this is what the Quick Start uses):

```bash
npx @aurite-ai/kahuna
```

### Docker

```bash
docker pull kahuna/mcp
docker run -i kahuna/mcp
```

### From Source

```bash
git clone https://github.com/Aurite-ai/kahuna.git
cd kahuna
pnpm install
pnpm --filter @aurite-ai/kahuna build
pnpm --filter @aurite-ai/kahuna bundle
```

## Configuration

### API Key Setup

Kahuna requires an `ANTHROPIC_API_KEY` for LLM-powered tools (`learn`, `ask`, `prepare-context`). Choose the setup method that matches your installation:

#### For npx Users (Recommended: MCP Config)

Since npx doesn't have a persistent installation directory, you cannot use a `.env` file. Instead, configure the API key in your MCP config:

**Option A: Add to MCP config file (recommended)**

Edit your `.mcp.json` (project) or `~/.claude/settings.json` (global) to include the `env` block:

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

**Option B: Shell environment variable**

Export the key in your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

The MCP client will inherit this when spawning the npx process.

#### For Global Install Users

If you installed globally via `npm install -g`, you have additional options:

```bash
# Option 1: Shell environment variable (same as above)
export ANTHROPIC_API_KEY="sk-ant-..."

# Option 2: Create a .env file in your home directory
echo "ANTHROPIC_API_KEY=sk-ant-..." >> ~/.kahuna/.env
```

#### Other Environment Variables

```bash
# Optional: Custom knowledge base location (default: ~/.kahuna/knowledge/)
KAHUNA_KNOWLEDGE_DIR=/path/to/custom/knowledge
```

### Connecting to MCP Clients

#### Claude Code (Recommended)

**Two-step setup:**

```bash
# Step 1: Add Kahuna to your MCP config
claude mcp add kahuna -s user -- npx @aurite-ai/kahuna

# Step 2: Set your API key (add to ~/.zshrc or ~/.bashrc for persistence)
export ANTHROPIC_API_KEY="sk-ant-..."
```

That's it! The MCP client will inherit the environment variable when spawning the server.

**Verify it's working:**

```bash
# Check MCP config
claude mcp list

# Or use /mcp in Claude Code to see connected servers
```

> **Alternative:** If you prefer not to set a global environment variable, you can manually edit the generated config file (`.mcp.json` or `~/.claude/settings.json`) to add an `env` block. See [API Key Setup](#api-key-setup) for details.

#### Manual JSON Configuration

For other MCP clients, edit your MCP config file directly. Examples for each installation method:

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

**Using global install:**

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

## Troubleshooting

### "Missing ANTHROPIC_API_KEY" Error

If tools fail with an API key error:

1. **Check your MCP config** — Ensure the `env` block is present with `ANTHROPIC_API_KEY`
2. **Verify the key format** — Should start with `sk-ant-`
3. **Restart your MCP client** — Config changes require a restart (in Claude Code, use `/mcp` then restart)
4. **Check for typos** — The key name must be exactly `ANTHROPIC_API_KEY`

### Tools Not Appearing

If `kahuna_*` tools don't show up:

1. **Verify the server is running** — Check `/mcp` in Claude Code
2. **Check config syntax** — Invalid JSON will silently fail
3. **Try `npx @aurite-ai/kahuna --version`** — Confirms the package is accessible

### Config File Locations

| Client | Project Config | User/Global Config |
|--------|----------------|-------------------|
| Claude Code | `.mcp.json` (project root) | `~/.claude/settings.json` |
| Roo Code | `.mcp.json` (project root) | `~/.config/roo/settings.json` |

## License

MIT
