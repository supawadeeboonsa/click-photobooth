import { useCallback, useEffect, useRef, useState } from 'react'

export function useCountdown() {
  const [value, setValue] = useState<number | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  const cancel = useCallback(() => {
    cancelRef.current?.()
    cancelRef.current = null
    setValue(null)
  }, [])

  /** Resolves true when the countdown finishes, false if cancelled. */
  const run = useCallback((seconds = 3) => new Promise<boolean>((resolve) => {
    cancelRef.current?.()
    let n = seconds
    setValue(n)
    const id = window.setInterval(() => {
      n -= 1
      if (n <= 0) {
        window.clearInterval(id)
        cancelRef.current = null
        setValue(null)
        resolve(true)
      } else setValue(n)
    }, 1000)
    cancelRef.current = () => { window.clearInterval(id); resolve(false) }
  }), [])

  useEffect(() => cancel, [cancel])
  return { value, run, cancel }
}
