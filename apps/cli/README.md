# Kahuna CLI

Professional command-line interface for VCK generation and infrastructure management.

## Phase 1: GitHub Integration Implementation

This initial release focuses on GitHub integration management as proof of concept. The same pattern will be replicated for other integrations and data sources.

## Features

- ✅ **Integration Management**: Add, list, test, and delete workflow integrations
- ✅ **GitHub Integration**: Connect and validate GitHub API access
- ✅ **Beautiful CLI UX**: Modern interface with spinners, tables, and colors
- ✅ **Secure Credentials**: Encrypted storage of sensitive data
- ✅ **Connection Testing**: Validate credentials before saving

## Prerequisites

- Node.js 18+
- pnpm 9+

## Installation

```bash
# Install dependencies
cd apps/cli
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev --name init

# Set up environment
cp .env.example .env
# Edit .env and set ENCRYPTION_KEY (any 32+ character string)
```

## Development

```bash
# For CODE DEVELOPMENT (hot reload when editing files)
pnpm dev

# For USING THE CLI (no watch mode, no flickering)
pnpm dev:run

# Build for production
pnpm build

# Run built version (recommended for actual use)
pnpm start
```

**⚠️ Important**: Use `pnpm dev:run` or `pnpm start` when actually using the CLI. The `pnpm dev` command is for development only and will cause terminal flickering with interactive prompts.

## Usage

### GitHub Integration Commands

#### Add a GitHub Integration

```bash
# Using non-watch mode (recommended)
pnpm dev:run integration add

# Or with built version
pnpm start integration add

# Or specify type explicitly
pnpm dev:run integration add --type github
```

You'll be prompted for:
- **Integration name**: Friendly name (e.g., "GitHub Personal", "Company GitHub")
- **Description**: Optional description
- **GitHub API URL**: Default is https://api.github.com (use custom for GitHub Enterprise)
- **Personal Access Token**: Your GitHub PAT

The integration will be tested before saving!

#### List All Integrations

```bash
kahuna integration list
```

Output:
```
┌─────────────────────────┬────────────┬──────────┬──────────────┐
│ Name                    │ Type       │ Status   │ Last Tested  │
├─────────────────────────┼────────────┼──────────┼──────────────┤
│ GitHub Personal         │ GITHUB     │ ✓        │ 2 hours ago  │
└─────────────────────────┴────────────┴──────────┴──────────────┘
```

#### Show Integration Details

```bash
kahuna integration show "GitHub Personal"
```

#### Test Integration Connection

```bash
kahuna integration test "GitHub Personal"
```

Output includes:
- Connection status
- Response time
- User information (username, name, type)

#### Delete an Integration

```bash
kahuna integration delete "GitHub Personal"
```

You'll be asked to confirm before deletion.

## Architecture

```
apps/cli/
├── src/
│   ├── commands/
│   │   └── integration.ts    # Integration commands (add, list, test, delete)
│   ├── services/
│   │   ├── integration.service.ts   # Integration CRUD operations
│   │   └── connectors/
│   │       ├── base.connector.ts    # Connector interface
│   │       ├── github.connector.ts  # GitHub implementation
│   │       └── index.ts             # Connector registry
│   ├── ui/
│   │   ├── messages.ts       # Success, error, info messages
│   │   └── tables.ts         # Table formatting
│   ├── lib/
│   │   ├── db.ts             # Prisma client
│   │   ├── encryption.ts     # Credential encryption
│   │   └── config.ts         # CLI configuration
│   └── index.ts              # CLI entry point
├── prisma/
│   └── schema.prisma         # Database schema
└── package.json
```

## Database

The CLI uses SQLite for local storage:
- **Location**: `apps/cli/dev.db` (created automatically)
- **Schema**: User, Session, Project, WorkflowIntegration, WorkflowDataSource
- **Encryption**: Credentials are encrypted using AES-256-GCM

## Security

- Credentials are encrypted before storage
- Encryption key is stored in `.env` (never commit!)
- Personal Access Tokens are never logged or displayed
- Connection tests use real API calls with provided credentials

## Adding More Connectors

To add support for other integrations (Slack, Notion, etc.):

1. **Create connector** in `src/services/connectors/`:
   ```typescript
   export class SlackConnector implements BaseConnector {
     async testConnection(config, credentials) {
       // Implement Slack API test
     }
   }
   ```

2. **Register connector** in `src/services/connectors/index.ts`:
   ```typescript
   const connectors: Record<string, BaseConnector> = {
     GITHUB: new GitHubConnector(),
     SLACK: new SlackConnector(),  // Add here
   };
   ```

3. **Update integration command** prompts in `src/commands/integration.ts` for integration-specific configuration.

That's it! The rest of the infrastructure (storage, encryption, UI) is reusable.

## Next Steps

- [ ] Add more integrations (Slack, Notion, Jira, Zendesk)
- [ ] Add data sources (PostgreSQL, MySQL, MongoDB, etc.)
- [ ] Add project commands (VCK generation workflow)
- [ ] Add configuration commands
- [ ] Package for npm distribution

## Testing

### Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### Test Coverage

The GitHub connector has comprehensive test coverage including:

✅ **Success Cases**:
- Valid token authentication
- User information retrieval
- GitHub Enterprise support (custom base URL)
- Response time measurement

✅ **Error Cases**:
- Missing token validation
- Invalid token handling (401 errors)
- Network error handling
- API error responses

✅ **Configuration**:
- Correct HTTP headers
- Bearer token authentication
- User-Agent and Accept headers
- Request method validation

### Manual Testing Workflow

```bash
# Example workflow
kahuna integration add                                    # Add GitHub integration
kahuna integration list                                   # See your integrations
kahuna integration show "GitHub Personal"                 # View details
kahuna integration test "GitHub Personal"                 # Test connection
kahuna integration delete "GitHub Personal"               # Clean up
```

### Writing Tests for New Connectors

When adding a new connector, follow this pattern:

```typescript
// src/services/connectors/__tests__/slack.connector.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SlackConnector } from '../slack.connector.js';

describe('SlackConnector', () => {
  let connector: SlackConnector;

  beforeEach(() => {
    connector = new SlackConnector();
    vi.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should successfully connect with valid token', async () => {
      // Mock API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, team: 'Test Team' }),
      });

      const result = await connector.testConnection(
        {},
        { token: 'xoxb-test' }
      );

      expect(result.success).toBe(true);
    });

    // Add more test cases...
  });
});
```

## Troubleshooting

### "Cannot find module '@prisma/client'"

Run: `pnpm prisma generate`

### "ENCRYPTION_KEY environment variable is not set"

1. Copy `.env.example` to `.env`
2. Set `ENCRYPTION_KEY` to any 32+ character string

### Connection test fails

- Verify your Personal Access Token is valid
- Check that the token has required permissions
- For GitHub Enterprise, verify the API URL is correct

## Contributing

This is Phase 1 (GitHub tool only). Once approved by the team, we'll replicate this pattern for:
- More tools (Slack, Notion, Jira, Teams, etc.)
- Data sources (PostgreSQL, MySQL, MongoDB, APIs, etc.)
- Full VCK workflow integration

## License

Private - Aurite AI
