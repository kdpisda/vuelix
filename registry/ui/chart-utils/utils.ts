import type { Ref } from 'vue'
import { animate } from 'motion-v'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

export type ChartPoint = [x: number, y: number]

/** Maps a numeric domain onto a pixel range (and back with `.invert`). */
export interface LinearScale {
  (value: number): number
  invert: (pixel: number) => number
  domain: [number, number]
  range: [number, number]
}

export function linearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0 || 1
  const scale = ((v: number) => r0 + ((v - d0) / span) * (r1 - r0)) as LinearScale
  scale.invert = (p: number) => d0 + ((p - r0) / (r1 - r0 || 1)) * span
  scale.domain = domain
  scale.range = range
  return scale
}

/**
 * Round tick values for an axis: picks a step of 1, 2, 5 or 10 × 10ⁿ and
 * widens the domain so both ends land on a tick.
 */
export function niceTicks(min: number, max: number, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max))
    return { ticks: [0, 1], min: 0, max: 1, step: 1 }
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1
    min -= min === 0 ? 0 : pad
    max += pad
  }
  const raw = (max - min) / Math.max(1, count)
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / magnitude
  const step = (norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1) * magnitude
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const decimals = Math.max(0, -Math.floor(Math.log10(step)))
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step)
    ticks.push(Number(v.toFixed(decimals)))
  return { ticks, min: lo, max: hi, step }
}

/** Straight segments through every point. */
export function linearPath(points: ChartPoint[]) {
  if (!points.length)
    return ''
  return `M${points.map(([x, y]) => `${x},${y}`).join('L')}`
}

/**
 * Monotone cubic curve through the points (x must increase). Unlike a plain
 * Catmull-Rom spline it never overshoots, so peaks stay at the real values.
 */
export function monotonePath(points: ChartPoint[]) {
  const n = points.length
  if (n < 3)
    return linearPath(points)
  const slopes: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1]![0] - points[i]![0]
    slopes.push(dx === 0 ? 0 : (points[i + 1]![1] - points[i]![1]) / dx)
  }
  const tangents = [slopes[0]!]
  for (let i = 1; i < n - 1; i++) {
    const a = slopes[i - 1]!
    const b = slopes[i]!
    // Flat at turning points, harmonic-style blend elsewhere keeps the curve monotone.
    tangents.push(a * b <= 0 ? 0 : (3 * a * b) / (Math.max(a, b) + 2 * Math.min(a, b)) || (a + b) / 2)
  }
  tangents.push(slopes[n - 2]!)
  let d = `M${points[0]![0]},${points[0]![1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!
    const [x1, y1] = points[i + 1]!
    const h = (x1 - x0) / 3
    d += `C${x0 + h},${y0 + tangents[i]! * h} ${x1 - h},${y1 - tangents[i + 1]! * h} ${x1},${y1}`
  }
  return d
}

/** Closes a line path down to a baseline so it can be filled as an area. */
export function areaPath(line: string, points: ChartPoint[], baseline: number) {
  if (!points.length)
    return ''
  return `${line}L${points.at(-1)![0]},${baseline}L${points[0]![0]},${baseline}Z`
}

/** Theme colour for series `i`, cycling through the five `--chart-*` tokens. */
export function chartColor(i: number) {
  return `var(--chart-${(((i % 5) + 5) % 5) + 1})`
}

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
/** 1234 → "1.2K". Fixed locale so server and client render the same string. */
export function formatCompact(value: number) {
  return compact.format(value)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Stretches or squeezes `values` to `length` entries by linear interpolation. */
export function resample(values: number[], length: number) {
  if (values.length === length)
    return values
  if (!values.length)
    return Array.from({ length }, () => 0)
  if (values.length === 1 || length === 1)
    return Array.from({ length }, () => values[0]!)
  return Array.from({ length }, (_, i) => {
    const t = (i / (length - 1)) * (values.length - 1)
    const lo = Math.floor(t)
    const hi = Math.min(values.length - 1, lo + 1)
    return values[lo]! + (values[hi]! - values[lo]!) * (t - lo)
  })
}

/**
 * Width of an element, tracked with a ResizeObserver once mounted.
 * Renders `fallback` on the server and until the first measurement.
 */
export function useElementWidth(target: Ref<HTMLElement | null | undefined>, fallback = 640) {
  const width = ref(fallback)
  let observer: ResizeObserver | undefined
  onMounted(() => {
    const el = target.value
    if (!el)
      return
    width.value = Math.round(el.clientWidth) || fallback
    observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry?.contentRect.width ?? 0)
      if (w > 0)
        width.value = w
    })
    observer.observe(el)
  })
  onBeforeUnmount(() => observer?.disconnect())
  return width
}

export interface TweenOptions {
  /** Seconds. */
  duration?: number
  /** Skip the tween and jump straight to new values. */
  reduced?: Ref<boolean>
}

/**
 * Smoothly interpolates a flat list of numbers whenever `source` changes.
 * Charts flatten whatever drives their geometry (values, domain ends) into
 * one array; arrays of a different length are resampled first so shapes
 * still morph instead of jumping.
 */
export function useTween(source: () => number[], options: TweenOptions = {}) {
  const current = shallowRef<number[]>(source().slice())
  let controls: { stop: () => void } | undefined

  watch(source, (next) => {
    const prev = current.value
    if (prev.length === next.length && prev.every((v, i) => v === next[i]))
      return
    controls?.stop()
    if (options.reduced?.value) {
      current.value = next.slice()
      return
    }
    const from = resample(prev, next.length)
    controls = animate(0, 1, {
      duration: options.duration ?? 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t: number) => {
        current.value = next.map((v, i) => from[i]! + (v - from[i]!) * t)
      },
    })
  })

  onBeforeUnmount(() => controls?.stop())
  return current
}
