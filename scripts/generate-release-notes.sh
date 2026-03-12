#!/usr/bin/env bash
# Generate release notes from merged PRs since the last release tag.
#
# Usage: ./scripts/generate-release-notes.sh <tag> [options]
#
# Arguments:
#   tag   The current release tag (e.g. v1.2.3)
#
# Options:
#   --branch    Branch PRs were merged into (default: main)
#   --out       Write output to a file instead of stdout
#
# Examples:
#   ./scripts/generate-release-notes.sh v1.2.3
#   ./scripts/generate-release-notes.sh v1.2.3 --branch develop --out notes.md
#
# Requires: gh (GitHub CLI), git, jq

set -euo pipefail

TAG="${1:?Usage: $0 <tag> [--branch <branch>] [--out <file>]}"
shift

BASE_BRANCH="main"
OUT_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BASE_BRANCH="${2:?--branch requires a value}"
      shift 2
      ;;
    --out)
      OUT_FILE="${2:?--out requires a file path}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# Find the previous release tag
PREVIOUS_TAG=$(git tag --sort=-version:refname \
  | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
  | grep -v "^${TAG}$" \
  | head -n 1 || true)

>&2 echo "Current tag:  $TAG"
>&2 echo "Previous tag: ${PREVIOUS_TAG:-none}"
>&2 echo "Base branch:  $BASE_BRANCH"

# Fetch merged PRs since previous release
if [ -n "$PREVIOUS_TAG" ]; then
  SINCE_DATE=$(git log -1 --format=%aI "$PREVIOUS_TAG")
  >&2 echo "Fetching PRs merged after: $SINCE_DATE"
  PRS=$(gh pr list \
    --state merged \
    --base "$BASE_BRANCH" \
    --json number,title,author,mergedAt,labels,url \
    --jq "map(select(.mergedAt > \"$SINCE_DATE\")) | sort_by(.mergedAt)")
else
  >&2 echo "No previous tag found — fetching all merged PRs"
  PRS=$(gh pr list \
    --state merged \
    --base "$BASE_BRANCH" \
    --json number,title,author,mergedAt,labels,url \
    --jq "sort_by(.mergedAt)")
fi

PR_COUNT=$(echo "$PRS" | jq length)
>&2 echo "PRs found: $PR_COUNT"

if [ "$PR_COUNT" -eq 0 ]; then
  echo "No pull requests found since ${PREVIOUS_TAG:-the beginning}."
  exit 0
fi

# Helper: extract PRs matching a set of label names
prs_with_labels() {
  local label_filter="$1"
  echo "$PRS" | jq -r ".[] | select(.labels | map(.name) | any(${label_filter})) | \"- \(.title) ([#\(.number)](\(.url))) @\(.author.login)\""
}

# PRs that don't match any known label category
prs_uncategorized() {
  echo "$PRS" | jq -r '.[] | select(
    ([.labels[].name? // empty] | any(
      . == "feature" or . == "enhancement" or
      . == "bug" or . == "fix" or
      . == "chore" or . == "dependencies" or . == "ci"
    )) | not
  ) | "- \(.title) ([#\(.number)](\(.url))) @\(.author.login)"'
}

FEATURES=$(prs_with_labels '. == "feature" or . == "enhancement"')
FIXES=$(prs_with_labels '. == "bug" or . == "fix"')
CHORES=$(prs_with_labels '. == "chore" or . == "dependencies" or . == "ci"')
UNCATEGORIZED=$(prs_uncategorized)

# Route output to file or stdout
if [ -n "$OUT_FILE" ]; then
  exec > "$OUT_FILE"
  >&2 echo "Writing notes to: $OUT_FILE"
fi

# Build and print notes
echo "## What's Changed"
echo ""

if [ -n "$FEATURES" ]; then
  echo "### Features"
  echo "$FEATURES"
  echo ""
fi

if [ -n "$FIXES" ]; then
  echo "### Bug Fixes"
  echo "$FIXES"
  echo ""
fi

if [ -n "$UNCATEGORIZED" ]; then
  echo "### Changes"
  echo "$UNCATEGORIZED"
  echo ""
fi

if [ -n "$CHORES" ]; then
  echo "### Chores"
  echo "$CHORES"
  echo ""
fi

if [ -n "$PREVIOUS_TAG" ]; then
  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
  echo "**Full Changelog**: https://github.com/${REPO}/compare/${PREVIOUS_TAG}...${TAG}"
fi
