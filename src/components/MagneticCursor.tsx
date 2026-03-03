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

    import('gsap').then((mod) => {
      const gsap = mod.gsap || mod.default

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
    })
  }, [])

  return (
    <>
      <div ref={dotRef} className={styles.dot} />
      <div ref={ringRef} className={styles.ring} />
    </>
  )
}
