import type { RefObject } from 'react'
import { CameraOff, LoaderCircle } from 'lucide-react'
import type { CameraStatus } from '../hooks/useCamera'
import { CAMERA_MESSAGES } from '../utils/camera'
import CountdownOverlay from './CountdownOverlay'

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>
  status: CameraStatus
  mirror: boolean
  countdown: number | null
  flash: boolean
  shotLabel: string
  onRetry: () => void
  onUpload: () => void
}

export default function CameraPreview({ videoRef, status, mirror, countdown, flash, shotLabel, onRetry, onUpload }: Props) {
  const failed = status !== 'idle' && status !== 'starting' && status !== 'ready'
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#1c1b1a]">
      <video ref={videoRef} playsInline muted autoPlay aria-label="Live camera preview"
        className={`h-full w-full object-cover ${status === 'ready' ? '' : 'invisible'}`}
        style={{ transform: mirror ? 'scaleX(-1)' : undefined }} />
      {status === 'ready' && (
        <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold">{shotLabel}</span>
      )}
      {status === 'starting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white" role="status">
          <LoaderCircle className="animate-spin" /> Starting camera…
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white" role="alert">
          <CameraOff size={32} />
          <p className="max-w-sm text-sm leading-relaxed">{CAMERA_MESSAGES[status]}</p>
          <div className="flex gap-2">
            {status !== 'nocamera' && status !== 'unsupported' && <button className="btn h-10" onClick={onRetry}>Try again</button>}
            <button className="btn h-10" onClick={onUpload}>Upload photos</button>
          </div>
        </div>
      )}
      <CountdownOverlay value={countdown} flash={flash} />
    </div>
  )
}
