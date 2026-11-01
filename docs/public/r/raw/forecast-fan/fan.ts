export interface ForecastTargets {
  low: number
  median: number
  high: number
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

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

/** Fritsch–Carlson monotone cubic through the points — smooth without overshooting. */
export function monotonePath(p: [number, number][]) {
  const n = p.length
  if (n < 2)
    return ''
  const m: number[] = []
  for (let i = 0; i < n - 1; i++)
    m[i] = (p[i + 1]![1] - p[i]![1]) / (p[i + 1]![0] - p[i]![0] || 1)
  const t: number[] = [m[0]!]
  for (let i = 1; i < n - 1; i++)
    t[i] = m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2
  t[n - 1] = m[n - 2]!
  let d = `M${p[0]![0]},${p[0]![1]}`
  for (let i = 0; i < n - 1; i++) {
    const h = (p[i + 1]![0] - p[i]![0]) / 3
    d += ` C${p[i]![0] + h},${p[i]![1] + t[i]! * h} ${p[i + 1]![0] - h},${p[i + 1]![1] - t[i + 1]! * h} ${p[i + 1]![0]},${p[i + 1]![1]}`
  }
  return d
}

/**
 * Spreads label centres apart so no two are closer than `gap`, keeping them inside [min, max].
 * Input order doesn't matter; output matches input order.
 */
export function separate(ys: number[], gap: number, min: number, max: number) {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)
  for (let k = 1; k < order.length; k++)
    order[k]!.y = Math.max(order[k]!.y, order[k - 1]!.y + gap)
  const overflow = (order.at(-1)?.y ?? 0) - max
  if (overflow > 0) {
    order.at(-1)!.y = max
    for (let k = order.length - 2; k >= 0; k--)
      order[k]!.y = Math.min(order[k]!.y, order[k + 1]!.y - gap)
  }
  if (order.length && order[0]!.y < min) {
    order[0]!.y = min
    for (let k = 1; k < order.length; k++)
      order[k]!.y = Math.max(order[k]!.y, order[k - 1]!.y + gap)
  }
  const out: number[] = []
  for (const o of order) out[o.i] = o.y
  return out
}
