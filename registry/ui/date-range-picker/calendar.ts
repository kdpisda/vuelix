// Tiny calendar helpers built on native Date — no date library.
//
// Internally every date is a "day number": whole days since 1970-01-01 in the
// local calendar. Day numbers make range math (compare, add, diff) trivial and
// are immune to DST shifts, unlike millisecond timestamps.

export interface DateRange {
  start: Date | null
  end: Date | null
}

export interface DateRangePreset {
  label: string
  /** Called with today's date (local midnight). */
  range: (today: Date) => { start: Date, end: Date }
}

const MS_PER_DAY = 86_400_000

export function toDay(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY)
}

export function fromDay(day: number): Date {
  const utc = new Date(day * MS_PER_DAY)
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())
}

/** Month index since year 0 — easy to add / compare months. */
export function toMonth(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth()
}

export function monthStart(month: number): Date {
  return new Date(Math.floor(month / 12), month % 12, 1)
}

export function addMonthsClamped(day: number, months: number): number {
  const d = fromDay(day)
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), lastDay))
  return toDay(target)
}

/** Six week rows of day numbers (null = padding outside the month). */
export function monthGrid(month: number, weekStartsOn: number): (number | null)[][] {
  const first = monthStart(month)
  const firstDay = toDay(first)
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const lead = (first.getDay() - weekStartsOn + 7) % 7
  const rows: (number | null)[][] = []
  for (let r = 0; r < 6; r++) {
    const row: (number | null)[] = []
    for (let c = 0; c < 7; c++) {
      const n = r * 7 + c - lead
      row.push(n >= 0 && n < daysInMonth ? firstDay + n : null)
    }
    rows.push(row)
  }
  return rows
}

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export const defaultPresets: DateRangePreset[] = [
  { label: 'Today', range: t => ({ start: t, end: t }) },
  { label: 'Yesterday', range: (t) => {
    const d = fromDay(toDay(t) - 1)
    return { start: d, end: d }
  } },
  { label: 'Last 7 days', range: t => ({ start: fromDay(toDay(t) - 6), end: t }) },
  { label: 'Last 30 days', range: t => ({ start: fromDay(toDay(t) - 29), end: t }) },
  { label: 'This month', range: t => ({
    start: new Date(t.getFullYear(), t.getMonth(), 1),
    end: new Date(t.getFullYear(), t.getMonth() + 1, 0),
  }) },
  { label: 'Last month', range: t => ({
    start: new Date(t.getFullYear(), t.getMonth() - 1, 1),
    end: new Date(t.getFullYear(), t.getMonth(), 0),
  }) },
]
