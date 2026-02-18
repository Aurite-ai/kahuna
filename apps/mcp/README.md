# @kahuna/mcp

MCP server providing context management tools for coding copilots. Runs locally via stdio transport — copilots call Kahuna tools to learn from files, surface relevant context, and get answers from the knowledge base.

## Overview

```
┌─────────────────────┐     MCP (stdio)     ┌─────────────────────┐
│   Coding Copilot    │ ◄────────────────► │     @kahuna/mcp     │
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

## Quick Start

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### 3. Build

```bash
pnpm --filter @kahuna/mcp build
```

### 4. Connect a Copilot

**Using Claude MCP CLI:**

```bash
claude mcp add kahuna --transport stdio -- node /path/to/kahuna/apps/mcp/dist/index.js
```

**Manual configuration** (`.mcp.json` in your project):

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
pnpm --filter @kahuna/mcp dev

# Run tests
pnpm --filter @kahuna/mcp test

# Watch tests
pnpm --filter @kahuna/mcp test:watch

# Type-check
pnpm --filter @kahuna/mcp typecheck
```

The MCP server uses **stdio** transport — it reads/writes JSON-RPC over stdin/stdout. Use `dev` for local development; connect via an MCP client.

## Related Documentation

- [Architecture: Context Management System](../../docs/architecture/02-context-management-system.md)
- [Design: Tool Specifications](../../docs/design/tool-specifications.md)
- [Design: Knowledge Architecture](../../docs/design/knowledge-architecture.md)
