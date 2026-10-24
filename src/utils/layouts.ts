import type { FilterPreset, FrameConfig, LayoutId, PhotoLayout, ShotCount, TextureId, FrameStyleId } from '../types/photobooth'

export const LAYOUTS: PhotoLayout[] = [
  { id: '1-cut', label: '1 photo', count: 1, cols: 1 },
  { id: '2-cut', label: '2 photos', count: 2, cols: 1 },
  { id: '3-cut', label: '3 photos', count: 3, cols: 1 },
  { id: '4-cut', label: '4 photos', count: 4, cols: 1 },
  { id: '2x2', label: '2×2', count: 4, cols: 2 },
]
export const SHOT_COUNTS: ShotCount[] = [1, 2, 3, 4]
export const getLayout = (id: LayoutId): PhotoLayout => LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[3]
export const layoutForShots = (n: ShotCount): LayoutId => `${n}-cut` as LayoutId
export const FRAME_PRESETS = [
  { id: 'ivory', label: 'Ivory', background: '#F4EFE6', ink: '#292722' },
  { id: 'black', label: 'Noir', background: '#191919', ink: '#F7F2E9' },
  { id: 'blush', label: 'Blush', background: '#E8C9C6', ink: '#603C3B' },
  { id: 'sage', label: 'Sage', background: '#8D927A', ink: '#FAF7EF' },
  { id: 'ochre', label: 'Ochre', background: '#C49A4B', ink: '#FFF8E8' },
  { id: 'blue', label: 'Blue grey', background: '#C7D1D2', ink: '#303B3C' },
  { id: 'sand', label: 'Sand', background: '#D9CCB7', ink: '#494035' },
  { id: 'terracotta', label: 'Terracotta', background: '#B97968', ink: '#FFF5EC' },
] as const
export const TEXTURES: { id: TextureId; label: string; description: string }[] = [
  { id: 'none', label: 'Clean', description: 'Smooth colour' },
  { id: 'gingham', label: 'Gingham', description: 'Clear check pattern' },
  { id: 'stripes', label: 'Stripes', description: 'Diagonal stripes' },
  { id: 'grid', label: 'Grid', description: 'Minimal grid pattern' },
  { id: 'hearts', label: 'Hearts', description: 'Tiny heart pattern' },
]
export const FRAME_STYLES: { id: FrameStyleId; label: string; description: string }[] = [
  { id: 'classic', label: 'Classic', description: 'Simple border' },
  { id: 'double', label: 'Double line', description: 'Fine inset outline' },
  { id: 'film', label: 'Film edge', description: 'Analog film sprockets' },
  { id: 'editorial', label: 'Editorial', description: 'Magazine-style spacing' },
]
export const DEFAULT_FRAME: FrameConfig = {
  presetId: 'ivory', background: '#F4EFE6', ink: '#292722', padding: 16, caption: 'CLICK! PHOTOBOOTH',
  showDate: true, texture: 'gingham', style: 'editorial',
}
export const FILTER_LABELS: Record<FilterPreset, string> = {
  original: 'Original', grayscale: 'Mono', warm: 'Warm', cool: 'Cool', vintage: 'Vintage',
}
export const inkFor = (hex: string): string => {
  const n = parseInt(hex.replace('#', ''), 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.55 ? '#292722' : '#FFF8EF'
}
