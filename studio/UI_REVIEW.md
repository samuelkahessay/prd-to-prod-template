# UI/Frontend Review — prd-to-prod Studio

## Overall Assessment
The Studio UI has a solid base: shadcn primitives are used consistently, spacing mostly follows Tailwind scale, and loading/empty/error states exist in key flows. The biggest quality gaps come from inconsistency across custom components added by different agents: token usage is mixed with hardcoded semantic colors, keyboard/screen-reader affordances are uneven, and several layouts use fixed dimensions that degrade mobile behavior. Overall quality is good but not polished or fully production-hardened for accessibility and responsive resilience. **Final score: 6.9/10**.

## Critical Issues

1. **Major accessibility semantics violation (nested interactive controls)** — `WelcomeScreen.tsx`

Problem:
```tsx
<Link href="/prd/new">
  <Button data-testid="welcome-cta" size="lg" className="gap-2">
    Create a PRD
  </Button>
</Link>
```

Fix:
```tsx
<Button asChild data-testid="welcome-cta" size="lg" className="gap-2">
  <Link href="/prd/new">
    Create a PRD
  </Link>
</Button>
```

2. **Major dark-mode/contrast regression due light-only alert palette** — `AuthGuard.tsx`

Problem:
```tsx
<p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
  {warning}
</p>
```

Fix (token-driven):
```tsx
<p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
  {warning}
</p>
```

3. **Major responsive constraint (hard fixed canvas height and node widths)** — `PipelineFlow.tsx`, `PipelineFlowWrapper.tsx`, `nodes/*.tsx`

Problem:
```tsx
<div className="h-[560px] w-full rounded-xl border bg-card" />
<div className="min-w-[300px] rounded-xl border-2 bg-card px-4 py-3 shadow-sm" />
```

Fix:
```tsx
<div className="h-[min(560px,70vh)] w-full rounded-xl border bg-card md:h-[560px]" />
<div className="w-[min(300px,80vw)] rounded-xl border-2 bg-card px-4 py-3 shadow-sm md:min-w-[300px]" />
```

## Major Issues

- **Hardcoded semantic colors instead of design tokens** (multiple files): `ActivityItem.tsx`, `RepoPicker.tsx`, `StatusCards.tsx`, `SubmitDialog.tsx`, `PrdNode.tsx`.
- **Icon-only toolbar controls depend on `title` instead of explicit accessible names**: `EditorToolbar.tsx`.
- **Native form controls bypass shared UI primitives and lose consistency**: `IssueActions.tsx`, `PrActions.tsx`, `TemplateForm.tsx`, `TokenInput.tsx`.
- **Inconsistent error messaging accessibility** (`role="alert"` / `aria-live` not used): control action components and auth forms.
- **Desktop-first shell behavior**: sidebar hidden on mobile without alternate navigation menu in top bar.

## Component Reviews

### Layout Components

#### AppShell.tsx
- Visual: clean shell and spacing; tokenized background.
- Accessibility: semantic `main` and `data-testid` present.
- Dark Mode: safe via `bg-background`.
- Responsive: adequate, but dependent on Sidebar behavior.
- Issues: **Suggestion** — consider skip-link target to improve keyboard navigation.

#### Sidebar.tsx
- Visual: consistent nav styling and muted treatment.
- Accessibility: semantic `aside` + `nav`; links are real links.
- Dark Mode: tokenized colors and borders.
- Responsive: `hidden md:flex` removes primary nav on mobile.
- Issues: **Major** — no mobile replacement nav; **Minor** — no active-route visual state.

#### TopBar.tsx
- Visual: minimal and consistent with shell.
- Accessibility: semantic `header`; no obvious violations.
- Dark Mode: tokenized.
- Responsive: compact title appears only on mobile.
- Issues: **Major** — top bar does not expose nav affordance when sidebar is hidden.

#### ThemeToggle.tsx
- Visual: polished icon transition.
- Accessibility: includes `sr-only` label and proper button trigger.
- Dark Mode: explicitly handled.
- Responsive: good.
- Issues: **Suggestion** — add `aria-label` on trigger for redundancy in some AT combinations.

### Auth Components

#### AuthGuard.tsx
- Visual: card-based states are coherent.
- Accessibility: basic semantics present; warning/error text not announced live.
- Dark Mode: warning banner uses light-only amber classes.
- Responsive: centered and constrained appropriately.
- Issues: **Major** — non-token amber banner harms dark contrast; **Minor** — message regions should use live semantics.

#### TokenInput.tsx
- Visual: generally consistent; direct `<input>` styling diverges from shared Input component.
- Accessibility: has label and id; good baseline.
- Dark Mode: mostly okay; warning uses hardcoded amber text.
- Responsive: full-width controls are mobile-friendly.
- Issues: **Minor** — prefer `Input` primitive for consistency; **Minor** — add `aria-describedby` for hints/errors.

### Repo Components

#### RepoPicker.tsx
- Visual: strong interaction model and structured command UI.
- Accessibility: combobox trigger has `aria-expanded`; recent remove icon button lacks explicit label.
- Dark Mode: several hardcoded status colors (`text-red-600`, etc.) bypass token system.
- Responsive: fixed popover width (`w-[320px]`) can constrain very narrow screens.
- Issues: **Major** — hardcoded semantic colors; **Minor** — icon-only remove button needs `aria-label`; **Minor** — fixed-width popover could adapt (`max-w-[calc(100vw-2rem)]`).

#### RepoStatusBadge.tsx
- Visual: concise badge status.
- Accessibility: icon + text content; no major semantic concerns.
- Dark Mode: variant-driven badge mostly safe.
- Responsive: compact.
- Issues: **Suggestion** — avoid console logging in UI path unless gated.

### Pipeline Components

#### PipelineFlow.tsx
- Visual: strong visual centerpiece; animated active node pulse is a good affordance.
- Accessibility: container has `aria-label`, but node interactions rely on generic div-buttons.
- Dark Mode: mostly token-driven; fallback colors inside inline style include hardcoded hex.
- Responsive: fixed `h-[560px]` is rigid on short viewports.
- Issues: **Major** — fixed height; **Minor** — node style fallback colors should align to tokens.

#### PipelineFlowWrapper.tsx
- Visual: loading/error/empty states present and clear.
- Accessibility: status text is readable, but no live-region semantics.
- Dark Mode: token-safe.
- Responsive: fixed 560px duplicated across all states.
- Issues: **Major** — rigid height on small screens.

#### nodes/PrdNode.tsx
- Visual: clear card hierarchy, but hardcoded blue badge diverges from status system.
- Accessibility: keyboard activation supported (`Enter`/`Space`).
- Dark Mode: hardcoded blue shades may clash with theme tuning.
- Responsive: min width can force horizontal crowding.
- Issues: **Major** — hardcoded `text-blue-700 dark:text-blue-300`; **Minor** — add `aria-label` for node action purpose.

#### nodes/IssueNode.tsx
- Visual: consistent with graph card language.
- Accessibility: keyboard support present.
- Dark Mode: mostly token-safe.
- Responsive: `min-w-[300px]` contributes to overflow pressure.
- Issues: **Major** — rigid min width; **Minor** — generic `role="button"` div could be upgraded to button semantics in custom node wrapper.

#### nodes/PrNode.tsx
- Visual: strong, consistent chip layout.
- Accessibility: keyboard support present.
- Dark Mode: token-safe.
- Responsive: `min-w-[300px]` constraint.
- Issues: **Major** — rigid min width.

#### nodes/DeployNode.tsx
- Visual: clear deployment/environment tag.
- Accessibility: keyboard support present.
- Dark Mode: token-safe.
- Responsive: `min-w-[260px]` still restrictive in dense mobile contexts.
- Issues: **Major** — rigid min width.

### Activity Components

#### ActivityFeed.tsx
- Visual: good skeleton, empty, error, and expandable pattern.
- Accessibility: collapse trigger is a real button; good.
- Dark Mode: token-based colors.
- Responsive: generally good, but long item content may still clip.
- Issues: **Minor** — consider announcing error state via `role="alert"`.

#### ActivityFilter.tsx
- Visual: concise and aligned with shadcn patterns.
- Accessibility: checkbox + label mapping is correct.
- Dark Mode: tokenized.
- Responsive: good.
- Issues: **Suggestion** — add selected-count hint on trigger for better discoverability.

#### ActivityItem.tsx
- Visual: good row rhythm and hover treatment.
- Accessibility: linked rows are keyboard focusable; non-linked rows are plain content.
- Dark Mode: multiple hardcoded event colors (`text-purple-500`, `text-violet-500`, etc.) create inconsistent contrast and theme drift.
- Responsive: truncation helps prevent overflow.
- Issues: **Major** — heavy hardcoded color usage; **Minor** — `outline-none` should retain robust focus style (ring exists, but ensure no reset regressions).

### Dashboard Components

#### DashboardShell.tsx
- Visual: sectioning and spacing are clear.
- Accessibility: error boundary retry uses plain button with minimal focus styling.
- Dark Mode: mostly tokenized.
- Responsive: control panel appears only when node selected; side panel width can squeeze on tablets.
- Issues: **Minor** — replace custom retry button with shared `Button` for consistency/a11y styles.

#### StatusCards.tsx
- Visual: informative cards with clear hierarchy.
- Accessibility: semantic structure acceptable.
- Dark Mode: mixed token + hardcoded color classes (`text-blue-600`, etc.).
- Responsive: 5-column desktop grid collapses reasonably.
- Issues: **Major** — hardcoded semantic colors should map through shared theme tokens (`PIPELINE_STATUS_COLORS` or CSS vars).

#### MetricsBar.tsx
- Visual: compact KPI strip is effective.
- Accessibility: data is readable; no major semantic issue.
- Dark Mode: tokenized.
- Responsive: horizontal scroll fallback is acceptable.
- Issues: **Suggestion** — add subtle snap points or grouping labels for mobile scannability.

### PRD Components

#### PrdWizard.tsx
- Visual: stepper and flow are clear.
- Accessibility: step indicators are visual only; no step semantics.
- Dark Mode: token-safe.
- Responsive: step labels not shown in compact mode; may reduce clarity.
- Issues: **Minor** — add `aria-current="step"` and assistive step labels.

#### PrdPreview.tsx
- Visual: clean markdown rendering.
- Accessibility: content-only region; acceptable.
- Dark Mode: `dark:prose-invert` present.
- Responsive: `overflow-auto` handles large docs.
- Issues: **Suggestion** — add heading/landmark label for preview region.

#### CategoryCard.tsx
- Visual: engaging hover motion.
- Accessibility: keyboard support added, but clickable card is div-like button pattern.
- Dark Mode: token-safe.
- Responsive: grid-friendly.
- Issues: **Major** — prefer actual `<button>` wrapper semantics or `asChild` pattern; **Minor** — selection state not exposed via `aria-pressed`.

#### TemplateForm.tsx
- Visual: consistent spacing and form rhythm.
- Accessibility: labels, ids, and invalid flags present.
- Dark Mode: mostly token-safe.
- Responsive: fluid layout.
- Issues: **Minor** — native `<select>` styling diverges from shared Select component and may vary cross-browser.

#### PrdEditor.tsx
- Visual: practical editor split view.
- Accessibility: textarea focus outline removed with `focus:outline-none`; no explicit replacement ring.
- Dark Mode: token-safe.
- Responsive: `h-screen` can be problematic in mobile browsers with dynamic toolbars.
- Issues: **Major** — weakened keyboard focus affordance; **Major** — full-viewport fixed-height behavior on mobile.

#### EditorToolbar.tsx
- Visual: consistent compact tool strip.
- Accessibility: icon-only buttons rely on `title` and lack explicit accessible names.
- Dark Mode: token-safe.
- Responsive: compact but usable.
- Issues: **Major** — add `aria-label` for each icon button.

#### MarkdownPreview.tsx
- Visual: clean, readable markdown area.
- Accessibility: acceptable baseline.
- Dark Mode: `dark:prose-invert` present.
- Responsive: scrollable and fluid.
- Issues: **Suggestion** — consider typographic tokens for consistent prose density across views.

#### SubmitDialog.tsx
- Visual: progress feedback and status progression are clear.
- Accessibility: progress text is visible but not announced as live updates.
- Dark Mode: mixed palette; success/error blocks use hardcoded red/emerald variants.
- Responsive: dialog footprint is manageable.
- Issues: **Major** — hardcoded semantic colors; **Minor** — add `aria-live="polite"` to step/status container.

### Control Components

#### ControlPanel.tsx
- Visual: clear context panel framing.
- Accessibility: good card semantics; disabled PRD action button can confuse without rationale in assistive text.
- Dark Mode: token-safe.
- Responsive: fits side panel well on desktop.
- Issues: **Minor** — import `SlashCommandMenu` is unused; **Suggestion** — expose disabled reason via `aria-describedby`.

#### IssueActions.tsx
- Visual: action grouping and modal confirmations are good.
- Accessibility: label-input dialog uses placeholder as label substitute.
- Dark Mode: error text uses hardcoded red classes.
- Responsive: button row may wrap poorly in narrow side panels.
- Issues: **Major** — unlabeled text input in Add Label dialog (needs `<Label htmlFor>` + `id`); **Minor** — tokenize error colors; **Minor** — consider `role="alert"` for async errors.

#### PrActions.tsx
- Visual: rich action set with clear intent.
- Accessibility: reject textarea has aria-label; merge method label is not programmatically linked (`htmlFor` missing).
- Dark Mode: hardcoded red error color.
- Responsive: dense button row may be crowded on mobile widths.
- Issues: **Major** — form labels should be explicitly associated; **Minor** — tokenize error classes.

#### WorkflowActions.tsx
- Visual: concise and clear.
- Accessibility: acceptable semantics.
- Dark Mode: hardcoded red error color.
- Responsive: compact.
- Issues: **Minor** — tokenize error color; **Minor** — add live region for async errors.

#### SlashCommandMenu.tsx
- Visual: good use of dropdown pattern.
- Accessibility: menu semantics inherited from shadcn; okay.
- Dark Mode: hardcoded red error color.
- Responsive: good.
- Issues: **Minor** — tokenize error color; **Suggestion** — disable menu items individually when command prerequisites fail.

### Welcome Components

#### WelcomeScreen.tsx
- Visual: strong onboarding hierarchy and clear CTA.
- Accessibility: CTA uses nested interactive controls (`Link > Button`).
- Dark Mode: gradient and card styles are theme-safe.
- Responsive: layout is generally adaptive.
- Issues: **Major** — nested interactive CTA pattern.

#### ShowcaseList.tsx
- Visual: clean card grid and metadata stack.
- Accessibility: external links are clear; cards are readable.
- Dark Mode: token-safe.
- Responsive: `md:grid-cols-2` behaves well.
- Issues: **Suggestion** — add `aria-label` with destination context for deployment/release links.

### Theme Infrastructure

#### ThemeProvider.tsx
- Visual/UX: clean pass-through provider.
- Accessibility: no direct concerns.
- Dark Mode: correct class-strategy wrapper expected.
- Issues: **Suggestion** — none.

#### globals.css
- Visual consistency: strong token foundation (background, foreground, card, border, ring, radius).
- Dark mode: complete variable mirror in `.dark`.
- Issues: **Suggestion** — custom components should consume these tokens more strictly instead of hardcoded semantic utility classes.

#### lib/theme.ts
- Visual consistency: central pipeline palette exists and is useful.
- Dark mode: pairs light/dark variants per status.
- Issues: **Minor** — several components bypass this source of truth and should be refactored to use it consistently.

## Accessibility Audit

- **Strengths:** frequent use of semantic card/layout components; many controls are true buttons; keyboard activation handled for graph nodes; labels exist in most forms; `sr-only` used in theme toggle.
- **High-impact gaps:** nested interactive controls (`WelcomeScreen`), icon-only toolbar buttons without explicit accessible names (`EditorToolbar`), unassociated/unlabeled form controls in action dialogs (`IssueActions`, `PrActions`), and lack of live regions for async error/progress updates.
- **Keyboard/focus:** mostly present, but `PrdEditor` textareas suppress default outline without equivalent visible ring.
- **Screen reader readiness:** fair, but inconsistent in non-happy-path feedback messaging.

## Dark Mode Audit

- **Pass:** core layout/surfaces are mostly tokenized and dark-safe (`bg-background`, `bg-card`, `text-muted-foreground`, etc.).
- **Fail patterns:** hardcoded semantic colors in custom components create inconsistent contrast and palette drift (`ActivityItem`, `RepoPicker`, `StatusCards`, `SubmitDialog`, `AuthGuard`, control error messages).
- **Recommendation:** enforce a no-hardcoded-semantic-colors rule in custom components; map statuses through `PIPELINE_STATUS_COLORS` and/or CSS variable tokens.

## Responsive Readiness

- **Good:** many grid breakpoints are sensible; content sections generally collapse to single-column; metrics strip supports horizontal scroll.
- **Risks:** fixed heights (`h-[560px]`), fixed/min widths (`w-[320px]`, `min-w-[300px]`), and desktop-only sidebar navigation weaken mobile ergonomics.
- **Touch targets:** button components generally satisfy target size, but compact icon toolbar (`icon-sm`) should be validated against 44x44 guidance for touch-first contexts.

## Recommendations (Priority Order)

1. Fix accessibility-semantic blockers: remove nested interactive CTA in `WelcomeScreen`; add explicit labels/associations in `IssueActions` and `PrActions`; add `aria-label` to icon-only toolbar buttons.
2. Normalize color system usage: replace hardcoded semantic utilities with theme tokens/`PIPELINE_STATUS_COLORS` in all custom components.
3. Make pipeline visualization responsive: replace fixed `560px` heights and rigid node widths with viewport-aware constraints.
4. Improve asynchronous feedback accessibility: add `role="alert"`/`aria-live` to error and step-status regions.
5. Add mobile nav affordance in top bar when sidebar is hidden.
6. Standardize native inputs/selects on shared form primitives for consistent focus, sizing, and theming.

## Final Score

**6.9 / 10**

Justification: strong structural foundation and good use of shared UI primitives in many places, but meaningful consistency debt remains across custom components. Accessibility and responsive behavior are serviceable but not fully robust, and color-token discipline is not yet enforced uniformly.
