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
    const mouse = { x: -1, y: -1 }
    let curves: Curve[] = []
    let animId: number

    function makeCurve(i: number, count: number): Curve {
      const p1 = { x: 0.2 + Math.random() * 0.3, y: 0.1 + Math.random() * 0.8 }
      const p2 = { x: 0.5 + Math.random() * 0.3, y: 0.1 + Math.random() * 0.8 }
      return {
        p0: { x: i / (count - 1) * 0.3, y: 0.2 + Math.random() * 0.6 },
        p1, p2,
        p3: { x: 0.7 + i / (count - 1) * 0.3, y: 0.2 + Math.random() * 0.6 },
        base1: { ...p1 }, base2: { ...p2 },
        v1: { x: 0, y: 0 }, v2: { x: 0, y: 0 },
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
