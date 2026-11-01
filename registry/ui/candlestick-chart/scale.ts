export interface Candle {
  /** Timestamp in ms (or any unique label). Used as the candle's identity. */
  time: number | string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** "Nice" round tick values covering [min, max] — roughly `count` of them. */
export function niceTicks(min: number, max: number, count = 5) {
  if (!(max > min))
    return [min]
  const raw = (max - min) / Math.max(1, count)
  const pow = 10 ** Math.floor(Math.log10(raw))
  const n = raw / pow
  const step = (n >= 7.5 ? 10 : n >= 3.5 ? 5 : n >= 1.5 ? 2 : 1) * pow
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step)
    ticks.push(Number(v.toFixed(10)))
  return ticks
}

export function priceFormatter(locale: string, digits: number) {
  const f = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return (v: number) => f.format(v)
}

export function compactFormatter(locale: string) {
  const f = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 })
  return (v: number) => f.format(v)
}

/** Default time label: HH:MM for intraday spacing, "Jan 5" otherwise. Strings pass through. */
export function defaultTimeFormatter(locale: string, spacingMs: number) {
  const f = spacingMs < 864e5
    ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
    : new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })
  return (t: Candle['time']) => (typeof t === 'number' ? f.format(t) : t)
}
