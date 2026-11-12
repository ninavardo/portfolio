import { useEffect, useRef } from 'react'
import { gsap, scrollToTop } from '../../scroll'
import { profile } from '../../data'
import { PowerIcon } from '../icons'
import AboutWindow from './AboutWindow'
import Dock from './Dock'
import DocumentsWindow from './DocumentsWindow'
import JourneyWindow from './JourneyWindow'
import MailWindow from './MailWindow'
import ProjectsWindow from './ProjectsWindow'
import Skyline from './Skyline'
import TerminalWindow from './TerminalWindow'

export default function Desktop() {
  const root = useRef(null)
  const wallpaper = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.os-window').forEach((win) => {
        gsap.fromTo(
          win,
          { opacity: 0, y: 120, scale: 0.9, rotateX: 10, transformPerspective: 1200, transformOrigin: '50% 100%' },
          { opacity: 1, y: 0, scale: 1, rotateX: 0, ease: 'power2.out', scrollTrigger: { trigger: win, start: 'top 95%', end: 'top 55%', scrub: 0.8 } },
        )
      })
      // The balcony ends on an identical copy of this wallpaper, so swapping them is invisible.
      gsap.fromTo(wallpaper.current, { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: document.getElementById('home'), start: 'bottom 101%', end: 'bottom bottom', scrub: true } })
      gsap.fromTo(
        '.desk-greeting',
        { opacity: 0, y: 40, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', ease: 'power2.out', scrollTrigger: { trigger: '.desk-greeting', start: 'top 92%', end: 'top 55%', scrub: 0.6 } },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="desktop" ref={root} className="relative -mt-[100svh]">
      <div ref={wallpaper} className="wallpaper sticky top-0 -mb-[100svh] h-svh overflow-hidden">
        <Skyline className="absolute inset-x-0 bottom-0 h-[38vh] w-full" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-24 px-4 pb-44 pt-[calc(100svh+7rem)] md:gap-36 md:px-8">
        <div className="desk-greeting text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber/80">Welcome to</p>
          <p className="mt-2 font-display text-4xl font-bold md:text-6xl">Nina OS</p>
          <p className="mt-3 text-mist/60">Everything about me lives in these windows. Keep scrolling, or use the dock.</p>
        </div>

        <AboutWindow />
        <TerminalWindow />
        <JourneyWindow />
        <ProjectsWindow />
        <DocumentsWindow />
        <MailWindow />

        <footer className="flex flex-col items-center gap-4 text-center">
          <button
            type="button"
            onClick={scrollToTop}
            className="group flex items-center gap-2 rounded-full border border-white/15 bg-night/50 px-5 py-2.5 text-sm text-mist/80 backdrop-blur transition hover:border-ember hover:text-ember"
          >
            <PowerIcon className="size-4 transition group-hover:rotate-90" />
            Shut down and go back to the balcony
          </button>
          <p className="font-mono text-[11px] text-mist/40">
            © {new Date().getFullYear()} {profile.firstName} {profile.lastName} · built in Tbilisi with React, Three.js and a glass of Saperavi
          </p>
        </footer>
      </div>

      <Dock />
    </section>
  )
}
