export default function Window({ id, title, icon, children, className = '', bodyClassName = 'p-5 md:p-8' }) {
  return (
    <section
      id={id}
      className={`os-window glass relative w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ${className}`}
    >
      <header className="flex items-center gap-2.5 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="text-amber">{icon}</span>
        <span className="font-mono text-xs text-mist/70">{title}</span>
        <div className="ml-auto flex items-center gap-3 text-mist/40" aria-hidden="true">
          <span className="h-px w-3 bg-current" />
          <span className="size-2.5 rounded-[3px] border border-current" />
          <span className="relative size-3">
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 rotate-45 bg-current" />
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 -rotate-45 bg-current" />
          </span>
        </div>
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
