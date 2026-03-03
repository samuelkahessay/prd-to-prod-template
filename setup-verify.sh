#!/usr/bin/env bash
set -uo pipefail

###############################################################################
# setup-verify.sh — Validates that the pipeline configuration is complete
#
# Run after setup.sh to verify all components are configured correctly.
# Exit 0 if all checks pass, exit 1 if any fail.
###############################################################################

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Color helpers (disabled when stdout is not a terminal)
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  GREEN='' YELLOW='' RED='' BOLD='' NC=''
fi

# ---------------------------------------------------------------------------
# Counters
# ---------------------------------------------------------------------------
PASSED=0
FAILED=0
SKIPPED=0

# ---------------------------------------------------------------------------
# Check helpers
# ---------------------------------------------------------------------------
pass() {
  printf "  ${GREEN}✓${NC} %s\n" "$1"
  (( PASSED++ ))
}

fail() {
  printf "  ${RED}✗${NC} %s\n" "$1"
  (( FAILED++ ))
}

skip() {
  printf "  ${YELLOW}○${NC} %s\n" "$1"
  (( SKIPPED++ ))
}

header() {
  printf "\n${BOLD}%s${NC}\n" "$1"
}

# ---------------------------------------------------------------------------
# Track whether gh auth is available (gates API/remote checks)
# ---------------------------------------------------------------------------
GH_AUTH_OK=false

###############################################################################
# Section 1: Prerequisites
###############################################################################
header "Prerequisites"

if command -v gh >/dev/null 2>&1; then
  pass "gh CLI installed"
else
  fail "gh CLI not installed (https://cli.github.com/)"
fi

if gh aw version >/dev/null 2>&1; then
  pass "gh-aw extension installed"
else
  fail "gh-aw extension not installed (gh extension install github/gh-aw)"
fi

if gh auth status >/dev/null 2>&1; then
  pass "gh authenticated"
  GH_AUTH_OK=true
else
  fail "gh not authenticated (run: gh auth login)"
fi

###############################################################################
# Section 2: Config Files
###############################################################################
header "Config Files"

DEPLOY_PROFILE="$REPO_ROOT/.deploy-profile"
if [[ -f "$DEPLOY_PROFILE" ]]; then
  PROFILE_VALUE=$(cat "$DEPLOY_PROFILE" | tr -d '[:space:]')
  if [[ "$PROFILE_VALUE" == "nextjs-vercel" ]]; then
    pass ".deploy-profile exists and equals 'nextjs-vercel'"
  else
    fail ".deploy-profile exists but value is '$PROFILE_VALUE' (expected 'nextjs-vercel')"
  fi
else
  fail ".deploy-profile not found"
fi

POLICY_FILE="$REPO_ROOT/autonomy-policy.yml"
if [[ -f "$POLICY_FILE" ]]; then
  if grep -q "# Replace with your" "$POLICY_FILE"; then
    fail "autonomy-policy.yml contains placeholder comments (grep '# Replace with your')"
  else
    pass "autonomy-policy.yml exists with no placeholder comments"
  fi
else
  fail "autonomy-policy.yml not found"
fi

###############################################################################
# Section 3: Compiled Workflows
###############################################################################
header "Compiled Workflows"

WORKFLOWS_DIR="$REPO_ROOT/.github/workflows"
EXPECTED_AGENTS=(repo-assist pr-review-agent prd-decomposer pipeline-status ci-doctor code-simplifier)

# Count .lock.yml files
LOCK_COUNT=0
if [[ -d "$WORKFLOWS_DIR" ]]; then
  LOCK_COUNT=$(find "$WORKFLOWS_DIR" -maxdepth 1 -name "*.lock.yml" 2>/dev/null | wc -l | tr -d '[:space:]')
fi

if [[ "$LOCK_COUNT" -gt 0 ]]; then
  pass "$LOCK_COUNT compiled workflow(s) found (.lock.yml)"
else
  fail "No compiled workflows found (run: gh aw compile)"
fi

for agent in "${EXPECTED_AGENTS[@]}"; do
  if [[ -f "$WORKFLOWS_DIR/${agent}.lock.yml" ]]; then
    pass "${agent}.lock.yml exists"
  else
    fail "${agent}.lock.yml missing (run: gh aw compile)"
  fi
done

###############################################################################
# Section 4: Labels
###############################################################################
header "Labels"

REQUIRED_LABELS=(pipeline feature bug automation in-progress ci-failure repair-in-progress repair-escalated)

if [[ "$GH_AUTH_OK" == true ]]; then
  # Fetch all labels once
  REPO_LABELS=$(gh label list --limit 100 --json name -q '.[].name' 2>/dev/null || echo "")
  if [[ -n "$REPO_LABELS" ]]; then
    for label in "${REQUIRED_LABELS[@]}"; do
      if echo "$REPO_LABELS" | grep -qx "$label"; then
        pass "Label '$label' exists"
      else
        fail "Label '$label' missing (run: ./scripts/bootstrap.sh)"
      fi
    done
  else
    skip "Could not fetch labels (API error or no labels)"
  fi
else
  for label in "${REQUIRED_LABELS[@]}"; do
    skip "Label '$label' (gh auth required)"
  done
fi

###############################################################################
# Section 5: Secrets
###############################################################################
header "Secrets"

REQUIRED_SECRETS=(GH_AW_GITHUB_TOKEN VERCEL_TOKEN VERCEL_ORG_ID VERCEL_PROJECT_ID)

if [[ "$GH_AUTH_OK" == true ]]; then
  SECRET_LIST=$(gh secret list --json name -q '.[].name' 2>/dev/null || echo "")
  if [[ -n "$SECRET_LIST" ]]; then
    for secret in "${REQUIRED_SECRETS[@]}"; do
      if echo "$SECRET_LIST" | grep -qx "$secret"; then
        pass "Secret '$secret' is set"
      else
        fail "Secret '$secret' not found (run: gh secret set $secret)"
      fi
    done
  else
    # gh secret list may return empty if no secrets are set — that's a valid response
    for secret in "${REQUIRED_SECRETS[@]}"; do
      fail "Secret '$secret' not found (run: gh secret set $secret)"
    done
  fi
else
  for secret in "${REQUIRED_SECRETS[@]}"; do
    skip "Secret '$secret' (gh auth required)"
  done
fi

###############################################################################
# Section 6: Repo Settings
###############################################################################
header "Repo Settings"

if [[ "$GH_AUTH_OK" == true ]]; then
  # Check auto-merge enabled
  AUTO_MERGE=$(gh api repos/{owner}/{repo} --jq '.allow_auto_merge' 2>/dev/null || echo "")
  if [[ "$AUTO_MERGE" == "true" ]]; then
    pass "Auto-merge is enabled"
  elif [[ -z "$AUTO_MERGE" ]]; then
    skip "Could not check auto-merge setting (API error)"
  else
    fail "Auto-merge is not enabled (run: ./scripts/bootstrap.sh)"
  fi

  # Check memory/repo-assist branch
  if git ls-remote --heads origin memory/repo-assist 2>/dev/null | grep -q memory/repo-assist; then
    pass "memory/repo-assist branch exists"
  else
    fail "memory/repo-assist branch not found (run: ./scripts/bootstrap.sh)"
  fi
else
  skip "Auto-merge setting (gh auth required)"
  skip "memory/repo-assist branch (gh auth required)"
fi

###############################################################################
# Summary
###############################################################################
TOTAL=$(( PASSED + FAILED + SKIPPED ))

printf "\n${BOLD}Summary${NC}\n"
printf "  ${GREEN}%d passed${NC}, ${RED}%d failed${NC}, ${YELLOW}%d skipped${NC} (out of %d checks)\n\n" \
  "$PASSED" "$FAILED" "$SKIPPED" "$TOTAL"

if [[ "$FAILED" -gt 0 ]]; then
  printf "  Configuration incomplete. Run ${BOLD}./setup.sh${NC} to fix missing items.\n\n"
  exit 1
else
  printf "  Configuration complete! Your pipeline is ready.\n\n"
  exit 0
fi
