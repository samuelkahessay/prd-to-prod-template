# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the prd-to-prod landing page — a monochrome brutalist Next.js app that tells the pipeline story and deploys itself via the template's own pipeline.

**Architecture:** Single-page Next.js 15 App Router site. Server components for layout/content/ISR stats, client components for canvas animations and scroll interactions. CSS Modules for styling (no Tailwind). GSAP for magnetic cursor, vanilla Canvas API for hero + pipeline visualizations.

**Tech Stack:** Next.js 15, CSS Modules, GSAP, Canvas API, `next/font/google` (Inter + Instrument Serif), Vercel deployment

**Design doc:** `docs/plans/2026-03-03-landing-page-design.md`

---

## Task 1: Bootstrap Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: Initialize Next.js**

```bash
cd /Users/skahessay/Documents/Projects/active/prd-to-prod-template
npx create-next-app@latest . --typescript --app --src-dir --no-tailwind --no-eslint --no-turbopack --import-alias "@/*" --use-npm
```

Accept overwriting existing files if prompted. This creates the Next.js skeleton.

**Step 2: Verify build works**

```bash
npm run build
```

Expected: Successful build.

**Step 3: Add a placeholder test script**

Add to `package.json` scripts:
```json
"test": "echo 'No tests configured' && exit 0"
```

This satisfies `npm test` in CI until real tests are added.

**Step 4: Verify CI commands work**

```bash
npm ci && npm run build && npm test
```

Expected: All pass.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Next.js 15 project"
```

---

## Task 2: Global Styles + Layout + Fonts

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Delete: `src/app/page.module.css` (if created by scaffolding)

**Step 1: Write globals.css**

Replace the entire file with the design system:

```css
/* === Reset === */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

/* === Design Tokens === */
:root {
  --bg: #000000;
  --surface: #0a0a0a;
  --border: #1a1a1a;
  --text: #ffffff;
  --text-secondary: #999999;
  --text-muted: #555555;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --content-width: 860px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 300;
  line-height: 1.75;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
}

/* === Typography === */
.eyebrow {
  font-family: monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.headline {
  font-family: var(--font-serif), Georgia, serif;
  font-weight: 400;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.mono {
  font-family: monospace;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

/* === Layout === */
.content {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 2rem;
}

.section {
  border-bottom: 1px solid var(--border);
}

/* === Scroll Reveal === */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s var(--ease-out-expo), transform 0.8s var(--ease-out-expo);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* === Reduced Motion === */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  .reveal {
    opacity: 1;
    transform: none;
  }
}

/* === Mobile === */
@media (max-width: 768px) {
  .content {
    padding: 0 1.25rem;
  }
}
```

**Step 2: Write layout.tsx**

Replace the entire file:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

const instrumentSerif = localFont({
  src: './fonts/InstrumentSerif-Regular.ttf',
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'prd-to-prod — Autonomous Software Pipeline',
  description:
    'Drop a PRD. The pipeline decomposes, implements, reviews, merges, and deploys. If CI breaks, it fixes itself.',
  openGraph: {
    title: 'prd-to-prod — Autonomous Software Pipeline',
    description:
      'Turn product requirements into deployed software. Autonomously.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

**Step 3: Download Instrument Serif font**

```bash
mkdir -p src/app/fonts
curl -L "https://fonts.google.com/download?family=Instrument+Serif" -o /tmp/instrument-serif.zip
cd /tmp && unzip -o instrument-serif.zip -d instrument-serif
cp /tmp/instrument-serif/InstrumentSerif-Regular.ttf /Users/skahessay/Documents/Projects/active/prd-to-prod-template/src/app/fonts/
```

If the Google Fonts download URL doesn't work, use `next/font/google` instead:

```tsx
import { Instrument_Serif } from 'next/font/google'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
})
```

**Step 4: Write a minimal page.tsx**

Replace the entire file:

```tsx
export default function Home() {
  return (
    <main>
      <section style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 className="headline" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}>
          From requirement<br />to production.
        </h1>
      </section>
    </main>
  )
}
```

**Step 5: Delete scaffolding leftovers**

```bash
rm -f src/app/page.module.css src/app/favicon.ico
rm -rf public/
mkdir public
```

**Step 6: Verify build**

```bash
npm run build
```

Expected: Successful build with the correct fonts and CSS.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add global styles, layout, and typography system"
```

---

## Task 3: ScrollReveal + MagneticCursor Components

**Files:**
- Create: `src/components/ScrollReveal.tsx`, `src/components/ScrollReveal.module.css`
- Create: `src/components/MagneticCursor.tsx`, `src/components/MagneticCursor.module.css`

**Step 1: Install GSAP**

```bash
npm install gsap
```

**Step 2: Write ScrollReveal.tsx**

```tsx
'use client'

import { useEffect, useRef } from 'react'

export default function ScrollReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      el.classList.add('visible')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('visible'), delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}
```

**Step 3: Write MagneticCursor.tsx**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import styles from './MagneticCursor.module.css'

export default function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch || window.innerWidth < 768) return

    let gsapModule: typeof import('gsap') | null = null

    import('gsap').then((mod) => {
      gsapModule = mod
      const gsap = mod.gsap

      const dot = dotRef.current
      const ring = ringRef.current
      if (!dot || !ring) return

      dot.style.display = 'block'
      ring.style.display = 'block'

      const pos = { x: 0, y: 0 }

      const onMove = (e: MouseEvent) => {
        pos.x = e.clientX
        pos.y = e.clientY
      }

      document.addEventListener('mousemove', onMove)

      gsap.ticker.add(() => {
        gsap.set(dot, { x: pos.x - 4, y: pos.y - 4 })
        gsap.to(ring, { x: pos.x - 20, y: pos.y - 20, duration: 0.12, ease: 'power2.out' })
      })

      return () => {
        document.removeEventListener('mousemove', onMove)
      }
    })
  }, [])

  return (
    <>
      <div ref={dotRef} className={styles.dot} />
      <div ref={ringRef} className={styles.ring} />
    </>
  )
}
```

**Step 4: Write MagneticCursor.module.css**

```css
.dot,
.ring {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: difference;
  display: none;
}

.dot {
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
}

.ring {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}
```

**Step 5: Verify build**

```bash
npm run build
```

Expected: Successful build.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add ScrollReveal and MagneticCursor client components"
```

---

## Task 4: Nav Component

**Files:**
- Create: `src/components/Nav.tsx`, `src/components/Nav.module.css`

**Step 1: Write Nav.module.css**

```css
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  mix-blend-mode: difference;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  font-family: monospace;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.logo:hover {
  opacity: 1;
}

.separator {
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
}

.name {
  font-family: monospace;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.5;
}

.right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.link {
  font-family: monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.link:hover {
  opacity: 1;
}

.cta {
  font-family: monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 0.5rem 1rem;
  transition: background 0.3s ease, color 0.3s ease;
}

.cta:hover {
  background: #fff;
  color: #000;
}

@media (max-width: 768px) {
  .nav {
    padding: 1rem 1.25rem;
  }

  .name,
  .separator {
    display: none;
  }
}
```

**Step 2: Write Nav.tsx**

```tsx
import styles from './Nav.module.css'

const TEMPLATE_URL = 'https://github.com/samuelkahessay/prd-to-prod-template/generate'
const REPO_URL = 'https://github.com/samuelkahessay/prd-to-prod-template'

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <span className={styles.logo}>SK</span>
        <span className={styles.separator} />
        <span className={styles.name}>prd-to-prod</span>
      </div>
      <div className={styles.right}>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={styles.link}>
          GitHub
        </a>
        <a href={TEMPLATE_URL} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          Use Template
        </a>
      </div>
    </nav>
  )
}
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add fixed Nav component with blend-mode difference"
```

---

## Task 5: Hero Section + HeroCanvas

**Files:**
- Create: `src/components/Hero.tsx`, `src/components/Hero.module.css`
- Create: `src/components/HeroCanvas.tsx`

**Step 1: Write Hero.module.css**

```css
.hero {
  position: relative;
  height: 100vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}

.canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 700px;
  padding: 0 2rem;
}

.eyebrow {
  font-family: monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.title {
  font-family: var(--font-serif), Georgia, serif;
  font-weight: 400;
  font-size: clamp(2.5rem, 7vw, 5rem);
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  max-width: 480px;
  margin: 0 auto 2.5rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  font-family: monospace;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.btn:hover {
  background: #fff;
  color: #000;
  border-color: #fff;
}

.btnGhost {
  composes: btn;
  border-color: rgba(255, 255, 255, 0.2);
}

.btnGhost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
}

@media (max-width: 768px) {
  .buttons {
    flex-direction: column;
    align-items: center;
  }
}
```

**Step 2: Write HeroCanvas.tsx**

Port the WS-Demo hero.js to React, but render white/gray curves on black instead of the original warm red.

```tsx
'use client'

import { useEffect, useRef } from 'react'

interface Curve {
  p0: { x: number; y: number }
  p1: { x: number; y: number }
  p2: { x: number; y: number }
  p3: { x: number; y: number }
  base1: { x: number; y: number }
  base2: { x: number; y: number }
  v1: { x: number; y: number }
  v2: { x: number; y: number }
  opacity: number
  width: number
  speed: number
  phase: number
  hasDot: boolean
  dotT: number
  dotSpeed: number
}

export default function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let mouse = { x: -1, y: -1 }
    let curves: Curve[] = []
    let animId: number

    function makeCurve(i: number, count: number): Curve {
      const p1 = { x: 0.2 + Math.random() * 0.3, y: 0.1 + Math.random() * 0.8 }
      const p2 = { x: 0.5 + Math.random() * 0.3, y: 0.1 + Math.random() * 0.8 }
      return {
        p0: { x: i / (count - 1) * 0.3, y: 0.2 + Math.random() * 0.6 },
        p1,
        p2,
        p3: { x: 0.7 + i / (count - 1) * 0.3, y: 0.2 + Math.random() * 0.6 },
        base1: { ...p1 },
        base2: { ...p2 },
        v1: { x: 0, y: 0 },
        v2: { x: 0, y: 0 },
        opacity: 0.08 + Math.random() * 0.12,
        width: 0.4 + Math.random() * 0.6,
        speed: 0.0003 + Math.random() * 0.0004,
        phase: Math.random() * Math.PI * 2,
        hasDot: Math.random() > 0.4,
        dotT: Math.random(),
        dotSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.001 + Math.random() * 0.002),
      }
    }

    function resize() {
      W = canvas!.width = canvas!.offsetWidth
      H = canvas!.height = canvas!.offsetHeight
      curves = Array.from({ length: 8 }, (_, i) => makeCurve(i, 8))
    }

    function getCurvePoint(c: Curve, t: number) {
      const mt = 1 - t
      return {
        x: (mt ** 3 * c.p0.x + 3 * mt ** 2 * t * c.p1.x + 3 * mt * t ** 2 * c.p2.x + t ** 3 * c.p3.x) * W,
        y: (mt ** 3 * c.p0.y + 3 * mt ** 2 * t * c.p1.y + 3 * mt * t ** 2 * c.p2.y + t ** 3 * c.p3.y) * H,
      }
    }

    function draw(ts: number) {
      ctx!.clearRect(0, 0, W, H)

      for (const c of curves) {
        const breathe = Math.sin(ts * c.speed + c.phase) * 0.04
        const spring = 0.06
        const damping = 0.82

        if (mouse.x >= 0) {
          const mx = mouse.x / W
          const my = mouse.y / H
          const midX = (c.p1.x + c.p2.x) / 2
          const midY = (c.p1.y + c.p2.y) / 2
          const dist = Math.hypot(mx - midX, my - midY)
          const influence = Math.max(0, 1 - dist / 0.6) * 0.18

          c.v1.x += (c.base1.x + (mx - c.base1.x) * influence + breathe - c.p1.x) * spring
          c.v1.y += (c.base1.y + (my - c.base1.y) * influence * 0.5 - c.p1.y) * spring
          c.v2.x += (c.base2.x + (mx - c.base2.x) * influence + breathe * 0.5 - c.p2.x) * spring
          c.v2.y += (c.base2.y + (my - c.base2.y) * influence * 0.5 - c.p2.y) * spring
        } else {
          c.v1.x += (c.base1.x + breathe - c.p1.x) * spring
          c.v1.y += (c.base1.y - c.p1.y) * spring
          c.v2.x += (c.base2.x + breathe * 0.5 - c.p2.x) * spring
          c.v2.y += (c.base2.y - c.p2.y) * spring
        }

        c.v1.x *= damping; c.v1.y *= damping
        c.v2.x *= damping; c.v2.y *= damping
        c.p1.x += c.v1.x; c.p1.y += c.v1.y
        c.p2.x += c.v2.x; c.p2.y += c.v2.y

        ctx!.beginPath()
        ctx!.moveTo(c.p0.x * W, c.p0.y * H)
        ctx!.bezierCurveTo(c.p1.x * W, c.p1.y * H, c.p2.x * W, c.p2.y * H, c.p3.x * W, c.p3.y * H)
        ctx!.strokeStyle = `rgba(255, 255, 255, ${c.opacity})`
        ctx!.lineWidth = c.width
        ctx!.stroke()

        if (c.hasDot) {
          c.dotT += c.dotSpeed
          if (c.dotT > 1) c.dotT = 0
          if (c.dotT < 0) c.dotT = 1
          const pt = getCurvePoint(c, c.dotT)
          ctx!.beginPath()
          ctx!.arc(pt.x, pt.y, 2, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(255, 255, 255, ${c.opacity * 2.5})`
          ctx!.fill()
        }
      }

      // Subtle grid dots
      ctx!.fillStyle = 'rgba(255, 255, 255, 0.03)'
      for (let x = 32; x < W; x += 32) {
        for (let y = 32; y < H; y += 32) {
          ctx!.beginPath()
          ctx!.arc(x, y, 0.6, 0, Math.PI * 2)
          ctx!.fill()
        }
      }

      animId = requestAnimationFrame(draw)
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    const onLeave = () => { mouse.x = -1; mouse.y = -1 }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', resize)

    resize()
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}
```

**Step 3: Write Hero.tsx**

```tsx
import styles from './Hero.module.css'
import HeroCanvas from './HeroCanvas'

const TEMPLATE_URL = 'https://github.com/samuelkahessay/prd-to-prod-template/generate'
const REPO_URL = 'https://github.com/samuelkahessay/prd-to-prod-template'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <HeroCanvas className={styles.canvas} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>Autonomous Software Pipeline</p>
        <h1 className={styles.title}>
          From requirement
          <br />
          to production.
        </h1>
        <p className={styles.subtitle}>
          Drop a PRD. The pipeline decomposes, implements, reviews, merges, and
          deploys. If CI breaks, it fixes itself.
        </p>
        <div className={styles.buttons}>
          <a href={TEMPLATE_URL} target="_blank" rel="noopener noreferrer" className={styles.btn}>
            Use this template
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={styles.btnGhost}>
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
```

**Step 4: Wire into page.tsx**

```tsx
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import MagneticCursor from '@/components/MagneticCursor'

export default function Home() {
  return (
    <>
      <MagneticCursor />
      <Nav />
      <main>
        <Hero />
      </main>
    </>
  )
}
```

**Step 5: Verify build + dev server**

```bash
npm run build
```

Expected: Successful build. Hero renders with canvas animation.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Hero section with flowing bezier canvas animation"
```

---

## Task 6: Pipeline Visualization

**Files:**
- Create: `src/components/Pipeline.tsx`, `src/components/Pipeline.module.css`
- Create: `src/components/PipelineCanvas.tsx`

**Step 1: Write Pipeline.module.css**

```css
.pipeline {
  position: relative;
  width: 100%;
  height: 400px;
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}

.canvas {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .pipeline {
    height: 300px;
  }
}
```

**Step 2: Write PipelineCanvas.tsx**

This is the galactic particle field. Particles flow left-to-right through 6 stages with orbital physics, fading trails, and scroll-driven activation.

```tsx
'use client'

import { useEffect, useRef } from 'react'

const STAGES = ['DECOMPOSE', 'IMPLEMENT', 'REVIEW', 'MERGE', 'DEPLOY', 'HEAL']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  stage: number
  trail: { x: number; y: number }[]
  opacity: number
  size: number
}

export default function PipelineCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let particles: Particle[] = []
    let mouse = { x: -1, y: -1 }
    let animId: number

    function resize() {
      W = canvas!.width = canvas!.offsetWidth
      H = canvas!.height = canvas!.offsetHeight
    }

    function spawnParticle(): Particle {
      return {
        x: -10,
        y: H * (0.3 + Math.random() * 0.4),
        vx: 0.3 + Math.random() * 0.7,
        vy: (Math.random() - 0.5) * 0.3,
        stage: 0,
        trail: [],
        opacity: 0.3 + Math.random() * 0.5,
        size: 1 + Math.random() * 1.5,
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      const progress = progressRef.current

      // Subtle grid
      ctx!.fillStyle = 'rgba(255, 255, 255, 0.02)'
      for (let x = 0; x < W; x += 40) {
        for (let y = 0; y < H; y += 40) {
          ctx!.fillRect(x, y, 1, 1)
        }
      }

      // Stage labels
      const stageWidth = W / STAGES.length
      STAGES.forEach((label, i) => {
        const x = stageWidth * i + stageWidth / 2
        const stageProgress = (i + 1) / STAGES.length
        const active = progress >= stageProgress - 0.1

        ctx!.font = '11px monospace'
        ctx!.textAlign = 'center'
        ctx!.fillStyle = active ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.15)'
        ctx!.fillText(label, x, H - 30)

        // Stage separator lines
        if (i > 0) {
          ctx!.beginPath()
          ctx!.moveTo(stageWidth * i, 0)
          ctx!.lineTo(stageWidth * i, H)
          ctx!.strokeStyle = 'rgba(255, 255, 255, 0.04)'
          ctx!.lineWidth = 1
          ctx!.stroke()
        }
      })

      // Spawn particles
      if (particles.length < 120 && Math.random() > 0.92) {
        particles.push(spawnParticle())
      }

      // Update + draw particles
      particles = particles.filter((p) => {
        // Orbital wobble
        p.vy += (Math.random() - 0.5) * 0.05
        p.vy *= 0.98

        // Mouse repulsion
        if (mouse.x >= 0) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 80) {
            const force = (80 - dist) / 80 * 0.5
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }

        p.x += p.vx
        p.y += p.vy

        // Track current stage
        p.stage = Math.min(Math.floor(p.x / stageWidth), STAGES.length - 1)

        // Trail
        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 12) p.trail.shift()

        // Draw trail
        for (let i = 0; i < p.trail.length - 1; i++) {
          const t = p.trail[i]
          const alpha = (i / p.trail.length) * p.opacity * 0.3
          ctx!.beginPath()
          ctx!.arc(t.x, t.y, p.size * 0.5, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`
          ctx!.fill()
        }

        // Draw particle
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
        ctx!.fill()

        // HEAL loop-back
        if (p.x > W + 10) {
          if (Math.random() > 0.5) {
            p.x = stageWidth * 1 // Loop back to IMPLEMENT
            p.y = H * (0.3 + Math.random() * 0.4)
            p.trail = []
            return true
          }
          return false
        }

        return true
      })

      animId = requestAnimationFrame(draw)
    }

    // Scroll progress
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const ratio = entry.intersectionRatio
          progressRef.current = Math.min(1, ratio * 2)
        }
      },
      { threshold: Array.from({ length: 20 }, (_, i) => i / 20) }
    )
    observer.observe(canvas!)

    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => { mouse.x = -1; mouse.y = -1 }

    canvas!.addEventListener('mousemove', onMove)
    canvas!.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', resize)

    resize()
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      observer.disconnect()
      canvas!.removeEventListener('mousemove', onMove)
      canvas!.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}
```

**Step 3: Write Pipeline.tsx**

```tsx
import styles from './Pipeline.module.css'
import PipelineCanvas from './PipelineCanvas'

export default function Pipeline() {
  return (
    <section className={styles.pipeline}>
      <PipelineCanvas className={styles.canvas} />
    </section>
  )
}
```

**Step 4: Add to page.tsx**

```tsx
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Pipeline from '@/components/Pipeline'
import MagneticCursor from '@/components/MagneticCursor'

export default function Home() {
  return (
    <>
      <MagneticCursor />
      <Nav />
      <main>
        <Hero />
        <Pipeline />
      </main>
    </>
  )
}
```

**Step 5: Verify build**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add galactic pipeline particle visualization"
```

---

## Task 7: HowItWorks Section

**Files:**
- Create: `src/components/HowItWorks.tsx`, `src/components/HowItWorks.module.css`

**Step 1: Write HowItWorks.module.css**

```css
.section {
  padding: 6rem 0;
  border-bottom: 1px solid var(--border);
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2rem;
  align-items: start;
}

.number {
  font-family: monospace;
  font-size: 3rem;
  color: var(--text-muted);
  line-height: 1;
}

.body {}

.stepTitle {
  font-family: var(--font-inter), sans-serif;
  font-weight: 500;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  margin-bottom: 0.75rem;
}

.description {
  color: var(--text-secondary);
  max-width: 500px;
}

@media (max-width: 768px) {
  .number {
    font-size: 2rem;
  }

  .step {
    gap: 1rem;
  }
}
```

**Step 2: Write HowItWorks.tsx**

```tsx
import styles from './HowItWorks.module.css'
import ScrollReveal from './ScrollReveal'

const STEPS = [
  {
    number: '01',
    title: 'DROP A PRD',
    description:
      'Write what you want built. The decomposer agent breaks it into scoped, implementable issues\u2009\u2014\u2009each one a unit of work.',
  },
  {
    number: '02',
    title: 'WATCH IT BUILD',
    description:
      'repo-assist picks up each issue, reads the codebase, writes code, and opens PRs. The review agent checks the work against your acceptance criteria.',
  },
  {
    number: '03',
    title: 'IT FIXES ITSELF',
    description:
      'CI breaks on main? A repair issue opens automatically. The agent reads the failure logs, pushes a fix, and the loop closes. Zero human intervention.',
  },
]

export default function HowItWorks() {
  return (
    <section className={`${styles.section} section`}>
      <div className="content">
        <div className={styles.steps}>
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 55}>
              <div className={styles.step}>
                <span className={styles.number}>{step.number}</span>
                <div className={styles.body}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.description}>{step.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 3: Add to page.tsx** after `<Pipeline />`

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add HowItWorks section with staggered scroll reveal"
```

---

## Task 8: MetaSection

**Files:**
- Create: `src/components/MetaSection.tsx`, `src/components/MetaSection.module.css`

**Step 1: Write MetaSection.module.css**

```css
.section {
  padding: 6rem 0;
  background: var(--surface);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.eyebrow {
  font-family: monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.description {
  color: var(--text-secondary);
  max-width: 520px;
  margin-bottom: 2rem;
}

.chain {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: monospace;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

.chainLink {
  color: var(--text);
  border-bottom: 1px solid var(--border);
  padding-bottom: 2px;
  transition: border-color 0.3s ease;
}

.chainLink:hover {
  border-color: var(--text);
}

.arrow {
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .chain {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .arrow {
    transform: rotate(90deg);
  }
}
```

**Step 2: Write MetaSection.tsx**

```tsx
import styles from './MetaSection.module.css'
import ScrollReveal from './ScrollReveal'

// These will be updated with real values after the first pipeline run
const META = {
  issueNumber: null as number | null,
  prNumber: null as number | null,
  issueUrl: '#',
  prUrl: '#',
}

export default function MetaSection() {
  return (
    <section className={styles.section}>
      <div className="content">
        <ScrollReveal>
          <p className={styles.eyebrow}>This page was built by the pipeline</p>
        </ScrollReveal>
        <ScrollReveal delay={55}>
          <p className={styles.description}>
            This site is a Next.js app deployed on Vercel. It was implemented by
            repo-assist, reviewed by pr-review-agent, and deployed on merge. The
            pipeline&apos;s first customer is itself.
          </p>
        </ScrollReveal>
        {META.issueNumber && (
          <ScrollReveal delay={110}>
            <div className={styles.chain}>
              <a href={META.issueUrl} target="_blank" rel="noopener noreferrer" className={styles.chainLink}>
                Issue #{META.issueNumber}
              </a>
              <span className={styles.arrow}>&rarr;</span>
              <a href={META.prUrl} target="_blank" rel="noopener noreferrer" className={styles.chainLink}>
                PR #{META.prNumber}
              </a>
              <span className={styles.arrow}>&rarr;</span>
              <span className={styles.chainLink}>Deployed</span>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  )
}
```

**Step 3: Add to page.tsx** after `<HowItWorks />`

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add MetaSection — this page was built by the pipeline"
```

---

## Task 9: StatsBar (ISR)

**Files:**
- Create: `src/lib/github.ts`
- Create: `src/components/StatsBar.tsx`, `src/components/StatsBar.module.css`

**Step 1: Write github.ts**

```typescript
const REPO = 'samuelkahessay/prd-to-prod-template'
const API = 'https://api.github.com'

interface Stats {
  prsMerged: number
  deploys: number
  selfHeals: number
}

export async function getStats(): Promise<Stats> {
  try {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'prd-to-prod-landing',
    }

    // Fetch closed PRs (merged)
    const prsRes = await fetch(`${API}/repos/${REPO}/pulls?state=closed&per_page=100`, {
      headers,
      next: { revalidate: 3600 },
    })
    const prs = prsRes.ok ? await prsRes.json() : []
    const prsMerged = Array.isArray(prs) ? prs.filter((pr: { merged_at: string | null }) => pr.merged_at).length : 0

    // Fetch workflow runs
    const runsRes = await fetch(`${API}/repos/${REPO}/actions/runs?per_page=100`, {
      headers,
      next: { revalidate: 3600 },
    })
    const runsData = runsRes.ok ? await runsRes.json() : { workflow_runs: [] }
    const runs = runsData.workflow_runs || []

    const deploys = runs.filter(
      (r: { name: string; conclusion: string }) =>
        r.name === 'Deploy to Vercel' && r.conclusion === 'success'
    ).length

    const selfHeals = runs.filter(
      (r: { name: string; conclusion: string }) =>
        r.name === 'Auto-Dispatch Pipeline Issues' && r.conclusion === 'success'
    ).length

    return { prsMerged, deploys, selfHeals }
  } catch {
    return { prsMerged: 0, deploys: 0, selfHeals: 0 }
  }
}
```

**Step 2: Write StatsBar.module.css**

```css
.bar {
  padding: 2rem 0;
  border-bottom: 1px solid var(--border);
}

.stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  font-family: monospace;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label {
  color: var(--text-muted);
}

.value {
  color: var(--text);
}

@media (max-width: 768px) {
  .stats {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
}
```

**Step 3: Write StatsBar.tsx**

```tsx
import { getStats } from '@/lib/github'
import styles from './StatsBar.module.css'

export default async function StatsBar() {
  const stats = await getStats()

  return (
    <section className={styles.bar}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>PRs Merged</span>
          <span className={styles.value}>{stats.prsMerged}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Deploys</span>
          <span className={styles.value}>{stats.deploys}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Self-Heals</span>
          <span className={styles.value}>{stats.selfHeals}</span>
        </div>
      </div>
    </section>
  )
}
```

**Step 4: Add to page.tsx** after `<MetaSection />`

Note: `StatsBar` is an `async` server component. Next.js App Router supports this natively.

**Step 5: Verify build**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add StatsBar with ISR-fetched GitHub API stats"
```

---

## Task 10: GetStarted + Footer

**Files:**
- Create: `src/components/GetStarted.tsx`, `src/components/GetStarted.module.css`
- Create: `src/components/Footer.tsx`, `src/components/Footer.module.css`

**Step 1: Write GetStarted.module.css**

```css
.section {
  padding: 8rem 0;
  text-align: center;
  border-bottom: 1px solid var(--border);
}

.title {
  font-family: var(--font-serif), Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 5vw, 3.5rem);
  letter-spacing: -0.03em;
  margin-bottom: 2.5rem;
}

.cta {
  display: inline-block;
  font-family: monospace;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 1rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.cta:hover {
  background: #fff;
  color: #000;
  border-color: #fff;
}
```

**Step 2: Write GetStarted.tsx**

```tsx
import styles from './GetStarted.module.css'
import ScrollReveal from './ScrollReveal'

const TEMPLATE_URL = 'https://github.com/samuelkahessay/prd-to-prod-template/generate'

export default function GetStarted() {
  return (
    <section className={styles.section}>
      <div className="content">
        <ScrollReveal>
          <h2 className={styles.title}>Start building.</h2>
        </ScrollReveal>
        <ScrollReveal delay={55}>
          <a href={TEMPLATE_URL} target="_blank" rel="noopener noreferrer" className={styles.cta}>
            Use this template &rarr;
          </a>
        </ScrollReveal>
      </div>
    </section>
  )
}
```

**Step 3: Write Footer.module.css**

```css
.footer {
  padding: 2rem 0;
  text-align: center;
  font-family: monospace;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
```

**Step 4: Write Footer.tsx**

```tsx
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      Built by the pipeline. Powered by gh-aw.
    </footer>
  )
}
```

**Step 5: Add both to page.tsx** after `<StatsBar />`

**Step 6: Verify build**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add GetStarted CTA and Footer"
```

---

## Task 11: Final Assembly + Page.tsx

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Write final page.tsx**

```tsx
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Pipeline from '@/components/Pipeline'
import HowItWorks from '@/components/HowItWorks'
import MetaSection from '@/components/MetaSection'
import StatsBar from '@/components/StatsBar'
import GetStarted from '@/components/GetStarted'
import Footer from '@/components/Footer'
import MagneticCursor from '@/components/MagneticCursor'

export default function Home() {
  return (
    <>
      <MagneticCursor />
      <Nav />
      <main>
        <Hero />
        <Pipeline />
        <HowItWorks />
        <MetaSection />
        <StatsBar />
        <GetStarted />
        <Footer />
      </main>
    </>
  )
}
```

**Step 2: Run full build**

```bash
npm run build
```

Expected: Successful build with all components.

**Step 3: Run dev server and visually verify**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- Hero canvas animates with white curves on black
- Nav is visible with blend-mode difference
- Pipeline particles flow through stages
- HowItWorks steps reveal on scroll
- MetaSection renders (without issue/PR links yet)
- StatsBar shows numbers (may be 0s if API rate limited)
- GetStarted CTA and Footer render
- Magnetic cursor works on desktop

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: assemble complete landing page"
```

---

## Task 12: Push + Verify CI

**Step 1: Push to GitHub**

```bash
git push origin main
```

**Step 2: Verify CI passes**

```bash
gh run list --repo samuelkahessay/prd-to-prod-template --limit 3 --json databaseId,name,status,conclusion
```

Expected: Node CI passes (`npm ci`, `npm run build`, `npm test`).

**Step 3: Set up Vercel deployment**

This is a manual step:
1. Go to vercel.com → New Project → Import `prd-to-prod-template`
2. Framework: Next.js (auto-detected)
3. Deploy
4. Note the `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from `.vercel/project.json`
5. Set secrets:

```bash
gh secret set VERCEL_TOKEN --repo samuelkahessay/prd-to-prod-template
gh secret set VERCEL_ORG_ID --repo samuelkahessay/prd-to-prod-template
gh secret set VERCEL_PROJECT_ID --repo samuelkahessay/prd-to-prod-template
```

**Step 4: Trigger deploy**

```bash
gh workflow run "Deploy to Vercel" --repo samuelkahessay/prd-to-prod-template
```

**Step 5: Verify site is live**

Check the Vercel URL. The landing page should be live.

---

## Post-Implementation

- Update `MetaSection.tsx` with real issue/PR numbers once the pipeline has done work on the page
- Update the plan document header to mark Phase 4 complete
- Consider adding OG image generation for social sharing
