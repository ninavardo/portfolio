import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getLenis } from '../../scroll'

/** Modal file preview: pauses smooth scroll and closes on Escape or a click outside. */
export default function QuickLook({ file, label, onClose, className = 'max-w-4xl', children }) {
  useEffect(() => {
    const lenis = getLenis()
    lenis?.stop()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-night/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
        className={`glass max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-white/10 shadow-2xl ${className}`}
      >
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-[#141838]/95 px-4 py-2.5">
          <span className="truncate font-mono text-xs text-mist/70">Preview — {file}</span>
          <button type="button" onClick={onClose} className="ml-auto rounded-md px-2 py-0.5 font-mono text-xs text-mist/60 hover:bg-white/10 hover:text-mist">
            esc ✕
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  )
}
