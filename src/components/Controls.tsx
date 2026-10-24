import { FlipHorizontal, RotateCcw, RotateCw, Trash2 } from 'lucide-react'
import { usePhotobooth } from '../store'
import type { DecorationPatch, FilterPreset, StickerIcon, TextureId, FrameStyleId } from '../types/photobooth'
import { FILTER_LABELS, FRAME_PRESETS, FRAME_STYLES, TEXTURES, LAYOUTS, inkFor } from '../utils/layouts'
import { STICKERS } from './stickers'

const wrapDeg = (n: number) => ((n + 180) % 360 + 360) % 360 - 180
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="min-w-0"><p className="eyebrow !mb-3">{title}</p>{children}</div>
}
function Range({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return <label className="mt-3 flex flex-col gap-1.5 text-xs"><span className="flex justify-between">{label}<span className="text-muted">{value}</span></span><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-ink" /></label>
}
function OptionTile({ label, detail, selected, onClick, children }: { label: string; detail?: string; selected: boolean; onClick: () => void; children?: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className="flex min-w-0 flex-col items-center gap-1 border px-1.5 py-2 text-center transition-colors" style={{borderColor:selected?'#1A1A1A':'#D8D2CA',background:selected?'#EBE5DE':'transparent',boxShadow:selected?'inset 0 0 0 1px #1A1A1A':'none'}}>{children}<span className="text-[10px] font-medium leading-tight">{label}</span>{detail&&<span className="text-[9px] leading-tight text-muted">{detail}</span>}</button>
}
export function LayoutSelector() {
  const { state, dispatch } = usePhotobooth()
  return <Section title="Layout"><div className="flex flex-wrap gap-1.5" role="group" aria-label="Layout">{LAYOUTS.map((l) => <button key={l.id} className="chip min-h-8 px-2.5 py-1 text-[11px]" aria-pressed={state.layoutId === l.id} onClick={() => dispatch({ type: 'layout', id: l.id })}>{l.label}</button>)}</div></Section>
}
export function FrameSelector() {
  const { state, dispatch } = usePhotobooth(); const { frame } = state
  return <div className="space-y-5">
    <Section title="Frame colour">
      <div className="grid grid-cols-4 gap-x-2 gap-y-3" role="group" aria-label="Frame colour">
        {FRAME_PRESETS.map((f) => <button key={f.id} type="button" aria-label={`${f.label} frame`} aria-pressed={frame.presetId === f.id} onClick={() => dispatch({ type: 'frame', patch: { presetId: f.id, background: f.background, ink: f.ink } })} className="group flex min-w-0 flex-col items-center gap-1.5">
          <span className={`relative block size-8 border border-black/10 transition-all ${frame.presetId===f.id?'ring-2 ring-ink ring-offset-2 ring-offset-paper':'group-hover:scale-105'}`} style={{ background:f.background }}><span className="absolute inset-1 border" style={{borderColor:f.ink,opacity:.45}} /></span>
          <span className="text-[9px] text-muted">{f.label}</span>
        </button>)}
      </div>
      <label className="mt-3 flex items-center gap-2 text-[11px] text-muted"><input type="color" value={frame.background} aria-label="Custom background colour" className="size-7 cursor-pointer border border-edge bg-white p-0.5" onChange={(e) => dispatch({ type: 'frame', patch: { presetId: 'custom', background: e.target.value, ink: inkFor(e.target.value) } })} /> Custom colour</label>
    </Section>
    <Section title="Frame style">
      <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Frame style">
        {FRAME_STYLES.map((f) => <OptionTile key={f.id} label={f.label} selected={frame.style===f.id} onClick={()=>dispatch({type:'frame',patch:{style:f.id as FrameStyleId}})}>
          <span className="flex h-8 w-full items-center justify-center" style={{background:frame.background,color:frame.ink}}>
            {f.id==='film' ? <span className="flex w-full justify-around"><i className="h-4 w-1" style={{background:frame.ink}}/><span className="h-5 w-7 border" style={{borderColor:frame.ink}}/><i className="h-4 w-1" style={{background:frame.ink}}/></span> : f.id==='double' ? <span className="h-5 w-8 border p-0.5"><span className="block h-full border" style={{borderColor:frame.ink}}/></span> : f.id==='editorial' ? <span className="w-9 border-y py-1.5 text-[6px] tracking-widest">CLICK!</span> : <span className="h-5 w-8 border" style={{borderColor:frame.ink}}/>}
          </span>
        </OptionTile>)}
      </div>
      <Range label="Frame padding" value={frame.padding} min={8} max={40} onChange={(n) => dispatch({ type: 'frame', patch: { padding: n } })} />
    </Section>
    <Section title="Surface texture">
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Texture">
        {TEXTURES.map((t) => <OptionTile key={t.id} label={t.label} selected={frame.texture===t.id} onClick={()=>dispatch({type:'frame',patch:{texture:t.id as TextureId}})}>
          <span className="relative block h-8 w-full overflow-hidden border border-black/10" style={{backgroundColor:frame.background,backgroundImage:t.id==='none'?'none':t.id==='speckle'?'radial-gradient(#29272266 1px, transparent 1px), radial-gradient(#29272244 1px, transparent 1px)':t.id==='botanical'?'radial-gradient(ellipse at 100% 0%, #ffffff55, transparent 60%), radial-gradient(ellipse at 0% 100%, #29272222, transparent 60%)':'url("data:image/svg+xml,%3Csvg viewBox=%270 0 100 100%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.8%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%27.5%27/%3E%3C/svg%3E")',backgroundSize:t.id==='speckle'?'9px 9px, 13px 15px':undefined,backgroundBlendMode:t.id==='paper'?'soft-light':t.id==='noise'||t.id==='film'?'multiply':t.id==='speckle'?'multiply':undefined}} />
        </OptionTile>)}
      </div>
    </Section>
  </div>
}
export function FilterControls() {
  const { state, dispatch } = usePhotobooth(); const { filter } = state
  return <Section title="Filter"><div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">{(Object.keys(FILTER_LABELS) as FilterPreset[]).map((p) => <button key={p} className="chip min-h-8 px-2.5 py-1 text-[11px]" aria-pressed={filter.preset === p} onClick={() => dispatch({ type: 'filter', patch: { preset: p } })}>{FILTER_LABELS[p]}</button>)}</div><Range label="Brightness" value={filter.brightness} min={60} max={140} onChange={(n) => dispatch({ type: 'filter', patch: { brightness: n } })} /><Range label="Contrast" value={filter.contrast} min={60} max={140} onChange={(n) => dispatch({ type: 'filter', patch: { contrast: n } })} /></Section>
}
const CATEGORIES: { id: string; label: string; icons: StickerIcon[] }[] = [
  { id: 'all', label: 'All', icons: ['alert','eightBall','cake','flower','duo','kuromi','love','myme','poteto','song','star'] },
  { id: 'cute', label: 'Cute', icons: ['cake','flower','love','poteto','star'] },
  { id: 'characters', label: 'Characters', icons: ['duo','kuromi','myme','love'] },
  { id: 'objects', label: 'Objects', icons: ['cake','eightBall','poteto','song'] },
  { id: 'symbols', label: 'Symbols', icons: ['alert','star','flower'] },
]
export function DecorationControls() {
  const { state, dispatch } = usePhotobooth(); const { frame, decorations, selectedDecorationId } = state

  const sel = decorations.find((d) => d.id === selectedDecorationId)
  const add = (d: { kind: 'text'; text: string } | { kind: 'sticker'; icon: StickerIcon }) => {
    const base = { id: crypto.randomUUID(), x: 35 + Math.random() * 30, y: 30 + Math.random() * 40, color: frame.ink === '#ffffff' || frame.ink.toLowerCase()==='#fff8e8' ? frame.ink : '#b8456a' }
    dispatch({ type: 'addDeco', deco: d.kind === 'text' ? { ...base, ...d, size: 22 } : { ...base, ...d, size: 54 } })
  }
  const patch = (p: DecorationPatch) => sel && dispatch({ type: 'updateDeco', id: sel.id, patch: p })
  const icons = CATEGORIES[0].icons
  return <Section title="Decorations">
    <label className="flex flex-col gap-1.5 text-xs">Caption<input type="text" value={frame.caption} maxLength={40} onChange={(e) => dispatch({ type: 'frame', patch: { caption: e.target.value } })} className="h-9 border border-edge bg-white px-3 text-xs font-medium" /></label>
    <label className="mt-2.5 flex items-center gap-2 text-xs"><input type="checkbox" checked={frame.showDate} onChange={(e) => dispatch({ type: 'frame', patch: { showDate: e.target.checked } })} className="size-3.5 accent-ink" /> Show today's date</label>
    <div className="mt-4 flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Sticker collection · 11</p><button className="text-[10px] text-muted underline underline-offset-2" onClick={() => add({ kind: 'text', text: 'Hello!' })}>+ Add text</button></div>

    <div className="sticker-picker-scroll mt-2 max-h-[none] overflow-visible pr-1 lg:max-h-[min(38vh,420px)] lg:overflow-y-auto">
      <div className="grid grid-cols-3 gap-2">
        {icons.map((k) => <button key={k} className="sticker-choice" aria-label={`Add ${STICKERS[k].label} sticker`} title={STICKERS[k].label} onClick={() => add({ kind: 'sticker', icon: k })}><img src={STICKERS[k].src} alt="" loading="lazy" /><span>{STICKERS[k].label}</span></button>)}
      </div>
    </div>
    <p className="mt-2 text-[10px] leading-relaxed text-muted">Tap to add a sticker. Then resize it right on the preview (corner dot or two-finger pinch) and drag to reposition.</p>
    {sel && <div className="mt-3 border border-edge bg-white p-3">{sel.kind === 'text' && <label className="flex flex-col gap-1.5 text-xs">Text<input type="text" value={sel.text} maxLength={40} onChange={(e) => patch({ text: e.target.value })} className="h-9 border border-edge px-3 text-xs font-medium" /></label>}<Range label="Size" value={sel.size} min={12} max={260} onChange={(n) => patch({ size: n })} /><Range label="Rotate (°)" value={sel.rotation ?? 0} min={-180} max={180} onChange={(n) => patch({ rotation: n })} /><div className="mt-3 grid grid-cols-4 gap-1.5"><button className="chip min-h-9 px-1" aria-label="Rotate left 15 degrees" title="Rotate left 15°" onClick={() => patch({ rotation: wrapDeg((sel.rotation ?? 0) - 15) })}><RotateCcw size={15} /></button><button className="chip min-h-9 px-1" aria-label="Rotate right 15 degrees" title="Rotate right 15°" onClick={() => patch({ rotation: wrapDeg((sel.rotation ?? 0) + 15) })}><RotateCw size={15} /></button><button className="chip min-h-9 px-1" aria-label="Flip left and right" aria-pressed={!!sel.flip} title="Flip left/right" onClick={() => patch({ flip: !sel.flip })}><FlipHorizontal size={15} /></button><button className="chip min-h-9 px-1 text-[10px]" title="Reset rotation and flip" onClick={() => patch({ rotation: 0, flip: false })}>Reset</button></div><div className="mt-3 flex items-center justify-between"><label className="flex items-center gap-2 text-xs"><input type="color" value={sel.color} onChange={(e) => patch({ color: e.target.value })} aria-label="Colour" className="size-8 cursor-pointer border border-edge bg-white p-1" /> Colour</label><button className="chip min-h-8 px-2 py-1 text-[10px]" onClick={() => dispatch({ type: 'removeDeco', id: sel.id })}><Trash2 size={14} /> Remove</button></div></div>}
  </Section>
}
