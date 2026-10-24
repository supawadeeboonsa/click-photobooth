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
