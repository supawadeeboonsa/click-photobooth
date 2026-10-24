import { useRef, useState } from 'react'
import { Download, LoaderCircle } from 'lucide-react'
import PhotoStrip from '../components/PhotoStrip'
import { usePhotobooth } from '../store'
import type { ExportConfig } from '../types/photobooth'
import { downloadDataUrl, exportStripPng } from '../utils/exportImage'
import { getLayout } from '../utils/layouts'

const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})/, '$1-')

export default function ResultPage() {
  const { state, dispatch } = usePhotobooth()
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const download = async () => {
    if (!ref.current) return
    const cfg: ExportConfig = { width: 1080, filename: `click-photobooth-${stamp()}.png` }
    setBusy(true); setError(''); setDone(false)
    try {
      downloadDataUrl(await exportStripPng(ref.current, cfg.width), cfg.filename)
      setDone(true)
    } catch {
      setError("We couldn't create the image. Try again, or go back and use fewer or smaller decorations.")
    } finally { setBusy(false) }
  }

  return (
    <main className="flex flex-1 flex-wrap items-center justify-center gap-10 px-6 py-12 sm:gap-20">
      <PhotoStrip ref={ref} layout={getLayout(state.layoutId)} photos={state.photos} frame={state.frame} filter={state.filter}
        decorations={state.decorations} width="min(320px, calc(100vw - 48px))" />
      <div className="max-w-[420px]">
        <p className="eyebrow">Result</p>
        <h1 className="mb-3 font-display text-[clamp(32px,6vw,44px)] font-bold leading-[1.05]">Your strip is ready.</h1>
        <p className="mb-7 leading-relaxed text-[#4a4843]">Download it as a PNG, or go back and adjust anything. It includes your frame, filters, text and stickers.</p>
        <button className="btn btn-dark w-full" onClick={() => void download()} disabled={busy}>
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Download size={18} />} {busy ? 'Preparing…' : 'Download PNG'}
        </button>
        <p role="status" aria-live="polite" className={`mt-3 min-h-5 text-sm ${error ? 'text-rose' : 'text-muted'}`}>{error || (done ? 'Saved. Check your downloads folder.' : '')}</p>
        <div className="mt-3 flex gap-3">
          <button className="btn flex-1" onClick={() => dispatch({ type: 'goto', step: 'editor' })}>Edit again</button>
          <button className="btn flex-1" onClick={() => dispatch({ type: 'goto', step: 'capture' })}>Retake photos</button>
        </div>
        <p className="mt-5 text-center">
          <button className="min-h-11 text-sm font-semibold underline" onClick={() => dispatch({ type: 'newSession' })}>Start a new session</button>
        </p>
      </div>
    </main>
  )
}
