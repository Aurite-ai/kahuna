#!/usr/bin/env bash
# Validate that a release tag matches the version in apps/mcp/package.json.
#
# Usage: ./scripts/validate-version.sh <tag>
#
# Arguments:
#   tag   The release tag (e.g. v1.2.3)
#
# Exits 0 if the tag (minus the "v" prefix) matches the package version.
# Exits 1 with a descriptive error otherwise.

set -euo pipefail

TAG="${1:?Usage: $0 <tag>}"
PACKAGE_JSON="apps/mcp/package.json"

# Strip leading "v"
TAG_VERSION="${TAG#v}"

if [ ! -f "$PACKAGE_JSON" ]; then
  echo "Error: $PACKAGE_JSON not found." >&2
  exit 1
fi

PKG_VERSION=$(node -p "require('./${PACKAGE_JSON}').version")

if [ "$TAG_VERSION" = "$PKG_VERSION" ]; then
  echo "Version check passed: tag $TAG matches $PACKAGE_JSON ($PKG_VERSION)"
else
  echo "Version mismatch:" >&2
  echo "  Tag:         $TAG ($TAG_VERSION)" >&2
  echo "  package.json: $PKG_VERSION" >&2
  echo "" >&2
  echo "Update apps/mcp/package.json version to $TAG_VERSION before releasing." >&2
  exit 1
fi
