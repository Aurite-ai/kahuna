#!/usr/bin/env bash
# Create a GitHub release.
#
# Usage: ./scripts/create-release.sh <tag> [options]
#
# Arguments:
#   tag   The release tag (e.g. v1.2.3)
#
# Options:
#   --type      draft | prerelease | release  (default: draft)
#   --branch    Target branch for the release  (default: main)
#   --title     Release title                  (default: <tag>)
#   --notes     Path to a notes file, or "-" to read from stdin (default: -)
#
# Examples:
#   ./scripts/generate-release-notes.sh v1.2.3 | ./scripts/create-release.sh v1.2.3
#   ./scripts/create-release.sh v1.2.3 --type release --notes ./CHANGELOG.md
#
# Requires: gh (GitHub CLI)

set -euo pipefail

TAG="${1:?Usage: $0 <tag> [--type draft|prerelease|release] [--branch <branch>] [--title <title>] [--notes <file|->]}"
shift

# Defaults
RELEASE_TYPE="draft"
BRANCH="main"
TITLE="$TAG"
NOTES_SOURCE="-"

# Parse options
while [[ $# -gt 0 ]]; do
  case "$1" in
    --type)
      RELEASE_TYPE="${2:?--type requires a value: draft | prerelease | release}"
      shift 2
      ;;
    --branch)
      BRANCH="${2:?--branch requires a value}"
      shift 2
      ;;
    --title)
      TITLE="${2:?--title requires a value}"
      shift 2
      ;;
    --notes)
      NOTES_SOURCE="${2:?--notes requires a file path or -}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# Validate release type
case "$RELEASE_TYPE" in
  draft|prerelease|release) ;;
  *)
    echo "Invalid --type '$RELEASE_TYPE'. Must be: draft, prerelease, or release." >&2
    exit 1
    ;;
esac

echo "Creating ${RELEASE_TYPE} release: $TITLE ($TAG) → $BRANCH"

# Read release notes
if [ "$NOTES_SOURCE" = "-" ]; then
  NOTES=$(cat)
else
  NOTES=$(cat "$NOTES_SOURCE")
fi

# Build gh release create flags based on type
GH_FLAGS=(
  --title "$TITLE"
  --notes "$NOTES"
  --target "$BRANCH"
)

case "$RELEASE_TYPE" in
  draft)
    GH_FLAGS+=(--draft)
    ;;
  prerelease)
    GH_FLAGS+=(--prerelease)
    ;;
  release)
    # published release — no extra flags needed
    ;;
esac

gh release create "$TAG" "${GH_FLAGS[@]}"

echo "Done. ${RELEASE_TYPE^} release '$TITLE' created for tag $TAG."
