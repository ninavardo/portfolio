import { useState } from 'react'
import { profile, projects } from '../../data'
import { ArrowUpRight, FolderIcon, GithubIcon } from '../icons'
import QuickLook from './QuickLook'
import Window from './Window'

const FILTERS = ['All', 'Apps', 'Websites']

function Preview({ project, onClose }) {
  return (
    <QuickLook file={project.file} label={project.name} onClose={onClose}>
      <img src={project.image} alt={`${project.name} screenshot`} className="w-full border-b border-white/10" />
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
        <div>
          <h3 className="font-display text-2xl font-bold md:text-3xl">{project.name}</h3>
          <p className="mt-1 text-amber">{project.tagline}</p>
          <p className="mt-4 max-w-xl leading-relaxed text-mist/75">{project.description}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <li key={t} className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-mist/70">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3 md:flex-col">
          <a href={project.live} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-night transition hover:brightness-110">
            Open live <ArrowUpRight className="size-4" />
          </a>
          <a href={project.code} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10">
            <GithubIcon className="size-4" /> Code
          </a>
        </div>
      </div>
    </QuickLook>
  )
}

export default function ProjectsWindow() {
  const [filter, setFilter] = useState('All')
  const [open, setOpen] = useState(null)
  const shown = projects.filter((p) => filter === 'All' || p.category === filter)

  return (
    <Window id="projects" title="~/projects" icon={<FolderIcon className="size-4" />} bodyClassName="grid md:grid-cols-[180px_1fr]">
      <aside className="flex gap-1 overflow-x-auto border-b border-white/10 p-3 md:flex-col md:border-b-0 md:border-r md:p-4">
        <p className="mb-2 hidden font-mono text-[10px] uppercase tracking-widest text-mist/40 md:block">Folders</p>
        {FILTERS.map((f) => {
          const count = f === 'All' ? projects.length : projects.filter((p) => p.category === f).length
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-sm transition ${
                filter === f ? 'bg-amber/15 text-amber' : 'text-mist/70 hover:bg-white/5'
              }`}
            >
              <FolderIcon className="size-4" />
              {f}
              <span className="ml-auto font-mono text-[11px] opacity-60">{count}</span>
            </button>
          )
        })}
        <a href={profile.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-mist/60 transition hover:bg-white/5 md:mt-4">
          <GithubIcon className="size-4" /> All on GitHub
        </a>
      </aside>

      <div className="p-5 md:p-7">
        <h2 className="font-display text-3xl font-bold md:text-4xl">
          Projects<span className="text-amber">.</span>
        </h2>
        <p className="mt-2 text-sm text-mist/55">A few things I've built. Click any file to preview it.</p>
        <div className="mt-7 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <button key={p.name} type="button" onClick={() => setOpen(p)} className="group text-left">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-night">
                <img src={p.image} alt="" loading="lazy" className="size-full object-cover object-top transition duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 bg-amber/0 transition group-hover:bg-amber/10" />
              </div>
              <p className="mt-3 font-mono text-sm text-mist group-hover:text-amber">{p.file}</p>
              <p className="text-xs text-mist/55">{p.tagline}</p>
            </button>
          ))}
        </div>
      </div>
      {open && <Preview project={open} onClose={() => setOpen(null)} />}
    </Window>
  )
}
