# CLAUDE.md

## How this repo works

This is **prd-to-prod-template** — a GitHub template repo for autonomous software pipelines powered by gh-aw (GitHub Agentic Workflows). It serves two purposes:

1. **Template**: Anyone can fork it, run `./setup.sh`, and have a working autonomous pipeline
2. **Landing page**: The repo itself hosts a Next.js landing page at https://prd-to-prod.vercel.app — the pipeline's first customer is itself (meta)

Issues labeled `pipeline` are picked up by the `repo-assist` agent, which implements them, opens PRs, and the review/merge chain handles the rest.

## Our role

We write **design briefs as GitHub issues**, not code. The pipeline agents do the implementation.

- Describe *what* should change and *why*, not *how* (no file paths, no diffs, no implementation details)
- Use clear issue structure: Problem → Solution → Scope → Acceptance Criteria
- Label issues with `feature, pipeline` or `bug, pipeline` so auto-dispatch picks them up
- Acceptance criteria are the contract — the PR review agent verifies against them

**Exception:** `.github/workflows/` changes (pipeline infrastructure) and landing page polish are done directly, not through issues.

## Source repo

This template was extracted from `prd-to-prod` (the source repo). When syncing changes:
- Source: `/Users/skahessay/Documents/Projects/active/prd-to-prod`
- Template: `/Users/skahessay/Documents/Projects/active/prd-to-prod-template`
- Extraction plan: `docs/plans/2026-03-02-template-repo-extraction.md` (all phases complete)

## Landing page

**Stack**: Next.js 16 (App Router), CSS Modules, GSAP, Canvas API, Vercel
**Live**: https://prd-to-prod.vercel.app (custom alias) and https://prd-to-prod-template.vercel.app
**Design doc**: `docs/plans/2026-03-03-landing-page-design.md`

### Key files
- `src/app/layout.tsx` — Root layout, Inter + Instrument Serif fonts via `next/font/google`
- `src/app/globals.css` — Design tokens (pure monochrome: `--bg`, `--surface`, `--border`, `--text`, `--text-secondary`, `--text-muted`)
- `src/app/page.tsx` — Main page assembly (server component)
- `src/components/HeroCanvas.tsx` — Flowing bezier curves with spring physics (ported from WS-Demo)
- `src/components/PipelineCanvas.tsx` — Node-and-path pipeline visualization with particle flow
- `src/components/MagneticCursor.tsx` — GSAP dot+ring cursor (desktop only, `mix-blend-mode: difference`)
- `src/components/ScrollReveal.tsx` — IntersectionObserver wrapper for staggered fade-in
- `src/components/StatsBar.tsx` — Async server component, ISR revalidate 3600s, fetches GitHub API
- `src/lib/github.ts` — GitHub REST API helpers for stats

### Design language
- **Palette**: Pure monochrome. No accent color. `#000` bg, `#0a0a0a` surface, `#1a1a1a` borders, white text
- **Typography**: Instrument Serif (headlines), Inter 300 (body), monospace (labels/code)
- **Layout**: 860px max-width content column, 1px border grid between sections, no border-radius
- **Interactions**: Magnetic cursor, scroll reveal, spring-physics canvas animations, mouse repulsion
- **Aesthetic**: Cold brutalist. Inspired by skahessay.dev (dark minimal) + WS-Demo-Presentation (narrative scroll + canvas)

### Pipeline visualization (PipelineCanvas.tsx)
8 nodes representing real agents with 3 flow paths:
- **Main flow**: PRD → Decompose → Implement → Review → Merge → Deploy
- **Review rejection**: Review → Implement (22% probability, dashed arc)
- **Self-healing**: Deploy → Detect → Repair → Review (18% probability, lower arc)
- Particles use spring physics (spring 0.06, damping 0.78) and follow bezier paths between nodes
- Node glow pulses on particle arrival, mouse repulsion pushes particles away

### Vercel deployment
- `deploy-router.yml` → `deploy-vercel.yml` on push to main
- **Custom alias gotcha**: `prd-to-prod.vercel.app` is a manual alias. Workflow deploys go to `prd-to-prod-template.vercel.app` automatically but do NOT update the custom alias. After workflow deploys, re-alias with: `npx vercel alias <deployment-url> prd-to-prod.vercel.app`
- Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID` (`team_b5f1QjAi01JNv4Dza2BrhRHH`), `VERCEL_PROJECT_ID` (`prj_pLis8CoYc5jyglpTpFC1fJdAKJ0C`)

## GitHub App

**Name**: `prd-to-prod-pipeline` (App ID: `2995372`)
**Purpose**: Token vending machine — workflows mint short-lived tokens via `actions/create-github-app-token@v1`
**Permissions**: Contents R/W, Issues R/W, Pull requests R/W, Actions R/W
**Webhook**: Inactive (not needed — App is only used for token minting)
**Installed on**: `prd-to-prod-template`
**Config**: `PIPELINE_APP_ID` (variable) + `PIPELINE_APP_PRIVATE_KEY` (secret)
**Fallback**: All workflows fall back to `GH_AW_GITHUB_TOKEN` PAT if App not configured

Token pattern in workflows:
```yaml
- name: Generate App token
  id: app-token
  if: vars.PIPELINE_APP_ID != ''
  uses: actions/create-github-app-token@v1
  with:
    app-id: ${{ vars.PIPELINE_APP_ID }}
    private-key: ${{ secrets.PIPELINE_APP_PRIVATE_KEY }}
# Downstream: ${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}
```

## Pipeline agent topology (real flow)

```
PRD → prd-planner (optional) → architecture-approve → prd-decomposer → atomic issues
                                                                            ↓
auto-dispatch.yml (issues:labeled) → repo-assist → [Pipeline] PR
                                                         ↓
                                              pr-review-agent → [PIPELINE-VERDICT]
                                                         ↓
                                              pr-review-submit.yml
                                              ├─ APPROVE → auto-merge → deploy
                                              └─ REQUEST_CHANGES → repo-assist fixes → re-review
                                                                            ↓
                                                              deploy-router → deploy-vercel
                                                              ├─ SUCCESS → ci-failure-resolve
                                                              └─ FAILURE → ci-failure-issue → repo-assist (repair mode)
```

Background processes: pipeline-watchdog (30-min cron), auto-dispatch-requeue, pipeline-status (daily)

## Completed phases

1. **Phase 1** (2026-03-02): Template extraction — 49 files, templatized from prd-to-prod
2. **Phase 2** (2026-03-02): Setup wizard — `setup.sh` interactive + `setup-verify.sh` validator
3. **Phase 2.5** (2026-03-03): Architecture planning pipeline sync
4. **Phase 3** (2026-03-03): GitHub App auth — dual auth (App + PAT fallback) in 6 workflows
5. **Phase 4** (2026-03-03): Landing page — Next.js, monochrome brutalist, canvas animations, ISR stats

## What's next (polish and improve)

- Landing page visual polish (canvas tuning, responsive testing, favicon, OG image)
- MetaSection: fill in real issue/PR numbers once pipeline builds something on this repo
- StatsBar: numbers are currently low (0 PRs merged, 0 deploys) — will grow as pipeline does work
- Consider adding a video/GIF of the pipeline in action
- Phase 5 (deferred): Drill kit for template users
- Phase 6 (deferred): dotnet-azure and docker-generic stack re-addition

## Working style

- When exploring the codebase or investigating an issue, start with the specific files/folders mentioned before doing broad exploration
- Never fabricate or assume details about PRs, issue statuses, or external resources
- Do not claim a process succeeded until you have verified the actual output

## CI failure triage procedure

Run `gh run list --status=failure --limit=5 --json databaseId,name,conclusion,headBranch` to find recent CI failures. For each failure:

1. Fetch the full logs with `gh run view <id> --log-failed`
2. Identify the root cause by tracing error messages to specific source files
3. Implement the fix on a new branch named `fix/ci-<short-description>`
4. Run the same build/test command that failed to verify the fix locally
5. If verification passes, commit and open a PR with the failure log excerpt and root cause analysis

## Issue writing guidelines

- Be descriptive about the desired experience, not prescriptive about implementation
- Include a "Scope" section that describes boundaries (what should/shouldn't change)
- The agent reads the codebase itself — trust it to find the right files
- Acceptance criteria should be verifiable (build passes, tests pass, behavior observable)
