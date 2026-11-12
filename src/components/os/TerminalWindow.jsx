import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '../../scroll'
import { stack, tools } from '../../data'
import { TerminalIcon } from '../icons'
import Window from './Window'

const PROMPT = (
  <>
    <span className="text-teal">nina</span>
    <span className="text-mist/50">@</span>
    <span className="text-amber">tbilisi</span>
    <span className="text-mist/50">:~$ </span>
  </>
)

function StackJson() {
  const keys = Object.keys(stack)
  return (
    <div>
      {'{'}
      {keys.map((key, i) => (
        <div key={key} className="pl-4">
          <span className="text-[#a78bfa]">"{key}"</span>: [
          {stack[key].map((v, j) => (
            <span key={v}>
              <span className="text-[#9ae6b4]">"{v}"</span>
              {j < stack[key].length - 1 && ', '}
            </span>
          ))}
          ]{i < keys.length - 1 && ','}
        </div>
      ))}
      {'}'}
    </div>
  )
}

const STEPS = [
  { cmd: 'whoami', out: <span>software engineer · tbilisi, georgia</span> },
  { cmd: 'cat stack.json', out: <StackJson /> },
  {
    cmd: 'ls ~/tools',
    out: (
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {tools.map((t) => (
          <span key={t} className="text-[#7dd3fc]">
            {t}
          </span>
        ))}
      </div>
    ),
  },
  { cmd: 'echo $STATUS', out: <span className="text-amber">open to software engineering roles ✦</span> },
]

export default function TerminalWindow() {
  const body = useRef(null)
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [chars, setChars] = useState(0)

  useEffect(() => {
    const trigger = ScrollTrigger.create({ trigger: body.current, start: 'top 75%', once: true, onEnter: () => setStarted(true) })
    return () => trigger.kill()
  }, [])

  useEffect(() => {
    if (!started || step >= STEPS.length) return
    const cmd = STEPS[step].cmd
    const id =
      chars <= cmd.length
        ? setTimeout(() => setChars((c) => c + 1), 45 + Math.random() * 40)
        : setTimeout(() => {
            setStep((s) => s + 1)
            setChars(0)
          }, 520)
    return () => clearTimeout(id)
  }, [started, step, chars])

  return (
    <Window id="skills" title="nina@tbilisi — zsh" icon={<TerminalIcon className="size-4" />} bodyClassName="bg-[#080b1d]/80 p-5 md:p-7">
      <div ref={body} className="min-h-[22rem] font-mono text-[13px] leading-relaxed text-mist/85 md:text-sm">
        <p className="mb-4 text-mist/40">Last login: from Tbilisi, Georgia — type nothing, just watch.</p>
        {STEPS.map((s, i) => {
          if (i > step) return null
          const typing = i === step
          const shownCmd = typing ? s.cmd.slice(0, chars) : s.cmd
          const done = !typing || chars > s.cmd.length
          return (
            <div key={s.cmd} className="mb-3">
              <div>
                {PROMPT}
                {shownCmd}
                {typing && !done && <span className="animate-caret ml-px inline-block h-4 w-2 translate-y-0.5 bg-mist/80" />}
              </div>
              {done && (!typing || chars > s.cmd.length) && <div className="mt-1">{s.out}</div>}
            </div>
          )
        })}
        {step >= STEPS.length && (
          <div>
            {PROMPT}
            <span className="animate-caret inline-block h-4 w-2 translate-y-0.5 bg-mist/80" />
          </div>
        )}
      </div>
    </Window>
  )
}
