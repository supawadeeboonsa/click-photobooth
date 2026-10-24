import { useEffect, useRef, useState, type DragEvent } from 'react'
import { Camera, ImagePlus, RefreshCw, Square, Trash2, Upload } from 'lucide-react'
import CameraPreview from '../components/CameraPreview'
import { useCamera } from '../hooks/useCamera'
import { useCountdown } from '../hooks/useCountdown'
import { capturedReady, usePhotobooth } from '../store'
import { ACCEPT_ATTR, fileToPhotoSrc, validateImage } from '../utils/files'
import { SHOT_COUNTS } from '../utils/layouts'

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms))
/** 4:3 stage that never grows taller than the visible screen, so the buttons below always stay in view. */
const STAGE_STYLE = { width: 'min(100%, max(300px, calc((100dvh - 290px) * 4 / 3)))' }

export default function CapturePage() {
  const { state, dispatch } = usePhotobooth()
  const { shotCount, photos, captureMode } = state
  const camera = useCamera(captureMode === 'camera')
  const countdown = useCountdown()
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(false)
  const [notice, setNotice] = useState('')
  const [dragging, setDragging] = useState(false)
  const stopped = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const replaceIndex = useRef<number | null>(null)

  useEffect(() => { stopped.current = false; return () => { stopped.current = true } }, [])

  const slots = photos.slice(0, shotCount)
  const empties = slots.flatMap((p, i) => (p ? [] : [i]))
  const nextEmpty = empties[0]
  const filled = slots.filter(Boolean).length

  const shoot = async (indices: number[]) => {
    if (busy || camera.status !== 'ready') return
    stopped.current = false
    setBusy(true)
    setNotice('')
    for (const i of indices) {
      const ok = await countdown.run(3)
      if (!ok || stopped.current) break
      const src = camera.capture()
      if (src) {
        dispatch({ type: 'photo', index: i, photo: { src, source: 'camera' } })
        setFlash(true)
        window.setTimeout(() => setFlash(false), 180)
      } else setNotice('The camera is not ready yet. Please try again.')
      await wait(650)
      if (stopped.current) break
    }
    setBusy(false)
  }
  const cancelShoot = () => { stopped.current = true; countdown.cancel(); setBusy(false) }

  const handleFiles = async (files: FileList | File[], target: number | null) => {
    const problems: string[] = []
    const srcs: string[] = []
    for (const f of Array.from(files)) {
      const err = validateImage(f)
      if (err) { problems.push(err); continue }
      try { srcs.push(await fileToPhotoSrc(f)) } catch { problems.push(`${f.name}: this image could not be read.`) }
    }
    if (target !== null) {
      if (srcs[0]) dispatch({ type: 'photo', index: target, photo: { src: srcs[0], source: 'upload' } })
    } else {
      srcs.slice(0, empties.length).forEach((src, n) =>
        dispatch({ type: 'photo', index: empties[n], photo: { src, source: 'upload' } }))
      if (srcs.length > empties.length) problems.push(`Only ${empties.length} free slot(s): extra photos were skipped.`)
    }
    setNotice(problems.join(' '))
  }
  const pickFile = (target: number | null) => { replaceIndex.current = target; fileRef.current?.click() }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files, null) }

  const allDone = empties.length === 0
  const shootLabel = busy ? 'Stop' : allDone ? 'Retake all' : filled ? `Take ${empties.length} more` : `Take ${shotCount} ${shotCount === 1 ? 'photo' : 'photos'}`

  return (
    <main className="mx-auto grid w-full max-w-[1180px] flex-1 grid-cols-1 gap-6 px-4 py-4 sm:px-8 lg:h-[calc(100dvh-76px)] lg:flex-none lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:px-10 lg:py-5">
      <section className="flex min-w-0 flex-col items-center gap-3.5 lg:min-h-0">
        {/* Step 1 + source toggle */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2" style={STAGE_STYLE}>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Photos</span>
            <div className="flex gap-1.5" role="group" aria-label="Number of photos">
              {SHOT_COUNTS.map((n) => (
                <button key={n} className="chip !min-h-9 w-9 !px-0 font-display text-base" aria-pressed={shotCount === n} disabled={busy}
                  aria-label={`${n} ${n === 1 ? 'photo' : 'photos'}`} onClick={() => dispatch({ type: 'shots', count: n })}>{n}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Photo source">
            <button className="chip !min-h-9" aria-pressed={captureMode === 'camera'} onClick={() => dispatch({ type: 'mode', mode: 'camera' })}><Camera size={15} /> Camera</button>
            <button className="chip !min-h-9" aria-pressed={captureMode === 'upload'} onClick={() => { cancelShoot(); dispatch({ type: 'mode', mode: 'upload' }) }}><Upload size={15} /> Upload</button>
          </div>
        </div>

        {captureMode === 'camera' ? (
          <>
            <div style={STAGE_STYLE}>
              <CameraPreview videoRef={camera.videoRef} status={camera.status} mirror={camera.mirror}
                countdown={countdown.value} flash={flash}
                shotLabel={`Shot ${Math.min(filled + 1, shotCount)} of ${shotCount}`}
                onRetry={() => void camera.start()} onUpload={() => dispatch({ type: 'mode', mode: 'upload' })} />
            </div>
            <div className="flex items-center justify-center gap-3" style={STAGE_STYLE}>
              <button className="btn btn-dark h-14 min-w-[220px] flex-1 px-6 text-xs sm:flex-none sm:px-10"
                disabled={camera.status !== 'ready'}
                onClick={() => (busy ? cancelShoot() : void shoot(allDone ? slots.map((_, i) => i) : empties))}>
                {busy ? <Square size={18} fill="currentColor" /> : <Camera size={20} />} {shootLabel}
              </button>
              <button className="chip !min-h-14 px-4" disabled={camera.devices.length < 2 || busy} onClick={camera.switchCamera} aria-label="Switch camera" title="Switch camera">
                <RefreshCw size={18} />
              </button>
            </div>
            <p className="text-center text-xs text-muted">Press the button, then smile. Each shot has a 3-second countdown.</p>
          </>
        ) : (
          <>
            <div onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
              style={STAGE_STYLE}
              className={`flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? 'border-gold bg-blush' : 'border-[#a9a59e] bg-white'}`}>
              <ImagePlus size={44} className="text-muted" />
              <div>
                <p className="font-display text-xl">Add your photos</p>
                <p className="mt-1.5 max-w-xs text-sm text-muted">Drag photos here, or use the button. JPEG, PNG or WebP. They fill the empty slots in order.</p>
              </div>
              <button className="btn btn-dark h-14 px-10 text-xs" disabled={!empties.length} onClick={() => pickFile(null)}><Upload size={18} /> Choose photos</button>
              {!empties.length && <p className="text-[13px] text-muted">All slots are filled. Replace or remove a photo on the right.</p>}
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept={ACCEPT_ATTR} multiple className="sr-only" tabIndex={-1} aria-label="Choose photos"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files, replaceIndex.current)
            e.target.value = ''
          }} />
        <p role="status" aria-live="polite" className={`min-h-5 text-center text-sm ${notice ? 'text-red-700' : ''}`}>{notice}</p>
      </section>

      <aside className="flex min-h-0 flex-col border border-edge bg-white/70 p-4 lg:self-start lg:max-h-full lg:overflow-y-auto">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Your shots</p>
          <span className="text-xs tabular-nums text-muted">{filled} / {shotCount}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {slots.map((p, i) => (
            <div key={i} className={`relative aspect-[4/3] overflow-hidden rounded-md ${p ? 'bg-edge' : i === nextEmpty ? 'border-2 border-gold bg-white' : 'border border-dashed border-[#a9a59e] bg-white/60'}`}>
              <span className="absolute left-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-paper">{i + 1}</span>
              {p ? (
                <>
                  <img src={p.src} alt={`Shot ${i + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                    <button className="chip !min-h-7 bg-white/90 !px-2 text-[11px]" disabled={busy}
                      onClick={() => (captureMode === 'camera' ? void shoot([i]) : pickFile(i))}
                      aria-label={`${captureMode === 'camera' ? 'Retake' : 'Replace'} photo ${i + 1}`}>
                      {captureMode === 'camera' ? 'Retake' : 'Replace'}
                    </button>
                    <button className="chip !min-h-7 bg-white/90 !px-1.5" disabled={busy} aria-label={`Remove photo ${i + 1}`}
                      onClick={() => dispatch({ type: 'photo', index: i, photo: null })}><Trash2 size={13} /></button>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-semibold text-muted">{i === nextEmpty ? 'Next' : 'Empty'}</div>
              )}
            </div>
          ))}
        </div>
        <button className="btn btn-dark mt-4 w-full" disabled={!capturedReady(state) || busy}
          onClick={() => dispatch({ type: 'goto', step: 'editor' })}>Continue to studio</button>
        {!capturedReady(state) && <p className="mt-2.5 text-center text-xs text-muted">Fill all {shotCount} slots to continue</p>}
      </aside>
    </main>
  )
}
