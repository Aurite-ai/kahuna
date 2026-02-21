#!/usr/bin/env bash
set -e

# Publish @aurite-ai/kahuna MCP package to npm
# Usage: ./scripts/publish-mcp.sh [patch|minor|major]
# Default: patch

VERSION_TYPE="${1:-patch}"

echo "🔐 Checking npm login status..."
if ! npm whoami &>/dev/null; then
    echo "❌ Not logged in to npm. Run 'npm login' first."
    exit 1
fi

NPM_USER=$(npm whoami)
echo "   Logged in as: $NPM_USER"

echo ""
echo "🔨 Building and bundling MCP server..."
pnpm --filter @aurite-ai/kahuna build
pnpm --filter @aurite-ai/kahuna bundle

echo ""
echo "📦 Bumping version ($VERSION_TYPE)..."
cd apps/mcp
OLD_VERSION=$(node -p "require('./package.json').version")
npm version "$VERSION_TYPE" --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "   $OLD_VERSION → $NEW_VERSION"

echo ""
echo "🚀 Publishing to npm..."
npm publish

echo ""
echo "✅ Successfully published @aurite-ai/kahuna@$NEW_VERSION"
