import { useState } from 'react'
import { profile } from '../../data'
import { ArrowUpRight, GithubIcon, LinkedinIcon, MailIcon } from '../icons'
import Window from './Window'

const field = 'w-full bg-transparent py-2.5 text-sm text-mist placeholder:text-mist/35 focus:outline-none'

export default function MailWindow() {
  const [from, setFrom] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const send = (e) => {
    e.preventDefault()
    const body = from ? `${message}\n\n— ${from}` : message
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject || 'Hello Nina')}&body=${encodeURIComponent(body)}`
  }

  const links = [
    { label: 'LinkedIn', sub: 'nina-vardosanidze', href: profile.linkedin, Icon: LinkedinIcon, tint: 'text-[#4ea3ff]' },
    { label: 'GitHub', sub: 'ninavardo', href: profile.github, Icon: GithubIcon, tint: 'text-mist' },
    { label: 'Email', sub: profile.email, href: `mailto:${profile.email}`, Icon: MailIcon, tint: 'text-amber' },
  ]

  return (
    <Window id="contact" title="Mail — New message" icon={<MailIcon className="size-4" />} bodyClassName="grid md:grid-cols-[1fr_300px]">
      <form onSubmit={send} className="p-5 md:p-8">
        <h2 className="font-display text-3xl font-bold leading-tight md:text-5xl">
          Let's build
          <br />
          something<span className="text-amber">.</span>
        </h2>
        <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
          <div className="flex items-center gap-3 py-2.5 text-sm">
            <span className="w-16 font-mono text-[11px] text-mist/45">To</span>
            <span className="rounded-full bg-amber/15 px-2.5 py-0.5 text-amber">
              {profile.firstName} {profile.lastName}
            </span>
          </div>
          <label className="flex items-center gap-3">
            <span className="w-16 font-mono text-[11px] text-mist/45">From</span>
            <input className={field} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your name or company" />
          </label>
          <label className="flex items-center gap-3">
            <span className="w-16 font-mono text-[11px] text-mist/45">Subject</span>
            <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="A role, a project, a question…" />
          </label>
        </div>
        <textarea
          className={`${field} mt-2 min-h-36 resize-none`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message here. Send opens it in your mail app."
        />
        <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-ember to-amber px-5 py-2.5 text-sm font-semibold text-night transition hover:brightness-110">
          Send <ArrowUpRight className="size-4" />
        </button>
      </form>

      <aside className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.02] p-5 md:border-l md:border-t-0 md:p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-mist/40">Find me elsewhere</p>
        {links.map(({ label, sub, href, Icon, tint }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('mailto') ? undefined : '_blank'}
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-white/10 p-3 transition hover:border-white/25 hover:bg-white/5"
          >
            <Icon className={`size-5 shrink-0 ${tint}`} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block truncate font-mono text-[11px] text-mist/50">{sub}</span>
            </span>
            <ArrowUpRight className="ml-auto size-4 shrink-0 text-mist/40 transition group-hover:text-mist" />
          </a>
        ))}
        <div className="mt-auto rounded-xl border border-teal/25 bg-teal/5 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-teal">
            <span className="size-2 rounded-full bg-teal shadow-[0_0_10px_#4fd1c5]" /> Open to work
          </p>
          <p className="mt-1 text-xs text-mist/60">Tbilisi · GMT+4 · remote friendly</p>
        </div>
      </aside>
    </Window>
  )
}
