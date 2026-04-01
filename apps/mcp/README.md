# @aurite-ai/kahuna

**Kahuna is your AI copilot's memory.**

Without Kahuna, your AI copilot starts fresh every conversation. With Kahuna, it remembers what it's learned, finds relevant context for each task, and works more effectively across your projects.

---

## Quick Start

**Step 1: Add Kahuna to Claude Code**

```bash
claude mcp add kahuna -s user -e ANTHROPIC_API_KEY="your-key" -- npx @aurite-ai/kahuna
```

**Step 2: Set up Kahuna**

Restart Claude Code, then say:

> **"Set up Kahuna"**

Kahuna will ask a few questions to understand your context. This only happens once.

---

## How It Works

Once set up, just talk naturally:

- **"Learn our API guidelines"** — Share files or folders. Kahuna classifies and remembers them across sessions.

- **"Build a customer support agent"** — When you start a task, Kahuna finds relevant knowledge automatically.

- **"What's our error handling pattern?"** — Ask questions mid-task. Kahuna searches your knowledge base and answers with citations.

Use `/mcp` in Claude Code to verify the server is connected.

---

## Tool Reference

| Tool                          | What It Does                           | Example                         |
| ----------------------------- | -------------------------------------- | ------------------------------- |
| `kahuna_initialize`           | Deploys copilot rules, runs onboarding | "Set up Kahuna"                 |
| `kahuna_learn`                | Adds files to knowledge base           | "Learn the docs/ folder"        |
| `kahuna_prepare_context`      | Surfaces relevant knowledge for a task | "Build a search feature"        |
| `kahuna_ask`                  | Quick Q&A against the knowledge base   | "What's our API format?"        |
| `kahuna_delete`               | Removes files from knowledge base      | "Remove the outdated API doc"   |
| `kahuna_usage`                | Shows token usage and costs            | "Show my Kahuna usage"          |
| `kahuna_discover_integration` | Detects services in your files         | (auto-detected during learn)    |
| `kahuna_use_integration`      | Calls discovered integrations          | "Query the PostgreSQL database" |

<details>
<summary>🔌 Integration Workflow</summary>

When you `learn` files containing API keys or service configs, Kahuna automatically:

1. Detects integrations (databases, APIs, etc.)
2. Stores credentials securely in vault
3. Makes integrations available for your agent to use

Example: After learning a file with PostgreSQL connection strings, you can say:

> "Query the users table"

</details>

**Additional tools:** `kahuna_provide_context`, `kahuna_verify_integration`, `kahuna_list_integrations`. See [Advanced Documentation](https://github.com/Aurite-ai/kahuna/blob/main/apps/mcp/docs/ADVANCED.md) for details.

---

## Other Installation Methods

### npm (Global Install)

```bash
npm install -g @aurite-ai/kahuna
```

Configure your MCP client to use `kahuna-mcp` as the command.

### npx (No Install)

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

---

## Configuration

### API Key

Kahuna requires an `ANTHROPIC_API_KEY` for AI-powered tools. Set it in your MCP config:

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

**Config file locations:**

- Claude Code (project): `.mcp.json`
- Claude Code (global): `~/.claude/settings.json`

### Environment Variables

```bash
# Required for AI-powered tools
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Custom knowledge base location
KAHUNA_KNOWLEDGE_DIR=/path/to/custom/knowledge
```

---

## Troubleshooting

### "Missing ANTHROPIC_API_KEY" Error

1. Check your MCP config has the `env` block with `ANTHROPIC_API_KEY`
2. Verify the key starts with `sk-ant-`
3. Restart Claude Code after config changes

### Tools Not Appearing

1. Check `/mcp` in Claude Code to verify connection
2. Try `npx @aurite-ai/kahuna --version` to confirm package access
3. Check config JSON syntax

### "Organization Context Required"

Run onboarding: say **"Set up Kahuna"** to your copilot.

---

## Development

```bash
pnpm --filter @aurite-ai/kahuna dev          # Watch mode
pnpm --filter @aurite-ai/kahuna test         # Run tests
pnpm --filter @aurite-ai/kahuna typecheck    # Type-check
pnpm --filter @aurite-ai/kahuna bundle       # Production bundle
```

---

## License

MIT
