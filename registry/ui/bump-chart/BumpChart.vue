<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { BumpChartSeries } from './types'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'
import { chartColor, ChartTooltip, useElementWidth, useTween } from '@/ui/chart-utils'

const props = withDefaults(defineProps<{
  /** Periods along the x-axis. */
  labels: string[]
  /** One entry per competitor; `ranks[i]` is its position (1 = top) in period `i`. */
  series: BumpChartSeries[]
  /** Height of one rank row in px. */
  rowHeight?: number
  /** Seconds for the draw-in animation. */
  duration?: number
  class?: HTMLAttributes['class']
}>(), {
  rowHeight: 40,
  duration: 1.2,
})

const DRAW_EASE = [0.65, 0, 0.35, 1] as const
const POP = { type: 'spring', stiffness: 500, damping: 24 } as const
const TOP = 28
const DOT = 10

const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const width = useElementWidth(root)

// Entrance delays apply only to the first reveal, never to later hover changes.
const revealed = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => (timer = setTimeout(() => (revealed.value = true), (props.duration + 0.6) * 1000)))
onBeforeUnmount(() => clearTimeout(timer))
const entrance = (k: number, i: number) => (revealed.value || reduced.value
  ? 0
  : k * 0.06 + (n.value > 1 ? i / (n.value - 1) : 0) * props.duration * 0.9)

const n = computed(() => props.labels.length)
const rows = computed(() => Math.max(1, ...props.series.flatMap(s => s.ranks)))
const height = computed(() => TOP + rows.value * props.rowHeight + 4)

// Ranks morph smoothly when the data changes.
const tween = useTween(() => props.series.flatMap(s =>
  Array.from({ length: n.value }, (_, i) => s.ranks[i] ?? rows.value)), { reduced })

const gutter = computed(() => Math.min(width.value * 0.22, Math.max(...props.series.map(s => s.name.length), 4) * 6.8 + DOT + 14))
const xAt = (i: number) => {
  const left = gutter.value
  const right = width.value - gutter.value
  return n.value > 1 ? left + (i / (n.value - 1)) * (right - left) : (left + right) / 2
}
const yAt = (rank: number) => TOP + (rank - 0.5) * props.rowHeight

const lines = computed(() => props.series.map((s, j) => {
  const points = Array.from({ length: n.value }, (_, i) => {
    const rank = tween.value[j * n.value + i] ?? rows.value
    return { x: xAt(i), y: yAt(rank), rank: s.ranks[i] ?? 0, i }
  })
  let d = points.length ? `M${points[0]!.x},${points[0]!.y}` : ''
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    const mid = (b.x - a.x) / 2
    d += `C${a.x + mid},${a.y} ${b.x - mid},${b.y} ${b.x},${b.y}`
  }
  return { name: s.name, color: s.color ?? chartColor(j), j, points, d }
}))

const periodLabels = computed(() => {
  const step = Math.max(1, Math.ceil(n.value / Math.max(1, Math.floor((width.value - gutter.value * 2) / 56) + 1)))
  return props.labels.map((text, i) => ({ text, i, x: xAt(i) })).filter(l => l.i % step === 0)
})

// --- interaction -------------------------------------------------------------------
const focusSeries = ref<number | null>(null)
const focusPeriod = ref<number | null>(null)
const dim = (j: number) => focusSeries.value !== null && focusSeries.value !== j

const tip = computed(() => {
  const j = focusSeries.value
  const i = focusPeriod.value
  if (j === null || i === null)
    return null
  const line = lines.value[j]
  const p = line?.points[i]
  if (!line || !p)
    return null
  const prev = i > 0 ? props.series[j]?.ranks[i - 1] : undefined
  const change = prev === undefined ? 0 : prev - p.rank
  return { x: p.x, y: p.y, name: line.name, color: line.color, rank: p.rank, period: props.labels[i], change }
})

function hoverDot(j: number, i: number) {
  focusSeries.value = j
  focusPeriod.value = i
}
function clear() {
  focusSeries.value = null
  focusPeriod.value = null
}

function onKey(event: KeyboardEvent) {
  const lastP = n.value - 1
  if (!props.series.length || lastP < 0)
    return
  let j = focusSeries.value
  let i = focusPeriod.value ?? lastP
  // Up / Down walk the ranking of the current period.
  const order = props.series.map((s, k) => ({ k, r: s.ranks[i] ?? Infinity })).sort((a, b) => a.r - b.r).map(o => o.k)
  const pos = j === null ? -1 : order.indexOf(j)
  switch (event.key) {
    case 'ArrowDown': j = order[Math.min(order.length - 1, pos + 1)]!; break
    case 'ArrowUp': j = order[Math.max(0, pos - 1)]!; break
    case 'ArrowRight': i = Math.min(lastP, i + 1); j ??= order[0]!; break
    case 'ArrowLeft': i = Math.max(0, i - 1); j ??= order[0]!; break
    case 'Home': i = 0; j ??= order[0]!; break
    case 'End': i = lastP; j ??= order[0]!; break
    case 'Escape': clear(); return
    default: return
  }
  event.preventDefault()
  focusSeries.value = j
  focusPeriod.value = i
}

const summary = computed(() => {
  const end = n.value - 1
  const leader = props.series.find(s => s.ranks[end] === 1)
  return `Bump chart of ${props.series.length} rankings over ${n.value} periods, ${props.labels[0] ?? ''} to ${props.labels[end] ?? ''}.${leader ? ` ${leader.name} finishes first.` : ''} Use arrow keys to explore.`
})
const announcement = computed(() => {
  const t = tip.value
  return t ? `${t.name}, ${t.period}: rank ${t.rank}${t.change ? `, ${t.change > 0 ? 'up' : 'down'} ${Math.abs(t.change)}` : ''}` : ''
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
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="summary"
      tabindex="0"
      class="block overflow-visible rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @keydown="onKey"
      @mousedown.prevent="focusChart"
      @blur="clear"
      @pointerleave="clear"
    >
      <!-- period columns -->
      <g class="text-muted-foreground" font-size="11">
        <line
          v-for="(_, i) in props.labels"
          :key="`g-${i}`"
          :x1="xAt(i)"
          :x2="xAt(i)"
          :y1="TOP - 6"
          :y2="height - 4"
          class="stroke-border"
          stroke-dasharray="2 4"
        />
        <text v-for="l in periodLabels" :key="l.i" :x="l.x" :y="12" text-anchor="middle" fill="currentColor">
          {{ l.text }}
        </text>
      </g>

      <!-- lines -->
      <g v-for="(l, k) in lines" :key="l.name">
        <motion.path
          :d="l.d"
          fill="none"
          :style="{ stroke: l.color }"
          stroke-width="3"
          stroke-linecap="round"
          class="pointer-events-none"
          :initial="reduced ? false : { pathLength: 0 }"
          :animate="{ pathLength: 1, opacity: dim(l.j) ? 0.12 : 1 }"
          :transition="{
            pathLength: { duration: props.duration, ease: DRAW_EASE, delay: k * 0.06 },
            opacity: { duration: 0.2 },
          }"
        />
        <!-- wide invisible stroke so thin lines are easy to hover -->
        <path
          :d="l.d"
          fill="none"
          stroke="transparent"
          stroke-width="14"
          @pointerenter="focusSeries = l.j"
          @pointerleave="focusPeriod === null && clear()"
        />
      </g>

      <!-- rank dots -->
      <g v-for="(l, k) in lines" :key="`dots-${l.name}`">
        <motion.g
          v-for="p in l.points"
          :key="p.i"
          :initial="reduced ? false : { opacity: 0, scale: 0.4 }"
          :animate="{ opacity: dim(l.j) ? 0.15 : 1, scale: focusSeries === l.j && focusPeriod === p.i ? 1.25 : 1 }"
          :transition="{
            opacity: { duration: 0.2, delay: entrance(k, p.i) },
            scale: { ...POP, delay: entrance(k, p.i) },
          }"
          class="cursor-pointer"
          @pointerenter="hoverDot(l.j, p.i)"
        >
          <circle :cx="p.x" :cy="p.y" :r="DOT" class="fill-background" :style="{ stroke: l.color }" stroke-width="2.5" />
          <text
            :x="p.x"
            :y="p.y"
            text-anchor="middle"
            dominant-baseline="central"
            font-size="10"
            class="pointer-events-none fill-foreground font-semibold tabular-nums"
          >{{ p.rank }}</text>
        </motion.g>
      </g>

      <!-- names at both ends -->
      <g font-size="12" class="font-medium">
        <template v-for="l in lines" :key="`n-${l.name}`">
          <motion.text
            v-for="side in (['start', 'end'] as const)"
            :key="side"
            :x="side === 'start' ? (l.points[0]?.x ?? 0) - DOT - 8 : (l.points.at(-1)?.x ?? 0) + DOT + 8"
            :y="side === 'start' ? l.points[0]?.y : l.points.at(-1)?.y"
            :text-anchor="side === 'start' ? 'end' : 'start'"
            dominant-baseline="central"
            class="cursor-default"
            :style="{ fill: l.color }"
            :initial="reduced ? false : { opacity: 0 }"
            :animate="{ opacity: dim(l.j) ? 0.2 : 1 }"
            :transition="{ duration: 0.3, delay: revealed || reduced ? 0 : side === 'start' ? 0.1 : props.duration }"
            @pointerenter="focusSeries = l.j; focusPeriod = null"
          >
            {{ l.name }}
          </motion.text>
        </template>
      </g>
    </svg>

    <ChartTooltip
      :open="tip !== null"
      :x="tip?.x ?? 0"
      :y="(tip?.y ?? 0) - DOT"
      :bounds="{ width, height }"
    >
      <div class="flex items-center gap-2">
        <span class="size-2 shrink-0 rounded-full" :style="{ background: tip?.color }" />
        <span class="font-medium">{{ tip?.name }}</span>
      </div>
      <div class="mt-1 flex items-baseline gap-3 text-muted-foreground">
        <span>{{ tip?.period }}</span>
        <span class="ml-auto font-medium tabular-nums text-foreground">#{{ tip?.rank }}</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            v-if="tip && tip.change !== 0"
            :key="tip.change"
            class="tabular-nums"
            :class="tip.change > 0 ? 'text-chart-1' : 'text-destructive'"
            :initial="{ opacity: 0, y: tip.change > 0 ? 4 : -4 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0 }"
          >
            {{ tip.change > 0 ? '▲' : '▼' }}{{ Math.abs(tip.change) }}
          </motion.span>
        </AnimatePresence>
      </div>
    </ChartTooltip>

    <p class="sr-only" aria-live="polite">
      {{ announcement }}
    </p>
    <table class="sr-only">
      <caption>{{ summary }}</caption>
      <thead>
        <tr>
          <th scope="col">
            Name
          </th>
          <th v-for="label in props.labels" :key="label" scope="col">
            {{ label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in props.series" :key="s.name">
          <th scope="row">
            {{ s.name }}
          </th>
          <td v-for="(r, i) in s.ranks" :key="i">
            {{ r }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
