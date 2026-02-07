#!/usr/bin/env bash
# Adds the kahuna MCP server to Claude Code for this project.
# Reads ANTHROPIC_API_KEY and KAHUNA_SESSION_TOKEN from apps/mcp/.env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found" >&2
  exit 1
fi

# Source the .env file to get variables
set -a
source "$ENV_FILE"
set +a

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "Error: ANTHROPIC_API_KEY not set in $ENV_FILE" >&2
  exit 1
fi

if [ -z "${KAHUNA_SESSION_TOKEN:-}" ]; then
  echo "Error: KAHUNA_SESSION_TOKEN not set in $ENV_FILE" >&2
  exit 1
fi

claude mcp add kahuna \
  -s project \
  -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  -e KAHUNA_SESSION_TOKEN="$KAHUNA_SESSION_TOKEN" \
  -e NODE_ENV=development \
  -e KAHUNA_KNOWLEDGE_DIR="$REPO_ROOT/.kahuna-knowledge" \
  -- node "$REPO_ROOT/apps/mcp/dist/index.js"

echo "Done! Kahuna MCP server added to Claude Code."
