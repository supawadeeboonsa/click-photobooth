import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import type {
  CapturedPhoto, Decoration, DecorationPatch, FilterConfig, FrameConfig, LayoutId,
  PhotoSource, PhotoboothSession, ShotCount, Step,
} from './types/photobooth'
import { DEFAULT_FRAME, getLayout, layoutForShots } from './utils/layouts'

export interface State extends PhotoboothSession { step: Step; captureMode: PhotoSource }

type Action =
  | { type: 'goto'; step: Step }
  | { type: 'mode'; mode: PhotoSource }
  | { type: 'shots'; count: ShotCount }
  | { type: 'photo'; index: number; photo: CapturedPhoto | null }
  | { type: 'layout'; id: LayoutId }
  | { type: 'frame'; patch: Partial<FrameConfig> }
  | { type: 'filter'; patch: Partial<FilterConfig> }
  | { type: 'addDeco'; deco: Decoration }
  | { type: 'updateDeco'; id: string; patch: DecorationPatch }
  | { type: 'removeDeco'; id: string }
  | { type: 'selectDeco'; id: string | null }
  | { type: 'newSession' }

const PREFS_KEY = 'click-photobooth:prefs'
const DEFAULT_FILTER: FilterConfig = { preset: 'original', brightness: 100, contrast: 100 }

function loadPrefs(): { frame: FrameConfig; filter: FilterConfig } {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null')
    if (raw) return { frame: { ...DEFAULT_FRAME, ...raw.frame }, filter: { ...DEFAULT_FILTER, ...raw.filter } }
  } catch { /* ignore corrupt or unavailable storage */ }
  return { frame: DEFAULT_FRAME, filter: DEFAULT_FILTER }
}

function freshState(step: Step, prefs = loadPrefs()): State {
  return {
    step, captureMode: 'camera', shotCount: 4, photos: Array(6).fill(null), layoutId: '4-cut',
    frame: prefs.frame, filter: prefs.filter, decorations: [], selectedDecorationId: null,
  }
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'goto': return { ...s, step: a.step, selectedDecorationId: null }
    case 'mode': return { ...s, captureMode: a.mode }
    case 'shots': return {
      ...s,
      shotCount: a.count,
      layoutId: layoutForShots(a.count),
      photos: s.photos.map((photo, index) => index < a.count ? photo : null),
    }
    case 'photo': return { ...s, photos: s.photos.map((p, i) => (i === a.index ? a.photo : p)) }
    case 'layout': return { ...s, layoutId: a.id }
    case 'frame': return { ...s, frame: { ...s.frame, ...a.patch } }
    case 'filter': return { ...s, filter: { ...s.filter, ...a.patch } }
    case 'addDeco': return { ...s, decorations: [...s.decorations, a.deco], selectedDecorationId: a.deco.id }
    case 'updateDeco':
      return { ...s, decorations: s.decorations.map((d) => (d.id === a.id ? ({ ...d, ...a.patch } as Decoration) : d)) }
    case 'removeDeco':
      return { ...s, decorations: s.decorations.filter((d) => d.id !== a.id), selectedDecorationId: null }
    case 'selectDeco': return { ...s, selectedDecorationId: a.id }
    case 'newSession': return freshState('capture', { frame: s.frame, filter: s.filter })
  }
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null)

export function PhotoboothProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, 'welcome' as Step, (step) => freshState(step))
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ frame: state.frame, filter: state.filter })) } catch { /* ignore */ }
  }, [state.frame, state.filter])
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePhotobooth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePhotobooth must be used inside PhotoboothProvider')
  return c
}

export const capturedReady = (s: State) => s.photos.slice(0, s.shotCount).every(Boolean)
export const layoutReady = (s: State) => s.photos.slice(0, getLayout(s.layoutId).count).every(Boolean)
