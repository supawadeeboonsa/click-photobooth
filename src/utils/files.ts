const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 20 * 1024 * 1024
export const ACCEPT_ATTR = ACCEPTED.join(',')

export function validateImage(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return `${file.name}: only JPEG, PNG and WebP images are supported.`
  if (file.size > MAX_BYTES) return `${file.name}: file is larger than 20 MB.`
  return null
}

/** Decodes (honouring EXIF rotation), center-crops to 4:3 and caps size at 1600px wide. */
export async function fileToPhotoSrc(file: File): Promise<string> {
  const bmp = await createImageBitmap(file)
  const ratio = 4 / 3
  let sw = bmp.width, sh = bmp.width / ratio
  if (sh > bmp.height) { sh = bmp.height; sw = bmp.height * ratio }
  const w = Math.min(1600, Math.round(sw))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = Math.round(w / ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return canvas.toDataURL('image/jpeg', 0.94)
}
