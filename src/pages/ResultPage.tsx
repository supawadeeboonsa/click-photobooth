import { useRef, useState } from 'react'
import { Download, LoaderCircle, Share2, X } from 'lucide-react'
import PhotoStrip from '../components/PhotoStrip'
import { usePhotobooth } from '../store'
import type { ExportConfig } from '../types/photobooth'
import { canShareFile, dataUrlToFile, downloadDataUrl, exportStripPng, isMobileDevice, shareFile } from '../utils/exportImage'
import { getLayout } from '../utils/layouts'

const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})/, '$1-')

interface Saved { url: string; filename: string; file: File | null }

export default function ResultPage() {
  const { state, dispatch } = usePhotobooth()
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [saved, setSaved] = useState<Saved | null>(null)
  const mobile = isMobileDevice()

  const download = async () => {
    if (!ref.current) return
    const cfg: ExportConfig = { width: 1080, filename: `click-photobooth-${stamp()}.png` }
    setBusy(true); setError(''); setDone(false)
    try {
      const url = await exportStripPng(ref.current, cfg.width)
      if (mobile) {
        // Phones: show the finished image so it can be saved to Photos (share sheet, or press-and-hold).
        let file: File | null = null
        try { file = await dataUrlToFile(url, cfg.filename) } catch { file = null }
        setSaved({ url, filename: cfg.filename, file })
      } else {
        downloadDataUrl(url, cfg.filename)
        setDone(true)
      }
    } catch {
      setError("We couldn't create the image. Try again, or go back and use fewer or smaller decorations.")
    } finally { setBusy(false) }
  }

  const share = async () => {
    if (!saved?.file) return
    setError('')
    try { if (await shareFile(saved.file)) setDone(true) }
    catch { setError('Sharing is not available here. Press and hold the image, then choose "Save to Photos".') }
  }

  const canShare = canShareFile(saved?.file ?? null)

  return (
    <main className="flex flex-1 flex-wrap items-center justify-center gap-10 px-6 py-12 sm:gap-20">
      <PhotoStrip ref={ref} layout={getLayout(state.layoutId)} photos={state.photos} frame={state.frame} filter={state.filter}
        decorations={state.decorations} width="min(320px, calc(100vw - 48px))" />
      <div className="max-w-[420px]">
        <p className="eyebrow">Result</p>
        <h1 className="mb-3 font-display text-[clamp(32px,6vw,44px)] font-bold leading-[1.05]">Your strip is ready.</h1>
        <p className="mb-7 leading-relaxed text-[#4a4843]">{mobile ? 'Save it to your phone, or go back and adjust anything. It includes your frame, filters, text and stickers.' : 'Download it as a PNG, or go back and adjust anything. It includes your frame, filters, text and stickers.'}</p>
        <button className="btn btn-dark w-full" onClick={() => void download()} disabled={busy}>
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Download size={18} />} {busy ? 'Preparing…' : mobile ? 'Save to phone' : 'Download PNG'}
        </button>
        <p role="status" aria-live="polite" className={`mt-3 min-h-5 text-sm ${error ? 'text-rose' : 'text-muted'}`}>{error || (done && !saved ? 'Saved. Check your downloads folder.' : '')}</p>
        <div className="mt-3 flex gap-3">
          <button className="btn flex-1" onClick={() => dispatch({ type: 'goto', step: 'editor' })}>Edit again</button>
          <button className="btn flex-1" onClick={() => dispatch({ type: 'goto', step: 'capture' })}>Retake photos</button>
        </div>
        <p className="mt-5 text-center">
          <button className="min-h-11 text-sm font-semibold underline" onClick={() => dispatch({ type: 'newSession' })}>Start a new session</button>
        </p>
      </div>

      {saved && (
        <div role="dialog" aria-modal="true" aria-label="Save your photo strip" className="fixed inset-0 z-[60] flex flex-col bg-black/80">
          <div className="flex items-center justify-between px-4 py-3 text-paper">
            <p className="text-sm font-semibold">Save your photo strip</p>
            <button aria-label="Close" className="grid size-10 place-items-center" onClick={() => { setSaved(null); setDone(false); setError('') }}><X size={22} /></button>
          </div>
          <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 pb-4">
            {/* Plain <img> so iOS/Android offer "Save to Photos" on press-and-hold */}
            <img src={saved.url} alt="Your finished photo strip" className="max-h-none w-full max-w-[360px] select-none shadow-2xl" style={{ WebkitTouchCallout: 'default', WebkitUserSelect: 'auto', userSelect: 'auto' }} />
          </div>
          <div className="space-y-2 border-t border-white/15 bg-paper px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <p role="status" aria-live="polite" className={`text-center text-xs ${error ? 'text-rose' : 'text-muted'}`}>
              {error || (done ? 'Done! Check your Photos or the app you chose.' : 'Press and hold the image, then choose “Save to Photos” (or “Download image”).')}
            </p>
            {canShare && <button className="btn btn-dark w-full" onClick={() => void share()}><Share2 size={18} /> Save / Share</button>}
            <button className="btn w-full" onClick={() => { downloadDataUrl(saved.url, saved.filename); setDone(true) }}><Download size={18} /> Download file</button>
          </div>
        </div>
      )}
    </main>
  )
}
