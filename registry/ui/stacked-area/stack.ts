export interface StackedSeries {
  name: string
  values: number[]
  /** Any CSS color. Defaults to cycling through `--chart-1…5`. */
  color?: string
}

/** One series' band: lower and upper edge per period, in value space. */
export interface Band {
  y0: number[]
  y1: number[]
}

/**
 * Stacks the series bottom-up. Hidden series collapse to zero thickness (so they can animate
 * away instead of popping); in `percent` mode every period is normalised to 1.
 */
export function stack(series: StackedSeries[], length: number, hidden: Set<string>, percent: boolean) {
  const totals = Array.from({ length }, (_, i) =>
    series.reduce((s, x) => s + (hidden.has(x.name) ? 0 : Math.max(0, x.values[i] ?? 0)), 0))
  const base = Array.from({ length }, () => 0)
  const bands: Band[] = series.map((x) => {
    const y0 = [...base]
    const y1 = y0.map((b, i) => {
      const v = hidden.has(x.name) ? 0 : Math.max(0, x.values[i] ?? 0)
      return b + (percent ? (totals[i] ? v / totals[i]! : 0) : v)
    })
    y1.forEach((v, i) => (base[i] = v))
    return { y0, y1 }
  })
  return { bands, totals, max: percent ? 1 : Math.max(0, ...totals) }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** "Nice" round ticks from 0 to at least `max`. */
export function niceTicks(max: number, count = 4) {
  if (!(max > 0))
    return { ticks: [0], top: 1 }
  const raw = max / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const r = raw / pow
  const step = (r > 5 ? 10 : r > 2.5 ? 5 : r > 2 ? 2.5 : r > 1 ? 2 : 1) * pow
  const top = Math.ceil(max / step - 1e-9) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + step * 1e-9; v += step)
    ticks.push(Number(v.toFixed(10)))
  return { ticks, top }
}

/** Monotone cubic (Fritsch–Carlson) segments through `p`, without the leading move. */
function monotoneSegments(p: [number, number][]) {
  const n = p.length
  const m: number[] = []
  for (let i = 0; i < n - 1; i++)
    m[i] = (p[i + 1]![1] - p[i]![1]) / (p[i + 1]![0] - p[i]![0] || 1)
  const t: number[] = [m[0] ?? 0]
  for (let i = 1; i < n - 1; i++)
    t[i] = m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2
  t[n - 1] = m[n - 2] ?? 0
  let d = ''
  for (let i = 0; i < n - 1; i++) {
    const h = (p[i + 1]![0] - p[i]![0]) / 3
    d += ` C${p[i]![0] + h},${p[i]![1] + t[i]! * h} ${p[i + 1]![0] - h},${p[i + 1]![1] - t[i + 1]! * h} ${p[i + 1]![0]},${p[i + 1]![1]}`
  }
  return d
}

function segments(p: [number, number][], smooth: boolean) {
  return smooth ? monotoneSegments(p) : p.slice(1).map(([x, y]) => ` L${x},${y}`).join('')
}

/** Upper edge only. */
export function edgePath(top: [number, number][], smooth: boolean) {
  return top.length ? `M${top[0]![0]},${top[0]![1]}${segments(top, smooth)}` : ''
}

/** Closed band: along the upper edge, back along the lower edge. */
export function bandPath(top: [number, number][], bottom: [number, number][], smooth: boolean) {
  if (!top.length)
    return ''
  const back = [...bottom].reverse()
  return `${edgePath(top, smooth)} L${back[0]![0]},${back[0]![1]}${segments(back, smooth)} Z`
}
