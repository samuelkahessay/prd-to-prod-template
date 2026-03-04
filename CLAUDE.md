# CLAUDE.md

## How this repo works

This is a GitHub template repo for autonomous software pipelines powered by gh-aw (GitHub Agentic Workflows). It serves two purposes:

1. **Template**: Anyone can fork it, run `./setup.sh`, and have a working autonomous pipeline
2. **Landing page**: The repo itself hosts a Next.js landing page at `https://<your-project>.vercel.app` (replace with your actual deployment URL) — the pipeline's first customer is itself (meta)

Issues labeled `pipeline` are picked up by the `repo-assist` agent, which implements them, opens PRs, and the review/merge chain handles the rest.

## Our role

We write **design briefs as GitHub issues**, not code. The pipeline agents do the implementation.

- Describe *what* should change and *why*, not *how* (no file paths, no diffs, no implementation details)
- Use clear issue structure: Problem → Solution → Scope → Acceptance Criteria
- Label issues with `feature, pipeline` or `bug, pipeline` so auto-dispatch picks them up
- Acceptance criteria are the contract — the PR review agent verifies against them

**Exception:** `.github/workflows/` changes (pipeline infrastructure) and landing page polish are done directly, not through issues.

## Source repo

This template was extracted from the source `prd-to-prod` repository. When syncing changes:
- Source: `/path/to/your/prd-to-prod` (replace with your actual clone path)
- Template: `/path/to/your/prd-to-prod-template` (replace with your actual clone path)
- Extraction plan: Template extraction is complete (original plan archived in source repo)

## Landing page

**Stack**: Next.js 16 (App Router), Tailwind CSS, CSS Modules, Vercel
**Live**: `https://<your-project>.vercel.app` (replace with your actual deployment URL)
**Design docs**: `docs/plans/2026-03-03-landing-page-design.md`, `docs/plans/2026-03-04-landing-page-handoff.md`

### Architecture — route groups

| Route group | URL | Layout |
|---|---|---|
| `(marketing)` | `/` | Clean, no sidebar/topbar. Only `ThemeProvider`. |
| `(dashboard)` | `/dashboard`, `/prd/new`, `/settings` | Full `AppShell` with sidebar, topbar, `QueryClientProvider`, `RepoProvider`. |

Root `studio/app/layout.tsx` wraps `ThemeProvider` + fonts only. Dashboard providers live in `studio/app/(dashboard)/layout.tsx`.

### Key files
- `studio/app/layout.tsx` — Root layout, Inter + Instrument Serif fonts
- `studio/app/globals.css` — Design tokens including stage color tokens (oklch, light + dark)
- `studio/app/(marketing)/page.tsx` — Landing page assembly (server component)
- `studio/app/(dashboard)/layout.tsx` — Dashboard layout with AppShell + providers
- `studio/components/marketing/MarketingNav.tsx` — Sticky nav, backdrop blur on scroll, theme toggle
- `studio/components/marketing/Hero.tsx` — Headline, proof badges, dual CTAs
- `studio/components/marketing/PipelineWalkthrough.tsx` — Scroll-linked sticky SVG (desktop) + accordion (mobile) + auto-play
- `studio/components/marketing/PipelineDiagram.tsx` — SVG pipeline diagram with 7 stage nodes
- `studio/components/marketing/StagePanel.tsx` — Stage description + mock view wrapper
- `studio/components/marketing/stages/` — 7 mock stage views (PrdStage, DecomposeStage, etc.)
- `studio/components/marketing/TrustSection.tsx` — autonomy-policy.yml code block + trust principles
- `studio/components/marketing/AudienceCards.tsx` — 3-column value props
- `studio/components/marketing/StatsSection.tsx` — Async server component, ISR revalidate 1h
- `studio/components/marketing/GetStarted.tsx` — Terminal code block + CTAs
- `studio/components/marketing/ScrollReveal.tsx` — IntersectionObserver, `prefers-reduced-motion` support

### Design language
- **Palette**: Light + dark mode via `next-themes`. Stage color tokens in oklch (`--stage-prd` through `--stage-heal` + `-muted` variants)
- **Typography**: Instrument Serif (headlines), Inter 300 (body), monospace (labels/code)
- **Layout**: Hybrid scroll-storytelling. Sticky pipeline diagram on desktop, accordion on mobile
- **Interactions**: Scroll-linked stage highlighting, auto-play walkthrough, backdrop blur nav
- **Aesthetic**: Clean, product-focused. Stage-colored accents on dark/light surfaces

### Pipeline walkthrough (PipelineWalkthrough.tsx)
7 stages with scroll-linked progression:
- **PRD** → **Decompose** → **Implement** → **Review** → **Merge** → **Deploy** → **Self-Heal**
- Desktop: sticky SVG diagram on left, scrolling stage panels on right
- Mobile: accordion with tap-to-expand stages
- "Watch the flow" auto-play scrolls through all stages

### Vercel deployment
- `deploy-router.yml` → `deploy-vercel.yml` on push to main (working-directory: `studio`)
- **Custom alias gotcha**: `<your-project>.vercel.app` is a manual alias. Workflow deploys go to `<your-project>-template.vercel.app` automatically but do NOT update the custom alias. After workflow deploys, re-alias with: `npx vercel alias <deployment-url> <your-project>.vercel.app`
- Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID` (`YOUR_VERCEL_TEAM_ID`), `VERCEL_PROJECT_ID` (`YOUR_VERCEL_PROJECT_ID`)

## GitHub App

**Name**: `prd-to-prod-pipeline` (App ID: `YOUR_GITHUB_APP_ID`)
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
6. **Phase 4.5** (2026-03-04): Landing page redesign — Hybrid scroll-storytelling, route groups, 7 stage mock views, light/dark mode, accordion mobile layout

## What's next (polish and improve)

- StatsSection: returns null until pipeline generates data (PRs merged with `pipeline` label)
- Stage mock views use hardcoded sample data — could be wired to live API later
- Consider adding a video/GIF of the pipeline in action
- Favicon and OG image for landing page
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
