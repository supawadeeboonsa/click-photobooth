import { toPng } from 'html-to-image'

/** Renders the strip node to a PNG data URL, always `targetWidth` px wide. */
export async function exportStripPng(node: HTMLElement, targetWidth = 1080): Promise<string> {
  await document.fonts?.ready
  const base = { pixelRatio: targetWidth / node.offsetWidth }
  const render = async (opts: Parameters<typeof toPng>[1]) => {
    await toPng(node, opts) // warm-up pass (works around first-render image gaps in Safari)
    return toPng(node, opts)
  }
  try {
    return await render(base)
  } catch {
    return await render({ ...base, skipFonts: true })
  }
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Phones and tablets (incl. iPadOS, which reports itself as a Mac). */
export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export async function dataUrlToFile(url: string, filename: string): Promise<File> {
  const blob = await (await fetch(url)).blob()
  return new File([blob], filename, { type: 'image/png' })
}

export function canShareFile(file: File | null): boolean {
  try { return !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }) } catch { return false }
}

/** Opens the native share sheet (iOS: "Save Image", Android: Photos/Drive/etc.). Returns false if the user dismissed it. */
export async function shareFile(file: File): Promise<boolean> {
  try {
    await navigator.share({ files: [file], title: 'Click! Photobooth' })
    return true
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return false
    throw err
  }
}
