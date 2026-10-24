import { forwardRef, useCallback, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { CapturedPhoto, Decoration, FilterConfig, FrameConfig, PhotoLayout } from '../types/photobooth'
import { buildFilter } from '../utils/filters'
import { STICKERS } from './stickers'

const TINTS = ['#CFC9C0', '#D6CBC8', '#C6CDD3', '#D3CCD6', '#CCD3C6', '#D6D0C0']
const clamp = (n: number) => Math.min(100, Math.max(0, n))
const wrapDeg = (n: number) => ((n + 180) % 360 + 360) % 360 - 180
/** Sticker/text size range (in strip-reference px). Keep in sync with the Size slider in Controls. */
const SIZE_MIN = 12
const SIZE_MAX = 260
const clampSize = (n: number) => Math.min(SIZE_MAX, Math.max(SIZE_MIN, n))
/** Sticker/text sizes are authored for a strip this wide and scale proportionally, so preview, result and export all match. */
const REF_WIDTH = 320
interface Props {
  layout: PhotoLayout; photos: (CapturedPhoto | null)[]; frame: FrameConfig; filter: FilterConfig; decorations: Decoration[]
  width?: number | string; interactive?: boolean; selectedId?: string | null
  onSelect?: (id: string | null) => void; onMove?: (id: string, x: number, y: number) => void; onRotate?: (id: string, deg: number) => void
  onResize?: (id: string, size: number, x: number, y: number) => void
}
interface Pt { x: number; y: number; id: string }
type Gesture =
  | { mode: 'drag'; id: string; dx: number; dy: number }
  | { mode: 'pinch'; id: string; dist: number; size: number; angle: number; rotation: number }
interface ResizeGesture { id: string; size: number; dist: number; cx: number; cy: number }
const NOISE = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.48'/%3E%3C/svg%3E\")"
const textureStyle = (texture: FrameConfig['texture']): React.CSSProperties => {
  switch (texture) {
    case 'paper': return { backgroundImage: `linear-gradient(115deg, rgb(255 255 255 / 10%), transparent 42%, rgb(70 50 30 / 5%)), ${NOISE}`, backgroundBlendMode: 'soft-light, multiply' }
    case 'noise': return { backgroundImage: NOISE, backgroundBlendMode: 'soft-light', backgroundSize: '150px 150px' }
    case 'film': return { backgroundImage: `linear-gradient(0deg, rgb(0 0 0 / 5%), rgb(255 255 255 / 5%)), ${NOISE}`, backgroundBlendMode: 'overlay, soft-light', backgroundSize: '100% 100%, 110px 110px' }
    case 'speckle': return { backgroundImage: `radial-gradient(circle at 12% 18%, rgb(30 25 20 / 16%) 0 1px, transparent 1.5px), radial-gradient(circle at 76% 68%, rgb(30 25 20 / 12%) 0 1px, transparent 1.5px), ${NOISE}`, backgroundSize: '17px 19px, 23px 29px, 160px 160px', backgroundBlendMode: 'multiply' }
    case 'botanical': return { backgroundImage: `radial-gradient(ellipse at 100% 0%, rgb(255 255 255 / 17%), transparent 34%), radial-gradient(ellipse at 0% 100%, rgb(30 25 20 / 8%), transparent 40%), ${NOISE}`, backgroundBlendMode: 'screen, multiply, soft-light' }
    default: return {}
  }
}
/** Single renderer shared by preview and PNG export. Textures and borders are inline so they export with the photo. */
const PhotoStrip = forwardRef<HTMLDivElement, Props>(function PhotoStrip(
  { layout, photos, frame, filter, decorations, width = 'min(360px, calc(100vw - 48px))', interactive = false, selectedId = null, onSelect, onMove, onRotate, onResize }, ref,
) {
  const date = useMemo(() => { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}` }, [])
  const innerRef = useRef<HTMLDivElement | null>(null)
  const [stripW, setStripW] = useState(REF_WIDTH)
  const setRefs = useCallback((el: HTMLDivElement | null) => { innerRef.current = el; if (typeof ref === 'function') ref(el); else if (ref) ref.current = el }, [ref])
  useLayoutEffect(() => {
    const el = innerRef.current; if (!el) return
    const update = () => setStripW(el.offsetWidth || REF_WIDTH)
    update(); const ro = new ResizeObserver(update); ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const scale = stripW / REF_WIDTH
  const gap = Math.max(6, Math.round(frame.padding / 2)); const css = buildFilter(filter)
  const label = [frame.caption.trim(), frame.showDate ? date : ''].filter(Boolean).join('  ·  ')

  // ---- sticker gestures: drag to move, two-finger pinch to resize + twist, corner handle to resize, top handle to rotate ----
  const pointers = useRef(new Map<number, Pt>())
  const gesture = useRef<Gesture | null>(null)
  const resizing = useRef<ResizeGesture | null>(null)
  const pointsOf = (id: string) => [...pointers.current.values()].filter(p => p.id === id)
  /** Stickers may hang over the strip edge (the overhang is cropped in the saved image); only the centre is kept on the strip so it can always be grabbed. */
  const place = (_size: number, x: number, y: number, _r: DOMRect) => ({ x: clamp(x), y: clamp(y) })
  const dragFrom = (d: Decoration, p: { x: number; y: number }, r: DOMRect): Gesture => ({ mode: 'drag', id: d.id, dx: ((p.x - r.left) / r.width) * 100 - d.x, dy: ((p.y - r.top) / r.height) * 100 - d.y })

  const down = (e: PointerEvent<HTMLDivElement>, d: Decoration) => {
    if (!interactive) return
    e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); onSelect?.(d.id)
    const root = e.currentTarget.parentElement; if (!root) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, id: d.id })
    const pts = pointsOf(d.id)
    if (pts.length >= 2) {
      const [a, b] = pts
      gesture.current = { mode: 'pinch', id: d.id, dist: Math.hypot(b.x - a.x, b.y - a.y), size: d.size, angle: Math.atan2(b.y - a.y, b.x - a.x), rotation: d.rotation ?? 0 }
    } else gesture.current = dragFrom(d, { x: e.clientX, y: e.clientY }, root.getBoundingClientRect())
  }
  const move = (e: PointerEvent<HTMLDivElement>, d: Decoration) => {
    const p = pointers.current.get(e.pointerId); if (!interactive || !p) return
    p.x = e.clientX; p.y = e.clientY
    const root = e.currentTarget.parentElement; const g = gesture.current; if (!root || !g || g.id !== d.id) return
    const r = root.getBoundingClientRect()
    if (g.mode === 'pinch') {
      const pts = pointsOf(d.id); if (pts.length < 2) return
      const [a, b] = pts
      const size = clampSize(g.size * Math.hypot(b.x - a.x, b.y - a.y) / Math.max(1, g.dist))
      const pos = place(size, d.x, d.y, r)
      onResize?.(d.id, Math.round(size), pos.x, pos.y)
      onRotate?.(d.id, Math.round(wrapDeg(g.rotation + (Math.atan2(b.y - a.y, b.x - a.x) - g.angle) * 180 / Math.PI)))
      return
    }
    const pos = place(d.size, ((e.clientX - r.left) / r.width) * 100 - g.dx, ((e.clientY - r.top) / r.height) * 100 - g.dy, r)
    onMove?.(d.id, pos.x, pos.y)
  }
  const up = (e: PointerEvent<HTMLDivElement>, d: Decoration) => {
    pointers.current.delete(e.pointerId)
    const left = pointsOf(d.id), root = e.currentTarget.parentElement
    if (left.length === 1 && root) gesture.current = dragFrom(d, left[0], root.getBoundingClientRect()) // lifted one finger of a pinch: keep dragging without a jump
    else if (left.length === 0 && gesture.current?.id === d.id) gesture.current = null
  }
  const key = (e: KeyboardEvent<HTMLDivElement>, d: Decoration) => { const step = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] }[e.key]; if (!interactive || !step) return; e.preventDefault(); onMove?.(d.id, clamp(d.x+step[0]), clamp(d.y+step[1])) }

  const rotateStart = (e: PointerEvent<HTMLDivElement>, id: string) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); onSelect?.(id) }
  const rotateMove = (e: PointerEvent<HTMLDivElement>, id: string) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const box = e.currentTarget.parentElement; if (!box) return
    const r = box.getBoundingClientRect()
    let deg = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI + 90
    deg = wrapDeg(deg)
    for (const snap of [-180, -90, 0, 90, 180]) if (Math.abs(deg - snap) < 4) deg = snap
    onRotate?.(id, Math.round(deg))
  }
  const resizeStart = (e: PointerEvent<HTMLDivElement>, d: Decoration) => {
    e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); onSelect?.(d.id)
    const box = e.currentTarget.parentElement; if (!box) return
    const r = box.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    resizing.current = { id: d.id, size: d.size, dist: Math.hypot(e.clientX - cx, e.clientY - cy), cx, cy }
  }
  const resizeMove = (e: PointerEvent<HTMLDivElement>, d: Decoration) => {
    const g = resizing.current
    if (!g || g.id !== d.id || !e.currentTarget.hasPointerCapture(e.pointerId)) return
    const root = e.currentTarget.parentElement?.parentElement; if (!root) return
    const size = clampSize(g.size * Math.hypot(e.clientX - g.cx, e.clientY - g.cy) / Math.max(1, g.dist))
    const pos = place(size, d.x, d.y, root.getBoundingClientRect())
    onResize?.(d.id, Math.round(size), pos.x, pos.y)
  }
  const resizeEnd = () => { resizing.current = null }

  const outerBorder: React.CSSProperties = frame.style === 'double'
    ? { boxShadow: `inset 0 0 0 1px ${frame.ink}, inset 0 0 0 5px ${frame.background}, inset 0 0 0 6px ${frame.ink}` }
    : frame.style === 'editorial' ? { borderTop: `1px solid ${frame.ink}55`, borderBottom: `1px solid ${frame.ink}55` } : {}
  const filmSlots = frame.style === 'film'
  return <div ref={setRefs} onPointerDown={interactive ? () => onSelect?.(null) : undefined} style={{ position:'relative', width, boxSizing:'border-box', padding:frame.padding + (frame.style === 'film' ? 12 : 0), backgroundColor:frame.background, color:frame.ink, ...textureStyle(frame.texture), ...outerBorder }}>
    {filmSlots && <div aria-hidden="true" style={{ position:'absolute', inset:'10px 3px', pointerEvents:'none', display:'flex', flexDirection:'column', justifyContent:'space-around', zIndex:1 }}>{Array.from({length:Math.max(4, layout.count)},(_,i)=><div key={i} style={{display:'flex',justifyContent:'space-between'}}><span style={{width:5,height:8,background:frame.ink,opacity:.72,borderRadius:1}}/><span style={{width:5,height:8,background:frame.ink,opacity:.72,borderRadius:1}}/></div>)}</div>}
    <div style={{ position:'relative', zIndex:1, display:'grid', gridTemplateColumns:`repeat(${layout.cols}, minmax(0, 1fr))`, gap }}>
      {Array.from({length:layout.count},(_,i)=>{const p=photos[i];return <div key={i} style={{aspectRatio:'4 / 3',overflow:'hidden',background:TINTS[i%TINTS.length],outline:frame.style==='double'? `1px solid ${frame.ink}66` : 'none',outlineOffset:-2}}>{p&&<img src={p.src} alt={`Photo ${i+1}`} draggable={false} style={{display:'block',width:'100%',height:'100%',objectFit:'cover',filter:css||undefined}}/>}</div>})}
    </div>
    {label&&<div style={{position:'relative',zIndex:1,paddingTop:gap+5,paddingBottom:frame.style==='editorial'?5:2,textAlign:'center',fontFamily:frame.style==='editorial'?'Georgia, serif':undefined,fontSize:frame.style==='editorial'?10:12,fontWeight:frame.style==='editorial'?400:600,letterSpacing:frame.style==='editorial'?'.2em':'.04em',textTransform:frame.style==='editorial'?'uppercase':undefined}}>{label}</div>}
    {decorations.map(d=>{const selected=interactive&&selectedId===d.id;return <div key={d.id} role={interactive?'button':undefined} tabIndex={interactive?0:undefined} aria-label={interactive?(d.kind==='text'? `Text: ${d.text}`:`${STICKERS[d.icon].label} sticker`):undefined} onPointerDown={e=>down(e,d)} onPointerMove={e=>move(e,d)} onPointerUp={e=>up(e,d)} onPointerCancel={e=>up(e,d)} onKeyDown={e=>key(e,d)} onFocus={()=>interactive&&onSelect?.(d.id)} style={{position:'absolute',left:`${d.x}%`,top:`${d.y}%`,transform:`translate(-50%, -50%) rotate(${d.rotation ?? 0}deg) scaleX(${d.flip ? -1 : 1})`,color:d.color,cursor:interactive?'grab':'default',touchAction:'none',lineHeight:1,zIndex:selected?4:3,outline:selected?'1.5px dashed #b8456a':'none',outlineOffset:4,boxSizing:'border-box',flexShrink:0,maxWidth:'none',maxHeight:'none'}}>
      {d.kind==='sticker'?<img src={STICKERS[d.icon].src} alt={STICKERS[d.icon].label} draggable={false} style={{width:d.size*scale,height:d.size*scale,minWidth:d.size*scale,minHeight:d.size*scale,maxWidth:'none',maxHeight:'none',objectFit:'contain',display:'block',flex:'none',pointerEvents:'none'}}/>:<span style={{fontFamily:`'Bricolage Grotesque', sans-serif`,fontWeight:700,fontSize:d.size*scale,whiteSpace:'nowrap'}}>{d.text}</span>}
      {selected&&<div role="slider" aria-label="Rotate" aria-valuemin={-180} aria-valuemax={180} aria-valuenow={d.rotation??0} title="Drag to rotate" onPointerDown={e=>rotateStart(e,d.id)} onPointerMove={e=>rotateMove(e,d.id)} style={{position:'absolute',left:'50%',top:-36,transform:'translateX(-50%)',width:22,height:22,borderRadius:'50%',background:'#fff',border:'2px solid #b8456a',cursor:'grab',touchAction:'none',boxShadow:'0 1px 4px rgb(0 0 0 / 25%)'}}/>}
      {selected&&<div role="slider" aria-label="Resize" aria-valuemin={SIZE_MIN} aria-valuemax={SIZE_MAX} aria-valuenow={Math.round(d.size)} title="Drag to resize" onPointerDown={e=>resizeStart(e,d)} onPointerMove={e=>resizeMove(e,d)} onPointerUp={resizeEnd} onPointerCancel={resizeEnd} style={{position:'absolute',right:-15,bottom:-15,width:26,height:26,borderRadius:'50%',background:'#fff',border:'2px solid #b8456a',cursor:'nwse-resize',touchAction:'none',boxShadow:'0 1px 4px rgb(0 0 0 / 25%)',display:'grid',placeItems:'center'}}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#b8456a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{pointerEvents:'none'}}><path d="M3 9L9 3M6 3h3v3M3 6v3h3"/></svg></div>}
    </div>})}
  </div>
})
export default PhotoStrip
