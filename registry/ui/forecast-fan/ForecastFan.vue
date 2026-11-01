<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ForecastTargets } from './fan'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import { lerp, monotonePath, niceTicks, separate } from './fan'

const props = withDefaults(defineProps<{
  /** Price history, oldest first. Its last value is "now", where the fan starts. */
  history: number[]
  /** Where the forecast ends up at the horizon. */
  forecast: ForecastTargets
  /** Steps into the future the forecast covers (same spacing as the history). */
  horizon?: number
  /** Labels for the history points (dates), same length as `history`. */
  labels?: string[]
  /** Labels for the future steps, `horizon` long. */
  futureLabels?: string[]
  /** Names shown at the three target ends. */
  targetNames?: Partial<Record<keyof ForecastTargets, string>>
  /** Label on the divider between history and forecast. */
  nowLabel?: string
  /** Chart height in px. Width follows the container. */
  height?: number
  /** Decimals for prices. */
  precision?: number
  locale?: string
  class?: HTMLAttributes['class']
}>(), {
  nowLabel: 'Now',
  height: 320,
  precision: 2,
  locale: 'en-US',
})

const DRAW = { duration: 1, ease: [0.65, 0, 0.35, 1] } as const
const FAN_AT = 0.85 // seconds: the fan opens once the history has drawn
const TIP = { type: 'spring', stiffness: 520, damping: 40, mass: 0.6 } as const

const UP_INK = 'text-[color-mix(in_oklab,var(--chart-1)_65%,var(--foreground))]'
const DOWN_INK = 'text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]'

const LEFT = 48
const TOP = 14
const BOTTOM = 24

const uid = `vx-fan-${useId()}`
const root = ref<HTMLElement>()
const width = ref(640)
const prefersReduced = useReducedMotion()
// useReducedMotion() only settles after mount, so also read the media query directly: animations
// that start on mount get skipped too. Only transitions use it — `initial` must match the server render.
const reduce = computed(() => prefersReduced.value
  || (typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
const orInstant = <T>(t: T) => (reduce.value ? { duration: 0 } : t)

const fmt = computed(() => {
  const f = new Intl.NumberFormat(props.locale, { minimumFractionDigits: props.precision, maximumFractionDigits: props.precision })
  return (v: number) => f.format(v)
})
const pct = (v: number) => {
  const r = Number((v * 100).toFixed(1)) || 0 // round first: no "−0.0%"
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r).toFixed(1)}%`
}

const n = computed(() => props.history.length)
const last = computed(() => props.history.at(-1) ?? 0)
const horizon = computed(() => Math.max(1, props.horizon ?? Math.round(n.value * 0.4)))
const total = computed(() => Math.max(1, n.value - 1 + horizon.value))

// Narrow charts drop the target names to keep the plot wide enough.
const compact = computed(() => width.value < 480)
const right = computed(() => (compact.value ? 78 : 128))
const plotW = computed(() => Math.max(60, width.value - LEFT - right.value))
const bottom = computed(() => props.height - BOTTOM)

const domain = computed(() => {
  const { low, high } = props.forecast
  const lo = Math.min(...props.history, low, high)
  const hi = Math.max(...props.history, low, high)
  const pad = (hi - lo) * 0.07 || 1
  return { lo: lo - pad, hi: hi + pad }
})
const x = (t: number) => LEFT + (t / total.value) * plotW.value
const y = (v: number) => bottom.value - ((v - domain.value.lo) / (domain.value.hi - domain.value.lo)) * (bottom.value - TOP)

const xNow = computed(() => x(n.value - 1))
const xEnd = computed(() => x(total.value))
const yNow = computed(() => y(last.value))

const line = computed(() => monotonePath(props.history.map((v, i) => [x(i), y(v)])))

const targets = computed(() => {
  const f = props.forecast
  const names = { high: 'High', median: 'Median', low: 'Low', ...props.targetNames }
  const keys = ['high', 'median', 'low'] as const
  const ys = separate(keys.map(k => y(f[k])), 30, TOP + 10, bottom.value - 12)
  return keys.map((k, i) => ({
    key: k,
    name: names[k],
    value: f[k],
    change: (f[k] - last.value) / (last.value || 1),
    y: y(f[k]),
    labelY: ys[i]!,
    stroke: k === 'high' ? 'stroke-chart-1' : k === 'low' ? 'stroke-destructive' : 'stroke-foreground/70',
    fill: k === 'high' ? 'fill-chart-1' : k === 'low' ? 'fill-destructive' : 'fill-foreground',
  }))
})

const cone = (a: number, b: number) => `M${xNow.value},${yNow.value} L${xEnd.value},${y(a)} L${xEnd.value},${y(b)} Z`
const outer = computed(() => cone(props.forecast.high, props.forecast.low))
const inner = computed(() => {
  const { low, median, high } = props.forecast
  return cone((median + high) / 2, (median + low) / 2)
})

const yTicks = computed(() => {
  const count = Math.max(3, Math.floor((bottom.value - TOP) / 50))
  return niceTicks(domain.value.lo, domain.value.hi, count)
    .map(v => ({ v, y: y(v) }))
    .filter(t => t.y > TOP && t.y < bottom.value - 2)
})

const xTicks = computed(() => {
  const out: { key: string, x: number, label: string, anchor: 'start' | 'middle' | 'end' }[] = []
  const labels = props.labels
  if (labels?.length) {
    const room = xNow.value - LEFT
    const count = Math.max(1, Math.floor(room / 90))
    for (let k = 0; k < count; k++) {
      const i = Math.round((k / count) * (n.value - 1))
      out.push({ key: `h${i}`, x: x(i), label: labels[i] ?? '', anchor: k === 0 ? 'start' : 'middle' })
    }
  }
  const end = props.futureLabels?.at(-1)
  if (end)
    out.push({ key: 'end', x: xEnd.value, label: end, anchor: 'end' })
  return out
})

// Replay the draw-in when the data changes (not on resize).
const version = ref(0)
watch(() => [props.history, props.forecast, props.horizon], () => version.value++, { deep: true })

// --- scrubbing ----------------------------------------------------------------------------
const scrub = ref<number | null>(null)
function onMove(e: PointerEvent) {
  const r = (e.currentTarget as Element).getBoundingClientRect()
  const t = Math.round(((e.clientX - r.left) / plotW.value) * total.value)
  scrub.value = Math.max(0, Math.min(total.value, t))
}
function onKey(e: KeyboardEvent) {
  const step = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[e.key]
  if (e.key === 'Escape')
    scrub.value = null
  if (step === undefined)
    return
  e.preventDefault()
  scrub.value = Math.max(0, Math.min(total.value, (scrub.value ?? n.value - 1) + step))
}

const readout = computed(() => {
  const t = scrub.value
  if (t === null)
    return null
  if (t <= n.value - 1) {
    const v = props.history[t]!
    return {
      kind: 'history' as const,
      title: t === n.value - 1 ? props.nowLabel : props.labels?.[t] ?? `${t - (n.value - 1)}`,
      value: v,
      change: (last.value - v) / (v || 1),
      dots: [{ key: 'h', y: y(v), fill: 'fill-foreground' }],
    }
  }
  const k = t - (n.value - 1)
  const p = k / horizon.value
  const rows = targets.value.map(tg => ({ ...tg, at: lerp(last.value, tg.value, p) }))
  return {
    kind: 'forecast' as const,
    title: props.futureLabels?.[k - 1] ?? `+${k}`,
    rows: rows.map(r => ({ ...r, change: (r.at - last.value) / (last.value || 1) })),
    dots: rows.map(r => ({ key: r.key, y: y(r.at), fill: r.fill })),
  }
})

const tip = computed(() => {
  if (scrub.value === null)
    return null
  const px = x(scrub.value)
  const flipX = px > LEFT + (plotW.value + right.value) / 2
  return { x: px + (flipX ? -12 : 12), y: TOP, flipX }
})

const summary = computed(() => {
  const f = props.forecast
  return `Price history of ${n.value} points ending at ${fmt.value(last.value)}, with a forecast over ${horizon.value} periods: median ${fmt.value(f.median)} (${pct((f.median - last.value) / last.value)}), range ${fmt.value(f.low)} (${pct((f.low - last.value) / last.value)}) to ${fmt.value(f.high)} (${pct((f.high - last.value) / last.value)}).`
})

let ro: ResizeObserver | undefined
onMounted(() => {
  ro = new ResizeObserver(([entry]) => {
    if (entry)
      width.value = Math.max(260, Math.round(entry.contentRect.width))
  })
  ro.observe(root.value!)
})
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div
    ref="root"
    tabindex="0"
    :class="cn('relative w-full rounded-md text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50', props.class)"
    @keydown="onKey"
    @blur="scrub = null"
  >
    <svg
      :width="width"
      :height="props.height"
      :viewBox="`0 0 ${width} ${props.height}`"
      role="img"
      :aria-label="summary"
      class="block select-none overflow-visible"
    >
      <defs>
        <linearGradient :id="`${uid}-fan`" gradientUnits="userSpaceOnUse" :x1="xNow" :x2="xEnd" y1="0" y2="0">
          <stop offset="0%" stop-color="var(--chart-2)" stop-opacity="0.42" />
          <stop offset="100%" stop-color="var(--chart-2)" stop-opacity="0.1" />
        </linearGradient>
      </defs>

      <!-- future region + grid -->
      <rect :x="xNow" :y="TOP" :width="xEnd - xNow" :height="bottom - TOP" class="fill-muted/50" />
      <g class="text-[11px] tabular-nums">
        <g v-for="t in yTicks" :key="t.v">
          <line :x1="LEFT" :x2="xEnd" :y1="t.y" :y2="t.y" class="stroke-border" stroke-dasharray="2 4" />
          <text :x="LEFT - 8" :y="t.y" dy="0.32em" text-anchor="end" class="fill-muted-foreground">{{ fmt(t.v) }}</text>
        </g>
        <line :x1="LEFT" :x2="xEnd" :y1="bottom" :y2="bottom" class="stroke-border" />
        <text v-for="t in xTicks" :key="t.key" :x="t.x" :y="bottom + 17" :text-anchor="t.anchor" class="fill-muted-foreground">{{ t.label }}</text>
      </g>
      <line :x1="xNow" :x2="xNow" :y1="TOP - 4" :y2="bottom" class="stroke-muted-foreground/60" stroke-dasharray="3 3" />
      <text :x="xNow" :y="TOP - 6" text-anchor="middle" class="fill-muted-foreground text-[10px] font-medium uppercase tracking-wide">{{ props.nowLabel }}</text>

      <g :key="version">
        <!-- the fan opens out of "now" -->
        <motion.g
          :style="{ originX: 0 }"
          :initial="{ scaleX: 0, opacity: 0 }"
          :animate="{ scaleX: 1, opacity: 1 }"
          :transition="orInstant({ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: FAN_AT })"
        >
          <path :d="outer" :fill="`url(#${uid}-fan)`" fill-opacity="0.6" />
          <path :d="inner" :fill="`url(#${uid}-fan)`" />
        </motion.g>

        <motion.path
          v-for="(tg, i) in targets"
          :key="tg.key"
          :d="`M${xNow},${yNow} L${xEnd},${tg.y}`"
          fill="none"
          :class="tg.stroke"
          stroke-width="1.5"
          stroke-dasharray="5 4"
          :initial="{ pathLength: 0, opacity: 0 }"
          :animate="{ pathLength: 1, opacity: 1 }"
          :transition="orInstant({ duration: 0.6, ease: 'easeOut', delay: FAN_AT + 0.1 + i * 0.06 })"
        />

        <!-- history -->
        <motion.path
          :d="line"
          fill="none"
          class="stroke-foreground"
          stroke-width="1.75"
          stroke-linejoin="round"
          stroke-linecap="round"
          :initial="{ pathLength: 0 }"
          :animate="{ pathLength: 1 }"
          :transition="orInstant(DRAW)"
        />
        <motion.circle
          :cx="xNow"
          :cy="yNow"
          r="3.5"
          class="fill-foreground stroke-background"
          stroke-width="2"
          :initial="{ scale: 0 }"
          :animate="{ scale: 1 }"
          :transition="orInstant({ type: 'spring', stiffness: 500, damping: 22, delay: DRAW.duration * 0.9 })"
        />

        <!-- target ends + labels -->
        <motion.g
          v-for="(tg, i) in targets"
          :key="`l-${tg.key}`"
          :initial="{ opacity: 0, x: -6 }"
          :animate="{ opacity: 1, x: 0 }"
          :transition="orInstant({ duration: 0.35, ease: 'easeOut', delay: FAN_AT + 0.55 + i * 0.07 })"
        >
          <circle :cx="xEnd" :cy="tg.y" r="3.5" :class="tg.fill" class="stroke-background" stroke-width="2" />
          <path
            v-if="Math.abs(tg.labelY - tg.y) > 2"
            :d="`M${xEnd + 5},${tg.y} L${xEnd + 9},${tg.labelY}`"
            fill="none"
            class="stroke-border"
          />
          <text :x="xEnd + 12" :y="tg.labelY - 5" class="text-[11px] tabular-nums">
            <tspan v-if="!compact" class="fill-muted-foreground">{{ tg.name }}</tspan>
            <tspan :dx="compact ? 0 : 5" class="fill-foreground font-semibold">{{ fmt(tg.value) }}</tspan>
          </text>
          <text
            :x="xEnd + 12"
            :y="tg.labelY + 9"
            class="text-[11px] font-medium tabular-nums"
            :class="tg.change >= 0 ? 'fill-[color-mix(in_oklab,var(--chart-1)_65%,var(--foreground))]' : 'fill-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]'"
          >{{ pct(tg.change) }}</text>
        </motion.g>
      </g>

      <!-- scrubber -->
      <g v-if="scrub !== null && readout" class="pointer-events-none">
        <line :x1="x(scrub)" :x2="x(scrub)" :y1="TOP" :y2="bottom" class="stroke-muted-foreground" stroke-dasharray="3 3" />
        <circle v-for="d in readout.dots" :key="d.key" :cx="x(scrub)" :cy="d.y" r="4" :class="d.fill" class="stroke-background" stroke-width="2" />
      </g>

      <rect
        :x="LEFT"
        :y="TOP"
        :width="plotW"
        :height="bottom - TOP"
        fill="transparent"
        class="cursor-crosshair touch-pan-y"
        @pointermove="onMove"
        @pointerleave="scrub = null"
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
          class="whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md tabular-nums"
          :class="tip.flipX && '-translate-x-full'"
        >
          <div class="mb-0.5 flex items-center gap-1.5 text-muted-foreground">
            <span v-if="readout.kind === 'forecast'" class="rounded bg-chart-2/20 px-1 text-[10px] font-semibold uppercase text-foreground">Forecast</span>
            {{ readout.title }}
          </div>
          <template v-if="readout.kind === 'history'">
            <div class="text-sm font-semibold">
              {{ fmt(readout.value) }}
            </div>
            <div v-if="scrub !== n - 1" class="text-muted-foreground">
              <span :class="readout.change >= 0 ? UP_INK : DOWN_INK">{{ pct(readout.change) }}</span> since then
            </div>
          </template>
          <template v-else>
            <div v-for="r in readout.rows" :key="r.key" class="flex items-center gap-2">
              <span class="size-2 rounded-full" :class="r.key === 'high' ? 'bg-chart-1' : r.key === 'low' ? 'bg-destructive' : 'bg-foreground'" />
              <span class="mr-auto text-muted-foreground">{{ r.name }}</span>
              <span class="font-semibold">{{ fmt(r.at) }}</span>
              <span class="w-12 text-right" :class="r.change >= 0 ? UP_INK : DOWN_INK">{{ pct(r.change) }}</span>
            </div>
          </template>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
