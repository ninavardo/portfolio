import { useEffect, useRef, useState } from 'react'
import { gsap } from '../scroll'
import { onModelProgress } from '../three/progress'

const STEPS = ['Lighting up Tbilisi', 'Painting the balcony', 'Waking Nina up', 'Opening the laptop']

export default function BootLoader({ onDone }) {
  const root = useRef(null)
  const [progress, setProgress] = useState(0)
  const shown = useRef({ value: 0 })
  const counter = useRef(null)
  const bar = useRef(null)
  const finished = useRef(false)

  useEffect(() => onModelProgress(setProgress), [])

  useEffect(() => {
    const target = Math.min(progress, 0.97) * 100
    const tween = gsap.to(shown.current, {
      value: progress >= 1 ? 100 : target,
      duration: progress >= 1 ? 0.6 : 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        const v = shown.current.value
        counter.current.textContent = `${Math.round(v)}%`
        bar.current.style.transform = `scaleX(${v / 100})`
      },
      onComplete: () => {
        if (progress < 1 || finished.current) return
        finished.current = true
        gsap.to(root.current, { opacity: 0, duration: 0.9, delay: 0.25, ease: 'power2.inOut', onStart: onDone })
      },
    })
    return () => tween.kill()
  }, [progress, onDone])

  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))]

  return (
    <div ref={root} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-night">
      <span className="font-georgian text-7xl font-bold text-amber drop-shadow-[0_0_30px_rgba(255,179,71,0.55)] animate-float-slow">ნ</span>
      <div className="mt-10 w-60">
        <div className="flex justify-between font-mono text-[11px] text-mist/60">
          <span>{step}…</span>
          <span ref={counter}>0%</span>
        </div>
        <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-white/10">
          <div ref={bar} className="h-full origin-left scale-x-0 bg-gradient-to-r from-ember to-amber" />
        </div>
      </div>
    </div>
  )
}
