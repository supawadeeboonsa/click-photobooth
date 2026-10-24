import { capturedReady, usePhotobooth } from '../store'
import type { Step } from '../types/photobooth'

const STEPS: [Step, string][] = [['capture', 'Capture'], ['editor', 'Studio'], ['result', 'Result']]
const LINKS = [['how', 'The experience'], ['layouts', 'Layouts'], ['frames', 'Frames']]

export default function Header() {
  const { state, dispatch } = usePhotobooth()
  const welcome = state.step === 'welcome'
  const reachable = (s: Step) => s === 'capture' || capturedReady(state)
  return (
    <header className="relative z-10 flex min-h-[76px] items-center justify-between gap-4 border-b border-line px-6 py-5 sm:px-12 lg:px-16">
      <button onClick={() => dispatch({ type: 'goto', step: 'welcome' })} aria-label="Click! Photobooth home"
        className="font-display text-[27px] font-normal tracking-[-0.06em]">
        Click<span className="text-[#B18A22] italic">!</span>
        <span className="ml-3 hidden font-sans text-[9px] font-medium uppercase tracking-[0.25em] text-muted sm:inline">Virtual photo studio</span>
      </button>
      {welcome ? (
        <nav aria-label="Sections" className="hidden gap-8 text-[10px] font-medium uppercase tracking-[0.18em] text-muted sm:flex">
          {LINKS.map(([id, label]) => <a key={id} href={`#${id}`} className="border-b border-transparent py-2 transition-colors duration-500 hover:border-[#D4AF37] hover:text-ink">{label}</a>)}
        </nav>
      ) : (
        <nav aria-label="Progress" className="flex gap-3 text-[10px] uppercase tracking-[0.14em] sm:gap-7">
          {STEPS.map(([step, label], i) => {
            const current = state.step === step
            return (
              <button key={step} disabled={!reachable(step)} aria-current={current ? 'step' : undefined}
                onClick={() => dispatch({ type: 'goto', step })}
                className={`border-b pb-2 transition-colors duration-500 disabled:opacity-40 ${current ? 'border-[#D4AF37] text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
                <span className="mr-1.5 text-[#B18A22]">0{i + 1}</span>{label}
              </button>
            )
          })}
        </nav>
      )}
    </header>
  )
}
