import { ArrowDownRight, ArrowRight, Camera, Upload } from 'lucide-react'
import PhotoStrip from '../components/PhotoStrip'
import { usePhotobooth } from '../store'
import { FRAME_PRESETS, LAYOUTS, getLayout, DEFAULT_FRAME } from '../utils/layouts'
import type { FilterConfig, PhotoSource } from '../types/photobooth'

const NO_FILTER: FilterConfig = { preset: 'original', brightness: 100, contrast: 100 }
const PINK = { ...DEFAULT_FRAME, background: '#EBE5DE', ink: '#1A1A1A' }

export default function WelcomePage() {
  const { dispatch } = usePhotobooth()
  const start = (mode: PhotoSource) => { dispatch({ type: 'mode', mode }); dispatch({ type: 'goto', step: 'capture' }) }
  return (
    <>
      <main className="relative z-[1] mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 items-center gap-5 px-5 py-8 sm:gap-10 sm:px-12 sm:py-16 md:py-20 lg:grid-cols-12 lg:gap-8 lg:px-16 lg:py-24">
        <div className="relative z-[1] lg:col-span-6 lg:col-start-2 lg:pb-8">
          <p className="eyebrow">A little moment, beautifully kept</p>
          <h1 className="mb-7 max-w-[760px] text-[clamp(3.5rem,8.5vw,7.8rem)] leading-[.88] tracking-[-.065em]">Four cuts.<br />One <em className="font-normal text-[#B18A22]">little</em> moment.</h1>
          <p className="mb-9 max-w-md text-base leading-[1.85] text-muted sm:text-lg">
            Your own tiny photo studio. Take a few frames, find your favourite mood, and make a keepsake worth holding on to.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-dark min-w-[205px]" onClick={() => start('camera')}><Camera size={16} strokeWidth={1.5} /> Start photo session <ArrowRight size={15} /></button>
            <button className="btn min-w-[170px]" onClick={() => start('upload')}><Upload size={16} strokeWidth={1.5} /> Use your photos</button>
          </div>
          <div className="mt-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.19em] text-muted"><span className="h-px w-8 bg-[#D4AF37]" /> No account. No fuss. Just you.</div>
        </div>
        <div className="relative mx-auto h-[560px] w-full max-w-[320px] sm:h-[640px] sm:max-w-[430px] lg:col-span-5 lg:col-start-8 lg:h-[760px] lg:max-w-none" aria-label="Examples of photobooth strips"><span aria-hidden="true" className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-2 rounded-full border border-ink/10 bg-paper/90 px-3 py-2 text-[9px] uppercase tracking-[0.16em] text-muted shadow-sm"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#B18A22] opacity-50 motion-reduce:animate-none"></span><span className="relative inline-flex size-2 rounded-full bg-[#B18A22]"></span></span> In motion</span>
          <div className="absolute left-[36%] top-[12%] animate-[strip-drift-back_8s_ease-in-out_infinite] [transform:rotate(7deg)] drop-shadow-[0_18px_16px_rgba(40,32,24,0.16)] motion-reduce:animate-none">
            <PhotoStrip layout={getLayout('3-cut')} photos={[]} frame={PINK} filter={NO_FILTER} decorations={[]} width="min(190px, 44vw)" />
          </div>
          <div className="absolute left-[8%] top-[4%] animate-[strip-drift-front_10s_ease-in-out_infinite] [transform:rotate(-5deg)] drop-shadow-[0_10px_12px_rgba(40,32,24,0.08)] motion-reduce:animate-none">
            <PhotoStrip layout={getLayout('4-cut')} photos={[]} frame={DEFAULT_FRAME} filter={NO_FILTER} decorations={[]} width="min(190px, 44vw)" />
          </div>
          <div className="absolute bottom-[9%] right-[1%] hidden rotate-[3deg] border border-ink/10 bg-paper p-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:block">
            <p className="font-display text-xl italic">keep this one.</p><p className="mt-2 text-[9px] uppercase tracking-[0.22em] text-muted">Click! · Studio no. 01</p>
          </div>
          <span className="absolute left-0 top-[44%] hidden text-[9px] uppercase tracking-[0.28em] text-muted [writing-mode:vertical-rl] lg:block">A memory in four frames · Vol. 01</span>
          <span className="absolute bottom-0 left-[7%] hidden items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-muted sm:flex"><ArrowDownRight size={14} className="text-[#B18A22]" /> Made in your browser</span>
        </div>
      </main>
      <section className="relative z-[1] border-t border-line px-6 py-16 sm:px-12 md:py-24 lg:px-16" id="how">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4"><p className="eyebrow">The experience</p><h2 className="max-w-sm text-4xl leading-[1.02] sm:text-5xl">A ritual, in <em className="text-[#B18A22]">three</em> simple steps.</h2></div>
          <div className="grid gap-9 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
            {[
              ['01', 'Capture the moment', 'Take 2–6 shots with a gentle countdown, or bring in photos you already love.'],
              ['02', 'Make it yours', 'Choose a strip, adjust the frame and filter, then add a little personal detail.'],
              ['03', 'Keep it close', 'Export your finished photo strip as a crisp PNG, ready to share or print.'],
            ].map(([n, title, copy]) => <article key={n} className="border-t border-ink pt-5"><p className="mb-7 font-display text-3xl italic text-[#B18A22]">{n}</p><h3 className="mb-3 text-2xl">{title}</h3><p className="text-sm leading-[1.8] text-muted">{copy}</p></article>)}
          </div>
        </div>
      </section>
      <section className="relative z-[1] grid gap-12 border-t border-line px-6 py-16 sm:px-12 md:grid-cols-2 md:py-20 lg:px-16" id="layouts">
        <div><p className="eyebrow">Find your composition</p><h2 className="mb-7 text-4xl sm:text-5xl">Layouts, <em className="text-[#B18A22]">considered.</em></h2><div className="flex flex-wrap gap-2">{LAYOUTS.map((l) => <span key={l.id} className="chip pointer-events-none">{l.label}</span>)}</div></div>
        <div id="frames"><p className="eyebrow">A frame for your mood</p><h2 className="mb-7 text-4xl sm:text-5xl">Colour, kept <em className="text-[#B18A22]">quiet.</em></h2><div className="flex flex-wrap gap-5">{FRAME_PRESETS.map((f) => <div key={f.id} className="flex items-center gap-3"><span title={f.label} className="size-9 border border-ink/15" style={{ background: f.background }} /><span className="text-[10px] uppercase tracking-[0.17em] text-muted">{f.label}</span></div>)}</div></div>
      </section>
      <footer className="relative z-[1] flex flex-wrap justify-between gap-3 border-t border-line px-6 py-7 text-[10px] uppercase tracking-[0.16em] text-muted sm:px-12 lg:px-16">
        <span>© Click! Photobooth — Studio no. 01</span><span>Your photos stay on your device.</span>
      </footer>
    </>
  )
}
