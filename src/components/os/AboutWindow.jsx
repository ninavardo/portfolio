import { lazy, Suspense } from 'react'
import { profile } from '../../data'
import { UserIcon } from '../icons'
import Window from './Window'

const WebcamScene = lazy(() => import('../../three/WebcamScene'))

export default function AboutWindow() {
  return (
    <Window id="about" title="about-nina.md" icon={<UserIcon className="size-4" />}>
      <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#3b2a63,#120f2e_70%)]">
          <Suspense fallback={null}>
            <WebcamScene />
          </Suspense>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/50 to-transparent px-3 py-2 font-mono text-[10px] text-mist/80">
            <span className="size-1.5 animate-pulse rounded-full bg-[#ff4d4d]" />
            LIVE · camera.app
          </div>
          <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 font-mono text-[10px] text-mist/70">
            <span className="hidden md:inline">move your cursor, she's watching</span>
            <span className="md:hidden">she's watching you</span>
          </p>
        </div>

        <div className="flex flex-col justify-center">
          <p className="font-mono text-xs text-teal"># about</p>
          <h2 className="mt-2 font-display text-3xl font-bold leading-tight md:text-5xl">
            Hi, I'm {profile.firstName}<span className="text-amber">.</span>
          </h2>
          <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-mist/75 md:text-base">
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4">
            {profile.facts.map((f) => (
              <div key={f.label} className="border-l border-amber/40 pl-3">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-amber/80">{f.label}</dt>
                <dd className="mt-0.5 text-sm text-mist/90">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Window>
  )
}
