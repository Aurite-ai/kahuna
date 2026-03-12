#!/usr/bin/env bash
# =============================================================================
# create-release-pr.sh
# Creates a PR from develop → main summarizing all merged PRs not yet in main.
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# Constants
# -----------------------------------------------------------------------------
SOURCE_BRANCH="develop"
TARGET_BRANCH="main"
DATE="$(date -u +%Y-%m-%d)"

# -----------------------------------------------------------------------------
# Flags
# -----------------------------------------------------------------------------
DRAFT=false
DRY_RUN=false

# -----------------------------------------------------------------------------
# Usage
# -----------------------------------------------------------------------------
usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Creates a GitHub Pull Request from '${SOURCE_BRANCH}' → '${TARGET_BRANCH}',
summarizing all PRs merged into ${SOURCE_BRANCH} since the last sync with ${TARGET_BRANCH}.

OPTIONS:
  --draft       Open the PR in draft mode
  --dry-run     Print the PR title and description without creating the PR
  -h, --help    Show this help message and exit

EXAMPLES:
  $(basename "$0")
  $(basename "$0") --draft
  $(basename "$0") --dry-run
EOF
}

# -----------------------------------------------------------------------------
# Argument parsing
# -----------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --draft)
      DRAFT=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: Unknown option: $1" >&2
      echo "" >&2
      usage >&2
      exit 1
      ;;
  esac
done

# -----------------------------------------------------------------------------
# Preflight checks
# -----------------------------------------------------------------------------

# Check for gh CLI
if ! command -v gh &>/dev/null; then
  echo "ERROR: GitHub CLI ('gh') is not installed or not in PATH." >&2
  echo "       Install it from https://cli.github.com/" >&2
  exit 1
fi

# Check we're inside a git repo
if ! git rev-parse --git-dir &>/dev/null; then
  echo "ERROR: Not inside a git repository." >&2
  exit 1
fi

# Fetch latest refs so comparisons are accurate
echo "==> Fetching latest refs from origin..."
git fetch origin "${SOURCE_BRANCH}" "${TARGET_BRANCH}" --quiet

# Check that both branches exist on origin
for branch in "${SOURCE_BRANCH}" "${TARGET_BRANCH}"; do
  if ! git rev-parse --verify "origin/${branch}" &>/dev/null; then
    echo "ERROR: Branch '${branch}' does not exist on origin." >&2
    exit 1
  fi
done

# Check for new commits between main and develop
NEW_COMMITS="$(git log "origin/${TARGET_BRANCH}..origin/${SOURCE_BRANCH}" --oneline)"
if [[ -z "${NEW_COMMITS}" ]]; then
  echo "INFO: No new commits found between '${TARGET_BRANCH}' and '${SOURCE_BRANCH}'. Nothing to release."
  exit 0
fi

# -----------------------------------------------------------------------------
# Check if a PR already exists for this branch pair
# -----------------------------------------------------------------------------
EXISTING_PR="$(gh pr list \
  --head "${SOURCE_BRANCH}" \
  --base "${TARGET_BRANCH}" \
  --state open \
  --json number,url \
  --jq '.[0] | select(. != null) | "\(.number) \(.url)"' 2>/dev/null || true)"

if [[ -n "${EXISTING_PR}" ]]; then
  read -r pr_number pr_url <<<"${EXISTING_PR}"
  echo "INFO: A PR from '${SOURCE_BRANCH}' → '${TARGET_BRANCH}' already exists: #${pr_number}"
  echo "      ${pr_url}"
  exit 0
fi

# -----------------------------------------------------------------------------
# Detect merged PRs whose merge commits are in develop but not in main
# -----------------------------------------------------------------------------
echo "==> Detecting merged PRs in '${SOURCE_BRANCH}' not yet in '${TARGET_BRANCH}'..."

# Collect all merge commits in the range develop..main (commits only in develop)
# GitHub's squash merges won't show as merge commits, so we use two strategies:
#   1. Parse standard merge commit messages: "Merge pull request #N from ..."
#   2. Parse GitHub's squash commit footers:  "(#N)" at end of subject line

MERGE_COMMITS="$(git log "origin/${TARGET_BRANCH}..origin/${SOURCE_BRANCH}" --oneline)"

declare -a PR_NUMBERS=()

while IFS= read -r line; do
  sha="${line%% *}"
  subject="$(git log -1 --format="%s" "${sha}")"

  # Strategy 1: Standard merge commit "Merge pull request #N from ..."
  if [[ "${subject}" =~ ^Merge\ pull\ request\ \#([0-9]+)\ from ]]; then
    PR_NUMBERS+=("${BASH_REMATCH[1]}")
    continue
  fi

  # Strategy 2: Squash merge with "(#N)" at end of commit subject
  if [[ "${subject}" =~ \(\#([0-9]+)\)$ ]]; then
    PR_NUMBERS+=("${BASH_REMATCH[1]}")
    continue
  fi
done <<<"${MERGE_COMMITS}"

# Deduplicate (preserve order) — bash 3.2 compatible (no associative arrays)
declare -a UNIQUE_PR_NUMBERS=()
SEEN_LIST=""
for num in "${PR_NUMBERS[@]+"${PR_NUMBERS[@]}"}"; do
  if [[ " ${SEEN_LIST} " != *" ${num} "* ]]; then
    UNIQUE_PR_NUMBERS+=("$num")
    SEEN_LIST="${SEEN_LIST} ${num}"
  fi
done

# -----------------------------------------------------------------------------
# Build PR description
# -----------------------------------------------------------------------------
PR_TITLE="Release: ${SOURCE_BRANCH} → ${TARGET_BRANCH} (${DATE})"

build_description() {
  local body=""

  if [[ ${#UNIQUE_PR_NUMBERS[@]} -gt 0 ]]; then
    body+="## Included PRs"$'\n\n'

    for pr_num in "${UNIQUE_PR_NUMBERS[@]}"; do
      # Fetch PR metadata from GitHub
      pr_data="$(gh pr view "${pr_num}" \
        --json number,title,author \
        --jq '"#\(.number) \(.title) (@\(.author.login))"' 2>/dev/null || true)"

      if [[ -n "${pr_data}" ]]; then
        body+="- ${pr_data}"$'\n'
      else
        # Fallback if gh can't find the PR (e.g., deleted or wrong repo context)
        body+="- #${pr_num} (details unavailable)"$'\n'
      fi
    done
  else
    body+="## Included Changes"$'\n\n'
    body+="_No individual PRs detected via merge commits. See commit log for details._"$'\n\n'
    body+="<details><summary>Commits</summary>"$'\n\n'
    body+="\`\`\`"$'\n'
    body+="${NEW_COMMITS}"$'\n'
    body+="\`\`\`"$'\n\n'
    body+="</details>"$'\n'
  fi

  echo "${body}"
}

PR_BODY="$(build_description)"

# -----------------------------------------------------------------------------
# Dry run output
# -----------------------------------------------------------------------------
if [[ "${DRY_RUN}" == true ]]; then
  echo ""
  echo "=== DRY RUN — PR would be created with the following details ==="
  echo ""
  echo "TITLE:  ${PR_TITLE}"
  echo "HEAD:   ${SOURCE_BRANCH}"
  echo "BASE:   ${TARGET_BRANCH}"
  echo "DRAFT:  ${DRAFT}"
  echo ""
  echo "--- DESCRIPTION ---"
  echo "${PR_BODY}"
  echo "-------------------"
  echo ""
  echo "=== DRY RUN complete. No PR was created. ==="
  exit 0
fi

# -----------------------------------------------------------------------------
# Create the PR
# -----------------------------------------------------------------------------
echo "==> Creating PR: '${PR_TITLE}'..."

CREATE_ARGS=(
  --title "${PR_TITLE}"
  --body "${PR_BODY}"
  --head "${SOURCE_BRANCH}"
  --base "${TARGET_BRANCH}"
)

if [[ "${DRAFT}" == true ]]; then
  CREATE_ARGS+=(--draft)
fi

PR_URL="$(gh pr create "${CREATE_ARGS[@]}")"

echo ""
echo "✅ Pull Request created successfully!"
echo "   ${PR_URL}"
