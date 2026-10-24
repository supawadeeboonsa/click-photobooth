import { useEffect, useState } from 'react'
import PhotoStrip from '../components/PhotoStrip'
import { DecorationControls, FilterControls, FrameSelector, LayoutSelector } from '../components/Controls'
import { usePhotobooth } from '../store'
import { getLayout } from '../utils/layouts'

export default function EditorPage() {
  const { state, dispatch } = usePhotobooth()
  const layout = getLayout(state.layoutId)
  const missing = layout.count - state.photos.slice(0, layout.count).filter(Boolean).length
  const [viewport, setViewport] = useState({ width: 1280, height: 800 })
  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const heightDivisor = layout.cols === 2 ? 2.15 : layout.count === 1 ? 1.35 : layout.count === 2 ? 2.05 : layout.count === 3 ? 2.75 : layout.count === 4 ? 3.45 : layout.count === 5 ? 4.15 : 4.85
  const previewWidth = viewport.width < 1024 ? Math.max(170, Math.min(300, viewport.width - 48)) : Math.max(150, Math.min(460, viewport.width - 390, (viewport.height - 310) / heightDivisor))

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-76px)] w-full max-w-[1800px] flex-1 grid-cols-1 grid-rows-[minmax(320px,auto)_auto_auto] overflow-visible lg:h-[calc(100dvh-76px)] lg:min-h-0 lg:flex-none lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_auto] lg:overflow-hidden">
      <aside className="order-2 flex min-h-0 flex-col gap-5 overflow-visible border-line px-5 py-5 sm:px-7 lg:order-1 lg:col-start-1 lg:row-start-1 lg:overflow-y-auto lg:overscroll-contain lg:border-r lg:px-5 lg:py-4">
        <div className="border-b border-line pb-3">
          <p className="eyebrow !mb-1">Studio controls</p>
          <p className="text-xs text-muted">Make it yours, one detail at a time.</p>
        </div>
        <LayoutSelector />
        <FrameSelector />
        <FilterControls />
        <DecorationControls />
      </aside>
      <section className="order-1 flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-2 overflow-hidden bg-stage px-4 py-3 sm:px-6 lg:order-2 lg:col-start-2 lg:row-start-1 lg:px-8 lg:py-3">
        <div className="flex w-full max-w-4xl items-center justify-between gap-3">
          <div>
            <p className="eyebrow !mb-1">Live preview</p>
            <p className="text-xs text-muted">Your photo strip, updated instantly</p>
          </div>
          <span className="shrink-0 border border-edge bg-white/60 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted">{layout.label}</span>
        </div>
        <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden py-1">
          <PhotoStrip width={previewWidth} layout={layout} photos={state.photos} frame={state.frame} filter={state.filter} decorations={state.decorations}
            interactive selectedId={state.selectedDecorationId}
            onSelect={(id) => dispatch({ type: 'selectDeco', id })}
            onMove={(id, x, y) => dispatch({ type: 'updateDeco', id, patch: { x, y } })}
            onRotate={(id, rotation) => dispatch({ type: 'updateDeco', id, patch: { rotation } })} />
        </div>
        {missing > 0 ? (
          <p role="status" className="max-w-xs text-center text-xs text-rose">
            This layout needs {missing} more photo{missing > 1 ? 's' : ''}.{' '}
            <button className="underline underline-offset-2" onClick={() => dispatch({ type: 'goto', step: 'capture' })}>Add photos</button>
          </p>
        ) : (
          <p className="text-center text-[10px] tracking-wide text-muted">Choose a sticker, drag it onto your photo, and drag the round dot above it to rotate.</p>
        )}
      </section>
      <footer className="order-3 grid grid-cols-2 items-center gap-2 border-t border-line bg-paper px-3 py-2 sm:gap-3 sm:px-8 lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:flex lg:justify-between lg:px-12 lg:py-2.5">
        <button className="btn h-10 w-full px-2 text-[9px] tracking-[0.12em] sm:px-4 sm:text-[11px] sm:tracking-[0.18em] lg:w-auto lg:px-6" onClick={() => dispatch({ type: 'goto', step: 'capture' })}>Back to photos</button>
        <button className="btn btn-dark h-10 w-full px-2 text-[9px] tracking-[0.12em] sm:px-4 sm:text-[11px] sm:tracking-[0.18em] lg:w-auto lg:px-6" disabled={missing > 0} onClick={() => dispatch({ type: 'goto', step: 'result' })}>Preview result</button>
      </footer>
    </main>
  )
}
