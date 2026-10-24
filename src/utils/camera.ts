export type CameraError = 'denied' | 'nocamera' | 'inuse' | 'unsupported' | 'error'

export const CAMERA_MESSAGES: Record<CameraError, string> = {
  denied: "Camera access was blocked. Allow it in your browser's site settings and try again, or upload photos instead.",
  nocamera: 'No camera was found on this device. You can upload photos instead.',
  inuse: 'Your camera is being used by another app. Close it and try again.',
  unsupported: "This browser can't access a camera here (HTTPS or localhost is required). Upload photos instead.",
  error: 'Something went wrong while starting the camera.',
}

export function classifyCameraError(e: unknown): CameraError {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'nocamera'
  if (name === 'NotReadableError' || name === 'AbortError') return 'inuse'
  return 'error'
}

export const stopStream = (s: MediaStream | null) => s?.getTracks().forEach((t) => t.stop())

/** Grabs the current video frame, center-cropped to 4:3 (mirrored for selfie cameras). */
export function frameToDataUrl(video: HTMLVideoElement, mirror: boolean): string | null {
  const vw = video.videoWidth, vh = video.videoHeight
  if (!vw || !vh) return null
  const ratio = 4 / 3
  let sw = vw, sh = vw / ratio
  if (sh > vh) { sh = vh; sw = vh * ratio }
  const out = Math.min(1600, Math.round(sw))
  const canvas = document.createElement('canvas')
  canvas.width = out
  canvas.height = Math.round(out / ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  if (mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
  ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.92)
}
