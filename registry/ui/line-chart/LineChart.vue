<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ChartPoint } from '@/components/ui/chart-utils'
import type { LineChartSeries } from './types'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, ref, useId } from 'vue'
import { cn } from '@/lib/utils'
import {
  areaPath,
  chartColor,
  ChartTooltip,
  formatCompact,
  linearPath,
  linearScale,
  monotonePath,
  niceTicks,
  useElementWidth,
  useTween,
} from '@/components/ui/chart-utils'

const props = withDefaults(defineProps<{
  /** X-axis categories, one per data point (dates, months…). */
  labels: string[]
  /** One entry per line; each `data` array lines up with `labels`. */
  series: LineChartSeries[]
  /** Chart height in px. Width always fills the container. */
  height?: number
  /** Fill the area under each line with a fading gradient. */
  area?: boolean
  /** `monotone` smooths without overshooting; `linear` draws straight segments. */
  curve?: 'monotone' | 'linear'
  /** Approximate number of y-axis ticks. */
  yTicks?: number
  showGrid?: boolean
  /** Legend with toggle buttons. Defaults to on when there's more than one series. */
  showLegend?: boolean
  /** Dots on every data point. */
  showDots?: boolean
  /** Seconds for the draw-in animation. */
  duration?: number
  /** Formats values in the tooltip. */
  formatValue?: (value: number) => string
  /** Formats y-axis tick labels (compact by default: 12K). */
  formatAxis?: (value: number) => string
  class?: HTMLAttributes['class']
}>(), {
  height: 280,
  area: false,
  curve: 'monotone',
  yTicks: 5,
  showGrid: true,
  showLegend: undefined,
  showDots: false,
  duration: 1.2,
})

const DRAW_EASE = [0.65, 0, 0.35, 1] as const
const GLIDE = { type: 'spring', stiffness: 420, damping: 36 } as const

const uid = `vx-line-${useId()}`
const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const width = useElementWidth(root)
const fullFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const fmt = (v: number) => (props.formatValue ?? fullFormat.format)(v)
const fmtAxis = (v: number) => (props.formatAxis ?? formatCompact)(v)

// --- visibility (legend toggles) -------------------------------------------
const hidden = ref(new Set<string>())
const legendVisible = computed(() => props.showLegend ?? props.series.length > 1)
function toggle(name: string) {
  const next = new Set(hidden.value)
  if (next.has(name))
    next.delete(name)
  else if (props.series.length - next.size > 1)
    next.add(name) // always keep at least one line on screen
  hidden.value = next
}

// --- domain + tweened geometry ---------------------------------------------
const domain = computed(() => {
  const shown = props.series.filter(s => !hidden.value.has(s.name)).flatMap(s => s.data)
  if (!shown.length)
    return niceTicks(0, 1, props.yTicks)
  let min = Math.min(...shown)
  const max = Math.max(...shown)
  if (props.area && min > 0)
    min = 0
  return niceTicks(min, max, props.yTicks)
})

const n = computed(() => props.labels.length)
// One flat array: [domainMin, domainMax, ...series 0, ...series 1, …]
const tween = useTween(() => [
  domain.value.min,
  domain.value.max,
  ...props.series.flatMap(s => Array.from({ length: n.value }, (_, i) => s.data[i] ?? 0)),
], { reduced })

const yWidth = computed(() =>
  Math.max(...domain.value.ticks.map(t => fmtAxis(t).length)) * 6.8 + 12)
const box = computed(() => {
  const left = yWidth.value
  const top = 12
  const right = width.value - 18
  const bottom = props.height - 28
  return { left, top, right, bottom, w: Math.max(1, right - left), h: Math.max(1, bottom - top) }
})

const xAt = (i: number) => n.value > 1
  ? box.value.left + (i / (n.value - 1)) * box.value.w
  : box.value.left + box.value.w / 2
const yScale = computed(() => linearScale(
  [tween.value[0] ?? 0, tween.value[1] ?? 1],
  [box.value.bottom, box.value.top],
))

const lines = computed(() => props.series.map((s, si) => {
  const offset = 2 + si * n.value
  const points: ChartPoint[] = Array.from({ length: n.value }, (_, i) =>
    [xAt(i), yScale.value(tween.value[offset + i] ?? 0)])
  const d = props.curve === 'monotone' ? monotonePath(points) : linearPath(points)
  return {
    name: s.name,
    color: s.color ?? chartColor(si),
    hidden: hidden.value.has(s.name),
    points,
    d,
    area: areaPath(d, points, box.value.bottom),
  }
}))

const ticks = computed(() => domain.value.ticks
  .map(value => ({ value, y: yScale.value(value) }))
  .filter(t => t.y >= box.value.top - 1 && t.y <= box.value.bottom + 1))

const xLabels = computed(() => {
  const step = Math.max(1, Math.ceil(n.value / Math.max(1, Math.floor(box.value.w / 64))))
  return props.labels
    .map((text, i) => ({ text, i, x: xAt(i) }))
    .filter(l => l.i % step === 0)
})

// --- crosshair --------------------------------------------------------------
const active = ref<number | null>(null)
const activeRows = computed(() => {
  const i = active.value
  if (i === null)
    return []
  return lines.value.filter(l => !l.hidden).map(l => ({
    name: l.name,
    color: l.color,
    y: l.points[i]?.[1] ?? 0,
    value: props.series.find(s => s.name === l.name)?.data[i] ?? 0,
  }))
})
const tooltipY = computed(() => {
  const ys = activeRows.value.map(r => r.y)
  return ys.length ? Math.min(...ys) : box.value.top
})

function onPointer(event: PointerEvent) {
  const rect = (event.currentTarget as SVGElement).ownerSVGElement?.getBoundingClientRect()
  if (!rect || !n.value)
    return
  const t = (event.clientX - rect.left - box.value.left) / box.value.w
  active.value = Math.min(n.value - 1, Math.max(0, Math.round(t * (n.value - 1))))
}

function onKey(event: KeyboardEvent) {
  const last = n.value - 1
  const cur = active.value
  const next = {
    ArrowRight: cur === null ? 0 : Math.min(last, cur + 1),
    ArrowLeft: cur === null ? last : Math.max(0, cur - 1),
    Home: 0,
    End: last,
  }[event.key]
  if (next !== undefined) {
    event.preventDefault()
    active.value = next
  }
  else if (event.key === 'Escape') {
    active.value = null
  }
}

const announcement = computed(() => active.value === null
  ? ''
  : `${props.labels[active.value]}: ${activeRows.value.map(r => `${r.name} ${fmt(r.value)}`).join(', ')}`)

const summary = computed(() => {
  const names = props.series.map(s => s.name).join(', ')
  const range = n.value ? `${props.labels[0]} to ${props.labels.at(-1)}` : 'no data'
  return `Line chart of ${names}, ${range}. Use arrow keys to read values.`
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
      :height="props.height"
      :viewBox="`0 0 ${width} ${props.height}`"
      role="img"
      :aria-label="summary"
      tabindex="0"
      class="block overflow-visible rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @keydown="onKey"
      @mousedown.prevent="focusChart"
      @blur="active = null"
    >
      <defs>
        <clipPath :id="`${uid}-plot`">
          <rect :x="box.left - 4" :y="0" :width="box.w + 8" :height="box.bottom + 1" />
        </clipPath>
        <clipPath :id="`${uid}-reveal`">
          <motion.rect
            :x="box.left - 4"
            :y="0"
            :width="box.w + 8"
            :height="props.height"
            :initial="reduced ? false : { scaleX: 0 }"
            :animate="{ scaleX: 1 }"
            :transition="{ duration: props.duration, ease: DRAW_EASE }"
            :style="{ transformOrigin: '0% 50%' }"
          />
        </clipPath>
        <linearGradient v-for="(l, i) in lines" :id="`${uid}-g${i}`" :key="l.name" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" :style="{ stopColor: l.color, stopOpacity: 0.28 }" />
          <stop offset="100%" :style="{ stopColor: l.color, stopOpacity: 0 }" />
        </linearGradient>
      </defs>

      <!-- grid + y axis -->
      <g class="text-muted-foreground" font-size="11">
        <g v-for="t in ticks" :key="t.value">
          <line
            v-if="props.showGrid"
            :x1="box.left"
            :x2="box.right"
            :y1="t.y"
            :y2="t.y"
            class="stroke-border"
            :stroke-dasharray="t.value === 0 ? undefined : '3 4'"
          />
          <text :x="box.left - 10" :y="t.y" text-anchor="end" dominant-baseline="middle" fill="currentColor">
            {{ fmtAxis(t.value) }}
          </text>
        </g>
        <text
          v-for="l in xLabels"
          :key="l.i"
          :x="l.x"
          :y="props.height - 8"
          text-anchor="middle"
          fill="currentColor"
        >
          {{ l.text }}
        </text>
      </g>

      <!-- series -->
      <g :clip-path="`url(#${uid}-plot)`">
        <g v-if="props.area" :clip-path="`url(#${uid}-reveal)`">
          <motion.path
            v-for="(l, i) in lines"
            :key="`a-${l.name}`"
            :d="l.area"
            :fill="`url(#${uid}-g${i})`"
            :initial="false"
            :animate="{ opacity: l.hidden ? 0 : 1 }"
            :transition="{ duration: 0.3 }"
          />
        </g>
        <motion.path
          v-for="(l, i) in lines"
          :key="`l-${l.name}`"
          :d="l.d"
          fill="none"
          :style="{ stroke: l.color }"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
          :initial="reduced ? false : { pathLength: 0, opacity: 0 }"
          :animate="{ pathLength: 1, opacity: l.hidden ? 0 : 1 }"
          :transition="{
            pathLength: { duration: props.duration, ease: DRAW_EASE, delay: i * 0.12 },
            opacity: { duration: 0.3, delay: l.hidden ? 0 : i * 0.12 },
          }"
        />
        <template v-if="props.showDots">
          <g v-for="l in lines" v-show="!l.hidden" :key="`d-${l.name}`">
            <circle
              v-for="(p, i) in l.points"
              :key="i"
              :cx="p[0]"
              :cy="p[1]"
              r="2.5"
              class="fill-background"
              :style="{ stroke: l.color }"
              stroke-width="1.5"
            />
          </g>
        </template>
      </g>

      <!-- crosshair -->
      <AnimatePresence>
        <motion.g
          v-if="active !== null"
          key="crosshair"
          :initial="{ opacity: 0, x: xAt(active) }"
          :animate="{ opacity: 1, x: xAt(active) }"
          :exit="{ opacity: 0 }"
          :transition="GLIDE"
          class="pointer-events-none"
        >
          <line :x1="0" :x2="0" :y1="box.top" :y2="box.bottom" class="stroke-muted-foreground/40" stroke-dasharray="3 3" />
          <motion.circle
            v-for="r in activeRows"
            :key="r.name"
            :cx="0"
            r="4.5"
            class="fill-background"
            :style="{ stroke: r.color }"
            stroke-width="2.5"
            :initial="{ cy: r.y }"
            :animate="{ cy: r.y }"
            :transition="GLIDE"
          />
        </motion.g>
      </AnimatePresence>

      <rect
        :x="box.left"
        :y="box.top"
        :width="box.w"
        :height="box.h"
        fill="transparent"
        class="touch-pan-y"
        @pointermove="onPointer"
        @pointerdown="onPointer"
        @pointerleave="active = null"
      />
    </svg>

    <ChartTooltip
      :open="active !== null"
      :x="active === null ? 0 : xAt(active)"
      :y="tooltipY"
      :bounds="{ width, height: props.height }"
      placement="side"
    >
      <p class="mb-1.5 font-medium">
        {{ active === null ? '' : props.labels[active] }}
      </p>
      <div v-for="r in activeRows" :key="r.name" class="flex items-center gap-2 py-0.5">
        <span class="size-2 shrink-0 rounded-full" :style="{ background: r.color }" />
        <span class="text-muted-foreground">{{ r.name }}</span>
        <span class="ml-auto pl-4 font-medium tabular-nums">{{ fmt(r.value) }}</span>
      </div>
    </ChartTooltip>

    <div v-if="legendVisible" class="mt-3 flex flex-wrap justify-center gap-1.5">
      <button
        v-for="l in lines"
        :key="l.name"
        type="button"
        :aria-pressed="!l.hidden"
        class="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
        :class="l.hidden ? 'text-muted-foreground/60' : 'text-foreground'"
        @click="toggle(l.name)"
      >
        <span
          class="size-2.5 rounded-full transition-transform"
          :class="l.hidden ? 'scale-75 opacity-30' : ''"
          :style="{ background: l.color }"
        />
        <span :class="l.hidden ? 'line-through' : ''">{{ l.name }}</span>
      </button>
    </div>

    <p class="sr-only" aria-live="polite">
      {{ announcement }}
    </p>
    <table class="sr-only">
      <caption>{{ props.series.map(s => s.name).join(', ') }}</caption>
      <thead>
        <tr>
          <th scope="col">
            Label
          </th>
          <th v-for="s in props.series" :key="s.name" scope="col">
            {{ s.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(label, i) in props.labels" :key="i">
          <th scope="row">
            {{ label }}
          </th>
          <td v-for="s in props.series" :key="s.name">
            {{ s.data[i] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
