<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { YearReturns } from './returns'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { compound, mean, signed } from './returns'

const props = withDefaults(defineProps<{
  /** One entry per year with twelve monthly returns in percent. Shown newest first. */
  data: YearReturns[]
  /** |return| (in %) at which a month reaches full colour. Defaults to the largest month in view. */
  scale?: number
  /** Add a row with each month's average across years. */
  average?: boolean
  /** Decimals in the cells (the tooltip shows one more). */
  precision?: number
  monthLabels?: string[]
  class?: HTMLAttributes['class']
}>(), {
  average: true,
  precision: 1,
  monthLabels: () => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
})

const STAGGER = 0.016 // seconds per diagonal step
const POP = { type: 'spring', stiffness: 420, damping: 28 } as const
const TIP = { type: 'spring', stiffness: 520, damping: 40, mass: 0.6 } as const

const UP_INK = 'text-[color-mix(in_oklab,var(--chart-1)_65%,var(--foreground))]'
const DOWN_INK = 'text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]'

const root = ref<HTMLElement>()
const prefersReduced = useReducedMotion()
// useReducedMotion() only settles after mount, so also read the media query directly: animations
// that start on mount get skipped too. Only transitions use it — `initial` must match the server render.
const reduce = computed(() => prefersReduced.value
  || (typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
const orInstant = <T>(t: T) => (reduce.value ? { duration: 0 } : t)

const years = computed(() => [...props.data].sort((a, b) => b.year - a.year))

interface Cell {
  r: number
  c: number
  value: number | null
  kind: 'month' | 'year' | 'average'
  label: string
}

const rows = computed(() => {
  const out: { header: string, cells: Cell[] }[] = years.value.map((y, r) => ({
    header: String(y.year),
    cells: [
      ...Array.from({ length: 12 }, (_, c) => ({ r, c, value: y.months[c] ?? null, kind: 'month' as const, label: `${props.monthLabels[c]} ${y.year}` })),
      { r, c: 12, value: compound(y.months), kind: 'year' as const, label: `${y.year}` },
    ],
  }))
  if (props.average && years.value.length > 1) {
    const r = out.length
    const averages = Array.from({ length: 12 }, (_, c) => mean(years.value.map(y => y.months[c])))
    out.push({
      header: 'Avg',
      cells: [
        ...averages.map((value, c) => ({ r, c, value, kind: 'average' as const, label: `Average ${props.monthLabels[c]}` })),
        { r, c: 12, value: mean(years.value.map(y => compound(y.months))), kind: 'average' as const, label: 'Average year' },
      ],
    })
  }
  return out
})

const monthScale = computed(() => props.scale ?? Math.max(1, ...years.value.flatMap(y => y.months.map(v => Math.abs(v ?? 0)))))
const yearScale = computed(() => Math.max(1, ...years.value.map(y => Math.abs(compound(y.months) ?? 0))))

function tint(cell: Cell) {
  if (cell.value === null)
    return undefined
  const scale = cell.c === 12 ? yearScale.value : monthScale.value
  const k = Math.min(1, Math.abs(cell.value) / scale)
  const pct = Math.round((cell.kind === 'average' ? 6 : 10) + (cell.kind === 'average' ? 30 : 48) * k)
  return `color-mix(in oklab, var(${cell.value >= 0 ? '--chart-1' : '--destructive'}) ${pct}%, transparent)`
}

const fmt = (v: number | null, digits = props.precision) => (v === null ? '·' : signed(v, digits))

// --- tooltip / focus -------------------------------------------------------------------
const focus = ref({ r: 0, c: 0 })
const active = ref<{ cell: Cell, x: number, top: number, bottom: number } | null>(null)

function show(cell: Cell, e: Event) {
  const el = e.currentTarget as HTMLElement
  const a = el.getBoundingClientRect()
  const b = root.value!.getBoundingClientRect()
  active.value = { cell, x: a.left - b.left + a.width / 2, top: a.top - b.top, bottom: a.bottom - b.top }
}

const tip = computed(() => {
  const a = active.value
  if (!a)
    return null
  const w = root.value?.clientWidth ?? 600
  const below = a.cell.r === 0
  const align = a.x < 90 ? 'start' : a.x > w - 90 ? 'end' : 'center'
  return { x: a.x + (align === 'start' ? -14 : align === 'end' ? 14 : 0), y: below ? a.bottom + 6 : a.top - 6, below, align }
})

const detail = computed(() => {
  const a = active.value
  if (!a)
    return null
  const { cell } = a
  const value = cell.value === null ? 'No data' : signed(cell.value, props.precision + 1, '%')
  let note = ''
  if (cell.kind === 'month' && cell.value !== null) {
    const months = years.value[cell.r]!.months
    const ytd = compound(months.slice(0, cell.c + 1))
    const known = months.filter((v): v is number => v !== null)
    const rank = cell.value === Math.max(...known) ? ' · best month' : cell.value === Math.min(...known) ? ' · worst month' : ''
    note = `YTD ${signed(ytd ?? 0, props.precision + 1, '%')}${rank}`
  }
  else if (cell.kind === 'year') {
    const months = years.value[cell.r]!.months.filter((v): v is number => v !== null)
    note = `${months.filter(v => v > 0).length} up · ${months.filter(v => v < 0).length} down months`
  }
  else if (cell.kind === 'average' && cell.c < 12) {
    const all = years.value.map(y => y.months[cell.c]).filter((v): v is number => v !== null && v !== undefined)
    note = `Positive in ${all.filter(v => v > 0).length} of ${all.length} years`
  }
  return { title: cell.kind === 'year' ? `${cell.label} · compounded` : cell.label, value, note, up: (cell.value ?? 0) >= 0, empty: cell.value === null }
})

function onKey(e: KeyboardEvent) {
  const lastRow = rows.value.length - 1
  const move: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }
  let { r, c } = focus.value
  if (move[e.key]) {
    r = Math.max(0, Math.min(lastRow, r + move[e.key]![0]))
    c = Math.max(0, Math.min(12, c + move[e.key]![1]))
  }
  else if (e.key === 'Home') {
    c = 0
  }
  else if (e.key === 'End') {
    c = 12
  }
  else if (e.key === 'Escape') {
    active.value = null
    return
  }
  else {
    return
  }
  e.preventDefault()
  focus.value = { r, c }
  nextTick(() => root.value?.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`)?.focus())
}

// Replay the stagger when the data changes.
const version = ref(0)
watch(() => props.data, () => {
  version.value++
  active.value = null
}, { deep: true })

const summary = computed(() => {
  const ys = years.value
  if (!ys.length)
    return 'Monthly returns: no data'
  let best = { v: -Infinity, label: '' }
  let worst = { v: Infinity, label: '' }
  for (const y of ys) {
    y.months.forEach((v, c) => {
      if (v === null || v === undefined)
        return
      if (v > best.v)
        best = { v, label: `${props.monthLabels[c]} ${y.year}` }
      if (v < worst.v)
        worst = { v, label: `${props.monthLabels[c]} ${y.year}` }
    })
  }
  const totals = ys.map(y => `${y.year} ${signed(compound(y.months) ?? 0, 1, '%')}`)
  return `Monthly returns ${ys.at(-1)!.year}–${ys[0]!.year}. Best month ${best.label} ${signed(best.v, 1, '%')}, worst ${worst.label} ${signed(worst.v, 1, '%')}. Yearly: ${totals.join(', ')}.`
})
</script>

<template>
  <div ref="root" :class="cn('relative w-full text-foreground', props.class)">
    <div class="overflow-x-auto pb-1" @scroll="active = null">
      <div
        :key="version"
        role="grid"
        :aria-label="summary"
        class="grid min-w-[30rem] gap-[3px] text-[11px] tabular-nums"
        :style="{ gridTemplateColumns: 'auto repeat(12, minmax(0, 1fr)) minmax(3.25rem, auto)' }"
        @keydown="onKey"
        @pointerleave="active = null"
      >
        <div role="row" class="contents">
          <div role="columnheader" class="pr-1"><span class="sr-only">Year</span></div>
          <div v-for="m in props.monthLabels" :key="m" role="columnheader" class="pb-0.5 text-center font-medium text-muted-foreground">
            {{ m }}
          </div>
          <div role="columnheader" class="pb-0.5 text-center font-medium text-muted-foreground">
            Year
          </div>
        </div>

        <div v-for="row in rows" :key="row.header" role="row" class="contents">
          <div role="rowheader" class="flex items-center pr-1.5 font-medium text-muted-foreground">
            {{ row.header }}
          </div>
          <motion.div
            v-for="cell in row.cells"
            :key="cell.c"
            role="gridcell"
            :data-cell="`${cell.r}-${cell.c}`"
            :tabindex="focus.r === cell.r && focus.c === cell.c ? 0 : -1"
            :aria-label="`${cell.label}: ${cell.value === null ? 'no data' : signed(cell.value, props.precision + 1, '%')}`"
            class="flex h-8 items-center justify-center rounded-md outline-none transition-shadow hover:ring-1 hover:ring-foreground/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :class="[
              cell.value === null && 'text-muted-foreground',
              cell.c === 12 && 'ml-1 font-semibold',
              cell.kind === 'average' && 'mt-1 text-muted-foreground',
            ]"
            :style="{ background: tint(cell) ?? (cell.value === null ? undefined : 'var(--muted)') }"
            :initial="{ opacity: 0, scale: 0.6 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="orInstant({ ...POP, delay: (cell.r + cell.c) * STAGGER })"
            @pointerenter="show(cell, $event)"
            @focus="focus = { r: cell.r, c: cell.c }; show(cell, $event)"
            @blur="active = null"
          >
            {{ fmt(cell.value) }}
          </motion.div>
        </div>
      </div>
    </div>

    <AnimatePresence>
      <motion.div
        v-if="tip && detail"
        key="tip"
        aria-hidden="true"
        class="pointer-events-none absolute left-0 top-0 z-10"
        :initial="{ opacity: 0, scale: 0.96, x: tip.x, y: tip.y }"
        :animate="{ opacity: 1, scale: 1, x: tip.x, y: tip.y }"
        :exit="{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }"
        :transition="reduce ? { duration: 0 } : TIP"
      >
        <div
          class="whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          :class="[
            !tip.below && '-translate-y-full',
            tip.align === 'center' && '-translate-x-1/2',
            tip.align === 'end' && '-translate-x-full',
          ]"
        >
          <div class="text-muted-foreground">
            {{ detail.title }}
          </div>
          <div class="text-sm font-semibold tabular-nums" :class="detail.empty ? 'text-muted-foreground' : detail.up ? UP_INK : DOWN_INK">
            {{ detail.value }}
          </div>
          <div v-if="detail.note" class="text-muted-foreground tabular-nums">
            {{ detail.note }}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
