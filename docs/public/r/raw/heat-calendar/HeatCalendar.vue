<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { HeatCalendarDay, HeatCalendarRange } from './types'
import { motion, useReducedMotion } from 'motion-v'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { chartColor, ChartTooltip, clamp, useElementWidth } from '@/components/ui/chart-utils'

const props = withDefaults(defineProps<{
  /** One entry per day with activity (`YYYY-MM-DD`). Missing days count as 0. */
  data: HeatCalendarDay[]
  /** First day shown (`YYYY-MM-DD`). Defaults to 52 weeks before `end`. */
  start?: string
  /** Last day shown. Defaults to the latest date in `data`. */
  end?: string
  /** 0 = weeks start on Sunday, 1 = Monday. */
  weekStart?: 0 | 1
  /** Number of intensity steps, including the empty one. */
  levels?: number
  /** Cell colour. Defaults to `--chart-1`; intensity is applied as opacity. */
  color?: string
  /** Largest cell size in px; cells shrink to fit the width. */
  cellSize?: number
  /** Noun used in the tooltip and summary, e.g. "commits". */
  unit?: string
  /** Allow drag (or Shift + arrows) to select a date range. */
  selectable?: boolean
  class?: HTMLAttributes['class']
}>(), {
  weekStart: 0,
  levels: 5,
  cellSize: 14,
  unit: 'events',
  selectable: true,
})

const emit = defineEmits<{
  /** Fired when a drag or keyboard selection is committed. */
  select: [range: HeatCalendarRange]
}>()

const DAY = 86_400_000
const LEFT = 30
const TOP = 20

const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const width = useElementWidth(root)
const fill = computed(() => props.color ?? chartColor(0))

const toMs = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y!, (m ?? 1) - 1, d ?? 1)
}
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const longDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
const monthName = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' })
const number = new Intl.NumberFormat('en-US')
/** "1 contribution", "3 contributions". */
const count = (n: number) => `${number.format(n)} ${n === 1 ? props.unit.replace(/s$/, '') : props.unit}`

const byDate = computed(() => {
  const map = new Map<string, number>()
  for (const d of props.data)
    map.set(d.date, (map.get(d.date) ?? 0) + d.value)
  return map
})

const range = computed(() => {
  const dates = props.data.map(d => toMs(d.date))
  const end = props.end ? toMs(props.end) : dates.length ? Math.max(...dates) : Date.UTC(2026, 0, 1)
  const start = props.start ? toMs(props.start) : end - 364 * DAY
  return { start: Math.min(start, end), end }
})

const max = computed(() => Math.max(1, ...byDate.value.values()))
const levelOf = (v: number) => (v <= 0 ? 0 : Math.max(1, Math.ceil((v / max.value) * (props.levels - 1))))
const opacityOf = (level: number) => (level === 0 ? 1 : 0.22 + (0.78 * level) / (props.levels - 1))

// Days laid out week by week: column = week, row = weekday.
const offset = computed(() => (new Date(range.value.start).getUTCDay() - props.weekStart + 7) % 7)
const days = computed(() => {
  const out: { iso: string, ms: number, value: number, level: number, col: number, row: number, index: number }[] = []
  for (let ms = range.value.start, i = 0; ms <= range.value.end; ms += DAY, i++) {
    const iso = toIso(ms)
    const value = byDate.value.get(iso) ?? 0
    const slot = i + offset.value
    out.push({ iso, ms, value, level: levelOf(value), col: Math.floor(slot / 7), row: slot % 7, index: i })
  }
  return out
})
const weeks = computed(() => Math.max(1, (days.value.at(-1)?.col ?? 0) + 1))

const gap = computed(() => (width.value / weeks.value > 13 ? 3 : 2))
const cell = computed(() => clamp((width.value - LEFT - (weeks.value - 1) * gap.value) / weeks.value, 4, props.cellSize))
const pitch = computed(() => cell.value + gap.value)
const svgW = computed(() => LEFT + weeks.value * pitch.value - gap.value)
const svgH = computed(() => TOP + 7 * pitch.value - gap.value)

const columns = computed(() => {
  const cols: (typeof days.value)[] = Array.from({ length: weeks.value }, () => [])
  for (const d of days.value)
    cols[d.col]!.push(d)
  return cols
})

const months = computed(() => {
  const labels: { col: number, text: string }[] = []
  let last = -10
  for (const d of days.value) {
    const firstOfMonth = new Date(d.ms).getUTCDate() === 1 || d.index === 0
    if (!firstOfMonth)
      continue
    // Skip a label if it would crowd the previous one (e.g. a range starting late in a month).
    const col = d.row === 0 || d.index === 0 ? d.col : d.col + 1
    if (col - last >= 3 && col < weeks.value) {
      labels.push({ col, text: monthName.format(d.ms) })
      last = col
    }
  }
  return labels
})
const weekdays = computed(() => {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return [1, 3, 5].map(row => ({ row, text: names[(row + props.weekStart) % 7]! }))
})

// --- hover, keyboard, selection -------------------------------------------------
const active = ref<number | null>(null)
const anchor = ref<number | null>(null)
const focus = ref<number | null>(null)
const dragging = ref(false)

const selection = computed(() => {
  if (anchor.value === null || focus.value === null)
    return null
  return { from: Math.min(anchor.value, focus.value), to: Math.max(anchor.value, focus.value) }
})
const isSelected = (i: number) => !!selection.value && i >= selection.value.from && i <= selection.value.to

function rangeInfo(): HeatCalendarRange | null {
  const s = selection.value
  if (!s)
    return null
  const list = days.value.slice(s.from, s.to + 1)
  return {
    start: list[0]!.iso,
    end: list.at(-1)!.iso,
    days: list.length,
    total: list.reduce((sum, d) => sum + d.value, 0),
  }
}
const selected = computed(rangeInfo)

function indexAt(event: PointerEvent) {
  const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect()
  const col = Math.floor((event.clientX - rect.left - LEFT + gap.value / 2) / pitch.value)
  const row = Math.floor((event.clientY - rect.top - TOP + gap.value / 2) / pitch.value)
  if (col < 0 || row < 0 || row > 6 || col >= weeks.value)
    return null
  const i = col * 7 + row - offset.value
  return i >= 0 && i < days.value.length ? i : null
}

function onDown(event: PointerEvent) {
  const i = indexAt(event)
  if (i === null || !props.selectable)
    return
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
  dragging.value = true
  anchor.value = i
  focus.value = i
  active.value = i
}
function onMove(event: PointerEvent) {
  const i = indexAt(event)
  if (i === null)
    return
  active.value = i
  if (dragging.value)
    focus.value = i
}
function onUp() {
  if (!dragging.value)
    return
  dragging.value = false
  const info = rangeInfo()
  if (info)
    emit('select', info)
}
function clearSelection() {
  anchor.value = null
  focus.value = null
}

function onKey(event: KeyboardEvent) {
  const step: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }
  const last = days.value.length - 1
  if (event.key in step) {
    event.preventDefault()
    const cur = active.value ?? last
    const next = clamp(cur + step[event.key]!, 0, last)
    if (event.shiftKey && props.selectable) {
      if (anchor.value === null)
        anchor.value = cur
      focus.value = next
    }
    active.value = next
  }
  else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    active.value = event.key === 'Home' ? 0 : last
  }
  else if ((event.key === 'Enter' || event.key === ' ') && props.selectable && active.value !== null) {
    event.preventDefault()
    if (anchor.value === null) {
      anchor.value = active.value
      focus.value = active.value
    }
    const info = rangeInfo()
    if (info)
      emit('select', info)
  }
  else if (event.key === 'Escape') {
    clearSelection()
    active.value = null
  }
}

const current = computed(() => (active.value === null ? null : days.value[active.value] ?? null))
const cellX = (col: number) => LEFT + col * pitch.value
const cellY = (row: number) => TOP + row * pitch.value

const total = computed(() => days.value.reduce((s, d) => s + d.value, 0))
const summary = computed(() => {
  const first = days.value[0]
  const last = days.value.at(-1)
  const busiest = days.value.reduce((a, b) => (b.value > a.value ? b : a), days.value[0]!)
  return `Activity calendar from ${first ? longDate.format(first.ms) : ''} to ${last ? longDate.format(last.ms) : ''}: ${count(total.value)}, busiest day ${busiest ? longDate.format(busiest.ms) : ''}. Arrow keys move between days${props.selectable ? ', Shift + arrows selects a range, Enter confirms' : ''}.`
})
const announcement = computed(() => {
  const s = selected.value
  if (s && s.days > 1)
    return `Selected ${s.days} days, ${count(s.total)}`
  const d = current.value
  return d ? `${count(d.value)} on ${longDate.format(d.ms)}` : ''
})

// Motion elements carry focus listeners, which makes Chrome focus the clicked
// SVG child. Keep focus on the chart itself instead.
function focusChart(event: MouseEvent) {
  (event.currentTarget as SVGElement).focus({ preventScroll: true })
}
</script>

<template>
  <div ref="root" :class="cn('relative w-full select-none', props.class)">
    <svg
      :width="svgW"
      :height="svgH"
      :viewBox="`0 0 ${svgW} ${svgH}`"
      role="img"
      :aria-label="summary"
      tabindex="0"
      class="block max-w-full touch-none overflow-visible rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @keydown="onKey"
      @mousedown.prevent="focusChart"
      @blur="active = null"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="dragging || (active = null)"
    >
      <g class="fill-muted-foreground" font-size="10">
        <text v-for="m in months" :key="`${m.col}-${m.text}`" :x="cellX(m.col)" :y="TOP - 7">{{ m.text }}</text>
        <text
          v-for="w in weekdays"
          :key="w.row"
          :x="0"
          :y="cellY(w.row) + cell / 2"
          dominant-baseline="central"
        >{{ w.text }}</text>
      </g>

      <motion.g
        v-for="(col, c) in columns"
        :key="c"
        :initial="reduced ? false : { opacity: 0, y: -4 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.35, delay: c * 0.012, ease: [0.22, 1, 0.36, 1] }"
      >
        <rect
          v-for="d in col"
          :key="d.iso"
          :x="cellX(d.col)"
          :y="cellY(d.row)"
          :width="cell"
          :height="cell"
          :rx="Math.max(1.5, cell * 0.22)"
          :class="[
            d.level === 0 ? 'fill-muted' : '',
            active === d.index || (selected?.days === 1 && isSelected(d.index)) ? 'stroke-foreground' : 'stroke-transparent',
          ]"
          :style="{
            fill: d.level === 0 ? undefined : fill,
            fillOpacity: opacityOf(d.level),
            opacity: selection && selection.to > selection.from && !isSelected(d.index) ? 0.35 : 1,
            transition: 'opacity 200ms, fill-opacity 400ms, stroke 150ms',
          }"
          stroke-width="1.25"
        />
      </motion.g>
    </svg>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <div class="flex min-h-6 items-center gap-2">
        <template v-if="selected && selected.days > 1">
          <span>
            <span class="font-medium text-foreground">{{ shortDate.format(toMs(selected.start)) }} – {{ shortDate.format(toMs(selected.end)) }}</span>
            · {{ count(selected.total) }} in {{ selected.days }} days
          </span>
          <button
            type="button"
            class="rounded-md px-1.5 py-0.5 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="clearSelection"
          >
            Clear
          </button>
        </template>
        <span v-else>{{ count(total) }}</span>
      </div>
      <div class="flex items-center gap-1" aria-hidden="true">
        <span class="mr-1">Less</span>
        <svg v-for="l in props.levels" :key="l" width="11" height="11" class="block">
          <rect
            width="11"
            height="11"
            rx="2.5"
            :class="l === 1 ? 'fill-muted' : ''"
            :style="{ fill: l === 1 ? undefined : fill, fillOpacity: opacityOf(l - 1) }"
          />
        </svg>
        <span class="ml-1">More</span>
      </div>
    </div>

    <ChartTooltip
      :open="current !== null && !dragging"
      :x="current ? cellX(current.col) + cell / 2 : 0"
      :y="current ? cellY(current.row) : 0"
      :bounds="{ width, height: svgH }"
      :offset="8"
    >
      <span class="font-medium tabular-nums">{{ count(current?.value ?? 0) }}</span>
      <span class="text-muted-foreground"> · {{ current ? longDate.format(current.ms) : '' }}</span>
    </ChartTooltip>

    <p class="sr-only" aria-live="polite">
      {{ announcement }}
    </p>
  </div>
</template>
