import { useEffect, useRef } from 'react'
import { gsap } from '../../scroll'
import { journey } from '../../data'
import { BranchIcon } from '../icons'
import Window from './Window'

const HASHES = ['a3f9c21', '7be04d9', 'c51e8a2', '0d4f7b6']
const BRANCHES = ['HEAD → tourlify', 'geolab', 'erasmus/coimbra', 'gau']
const DOTS = ['bg-amber', 'bg-teal', 'bg-[#a78bfa]', 'bg-ember']

export default function JourneyWindow() {
  const root = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.git-line', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.git-log', start: 'top 70%', end: 'bottom 70%', scrub: true } })
      gsap.utils.toArray('.git-commit').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <Window id="journey" title="git log --graph journey" icon={<BranchIcon className="size-4" />}>
      <div ref={root}>
        <h2 className="font-display text-3xl font-bold md:text-4xl">
          My journey<span className="text-amber">.</span>
        </h2>
        <p className="mt-2 font-mono text-xs text-mist/50">4 commits on main · newest first</p>

        <ol className="git-log relative mt-10 space-y-10">
          <span className="absolute bottom-0 left-[7px] top-1 w-0.5 bg-white/10" />
          <span className="git-line absolute bottom-0 left-[7px] top-1 w-0.5 origin-top bg-gradient-to-b from-amber via-teal to-ember" />
          {journey.map((item, i) => (
            <li key={item.title} className="git-commit relative pl-10">
              <span className={`absolute left-0 top-1.5 size-4 rounded-full border-4 border-[#141838] ${DOTS[i % DOTS.length]}`} />
              <p className="font-mono text-xs">
                <span className="text-amber">commit {HASHES[i]}</span>
                <span className="ml-2 rounded bg-teal/15 px-1.5 py-0.5 text-teal">{BRANCHES[i]}</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-mist/45">Date: {item.period}</p>
              <h3 className="mt-3 text-xl font-semibold md:text-2xl">{item.title}</h3>
              <p className="text-sm text-ember">{item.place}</p>
              <ul className="mt-3 space-y-1.5 text-[15px] leading-relaxed text-mist/70">
                {item.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="font-mono text-teal">+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </Window>
  )
}
