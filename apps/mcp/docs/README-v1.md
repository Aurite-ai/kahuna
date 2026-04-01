# @aurite-ai/kahuna

**Kahuna is your AI copilot's memory.** It helps coding copilots like Claude Code remember what they've learned, find relevant context for each task, and work more effectively on your projects.

## What Kahuna Does

Without Kahuna, your AI copilot starts fresh every conversation. With Kahuna:

- **Provides structured rules** — Deploys copilot configuration that guides AI agent development
- **Learns from your codebase** — Feed it files, docs, and examples. Kahuna remembers across sessions.
- **Surfaces relevant context** — When you start a task, Kahuna finds what's helpful.
- **Tracks context across projects** — Your organization's patterns and preferences persist.

## Quick Start (Claude Code)

### Step 1: Add Kahuna

```bash
claude mcp add kahuna -s user -e ANTHROPIC_API_KEY="your-anthropic-api-key" -- npx @aurite-ai/kahuna
```

> **Scope options:**
> - `-s project` — Config stored for current project
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

**Key tools:**

| Tool | What It Does |
|------|--------------|
| `kahuna_initialize` | Deploys copilot rules, runs onboarding |
| `kahuna_learn` | Adds files to knowledge base with classification |
| `kahuna_prepare_context` | Surfaces relevant knowledge for a task |
| `kahuna_ask` | Quick Q&A against the knowledge base |

---

## Other Installation Methods

**Alternative: Two-step setup (if you prefer environment variables)**

```bash
# Step 1: Add Kahuna to your global MCP config
claude mcp add kahuna -s user -- npx @aurite-ai/kahuna

# Step 2: Set your API key (add to ~/.zshrc or ~/.bashrc for persistence)
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Verify the package is accessible:**

```bash
npm view @aurite-ai/kahuna version    # Check published version
npx @aurite-ai/kahuna --version       # Run directly (downloads if needed)
```

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

**One command:**

```bash
claude mcp add kahuna -s user -e ANTHROPIC_API_KEY=<your-anthropic-api-key> -- npx @aurite-ai/kahuna
```

**Or two-step setup (global scope):**

```bash
# Step 1: Add Kahuna to your global MCP config
claude mcp add kahuna -s user -- npx @aurite-ai/kahuna

# Step 2: Set your API key (add to ~/.zshrc or ~/.bashrc for persistence)
export ANTHROPIC_API_KEY="sk-ant-..."
```

> **Scope options:**
> - `-s project` — Config stored in `.mcp.json` in the current project
> - `-s user` — Config stored in `~/.claude/settings.json` (available across all projects)

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
└─────────────────────┘                     │  integrations/      │
                                            │  vault/             │
                                            │  usage/             │
                                            └─────────────────────┘
                                                      │
                                                reads/writes
                                                      │
                                            ┌─────────▼──────────┐
                                            │  ~/.kahuna/         │
                                            │  ├── knowledge/     │
                                            │  ├── integrations/  │
                                            │  └── usage.json     │
                                            └────────────────────┘
```

## Available Tools

### Knowledge Base Tools

#### `kahuna_learn`

Send files or folders to Kahuna to learn from and add to the knowledge base.

- **Input:** `paths: string[]`, `description?: string`
- **Process:** Reads files → LLM categorization agent classifies each → stores as `.mdc` files in `~/.kahuna/knowledge/`
- **Response:** Markdown summary with file table, key topics, and `<hints>`
- **Contradiction Detection:** If new content contradicts existing KB files, learn will report the conflicts and suggest using `kahuna_delete` to remove outdated files

#### `kahuna_prepare_context`

Prepare the `.kahuna/context-guide.md` file with task-relevant knowledge.

- **Input:** `task: string`, `files?: string[]`
- **Process:** LLM retrieval agent searches KB → selects relevant files → writes references to these files in `.kahuna/context-guide.md`
- **Response:** Markdown with surfaced files table, "Start Here" section, and `<hints>`
- **Requires:** Organization and project context must be set up first (see [Onboarding](#onboarding-system))

#### `kahuna_ask`

Quick Q&A using the knowledge base.

- **Input:** `question: string`
- **Process:** LLM Q&A agent searches KB → reads relevant files → synthesizes answer with source citations
- **Response:** Markdown answer with sources and `<hints>`

#### `kahuna_delete`

Remove files from the knowledge base.

- **Input:** `slugs: string[]` — Array of file slugs to delete
- **Process:** Deletes specified files from `~/.kahuna/knowledge/`
- **Response:** Markdown summary of deleted files
- **Usage:** Should be called after `kahuna_learn` reports contradictions, with user confirmation

```
# Example: Delete outdated files after user confirms
kahuna_delete(slugs=["old-api-guidelines", "deprecated-security-policy"])
```

#### `kahuna_provide_context`

Store org or user context in the knowledge base.

- **Input:**
  - `type: 'org' | 'user'` — Type of context to store
  - `content: string` — Markdown content to store
- **Process:** Writes context file to `~/.kahuna/knowledge/` as `org-context.mdc` or `user-context.mdc`
- **Response:** Confirmation with file path
- **Usage:** Used during onboarding to capture synthesized context from conversation

```
# Example: Store organization context
kahuna_provide_context(
  type="org",
  content="# Organization Context\n\nHealthcare startup building patient portals.\n\n## Constraints\n- HIPAA compliance required"
)

# Example: Store user context
kahuna_provide_context(
  type="user",
  content="# User Context\n\nSenior developer, prefers TDD approach."
)
```

### Usage Tracking

#### `kahuna_usage`

View token usage and cost summary for the current project.

- **Input:** None
- **Process:** Reads from `.kahuna/usage.json`
- **Response:** Markdown table showing:
  - Total tokens (input/output)
  - Estimated cost in USD
  - Breakdown by tool
  - Number of LLM calls

```
# Example output
📊 Project Usage Summary

## Totals
| Metric | Value |
|--------|-------|
| **Total Tokens** | 45.2K |
| Input Tokens | 38.1K |
| Output Tokens | 7.1K |
| **Estimated Cost** | $0.23 |
| Total Calls | 12 |
```

### Integration Tools

Kahuna can discover, verify, and use external service integrations (APIs, databases, messaging systems, etc.).

#### `kahuna_list_integrations`

List all discovered integrations and their status.

- **Input:** `type?: string`, `status?: string`, `format?: 'summary' | 'detailed'`
- **Process:** Scans discovered integrations from knowledge base
- **Response:** Table of integrations with name, type, operations, auth method, and status

```
# Example: List all integrations
kahuna_list_integrations()

# Example: Filter by type
kahuna_list_integrations(type="database")
```

#### `kahuna_use_integration`

Execute an operation on a discovered integration.

- **Input:**
  - `integration: string` — Integration ID (e.g., "postgresql", "slack")
  - `operation: string` — Operation name (e.g., "query", "send-message")
  - `params?: object` — Operation-specific parameters
  - `timeout?: number` — Timeout in milliseconds (default: 30000)
  - `skipRetry?: boolean` — Skip retry logic (default: false)
- **Features:**
  - Automatic credential resolution from vault
  - Retry logic with exponential backoff
  - Circuit breaker to prevent cascading failures

```
# Example: Query a database
kahuna_use_integration(
  integration="postgresql",
  operation="query",
  params={sql: "SELECT * FROM users LIMIT 10"}
)

# Example: Send a Slack message
kahuna_use_integration(
  integration="slack",
  operation="send-message",
  params={channel: "#general", text: "Hello from Kahuna!"}
)
```

#### `kahuna_verify_integration`

Verify that an integration is correctly configured and can connect.

- **Input:** `integration?: string`, `skipConnectionTest?: boolean`
- **Process:** Checks credentials exist → attempts test operation
- **Response:** Verification status with details on credentials and connection

```
# Example: Verify single integration
kahuna_verify_integration(integration="postgresql")

# Example: Verify all integrations
kahuna_verify_integration()
```

### Setup & Utility Tools

#### `kahuna_initialize`

Initialize a project with Kahuna copilot configuration (VCK templates).

- **Input:** `targetPath: string`, `overwrite?: boolean`
- **Creates:** `.claude/` config directory, `CLAUDE.md`, copilot rules and skills

#### `health_check`

Verify the MCP server is running.

- **Input:** `action: "ping"`
- **Response:** Server status confirmation

## Onboarding System

Kahuna uses a guided onboarding process to understand your organization and project context. This enables more relevant context surfacing.

### Organization Context

Set up once per organization. Captures:
- Industry and domain
- Team structure
- Technical constraints
- Priorities and standards

**To set up:** Say **"set up org context"** to your copilot

### Project Context

Set up per project directory. Captures:
- Problem being solved
- Target users
- Success criteria

**To set up:** Say **"set up project context"** to your copilot

### How It Works

1. `kahuna_prepare_context` checks for org/project context
2. If missing, returns a prompt guiding you to complete onboarding
3. Once both contexts exist, full functionality is enabled

The project context is tied to the current directory using a hash, allowing multiple projects with different contexts.

## Vault & Credential Management

Kahuna includes a secure vault system for managing integration credentials.

### Supported Providers

| Provider | Description | Status |
|----------|-------------|--------|
| `env` | Environment variables | ✅ Default |
| `1password` | 1Password vault | ✅ Supported |
| `hashicorp` | HashiCorp Vault | 🔜 Planned |
| `aws` | AWS Secrets Manager | 🔜 Planned |
| `gcp` | GCP Secret Manager | 🔜 Planned |

### Secret Reference Format

Secrets are referenced using the `vault://` URI format:

```
vault://[provider]/[path]

# Examples
vault://env/GMAIL_API_KEY
vault://1password/kahuna/gmail-oauth
vault://hashicorp/secret/integrations/gmail
```

### Configuration

The vault defaults to using environment variables. For other providers:

```json
{
  "vault": {
    "defaultProvider": "1password",
    "providerConfig": {
      "1password": {
        "vaultName": "kahuna",
        "autoCreateItems": true
      }
    }
  }
}
```

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

### "Organization Context Required" or "Project Context Required"

This means onboarding is incomplete:

1. **Say "set up org context"** to create organization context (one-time)
2. **Say "set up project context"** to create project context (per project)

### Integration Verification Fails

If `kahuna_verify_integration` reports errors:

1. **Check credentials** — Ensure environment variables are set
2. **Check connectivity** — Verify the service is accessible
3. **Check permissions** — Ensure the credentials have required permissions

### Config File Locations

| Client | Project Config | User/Global Config |
|--------|----------------|-------------------|
| Claude Code | `.mcp.json` (project root) | `~/.claude/settings.json` |
| Roo Code | `.mcp.json` (project root) | `~/.config/roo/settings.json` |

## License

MIT
