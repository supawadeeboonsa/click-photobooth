import { useCallback, useEffect, useRef, useState } from 'react'
import { classifyCameraError, frameToDataUrl, stopStream, type CameraError } from '../utils/camera'

export type CameraStatus = 'idle' | 'starting' | 'ready' | CameraError

export function useCamera(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startId = useRef(0)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState<string>()
  const [mirror, setMirror] = useState(true)

  const stop = useCallback(() => {
    startId.current += 1
    stopStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const start = useCallback(async (id?: string) => {
    stop()
    const mine = startId.current
    if (!navigator.mediaDevices?.getUserMedia) { setStatus('unsupported'); return }
    setStatus('starting')
    try {
      const size = { width: { ideal: 1920 }, height: { ideal: 1080 } }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: id ? { deviceId: { exact: id }, ...size } : { facingMode: 'user', ...size },
        audio: false,
      })
      if (mine !== startId.current) { stopStream(stream); return } // superseded or unmounted
      streamRef.current = stream
      const settings = stream.getVideoTracks()[0]?.getSettings()
      setMirror(settings?.facingMode !== 'environment')
      setDeviceId(settings?.deviceId)
      const v = videoRef.current
      if (v) { v.srcObject = stream; await v.play().catch(() => undefined) }
      const all = await navigator.mediaDevices.enumerateDevices()
      if (mine === startId.current) {
        setDevices(all.filter((d) => d.kind === 'videoinput'))
        setStatus('ready')
      }
    } catch (e) {
      if (mine === startId.current) setStatus(classifyCameraError(e))
    }
  }, [stop])

  useEffect(() => {
    if (!enabled) { stop(); setStatus('idle'); return }
    void start()
    return stop
  }, [enabled, start, stop])

  const switchCamera = useCallback(() => {
    if (devices.length < 2) return
    const i = devices.findIndex((d) => d.deviceId === deviceId)
    void start(devices[(i + 1) % devices.length].deviceId)
  }, [devices, deviceId, start])

  const capture = useCallback(
    () => (videoRef.current ? frameToDataUrl(videoRef.current, mirror) : null),
    [mirror],
  )

  return { videoRef, status, mirror, devices, start, switchCamera, capture }
}
