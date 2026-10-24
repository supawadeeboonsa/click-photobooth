export default function CountdownOverlay({ value, flash }: { value: number | null; flash: boolean }) {
  return (
    <>
      {value !== null && (
        <div className="absolute inset-0 flex items-center justify-center" role="timer" aria-live="assertive" aria-label={`Taking photo in ${value}`}>
          <span className="font-display text-[clamp(96px,22vw,160px)] font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.35)]">{value}</span>
        </div>
      )}
      {flash && <div className="pointer-events-none absolute inset-0 bg-white/90" />}
    </>
  )
}
