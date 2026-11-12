import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

// Progress (0..1) of the balcony section, read every frame by the 3D scene.
export const scrollState = { dive: 0 }

let lenis = null

export function initSmoothScroll() {
  lenis = new Lenis({ lerp: 0.085 })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export const getLenis = () => lenis

export function scrollToId(id, offset = -70) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.8, offset })
  else el.scrollIntoView({ behavior: 'smooth' })
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 2.4 })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

export { gsap, ScrollTrigger }
