import { useState } from 'react'
import { documents, learnModules, learnTranscript } from '../../data'
import { ArrowUpRight, AwardIcon, DocumentIcon, DownloadIcon, FolderIcon } from '../icons'
import QuickLook from './QuickLook'
import Window from './Window'

const FOLDERS = ['All', 'CV', 'Certificates', 'Microsoft Learn']
const count = (folder) => {
  if (folder === 'Microsoft Learn') return learnModules.length
  if (folder === 'All') return documents.length + learnModules.length
  return documents.filter((d) => d.kind === folder).length
}

function DocumentActions({ doc }) {
  if (!doc.pdf) {
    return (
      <a href={doc.image} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10">
        Full size <ArrowUpRight className="size-4" />
      </a>
    )
  }
  return (
    <>
      <a href={doc.pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-night transition hover:brightness-110">
        Open PDF <ArrowUpRight className="size-4" />
      </a>
      <a href={doc.pdf} download className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10">
        <DownloadIcon className="size-4" /> Download
      </a>
    </>
  )
}

function LearnModules() {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-mono text-xs uppercase tracking-widest text-mist/50">Microsoft Learn · modules</h3>
        {learnTranscript && (
          <a href={learnTranscript} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-teal hover:underline">
            Verify on Microsoft Learn <ArrowUpRight className="size-3" />
          </a>
        )}
      </div>
      <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.02]">
        {learnModules.map((m) => (
          <li key={m.title} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
            <img src="/docs/ms-learn-badge.jpg" alt="" loading="lazy" className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
              <p className="text-sm leading-snug text-mist/85">{m.title}</p>
              {m.passed && (
                <span className="mt-1 inline-block shrink-0 rounded-full border border-[#34d399]/40 bg-[#34d399]/10 px-2 py-0.5 font-mono text-[10px] text-[#6ee7b7] sm:ml-auto sm:mt-0">
                  assessment passed
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Preview({ doc, onClose }) {
  return (
    <QuickLook file={doc.file} label={doc.title} onClose={onClose} className={doc.portrait ? 'max-w-3xl' : 'max-w-4xl'}>
      <img src={doc.image} alt={doc.title} className="w-full border-b border-white/10 bg-white" />
      <div className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:p-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-amber/80">{doc.kind === 'CV' ? 'Résumé' : 'Certificate'}</p>
          <h3 className="mt-1 font-display text-xl font-bold md:text-2xl">{doc.title}</h3>
          <p className="mt-1 text-sm text-mist/60">
            {doc.issuer} · {doc.date}
          </p>
        </div>
        <div className="flex gap-3 md:ml-auto">
          <DocumentActions doc={doc} />
        </div>
      </div>
    </QuickLook>
  )
}

export default function DocumentsWindow() {
  const [folder, setFolder] = useState('All')
  const [open, setOpen] = useState(null)
  const shown = documents.filter((d) => folder === 'All' || d.kind === folder)
  const cv = documents.find((d) => d.pdf)

  return (
    <Window id="documents" title="~/documents" icon={<DocumentIcon className="size-4" />} bodyClassName="grid md:grid-cols-[180px_1fr]">
      <aside className="flex gap-1 overflow-x-auto border-b border-white/10 p-3 md:flex-col md:border-b-0 md:border-r md:p-4">
        <p className="mb-2 hidden font-mono text-[10px] uppercase tracking-widest text-mist/40 md:block">Folders</p>
        {FOLDERS.map((f) => {
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFolder(f)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-sm transition ${
                folder === f ? 'bg-amber/15 text-amber' : 'text-mist/70 hover:bg-white/5'
              }`}
            >
              <FolderIcon className="size-4" />
              {f}
              <span className="ml-auto font-mono text-[11px] opacity-60">{count(f)}</span>
            </button>
          )
        })}
        {cv && (
          <a href={cv.pdf} download className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-mist/60 transition hover:bg-white/5 md:mt-4">
            <DownloadIcon className="size-4" /> Download CV
          </a>
        )}
      </aside>

      <div className="p-5 md:p-7">
        <h2 className="font-display text-3xl font-bold md:text-4xl">
          Documents<span className="text-amber">.</span>
        </h2>
        <p className="mt-2 text-sm text-mist/55">My CV, certificates and Microsoft Learn modules. Click any file to preview it.</p>
        <div className="mt-7 grid gap-x-5 empty:hidden gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((d) => {
            const Icon = d.kind === 'CV' ? DocumentIcon : AwardIcon
            return (
              <button key={d.file} type="button" onClick={() => setOpen(d)} className="group text-left">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white">
                  <img src={d.image} alt="" loading="lazy" className="size-full object-cover object-top transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-amber/0 transition group-hover:bg-amber/10" />
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-night/80 px-2 py-0.5 font-mono text-[10px] text-mist/80 backdrop-blur">
                    <Icon className="size-3" /> {d.kind === 'CV' ? 'PDF' : 'certificate'}
                  </span>
                </div>
                <p className="mt-3 truncate font-mono text-sm text-mist group-hover:text-amber">{d.file}</p>
                <p className="text-xs text-mist/55">
                  {d.title} · {d.date}
                </p>
              </button>
            )
          })}
        </div>
        {(folder === 'All' || folder === 'Microsoft Learn') && <LearnModules />}
      </div>
      {open && <Preview doc={open} onClose={() => setOpen(null)} />}
    </Window>
  )
}
