import { useEffect, useState } from 'react'
import { ScrollTrigger, scrollToId } from '../../scroll'
import { profile } from '../../data'
import { BranchIcon, DocumentIcon, FolderIcon, GithubIcon, LinkedinIcon, MailIcon, TerminalIcon, UserIcon } from '../icons'

const APPS = [
  { id: 'about', label: 'About', Icon: UserIcon, tint: 'from-amber to-ember' },
  { id: 'skills', label: 'Terminal', Icon: TerminalIcon, tint: 'from-[#1f2547] to-[#0a0d22]' },
  { id: 'journey', label: 'Journey', Icon: BranchIcon, tint: 'from-[#a78bfa] to-[#6d4fd6]' },
  { id: 'projects', label: 'Projects', Icon: FolderIcon, tint: 'from-teal to-[#2b8f86]' },
  { id: 'documents', label: 'CV & Certificates', Icon: DocumentIcon, tint: 'from-[#34d399] to-[#15803d]' },
  { id: 'contact', label: 'Mail', Icon: MailIcon, tint: 'from-[#f472b6] to-ember' },
]

function DockButton({ label, active, tint, children, ...props }) {
  const Tag = props.href ? 'a' : 'button'
  return (
    <Tag
      {...props}
      aria-label={label}
      className="group relative flex flex-col items-center"
      {...(props.href ? { target: '_blank', rel: 'noreferrer' } : { type: 'button' })}
    >
      <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-night/90 px-2 py-1 font-mono text-[10px] text-mist opacity-0 transition group-hover:opacity-100">
        {label}
      </span>
      <span
        className={`flex size-9 items-center justify-center rounded-xl sm:size-11 bg-gradient-to-br ${tint} text-white shadow-lg ring-1 ring-white/15 transition-transform duration-200 group-hover:-translate-y-2 group-hover:scale-110 md:size-12`}
      >
        {children}
      </span>
      <span className={`mt-1 size-1 rounded-full bg-mist transition-opacity ${active ? 'opacity-90' : 'opacity-0'}`} />
    </Tag>
  )
}

export default function Dock() {
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(null)

  useEffect(() => {
    const triggers = [
      ScrollTrigger.create({
        trigger: '#desktop',
        start: 'top -40%',
        end: 'bottom top',
        onToggle: (self) => setVisible(self.isActive),
      }),
      ...APPS.map(({ id }) =>
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setActive(id),
        }),
      ),
    ]
    return () => triggers.forEach((t) => t.kill())
  }, [])

  return (
    <nav
      className={`glass fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-end gap-1.5 rounded-2xl border border-white/10 px-2 pb-1 pt-2 transition-all duration-500 sm:gap-2.5 sm:px-3 sm:pb-1.5 sm:pt-2.5 md:gap-3 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-24 opacity-0'
      }`}
    >
      {APPS.map(({ id, label, Icon, tint }) => (
        <DockButton key={id} label={label} tint={tint} active={active === id} onClick={() => scrollToId(id)}>
          <Icon className="size-4 sm:size-5" />
        </DockButton>
      ))}
      <span className="mx-0.5 h-8 w-px self-center bg-white/15 sm:mx-1" />
      <DockButton label="LinkedIn" tint="from-[#0a66c2] to-[#064b8f]" href={profile.linkedin}>
        <LinkedinIcon className="size-4 sm:size-5" />
      </DockButton>
      <DockButton label="GitHub" tint="from-[#2b2f3a] to-[#111318]" href={profile.github}>
        <GithubIcon className="size-4 sm:size-5" />
      </DockButton>
    </nav>
  )
}
