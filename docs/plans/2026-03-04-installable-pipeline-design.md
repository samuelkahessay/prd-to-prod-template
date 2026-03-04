# Installable Pipeline Distribution

**Date**: 2026-03-04
**Status**: Draft
**Goal**: Enable installing the prd-to-prod pipeline onto any existing GitHub repo — with or without existing workflows — and support upgrades over time.

---

## Problem

The prd-to-prod pipeline currently ships as a GitHub template repo. GitHub templates only work at repo creation time — they snapshot files into a new repo with no ongoing relationship. There is no way to:

1. **Install onto an existing repo** that already has code, CI, or workflows
2. **Upgrade** when the pipeline evolves (new agents, bug fixes, workflow improvements)
3. **Handle conflicts** with existing workflows that use the same trigger events

Teams with existing repos have to manually copy workflow files, scripts, and configs — a process that's error-prone, undocumented, and breaks on the first upstream change.

## Solution

A **gh CLI extension** (`gh pipeline`) backed by **Copier** (template engine) and **GitHub reusable workflows** (centralized logic). Three layers working together:

| Layer | Tool | What it does |
|-------|------|-------------|
| **Core pipeline logic** | Centralized reusable workflows in this template repo | Dispatch, review, watchdog, CI repair, deploy routing — all run from the central repo via `workflow_call` |
| **Installation & config** | Copier template engine | Lays down thin caller workflows, agent definitions, config files. Tracks versions. Handles 3-way merge on upgrades |
| **User interface** | `gh extension` (`gh-pipeline`) | Wraps Copier + setup wizard into `gh pipeline install`, `gh pipeline upgrade`, `gh pipeline verify` |

## Architecture

### What lives where

```
prd-to-prod-template (central repo)
├── .github/workflows/
│   ├── _reusable-dispatch.yml          ← workflow_call (core logic)
│   ├── _reusable-dispatch-requeue.yml  ← workflow_call
│   ├── _reusable-review-submit.yml     ← workflow_call
│   ├── _reusable-watchdog.yml          ← workflow_call
│   ├── _reusable-ci-failure.yml        ← workflow_call
│   ├── _reusable-ci-resolve.yml        ← workflow_call
│   ├── _reusable-deploy-router.yml     ← workflow_call
│   ├── _reusable-arch-approve.yml      ← workflow_call
│   ├── _reusable-close-issues.yml      ← workflow_call
│   └── ... (existing workflows still work for the template itself)
├── scripts/                             ← used by reusable workflows at runtime
├── template/                            ← Copier template directory (NEW)
│   ├── copier.yml                       ← template config + questions
│   ├── .github/workflows/
│   │   ├── pipeline-dispatch.yml.jinja
│   │   ├── pipeline-dispatch-requeue.yml.jinja
│   │   ├── pipeline-review-submit.yml.jinja
│   │   ├── pipeline-watchdog.yml.jinja
│   │   ├── pipeline-ci-failure.yml.jinja
│   │   ├── pipeline-ci-resolve.yml.jinja
│   │   ├── pipeline-deploy-router.yml.jinja
│   │   ├── pipeline-arch-approve.yml.jinja
│   │   ├── pipeline-close-issues.yml.jinja
│   │   ├── pipeline-maintenance.yml.jinja
│   │   ├── repo-assist.md.jinja         ← core agent definitions
│   │   ├── pr-review-agent.md.jinja
│   │   ├── prd-decomposer.md.jinja
│   │   ├── prd-planner.md.jinja
│   │   ├── pipeline-status.md.jinja
│   │   ├── ci-doctor.md.jinja
│   │   ├── code-simplifier.md.jinja
│   │   ├── duplicate-code-detector.md.jinja
│   │   └── security-compliance.md.jinja
│   ├── {% if deploy_profile == 'nextjs-vercel' %}ci-node.yml{% endif %}.jinja
│   ├── .deploy-profile.jinja
│   ├── autonomy-policy.yml.jinja
│   └── AGENTS.md.jinja
└── gh-pipeline/                         ← gh extension source (NEW)
    ├── gh-pipeline                       ← shell extension entry point
    └── lib/
        ├── install.sh
        ├── upgrade.sh
        ├── verify.sh
        └── utils.sh
```

```
target-repo (after installation)
├── .github/workflows/
│   ├── pipeline-dispatch.yml            ← thin caller (~15 lines)
│   ├── pipeline-dispatch-requeue.yml    ← thin caller
│   ├── pipeline-review-submit.yml       ← thin caller
│   ├── pipeline-watchdog.yml            ← thin caller
│   ├── pipeline-ci-failure.yml          ← thin caller
│   ├── pipeline-ci-resolve.yml          ← thin caller
│   ├── pipeline-deploy-router.yml       ← thin caller
│   ├── pipeline-arch-approve.yml        ← thin caller
│   ├── pipeline-close-issues.yml        ← thin caller
│   ├── pipeline-maintenance.yml         ← thin caller
│   ├── repo-assist.md                   ← agent definitions (local)
│   ├── repo-assist.lock.yml             ← compiled by gh aw
│   ├── pr-review-agent.md
│   ├── pr-review-agent.lock.yml
│   ├── prd-decomposer.md
│   ├── prd-decomposer.lock.yml
│   ├── prd-planner.md                   ← planning layer
│   ├── prd-planner.lock.yml
│   ├── pipeline-status.md               ← operator/maintenance layer
│   ├── pipeline-status.lock.yml
│   ├── ci-doctor.md
│   ├── ci-doctor.lock.yml
│   ├── code-simplifier.md
│   ├── code-simplifier.lock.yml
│   ├── duplicate-code-detector.md
│   ├── duplicate-code-detector.lock.yml
│   ├── security-compliance.md
│   ├── security-compliance.lock.yml
│   ├── existing-ci.yml                  ← untouched (user's own)
│   └── existing-deploy.yml              ← untouched
├── .deploy-profile
├── autonomy-policy.yml
├── AGENTS.md
├── .copier-answers.yml                  ← Copier version tracking
└── ... (user's existing code, untouched)
```

### Thin caller pattern

Each thin caller workflow in the target repo is ~15 lines. It declares the trigger event and forwards to the central reusable workflow:

```yaml
# pipeline-dispatch.yml (in target repo)
name: Pipeline Auto-Dispatch
on:
  issues:
    types: [opened, reopened, labeled]

jobs:
  dispatch:
    uses: yourorg/prd-to-prod-template/.github/workflows/_reusable-dispatch.yml@v1
    secrets:
      PIPELINE_APP_PRIVATE_KEY: ${{ secrets.PIPELINE_APP_PRIVATE_KEY }}
      GH_AW_GITHUB_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}
    with:
      pipeline_app_id: ${{ vars.PIPELINE_APP_ID }}
      healing_enabled: ${{ vars.PIPELINE_HEALING_ENABLED }}
      issue_number: ${{ github.event.issue.number }}
```

All logic — classification, debounce, healing gates, concurrency — lives in the reusable workflow. Target repos never touch it. Secrets are passed explicitly (not via `inherit`) to support cross-org installs.

### Reusable workflow design

Each `_reusable-*.yml` workflow:

- Triggers on `workflow_call` with typed inputs and **explicitly declared secrets** (not `secrets: inherit` — see Auth Model below)
- Checks out its own repo (the template) for script access
- Uses `actions/create-github-app-token@v1` with secrets passed explicitly from the caller
- Runs the same logic currently in the standalone workflows

GitHub supports up to 10 levels of reusable workflow nesting, so `_reusable-deploy-router.yml` can call `_reusable-deploy-vercel.yml` if needed.

### Auth model for cross-org installs

**Constraint**: `secrets: inherit` only works when the caller and callee are in the **same organization or enterprise**. Since we want to support installs onto any GitHub repo regardless of org, we cannot rely on `secrets: inherit`.

**Solution**: Explicit secret forwarding. Each reusable workflow declares the secrets it needs as typed `workflow_call` inputs. The thin callers pass them explicitly:

```yaml
# Thin caller in target repo
jobs:
  dispatch:
    uses: yourorg/prd-to-prod-template/.github/workflows/_reusable-dispatch.yml@v1
    secrets:
      PIPELINE_APP_PRIVATE_KEY: ${{ secrets.PIPELINE_APP_PRIVATE_KEY }}
      GH_AW_GITHUB_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}
    with:
      pipeline_app_id: ${{ vars.PIPELINE_APP_ID }}
      healing_enabled: ${{ vars.PIPELINE_HEALING_ENABLED }}
      issue_number: ${{ github.event.issue.number }}
```

```yaml
# Reusable workflow in central repo
on:
  workflow_call:
    inputs:
      pipeline_app_id:
        type: string
        required: false
      healing_enabled:
        type: string
        required: false
      issue_number:
        type: number
        required: true
    secrets:
      PIPELINE_APP_PRIVATE_KEY:
        required: false
      GH_AW_GITHUB_TOKEN:
        required: false
```

This works across orgs because the caller explicitly passes each secret — no `inherit` shortcut needed.

**Central repo must be public.** Private reusable workflows can only be called by repos in the same org/enterprise. Since we want cross-org installs, the central template repo must be public. This is acceptable because:
- The pipeline logic is not proprietary — it's the template's value proposition
- Secrets never live in the central repo — they're always in the target repo
- Agent `.md` files (which contain repo-specific knowledge) stay local

### What stays local (and why)

| File | Why local |
|------|-----------|
| Agent `.md` files (all 9: repo-assist, pr-review-agent, prd-decomposer, prd-planner, pipeline-status, ci-doctor, code-simplifier, duplicate-code-detector, security-compliance) | Agents read repo-specific context (AGENTS.md, codebase). Must be compiled locally by `gh aw compile`. Users may customize agent instructions. |
| `AGENTS.md` | Describes the target repo's codebase, build commands, coding standards. Completely repo-specific. |
| `autonomy-policy.yml` | Defines what agents can/can't do. Varies by repo (sensitive dirs, app structure). |
| `.deploy-profile` | Points to the repo's deployment target. |
| CI workflows (ci-node, ci-studio) | Stack-specific. The installer offers templates for common stacks but users may bring their own. |
| Deploy workflows (deploy-vercel) | Stack-specific. Same as CI. |

### What lives centrally (and why)

| Workflow | Why central |
|----------|-------------|
| Auto-dispatch | Pure pipeline orchestration. No repo-specific logic. |
| Auto-dispatch requeue | Same. |
| PR review submit | Parses verdict comments, submits reviews. Generic. |
| Pipeline watchdog | Monitors stall conditions. Generic health check. |
| CI failure issue | Routes CI failures to repair. Generic. |
| CI failure resolve | Marks repairs as resolved. Generic. |
| Deploy router | Reads `.deploy-profile` and dispatches. Generic routing. |
| Architecture approve | Processes `/approve-architecture` comments. Generic. |
| Close linked issues | Parses PR body for `Closes #N`. Generic. |

## User Experience

### First-time install

```bash
# Install the gh extension (once)
gh extension install yourorg/gh-pipeline

# Run from any existing repo
cd my-existing-repo
gh pipeline install
```

The install command:

1. **Checks prerequisites**: `gh`, `git`, `gh-aw`, `gh auth`
2. **Runs Copier**: Prompts for configuration (app directory, sensitive dirs, deploy profile, auth method)
3. **Lays down files**: Thin callers, agent definitions, configs — all namespaced with `pipeline-` prefix
4. **Configures secrets**: GitHub App or PAT, deploy secrets (Vercel, etc.)
5. **Bootstraps**: Creates labels, compiles agent workflows, seeds repo memory, enables auto-merge
6. **Verifies**: Runs the equivalent of `setup-verify.sh`
7. **Writes `.copier-answers.yml`**: Records template version + user answers for future upgrades

### Upgrade

```bash
gh pipeline upgrade
```

This runs `copier update` under the hood:

1. Fetches the latest template version from the central repo
2. Performs a **3-way merge**: old template vs. new template vs. user's current files
3. Shows a diff of what will change
4. Applies changes, preserving user customizations
5. Re-compiles agent workflows if `.md` files changed
6. Updates `.copier-answers.yml`

### Verify

```bash
gh pipeline verify
```

Runs the same checks as `setup-verify.sh` — prerequisites, configs, compiled workflows, labels, auth, repo settings. Returns exit 0 if healthy.

### Other commands

```bash
gh pipeline status          # Show pipeline health (stalled PRs, pending issues, etc.)
gh pipeline pause           # Pause self-healing (auto-dispatch, CI repair, watchdog)
gh pipeline resume          # Resume self-healing
gh pipeline disable         # Disable ALL installed pipeline workflows (callers + agents)
gh pipeline enable          # Re-enable ALL installed pipeline workflows
gh pipeline uninstall       # Remove all pipeline files and secrets (with confirmation)
```

**`pause` vs `disable` distinction:**
- `gh pipeline pause` sets `PIPELINE_HEALING_ENABLED=false`. This only pauses the self-healing loop (auto-dispatch, CI repair routing, watchdog stall detection). PR review submission and CI failure detection still run — they just don't trigger automated remediation. Use this during planned maintenance windows.
- `gh pipeline disable` uses the GitHub API to disable every workflow installed and managed by the template: all `pipeline-*` thin callers plus all compiled `*.lock.yml` agent workflows. Nothing in the pipeline lane runs until `gh pipeline enable` reverses that state. Use this as an emergency stop.

## Conflict Handling

### Namespace strategy

All pipeline workflows use the `pipeline-` prefix:

| Current name | Installed name |
|-------------|----------------|
| `auto-dispatch.yml` | `pipeline-dispatch.yml` |
| `pr-review-submit.yml` | `pipeline-review-submit.yml` |
| `pipeline-watchdog.yml` | `pipeline-watchdog.yml` (already namespaced) |
| `ci-failure-issue.yml` | `pipeline-ci-failure.yml` |
| etc. | etc. |

This means a repo can have its own `deploy.yml`, `ci.yml`, or even `auto-dispatch.yml` without conflicts. The pipeline lives in its own namespace.

### Trigger overlap

Even with namespacing, two workflows can listen to the same event (e.g., `issues:labeled`). GitHub runs both — this is fine. The pipeline workflows filter for `pipeline` label, so they won't interfere with user workflows that trigger on other labels.

The only real risk is `pull_request:closed` (close-issues) and `push` to `main` (deploy-router). If the user has workflows on these triggers, they'll both run. The installer warns about this during setup.

### Existing CI/deploy

The installer detects existing CI and deploy workflows:

- If the user already has CI: skip installing `ci-node.yml` / `ci-studio.yml`. The pipeline's CI failure detection (`pipeline-ci-failure.yml`) needs to know the CI workflow name — the installer prompts for it.
- If the user already has deploy: skip installing `deploy-vercel.yml`. Configure `pipeline-deploy-router.yml` to call the user's deploy workflow or skip deploy routing entirely.

## Copier Template Design

### `copier.yml` (template config)

```yaml
_min_copier_version: "9.0.0"
_subdirectory: template

# Questions asked during install
project_name:
  type: str
  help: "Your project name (used in workflow names and labels)"
  default: "{{ _project_dir }}"

app_directory:
  type: str
  help: "Where your application source code lives"
  default: "src"

sensitive_directories:
  type: str
  help: "Comma-separated sensitive dirs (e.g., auth,payments)"
  default: "auth,compliance,payments"

deploy_profile:
  type: str
  help: "Deployment target"
  choices:
    - nextjs-vercel
    - docker-generic
    - dotnet-azure
    - none
  default: "none"

auth_method:
  type: str
  help: "Pipeline authentication method"
  choices:
    - github-app
    - pat
  default: "github-app"

template_repo:
  type: str
  help: "Central template repo (org/repo format)"
  default: "yourorg/prd-to-prod-template"

template_ref:
  type: str
  help: "Template version to pin to"
  default: "v1"

existing_ci_workflow:
  type: str
  help: "Name of your existing CI workflow (leave empty if none)"
  default: ""
```

### Jinja templates

Each thin caller uses Jinja to inject the correct central repo reference:

```yaml
# pipeline-dispatch.yml.jinja
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
      issue_number: {% raw %}${{ github.event.issue.number }}{% endraw %}
```

## Versioning Strategy

### The coordination problem

The pipeline has two independently versioned surfaces:
1. **Central reusable workflows + scripts** (referenced by `@ref` in thin callers)
2. **Local template files** (thin callers, agent `.md` files, configs — managed by Copier)

If central logic moves independently of local callers, changes that span both layers can break installed repos. For example: a reusable workflow adds a new required input, but the thin caller hasn't been updated to pass it.

### Solution: Pinned versions, coordinated upgrades

**No floating tags.** Both layers pin to the same immutable version tag:

- The template repo uses **exact version tags** (`v1.0.0`, `v1.1.0`, `v2.0.0`)
- Thin callers reference `@v1.0.0` (not `@v1`), so central changes never reach installed repos silently
- `gh pipeline upgrade` updates **both layers atomically**: new thin callers that reference the new central version, plus any new/changed agent definitions and configs
- There is no way for one layer to move without the other

**Version classification:**
- **Patch** (`v1.0.1`): Bug fixes in reusable workflows/scripts only. Thin callers unchanged — but still require `gh pipeline upgrade` to bump the pinned ref.
- **Minor** (`v1.1.0`): New optional features, new agent definitions, new callers. Backward-compatible.
- **Major** (`v2.0.0`): Breaking changes to workflow interfaces. `gh pipeline upgrade` prompts for confirmation and may require re-answering Copier questions.

### Upgrade flow

```
gh pipeline upgrade
  1. Fetch latest version from central repo
  2. Compare against .copier-answers.yml pinned version
  3. Show changelog (commits between old and new version)
  4. Run copier update → new thin callers with updated @ref
  5. Re-compile agent workflows if .md files changed
  6. Run gh pipeline verify
```

Users explicitly opt into every version bump. No silent changes.

### Target repo version tracking

`.copier-answers.yml` records:
- Exact template version used during install (e.g., `v1.2.0`)
- All user answers (app_directory, sensitive_dirs, etc.)
- Copier uses this for 3-way merge on `gh pipeline upgrade`

## Migration Path

### From template fork (existing users)

Users who already forked the template can migrate:

```bash
gh pipeline install --migrate
```

This mode:
1. Detects existing non-namespaced pipeline workflows
2. Renames them to `pipeline-*` prefix
3. Replaces inline logic with thin callers to central reusable workflows
4. Preserves local customizations in agent `.md` files and configs
5. Writes `.copier-answers.yml` so future upgrades work

### From scratch (new users)

New users who haven't forked the template:

```bash
gh pipeline install
```

Standard flow — Copier prompts for config, lays down files, runs setup.

## Script Dependencies

The reusable workflows in the central repo reference scripts that also live in the central repo. When a reusable workflow runs, it executes in the context of the **calling** repo — but can check out the central repo for script access.

Because the thin callers pin reusable workflows to an exact immutable version, the script checkout must use the **exact same commit** as the currently running reusable workflow. It cannot float to `v1` or any other moving ref.

Each reusable workflow that needs scripts includes:

```yaml
steps:
  - name: Resolve pipeline workflow commit
    id: pipeline-ref
    run: echo "sha=${{ github.workflow_sha }}" >> "$GITHUB_OUTPUT"

  - name: Checkout pipeline scripts
    uses: actions/checkout@v4
    with:
      repository: yourorg/prd-to-prod-template
      ref: ${{ steps.pipeline-ref.outputs.sha }}
      sparse-checkout: scripts/
      path: .pipeline-scripts
  - name: Run dispatch logic
    run: .pipeline-scripts/scripts/classify-pipeline-issue.sh
```

`github.workflow_sha` is the commit SHA of the currently running reusable workflow. Checking out scripts at that SHA guarantees that the workflow logic and helper scripts stay in lockstep.

## gh Extension Structure

The `gh-pipeline` extension is a shell-based gh extension:

```
gh-pipeline/
├── gh-pipeline              ← entry point (dispatches subcommands)
├── lib/
│   ├── install.sh           ← copier copy + setup wizard + bootstrap
│   ├── upgrade.sh           ← copier update + re-compile agents
│   ├── verify.sh            ← health checks (mirrors setup-verify.sh)
│   ├── status.sh            ← pipeline health dashboard
│   ├── pause.sh             ← set PIPELINE_HEALING_ENABLED=false (self-healing only)
│   ├── resume.sh            ← set PIPELINE_HEALING_ENABLED=true
│   ├── disable.sh           ← disable all installed pipeline workflows via GitHub API
│   ├── enable.sh            ← re-enable all installed pipeline workflows via GitHub API
│   ├── uninstall.sh         ← remove pipeline files + secrets
│   └── utils.sh             ← shared helpers
└── README.md
```

### Prerequisites

The extension checks for and installs:
- `copier` (Python package — installed via `pipx install copier` if missing)
- `gh-aw` (gh extension — installed via `gh extension install` if missing)

## Resolved Decisions

1. **Central repo must be public.** Private reusable workflows can only be called by repos in the same org/enterprise. Since we want cross-org installs, the central repo is public. Pipeline logic is the template's value proposition, not a secret. Secrets always live in the target repo.

2. **Explicit secret forwarding, not `secrets: inherit`.** Cross-org callers can't use `inherit`. All reusable workflows declare their secret inputs explicitly. Thin callers pass secrets by name. This works across any org boundary.

3. **Pinned exact versions, no floating tags.** Both central workflows and local callers pin to the same immutable tag (e.g., `@v1.2.0`). Upgrades are explicit via `gh pipeline upgrade`. No silent changes.

## Open Questions

1. **Copier dependency**: Copier requires Python. The `gh extension` could vendor a standalone binary or fall back to Docker (`copier` has an official image). Alternatively, implement the template engine in pure shell (loses 3-way merge).

2. **Agent customization boundary**: When users modify agent `.md` files, `copier update` will flag them as conflicts. We need to decide: are agent definitions "user-owned" (Copier skips them on upgrade) or "template-owned" (Copier updates them, user re-applies customizations)?

3. **CI workflow name coupling**: The CI failure detection reusable workflow (`_reusable-ci-failure.yml`) triggers on `workflow_run` with specific workflow names ("Node CI", "Deploy Router"). If the user has different CI workflow names, the reusable workflow won't trigger. Solution: make the trigger names configurable via the thin caller, or use a different detection mechanism.

4. **Rate limiting**: Reusable workflows count against the calling repo's Actions minutes, not the central repo's. This is the correct behavior but should be documented.

## Success Criteria

- A user with an existing GitHub repo can run `gh pipeline install` and have a working autonomous pipeline within 10 minutes
- `gh pipeline upgrade` safely updates pipeline infrastructure without breaking user customizations
- `gh pipeline verify` returns exit 0 after a clean install
- Namespaced workflows (`pipeline-*`) never conflict with existing user workflows
- `gh pipeline upgrade` atomically updates both local callers and central version pins, with no silent breakage between layers
- The full current pipeline (all 9 agents, all orchestration workflows, planning layer, maintenance) is preserved in the installed distribution

## Appendix: Workflow Dependency Graph

```
              Target Repo                          Central Repo
              ───────────                          ────────────
              pipeline-dispatch.yml ──────────→ _reusable-dispatch.yml
                                                    ↓ dispatches
              repo-assist.lock.yml (local)     scripts/classify-pipeline-issue.sh
                     ↓ creates PR                scripts/healing-control.sh
              pipeline-review-submit.yml ─────→ _reusable-review-submit.yml
                     ↓ approves/rejects
              pipeline-close-issues.yml ──────→ _reusable-close-issues.yml
                     ↓ on merge
              pipeline-deploy-router.yml ─────→ _reusable-deploy-router.yml
                                                    ↓ calls
              deploy-vercel.yml (local)        (or user's deploy workflow)

              pipeline-ci-failure.yml ────────→ _reusable-ci-failure.yml
                                                    ↓ uses
                                                scripts/extract-failure-context.sh
                                                scripts/render-ci-repair-command.sh

              pipeline-ci-resolve.yml ────────→ _reusable-ci-resolve.yml

              pipeline-watchdog.yml ──────────→ _reusable-watchdog.yml
                                                    ↓ uses
                                                scripts/pipeline-watchdog.sh

              pipeline-dispatch-requeue.yml ──→ _reusable-dispatch-requeue.yml

              pipeline-arch-approve.yml ──────→ _reusable-arch-approve.yml
```
