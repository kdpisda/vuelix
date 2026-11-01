<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FunnelChartStage } from './types'
import { motion, useReducedMotion } from 'motion-v'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { chartColor, ChartTooltip, formatCompact, useElementWidth, useTween } from '@/components/ui/chart-utils'
import { NumberTicker } from '@/components/ui/number-ticker'

const props = withDefaults(defineProps<{
  /** Stages in order, from the widest (top of the funnel) down. */
  data: FunnelChartStage[]
  /** `horizontal` flows left → right, `vertical` top → bottom. */
  orientation?: 'horizontal' | 'vertical'
  height?: number
  /** Fill colour of the stages. Defaults to `--chart-1`. */
  color?: string
  /** Show the drop-off between consecutive stages. */
  showDropoff?: boolean
  /** Formats the stage values printed on the chart. */
  formatValue?: (value: number) => string
  class?: HTMLAttributes['class']
}>(), {
  orientation: 'horizontal',
  height: 280,
  showDropoff: true,
})

const GROW = { type: 'spring', stiffness: 200, damping: 22 } as const
const STAGGER = 0.12
/** Share of each step taken by the flat stage; the rest is the curved hand-off. */
const PLATEAU = 0.58

const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const width = useElementWidth(root)
const horizontal = computed(() => props.orientation === 'horizontal')
const fill = computed(() => props.color ?? chartColor(0))
const fmt = (v: number) => (props.formatValue ?? formatCompact)(v)
const pct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })

/** Shortens a label to roughly fit `px` (11px text ≈ 6px per character). */
function fit(text: string, px: number) {
  const max = Math.max(3, Math.floor(px / 6))
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

const values = useTween(() => props.data.map(d => Math.max(0, d.value)), { reduced })

// Flow coordinates: `along` follows the funnel, `across` is the stage thickness.
const frame = computed(() => {
  if (horizontal.value) {
    const top = 48
    return { along0: 0, alongLen: width.value, across0: top, acrossLen: props.height - top - 4 }
  }
  const gutter = Math.min(150, width.value * 0.32)
  return { along0: 0, alongLen: props.height, across0: gutter, acrossLen: width.value - gutter - 4 }
})
const toXY = (along: number, across: number) =>
  horizontal.value ? [along, across] as const : [across, along] as const
const pt = (along: number, across: number) => toXY(along, across).join(',')

const stages = computed(() => {
  const f = frame.value
  const n = Math.max(1, props.data.length)
  // The last stage has no hand-off after it, so it ends flush with the edge.
  const step = f.alongLen / (n - 1 + PLATEAU)
  const max = Math.max(...values.value, 1)
  const mid = f.across0 + f.acrossLen / 2
  return props.data.map((d, i) => {
    const size = Math.max(2, ((values.value[i] ?? 0) / max) * f.acrossLen)
    const a0 = f.along0 + i * step
    const a1 = a0 + step * PLATEAU
    const c0 = mid - size / 2
    const [x, y] = toXY(a0, c0)
    const [w, h] = horizontal.value ? [a1 - a0, size] : [size, a1 - a0]
    return { label: d.label, value: d.value, i, a0, a1, c0, c1: mid + size / 2, step, x, y, w, h, mid }
  })
})

const connectors = computed(() => stages.value.slice(0, -1).map((s, i) => {
  const next = stages.value[i + 1]!
  const from = s.a1
  const to = next.a0
  const m = (from + to) / 2
  const d = [
    `M${pt(from, s.c0)}`,
    `C${pt(m, s.c0)} ${pt(m, next.c0)} ${pt(to, next.c0)}`,
    `L${pt(to, next.c1)}`,
    `C${pt(m, next.c1)} ${pt(m, s.c1)} ${pt(from, s.c1)}`,
    'Z',
  ].join('')
  const prev = props.data[i]?.value ?? 0
  const drop = prev > 0 ? 1 - (props.data[i + 1]?.value ?? 0) / prev : 0
  const [lx, ly] = toXY(m, s.mid)
  return { d, i, drop, lx, ly, room: to - from }
}))

const active = ref<number | null>(null)
const tip = computed(() => {
  const i = active.value
  const s = i === null ? undefined : stages.value[i]
  if (!s || i === null)
    return null
  const first = props.data[0]?.value || 1
  const prev = i > 0 ? props.data[i - 1]?.value || 1 : null
  // Anchor on the stage centre and push the tooltip just past its edge.
  return {
    x: s.x + s.w / 2,
    y: s.y + s.h / 2,
    offset: s.w / 2 + 10,
    label: s.label,
    value: s.value,
    ofFirst: s.value / first,
    ofPrev: prev === null ? null : s.value / prev,
  }
})

function onKey(event: KeyboardEvent) {
  const last = props.data.length - 1
  const cur = active.value
  const fwd = horizontal.value ? 'ArrowRight' : 'ArrowDown'
  const back = horizontal.value ? 'ArrowLeft' : 'ArrowUp'
  const next = {
    [fwd]: cur === null ? 0 : Math.min(last, cur + 1),
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

const summary = computed(() => {
  const first = props.data[0]
  const last = props.data.at(-1)
  const overall = first && last && first.value ? pct.format(last.value / first.value) : '0%'
  return `Funnel with ${props.data.length} stages from ${first?.label ?? ''} to ${last?.label ?? ''}, ${overall} overall conversion. Use arrow keys to read stages.`
})
const announcement = computed(() => {
  const t = tip.value
  return t ? `${t.label}: ${t.value}, ${pct.format(t.ofFirst)} of first stage` : ''
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
      @pointerleave="active = null"
    >
      <!-- curved hand-offs between stages -->
      <motion.path
        v-for="c in connectors"
        :key="`c-${c.i}`"
        :d="c.d"
        :style="{ fill, transformOrigin: horizontal ? '0% 50%' : '50% 0%' }"
        class="pointer-events-none"
        :initial="reduced ? false : horizontal ? { scaleX: 0, opacity: 0 } : { scaleY: 0, opacity: 0 }"
        :animate="{
          scaleX: 1,
          scaleY: 1,
          opacity: active === null || active === c.i || active === c.i + 1 ? 0.22 : 0.1,
        }"
        :transition="{
          scaleX: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: (c.i + 1) * STAGGER + 0.15 },
          scaleY: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: (c.i + 1) * STAGGER + 0.15 },
          opacity: { duration: 0.25 },
        }"
      />

      <!-- stages -->
      <motion.rect
        v-for="s in stages"
        :key="`s-${s.i}`"
        :x="s.x"
        :y="s.y"
        :width="s.w"
        :height="s.h"
        rx="6"
        :style="{ fill, transformOrigin: '50% 50%' }"
        class="cursor-pointer"
        :initial="reduced ? false : horizontal ? { scaleY: 0, opacity: 0 } : { scaleX: 0, opacity: 0 }"
        :animate="{
          scaleX: 1,
          scaleY: 1,
          opacity: (active === null || active === s.i ? 1 : 0.45) * (1 - s.i * (0.4 / Math.max(1, props.data.length - 1))),
        }"
        :transition="{
          scaleX: { ...GROW, delay: s.i * STAGGER },
          scaleY: { ...GROW, delay: s.i * STAGGER },
          opacity: { duration: 0.25 },
        }"
        @pointerenter="active = s.i"
      />

      <!-- drop-off pills -->
      <template v-if="props.showDropoff">
        <motion.g
          v-for="c in connectors"
          v-show="c.room >= (horizontal ? 44 : 20)"
          :key="`p-${c.i}`"
          class="pointer-events-none"
          :initial="reduced ? false : { opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ duration: 0.3, delay: (c.i + 1) * STAGGER + 0.45 }"
        >
          <rect :x="c.lx - 20" :y="c.ly - 9" width="40" height="18" rx="9" class="fill-background stroke-border" />
          <text :x="c.lx" :y="c.ly" text-anchor="middle" dominant-baseline="central" font-size="10" class="fill-muted-foreground font-medium tabular-nums">
            −{{ Math.round(c.drop * 100) }}%
          </text>
        </motion.g>
      </template>

      <!-- labels -->
      <motion.g
        v-for="s in stages"
        :key="`l-${s.i}`"
        class="pointer-events-none"
        :initial="reduced ? false : { opacity: 0 }"
        :animate="{ opacity: active === null || active === s.i ? 1 : 0.5 }"
        :transition="{ duration: 0.3, delay: active === null ? s.i * STAGGER + 0.2 : 0 }"
      >
        <template v-if="horizontal">
          <text :x="s.a0 + 2" y="14" font-size="11" class="fill-muted-foreground">{{ fit(s.label, (s.i === props.data.length - 1 ? s.step * PLATEAU : s.step) - 8) }}</text>
          <text :x="s.a0 + 2" y="34" :font-size="s.step < 64 ? 12 : 15" class="fill-foreground font-semibold tabular-nums">{{ fmt(s.value) }}</text>
        </template>
        <template v-else>
          <text x="0" :y="s.y + s.h / 2 - 8" font-size="11" dominant-baseline="central" class="fill-muted-foreground">{{ fit(s.label, frame.across0 - 8) }}</text>
          <text x="0" :y="s.y + s.h / 2 + 9" font-size="15" dominant-baseline="central" class="fill-foreground font-semibold tabular-nums">{{ fmt(s.value) }}</text>
        </template>
      </motion.g>
    </svg>

    <ChartTooltip
      :open="tip !== null"
      :x="tip?.x ?? 0"
      :y="tip?.y ?? 0"
      :bounds="{ width, height: props.height }"
      :offset="tip?.offset"
      placement="side"
    >
      <p class="mb-1 text-muted-foreground">
        {{ tip?.label }}
      </p>
      <NumberTicker
        :value="tip?.value ?? 0"
        locale="en-US"
        :start-on-view="false"
        :stiffness="240"
        :damping="30"
        class="text-base font-semibold"
      />
      <div class="mt-1.5 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-muted-foreground">
        <span>of first stage</span>
        <span class="text-right font-medium tabular-nums text-foreground">{{ pct.format(tip?.ofFirst ?? 0) }}</span>
        <template v-if="tip?.ofPrev != null">
          <span>from previous</span>
          <span class="text-right font-medium tabular-nums text-foreground">{{ pct.format(tip.ofPrev) }}</span>
        </template>
      </div>
    </ChartTooltip>

    <p class="sr-only" aria-live="polite">
      {{ announcement }}
    </p>
    <table class="sr-only">
      <caption>{{ summary }}</caption>
      <tbody>
        <tr v-for="d in props.data" :key="d.label">
          <th scope="row">
            {{ d.label }}
          </th>
          <td>{{ d.value }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
