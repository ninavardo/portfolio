import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, scrollState } from '../scroll'
import { profile } from '../data'
import Skyline from './os/Skyline'

const BalconyScene = lazy(() => import('../three/BalconyScene'))

export default function Hero({ ready }) {
  const section = useRef(null)
  const copy = useRef(null)
  const hint = useRef(null)
  const veil = useRef(null)
  const [active, setActive] = useState(true)

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          scrollState.dive = self.progress
        },
      })
      ScrollTrigger.create({
        trigger: section.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => setActive(self.isActive),
      })
      gsap
        .timeline({ scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom bottom', scrub: true } })
        .to(copy.current, { opacity: 0, y: -40, filter: 'blur(6px)', duration: 0.16 }, 0.02)
        .to(hint.current, { opacity: 0, duration: 0.06 }, 0)
        .to(veil.current, { opacity: 1, duration: 0.16, ease: 'power1.inOut' }, 0.82)
    }, section)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-in', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out', delay: 0.2 })
    }, section)
    return () => ctx.revert()
  }, [ready])

  return (
    <section id="home" ref={section} className="relative h-[340vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <BalconyScene ready={ready} active={active} />
          </Suspense>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/85 via-night/10 to-transparent md:bg-gradient-to-r md:from-night/80 md:via-transparent" />

        <div ref={copy} className="pointer-events-none absolute inset-x-6 top-20 z-10 md:inset-x-auto md:left-[6vw] md:top-auto md:bottom-[14vh] md:max-w-xl">
          <p className="hero-in font-mono text-[11px] uppercase tracking-[0.25em] text-teal/80 opacity-0">
            41.69° N · 44.80° E — {profile.location}
          </p>
          <h1 className="hero-in mt-4 font-display text-[clamp(2.2rem,5.2vw,4.6rem)] font-bold leading-[1.02] tracking-tight opacity-0">
            {profile.firstName}
            <br />
            {profile.lastName}
          </h1>
          <p className="hero-in mt-3 font-georgian text-lg font-medium text-amber opacity-0 md:text-xl">ნინა ვარდოსანიძე</p>
          <p className="hero-in mt-5 max-w-md text-base leading-relaxed text-mist/75 opacity-0 md:text-lg">
            <span className="font-semibold text-mist">{profile.role}.</span> I build APIs, data models and the interfaces that sit on top of them.
          </p>
        </div>

        <div ref={hint} className="hero-in absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-0">
          <svg viewBox="0 0 48 32" className="animate-float-slow h-7 w-10 text-amber" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="3" width="30" height="19" rx="2" />
            <path d="M3 27h42l-3 3H6Z" />
          </svg>
          <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-mist/60">Scroll to open my laptop</span>
        </div>

        <div ref={veil} className="wallpaper pointer-events-none absolute inset-0 opacity-0">
          <Skyline className="absolute inset-x-0 bottom-0 h-[38vh] w-full" />
        </div>
      </div>
    </section>
  )
}
