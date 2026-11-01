export interface DepthColumn {
  /** Timestamp in ms (or any unique label). Used as the column's identity. */
  time: number | string
  /** Resting size at each price level — same length and order as `levels`. */
  depth: number[]
  /** Traded / mid price at this moment, drawn as the trace line. */
  price?: number
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** "Nice" round tick values covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5) {
  if (!(max > min))
    return [min]
  const raw = (max - min) / Math.max(1, count)
  const pow = 10 ** Math.floor(Math.log10(raw))
  const r = raw / pow
  const step = (r >= 7.5 ? 10 : r >= 3.5 ? 5 : r >= 1.5 ? 2 : 1) * pow
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step)
    ticks.push(Number(v.toFixed(10)))
  return ticks
}

/** Default time label: HH:MM:SS for sub-minute spacing, HH:MM otherwise. Strings pass through. */
export function defaultTimeFormatter(locale: string, spacingMs: number) {
  const f = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: spacingMs < 6e4 ? '2-digit' : undefined,
    hour12: false,
  })
  return (t: DepthColumn['time']) => (typeof t === 'number' ? f.format(t) : t)
}
