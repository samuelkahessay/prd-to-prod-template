# Landing Page Redesign — Handoff Note

**Commit:** `feaed6a` on `main`
**Date:** 2026-03-04
**Author:** Claude Opus 4.6

---

## What shipped

Hybrid scroll-storytelling landing page replacing the old dark brutalist design. 29 files changed, 1584 insertions.

### Architecture

Route groups split marketing from dashboard:

| Route group | URL | Layout |
|---|---|---|
| `(marketing)` | `/` | Clean, no sidebar/topbar. Only `ThemeProvider`. |
| `(dashboard)` | `/dashboard`, `/prd/new`, `/settings` | Full `AppShell` with sidebar, topbar, `QueryClientProvider`, `RepoProvider`. |

Root `layout.tsx` now only wraps `ThemeProvider` + fonts. All dashboard providers moved to `(dashboard)/layout.tsx`.

### Sections built

1. **MarketingNav** — Sticky, backdrop blur on scroll, theme toggle, "Get Started" CTA
2. **Hero** — "From requirement to production." headline, proof strip badges, dual CTAs
3. **PipelineWalkthrough** — Scroll-linked sticky SVG diagram (desktop) + accordion (mobile) + "Watch the flow" auto-play
4. **7 Stage mock views** — PrdStage, DecomposeStage, ImplementStage, ReviewStage, MergeStage, DeployStage, HealStage
5. **TrustSection** — autonomy-policy.yml code block + 3 trust principles
6. **AudienceCards** — 3-column value props (leaders, devs, product)
7. **StatsSection** — Async server component, ISR revalidate 1h, conditional render (returns null if stats are 0)
8. **GetStarted** — Terminal code block + CTAs
9. **Footer** — Minimal
10. **ScrollReveal** — IntersectionObserver wrapper, `prefers-reduced-motion` support

### Design system additions

Pipeline stage color tokens in `globals.css` (oklch, light + dark):
`--stage-prd`, `--stage-decompose`, `--stage-implement`, `--stage-review`, `--stage-merge`, `--stage-deploy`, `--stage-heal` (plus `-muted` variants for each).

Mapped to Tailwind via `@theme inline` block (e.g. `text-stage-prd`, `bg-stage-merge-muted`).

### Internal link changes

All dashboard links updated from `/` to `/dashboard`:
- `Sidebar.tsx` — logo link, Dashboard nav link
- `TopBar.tsx` — mobile nav logo, Dashboard link
- `prd/new/page.tsx` — "Back to Dashboard" link, submit dialog redirect
- `settings/page.tsx` — "Back to Dashboard" link

---

## CI failures to fix

Both failures are **pre-existing** (same errors on previous commit `5824ac8`).

### 1. Studio CI — Lint errors in test files

**Run:** https://github.com/samuelkahessay/prd-to-prod-template/actions/runs/22673523096

All errors are in `studio/tests/`, none in marketing code. Categories:

| Error | Files | Fix |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | `DeployNode.test.tsx`, `IssueNode.test.tsx`, `PrNode.test.tsx`, `PrdNode.test.tsx`, `events.test.ts`, `auth.test.tsx`, `pipeline.test.tsx`, `repo.test.tsx` | Replace `as any` with proper types or add `// eslint-disable-next-line` |
| `react-hooks/globals` (variable reassignment) | `provider.test.tsx` lines 49, 54 | Refactor `client1`/`client2` to use `useRef` or collect in render callback |
| `prefer-const` | `PrdWizard.test.tsx` line 153 | Change `let nextButton` to `const nextButton` |
| Unused imports (warnings) | `PrdEditor.test.tsx`, `rate-limit.test.tsx`, `metrics.test.ts` | Remove unused `vi`, `waitFor`, `PipelineMetrics` imports |

**Suggested approach:** A single commit fixing all test lint errors. Run `cd studio && npx eslint tests/ --fix` for the auto-fixable ones, then manually fix the rest.

### 2. Deploy Router — Wrong working directory

**Run:** https://github.com/samuelkahessay/prd-to-prod-template/actions/runs/22673523067

```
Error: No Next.js version detected. Make sure your package.json has "next"
in either "dependencies" or "devDependencies".
```

The Vercel workflow (`.github/workflows/deploy-vercel.yml`) runs from the repo root, but `package.json` with `next` is in `studio/`.

**Fix options (pick one):**

A. Add `working-directory: studio` to the build/deploy steps:
```yaml
- name: Build
  working-directory: studio
  run: vercel build --prod --token=$VERCEL_TOKEN
```

B. Set Root Directory in Vercel project settings to `studio` (dashboard → Settings → General → Root Directory).

C. Add a root `package.json` that proxies to studio (not recommended).

Option B is cleanest since Vercel handles the subdirectory natively.

---

## UI review checklist

### Must verify

- [ ] **Light mode** — Visit `/`, check all sections render, text is readable, stage colors are visible
- [ ] **Dark mode** — Toggle theme, verify all cards/badges/code blocks adapt, no contrast issues
- [ ] **Scroll walkthrough (desktop)** — Scroll through pipeline section, verify sticky diagram highlights stages progressively
- [ ] **Auto-play** — Click "Watch the flow", verify it scrolls through all 7 stages. Interrupt with manual scroll.
- [ ] **Mobile (375px)** — Pipeline section shows accordion instead of sticky layout. Tap stages to expand/collapse.
- [ ] **Nav blur** — Scroll down, verify nav gets backdrop blur + bottom border
- [ ] **Dashboard intact** — Navigate to `/dashboard` — sidebar, topbar, auth guard all render correctly
- [ ] **`/prd/new`** — Back to Dashboard link goes to `/dashboard`
- [ ] **`/settings`** — Back to Dashboard link goes to `/dashboard`

### Nice to check

- [ ] **Stage colors** — Each pipeline stage has a distinct colored dot in its badge (blue, indigo, teal, amber, green, purple, orange)
- [ ] **Trust section** — YAML code block is horizontally scrollable on mobile, not clipped
- [ ] **Terminal block** — In GetStarted section, renders with dot decorations and mono font
- [ ] **Stats section** — Currently returns null (no pipeline data yet). Will appear automatically once PRs are merged with `pipeline` label.
- [ ] **`prefers-reduced-motion`** — With reduced motion enabled, scroll animations are disabled
- [ ] **Tab navigation** — All interactive elements (nav links, buttons, accordion triggers) are keyboard-accessible

### Known limitations

- Stage mock views use hardcoded sample data (issue #42, PR #31, etc.) — these are illustrative, not live
- StatsSection depends on GitHub Search API — may hit rate limits without auth token (public API: 10 req/min)
- Auto-play doesn't work on mobile (accordion doesn't auto-advance, only manual tap)

---

## File map

```
studio/
├── app/
│   ├── layout.tsx                          # Modified — stripped to ThemeProvider only
│   ├── globals.css                         # Modified — added stage color tokens + scroll animations
│   ├── (marketing)/
│   │   ├── layout.tsx                      # New — empty pass-through
│   │   └── page.tsx                        # New — landing page assembly
│   └── (dashboard)/
│       ├── layout.tsx                      # Modified — now wraps AppShell + providers
│       ├── dashboard/page.tsx              # Moved from (dashboard)/page.tsx
│       ├── prd/new/page.tsx                # Moved from app/prd/new/page.tsx
│       └── settings/page.tsx               # Moved from app/settings/page.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                     # Modified — links → /dashboard
│   │   └── TopBar.tsx                      # Modified — links → /dashboard
│   └── marketing/
│       ├── MarketingNav.tsx                # New — client component (scroll state)
│       ├── Hero.tsx                         # New — server component
│       ├── PipelineWalkthrough.tsx          # New — client component (IO + auto-play)
│       ├── PipelineDiagram.tsx             # New — client component (SVG)
│       ├── StagePanel.tsx                  # New — server component
│       ├── TrustSection.tsx                # New — server component
│       ├── AudienceCards.tsx               # New — server component
│       ├── StatsSection.tsx                # New — async server component (ISR)
│       ├── GetStarted.tsx                  # New — server component
│       ├── Footer.tsx                      # New — server component
│       ├── ScrollReveal.tsx                # New — client component (IO)
│       └── stages/
│           ├── stage-data.ts               # New — stage definitions + types
│           ├── PrdStage.tsx                # New — mock GitHub issue
│           ├── DecomposeStage.tsx          # New — mock decomposed issues
│           ├── ImplementStage.tsx          # New — mock PR view
│           ├── ReviewStage.tsx             # New — mock review verdict
│           ├── MergeStage.tsx              # New — mock merge timeline
│           ├── DeployStage.tsx             # New — mock deployment card
│           └── HealStage.tsx              # New — mock self-healing timeline
```
