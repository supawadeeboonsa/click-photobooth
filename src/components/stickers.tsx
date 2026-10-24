import type { StickerIcon } from '../types/photobooth'

export const STICKERS: Record<StickerIcon, { src: string; label: string }> = {
  alert: { src: '/stickers/!!!.png', label: 'Double exclamation' },
  eightBall: { src: '/stickers/08.png', label: '8 ball' },
  cake: { src: '/stickers/cake.png', label: 'Apple plush' },
  flower: { src: '/stickers/dokmai.png', label: 'Pink flower' },
  duo: { src: '/stickers/duo.png', label: 'Kuromi & My Melody duo' },
  kuromi: { src: '/stickers/kuromi.png', label: 'Kuromi' },
  love: { src: '/stickers/love.png', label: 'Penguin couple' },
  myme: { src: '/stickers/myme.png', label: 'My Melody' },
  poteto: { src: '/stickers/poteto.png', label: 'Tomato' },
  song: { src: '/stickers/song.png', label: 'Decorated CD' },
  star: { src: '/stickers/star.png', label: 'Silver stars' },
}