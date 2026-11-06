export function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const radius = 18
  const circ = 2 * Math.PI * radius
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ
  const color = score >= 90 ? "#6d4aff" : score >= 75 ? "#f97316" : "#94a3b8"
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="size-full -rotate-90">
        <circle cx="22" cy="22" r={radius} stroke="#eceef3" strokeWidth="3.5" fill="none" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke={color}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums text-[#1c1f2a]">{score}</span>
    </div>
  )
}
