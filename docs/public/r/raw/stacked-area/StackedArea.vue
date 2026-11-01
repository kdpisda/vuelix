<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { Band, StackedSeries } from './stack'
import { animate, AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { bandPath, edgePath, lerp, niceTicks, stack } from './stack'

const props = withDefaults(defineProps<{
  /** One label per period (x axis). */
  labels: string[]
  /** Series stacked bottom-up, each with one value per label. */
  series: StackedSeries[]
  /** Chart height in px (legend excluded). Width follows the container. */
  height?: number
  /** Smooth monotone curves instead of straight segments. */
  smooth?: boolean
  /** Show the interactive legend. */
  legend?: boolean
  locale?: string
  formatValue?: (value: number) => string
  class?: HTMLAttributes['class']
}>(), {
  height: 300,
  smooth: true,
  legend: true,
  locale: 'en-US',
})

/** `stacked` shows absolute values, `percent` normalises every period to 100%. */
const mode = defineModel<'stacked' | 'percent'>('mode', { default: 'stacked' })
/** Names of hidden series. */
const hidden = defineModel<string[]>('hidden', { default: () => [] })

const MORPH = { duration: 0.7, ease: [0.32, 0.72, 0, 1] } as const
const TIP = { type: 'spring', stiffness: 520, damping: 40, mass: 0.6 } as const

const LEFT = 46
const RIGHT = 10
const TOP = 10
const BOTTOM = 26

const root = ref<HTMLElement>()
const width = ref(640)
const prefersReduced = useReducedMotion()
// useReducedMotion() only settles after mount, so also read the media query directly: animations
// that start on mount get skipped too. Only transitions use it — `initial` must match the server render.
const reduce = computed(() => prefersReduced.value
  || (typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
const orInstant = <T>(t: T) => (reduce.value ? { duration: 0 } : t)

const colorOf = (s: StackedSeries, k: number) => s.color ?? `var(--chart-${(k % 5) + 1})`
const n = computed(() => props.labels.length)

const fmtValue = computed(() => {
  if (props.formatValue)
    return props.formatValue
  const f = new Intl.NumberFormat(props.locale, { notation: 'compact', maximumFractionDigits: 1 })
  return (v: number) => f.format(v)
})
const fmtPct = (v: number) => `${(v * 100).toFixed(v > 0 && v < 0.1 ? 1 : 0)}%`

// --- target layout + tween --------------------------------------------------------
const target = computed(() => {
  const s = stack(props.series, n.value, new Set(hidden.value), mode.value === 'percent')
  const nice = mode.value === 'percent' ? { ticks: [0, 0.25, 0.5, 0.75, 1], top: 1 } : niceTicks(s.max)
  return { ...s, ...nice }
})

// What's on screen, as fractions of the plot height (so a change of scale morphs smoothly too).
// Starts flat on the baseline and morphs to every new target.
const flat = (): Band[] => props.series.map(() => ({ y0: Array.from({ length: n.value }, () => 0), y1: Array.from({ length: n.value }, () => 0) }))
const shown = ref<Band[]>(flat())
let tween: { stop: () => void } | undefined

function morph() {
  tween?.stop()
  const { bands, top } = target.value
  const to = bands.map(b => ({ y0: b.y0.map(v => v / (top || 1)), y1: b.y1.map(v => v / (top || 1)) }))
  if (reduce.value) {
    shown.value = to
    return
  }
  const sameShape = shown.value.length === to.length && shown.value[0]?.y0.length === n.value
  const from = sameShape ? shown.value : flat()
  tween = animate(0, 1, {
    ...MORPH,
    onUpdate: (t: number) => {
      shown.value = to.map((b, k) => ({
        y0: b.y0.map((v, i) => lerp(from[k]!.y0[i]!, v, t)),
        y1: b.y1.map((v, i) => lerp(from[k]!.y1[i]!, v, t)),
      }))
    },
  })
}
const mounted = ref(false)
watch(target, () => mounted.value && morph())

// --- geometry ------------------------------------------------------------------------
const plotW = computed(() => Math.max(40, width.value - LEFT - RIGHT))
const bottom = computed(() => props.height - BOTTOM)
const x = (i: number) => LEFT + (n.value > 1 ? (i / (n.value - 1)) * plotW.value : plotW.value / 2)
/** Fraction of the plot height → px. */
const y = (f: number) => bottom.value - f * (bottom.value - TOP)

const layers = computed(() => props.series.map((s, k) => {
  const b = shown.value[k]
  const top: [number, number][] = b ? b.y1.map((v, i) => [x(i), y(v)]) : []
  const base: [number, number][] = b ? b.y0.map((v, i) => [x(i), y(v)]) : []
  return {
    name: s.name,
    color: colorOf(s, k),
    area: bandPath(top, base, props.smooth),
    edge: edgePath(top, props.smooth),
    visible: !hidden.value.includes(s.name),
  }
}))

// Ticks sit at their final positions and cross-fade when the scale changes.
const yTicks = computed(() => ({
  key: `${mode.value}:${target.value.top}`,
  ticks: target.value.ticks.map(v => ({
    v,
    y: y(v / (target.value.top || 1)),
    label: mode.value === 'percent' ? fmtPct(v) : fmtValue.value(v),
  })),
}))

const xTicks = computed(() => {
  const every = Math.max(1, Math.ceil((n.value * 56) / plotW.value))
  return props.labels
    .map((label, i) => ({ label, i, x: x(i) }))
    .filter(t => t.i % every === 0)
})

// --- hover / keyboard -----------------------------------------------------------------
const hoverIndex = ref<number | null>(null)
const focusSeries = ref<string | null>(null)

function onMove(e: PointerEvent) {
  const r = (e.currentTarget as Element).getBoundingClientRect()
  const px = e.clientX - r.left
  hoverIndex.value = Math.round(((px) / plotW.value) * (n.value - 1))
  hoverIndex.value = Math.max(0, Math.min(n.value - 1, hoverIndex.value))
}
function onKey(e: KeyboardEvent) {
  const step = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[e.key]
  if (e.key === 'Escape')
    hoverIndex.value = null
  if (step === undefined)
    return
  e.preventDefault()
  const from = hoverIndex.value ?? (step > 0 ? -1 : n.value)
  hoverIndex.value = Math.max(0, Math.min(n.value - 1, from + step))
}

const readout = computed(() => {
  const i = hoverIndex.value
  if (i === null)
    return null
  const totals = target.value.totals
  const rows = props.series
    .map((s, k) => ({ name: s.name, color: colorOf(s, k), value: s.values[i] ?? 0, k }))
    .filter(r => !hidden.value.includes(r.name))
    .reverse() // top of the stack first, like the chart
    .map(r => ({ ...r, share: totals[i] ? r.value / totals[i]! : 0 }))
  return { label: props.labels[i] ?? '', rows, total: totals[i] ?? 0 }
})

const dots = computed(() => {
  const i = hoverIndex.value
  if (i === null)
    return []
  return props.series
    .map((s, k) => ({ name: s.name, color: colorOf(s, k), cy: y(shown.value[k]?.y1[i] ?? 0) }))
    .filter(d => !hidden.value.includes(d.name))
})

const tip = computed(() => {
  const i = hoverIndex.value
  if (i === null)
    return null
  const px = x(i)
  const flipX = px > LEFT + plotW.value / 2
  return { x: px + (flipX ? -12 : 12), y: TOP, flipX }
})

// --- legend: click isolates a series (click again to show all), shift-click toggles --------
function onLegend(name: string, e: MouseEvent) {
  const all = props.series.map(s => s.name)
  if (e.shiftKey || e.metaKey || e.ctrlKey) {
    const next = hidden.value.includes(name) ? hidden.value.filter(h => h !== name) : [...hidden.value, name]
    hidden.value = next.length >= all.length ? [] : next
    return
  }
  const isolated = hidden.value.length === all.length - 1 && !hidden.value.includes(name)
  hidden.value = isolated ? [] : all.filter(a => a !== name)
}

const fillOpacity = (name: string) => (!focusSeries.value ? 0.32 : focusSeries.value === name ? 0.6 : 0.1)

const summary = computed(() => {
  const last = n.value - 1
  const totals = target.value.totals
  const shares = props.series
    .filter(s => !hidden.value.includes(s.name))
    .map(s => `${s.name} ${fmtPct(totals[last] ? (s.values[last] ?? 0) / totals[last]! : 0)}`)
  return `${mode.value === 'percent' ? '100% stacked' : 'Stacked'} area chart of ${props.series.length} series over ${n.value} periods (${props.labels[0]} to ${props.labels[last]}). Latest shares: ${shares.join(', ')}.`
})

let ro: ResizeObserver | undefined
onMounted(() => {
  mounted.value = true
  ro = new ResizeObserver(([entry]) => {
    if (entry)
      width.value = Math.max(260, Math.round(entry.contentRect.width))
  })
  ro.observe(root.value!)
  morph()
})
onBeforeUnmount(() => {
  ro?.disconnect()
  tween?.stop()
})
</script>

<template>
  <div :class="cn('w-full text-foreground', props.class)">
    <div
      ref="root"
      tabindex="0"
      class="relative rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @keydown="onKey"
      @blur="hoverIndex = null"
    >
      <svg
        :width="width"
        :height="props.height"
        :viewBox="`0 0 ${width} ${props.height}`"
        role="img"
        :aria-label="summary"
        class="block select-none overflow-visible"
      >
        <!-- grid + axes -->
        <g class="text-[11px] tabular-nums">
          <AnimatePresence :initial="false">
            <motion.g
              :key="yTicks.key"
              :initial="{ opacity: 0 }"
              :animate="{ opacity: 1 }"
              :exit="{ opacity: 0 }"
              :transition="orInstant({ duration: 0.35 })"
            >
              <g v-for="t in yTicks.ticks" :key="t.v">
                <line :x1="LEFT" :x2="LEFT + plotW" :y1="t.y" :y2="t.y" class="stroke-border" :stroke-dasharray="t.v === 0 ? undefined : '2 4'" />
                <text :x="LEFT - 8" :y="t.y" dy="0.32em" text-anchor="end" class="fill-muted-foreground">{{ t.label }}</text>
              </g>
            </motion.g>
          </AnimatePresence>
          <text
            v-for="t in xTicks"
            :key="t.i"
            :x="t.x"
            :y="bottom + 17"
            :text-anchor="t.i === 0 ? 'start' : t.i === n - 1 ? 'end' : 'middle'"
            class="fill-muted-foreground"
          >{{ t.label }}</text>
        </g>

        <!-- bands -->
        <g
          v-for="l in layers"
          :key="l.name"
          class="pointer-events-none"
        >
          <path :d="l.area" :style="{ fill: l.color, fillOpacity: fillOpacity(l.name) }" class="transition-[fill-opacity] duration-200" />
          <path
            :d="l.edge"
            fill="none"
            :style="{ stroke: l.color }"
            stroke-width="1.75"
            stroke-linejoin="round"
            :opacity="l.visible ? 1 : 0"
            class="transition-opacity duration-300"
          />
        </g>

        <!-- crosshair -->
        <g v-if="hoverIndex !== null" class="pointer-events-none">
          <line :x1="x(hoverIndex)" :x2="x(hoverIndex)" :y1="TOP" :y2="bottom" class="stroke-muted-foreground" stroke-dasharray="3 3" />
          <circle
            v-for="d in dots"
            :key="d.name"
            :cx="x(hoverIndex)"
            :cy="d.cy"
            r="3.5"
            class="stroke-background"
            stroke-width="2"
            :style="{ fill: d.color }"
          />
        </g>

        <rect
          :x="LEFT"
          :y="TOP"
          :width="plotW"
          :height="bottom - TOP"
          fill="transparent"
          class="cursor-crosshair"
          @pointermove="onMove"
          @pointerleave="hoverIndex = null"
        />
      </svg>

      <AnimatePresence>
        <motion.div
          v-if="tip && readout"
          key="tip"
          aria-hidden="true"
          class="pointer-events-none absolute left-0 top-0 z-10"
          :initial="{ opacity: 0, scale: 0.96, x: tip.x, y: tip.y }"
          :animate="{ opacity: 1, scale: 1, x: tip.x, y: tip.y }"
          :exit="{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }"
          :transition="reduce ? { duration: 0 } : TIP"
        >
          <div
            class="min-w-40 rounded-md border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md"
            :class="tip.flipX && '-translate-x-full'"
          >
            <div class="mb-1.5 font-medium">
              {{ readout.label }}
            </div>
            <div v-for="r in readout.rows" :key="r.name" class="flex items-center gap-2 py-0.5 tabular-nums">
              <span class="size-2 shrink-0 rounded-sm" :style="{ background: r.color }" />
              <span class="mr-auto text-muted-foreground">{{ r.name }}</span>
              <span class="font-medium">{{ fmtValue(r.value) }}</span>
              <span class="w-10 text-right text-muted-foreground">{{ fmtPct(r.share) }}</span>
            </div>
            <div class="mt-1 flex justify-between border-t pt-1 tabular-nums">
              <span class="text-muted-foreground">Total</span>
              <span class="font-semibold">{{ fmtValue(readout.total) }}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>

    <div v-if="props.legend" class="mt-3 flex flex-wrap items-center justify-center gap-1" role="group" aria-label="Series">
      <button
        v-for="(s, k) in props.series"
        :key="s.name"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs outline-none transition-[color,background-color,opacity] hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
        :class="hidden.includes(s.name) ? 'text-muted-foreground opacity-60' : 'text-foreground'"
        :aria-pressed="!hidden.includes(s.name)"
        :title="`Click to isolate ${s.name} · Shift-click to toggle`"
        @click="onLegend(s.name, $event)"
        @pointerenter="focusSeries = hidden.includes(s.name) ? null : s.name"
        @pointerleave="focusSeries = null"
        @focus="focusSeries = hidden.includes(s.name) ? null : s.name"
        @blur="focusSeries = null"
      >
        <span
          class="size-2.5 rounded-sm transition-transform"
          :class="hidden.includes(s.name) && 'scale-75'"
          :style="{ background: hidden.includes(s.name) ? 'transparent' : colorOf(s, k), boxShadow: `inset 0 0 0 1.5px ${colorOf(s, k)}` }"
        />
        {{ s.name }}
      </button>
    </div>
  </div>
</template>
