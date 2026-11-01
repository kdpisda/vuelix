<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { BarChartSeries } from './types'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'
import { chartColor, ChartTooltip, formatCompact, linearScale, niceTicks, useElementWidth } from '@/ui/chart-utils'

const props = withDefaults(defineProps<{
  /** Categories, one per group / stack. */
  labels: string[]
  /** One entry per series; each `data` array lines up with `labels`. */
  series: BarChartSeries[]
  /** Side by side or stacked on top of each other. */
  mode?: 'grouped' | 'stacked'
  /** `horizontal` puts categories on the y-axis. */
  orientation?: 'vertical' | 'horizontal'
  /** Chart height in px. Width always fills the container. */
  height?: number
  /** Print each value (or each stack's total) at the end of its bar. */
  showValues?: boolean
  showGrid?: boolean
  /** Legend with toggle buttons. Defaults to on when there's more than one series. */
  showLegend?: boolean
  /** Approximate number of value-axis ticks. */
  ticks?: number
  /** Corner radius of each bar. */
  radius?: number
  /** Formats values in the tooltip and value labels. */
  formatValue?: (value: number) => string
  /** Formats value-axis tick labels (compact by default: 12K). */
  formatAxis?: (value: number) => string
  class?: HTMLAttributes['class']
}>(), {
  mode: 'grouped',
  orientation: 'vertical',
  height: 280,
  showValues: false,
  showGrid: true,
  showLegend: undefined,
  ticks: 5,
  radius: 4,
})

// Entrance: a little bounce. Updates: critically damped so bars never overshoot past zero.
const GROW = { type: 'spring', stiffness: 260, damping: 20 } as const
const SETTLE = { type: 'spring', stiffness: 320, damping: 36 } as const
const STAGGER = 0.045

const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const width = useElementWidth(root)
const vertical = computed(() => props.orientation === 'vertical')
const stacked = computed(() => props.mode === 'stacked')
const fullFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const fmt = (v: number) => (props.formatValue ?? fullFormat.format)(v)
const fmtAxis = (v: number) => (props.formatAxis ?? formatCompact)(v)

// Stagger only the first reveal; later changes move every bar at once.
const revealed = ref(false)
let revealTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  revealTimer = setTimeout(() => (revealed.value = true), (props.labels.length * STAGGER + 0.9) * 1000)
})
onBeforeUnmount(() => clearTimeout(revealTimer))

// --- series visibility --------------------------------------------------------
const hidden = ref(new Set<string>())
const legendVisible = computed(() => props.showLegend ?? props.series.length > 1)
const seriesInfo = computed(() => props.series.map((s, j) => ({
  name: s.name,
  color: s.color ?? chartColor(j),
  hidden: hidden.value.has(s.name),
})))
function toggle(name: string) {
  const next = new Set(hidden.value)
  if (next.has(name))
    next.delete(name)
  else if (props.series.length - next.size > 1)
    next.add(name)
  hidden.value = next
}

const value = (j: number, i: number) => props.series[j]?.data[i] ?? 0
const isShown = (j: number) => !seriesInfo.value[j]?.hidden

// --- scales --------------------------------------------------------------------
const domain = computed(() => {
  let min = 0
  let max = 0
  props.labels.forEach((_, i) => {
    let pos = 0
    let neg = 0
    props.series.forEach((_, j) => {
      if (!isShown(j))
        return
      const v = value(j, i)
      if (stacked.value) {
        if (v >= 0)
          pos += v
        else neg += v
      }
      else {
        pos = Math.max(pos, v)
        neg = Math.min(neg, v)
      }
    })
    max = Math.max(max, pos)
    min = Math.min(min, neg)
  })
  return niceTicks(min, max === min ? min + 1 : max, props.ticks)
})

const charW = 6.6
const box = computed(() => {
  const tickLen = Math.max(...domain.value.ticks.map(t => fmtAxis(t).length))
  if (vertical.value) {
    const left = tickLen * charW + 14
    const top = props.showValues ? 22 : 10
    return { left, top, right: width.value - 8, bottom: props.height - 28 }
  }
  const labelLen = Math.max(1, ...props.labels.map(l => l.length))
  const left = Math.min(width.value * 0.35, labelLen * charW + 16)
  return { left, top: 6, right: width.value - (props.showValues ? 52 : 18), bottom: props.height - 26 }
})
const plotW = computed(() => Math.max(1, box.value.right - box.value.left))
const plotH = computed(() => Math.max(1, box.value.bottom - box.value.top))

const vScale = computed(() => linearScale(
  [domain.value.min, domain.value.max],
  vertical.value ? [box.value.bottom, box.value.top] : [box.value.left, box.value.right],
))
const band = computed(() => (vertical.value ? plotW.value : plotH.value) / Math.max(1, props.labels.length))
const bandStart = (i: number) => (vertical.value ? box.value.left : box.value.top) + i * band.value

// --- bar geometry --------------------------------------------------------------
interface Bar { key: string, i: number, j: number, x: number, y: number, w: number, h: number, base: { x: number, y: number, w: number, h: number }, color: string, hidden: boolean }

const bars = computed<Bar[]>(() => {
  const s = vScale.value
  const zero = s(0)
  const shownIdx = props.series.map((_, j) => j).filter(isShown)
  const out: Bar[] = []
  props.labels.forEach((_, i) => {
    const start = bandStart(i)
    let pos = 0
    let neg = 0
    props.series.forEach((_, j) => {
      const info = seriesInfo.value[j]!
      const v = info.hidden ? 0 : value(j, i)
      let thick: number
      let offset: number
      let from: number
      let to: number
      if (stacked.value) {
        thick = Math.min(band.value * 0.62, 56)
        offset = start + (band.value - thick) / 2
        from = v >= 0 ? pos : neg
        to = from + v
        if (v >= 0)
          pos = to
        else neg = to
      }
      else {
        const m = Math.max(1, shownIdx.length)
        const inner = Math.min(band.value * 0.72, m * 44)
        const slot = inner / m
        const k = Math.max(0, shownIdx.indexOf(j))
        thick = Math.max(1, slot - (slot > 8 ? 3 : 0))
        offset = start + (band.value - inner) / 2 + (info.hidden ? (inner - slot) / 2 : k * slot) + (slot - thick) / 2
        from = 0
        to = v
      }
      const p0 = s(from)
      const p1 = s(to)
      let lo = Math.min(p0, p1)
      let len = Math.abs(p1 - p0)
      // Hairline gap between stacked segments.
      if (stacked.value && from !== 0 && len > 3) {
        len -= 2
        // The gap sits on the side facing the previous segment.
        if (vertical.value ? v < 0 : v >= 0)
          lo += 2
      }
      const geo = vertical.value
        ? { x: offset, y: lo, w: thick, h: len }
        : { x: lo, y: offset, w: len, h: thick }
      const base = vertical.value
        ? { x: offset, y: zero, w: thick, h: 0 }
        : { x: zero, y: offset, w: 0, h: thick }
      out.push({ key: `${j}`, i, j, ...geo, base, color: info.color, hidden: info.hidden })
    })
  })
  return out
})

const valueLabels = computed(() => {
  if (!props.showValues)
    return []
  const s = vScale.value
  const cats = props.labels.map((_, i) => bars.value.filter(b => b.i === i && !b.hidden))
  const items: { key: string, i: number, x: number, y: number, text: string, anchor: string, delay: number }[] = []
  cats.forEach((group, i) => {
    const list = stacked.value
      ? [{ j: -1, v: group.reduce((sum, b) => sum + value(b.j, i), 0), bar: group[0] }]
      : group.map(b => ({ j: b.j, v: value(b.j, i), bar: b }))
    for (const { j, v, bar } of list) {
      // Skip labels on bars too thin to carry one without colliding.
      if (!bar || (!stacked.value && (vertical.value ? bar.w : bar.h) < 16))
        continue
      const end = s(v)
      const neg = v < 0
      const common = { key: `${i}-${j}`, i, text: fmt(v), delay: i * STAGGER }
      items.push(vertical.value
        ? { ...common, x: bar.x + bar.w / 2, y: neg ? end + 13 : end - 6, anchor: 'middle' }
        : { ...common, x: neg ? end - 6 : end + 6, y: bar.y + bar.h / 2, anchor: neg ? 'end' : 'start' })
    }
  })
  return items
})

const ticks = computed(() => domain.value.ticks.map(t => ({ value: t, p: vScale.value(t) })))
const catLabels = computed(() => {
  const longest = Math.max(1, ...props.labels.map(l => l.length)) * charW + 8
  const step = Math.max(1, Math.ceil((vertical.value ? longest : 14) / band.value))
  return props.labels
    .map((text, i) => ({ text, i, p: bandStart(i) + band.value / 2 }))
    .filter(l => l.i % step === 0)
})

// --- interaction -----------------------------------------------------------------
const active = ref<number | null>(null)

function transitionFor(b: Bar) {
  if (reduced.value)
    return { duration: 0 }
  return {
    default: revealed.value ? SETTLE : { ...GROW, delay: b.i * STAGGER + b.j * 0.02 },
    opacity: { duration: 0.2 },
  }
}

const tooltip = computed(() => {
  const i = active.value
  if (i === null)
    return null
  const group = bars.value.filter(b => b.i === i && !b.hidden)
  const rows = group.map(b => ({ name: seriesInfo.value[b.j]!.name, color: b.color, value: value(b.j, i) }))
  const center = bandStart(i) + band.value / 2
  const total = rows.reduce((sum, r) => sum + r.value, 0)
  if (vertical.value) {
    // Beside the group (flipping sides near the edge) so the bars stay visible.
    const top = Math.min(...group.map(b => b.y), box.value.bottom)
    const half = Math.max(...group.map(b => Math.abs(b.x + b.w / 2 - center) + b.w / 2), 0)
    return { x: center, y: (top + box.value.bottom) / 2, offset: half + 10, rows, total }
  }
  const end = Math.max(...group.map(b => b.x + b.w), box.value.left)
  return { x: end, y: center, offset: props.showValues ? 44 : 12, rows, total }
})

function onKey(event: KeyboardEvent) {
  const last = props.labels.length - 1
  const cur = active.value
  const forward = vertical.value ? 'ArrowRight' : 'ArrowDown'
  const back = vertical.value ? 'ArrowLeft' : 'ArrowUp'
  const next = {
    [forward]: cur === null ? 0 : Math.min(last, cur + 1),
    [back]: cur === null ? last : Math.max(0, cur - 1),
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

const announcement = computed(() => {
  const t = tooltip.value
  if (!t || active.value === null)
    return ''
  return `${props.labels[active.value]}: ${t.rows.map(r => `${r.name} ${fmt(r.value)}`).join(', ')}`
})
const summary = computed(() =>
  `${stacked.value ? 'Stacked' : 'Grouped'} ${props.orientation} bar chart of ${props.series.map(s => s.name).join(', ')} across ${props.labels.length} categories. Use arrow keys to read values.`)

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
      @pointerleave="active = null"
    >
      <!-- value axis + grid -->
      <g class="text-muted-foreground" font-size="11">
        <AnimatePresence>
          <motion.g
            v-for="t in ticks"
            :key="t.value"
            :initial="vertical ? { opacity: 0, y: t.p } : { opacity: 0, x: t.p }"
            :animate="vertical ? { opacity: 1, y: t.p } : { opacity: 1, x: t.p }"
            :exit="{ opacity: 0 }"
            :transition="SETTLE"
          >
            <template v-if="vertical">
              <line v-if="props.showGrid" :x1="box.left" :x2="box.right" :y1="0" :y2="0" class="stroke-border" :stroke-dasharray="t.value === 0 ? undefined : '3 4'" />
              <text :x="box.left - 10" :y="0" text-anchor="end" dominant-baseline="middle" fill="currentColor">{{ fmtAxis(t.value) }}</text>
            </template>
            <template v-else>
              <line v-if="props.showGrid" :x1="0" :x2="0" :y1="box.top" :y2="box.bottom" class="stroke-border" :stroke-dasharray="t.value === 0 ? undefined : '3 4'" />
              <text :x="0" :y="props.height - 6" text-anchor="middle" fill="currentColor">{{ fmtAxis(t.value) }}</text>
            </template>
          </motion.g>
        </AnimatePresence>
        <text
          v-for="l in catLabels"
          :key="l.i"
          :x="vertical ? l.p : box.left - 10"
          :y="vertical ? props.height - 8 : l.p"
          :text-anchor="vertical ? 'middle' : 'end'"
          :dominant-baseline="vertical ? undefined : 'middle'"
          fill="currentColor"
          class="transition-colors"
          :class="active === l.i ? 'fill-foreground' : ''"
        >
          {{ l.text }}
        </text>
      </g>

      <!-- bars -->
      <motion.rect
        v-for="b in bars"
        :key="`${b.i}-${b.key}`"
        :rx="props.radius"
        :style="{ fill: b.color }"
        :initial="reduced ? false : { attrX: b.base.x, attrY: b.base.y, width: b.base.w, height: b.base.h, opacity: 1 }"
        :animate="{
          attrX: b.x,
          attrY: b.y,
          width: b.w,
          height: b.h,
          opacity: b.hidden ? 0 : active === null || active === b.i ? 1 : 0.3,
        }"
        :transition="transitionFor(b)"
        class="pointer-events-none"
      />

      <!-- value labels -->
      <motion.text
        v-for="l in valueLabels"
        :key="l.key"
        :text-anchor="l.anchor"
        :dominant-baseline="vertical ? undefined : 'middle'"
        font-size="10.5"
        class="pointer-events-none fill-foreground font-medium tabular-nums"
        :initial="reduced ? false : { opacity: 0, attrX: l.x, attrY: l.y }"
        :animate="{ opacity: active === null || active === l.i ? 1 : 0.35, attrX: l.x, attrY: l.y }"
        :transition="{ default: SETTLE, opacity: { duration: 0.3, delay: revealed ? 0 : l.delay + 0.5 } }"
      >
        {{ l.text }}
      </motion.text>

      <!-- hit areas, one per category -->
      <rect
        v-for="(_, i) in props.labels"
        :key="`hit-${i}`"
        :x="vertical ? bandStart(i) : box.left"
        :y="vertical ? box.top : bandStart(i)"
        :width="vertical ? band : plotW"
        :height="vertical ? plotH : band"
        fill="transparent"
        class="touch-pan-y"
        @pointerenter="active = i"
        @pointerdown="active = i"
      />
    </svg>

    <ChartTooltip
      :open="tooltip !== null"
      :x="tooltip?.x ?? 0"
      :y="tooltip?.y ?? 0"
      :bounds="{ width, height: props.height }"
      :offset="tooltip?.offset"
      placement="side"
    >
      <p class="mb-1.5 font-medium">
        {{ active === null ? '' : props.labels[active] }}
      </p>
      <div v-for="r in tooltip?.rows ?? []" :key="r.name" class="flex items-center gap-2 py-0.5">
        <span class="size-2 shrink-0 rounded-[3px]" :style="{ background: r.color }" />
        <span class="text-muted-foreground">{{ r.name }}</span>
        <span class="ml-auto pl-4 font-medium tabular-nums">{{ fmt(r.value) }}</span>
      </div>
      <div v-if="stacked && (tooltip?.rows.length ?? 0) > 1" class="mt-1 flex border-t pt-1 font-medium">
        Total <span class="ml-auto pl-4 tabular-nums">{{ fmt(tooltip?.total ?? 0) }}</span>
      </div>
    </ChartTooltip>

    <div v-if="legendVisible" class="mt-3 flex flex-wrap justify-center gap-1.5">
      <button
        v-for="s in seriesInfo"
        :key="s.name"
        type="button"
        :aria-pressed="!s.hidden"
        class="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
        :class="s.hidden ? 'text-muted-foreground/60' : 'text-foreground'"
        @click="toggle(s.name)"
      >
        <span class="size-2.5 rounded-[3px] transition-transform" :class="s.hidden ? 'scale-75 opacity-30' : ''" :style="{ background: s.color }" />
        <span :class="s.hidden ? 'line-through' : ''">{{ s.name }}</span>
      </button>
    </div>

    <p class="sr-only" aria-live="polite">
      {{ announcement }}
    </p>
    <table class="sr-only">
      <caption>{{ summary }}</caption>
      <thead>
        <tr>
          <th scope="col">
            Category
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
