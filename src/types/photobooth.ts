export type Step = 'welcome' | 'capture' | 'editor' | 'result'
export type PhotoSource = 'camera' | 'upload'
export type ShotCount = 1 | 2 | 3 | 4 | 5 | 6
export type LayoutId = '1-cut' | '2-cut' | '3-cut' | '4-cut' | '5-cut' | '6-cut' | '2x2'
export type FilterPreset = 'original' | 'grayscale' | 'warm' | 'cool' | 'vintage'
export type TextureId = 'none' | 'paper' | 'noise' | 'film' | 'speckle' | 'botanical'
export type FrameStyleId = 'classic' | 'double' | 'film' | 'editorial'
export type StickerIcon = 'alert' | 'eightBall' | 'cake' | 'flower' | 'duo' | 'kuromi' | 'love' | 'myme' | 'poteto' | 'song' | 'star'
export interface CapturedPhoto { src: string; source: PhotoSource }
export interface PhotoLayout { id: LayoutId; label: string; count: number; cols: 1 | 2 }
export interface FrameConfig { presetId: string; background: string; ink: string; padding: number; caption: string; showDate: boolean; texture: TextureId; style: FrameStyleId }
export interface FilterConfig { preset: FilterPreset; brightness: number; contrast: number }
interface BaseDecoration { id: string; x: number; y: number; color: string; size: number; rotation?: number; flip?: boolean }
export interface TextDecoration extends BaseDecoration { kind: 'text'; text: string }
export interface StickerDecoration extends BaseDecoration { kind: 'sticker'; icon: StickerIcon }
export type Decoration = TextDecoration | StickerDecoration
export type DecorationPatch = Partial<Omit<BaseDecoration, 'id'>> & { text?: string }
export interface PhotoboothSession { shotCount: ShotCount; photos: (CapturedPhoto | null)[]; layoutId: LayoutId; frame: FrameConfig; filter: FilterConfig; decorations: Decoration[]; selectedDecorationId: string | null }
export interface ExportConfig { width: number; filename: string }
