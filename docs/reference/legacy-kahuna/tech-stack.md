# Backend Tech Stack

## Monorepo Structure

- **Package Manager:** pnpm 9.x with workspaces
- **Build Orchestration:** Turborepo 2.5+
- **Workspaces:**
  - `apps/server` - Express backend
  - `apps/frontend` - React frontend
  - `packages/credentials` - Shared credential management
  - `packages/shared` - Shared utilities
  - `packages/eslint-config` - Shared ESLint configs
  - `packages/typescript-config` - Shared TypeScript configs
  - `packages/ui` - Shared React components

## Core Framework

- **Runtime:** Node.js 18+ with TypeScript 5.9
- **Web Framework:** Express.js 4.x
- **API Layer:** tRPC v11.5+ (type-safe RPC)
- **Validation:** Zod 4.x schemas

## Database & ORM

- **Primary Database:** PostgreSQL
- **ORM:** Prisma 6.x (client 6.16+)
- **Migrations:** Prisma migrations

## Authentication & Authorization

- **Provider:** Clerk
- **Middleware:** `@clerk/express`
- **Strategy:** JWT-based authentication with user/team context

## AI & LLM Integrations

- **AI Framework:** Vercel AI SDK 5.x (`ai` package)
- **LLM Providers:**
  - OpenAI SDK 6.x (GPT-4, etc.)
  - Anthropic SDK 0.71+ (Claude models)
  - Anthropic Claude Agent SDK 0.1+ (agent orchestration)
- **Streaming:** Server-Sent Events (SSE) for agent execution
- **Token Counting:** js-tiktoken

## Workflow Automation

- **N8N:** Self-hosted workflow automation (Community Edition)
- **Scheduling:** cron-parser for schedule parsing

## Cloud & Storage Integrations

- **AWS:** S3, DynamoDB (`@aws-sdk/client-s3`, `@aws-sdk/client-dynamodb`)
- **Azure:** Blob Storage (`@azure/storage-blob`)
- **Google Cloud:** BigQuery, Cloud Storage (`@google-cloud/bigquery`, `@google-cloud/storage`)

## Database Clients (for integrations)

- **PostgreSQL:** pg (native client)
- **MongoDB:** mongodb 7.x
- **MySQL:** mysql2
- **SQL Server:** mssql
- **Redis:** ioredis
- **Elasticsearch:** @elastic/elasticsearch 9.x

## External Service Integrations

- **Email:** SendGrid (`@sendgrid/mail`), Nodemailer
- **Notion:** @notionhq/client
- **GitHub:** @octokit/rest
- **Google APIs:** googleapis (Sheets, Drive, etc.)
- **SFTP:** ssh2-sftp-client
- **GraphQL:** graphql-request

## Development Tools

- **Build Tool:** TSX for TypeScript execution
- **Type Checking:** TypeScript 5.9
- **Testing:** Vitest with coverage (v8)
- **Linting:** ESLint 9.x

## File Processing

- **DOCX:** Mammoth
- **PDF:** pdf-parse, pdf-poppler, pdf2pic
- **Excel:** xlsx
- **YAML:** yaml

## Framework Integration

### Express.js

**Purpose:** HTTP server and middleware layer

**Key Features:**
- Health check endpoint (`/health`)
- tRPC endpoint (`/trpc`)
- AI agent streaming endpoints (SSE)
- Middleware: CORS, JSON parsing, authentication, logging

**Location:** [`apps/server/src/index.ts`](../../../apps/server/src/index.ts)

### tRPC

**Purpose:** Type-safe API endpoints with automatic TypeScript inference

**Key Features:**
- Full-stack type safety
- Automatic input validation via Zod
- React Query integration
- Request batching for performance

**Location:** [`apps/server/src/lib/trpc.ts`](../../../apps/server/src/lib/trpc.ts)

### Prisma ORM

**Purpose:** Type-safe database operations

**Key Features:**
- Schema definition in `schema.prisma`
- Automatic migration generation
- Type-safe queries
- Database introspection

**Location:** [`apps/server/prisma/schema.prisma`](../../../apps/server/prisma/schema.prisma)

### Clerk Authentication

**Purpose:** User authentication and authorization

**Integration Points:**
- Clerk Express middleware for JWT validation
- Context creation for user lookup
- Protected procedures in tRPC

**Flow:**
1. Request arrives with JWT in Authorization header
2. Clerk middleware validates token
3. User context loaded from database via clerkId
4. Request proceeds with authenticated context

## Why These Technologies?

**Express.js:**
- Mature, well-documented
- Excellent middleware ecosystem
- Easy to extend and customize

**tRPC:**
- End-to-end type safety without code generation
- Eliminates API contract drift
- Excellent developer experience
- Built-in React Query integration

**Prisma:**
- Type-safe database operations
- Excellent TypeScript integration
- Intuitive schema definition
- Automatic migrations

**Clerk:**
- Authentication in minutes
- MFA and social auth built-in
- Excellent React integration
- Handles user management complexity

**PostgreSQL:**
- ACID compliance for data integrity
- JSON/JSONB support for flexible storage
- Robust full-text search
- Excellent performance at scale

## Related Documentation

- **API Layer Architecture:** [`architecture/backend/api-layer.md`](./api-layer.md)
- **Service Layer Patterns:** [`architecture/backend/services.md`](./services.md)
- **Database Architecture:** [`architecture/backend/database.md`](./database.md)