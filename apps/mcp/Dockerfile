# Kahuna MCP Server Docker Image
#
# Multi-stage build for minimal runtime image.
# Uses the pre-bundled CJS file for smallest footprint.
#
# Build: docker build -t kahuna/mcp .
# Run:   docker run -i -e ANTHROPIC_API_KEY kahuna/mcp

# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /build

# Copy monorepo package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mcp/package.json apps/mcp/
COPY packages/vck-templates/package.json packages/vck-templates/

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.base.json ./
COPY apps/mcp/ apps/mcp/
COPY packages/vck-templates/ packages/vck-templates/

# Build vck-templates first, then bundle the MCP server
RUN pnpm --filter @kahuna/vck-templates build
RUN pnpm --filter @kahuna/mcp bundle

# =============================================================================
# Stage 2: Runtime
# =============================================================================
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy only the bundled file
COPY --from=builder /build/apps/mcp/dist/kahuna-mcp.cjs ./kahuna-mcp.cjs

# Create non-root user for security
RUN addgroup -g 1001 -S kahuna && \
    adduser -u 1001 -S kahuna -G kahuna && \
    chown -R kahuna:kahuna /app

# Create .kahuna directory for knowledge base (can be mounted as volume)
RUN mkdir -p /home/kahuna/.kahuna/knowledge && \
    chown -R kahuna:kahuna /home/kahuna

USER kahuna

# Environment
ENV NODE_ENV=production
ENV KAHUNA_KNOWLEDGE_DIR=/home/kahuna/.kahuna/knowledge

# Labels
LABEL org.opencontainers.image.title="Kahuna MCP Server"
LABEL org.opencontainers.image.description="Context management tools for coding copilots"
LABEL org.opencontainers.image.source="https://github.com/kahuna-ai/kahuna"
LABEL org.opencontainers.image.licenses="MIT"

# MCP uses stdio transport - the container reads/writes JSON-RPC over stdin/stdout
# Run with: docker run -i kahuna/mcp
ENTRYPOINT ["node", "kahuna-mcp.cjs"]
