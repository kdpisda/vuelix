<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { VolumeSample } from './profile'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import { buildProfile, monotonePath, niceTicks } from './profile'

const props = withDefaults(defineProps<{
  /** Price/volume samples — trades, or each candle's typical price and volume. */
  data: VolumeSample[]
  /** Number of price bins. */
  bins?: number
  /** Share of total volume the value area must hold. */
  valueArea?: number
  /** Optional price series drawn over the profile (oldest first). */
  line?: number[]
  /** Chart height in px. Width follows the container. */
  height?: number
  /** Decimals for prices. */
  precision?: number
  locale?: string
  formatVolume?: (volume: number) => string
  class?: HTMLAttributes['class']
}>(), {
  bins: 24,
  valueArea: 0.7,
  height: 340,
  precision: 2,
  locale: 'en-US',
})

const GROW = { type: 'spring', stiffness: 170, damping: 22 } as const
const RIPPLE = 0.035 // seconds per bin away from the point of control
const TIP = { type: 'spring', stiffness: 520, damping: 38, mass: 0.6 } as const

const AXIS_W = 66
const TOP = 10
const BOTTOM = 10

const uid = `vx-vprofile-${useId()}`
const root = ref<HTMLElement>()
const width = ref(640)
const prefersReduced = useReducedMotion()
// useReducedMotion() only settles after mount, so also read the media query directly: animations
// that start on mount get skipped too. Only transitions use it — `initial` must match the server render.
const reduce = computed(() => prefersReduced.value
  || (typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
const orInstant = <T>(t: T) => (reduce.value ? { duration: 0 } : t)

const fmtPrice = computed(() => {
  const f = new Intl.NumberFormat(props.locale, { minimumFractionDigits: props.precision, maximumFractionDigits: props.precision })
  return (v: number) => f.format(v)
})
const fmtVol = computed(() => {
  if (props.formatVolume)
    return props.formatVolume
  const f = new Intl.NumberFormat(props.locale, { notation: 'compact', maximumFractionDigits: 1 })
  return (v: number) => f.format(v)
})

const profile = computed(() => buildProfile(props.data, props.bins, props.valueArea, props.line))
const right = computed(() => Math.max(60, width.value - AXIS_W))
const bottom = computed(() => props.height - BOTTOM)
const y = (price: number) => {
  const { lo, hi } = profile.value
  return bottom.value - ((price - lo) / (hi - lo)) * (bottom.value - TOP)
}

const bars = computed(() => {
  const p = profile.value
  const maxW = right.value * (props.line?.length ? 0.58 : 0.94)
  return p.levels.map((l) => {
    const y0 = y(l.to)
    const y1 = y(l.from)
    const h = y1 - y0
    const w = (l.volume / p.max) * maxW
    return {
      ...l,
      x: right.value - w,
      w,
      y: y0 + Math.min(1, h * 0.12),
      h: Math.max(1, h - Math.min(2, h * 0.24)),
      cy: (y0 + y1) / 2,
      poc: l.index === p.poc,
      delay: Math.abs(l.index - p.poc) * RIPPLE,
    }
  })
})

const pocBar = computed(() => bars.value[profile.value.poc]!)
const band = computed(() => ({ y: y(profile.value.vah), h: y(profile.value.val) - y(profile.value.vah) }))

const linePath = computed(() => {
  const l = props.line
  if (!l || l.length < 2)
    return ''
  const w = right.value - 6
  return monotonePath(l.map((v, i) => [3 + (i / (l.length - 1)) * w, y(v)]))
})
const lastPrice = computed(() => props.line?.at(-1))

const pills = computed(() => {
  const out: { y: number, text: string, kind: 'poc' | 'last' }[] = [
    { y: pocBar.value.cy, text: fmtPrice.value((pocBar.value.from + pocBar.value.to) / 2), kind: 'poc' },
  ]
  if (lastPrice.value !== undefined) {
    const ly = y(lastPrice.value)
    // Nudge the last-price tag off the POC tag if they would overlap.
    const dy = ly - out[0]!.y
    out.push({ y: Math.abs(dy) < 19 ? out[0]!.y + (dy < 0 ? -19 : 19) : ly, text: fmtPrice.value(lastPrice.value), kind: 'last' })
  }
  return out
})

const ticks = computed(() => {
  const { lo, hi } = profile.value
  const n = Math.max(3, Math.floor((bottom.value - TOP) / 44))
  return niceTicks(lo, hi, n)
    .map(v => ({ v, y: y(v) }))
    .filter(t => t.y > TOP + 4 && t.y < bottom.value - 4 && pills.value.every(p => Math.abs(p.y - t.y) > 13))
})

// Replay the grow-in when the data changes (not on resize).
const version = ref(0)
watch(() => [props.data, props.line, props.bins, props.valueArea], () => version.value++, { deep: true })

// --- hover ---------------------------------------------------------------------
const hover = ref<{ index: number, x: number } | null>(null)
function onMove(e: PointerEvent) {
  const r = (e.currentTarget as Element).getBoundingClientRect()
  const py = e.clientY - r.top + TOP
  const { lo, hi, levels } = profile.value
  const price = lo + ((bottom.value - py) / (bottom.value - TOP)) * (hi - lo)
  const index = Math.min(levels.length - 1, Math.max(0, Math.floor(((price - lo) / (hi - lo)) * levels.length)))
  hover.value = { index, x: e.clientX - r.left }
}
const hovered = computed(() => (hover.value ? bars.value[hover.value.index] : undefined))
const tip = computed(() => {
  const h = hover.value
  const b = hovered.value
  if (!h || !b)
    return null
  const flipX = h.x > right.value / 2
  return { x: h.x + (flipX ? -16 : 16), y: b.cy, flipX }
})

const summary = computed(() => {
  const p = profile.value
  const poc = p.levels[p.poc]!
  return `Volume profile with ${p.levels.length} price levels. Point of control at ${fmtPrice.value((poc.from + poc.to) / 2)}, value area (${Math.round(props.valueArea * 100)}% of volume) from ${fmtPrice.value(p.val)} to ${fmtPrice.value(p.vah)}. Total volume ${fmtVol.value(p.total)}.`
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
  <div ref="root" :class="cn('relative w-full text-foreground', props.class)">
    <svg
      :width="width"
      :height="props.height"
      :viewBox="`0 0 ${width} ${props.height}`"
      role="img"
      :aria-label="summary"
      class="block select-none overflow-visible"
    >
      <defs>
        <clipPath :id="`${uid}-clip`">
          <rect x="0" :y="TOP - 2" :width="right" :height="bottom - TOP + 4" />
        </clipPath>
      </defs>

      <!-- grid + axis -->
      <g class="text-[11px] tabular-nums">
        <g v-for="t in ticks" :key="t.v">
          <line x1="0" :x2="right" :y1="t.y" :y2="t.y" class="stroke-border" stroke-dasharray="2 4" />
          <text :x="right + 8" :y="t.y" dy="0.32em" class="fill-muted-foreground">{{ fmtPrice(t.v) }}</text>
        </g>
        <line :x1="right" :x2="right" :y1="TOP - 4" :y2="bottom + 4" class="stroke-border" />
      </g>

      <g :key="version" :clip-path="`url(#${uid}-clip)`">
        <!-- value area band, unfolding from the point of control -->
        <motion.rect
          x="0"
          :y="band.y"
          :width="right"
          :height="band.h"
          class="fill-chart-2/10"
          :style="{ originY: band.h ? (pocBar.cy - band.y) / band.h : 0.5 }"
          :initial="{ scaleY: 0, opacity: 0 }"
          :animate="{ scaleY: 1, opacity: 1 }"
          :transition="orInstant({ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 })"
        />
        <line x1="0" :x2="right" :y1="band.y" :y2="band.y" class="stroke-chart-2/40" stroke-dasharray="4 3" />
        <line x1="0" :x2="right" :y1="band.y + band.h" :y2="band.y + band.h" class="stroke-chart-2/40" stroke-dasharray="4 3" />

        <!-- histogram: bars ripple out from the point of control -->
        <motion.rect
          v-for="b in bars"
          :key="b.index"
          :x="b.x"
          :y="b.y"
          :width="b.w"
          :height="b.h"
          rx="1.5"
          class="transition-colors duration-150"
          :class="b.poc
            ? 'fill-chart-4'
            : hover?.index === b.index
              ? 'fill-chart-2'
              : b.inValueArea ? 'fill-chart-2/60' : 'fill-chart-2/25'"
          :style="{ originX: 1 }"
          :initial="{ scaleX: 0 }"
          :animate="{ scaleX: 1 }"
          :transition="orInstant({ ...GROW, delay: 0.15 + b.delay })"
        />

        <!-- point of control -->
        <motion.line
          x1="0"
          :x2="right"
          :y1="pocBar.cy"
          :y2="pocBar.cy"
          class="stroke-chart-4"
          stroke-width="1.25"
          stroke-dasharray="5 4"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="orInstant({ duration: 0.4, delay: 0.5 })"
        />

        <!-- price line -->
        <motion.path
          v-if="linePath"
          :d="linePath"
          fill="none"
          class="stroke-foreground/85"
          stroke-width="1.25"
          stroke-linejoin="round"
          stroke-linecap="round"
          :initial="{ pathLength: 0 }"
          :animate="{ pathLength: 1 }"
          :transition="orInstant({ duration: 1.3, ease: [0.65, 0, 0.35, 1], delay: 0.2 })"
        />

        <motion.g
          class="pointer-events-none stroke-background text-[10px] font-medium uppercase tracking-wide [paint-order:stroke]"
          stroke-width="3"
          stroke-linejoin="round"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="orInstant({ duration: 0.4, delay: 0.7 })"
        >
          <text x="6" :y="band.y - 5" class="fill-muted-foreground">VAH {{ fmtPrice(profile.vah) }}</text>
          <text x="6" :y="band.y + band.h + 12" class="fill-muted-foreground">VAL {{ fmtPrice(profile.val) }}</text>
        </motion.g>
      </g>

      <!-- hover guide -->
      <line
        v-if="hovered"
        x1="0"
        :x2="right"
        :y1="hovered.cy"
        :y2="hovered.cy"
        class="pointer-events-none stroke-muted-foreground"
        stroke-dasharray="3 3"
      />

      <!-- axis tags -->
      <g v-for="p in pills" :key="p.kind" class="text-[11px] font-semibold tabular-nums">
        <rect :x="right + 2.5" :y="p.y - 9" :width="AXIS_W - 5" height="18" rx="4" class="fill-background" />
        <rect
          :x="right + 2.5"
          :y="p.y - 9"
          :width="AXIS_W - 5"
          height="18"
          rx="4"
          :class="p.kind === 'poc' ? 'fill-chart-4/25 stroke-chart-4' : 'fill-foreground'"
        />
        <text :x="right + 8" :y="p.y" dy="0.32em" :class="p.kind === 'poc' ? 'fill-foreground' : 'fill-background'">{{ p.text }}</text>
      </g>
      <circle v-if="lastPrice !== undefined && linePath" :cx="right - 3" :cy="y(lastPrice)" r="3" class="fill-foreground" />

      <rect
        x="0"
        :y="TOP"
        :width="right"
        :height="bottom - TOP"
        fill="transparent"
        class="cursor-crosshair"
        @pointermove="onMove"
        @pointerleave="hover = null"
      />
    </svg>

    <AnimatePresence>
      <motion.div
        v-if="tip && hovered"
        key="tip"
        aria-hidden="true"
        class="pointer-events-none absolute left-0 top-0 z-10"
        :initial="{ opacity: 0, scale: 0.96, x: tip.x, y: tip.y }"
        :animate="{ opacity: 1, scale: 1, x: tip.x, y: tip.y }"
        :exit="{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }"
        :transition="reduce ? { duration: 0 } : TIP"
      >
        <div
          class="-translate-y-1/2 whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          :class="tip.flipX && '-translate-x-full'"
        >
          <div class="flex items-center gap-1.5 text-muted-foreground tabular-nums">
            {{ fmtPrice(hovered.from) }} – {{ fmtPrice(hovered.to) }}
            <span
              v-if="hovered.poc || hovered.inValueArea"
              class="rounded px-1 text-[10px] font-semibold uppercase"
              :class="hovered.poc ? 'bg-chart-4/25 text-foreground' : 'bg-chart-2/20 text-foreground'"
            >{{ hovered.poc ? 'POC' : 'Value area' }}</span>
          </div>
          <div class="mt-0.5 flex items-baseline gap-2 tabular-nums">
            <span class="text-sm font-semibold">{{ fmtVol(hovered.volume) }}</span>
            <span class="text-muted-foreground">{{ ((hovered.volume / (profile.total || 1)) * 100).toFixed(1) }}% of volume</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
