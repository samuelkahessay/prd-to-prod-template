# Installable Pipeline Distribution — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable `gh pipeline install` to add the full prd-to-prod pipeline to any existing GitHub repo, with `gh pipeline upgrade` for version-pinned coordinated updates.

**Architecture:** Three layers — (1) centralized reusable workflows in this repo with explicit secret forwarding, (2) a Copier template that generates thin caller workflows + local agent definitions, (3) a `gh-pipeline` shell extension wrapping Copier + bootstrap + verify.

**Tech Stack:** GitHub Actions reusable workflows, Copier (Python template engine), gh CLI extension (shell), Jinja2 templates.

**Design doc:** `docs/plans/2026-03-04-installable-pipeline-design.md`

---

## Phase 1: Reusable Workflows

Convert 9 existing standalone workflows into `_reusable-*.yml` with `workflow_call` triggers, explicit secret/input declarations, and `github.workflow_sha`-pinned script checkouts. The existing standalone workflows remain — they become the "self-install" for this template repo itself.

For any reusable workflow that checks out central scripts, add a `template_repo` input and have the thin caller pass the pinned `{{ template_repo }}` value explicitly. Never derive the central repo path from `github.repository_owner`, because in the install-anywhere model that resolves to the caller repo owner, not the template repo.

### Task 1: Create `_reusable-dispatch.yml`

**Files:**
- Read: `.github/workflows/auto-dispatch.yml` (source logic)
- Create: `.github/workflows/_reusable-dispatch.yml`

**Step 1: Read the existing auto-dispatch.yml**

Understand the full logic: healing gate, classification, debounce, concurrency, dispatch.

**Step 2: Create `_reusable-dispatch.yml` with workflow_call interface**

```yaml
name: "[Reusable] Pipeline Auto-Dispatch"

on:
  workflow_call:
    inputs:
      pipeline_app_id:
        type: string
        required: false
        default: ""
      healing_enabled:
        type: string
        required: false
        default: "true"
      template_repo:
        type: string
        required: true
        description: "Central template repo in owner/repo format"
      issue_number:
        type: number
        required: true
      issue_title:
        type: string
        required: true
      issue_labels:
        type: string
        required: true
        description: "JSON array of label name strings"
    secrets:
      PIPELINE_APP_PRIVATE_KEY:
        required: false
      GH_AW_GITHUB_TOKEN:
        required: false

# Concurrency: one dispatch per issue
concurrency:
  group: "pipeline-dispatch-${{ inputs.issue_number }}"
  cancel-in-progress: false
```

Then copy the job logic from `auto-dispatch.yml`, replacing:
- `vars.PIPELINE_APP_ID` → `inputs.pipeline_app_id`
- `vars.PIPELINE_HEALING_ENABLED` → `inputs.healing_enabled`
- `secrets.PIPELINE_APP_PRIVATE_KEY` → `secrets.PIPELINE_APP_PRIVATE_KEY`
- `secrets.GH_AW_GITHUB_TOKEN` → `secrets.GH_AW_GITHUB_TOKEN`
- central script checkout repo → `inputs.template_repo`
- `github.event.issue.*` → `inputs.*` equivalents
- Script checkouts use `github.workflow_sha` (see Step 3)

**Step 3: Add script checkout using `github.workflow_sha`**

Before any step that calls a script, add:

```yaml
- name: Checkout pipeline scripts
  uses: actions/checkout@v4
  with:
    repository: ${{ inputs.template_repo }}
    ref: ${{ github.workflow_sha }}
    sparse-checkout: scripts/
    path: .pipeline-scripts

- name: Run classification
  run: .pipeline-scripts/scripts/classify-pipeline-issue.sh
  env:
    GITHUB_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN || github.token }}
```

**Step 4: Verify the workflow is valid YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/_reusable-dispatch.yml'))"`
Expected: No errors.

**Step 5: Commit**

```bash
git add .github/workflows/_reusable-dispatch.yml
git commit -m "feat: add _reusable-dispatch.yml for cross-repo pipeline install"
```

---

### Task 2: Create `_reusable-dispatch-requeue.yml`

**Files:**
- Read: `.github/workflows/auto-dispatch-requeue.yml`
- Create: `.github/workflows/_reusable-dispatch-requeue.yml`

**Step 1: Read auto-dispatch-requeue.yml**

Note: This workflow triggers on `workflow_run` completion of repo-assist. In the reusable version, the thin caller in the target repo will handle the `workflow_run` trigger and forward context.

**Step 2: Create the reusable workflow**

```yaml
name: "[Reusable] Pipeline Dispatch Requeue"

on:
  workflow_call:
    inputs:
      pipeline_app_id:
        type: string
        required: false
        default: ""
      healing_enabled:
        type: string
        required: false
        default: "true"
      triggering_run_id:
        type: string
        required: false
        default: ""
    secrets:
      PIPELINE_APP_PRIVATE_KEY:
        required: false
      GH_AW_GITHUB_TOKEN:
        required: false
```

Copy job logic from `auto-dispatch-requeue.yml`, applying the same substitution pattern as Task 1. Add script checkout for `healing-control.sh` and `classify-pipeline-issue.sh`.

**Step 3: Validate YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/_reusable-dispatch-requeue.yml'))"`

**Step 4: Commit**

```bash
git add .github/workflows/_reusable-dispatch-requeue.yml
git commit -m "feat: add _reusable-dispatch-requeue.yml"
```

---

### Task 3: Create `_reusable-review-submit.yml`

**Files:**
- Read: `.github/workflows/pr-review-submit.yml`
- Create: `.github/workflows/_reusable-review-submit.yml`

**Step 1: Read pr-review-submit.yml**

This is the most complex workflow — it parses `[PIPELINE-VERDICT]` comments, submits formal reviews, and optionally triggers auto-merge + repo-assist for fixes. It uses `GITHUB_TOKEN` for review submission and `GH_AW_GITHUB_TOKEN` for merge.

**Step 2: Create the reusable workflow**

```yaml
name: "[Reusable] Pipeline PR Review Submit"

on:
  workflow_call:
    inputs:
      pipeline_app_id:
        type: string
        required: false
        default: ""
      healing_enabled:
        type: string
        required: false
        default: "true"
      template_repo:
        type: string
        required: true
        description: "Central template repo in owner/repo format"
      event_name:
        type: string
        required: true
        description: "github.event_name from caller"
      comment_body:
        type: string
        required: false
        default: ""
      comment_id:
        type: number
        required: false
        default: 0
        description: "github.event.comment.id from caller"
      comment_user_login:
        type: string
        required: false
        default: ""
      repository_owner:
        type: string
        required: false
        default: ""
        description: "github.repository_owner from caller"
      issue_number:
        type: number
        required: false
        default: 0
      is_pull_request:
        type: boolean
        required: false
        default: false
      # Break-glass manual inputs
      manual_pr_number:
        type: string
        required: false
        default: ""
      manual_verdict:
        type: string
        required: false
        default: ""
      manual_summary:
        type: string
        required: false
        default: ""
      actor:
        type: string
        required: false
        default: ""
    secrets:
      PIPELINE_APP_PRIVATE_KEY:
        required: false
      GH_AW_GITHUB_TOKEN:
        required: false
```

Copy job logic. Replace `github.event.*` references with `inputs.*`. The issue-comment path must carry enough forwarded metadata to preserve the original authorization and idempotency behavior: at minimum `comment_id`, `comment_user_login`, and `repository_owner`. Script checkout for `healing-control.sh` and `check-autonomy-policy.sh`. Note: `autonomy-policy.yml` lives in the *calling* repo, so the checkout of the caller repo (default `actions/checkout`) is needed too.

**Step 3: Handle the dual-checkout pattern**

This workflow needs both:
1. The calling repo checked out (for `autonomy-policy.yml`)
2. The central repo checked out (for scripts)

```yaml
steps:
  - name: Checkout calling repo
    uses: actions/checkout@v4

  - name: Checkout pipeline scripts
    uses: actions/checkout@v4
    with:
      repository: ${{ inputs.template_repo }}
      ref: ${{ github.workflow_sha }}
      sparse-checkout: scripts/
      path: .pipeline-scripts
```

**Step 4: Validate YAML and commit**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/_reusable-review-submit.yml'))"
git add .github/workflows/_reusable-review-submit.yml
git commit -m "feat: add _reusable-review-submit.yml"
```

---

### Task 4: Create `_reusable-watchdog.yml`

**Files:**
- Read: `.github/workflows/pipeline-watchdog.yml`
- Create: `.github/workflows/_reusable-watchdog.yml`

**Step 1: Read pipeline-watchdog.yml**

Cron-triggered in the standalone version. As a reusable workflow, the thin caller handles the `schedule` trigger.

**Step 2: Create the reusable workflow**

```yaml
name: "[Reusable] Pipeline Watchdog"

on:
  workflow_call:
    inputs:
      pipeline_app_id:
        type: string
        required: false
        default: ""
      healing_enabled:
        type: string
        required: false
        default: "true"
    secrets:
      PIPELINE_APP_PRIVATE_KEY:
        required: false
      GH_AW_GITHUB_TOKEN:
        required: false
```

Copy job logic. Script checkout for `healing-control.sh` and `pipeline-watchdog.sh`.

**Step 3: Validate and commit**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/_reusable-watchdog.yml'))"
git add .github/workflows/_reusable-watchdog.yml
git commit -m "feat: add _reusable-watchdog.yml"
```

---

### Task 5: Create `_reusable-ci-failure.yml`

**Files:**
- Read: `.github/workflows/ci-failure-issue.yml`
- Create: `.github/workflows/_reusable-ci-failure.yml`

**Step 1: Read ci-failure-issue.yml**

Triggers on `workflow_run` of "Node CI" or "Deploy Router" failures. The reusable version receives workflow_run context as inputs.

**Step 2: Create the reusable workflow**

```yaml
name: "[Reusable] Pipeline CI Failure Issue"

on:
  workflow_call:
    inputs:
      pipeline_app_id:
        type: string
        required: false
        default: ""
      healing_enabled:
        type: string
        required: false
        default: "true"
      failed_run_id:
        type: string
        required: true
      failed_run_url:
        type: string
        required: true
      head_sha:
        type: string
        required: true
      head_branch:
        type: string
        required: true
      pull_requests_json:
        type: string
        required: false
        default: "[]"
        description: "JSON array of associated PR objects"
    secrets:
      PIPELINE_APP_PRIVATE_KEY:
        required: false
      GH_AW_GITHUB_TOKEN:
        required: false
```

Copy job logic. Replace `github.event.workflow_run.*` with `inputs.*`. Script checkout for `healing-control.sh`, `extract-failure-context.sh`, `render-ci-repair-command.sh`.

**Step 3: Validate and commit**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/_reusable-ci-failure.yml'))"
git add .github/workflows/_reusable-ci-failure.yml
git commit -m "feat: add _reusable-ci-failure.yml"
```

---

### Task 6: Create `_reusable-ci-resolve.yml`

**Files:**
- Read: `.github/workflows/ci-failure-resolve.yml`
- Create: `.github/workflows/_reusable-ci-resolve.yml`

**Step 1: Read ci-failure-resolve.yml**

Simpler workflow — uses only `GITHUB_TOKEN`. Triggers on successful workflow_run.

**Step 2: Create the reusable workflow**

```yaml
name: "[Reusable] Pipeline CI Failure Resolve"

on:
  workflow_call:
    inputs:
      successful_run_id:
        type: string
        required: true
      head_sha:
        type: string
        required: true
      head_branch:
        type: string
        required: true
      pull_requests_json:
        type: string
        required: false
        default: "[]"
    secrets: {}
```

This workflow only uses `GITHUB_TOKEN` (auto-provided). No explicit secrets needed.

**Step 3: Validate and commit**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/_reusable-ci-resolve.yml'))"
git add .github/workflows/_reusable-ci-resolve.yml
git commit -m "feat: add _reusable-ci-resolve.yml"
```

---

### Task 7: Create `_reusable-deploy-router.yml`

**Files:**
- Read: `.github/workflows/deploy-router.yml`
- Create: `.github/workflows/_reusable-deploy-router.yml`

**Step 1: Read deploy-router.yml**

Routes to the correct deploy workflow based on `.deploy-profile`. Currently calls `deploy-vercel.yml` via `workflow_call`.

**Step 2: Design decision — deploy routing in reusable context**

The reusable deploy-router needs to call the target repo's local deploy workflow (e.g., `deploy-vercel.yml`). But a reusable workflow can call another reusable workflow using a relative path only within its own repo.

**Solution:** The reusable deploy-router reads `.deploy-profile` from the calling repo and outputs the profile name. The thin caller in the target repo uses a conditional job to call the correct local deploy workflow based on this output.

```yaml
name: "[Reusable] Pipeline Deploy Router"

on:
  workflow_call:
    outputs:
      profile:
        description: "Active deploy profile name"
        value: ${{ jobs.detect.outputs.profile }}

jobs:
  detect:
    runs-on: ubuntu-latest
    outputs:
      profile: ${{ steps.read.outputs.profile }}
    steps:
      - uses: actions/checkout@v4
        with:
          sparse-checkout: .deploy-profile
      - id: read
        run: |
          if [ -f .deploy-profile ]; then
            echo "profile=$(cat .deploy-profile | tr -d '[:space:]')" >> "$GITHUB_OUTPUT"
          else
            echo "::error::Missing .deploy-profile"
            exit 1
          fi
```

The thin caller then conditionally dispatches:

```yaml
# In target repo's pipeline-deploy-router.yml
jobs:
  route:
    uses: yourorg/prd-to-prod-template/.github/workflows/_reusable-deploy-router.yml@v1.0.0
    secrets: {}

  deploy-vercel:
    needs: route
    if: needs.route.outputs.profile == 'nextjs-vercel'
    uses: ./.github/workflows/deploy-vercel.yml
    secrets: inherit
```

**Step 3: Create the reusable workflow and validate**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/_reusable-deploy-router.yml'))"
git add .github/workflows/_reusable-deploy-router.yml
git commit -m "feat: add _reusable-deploy-router.yml"
```

---

### Task 8: Create `_reusable-arch-approve.yml`

**Files:**
- Read: `.github/workflows/architecture-approve.yml`
- Create: `.github/workflows/_reusable-arch-approve.yml`

**Step 1: Read architecture-approve.yml**

Processes `/approve-architecture` comments. Checks write access, swaps labels, dispatches prd-decomposer.

**Step 2: Create the reusable workflow**

```yaml
name: "[Reusable] Pipeline Architecture Approve"

on:
  workflow_call:
    inputs:
      pipeline_app_id:
        type: string
        required: false
        default: ""
      comment_body:
        type: string
        required: true
      comment_user_login:
        type: string
        required: true
      issue_number:
        type: number
        required: true
      issue_labels:
        type: string
        required: true
        description: "JSON array of label objects"
      is_pull_request:
        type: boolean
        required: false
        default: false
    secrets:
      PIPELINE_APP_PRIVATE_KEY:
        required: false
      GH_AW_GITHUB_TOKEN:
        required: false
```

Copy job logic. No script dependencies — this workflow is pure `gh` CLI calls.

**Step 3: Validate and commit**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/_reusable-arch-approve.yml'))"
git add .github/workflows/_reusable-arch-approve.yml
git commit -m "feat: add _reusable-arch-approve.yml"
```

---

### Task 9: Create `_reusable-close-issues.yml`

**Files:**
- Read: `.github/workflows/close-issues.yml`
- Create: `.github/workflows/_reusable-close-issues.yml`

**Step 1: Read close-issues.yml**

Simplest workflow. Parses PR body for `Closes #N`/`Fixes #N` and closes matching issues. Uses only `GITHUB_TOKEN`.

**Step 2: Create the reusable workflow**

```yaml
name: "[Reusable] Pipeline Close Linked Issues"

on:
  workflow_call:
    inputs:
      pr_number:
        type: number
        required: true
      pr_merged:
        type: boolean
        required: true
    secrets: {}
```

Copy job logic — early exit if `!inputs.pr_merged`, then parse PR body and close issues.

**Step 3: Validate and commit**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/_reusable-close-issues.yml'))"
git add .github/workflows/_reusable-close-issues.yml
git commit -m "feat: add _reusable-close-issues.yml"
```

---

## Phase 2: Copier Template

Create the `template/` directory with `copier.yml` config and Jinja templates for all files that get installed into target repos.

Note: maintenance stays local. `gh aw compile` already generates `agentics-maintenance.yml` from the installed agent definitions, so this phase does **not** create a `pipeline-maintenance.yml.jinja` thin caller.

### Task 10: Create `template/copier.yml`

**Files:**
- Create: `template/copier.yml`

**Step 1: Write the Copier config**

Use the `copier.yml` spec from the design doc. Key additions beyond the design doc draft:
- `_min_copier_version: "9.0.0"`
- `_subdirectory: template` — tells Copier the template files are in `template/`
- `_vcs_ref` — auto-populated by Copier with the git tag
- Questions: `project_name`, `app_directory`, `sensitive_directories`, `deploy_profile`, `auth_method`, `template_repo`, `template_ref`, `existing_ci_workflow`

**Step 2: Validate Copier config**

Run: `python3 -c "import yaml; yaml.safe_load(open('template/copier.yml'))"`

**Step 3: Commit**

```bash
git add template/copier.yml
git commit -m "feat: add Copier template config"
```

---

### Task 11: Create thin caller Jinja templates (9 workflows)

**Files:**
- Create: `template/.github/workflows/pipeline-dispatch.yml.jinja`
- Create: `template/.github/workflows/pipeline-dispatch-requeue.yml.jinja`
- Create: `template/.github/workflows/pipeline-review-submit.yml.jinja`
- Create: `template/.github/workflows/pipeline-watchdog.yml.jinja`
- Create: `template/.github/workflows/pipeline-ci-failure.yml.jinja`
- Create: `template/.github/workflows/pipeline-ci-resolve.yml.jinja`
- Create: `template/.github/workflows/pipeline-deploy-router.yml.jinja`
- Create: `template/.github/workflows/pipeline-arch-approve.yml.jinja`
- Create: `template/.github/workflows/pipeline-close-issues.yml.jinja`

**Step 1: Create each thin caller template**

Each follows the same pattern — Jinja injects `{{ template_repo }}` and `{{ template_ref }}`, while GitHub Actions expressions use `{% raw %}...{% endraw %}` to prevent Jinja from interpreting them.

Example for `pipeline-dispatch.yml.jinja`:

```yaml
name: Pipeline Auto-Dispatch
on:
  issues:
    types: [opened, reopened, labeled]

jobs:
  dispatch:
    uses: {{ template_repo }}/.github/workflows/_reusable-dispatch.yml@{{ template_ref }}
    secrets:
      PIPELINE_APP_PRIVATE_KEY: {% raw %}${{ secrets.PIPELINE_APP_PRIVATE_KEY }}{% endraw %}
      GH_AW_GITHUB_TOKEN: {% raw %}${{ secrets.GH_AW_GITHUB_TOKEN }}{% endraw %}
    with:
      pipeline_app_id: {% raw %}${{ vars.PIPELINE_APP_ID }}{% endraw %}
      healing_enabled: {% raw %}${{ vars.PIPELINE_HEALING_ENABLED }}{% endraw %}
      template_repo: "{{ template_repo }}"
      issue_number: {% raw %}${{ github.event.issue.number }}{% endraw %}
      issue_title: {% raw %}${{ github.event.issue.title }}{% endraw %}
      issue_labels: {% raw %}${{ toJSON(github.event.issue.labels.*.name) }}{% endraw %}
```

Create one per workflow. Each has the correct trigger event, inputs matching the reusable workflow's `workflow_call` interface, and explicit secret forwarding.

**Special cases:**
- `pipeline-dispatch-requeue.yml.jinja` — trigger: `workflow_run` on "Pipeline Repo Assist" completion
- `pipeline-ci-failure.yml.jinja` — trigger: `workflow_run` on CI workflow names. Use `{{ existing_ci_workflow }}` if provided, else default names
- `pipeline-ci-resolve.yml.jinja` — same trigger as ci-failure but on success
- `pipeline-watchdog.yml.jinja` — trigger: `schedule` (cron) + `workflow_dispatch`
- `pipeline-deploy-router.yml.jinja` — trigger: `push` to main. Has conditional local deploy job
- No `pipeline-maintenance.yml.jinja` — maintenance remains the local `agentics-maintenance.yml` generated by `gh aw compile`

**Step 2: Validate all templates are valid Jinja**

Run: `python3 -c "from jinja2 import Environment; env = Environment(); [env.parse(open(f'template/.github/workflows/{f}').read()) for f in __import__('os').listdir('template/.github/workflows/') if f.endswith('.jinja')]"`

**Step 3: Commit**

```bash
git add template/.github/workflows/*.yml.jinja
git commit -m "feat: add thin caller Jinja templates for all 9 pipeline workflows"
```

---

### Task 12: Create agent definition Jinja templates (9 agents)

**Files:**
- Read: `.github/workflows/repo-assist.md` (and all other `.md` agent files)
- Create: `template/.github/workflows/repo-assist.md.jinja`
- Create: `template/.github/workflows/pr-review-agent.md.jinja`
- Create: `template/.github/workflows/prd-decomposer.md.jinja`
- Create: `template/.github/workflows/prd-planner.md.jinja`
- Create: `template/.github/workflows/pipeline-status.md.jinja`
- Create: `template/.github/workflows/ci-doctor.md.jinja`
- Create: `template/.github/workflows/code-simplifier.md.jinja`
- Create: `template/.github/workflows/duplicate-code-detector.md.jinja`
- Create: `template/.github/workflows/security-compliance.md.jinja`

**Step 1: Read each existing agent .md file**

Identify which parts are repo-specific (should use Jinja variables) vs. generic (copy as-is).

**Step 2: Create Jinja-templated versions**

Most agent `.md` files can be copied nearly verbatim. The main Jinja substitutions:
- `{{ project_name }}` in any agent instructions that reference the project
- `{{ app_directory }}` in any path references
- Agent frontmatter stays unchanged (engine, model, triggers, safe-outputs)

Agent `.md` files are gh-aw format — they contain YAML frontmatter + markdown instructions. Jinja should only touch variable values, not the markdown structure.

**Step 3: Commit**

```bash
git add template/.github/workflows/*.md.jinja
git commit -m "feat: add agent definition Jinja templates for all 9 agents"
```

---

### Task 13: Create config file Jinja templates

**Files:**
- Read: `.deploy-profile`, `autonomy-policy.yml`, `AGENTS.md`
- Create: `template/.deploy-profile.jinja`
- Create: `template/autonomy-policy.yml.jinja`
- Create: `template/AGENTS.md.jinja`

**Step 1: Create `.deploy-profile.jinja`**

```
{{ deploy_profile }}
```

**Step 2: Create `autonomy-policy.yml.jinja`**

Template the `allowed_targets` paths using `{{ app_directory }}` and `{{ sensitive_directories }}`. The rest of the policy (actions, rules) stays generic.

**Step 3: Create `AGENTS.md.jinja`**

Template with `{{ project_name }}`, `{{ app_directory }}`, `{{ deploy_profile }}`. This file describes the codebase to agents — users will customize it heavily, so keep the template minimal and clearly mark sections for customization.

**Step 4: Commit**

```bash
git add template/.deploy-profile.jinja template/autonomy-policy.yml.jinja template/AGENTS.md.jinja
git commit -m "feat: add config file Jinja templates"
```

---

## Phase 3: gh Extension

Build the `gh-pipeline` shell extension with subcommands: `install`, `upgrade`, `verify`, `status`, `pause`, `resume`, `disable`, `enable`, `uninstall`.

### Task 14: Create extension entry point and utils

**Files:**
- Create: `gh-pipeline/gh-pipeline` (shell script, executable)
- Create: `gh-pipeline/lib/utils.sh`

**Step 1: Create the entry point**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"

# shellcheck source=lib/utils.sh
source "$LIB_DIR/utils.sh"

COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
  install)   source "$LIB_DIR/install.sh" && pipeline_install "$@" ;;
  upgrade)   source "$LIB_DIR/upgrade.sh" && pipeline_upgrade "$@" ;;
  verify)    source "$LIB_DIR/verify.sh" && pipeline_verify "$@" ;;
  status)    source "$LIB_DIR/status.sh" && pipeline_status "$@" ;;
  pause)     source "$LIB_DIR/pause.sh" && pipeline_pause "$@" ;;
  resume)    source "$LIB_DIR/resume.sh" && pipeline_resume "$@" ;;
  disable)   source "$LIB_DIR/disable.sh" && pipeline_disable "$@" ;;
  enable)    source "$LIB_DIR/enable.sh" && pipeline_enable "$@" ;;
  uninstall) source "$LIB_DIR/uninstall.sh" && pipeline_uninstall "$@" ;;
  help|-h|--help) usage ;;
  *) echo "Unknown command: $COMMAND" >&2; usage; exit 1 ;;
esac
```

**Step 2: Create `lib/utils.sh`**

Shared helpers:
- `check_prerequisites` — verify base requirements: `gh`, `git`, `gh auth status`
- `ensure_copier` — install copier via `pipx install copier` if missing
- `ensure_gh_aw` — install gh-aw extension if missing
- `check_toolchain` — verify `copier` and `gh aw` are available after the `ensure_*` steps
- `get_repo_info` — parse `gh repo view --json owner,name`
- `log_info`, `log_warn`, `log_error` — colored output helpers
- `TEMPLATE_REPO` constant — default central repo path

**Step 3: Make entry point executable and commit**

```bash
chmod +x gh-pipeline/gh-pipeline
git add gh-pipeline/gh-pipeline gh-pipeline/lib/utils.sh
git commit -m "feat: add gh-pipeline extension entry point and utils"
```

---

### Task 15: Implement `gh pipeline install`

**Files:**
- Create: `gh-pipeline/lib/install.sh`

**Step 1: Write the install function**

```bash
pipeline_install() {
  local migrate=false
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --migrate) migrate=true; shift ;;
      *) log_error "Unknown flag: $1"; exit 1 ;;
    esac
  done

  check_prerequisites
  ensure_copier
  ensure_gh_aw
  check_toolchain

  # Step 1: Detect existing pipeline (for --migrate)
  if $migrate; then
    detect_existing_pipeline
  fi

  # Step 2: Snapshot any pre-existing managed paths so uninstall can avoid them
  capture_preinstall_state

  # Step 3: Run Copier
  log_info "Running Copier to generate pipeline files..."
  copier copy --trust \
    "gh:${TEMPLATE_REPO}" \
    . \
    --vcs-ref "${TEMPLATE_REF:-$(get_latest_version)}"

  # Step 4: Configure secrets
  configure_auth

  # Step 5: Configure deploy secrets (if applicable)
  configure_deploy_secrets

  # Step 6: Bootstrap (labels, compile, repo-memory, auto-merge)
  bootstrap

  # Step 7: Record exactly which files/workflows/secrets were installed
  write_install_state

  # Step 8: Verify
  pipeline_verify
}
```

**Step 2: Implement helper functions**

- `get_latest_version` — `gh release view --repo "$TEMPLATE_REPO" --json tagName -q .tagName`
- `configure_auth` — interactive prompt for GitHub App vs PAT (reuse logic from `setup.sh`)
- `configure_deploy_secrets` — conditional on deploy_profile choice
- `bootstrap` — adapted from `scripts/bootstrap.sh` (create labels, compile workflows, seed memory, enable auto-merge)
- `detect_existing_pipeline` — for `--migrate` mode, find and rename old pipeline workflows
- `capture_preinstall_state` — record which managed target paths already existed before install
- `write_install_state` — write `.pipeline-install-state.json` with `created_files`, `managed_workflows`, `managed_secrets`, `managed_variables`, and any pre-existing shared files that must be preserved on uninstall

**Step 3: Commit**

```bash
git add gh-pipeline/lib/install.sh
git commit -m "feat: implement gh pipeline install"
```

---

### Task 16: Implement `gh pipeline upgrade`

**Files:**
- Create: `gh-pipeline/lib/upgrade.sh`

**Step 1: Write the upgrade function**

```bash
pipeline_upgrade() {
  check_prerequisites
  ensure_copier
  ensure_gh_aw
  check_toolchain

  # Check .copier-answers.yml exists
  if [ ! -f .copier-answers.yml ]; then
    log_error "No .copier-answers.yml found. Run 'gh pipeline install' first."
    exit 1
  fi

  local current_version
  current_version=$(grep '_commit:' .copier-answers.yml | awk '{print $2}')
  local latest_version
  latest_version=$(get_latest_version)

  if [ "$current_version" = "$latest_version" ]; then
    log_info "Already at latest version ($current_version). Nothing to upgrade."
    exit 0
  fi

  # Show changelog
  log_info "Upgrading from $current_version to $latest_version"
  log_info "Changelog:"
  gh api "repos/${TEMPLATE_REPO}/compare/${current_version}...${latest_version}" \
    --jq '.commits[] | "  - " + .commit.message' 2>/dev/null || true

  # Run Copier update (3-way merge)
  copier update --trust --vcs-ref "$latest_version"

  # Re-compile agent workflows
  log_info "Re-compiling agent workflows..."
  gh aw compile

  # Refresh installer state in case managed files changed between versions
  write_install_state --refresh

  # Verify
  pipeline_verify
}
```

**Step 2: Commit**

```bash
git add gh-pipeline/lib/upgrade.sh
git commit -m "feat: implement gh pipeline upgrade"
```

---

### Task 17: Implement `gh pipeline verify`

**Files:**
- Create: `gh-pipeline/lib/verify.sh`

**Step 1: Write the verify function**

Adapt logic from `setup-verify.sh`. Check:
1. Prerequisites (gh, gh-aw, copier)
2. Config files exist (`.deploy-profile`, `autonomy-policy.yml`, `AGENTS.md`)
3. Thin callers exist (all `pipeline-*.yml` files)
4. Compiled agent `.lock.yml` files exist
5. Required labels present
6. Auth configured (App ID + Key, or PAT)
7. Deploy secrets (conditional on profile)
8. Auto-merge enabled
9. Repo-memory branch exists
10. `.copier-answers.yml` exists and has valid version
11. `.pipeline-install-state.json` exists and every `managed_workflows` path resolves to an installed workflow

**Step 2: Commit**

```bash
git add gh-pipeline/lib/verify.sh
git commit -m "feat: implement gh pipeline verify"
```

---

### Task 18: Implement `gh pipeline pause/resume`

**Files:**
- Create: `gh-pipeline/lib/pause.sh`
- Create: `gh-pipeline/lib/resume.sh`

**Step 1: Write pause**

```bash
pipeline_pause() {
  log_info "Pausing self-healing (auto-dispatch, CI repair, watchdog)..."
  log_warn "Note: PR review and CI detection still run. Use 'gh pipeline disable' for full stop."
  gh variable set PIPELINE_HEALING_ENABLED --body "false"
  log_info "Self-healing paused."
}
```

**Step 2: Write resume**

```bash
pipeline_resume() {
  log_info "Resuming self-healing..."
  gh variable set PIPELINE_HEALING_ENABLED --body "true"
  log_info "Self-healing resumed."
}
```

**Step 3: Commit**

```bash
git add gh-pipeline/lib/pause.sh gh-pipeline/lib/resume.sh
git commit -m "feat: implement gh pipeline pause/resume"
```

---

### Task 19: Implement `gh pipeline disable/enable`

**Files:**
- Create: `gh-pipeline/lib/disable.sh`
- Create: `gh-pipeline/lib/enable.sh`

**Step 1: Write disable**

```bash
pipeline_disable() {
  log_warn "This will disable ALL pipeline workflows. No pipeline automation will run."
  read -r -p "Continue? (y/N) " confirm
  [ "$confirm" = "y" ] || exit 0

  if [ ! -f .pipeline-install-state.json ]; then
    log_error "No .pipeline-install-state.json found. Refusing to guess which workflows to disable."
    exit 1
  fi

  log_info "Disabling all pipeline workflows..."

  while IFS= read -r workflow_path; do
    [ -n "$workflow_path" ] || continue
    local wf_id
    wf_id=$(gh workflow list --json path,id -q ".[] | select(.path == \"$workflow_path\") | .id")
    [ -n "$wf_id" ] && gh workflow disable "$wf_id" 2>/dev/null || true
  done < <(python3 - <<'PY'
import json
with open(".pipeline-install-state.json") as fh:
    for path in json.load(fh).get("managed_workflows", []):
        print(path)
PY
)

  log_info "All pipeline workflows disabled."
}
```

**Step 2: Write enable (reverse of disable)**

Same logic and same `.pipeline-install-state.json` lookup as disable, but uses `gh workflow enable`.

**Step 3: Commit**

```bash
git add gh-pipeline/lib/disable.sh gh-pipeline/lib/enable.sh
git commit -m "feat: implement gh pipeline disable/enable"
```

---

### Task 20: Implement `gh pipeline status`

**Files:**
- Create: `gh-pipeline/lib/status.sh`

**Step 1: Write status function**

Show pipeline health dashboard:
- Installed version (from `.copier-answers.yml`)
- Latest available version
- Healing status (`PIPELINE_HEALING_ENABLED`)
- Open pipeline issues count
- Open pipeline PRs count
- Recent workflow run statuses (last 5 runs of each pipeline workflow)
- Any stalled items (PRs open >2h with no review, issues labeled `in-progress` >4h)

**Step 2: Commit**

```bash
git add gh-pipeline/lib/status.sh
git commit -m "feat: implement gh pipeline status"
```

---

### Task 21: Implement `gh pipeline uninstall`

**Files:**
- Create: `gh-pipeline/lib/uninstall.sh`

**Step 1: Write uninstall function**

```bash
pipeline_uninstall() {
  log_warn "This will remove installer-created pipeline files plus installer-managed secrets and variables from this repo."
  read -r -p "Type 'uninstall' to confirm: " confirm
  [ "$confirm" = "uninstall" ] || exit 0

  if [ ! -f .pipeline-install-state.json ]; then
    log_error "No .pipeline-install-state.json found. Refusing broad uninstall because the repo may contain user-owned gh-aw files."
    exit 1
  fi

  # Remove only installer-created files. Pre-existing files that were merged into
  # the install stay untouched.
  while IFS= read -r path; do
    [ -n "$path" ] || continue
    [ "$path" = ".pipeline-install-state.json" ] && continue
    rm -f "$path"
  done < <(python3 - <<'PY'
import json
with open(".pipeline-install-state.json") as fh:
    for path in json.load(fh).get("created_files", []):
        print(path)
PY
)

  # Remove only installer-managed secrets and variables.
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    gh secret delete "$name" 2>/dev/null || true
  done < <(python3 - <<'PY'
import json
with open(".pipeline-install-state.json") as fh:
    for name in json.load(fh).get("managed_secrets", []):
        print(name)
PY
)

  while IFS= read -r name; do
    [ -n "$name" ] || continue
    gh variable delete "$name" 2>/dev/null || true
  done < <(python3 - <<'PY'
import json
with open(".pipeline-install-state.json") as fh:
    for name in json.load(fh).get("managed_variables", []):
        print(name)
PY
)

  rm -f .pipeline-install-state.json

  log_info "Installer-created pipeline assets removed. Any pre-existing or user-customized shared files were left in place."
}
```

**Step 2: Commit**

```bash
git add gh-pipeline/lib/uninstall.sh
git commit -m "feat: implement gh pipeline uninstall"
```

---

## Phase 4: Testing & Verification

### Task 22: Test Copier template generation locally

**Step 1: Create a test directory and run Copier**

```bash
mkdir /tmp/test-pipeline-install
cd /tmp/test-pipeline-install
git init

copier copy --trust /path/to/prd-to-prod-template/template . \
  --data project_name=test-project \
  --data app_directory=src \
  --data sensitive_directories=auth,payments \
  --data deploy_profile=nextjs-vercel \
  --data auth_method=github-app \
  --data template_repo=yourorg/prd-to-prod-template \
  --data template_ref=v1.0.0 \
  --data existing_ci_workflow=""
```

**Step 2: Verify generated files**

- All 9 `pipeline-*.yml` thin callers exist
- All 9 agent `.md` files exist
- `.deploy-profile` contains `nextjs-vercel`
- `autonomy-policy.yml` has correct paths
- `AGENTS.md` has project name
- `.copier-answers.yml` records all answers
- No Jinja syntax (`{{`, `{%`) remains in generated files
- All YAML files parse cleanly

**Step 3: Verify generated callers reference correct repo and version**

```bash
grep -r "yourorg/prd-to-prod-template" .github/workflows/pipeline-*.yml
grep -r "@v1.0.0" .github/workflows/pipeline-*.yml
```

Expected: Every thin caller references the correct repo and exact version.

**Step 4: Clean up**

```bash
rm -rf /tmp/test-pipeline-install
```

---

### Task 23: Test Copier upgrade (3-way merge)

**Step 1: Generate from v1.0.0, then simulate v1.1.0 upgrade**

This requires creating two version tags in the template repo. For local testing:

```bash
# Generate initial install
cd /tmp/test-pipeline-install
copier copy --trust /path/to/template . --vcs-ref v1.0.0

# Make a "user customization" (modify AGENTS.md)
echo "# My custom build commands" >> AGENTS.md
git add -A && git commit -m "initial install + customization"

# Simulate upgrade
copier update --trust --vcs-ref v1.1.0
```

**Step 2: Verify user customization is preserved**

```bash
grep "My custom build commands" AGENTS.md
```

Expected: User's addition is preserved after upgrade.

**Step 3: Verify version pins are updated**

```bash
grep "@v1.1.0" .github/workflows/pipeline-*.yml
```

Expected: All callers now reference `v1.1.0`.

---

### Task 24: Test gh extension locally

**Step 1: Install extension from local path**

```bash
cd /path/to/prd-to-prod-template
gh extension install ./gh-pipeline
```

**Step 2: Verify subcommands**

```bash
gh pipeline help
gh pipeline verify  # Should fail (no install yet)
```

**Step 3: Test install on a scratch repo**

Create a temporary test repo on GitHub and run:

```bash
gh repo create test-pipeline-install --private --clone
cd test-pipeline-install
echo "# Test" > README.md && git add . && git commit -m "init" && git push

gh pipeline install
gh pipeline verify
gh pipeline status
gh pipeline pause
gh pipeline resume
gh pipeline enable
gh pipeline disable
gh pipeline uninstall
```

**Step 4: Clean up**

```bash
gh repo delete test-pipeline-install --yes
```

---

### Task 25: Create initial version tag

**Step 1: Tag the release**

After all reusable workflows and template are in place:

```bash
git tag -a v1.0.0 -m "v1.0.0: Initial installable pipeline distribution"
git push origin v1.0.0
```

**Step 2: Create GitHub release**

```bash
gh release create v1.0.0 --title "v1.0.0: Installable Pipeline" --notes "$(cat <<'EOF'
First release of the installable pipeline distribution.

## Install

```bash
gh extension install yourorg/gh-pipeline
gh pipeline install
```

## What's included

- 9 centralized reusable workflows
- 9 thin caller templates (Copier/Jinja)
- 9 agent definition templates
- Config file templates (autonomy-policy, deploy-profile, AGENTS.md)
- gh extension with install/upgrade/verify/status/pause/resume/disable/enable/uninstall
EOF
)"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| **Phase 1** | Tasks 1-9 | Create 9 `_reusable-*.yml` workflows with `workflow_call`, explicit secrets, `workflow_sha` script checkout |
| **Phase 2** | Tasks 10-13 | Create Copier `template/` directory with `copier.yml`, 9 thin caller Jinja templates, 9 agent Jinja templates, 3 config Jinja templates |
| **Phase 3** | Tasks 14-21 | Build `gh-pipeline` extension with 9 subcommands |
| **Phase 4** | Tasks 22-25 | Test template generation, 3-way merge upgrade, extension commands, create initial release |
