export interface AvailabilityRange {
  /** "HH:MM", 24-hour */
  start: string
  /** "HH:MM", 24-hour */
  end: string
}

export interface AvailabilityDay {
  enabled: boolean
  ranges: AvailabilityRange[]
}

/** One entry per day, in the same order as the `days` labels. */
export type AvailabilityWeek = AvailabilityDay[]

export function toMinutes(time: string) {
  const [h = 0, m = 0] = time.split(':').map(Number)
  return h * 60 + m
}

export function toTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatTime(minutes: number, hour12: boolean) {
  const h = Math.floor(minutes / 60)
  const m = String(minutes % 60).padStart(2, '0')
  if (!hour12)
    return `${String(h).padStart(2, '0')}:${m}`
  const suffix = h >= 12 && h < 24 ? 'pm' : 'am'
  return `${h % 12 || 12}:${m}${suffix}`
}

/** Valid minutes in a day's ranges (overlaps counted once). */
export function dayMinutes(day: AvailabilityDay) {
  if (!day.enabled)
    return 0
  const spans = day.ranges
    .map(r => [toMinutes(r.start), toMinutes(r.end)] as const)
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0])
  let total = 0
  let cursor = -1
  for (const [s, e] of spans) {
    const from = Math.max(s, cursor)
    if (e > from)
      total += e - from
    cursor = Math.max(cursor, e)
  }
  return total
}

/** Slot booleans for a day, `count` slots of `step` minutes starting at `origin`. */
export function rangesToSlots(day: AvailabilityDay, origin: number, step: number, count: number) {
  const slots = Array.from<boolean>({ length: count }).fill(false)
  if (!day.enabled)
    return slots
  for (const r of day.ranges) {
    const a = Math.max(0, Math.floor((toMinutes(r.start) - origin) / step))
    const b = Math.min(count, Math.ceil((toMinutes(r.end) - origin) / step))
    for (let i = a; i < b; i++) slots[i] = true
  }
  return slots
}

export function slotsToRanges(slots: boolean[], origin: number, step: number): AvailabilityRange[] {
  const ranges: AvailabilityRange[] = []
  let runStart = -1
  slots.forEach((on, i) => {
    if (on && runStart < 0)
      runStart = i
    if ((!on || i === slots.length - 1) && runStart >= 0) {
      const end = on ? i + 1 : i
      ranges.push({ start: toTime(origin + runStart * step), end: toTime(origin + end * step) })
      runStart = -1
    }
  })
  return ranges
}
