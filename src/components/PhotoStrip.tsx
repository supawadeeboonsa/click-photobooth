import { forwardRef, useCallback, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { CapturedPhoto, Decoration, FilterConfig, FrameConfig, PhotoLayout } from '../types/photobooth'
import { buildFilter } from '../utils/filters'
import { STICKERS } from './stickers'

const TINTS = ['#CFC9C0', '#D6CBC8', '#C6CDD3', '#D3CCD6', '#CCD3C6', '#D6D0C0']
const clamp = (n: number) => Math.min(100, Math.max(0, n))
/** Sticker/text sizes are authored for a strip this wide and scale proportionally, so preview, result and export all match. */
const REF_WIDTH = 320
interface Props {
  layout: PhotoLayout; photos: (CapturedPhoto | null)[]; frame: FrameConfig; filter: FilterConfig; decorations: Decoration[]
  width?: number | string; interactive?: boolean; selectedId?: string | null
  onSelect?: (id: string | null) => void; onMove?: (id: string, x: number, y: number) => void; onRotate?: (id: string, deg: number) => void
}
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
  { layout, photos, frame, filter, decorations, width = 'min(360px, calc(100vw - 48px))', interactive = false, selectedId = null, onSelect, onMove, onRotate }, ref,
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
  const down = (e: PointerEvent<HTMLDivElement>, id: string) => { if (!interactive) return; e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); onSelect?.(id) }
  const move = (e: PointerEvent<HTMLDivElement>, id: string) => { if (!interactive || !e.currentTarget.hasPointerCapture(e.pointerId)) return; const root = e.currentTarget.parentElement; if (!root) return; const r = root.getBoundingClientRect(); const decoration = decorations.find(item => item.id === id); const size = (decoration?.size ?? 0) * scale; const padX = Math.min(49, (size / Math.max(1, r.width)) * 50); const padY = Math.min(49, (size / Math.max(1, r.height)) * 50); const x = ((e.clientX-r.left)/r.width)*100; const y = ((e.clientY-r.top)/r.height)*100; onMove?.(id, Math.min(100-padX, Math.max(padX, x)), Math.min(100-padY, Math.max(padY, y))) }
  const key = (e: KeyboardEvent<HTMLDivElement>, d: Decoration) => { const step = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] }[e.key]; if (!interactive || !step) return; e.preventDefault(); onMove?.(d.id, clamp(d.x+step[0]), clamp(d.y+step[1])) }
  const rotateStart = (e: PointerEvent<HTMLDivElement>, id: string) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); onSelect?.(id) }
  const rotateMove = (e: PointerEvent<HTMLDivElement>, id: string) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const box = e.currentTarget.parentElement; if (!box) return
    const r = box.getBoundingClientRect()
    let deg = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI + 90
    deg = ((deg + 180) % 360 + 360) % 360 - 180
    for (const snap of [-180, -90, 0, 90, 180]) if (Math.abs(deg - snap) < 4) deg = snap
    onRotate?.(id, Math.round(deg))
  }
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
    {decorations.map(d=><div key={d.id} role={interactive?'button':undefined} tabIndex={interactive?0:undefined} aria-label={interactive?(d.kind==='text'? `Text: ${d.text}`:`${STICKERS[d.icon].label} sticker`):undefined} onPointerDown={e=>down(e,d.id)} onPointerMove={e=>move(e,d.id)} onKeyDown={e=>key(e,d)} onFocus={()=>interactive&&onSelect?.(d.id)} style={{position:'absolute',left:`${d.x}%`,top:`${d.y}%`,transform:`translate(-50%, -50%) rotate(${d.rotation ?? 0}deg) scaleX(${d.flip ? -1 : 1})`,color:d.color,cursor:interactive?'grab':'default',touchAction:'none',lineHeight:1,zIndex:3,outline:interactive&&selectedId===d.id?'1.5px dashed #b8456a':'none',outlineOffset:4,boxSizing:'border-box',flexShrink:0,maxWidth:'none',maxHeight:'none'}}>
      {d.kind==='sticker'?<img src={STICKERS[d.icon].src} alt={STICKERS[d.icon].label} draggable={false} style={{width:d.size*scale,height:d.size*scale,minWidth:d.size*scale,minHeight:d.size*scale,maxWidth:'none',maxHeight:'none',objectFit:'contain',display:'block',flex:'none',pointerEvents:'none'}}/>:<span style={{fontFamily:`'Bricolage Grotesque', sans-serif`,fontWeight:700,fontSize:d.size*scale,whiteSpace:'nowrap'}}>{d.text}</span>}
      {interactive&&selectedId===d.id&&<div role="slider" aria-label="Rotate" aria-valuemin={-180} aria-valuemax={180} aria-valuenow={d.rotation??0} title="Drag to rotate" onPointerDown={e=>rotateStart(e,d.id)} onPointerMove={e=>rotateMove(e,d.id)} style={{position:'absolute',left:'50%',top:-30,transform:'translateX(-50%)',width:18,height:18,borderRadius:'50%',background:'#fff',border:'2px solid #b8456a',cursor:'grab',touchAction:'none',boxShadow:'0 1px 4px rgb(0 0 0 / 25%)'}}/>}
    </div>)}
  </div>
})
export default PhotoStrip
