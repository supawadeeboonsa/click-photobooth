import type { FilterConfig, FilterPreset } from '../types/photobooth'

const PRESETS: Record<FilterPreset, string> = {
  original: '',
  grayscale: 'grayscale(1)',
  warm: 'sepia(0.25) saturate(1.2) hue-rotate(-8deg)',
  cool: 'saturate(1.05) hue-rotate(12deg) brightness(1.02)',
  vintage: 'sepia(0.45) contrast(0.92) saturate(0.85) brightness(1.04)',
}

export const buildFilter = (f: FilterConfig): string =>
  [PRESETS[f.preset], `brightness(${f.brightness}%)`, `contrast(${f.contrast}%)`].filter(Boolean).join(' ')
