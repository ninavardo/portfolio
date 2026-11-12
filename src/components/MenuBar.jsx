import { useEffect, useState } from 'react'
import { scrollToId, scrollToTop } from '../scroll'
import { profile, sections } from '../data'
import { GithubIcon, LinkedinIcon } from './icons'

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tbilisi',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function TbilisiClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="hidden font-mono text-[11px] text-mist/70 sm:inline" title="Local time in Tbilisi">
      Tbilisi · {timeFormat.format(now)}
    </span>
  )
}

export default function MenuBar() {
  return (
    <header className="glass fixed inset-x-0 top-0 z-50 flex h-10 items-center gap-5 border-b border-white/5 px-4 text-sm md:px-6">
      <button type="button" onClick={scrollToTop} className="flex items-center gap-2" aria-label="Back to the balcony">
        <span className="font-georgian text-lg font-bold leading-none text-amber">ნ</span>
        <span className="font-semibold tracking-tight">Nina OS</span>
      </button>
      <nav className="hidden items-center gap-4 md:flex">
        {sections.map((s) => (
          <button key={s.id} type="button" onClick={() => scrollToId(s.id)} className="text-[13px] text-mist/65 transition hover:text-mist">
            {s.label}
          </button>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-4">
        <TbilisiClock />
        <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-mist/70 transition hover:text-[#4ea3ff]">
          <LinkedinIcon className="size-4" />
        </a>
        <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="text-mist/70 transition hover:text-mist">
          <GithubIcon className="size-4" />
        </a>
      </div>
    </header>
  )
}
