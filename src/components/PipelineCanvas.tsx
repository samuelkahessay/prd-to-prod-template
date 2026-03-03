'use client'

import { useEffect, useRef } from 'react'

const STAGES = ['DECOMPOSE', 'IMPLEMENT', 'REVIEW', 'MERGE', 'DEPLOY', 'HEAL']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
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
    const mouse = { x: -1, y: -1 }
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
        trail: [],
        opacity: 0.3 + Math.random() * 0.5,
        size: 1 + Math.random() * 1.5,
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      const progress = progressRef.current
      const stageWidth = W / STAGES.length

      // Subtle grid
      ctx!.fillStyle = 'rgba(255, 255, 255, 0.02)'
      for (let x = 0; x < W; x += 40) {
        for (let y = 0; y < H; y += 40) {
          ctx!.fillRect(x, y, 1, 1)
        }
      }

      // Stage labels and separators
      STAGES.forEach((label, i) => {
        const x = stageWidth * i + stageWidth / 2
        const stageProgress = (i + 1) / STAGES.length
        const active = progress >= stageProgress - 0.1

        ctx!.font = '11px monospace'
        ctx!.textAlign = 'center'
        ctx!.fillStyle = active ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.15)'
        ctx!.fillText(label, x, H - 30)

        if (i > 0) {
          ctx!.beginPath()
          ctx!.moveTo(stageWidth * i, 0)
          ctx!.lineTo(stageWidth * i, H)
          ctx!.strokeStyle = 'rgba(255, 255, 255, 0.04)'
          ctx!.lineWidth = 1
          ctx!.stroke()
        }
      })

      // Spawn
      if (particles.length < 120 && Math.random() > 0.92) {
        particles.push(spawnParticle())
      }

      // Update + draw particles
      particles = particles.filter((p) => {
        p.vy += (Math.random() - 0.5) * 0.05
        p.vy *= 0.98

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

        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 12) p.trail.shift()

        for (let i = 0; i < p.trail.length - 1; i++) {
          const t = p.trail[i]
          const alpha = (i / p.trail.length) * p.opacity * 0.3
          ctx!.beginPath()
          ctx!.arc(t.x, t.y, p.size * 0.5, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`
          ctx!.fill()
        }

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
        ctx!.fill()

        // HEAL loop-back
        if (p.x > W + 10) {
          if (Math.random() > 0.5) {
            p.x = stageWidth * 1
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
