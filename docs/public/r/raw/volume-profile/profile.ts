export interface VolumeSample {
  /** Traded price (a trade, or a candle's typical price). */
  price: number
  volume: number
}

export interface ProfileLevel {
  index: number
  /** Lower / upper price bound of the bin. */
  from: number
  to: number
  volume: number
  inValueArea: boolean
}

/**
 * Buckets samples into `bins` equal price ranges, finds the point of control (the busiest bin)
 * and grows the value area outward from it — always taking the busier neighbour — until it
 * holds `share` of the total volume.
 */
export function buildProfile(samples: VolumeSample[], bins: number, share: number, extra: number[] = []) {
  const prices = [...samples.map(s => s.price), ...extra]
  let lo = Math.min(...prices)
  let hi = Math.max(...prices)
  if (!Number.isFinite(lo)) {
    lo = 0
    hi = 1
  }
  if (hi === lo) {
    lo -= 0.5
    hi += 0.5
  }
  const n = Math.max(1, Math.round(bins))
  const step = (hi - lo) / n
  const levels: ProfileLevel[] = Array.from({ length: n }, (_, i) => ({
    index: i,
    from: lo + i * step,
    to: lo + (i + 1) * step,
    volume: 0,
    inValueArea: false,
  }))
  for (const s of samples)
    levels[Math.min(n - 1, Math.floor((s.price - lo) / step))]!.volume += Math.max(0, s.volume)

  const total = levels.reduce((sum, l) => sum + l.volume, 0)
  const poc = levels.reduce((best, l) => (l.volume > best.volume ? l : best), levels[0]!).index
  let a = poc
  let b = poc
  let inside = levels[poc]!.volume
  levels[poc]!.inValueArea = true
  while (inside < total * share && (a > 0 || b < n - 1)) {
    const below = a > 0 ? levels[a - 1]!.volume : -1
    const above = b < n - 1 ? levels[b + 1]!.volume : -1
    const next = above >= below ? levels[++b]! : levels[--a]!
    next.inValueArea = true
    inside += next.volume
  }
  const max = Math.max(1, ...levels.map(l => l.volume))
  return { levels, lo, hi, total, max, poc, val: levels[a]!.from, vah: levels[b]!.to }
}

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
