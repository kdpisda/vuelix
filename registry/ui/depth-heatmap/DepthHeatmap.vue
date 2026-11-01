<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { DepthColumn } from './scale'
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import { clamp, defaultTimeFormatter, niceTicks } from './scale'

const props = withDefaults(defineProps<{
  /** Price of each row, ascending (lowest price first). */
  levels: number[]
  /** Snapshots over time, oldest first. Append to stream new columns in. */
  columns: DepthColumn[]
  /** Columns in the viewport (the newest are shown). */
  visible?: number
  /** Chart height in px. Width follows the container. */
  height?: number
  /** Cell color — any CSS color. Intensity maps to its opacity. */
  color?: string
  /** Colour resting size below the price as bids (`--chart-1`) and above it as asks (`--destructive`). */
  split?: boolean
  /** < 1 lifts faint liquidity, > 1 emphasises only the largest walls. */
  gamma?: number
  /** Decimals for prices. */
  precision?: number
  locale?: string
  formatTime?: (time: DepthColumn['time']) => string
  formatDepth?: (size: number) => string
  class?: HTMLAttributes['class']
}>(), {
  visible: 48,
  height: 320,
  color: 'var(--chart-2)',
  split: false,
  gamma: 0.75,
  precision: 2,
  locale: 'en-US',
})

const REVEAL = { duration: 1, ease: [0.65, 0, 0.35, 1] } as const
const SLIDE = { type: 'spring', stiffness: 220, damping: 30 } as const
const TIP = { type: 'spring', stiffness: 520, damping: 38, mass: 0.6 } as const

const AXIS_W = 64
const TOP = 6
const BOTTOM = 22

const uid = `vx-depth-${useId()}`
const root = ref<HTMLElement>()
const width = ref(640)
const mounted = ref(false)
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
const fmtDepth = computed(() => {
  if (props.formatDepth)
    return props.formatDepth
  const f = new Intl.NumberFormat(props.locale, { notation: 'compact', maximumFractionDigits: 1 })
  return (v: number) => f.format(v)
})
const spacing = computed(() => {
  const [a, b] = props.columns.slice(-2)
  return typeof a?.time === 'number' && typeof b?.time === 'number' ? Math.abs(b.time - a.time) || 1000 : 1000
})
const fmtTime = computed(() => props.formatTime ?? defaultTimeFormatter(props.locale, spacing.value))

// --- geometry ---------------------------------------------------------------------
const right = computed(() => Math.max(60, width.value - AXIS_W))
const bottom = computed(() => props.height - BOTTOM)
const count = computed(() => Math.max(1, Math.min(props.visible, props.columns.length)))
const start = computed(() => props.columns.length - count.value)
const colW = computed(() => right.value / Math.max(1, props.visible))
const step = computed(() => (props.levels.length > 1 ? (props.levels.at(-1)! - props.levels[0]!) / (props.levels.length - 1) : 1))
const lo = computed(() => (props.levels[0] ?? 0) - step.value / 2)
const hi = computed(() => (props.levels.at(-1) ?? 1) + step.value / 2)
const rowH = computed(() => (bottom.value - TOP) / Math.max(1, props.levels.length))
const y = (price: number) => bottom.value - ((price - lo.value) / (hi.value - lo.value || 1)) * (bottom.value - TOP)
// Columns fill from the right edge, so a short history still hugs the latest data.
const xOf = (slot: number) => right.value - (count.value - slot) * colW.value

const maxDepth = computed(() => {
  let m = 0
  for (const c of props.columns.slice(start.value)) {
    for (const d of c.depth) m = Math.max(m, d)
  }
  return m || 1
})

// One extra column on the left so the series can slide without a gap.
const rendered = computed(() => {
  const from = Math.max(0, start.value - 1)
  return props.columns.slice(from).map((c, k) => ({ c, slot: from + k - start.value }))
})

const cells = computed(() => {
  const out: { key: string, x: number, y: number, o: number, side: 'bid' | 'ask' | 'none' }[] = []
  const w = colW.value
  const h = rowH.value
  for (const { c, slot } of rendered.value) {
    const x = xOf(slot)
    c.depth.forEach((d, r) => {
      const o = (Math.max(0, d) / maxDepth.value) ** props.gamma
      if (o < 0.03)
        return
      const level = props.levels[r]!
      out.push({
        key: `${c.time}:${r}`,
        x,
        y: bottom.value - (r + 1) * h,
        o,
        side: !props.split || c.price === undefined ? 'none' : level <= c.price ? 'bid' : 'ask',
      })
    })
  }
  return { list: out, w: w + 0.4, h: h + 0.4 }
})
const cellColor = (side: 'bid' | 'ask' | 'none') =>
  side === 'bid' ? 'var(--chart-1)' : side === 'ask' ? 'var(--destructive)' : props.color

const trace = computed(() => {
  const pts = rendered.value
    .filter(r => r.c.price !== undefined)
    .map(r => `${xOf(r.slot) + colW.value / 2},${y(r.c.price!)}`)
  return pts.length > 1 ? `M${pts.join(' L')}` : ''
})
const last = computed(() => props.columns.at(-1))

const priceTicks = computed(() => {
  const n = Math.max(3, Math.floor((bottom.value - TOP) / 42))
  const lastY = last.value?.price !== undefined ? y(last.value.price) : -100
  return niceTicks(lo.value, hi.value, n)
    .map(v => ({ v, y: y(v) }))
    .filter(t => t.y > TOP + 5 && t.y < bottom.value - 5 && Math.abs(t.y - lastY) > 13)
})

const timeTicks = computed(() => {
  const per = Math.max(1, Math.ceil(84 / colW.value))
  return rendered.value
    .filter(({ c, slot }) => {
      const n = typeof c.time === 'number' ? Math.round(c.time / spacing.value) : start.value + slot
      const cx = xOf(slot) + colW.value / 2
      return n % per === 0 && cx > 26 && cx < right.value - 26
    })
    .map(({ c, slot }) => ({ key: c.time, x: xOf(slot) + colW.value / 2, label: fmtTime.value(c.time) }))
})

// --- intro + slide-in ---------------------------------------------------------------
const version = ref(0)
const slide = useMotionValue(0)
let lastSeen: DepthColumn['time'] | undefined
watch(() => props.columns.at(-1)?.time, (now) => {
  const prev = lastSeen
  lastSeen = now
  if (prev === undefined || now === undefined || !mounted.value)
    return
  const i = props.columns.findIndex(c => c.time === prev)
  if (i === -1 || i < props.columns.length - 3) {
    version.value++ // a different series: replay the reveal
    return
  }
  if (reduce.value)
    return
  slide.jump(slide.get() + colW.value * (props.columns.length - 1 - i))
  animate(slide, 0, SLIDE)
}, { immediate: true })

// --- hover ----------------------------------------------------------------------------
const hover = ref<{ slot: number, row: number } | null>(null)
function onMove(e: PointerEvent) {
  const r = (e.currentTarget as Element).getBoundingClientRect()
  const px = e.clientX - r.left
  const py = e.clientY - r.top
  const slot = Math.floor((px - xOf(0)) / colW.value)
  if (slot < 0 || slot >= count.value) {
    hover.value = null
    return
  }
  hover.value = { slot, row: clamp(props.levels.length - 1 - Math.floor(py / rowH.value), 0, props.levels.length - 1) }
}
const hovered = computed(() => {
  const h = hover.value
  const c = h && props.columns[start.value + h.slot]
  if (!h || !c)
    return null
  const d = c.depth[h.row] ?? 0
  return {
    x: xOf(h.slot),
    y: bottom.value - (h.row + 1) * rowH.value,
    time: fmtTime.value(c.time),
    price: fmtPrice.value(props.levels[h.row]!),
    depth: fmtDepth.value(d),
    share: d / maxDepth.value,
    side: c.price === undefined ? null : props.levels[h.row]! <= c.price ? 'Bid' : 'Ask',
  }
})
const tip = computed(() => {
  const h = hovered.value
  if (!h)
    return null
  const cx = h.x + colW.value / 2
  const flipX = cx > right.value - 190
  const below = h.y < 70
  return { x: cx + (flipX ? -10 : 10), y: below ? h.y + rowH.value + 6 : h.y - 6, flipX, below }
})

const summary = computed(() => {
  const c = last.value
  if (!c)
    return 'Depth heatmap with no data'
  const r = c.depth.indexOf(Math.max(...c.depth))
  return `Liquidity heatmap: ${props.columns.length} snapshots across ${props.levels.length} price levels from ${fmtPrice.value(props.levels[0] ?? 0)} to ${fmtPrice.value(props.levels.at(-1) ?? 0)}.${
    c.price !== undefined ? ` Last price ${fmtPrice.value(c.price)}.` : ''} Largest resting size now at ${fmtPrice.value(props.levels[r] ?? 0)}.`
})

let ro: ResizeObserver | undefined
onMounted(() => {
  mounted.value = true
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
          <motion.rect
            :key="version"
            x="0"
            y="0"
            :width="right"
            :height="props.height"
            :style="{ originX: 0 }"
            :initial="{ scaleX: 0 }"
            :animate="{ scaleX: 1 }"
            :transition="orInstant(REVEAL)"
          />
        </clipPath>
      </defs>

      <rect x="0" :y="TOP" :width="right" :height="bottom - TOP" class="fill-muted/40" />

      <g :clip-path="`url(#${uid}-clip)`">
        <motion.g :style="{ x: slide }">
          <rect
            v-for="c in cells.list"
            :key="c.key"
            :x="c.x"
            :y="c.y"
            :width="cells.w"
            :height="cells.h"
            :style="{ fill: cellColor(c.side) }"
            :fill-opacity="c.o"
          />
          <path
            v-if="trace"
            :d="trace"
            fill="none"
            class="stroke-background"
            stroke-width="4"
            stroke-linejoin="round"
            stroke-linecap="round"
            opacity="0.7"
          />
          <path
            v-if="trace"
            :d="trace"
            fill="none"
            class="stroke-foreground"
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <text
            v-for="t in mounted ? timeTicks : []"
            :key="`t-${t.key}`"
            :x="t.x"
            :y="bottom + 15"
            text-anchor="middle"
            class="fill-muted-foreground text-[11px] tabular-nums"
          >{{ t.label }}</text>
        </motion.g>
      </g>

      <!-- axis -->
      <g class="text-[11px] tabular-nums">
        <text v-for="t in priceTicks" :key="t.v" :x="right + 8" :y="t.y" dy="0.32em" class="fill-muted-foreground">{{ fmtPrice(t.v) }}</text>
        <line :x1="right" :x2="right" :y1="TOP" :y2="bottom" class="stroke-border" />
        <line x1="0" :x2="right" :y1="bottom" :y2="bottom" class="stroke-border" />
      </g>

      <!-- last price -->
      <g v-if="last?.price !== undefined" class="text-[11px] font-semibold tabular-nums">
        <circle :cx="right - colW / 2" :cy="y(last.price)" r="3" class="fill-foreground stroke-background" stroke-width="1.5" />
        <rect :x="right + 2.5" :y="y(last.price) - 9" :width="AXIS_W - 5" height="18" rx="4" class="fill-foreground" />
        <text :x="right + 8" :y="y(last.price)" dy="0.32em" class="fill-background">{{ fmtPrice(last.price) }}</text>
      </g>

      <!-- hovered cell -->
      <rect
        v-if="hovered"
        :x="hovered.x + 0.5"
        :y="hovered.y + 0.5"
        :width="Math.max(1, colW - 1)"
        :height="Math.max(1, rowH - 1)"
        rx="1"
        fill="none"
        class="pointer-events-none stroke-foreground"
        stroke-width="1.25"
      />

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
          class="whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          :class="[tip.flipX && '-translate-x-full', !tip.below && '-translate-y-full']"
        >
          <div class="flex items-center gap-2 text-muted-foreground tabular-nums">
            <span>{{ hovered.time }}</span>
            <span class="font-medium text-foreground">@ {{ hovered.price }}</span>
            <span v-if="hovered.side" class="inline-flex items-center gap-1">
              <span class="size-1.5 rounded-full" :class="hovered.side === 'Bid' ? 'bg-chart-1' : 'bg-destructive'" />{{ hovered.side }}
            </span>
          </div>
          <div class="mt-0.5 flex items-baseline gap-2 tabular-nums">
            <span class="text-sm font-semibold">{{ hovered.depth }}</span>
            <span class="text-muted-foreground">resting · {{ Math.round(hovered.share * 100) }}% of max</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
