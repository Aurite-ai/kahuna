# @kahuna/mcp

MCP (Model Context Protocol) server that wraps the Kahuna tRPC API as MCP tools, allowing AI assistants like Claude to interact with Kahuna programmatically.

## Overview

This app provides a bridge between AI assistants and the Kahuna platform:

```
┌─────────────────────┐     MCP Protocol      ┌─────────────────────┐
│   Claude Desktop    │ ◄──────────────────► │     @kahuna/mcp     │
│   (or other client) │                       │                     │
└─────────────────────┘                       └──────────┬──────────┘
                                                         │
                                                   tRPC HTTP
                                                         │
                                              ┌──────────▼──────────┐
                                              │    @kahuna/api      │
                                              │   (Express + tRPC)  │
                                              └─────────────────────┘
```

## Quick Start

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Build the App

```bash
pnpm --filter @kahuna/mcp build
```

### 3. Configure Claude Desktop

Add to your Claude Desktop configuration manually (`~/Library/Application Support/Claude/claude_desktop_config.json`):

OR make claude code do it for you!

*Imp Note:* update the args path to your local `*/apps/mcp/dist/index.js` path

```json
{
  "mcpServers": {
    "kahuna": {
      "command": "node",
      "args": ["/path/to/kahuna/apps/mcp/dist/index.js"],
      "env": {
        "KAHUNA_API_URL": "http://localhost:3000",
        "KAHUNA_SESSION_TOKEN": "your-session-token-here"
      }
    }
  }
}
```

### 4. Start the Kahuna API

```bash
pnpm --filter @kahuna/api dev
```

### 5. Restart Claude Desktop

The Kahuna tools should now be available in Claude.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KAHUNA_API_URL` | Base URL of the Kahuna API | `http://localhost:3000` |
| `KAHUNA_SESSION_TOKEN` | Session token for authentication | (none - required) |

### Getting a Session Token

1. Log in to Kahuna via the web UI
2. Open browser developer tools → Application → Cookies
3. Copy the `kahuna_session` cookie value

## Available Tools

### `health_check`

Verify the MCP server is running correctly. Useful for testing your setup.

**Actions:**
- `ping` - Confirm MCP server is alive (no API needed)
- `api` - Ping the Kahuna API to verify end-to-end connectivity

**Examples:**

```json
// Just check MCP server is running
{ "action": "ping" }

// Check API connectivity (requires Kahuna API to be running)
{ "action": "api" }
```

### `manage_projects`

Manage Kahuna projects. Projects are containers for context files and VCK generations.

**Actions:**
- `create` - Create a new project
- `list` - List all your projects
- `get` - Get a specific project by ID
- `update` - Update a project
- `delete` - Delete a project

**Examples:**

```json
// Create a project
{ "action": "create", "name": "My AI Agent", "description": "Customer support bot" }

// List all projects
{ "action": "list" }

// Get a specific project
{ "action": "get", "id": "clxxx..." }

// Update a project
{ "action": "update", "id": "clxxx...", "name": "New Name" }

// Delete a project
{ "action": "delete", "id": "clxxx..." }
```

## Adding New Tools

This package serves as a template for wrapping tRPC routers as MCP tools. Here's how to add a new tool:

### Step 1: Create the Tool File

Create a new file in `src/tools/`:

```typescript
// src/tools/context.ts
import type { KahunaClient } from '../client.js';

/**
 * Tool definition following MCP schema
 */
export const contextToolDefinition = {
  name: 'manage_context_files',
  description: `Manage context files for a Kahuna project.

Available actions:
- create: Create a new context file (requires: projectId, filename, content, fileType)
- list: List all context files for a project (requires: projectId)
- get: Get a specific context file by ID (requires: id)
- update: Update a context file (requires: id, optional: filename, content)
- delete: Delete a context file (requires: id)`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'list', 'get', 'update', 'delete'],
      },
      id: { type: 'string' },
      projectId: { type: 'string' },
      filename: { type: 'string' },
      content: { type: 'string' },
      fileType: { type: 'string' },
    },
    required: ['action'],
  },
};

/**
 * Tool handler - routes actions to API client methods
 */
export async function contextToolHandler(
  args: Record<string, unknown>,
  client: KahunaClient,
) {
  const { action, id, projectId, filename, content, fileType } = args as {
    action: string;
    id?: string;
    projectId?: string;
    filename?: string;
    content?: string;
    fileType?: string;
  };

  switch (action) {
    case 'create':
      if (!projectId || !filename || !content || !fileType) {
        return errorResponse('Missing required parameters');
      }
      const created = await client.contextCreate({
        projectId,
        filename,
        content,
        fileType,
      });
      return successResponse({ message: 'File created', file: created });

    case 'list':
      if (!projectId) {
        return errorResponse('Missing required parameter: projectId');
      }
      const files = await client.contextList({ projectId });
      return successResponse({ files });

    // ... other actions

    default:
      return errorResponse(`Unknown action: ${action}`);
  }
}

// Helper functions (copy from project.ts or extract to shared utils)
function successResponse(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ success: true, data }, null, 2) }],
  };
}

function errorResponse(message: string) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: message }, null, 2) }],
    isError: true,
  };
}

export const contextTool = {
  definition: contextToolDefinition,
  handler: contextToolHandler,
};
```

### Step 2: Register in index.ts

```typescript
// In src/index.ts

import { contextTool } from './tools/context.js';

// Add to allTools array
const allTools = [
  projectTool.definition,
  contextTool.definition, // Add new tool
];

// Add to routeToolCall switch
async function routeToolCall(toolName: string, args: Record<string, unknown>, client: KahunaClient) {
  switch (toolName) {
    case 'manage_projects':
      return projectTool.handler(args, client);
    case 'manage_context_files':  // Add new case
      return contextTool.handler(args, client);
    default:
      // ...
  }
}
```

### Step 3: Update the API Client Methods

If your tool uses new tRPC routers not already in the client, add methods to `src/client.ts`:

```typescript
// In the KahunaClient class, add methods for new router procedures:
async newRouterCreate(input: { name: string }): Promise<NewEntity> {
  return this.mutate<NewEntity>('newRouter.create', input);
}

async newRouterList(): Promise<NewEntity[]> {
  return this.query<NewEntity[]>('newRouter.list');
}
```

## Best Practices

### Tool Design

1. **Use action-based tools** - Single tool with `action` parameter for CRUD operations
2. **Clear descriptions** - LLMs use descriptions to understand when to use tools
3. **Validate inputs** - Check required parameters before calling tRPC
4. **Return JSON** - Consistent JSON responses are easier for LLMs to parse
5. **Include examples** - Show example inputs in the description

### Error Handling

1. **Validate early** - Check required params before API calls
2. **Meaningful errors** - Include hints about what went wrong
3. **Set isError flag** - Helps MCP clients distinguish errors
4. **Don't expose internals** - Sanitize error messages for users

### Response Format

Use consistent response structure:

```typescript
// Success
{
  "success": true,
  "data": {
    "message": "Human-readable result",
    "entity": { /* created/updated entity */ }
  }
}

// Error
{
  "success": false,
  "error": "Human-readable error message",
  "details": { /* optional additional info */ }
}
```

## Architecture

```
apps/mcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── client.ts         # HTTP client for Kahuna API calls
│   └── tools/
│       ├── project.ts    # Project management tool (example/template)
│       ├── context.ts    # Context files tool (TODO)
│       ├── vck.ts        # VCK generation tool (TODO)
│       └── results.ts    # Build results tool (TODO)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Running in Development Mode

```bash
# From monorepo root
pnpm --filter @kahuna/mcp dev
```

### Testing Manually

The MCP server uses stdio, so you can test by piping JSON:

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js
```

### Type Checking

```bash
pnpm --filter @kahuna/mcp typecheck
```

## Roadmap

- [x] Basic MCP server structure
- [x] Health check tool (for testing setup)
- [x] Project management tool (example)
- [ ] Context files tool
- [ ] VCK generation tool
- [ ] Build results tool
- [ ] Organization rules tool (new tRPC router required)
- [ ] IT rules tool (new tRPC router required)
- [ ] Prompts management tool (new tRPC router required)

## Related Documentation

- [MCP Implementation Plan](../../docs/internal/mcp-implementation-plan.md)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Kahuna API Architecture](../../docs/architecture/02-feedback-loop-architecture.md)
