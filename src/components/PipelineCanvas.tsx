'use client'

import { useEffect, useRef } from 'react'

/* ── Node definitions ──────────────────────────────────────── */

interface Node {
  id: string
  label: string
  /** Position as fraction of canvas (0-1) */
  fx: number
  fy: number
}

const NODES: Node[] = [
  { id: 'prd',        label: 'PRD',        fx: 0.06, fy: 0.30 },
  { id: 'decompose',  label: 'DECOMPOSE',  fx: 0.20, fy: 0.30 },
  { id: 'implement',  label: 'IMPLEMENT',  fx: 0.37, fy: 0.30 },
  { id: 'review',     label: 'REVIEW',     fx: 0.54, fy: 0.30 },
  { id: 'merge',      label: 'MERGE',      fx: 0.71, fy: 0.30 },
  { id: 'deploy',     label: 'DEPLOY',     fx: 0.88, fy: 0.30 },
  // Self-healing loop (lower)
  { id: 'detect',     label: 'DETECT',     fx: 0.80, fy: 0.72 },
  { id: 'repair',     label: 'REPAIR',     fx: 0.54, fy: 0.72 },
]

/* ── Edge definitions ──────────────────────────────────────── */

interface Edge {
  from: string
  to: string
  /** Control point offsets for bezier (fractions of W/H) */
  cx1?: number
  cy1?: number
  cx2?: number
  cy2?: number
  /** Probability that a particle takes this edge (0-1) */
  weight: number
  /** Visual: dashed for rejection/failure paths */
  dashed?: boolean
}

const EDGES: Edge[] = [
  // Main flow
  { from: 'prd',       to: 'decompose', weight: 1.0 },
  { from: 'decompose', to: 'implement', weight: 1.0 },
  { from: 'implement', to: 'review',    weight: 1.0 },
  { from: 'review',    to: 'merge',     weight: 0.78 },
  { from: 'merge',     to: 'deploy',    weight: 1.0 },
  // Review rejection loop (arc back)
  { from: 'review',    to: 'implement', weight: 0.22, cx1: 0.48, cy1: 0.10, cx2: 0.40, cy2: 0.10, dashed: true },
  // Self-healing: deploy failure
  { from: 'deploy',    to: 'detect',    weight: 0.18, dashed: true },
  { from: 'detect',    to: 'repair',    weight: 1.0 },
  // Repair returns to review
  { from: 'repair',    to: 'review',    weight: 1.0, cx1: 0.42, cy1: 0.60, cx2: 0.48, cy2: 0.40 },
]

/* ── Particle ──────────────────────────────────────────────── */

interface Particle {
  x: number
  y: number
  tx: number
  ty: number
  vx: number
  vy: number
  currentNode: string
  nextNode: string | null
  edge: Edge | null
  t: number          // progress along edge (0-1)
  speed: number
  size: number
  opacity: number
  phase: number
  floatAmp: number
  waitTime: number   // frames to dwell at node
}

/* ── Helpers ───────────────────────────────────────────────── */

function nodeById(id: string): Node {
  return NODES.find(n => n.id === id)!
}

function edgesFrom(id: string): Edge[] {
  return EDGES.filter(e => e.from === id)
}

function pickEdge(edges: Edge[]): Edge | null {
  if (edges.length === 0) return null
  const r = Math.random()
  let cumulative = 0
  for (const e of edges) {
    cumulative += e.weight
    if (r <= cumulative) return e
  }
  return edges[edges.length - 1]
}

function bezierPoint(
  x0: number, y0: number,
  cx1: number, cy1: number,
  cx2: number, cy2: number,
  x1: number, y1: number,
  t: number
) {
  const mt = 1 - t
  return {
    x: mt * mt * mt * x0 + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * x1,
    y: mt * mt * mt * y0 + 3 * mt * mt * t * cy1 + 3 * mt * t * t * cy2 + t * t * t * y1,
  }
}

/* ── Component ─────────────────────────────────────────────── */

export default function PipelineCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
    let frameCount = 0
    // Track glow intensity per node
    const nodeGlow: Record<string, number> = {}
    NODES.forEach(n => { nodeGlow[n.id] = 0 })

    function resize() {
      W = canvas!.width = canvas!.offsetWidth
      H = canvas!.height = canvas!.offsetHeight
    }

    function nx(node: Node) { return node.fx * W }
    function ny(node: Node) { return node.fy * H }

    function spawnParticle(): Particle {
      const start = nodeById('prd')
      return {
        x: nx(start),
        y: ny(start),
        tx: nx(start),
        ty: ny(start),
        vx: 0,
        vy: 0,
        currentNode: 'prd',
        nextNode: null,
        edge: null,
        t: 0,
        speed: 0.006 + Math.random() * 0.008,
        size: 1.5 + Math.random() * 1.5,
        opacity: 0.5 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        floatAmp: 1.5 + Math.random() * 2.5,
        waitTime: 30 + Math.floor(Math.random() * 60),
      }
    }

    function getEdgePoint(edge: Edge, t: number) {
      const fromNode = nodeById(edge.from)
      const toNode = nodeById(edge.to)
      const x0 = nx(fromNode)
      const y0 = ny(fromNode)
      const x1 = nx(toNode)
      const y1 = ny(toNode)

      if (edge.cx1 !== undefined) {
        return bezierPoint(
          x0, y0,
          edge.cx1 * W, edge.cy1! * H,
          edge.cx2! * W, edge.cy2! * H,
          x1, y1,
          t
        )
      }

      // Default: gentle arc
      const midX = (x0 + x1) / 2
      const midY = (y0 + y1) / 2 - 8
      return bezierPoint(x0, y0, midX, midY, midX, midY, x1, y1, t)
    }

    /* ── Drawing ─────────────────────────────────── */

    function drawEdges() {
      for (const edge of EDGES) {
        const from = nodeById(edge.from)
        const to = nodeById(edge.to)
        const x0 = nx(from), y0 = ny(from)
        const x1 = nx(to), y1 = ny(to)

        ctx!.beginPath()

        if (edge.dashed) {
          ctx!.setLineDash([4, 6])
          ctx!.strokeStyle = 'rgba(255, 255, 255, 0.06)'
        } else {
          ctx!.setLineDash([])
          ctx!.strokeStyle = 'rgba(255, 255, 255, 0.10)'
        }
        ctx!.lineWidth = 1

        if (edge.cx1 !== undefined) {
          ctx!.moveTo(x0, y0)
          ctx!.bezierCurveTo(
            edge.cx1 * W, edge.cy1! * H,
            edge.cx2! * W, edge.cy2! * H,
            x1, y1
          )
        } else {
          const midX = (x0 + x1) / 2
          const midY = (y0 + y1) / 2 - 8
          ctx!.moveTo(x0, y0)
          ctx!.quadraticCurveTo(midX, midY, x1, y1)
        }

        ctx!.stroke()
        ctx!.setLineDash([])

        // Direction arrow at midpoint
        const arrowT = 0.55
        const p = getEdgePoint(edge, arrowT)
        const p2 = getEdgePoint(edge, arrowT + 0.03)
        const angle = Math.atan2(p2.y - p.y, p2.x - p.x)
        const arrowSize = 4

        ctx!.beginPath()
        ctx!.moveTo(
          p.x + Math.cos(angle) * arrowSize,
          p.y + Math.sin(angle) * arrowSize
        )
        ctx!.lineTo(
          p.x + Math.cos(angle + 2.5) * arrowSize,
          p.y + Math.sin(angle + 2.5) * arrowSize
        )
        ctx!.lineTo(
          p.x + Math.cos(angle - 2.5) * arrowSize,
          p.y + Math.sin(angle - 2.5) * arrowSize
        )
        ctx!.closePath()
        ctx!.fillStyle = edge.dashed ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)'
        ctx!.fill()
      }
    }

    function drawNodes() {
      for (const node of NODES) {
        const x = nx(node)
        const y = ny(node)
        const glow = nodeGlow[node.id]

        // Glow ring
        if (glow > 0.01) {
          ctx!.beginPath()
          ctx!.arc(x, y, 10 + glow * 6, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(255, 255, 255, ${glow * 0.08})`
          ctx!.fill()
        }

        // Node circle
        ctx!.beginPath()
        ctx!.arc(x, y, 4, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255, 255, 255, ${0.25 + glow * 0.6})`
        ctx!.fill()

        // Ring
        ctx!.beginPath()
        ctx!.arc(x, y, 7, 0, Math.PI * 2)
        ctx!.strokeStyle = `rgba(255, 255, 255, ${0.10 + glow * 0.3})`
        ctx!.lineWidth = 1
        ctx!.stroke()

        // Label
        ctx!.font = '10px monospace'
        ctx!.textAlign = 'center'
        ctx!.fillStyle = `rgba(255, 255, 255, ${0.35 + glow * 0.4})`
        ctx!.fillText(node.label, x, y + 22)

        // Decay glow
        nodeGlow[node.id] *= 0.96
      }
    }

    function drawParticles() {
      for (const p of particles) {
        // Float bob
        const floatY = Math.sin(frameCount * 0.03 + p.phase) * p.floatAmp

        // Spring toward target
        const spring = 0.06
        const damping = 0.78

        const fx = (p.tx - p.x) * spring
        const fy = (p.ty + floatY - p.y) * spring
        p.vx = (p.vx + fx) * damping
        p.vy = (p.vy + fy) * damping

        // Mouse repulsion
        if (mouse.x >= 0) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 50) {
            const force = (50 - dist) / 50 * 2
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }

        p.x += p.vx
        p.y += p.vy

        // Draw particle
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
        ctx!.fill()

        // Small trail
        ctx!.beginPath()
        ctx!.arc(p.x - p.vx * 3, p.y - p.vy * 3, p.size * 0.5, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.25})`
        ctx!.fill()
      }
    }

    /* ── Particle state machine ──────────────────── */

    function updateParticles() {
      particles = particles.filter(p => {
        // Dwelling at node
        if (p.edge === null) {
          p.waitTime--
          if (p.waitTime <= 0) {
            // Pick next edge
            const edges = edgesFrom(p.currentNode)
            const edge = pickEdge(edges)
            if (!edge) {
              // Terminal: deploy success — fade out
              p.opacity -= 0.02
              return p.opacity > 0
            }
            p.edge = edge
            p.nextNode = edge.to
            p.t = 0
            // Review is slowest
            if (p.currentNode === 'review') {
              p.speed *= 0.6
            }
          }
          return true
        }

        // Traveling along edge
        p.t += p.speed
        if (p.t >= 1) {
          // Arrived at next node
          p.currentNode = p.nextNode!
          p.nextNode = null
          p.edge = null
          p.t = 0
          const node = nodeById(p.currentNode)
          p.tx = nx(node)
          p.ty = ny(node)
          // Trigger glow
          nodeGlow[p.currentNode] = 1
          // Reset speed
          p.speed = 0.006 + Math.random() * 0.008
          // Dwell time varies by stage
          const dwellMap: Record<string, number> = {
            prd: 20, decompose: 40, implement: 80,
            review: 120, merge: 30, deploy: 40,
            detect: 50, repair: 90,
          }
          p.waitTime = (dwellMap[p.currentNode] || 40) + Math.floor(Math.random() * 40)
          return true
        }

        // Update target to bezier point on edge
        const pt = getEdgePoint(p.edge, p.t)
        p.tx = pt.x
        p.ty = pt.y
        return true
      })
    }

    /* ── Main loop ───────────────────────────────── */

    function draw_loop() {
      ctx!.clearRect(0, 0, W, H)
      frameCount++

      drawEdges()
      drawNodes()
      updateParticles()
      drawParticles()

      // Spawn new particles periodically
      if (particles.length < 40 && frameCount % 25 === 0) {
        particles.push(spawnParticle())
      }

      animId = requestAnimationFrame(draw_loop)
    }

    // Mouse
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
    // Pre-seed some particles along the pipeline
    for (let i = 0; i < 15; i++) {
      const p = spawnParticle()
      const nodeIndex = Math.floor(Math.random() * 6)
      const node = NODES[nodeIndex]
      p.currentNode = node.id
      p.x = nx(node) + (Math.random() - 0.5) * 20
      p.y = ny(node) + (Math.random() - 0.5) * 10
      p.tx = nx(node)
      p.ty = ny(node)
      p.waitTime = Math.floor(Math.random() * 60)
      particles.push(p)
    }
    animId = requestAnimationFrame(draw_loop)

    return () => {
      cancelAnimationFrame(animId)
      canvas!.removeEventListener('mousemove', onMove)
      canvas!.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}
