# Landing Page Design — prd-to-prod-template

> **Status:** APPROVED
> **Date:** 2026-03-03
> **Approach:** Static narrative + live stats (ISR). The meta angle: the landing page is built by the pipeline itself.

## Concept

The template repo's first real workload is its own landing page — a Next.js app deployed on Vercel that tells the prd-to-prod story. The page that sells the pipeline was *built by* the pipeline. This is proof-of-concept #1.

## Visual Design Language

Blends skahessay.dev's dark minimal brutalism with WS-Demo-Presentation's narrative scroll structure and canvas animations.

### Color Palette (Pure Monochrome)

No color. Emphasis through brightness, scale, and motion.

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#000000` | Background |
| `--surface` | `#0a0a0a` | Elevated sections, hover states |
| `--border` | `#1a1a1a` | 1px structural grid lines |
| `--text` | `#ffffff` | Primary text, accent |
| `--text-secondary` | `#999999` | Body text |
| `--text-muted` | `#555555` | Labels, captions |

### Typography

| Role | Font | Weight | Sizing | Spacing |
|------|------|--------|--------|---------|
| Headlines | Instrument Serif | 400 | `clamp(2.5rem, 7vw, 5rem)` | `-0.03em` |
| Body | Inter | 300 | `1rem`, line-height 1.75 | default |
| Labels | System monospace | 400 | `0.7rem` | `0.1em`, uppercase |
| Code/stages | System monospace | 400 | `0.85rem` | `0.05em` |

### Layout

- Max-width: `860px` content column, centered
- Full-width canvas sections break out of the column
- 1px border grid structure between sections (collapsed borders, no gaps)
- No border-radius anywhere
- No shadows, no gradients

### Interactions

- **Magnetic cursor** (desktop only): 8px solid dot + 40px border ring, `mix-blend-mode: difference`, GSAP-driven with lag
- **Scroll reveal**: IntersectionObserver, staggered fade-in + translateY, `cubic-bezier(0.16, 1, 0.3, 1)`
- **Nav**: Fixed position, `mix-blend-mode: difference`, opacity transitions
- **Hover**: Top-bar reveal (2px white, scaleX 0→1), translate nudge (+4px), opacity shift
- **Reduced motion**: All animations disabled via `prefers-reduced-motion`

### Pipeline Visualization

Galactic particle field — not the warm dot-flow from WS-Demo. Sparse white particles with fading trails trace orbital paths through pipeline stages. Rendered on `<canvas>` with:

- Stage labels in monospace: `DECOMPOSE → IMPLEMENT → REVIEW → MERGE → DEPLOY → HEAL`
- Particles accelerate through stages, cluster at bottlenecks, burst on deploy
- HEAL loops back to IMPLEMENT (self-healing visual)
- Subtle grid overlay on the canvas
- Scroll-triggered: each stage lights up as the user scrolls past
- Mouse interaction: particles repel from cursor (inverse magnetic)

## Page Structure

### 1. Navigation (fixed)

```
SK  |  prd-to-prod     GitHub  Use Template
```

Fixed top, `mix-blend-mode: difference`. Monospace, uppercase, tracked. `Use Template` is the primary CTA — links to GitHub "Use this template" flow.

### 2. Hero (full viewport)

Canvas background with flowing galactic particle streams (white curves on black, spring physics, mouse-reactive).

```
AUTONOMOUS SOFTWARE PIPELINE
(monospace eyebrow, 0.7rem, uppercase, tracked, muted)

From requirement
to production.
(Instrument Serif, clamp 3rem–7rem)

Drop a PRD. The pipeline decomposes, implements, reviews,
merges, and deploys. If CI breaks, it fixes itself.
(Inter 300, secondary text)

[Use this template]  [View on GitHub]
(monospace labels, 1px white border buttons)
```

### 3. Pipeline Visualization (scroll-triggered, full-width)

Breaks out of the 860px column. Full viewport width, ~400px tall.

Particle field with 6 stages. Each stage activates as the user scrolls past:

```
DECOMPOSE → IMPLEMENT → REVIEW → MERGE → DEPLOY → HEAL
                                                    ↓
                                              (loops back)
```

Particles are sparse, white, with fading tails. Stage labels are monospace, muted until active (then white). The HEAL→IMPLEMENT loop is visually rendered as an orbital return path.

### 4. How It Works (3 steps, scroll-reveal)

```
01  DROP A PRD
    Write what you want built. The decomposer agent breaks it
    into scoped, implementable issues — each one a unit of work.

02  WATCH IT BUILD
    repo-assist picks up each issue, reads the codebase, writes
    code, and opens PRs. The review agent checks the work against
    your acceptance criteria.

03  IT FIXES ITSELF
    CI breaks on main? A repair issue opens automatically.
    The agent reads the failure logs, pushes a fix, and the
    loop closes. Zero human intervention.
```

Each step reveals on scroll with 55ms stagger. Step numbers are large monospace (`3rem`), muted. Titles are Inter 500, white. Descriptions are Inter 300, secondary.

### 5. The Meta Section (the payoff)

Dark-on-dark contrast section (`--surface` background). 1px top/bottom borders.

```
THIS PAGE WAS BUILT BY THE PIPELINE
(monospace eyebrow, uppercase, tracked)

This site is a Next.js app deployed on Vercel. It was
implemented by repo-assist, reviewed by pr-review-agent,
and deployed on merge. The pipeline's first customer is itself.
(Inter 300, secondary)

Issue #N  →  PR #N  →  Deployed
(monospace, with links to actual GitHub issue, PR, and Vercel deploy)
```

The issue/PR links are real — they point to the actual pipeline artifacts that created this page.

### 6. Live Stats Bar (ISR, hourly revalidation)

Horizontal strip. 1px top/bottom borders. 4 stats fetched from GitHub API at build time:

```
PRs MERGED: 47  |  DEPLOYS: 23  |  SELF-HEALS: 7  |  UPTIME: 99.8%
```

Monospace, tracked, muted. Numbers are white. Labels are `--text-muted`.

Data source: GitHub REST API → repo stats, Actions runs (filtered by workflow name), deploy count.

ISR revalidation: every 3600 seconds (1 hour).

### 7. Get Started (CTA section)

```
Start building.
(Instrument Serif, large)

[Use this template →]
(1px white border, monospace label, hover: fill white, text black)
```

### 8. Footer

```
Built by the pipeline. Powered by gh-aw.
(monospace, muted, centered)
```

## Technical Architecture

### Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** CSS Modules (no Tailwind — matches brutalist approach, full control)
- **Animation:** GSAP (magnetic cursor), vanilla Canvas API (pipeline viz), IntersectionObserver (scroll reveal)
- **Fonts:** `next/font/google` for Inter + Instrument Serif
- **Deployment:** Vercel (connected to template repo)
- **Data fetching:** Next.js ISR with `revalidate: 3600` for GitHub API stats

### File Structure

```
src/
  app/
    layout.tsx          — root layout, fonts, global styles
    page.tsx            — main landing page (server component)
    globals.css         — CSS variables, resets, base styles
  components/
    Nav.tsx             — fixed navigation
    Hero.tsx            — hero section + canvas
    HeroCanvas.tsx      — client component: flowing particle canvas
    Pipeline.tsx        — pipeline visualization section
    PipelineCanvas.tsx  — client component: galactic particle field
    HowItWorks.tsx      — 3-step scroll reveal
    MetaSection.tsx     — "this page was built by the pipeline"
    StatsBar.tsx        — live GitHub stats (server component with ISR)
    GetStarted.tsx      — CTA section
    Footer.tsx          — footer
    ScrollReveal.tsx    — client component: IntersectionObserver wrapper
    MagneticCursor.tsx  — client component: GSAP dot+ring cursor
  lib/
    github.ts           — GitHub API fetch helpers (cached)
```

### Canvas Approach

Both canvases use vanilla Canvas API (no Three.js, no heavy deps):

1. **HeroCanvas**: Adapts WS-Demo's `hero.js` — 6-8 bezier curves with spring physics, mouse-reactive. Rendered in white/gray on black. Particles (small dots) travel along curves.

2. **PipelineCanvas**: New. Particle system with:
   - 100-200 particles spawning left, flowing right through 6 stage columns
   - Orbital physics: particles follow curved paths with slight randomness
   - Fading trails (particle history rendered at decreasing opacity)
   - Stage labels rendered on canvas in monospace
   - Scroll-driven activation: `IntersectionObserver` feeds scroll progress to canvas
   - Mouse repulsion: particles pushed away from cursor position

### Data Fetching

```typescript
// lib/github.ts
const REPO = 'samuelkahessay/prd-to-prod-template'

export async function getStats() {
  const [prs, runs] = await Promise.all([
    fetch(`https://api.github.com/repos/${REPO}/pulls?state=closed&per_page=100`),
    fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=100`),
  ])
  // Count merged PRs, successful deploys, self-heal runs
  // Return { prsMerged, deploys, selfHeals }
}
```

Called from `StatsBar.tsx` as a server component with ISR revalidation.

### Meta Section Data

The issue number, PR number, and deploy URL for the page itself will be hardcoded after the first pipeline run creates them. This is intentionally not dynamic — it's a fixed historical reference: "these are the artifacts that created me."

## Deployment

The template repo already has `deploy-vercel.yml` and `ci-node.yml` workflows. Once the Next.js app is committed:

1. Connect the Vercel project to the `prd-to-prod-template` repo
2. Set `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets
3. Pushes to `main` trigger deploy via `deploy-router.yml` → `deploy-vercel.yml`

## The Meta Loop

The ultimate meta play:

1. We write a PRD issue describing the landing page
2. The pipeline's `prd-decomposer` breaks it into implementation issues
3. `repo-assist` implements each issue as a PR
4. `pr-review-agent` reviews the code
5. PRs merge, deploy to Vercel
6. The landing page goes live — built entirely by the pipeline
7. The Meta Section links back to the issues/PRs that created it

This is the proof. Not a demo. Not a simulation. The real thing.
