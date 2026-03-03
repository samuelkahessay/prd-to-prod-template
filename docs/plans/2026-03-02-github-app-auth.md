# GitHub App Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the fragile `GH_AW_GITHUB_TOKEN` PAT with GitHub App token minting, with automatic PAT fallback for users who prefer the simpler setup.

**Architecture:** Each workflow that needs an elevated token gets a conditional `actions/create-github-app-token@v1` step gated on `vars.PIPELINE_APP_ID != ''`. Downstream steps use `${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}` for automatic fallback. Setup wizard offers App installation as the recommended option, PAT as the alternative.

**Tech Stack:** GitHub Actions YAML, `actions/create-github-app-token@v1`, Bash

---

## Token Resolution Pattern

Every workflow that currently uses `GH_AW_GITHUB_TOKEN` gets this pair of steps inserted early in the job:

```yaml
- name: Generate App token
  id: app-token
  if: vars.PIPELINE_APP_ID != ''
  uses: actions/create-github-app-token@v1
  with:
    app-id: ${{ vars.PIPELINE_APP_ID }}
    private-key: ${{ secrets.PIPELINE_APP_PRIVATE_KEY }}
```

Then all subsequent `env:` blocks change from:
```yaml
GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}
```
To:
```yaml
GH_TOKEN: ${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}
```

The `||` expression works because GitHub Actions returns empty string for skipped step outputs, and `'' || 'value'` resolves to `'value'`.

---

## Task 1: Update ci-failure-issue.yml

**Files:**
- Modify: `.github/workflows/ci-failure-issue.yml`

This file has 3 places using `GH_AW_GITHUB_TOKEN`:
- Line 68: `GH_AW_GITHUB_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}` in env block
- Line 299: `if [ -n "$GH_AW_GITHUB_TOKEN" ]; then ISSUE_TOKEN="$GH_AW_GITHUB_TOKEN"` for issue creation
- Line 440: `GH_TOKEN="$GH_AW_GITHUB_TOKEN" gh issue comment` for repair command

**Step 1: Add App token step**

Insert before the "Route failing CI run" step (which is the only step in the job):

```yaml
      - name: Generate App token
        id: app-token
        if: vars.PIPELINE_APP_ID != ''
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ vars.PIPELINE_APP_ID }}
          private-key: ${{ secrets.PIPELINE_APP_PRIVATE_KEY }}
```

**Step 2: Update env block**

Change the env block from:
```yaml
          GH_AW_GITHUB_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}
```
To:
```yaml
          GH_AW_GITHUB_TOKEN: ${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}
```

The shell script inside already handles the fallback to `GH_TOKEN` when `GH_AW_GITHUB_TOKEN` is empty, so no changes needed to the bash logic.

**Step 3: Verify YAML is valid**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-failure-issue.yml'))"`

**Step 4: Commit**

```bash
git add .github/workflows/ci-failure-issue.yml
git commit -m "feat: add GitHub App token support to ci-failure-issue.yml with PAT fallback"
```

---

## Task 2: Update auto-dispatch.yml

**Files:**
- Modify: `.github/workflows/auto-dispatch.yml`

This file has 2 places using `GH_AW_GITHUB_TOKEN`:
- Line 80: `GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}` in guard step
- Line 129: `GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}` in dispatch step

**Step 1: Add App token step**

Insert early in the job steps (after checkout or initial steps, before the guard step):

```yaml
      - name: Generate App token
        id: app-token
        if: vars.PIPELINE_APP_ID != ''
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ vars.PIPELINE_APP_ID }}
          private-key: ${{ secrets.PIPELINE_APP_PRIVATE_KEY }}
```

**Step 2: Update both env blocks**

Replace both occurrences of:
```yaml
          GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}
```
With:
```yaml
          GH_TOKEN: ${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}
```

**Step 3: Verify YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/auto-dispatch.yml'))"`

**Step 4: Commit**

```bash
git add .github/workflows/auto-dispatch.yml
git commit -m "feat: add GitHub App token support to auto-dispatch.yml with PAT fallback"
```

---

## Task 3: Update auto-dispatch-requeue.yml

**Files:**
- Modify: `.github/workflows/auto-dispatch-requeue.yml`

This file has 2 places using `GH_AW_GITHUB_TOKEN`:
- Line 45: `GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}` in env
- Line 146: `GH_TOKEN="$GH_AW_GITHUB_TOKEN"` inline in bash (needs env var available)

**Step 1: Add App token step**

Insert before the re-dispatch step:

```yaml
      - name: Generate App token
        id: app-token
        if: vars.PIPELINE_APP_ID != ''
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ vars.PIPELINE_APP_ID }}
          private-key: ${{ secrets.PIPELINE_APP_PRIVATE_KEY }}
```

**Step 2: Update env block**

Change:
```yaml
          GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}
```
To:
```yaml
          GH_TOKEN: ${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}
```

Also need to handle line 146 which sets `GH_TOKEN="$GH_AW_GITHUB_TOKEN"` inline. Since we're now passing the resolved token as `GH_TOKEN` in the env block, we need to check if line 146 needs updating. If `GH_AW_GITHUB_TOKEN` is still in env, use it; if not, the `GH_TOKEN` from env is already correct.

Add `GH_AW_GITHUB_TOKEN` to the env block alongside `GH_TOKEN` so the inline reference works:
```yaml
          GH_TOKEN: ${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}
          GH_AW_GITHUB_TOKEN: ${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}
```

Or simpler: change the bash line from `GH_TOKEN="$GH_AW_GITHUB_TOKEN"` to just use `$GH_TOKEN` directly (since it's already set in env).

**Step 3: Verify YAML**

**Step 4: Commit**

```bash
git add .github/workflows/auto-dispatch-requeue.yml
git commit -m "feat: add GitHub App token support to auto-dispatch-requeue.yml with PAT fallback"
```

---

## Task 4: Update pr-review-submit.yml

**Files:**
- Modify: `.github/workflows/pr-review-submit.yml`

This is the most complex file. It has `GH_AW_GITHUB_TOKEN` in:
- Line 317: `MERGE_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}` (auto-merge, issue_comment path)
- Line 462: `GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}` (dispatch repo-assist, issue_comment path)
- Line 746: `MERGE_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}` (auto-merge, workflow_dispatch path)
- Line 908: `GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}` (dispatch repo-assist, workflow_dispatch path)
- Line 990: `MERGE_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}` (approve-sensitive-path)

This file has TWO jobs that need the token: the `issue_comment` triggered job and the `workflow_dispatch` triggered job. Each needs its own App token step.

**Step 1: Add App token step to issue_comment job**

Insert early in the issue_comment job's steps:

```yaml
      - name: Generate App token
        id: app-token
        if: vars.PIPELINE_APP_ID != ''
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ vars.PIPELINE_APP_ID }}
          private-key: ${{ secrets.PIPELINE_APP_PRIVATE_KEY }}
```

**Step 2: Update all token references in issue_comment job**

Replace all `${{ secrets.GH_AW_GITHUB_TOKEN }}` with `${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}` in the issue_comment job (lines 317, 462).

**Step 3: Add App token step to workflow_dispatch job**

Same step added to the workflow_dispatch job.

**Step 4: Update all token references in workflow_dispatch job**

Replace all `${{ secrets.GH_AW_GITHUB_TOKEN }}` with `${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}` (lines 746, 908, 990).

**Step 5: Verify YAML**

**Step 6: Commit**

```bash
git add .github/workflows/pr-review-submit.yml
git commit -m "feat: add GitHub App token support to pr-review-submit.yml with PAT fallback"
```

---

## Task 5: Update pipeline-watchdog.yml

**Files:**
- Modify: `.github/workflows/pipeline-watchdog.yml`

This file passes `GH_AW_GITHUB_TOKEN` as an env var to `pipeline-watchdog.sh`:
- Line 56: `GH_AW_GITHUB_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}`

**Step 1: Add App token step**

Insert before the watchdog step:

```yaml
      - name: Generate App token
        id: app-token
        if: vars.PIPELINE_APP_ID != ''
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ vars.PIPELINE_APP_ID }}
          private-key: ${{ secrets.PIPELINE_APP_PRIVATE_KEY }}
```

**Step 2: Update env block**

Change:
```yaml
          GH_AW_GITHUB_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}
```
To:
```yaml
          GH_AW_GITHUB_TOKEN: ${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}
```

The shell script `pipeline-watchdog.sh` checks `${GH_AW_GITHUB_TOKEN:-}` so no bash changes needed.

**Step 3: Verify YAML and commit**

```bash
git add .github/workflows/pipeline-watchdog.yml
git commit -m "feat: add GitHub App token support to pipeline-watchdog.yml with PAT fallback"
```

---

## Task 6: Update setup.sh — offer App installation as primary auth

**Files:**
- Modify: `setup.sh`

**Step 1: Restructure Step 5 (auth setup)**

Replace the current PAT-only Step 5 with an auth choice:

```bash
# --- Step 5: Authentication ---
header "Step 5: Pipeline Authentication"

echo "The pipeline needs elevated permissions for auto-merge, issue creation,"
echo "and workflow dispatch (to bypass GitHub's anti-cascade rule)."
echo ""
echo "Two options:"
echo "  1. GitHub App (recommended) — auto-rotating tokens, scoped per job"
echo "  2. Personal Access Token (PAT) — simpler setup, manual rotation"
echo ""

if [ "$NON_INTERACTIVE" = false ]; then
  read -rp "Auth method [1/2]: " AUTH_METHOD
  AUTH_METHOD="${AUTH_METHOD:-1}"
else
  AUTH_METHOD="2"  # Non-interactive defaults to PAT (simpler for automation)
fi

if [[ "$AUTH_METHOD" == "1" ]]; then
  # GitHub App path
  header "Step 5a: GitHub App Setup"
  echo ""
  echo "Install the prd-to-prod pipeline App on your repo:"
  echo "  https://github.com/apps/prd-to-prod-pipeline"
  echo ""
  echo "After installing, set these in your repo:"
  echo "  - Variable PIPELINE_APP_ID (from the App's settings page)"
  echo "  - Secret PIPELINE_APP_PRIVATE_KEY (generate in App settings → Private keys)"
  echo ""

  if [ "$NON_INTERACTIVE" = false ]; then
    read -rp "PIPELINE_APP_ID: " APP_ID_VALUE
    if [ -n "$APP_ID_VALUE" ]; then
      gh variable set PIPELINE_APP_ID --body "$APP_ID_VALUE"
      info "PIPELINE_APP_ID variable set"
    fi

    prompt_secret PIPELINE_KEY_VALUE "PIPELINE_APP_PRIVATE_KEY (paste PEM content)"
    if [ -n "$PIPELINE_KEY_VALUE" ]; then
      echo "$PIPELINE_KEY_VALUE" | gh secret set PIPELINE_APP_PRIVATE_KEY
      info "PIPELINE_APP_PRIVATE_KEY secret set"
    fi
  else
    warn "Non-interactive: set App credentials manually"
    echo "  gh variable set PIPELINE_APP_ID"
    echo "  gh secret set PIPELINE_APP_PRIVATE_KEY"
  fi
else
  # PAT path (existing logic)
  header "Step 5b: Personal Access Token"
  echo ""
  echo "Create a fine-grained PAT at: https://github.com/settings/tokens?type=beta"
  echo "Required permissions: Contents (R/W), Issues (R/W), Pull requests (R/W),"
  echo "  Actions (R/W), Workflows (R/W)"
  echo ""
  # ... existing PAT prompt logic ...
fi
```

**Step 2: Commit**

```bash
git add setup.sh
git commit -m "feat: add GitHub App as primary auth option in setup.sh"
```

---

## Task 7: Update setup-verify.sh — check for App OR PAT

**Files:**
- Modify: `setup-verify.sh`

**Step 1: Update secrets section**

Change the secrets check from requiring `GH_AW_GITHUB_TOKEN` to accepting either App config or PAT:

```bash
# Check for pipeline auth (App OR PAT)
APP_ID_SET=false
APP_KEY_SET=false
PAT_SET=false

# Check variables
VARS=$(gh variable list --json name -q ".[].name" 2>/dev/null || echo "")
if echo "$VARS" | grep -qx "PIPELINE_APP_ID"; then
  pass "Variable 'PIPELINE_APP_ID' is set"
  APP_ID_SET=true
else
  skip "Variable 'PIPELINE_APP_ID' not set (using PAT instead?)"
fi

# Check secrets
if echo "$SECRETS" | grep -qx "PIPELINE_APP_PRIVATE_KEY"; then
  pass "Secret 'PIPELINE_APP_PRIVATE_KEY' is set"
  APP_KEY_SET=true
else
  skip "Secret 'PIPELINE_APP_PRIVATE_KEY' not set (using PAT instead?)"
fi

if echo "$SECRETS" | grep -qx "GH_AW_GITHUB_TOKEN"; then
  pass "Secret 'GH_AW_GITHUB_TOKEN' is set"
  PAT_SET=true
else
  skip "Secret 'GH_AW_GITHUB_TOKEN' not set (using App instead?)"
fi

# Validate: need either App (both ID + key) or PAT
if [[ "$APP_ID_SET" == true && "$APP_KEY_SET" == true ]]; then
  pass "Pipeline auth: GitHub App configured"
elif [[ "$PAT_SET" == true ]]; then
  pass "Pipeline auth: PAT configured"
else
  fail "Pipeline auth: neither GitHub App (PIPELINE_APP_ID + PIPELINE_APP_PRIVATE_KEY) nor PAT (GH_AW_GITHUB_TOKEN) configured"
fi
```

Keep the Vercel secret checks unchanged.

**Step 2: Commit**

```bash
git add setup-verify.sh
git commit -m "feat: update setup-verify.sh to accept GitHub App or PAT auth"
```

---

## Task 8: Update README.md and docs

**Files:**
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`

**Step 1: Update README secrets table**

Replace the secrets table with one that shows both auth options:

```markdown
## Authentication

The pipeline needs elevated permissions for auto-merge and workflow dispatch.

### Option 1: GitHub App (Recommended)

Install the [prd-to-prod pipeline](https://github.com/apps/prd-to-prod-pipeline) App on your repo.

| Config | Type | Purpose |
|--------|------|---------|
| `PIPELINE_APP_ID` | Variable | App ID from the App's settings page |
| `PIPELINE_APP_PRIVATE_KEY` | Secret | PEM private key generated in App settings |

### Option 2: Personal Access Token

Create a [fine-grained PAT](https://github.com/settings/tokens?type=beta) with Contents, Issues, Pull requests, Actions, and Workflows permissions.

| Config | Type | Purpose |
|--------|------|---------|
| `GH_AW_GITHUB_TOKEN` | Secret | PAT for auto-merge and workflow dispatch |
```

**Step 2: Update ARCHITECTURE.md secrets table**

Add `PIPELINE_APP_ID` and `PIPELINE_APP_PRIVATE_KEY` to the secrets table, note PAT as alternative.

**Step 3: Commit**

```bash
git add README.md docs/ARCHITECTURE.md
git commit -m "docs: update auth documentation for GitHub App + PAT options"
```

---

## Task 9: Push and update planning doc

**Step 1: Push**

```bash
git push
```

**Step 2: Update planning doc in source repo**

Add Phase 3 completion notes to `docs/plans/2026-03-02-template-repo-extraction.md`.
