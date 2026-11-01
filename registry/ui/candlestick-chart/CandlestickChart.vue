<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { Candle } from './scale'
import { animate, motion, useMotionValue, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import { clamp, compactFormatter, defaultTimeFormatter, lerp, niceTicks, priceFormatter } from './scale'

const props = withDefaults(defineProps<{
  /** Candles, oldest first. Append to the array to stream new candles in. */
  data: Candle[]
  /** Chart height in px. Width follows the container. */
  height?: number
  /** How many candles fit in the viewport (the newest ones are shown). */
  visible?: number
  /** Show the volume pane under the price pane. */
  volume?: boolean
  /** Dashed line + axis label at the latest close. */
  lastPrice?: boolean
  /** Mouse wheel / trackpad zooms in and out, anchored at the newest candle. */
  zoomable?: boolean
  /** Decimals for prices. */
  precision?: number
  locale?: string
  /** Label for a candle's time (axis, crosshair and readout). */
  formatTime?: (time: Candle['time']) => string
  class?: HTMLAttributes['class']
}>(), {
  height: 360,
  visible: 60,
  volume: true,
  lastPrice: true,
  zoomable: false,
  precision: 2,
  locale: 'en-US',
})

// Tuning — easings / springs in one place.
const INTRO = { duration: 1.1, ease: [0.22, 1, 0.36, 1] } as const
const RESCALE = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const
const SLIDE = { type: 'spring', stiffness: 220, damping: 30 } as const

// Readable up / down text: the token pulled toward the foreground so it passes contrast in both themes.
const UP_INK = 'text-[color-mix(in_oklab,var(--chart-1)_65%,var(--foreground))]'
const DOWN_INK = 'text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]'

const AXIS_W = 64
const BOTTOM = 22
const GAP = 10
const MIN_VISIBLE = 12

const uid = `vx-candle-${useId()}`
const root = ref<HTMLElement>()
const width = ref(640)
const mounted = ref(false)
const prefersReduced = useReducedMotion()
// useReducedMotion() only settles after mount, so also read the media query directly: animations
// that start on mount get skipped too. Only transitions use it — `initial` must match the server render.
const reduce = computed(() => prefersReduced.value
  || (typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))

// --- viewport -------------------------------------------------------------
const zoom = ref(props.visible)
watch(() => props.visible, v => (zoom.value = v))
const count = computed(() => Math.max(1, Math.min(Math.round(zoom.value), props.data.length)))
const start = computed(() => props.data.length - count.value)
const windowed = computed(() => props.data.slice(start.value))

const top = computed(() => (width.value < 480 ? 44 : 30))
const layout = computed(() => {
  const right = Math.max(40, width.value - AXIS_W)
  const inner = props.height - top.value - BOTTOM
  const priceBottom = top.value + (props.volume ? inner * 0.76 : inner)
  return {
    right,
    priceTop: top.value,
    priceBottom,
    volTop: priceBottom + GAP,
    volBottom: props.height - BOTTOM,
  }
})
const slotW = computed(() => layout.value.right / count.value)

// --- formatting -------------------------------------------------------------
const fmtPrice = computed(() => priceFormatter(props.locale, props.precision))
const fmtVol = computed(() => compactFormatter(props.locale))
const fmtTime = computed(() => {
  if (props.formatTime)
    return props.formatTime
  const [a, b] = props.data.slice(-2)
  const spacing = typeof a?.time === 'number' && typeof b?.time === 'number' ? b.time - a.time : 6e4
  return defaultTimeFormatter(props.locale, spacing)
})

// --- y domain, tweened so live updates rescale smoothly ----------------------
const target = computed(() => {
  let lo = Infinity
  let hi = -Infinity
  let vmax = 0
  for (const c of windowed.value) {
    lo = Math.min(lo, c.low)
    hi = Math.max(hi, c.high)
    vmax = Math.max(vmax, c.volume ?? 0)
  }
  if (!Number.isFinite(lo)) {
    lo = 0
    hi = 1
  }
  const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.01 || 1
  return { lo: lo - pad, hi: hi + pad, vmax: vmax || 1 }
})
const domain = ref({ ...target.value })
let domainAnim: { stop: () => void } | undefined
watch(target, (to) => {
  domainAnim?.stop()
  if (reduce.value || !mounted.value) {
    domain.value = { ...to }
    return
  }
  const from = { ...domain.value }
  domainAnim = animate(0, 1, {
    ...RESCALE,
    onUpdate: (p: number) => {
      domain.value = { lo: lerp(from.lo, to.lo, p), hi: lerp(from.hi, to.hi, p), vmax: lerp(from.vmax, to.vmax, p) }
    },
  })
})

const y = (v: number) => {
  const { lo, hi } = domain.value
  const { priceTop, priceBottom } = layout.value
  return priceBottom - ((v - lo) / (hi - lo || 1)) * (priceBottom - priceTop)
}
const priceAt = (py: number) => {
  const { lo, hi } = domain.value
  const { priceTop, priceBottom } = layout.value
  return lo + ((priceBottom - py) / (priceBottom - priceTop)) * (hi - lo)
}

// --- intro + slide-in --------------------------------------------------------
const intro = ref(0)
let introAnim: { stop: () => void } | undefined
function playIntro() {
  introAnim?.stop()
  if (reduce.value) {
    intro.value = 1
    return
  }
  intro.value = 0
  introAnim = animate(0, 1, { ...INTRO, onUpdate: (v: number) => (intro.value = v) })
}
// Each candle grows in a little after its left neighbour.
function reveal(slot: number) {
  if (intro.value >= 1)
    return 1
  const spread = 8
  return clamp((intro.value * (count.value + spread) - slot) / spread, 0, 1)
}

// New candles push the whole series left by one slot; the group springs back to 0.
const slide = useMotionValue(0)
let last: { time: Candle['time'], open: number } | undefined
watch(
  () => {
    const c = props.data.at(-1)
    return c ? `${c.time}|${c.open}` : ''
  },
  () => {
    const c = props.data.at(-1)
    const prev = last
    last = c && { time: c.time, open: c.open }
    if (!prev || !c || !mounted.value)
      return
    const i = props.data.findIndex(d => d.time === prev.time)
    const continued = i !== -1 && props.data[i]!.open === prev.open
    if (!continued || i < props.data.length - 3)
      return playIntro()
    if (reduce.value)
      return
    slide.jump(slide.get() + slotW.value * (props.data.length - 1 - i))
    animate(slide, 0, SLIDE)
  },
  { immediate: true },
)

// --- geometry -----------------------------------------------------------------
const candles = computed(() => {
  const from = Math.max(0, start.value - 1) // one extra on the left, revealed while sliding
  const sw = slotW.value
  const bodyW = Math.max(1, Math.min(sw * 0.64, 18))
  const { volBottom, volTop } = layout.value
  const volH = volBottom - volTop
  return props.data.slice(from).map((c, k) => {
    const slot = from + k - start.value
    const p = reveal(Math.max(0, slot))
    const up = c.close >= c.open
    const cx = (slot + 0.5) * sw
    // The body grows from the open towards the close; the wick unfolds from the body's middle.
    const yOpen = y(c.open)
    const yClose = y(lerp(c.open, c.close, p))
    const mid = (c.open + c.close) / 2
    const vh = ((c.volume ?? 0) / domain.value.vmax) * volH * p
    return {
      key: c.time,
      up,
      cx,
      bodyX: cx - bodyW / 2,
      bodyW,
      bodyY: Math.min(yOpen, yClose),
      bodyH: Math.max(1, Math.abs(yClose - yOpen)),
      wickTop: y(lerp(mid, c.high, p)),
      wickBottom: y(lerp(mid, c.low, p)),
      volY: volBottom - vh,
      volH: vh,
      opacity: p,
    }
  })
})

const priceTicks = computed(() => {
  const { priceTop, priceBottom } = layout.value
  const n = Math.max(3, Math.floor((priceBottom - priceTop) / 46))
  return niceTicks(domain.value.lo, domain.value.hi, n)
    .map(v => ({ v, y: y(v) }))
    .filter(t => t.y > priceTop + 6 && t.y < priceBottom - 4)
})

// Time labels hang off "round" candles so they slide with the data instead of hopping.
const timeTicks = computed(() => {
  const per = Math.max(1, Math.ceil(90 / slotW.value))
  const right = layout.value.right
  return candles.value
    .map((c, k) => ({ ...c, raw: props.data[Math.max(0, start.value - 1) + k]! }))
    .filter((c) => {
      const t = c.raw.time
      const n = typeof t === 'number' && props.data.length > 1
        ? Math.round(t / Math.max(1, Math.abs((props.data[1]!.time as number) - (props.data[0]!.time as number))))
        : props.data.indexOf(c.raw)
      return n % per === 0 && c.cx > 22 && c.cx < right - 22
    })
    .map(c => ({ key: c.key, x: c.cx, label: fmtTime.value(c.raw.time) }))
})

const lastCandle = computed(() => props.data.at(-1))
const lastY = computed(() => (lastCandle.value ? y(lastCandle.value.close) : 0))
const lastUp = computed(() => !lastCandle.value || lastCandle.value.close >= lastCandle.value.open)

// --- crosshair ------------------------------------------------------------------
// Pointer position in px; the hovered slot is derived, so zooming keeps it under the pointer.
const hover = ref<{ x: number, y: number | null } | null>(null)
const hoverSlot = computed(() => (hover.value ? clamp(Math.floor(hover.value.x / slotW.value), 0, count.value - 1) : -1))
function onMove(e: PointerEvent) {
  const r = (e.currentTarget as Element).getBoundingClientRect()
  const py = e.clientY - r.top
  const { priceTop, priceBottom } = layout.value
  hover.value = { x: e.clientX - r.left, y: py >= priceTop && py <= priceBottom ? py : null }
}
function onKey(e: KeyboardEvent) {
  const step = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[e.key]
  if (e.key === 'Escape')
    hover.value = null
  if (step === undefined)
    return
  e.preventDefault()
  const from = hover.value ? hoverSlot.value : count.value - 1
  hover.value = { x: (clamp(from + step, 0, count.value - 1) + 0.5) * slotW.value, y: null }
}
function onWheel(e: WheelEvent) {
  if (!props.zoomable || props.data.length <= MIN_VISIBLE)
    return
  e.preventDefault()
  zoom.value = clamp(zoom.value * Math.exp(e.deltaY * 0.0015), MIN_VISIBLE, props.data.length)
}

const active = computed(() => windowed.value[hoverSlot.value] ?? lastCandle.value)
const readout = computed(() => {
  const c = active.value
  if (!c)
    return undefined
  const i = props.data.indexOf(c)
  const prevClose = i > 0 ? props.data[i - 1]!.close : c.open
  // Round first so a tiny move doesn't read as "-0.00%".
  const change = Number((((c.close - prevClose) / (prevClose || 1)) * 100).toFixed(2)) || 0
  return {
    up: c.close >= c.open,
    time: fmtTime.value(c.time),
    values: [['O', c.open], ['H', c.high], ['L', c.low], ['C', c.close]] as const,
    change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
    volume: c.volume,
  }
})

const crosshairX = computed(() => (hoverSlot.value + 0.5) * slotW.value)

const summary = computed(() => {
  const d = props.data
  if (!d.length)
    return 'Candlestick chart with no data'
  const first = d[0]!.open
  const lastClose = d.at(-1)!.close
  const pct = ((lastClose - first) / (first || 1)) * 100
  const lo = Math.min(...d.map(c => c.low))
  const hi = Math.max(...d.map(c => c.high))
  return `Candlestick chart of ${d.length} periods. Last close ${fmtPrice.value(lastClose)}, ${pct >= 0 ? 'up' : 'down'} ${Math.abs(pct).toFixed(2)}% over the period. Range ${fmtPrice.value(lo)} to ${fmtPrice.value(hi)}.`
})

let ro: ResizeObserver | undefined
onMounted(() => {
  mounted.value = true
  ro = new ResizeObserver(([entry]) => {
    if (entry)
      width.value = Math.max(260, Math.round(entry.contentRect.width))
  })
  ro.observe(root.value!)
  playIntro()
})
onBeforeUnmount(() => {
  ro?.disconnect()
  introAnim?.stop()
  domainAnim?.stop()
})
</script>

<template>
  <div
    ref="root"
    tabindex="0"
    :class="cn('relative w-full rounded-md text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50', props.class)"
    @keydown="onKey"
    @blur="hover = null"
  >
    <!-- OHLC readout: the hovered candle, or the latest one -->
    <div
      v-if="readout"
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-1 top-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs tabular-nums"
    >
      <span v-if="mounted" class="text-muted-foreground">{{ readout.time }}</span>
      <span v-for="[k, v] in readout.values" :key="k">
        <span class="text-muted-foreground">{{ k }}</span>
        <span class="ml-1 font-medium">{{ fmtPrice(v) }}</span>
      </span>
      <span class="font-medium" :class="readout.change.startsWith('-') ? DOWN_INK : UP_INK">{{ readout.change }}</span>
      <span v-if="props.volume && readout.volume !== undefined">
        <span class="text-muted-foreground">Vol</span>
        <span class="ml-1 font-medium">{{ fmtVol(readout.volume) }}</span>
      </span>
    </div>

    <svg
      :width="width"
      :height="props.height"
      :viewBox="`0 0 ${width} ${props.height}`"
      role="img"
      :aria-label="summary"
      class="block touch-pan-y select-none overflow-visible"
    >
      <defs>
        <clipPath :id="`${uid}-clip`">
          <rect x="0" y="0" :width="layout.right" :height="props.height" />
        </clipPath>
      </defs>

      <!-- grid + price axis -->
      <g class="text-[11px] tabular-nums">
        <g v-for="t in priceTicks" :key="t.v">
          <line x1="0" :x2="layout.right" :y1="t.y" :y2="t.y" class="stroke-border" stroke-dasharray="2 4" />
          <text :x="layout.right + 8" :y="t.y" dy="0.32em" class="fill-muted-foreground">{{ fmtPrice(t.v) }}</text>
        </g>
        <line x1="0" :x2="layout.right" :y1="layout.priceBottom" :y2="layout.priceBottom" class="stroke-border" />
        <line :x1="layout.right" :x2="layout.right" :y1="layout.priceTop - 8" :y2="layout.volBottom" class="stroke-border" />
        <line v-if="props.volume" x1="0" :x2="layout.right" :y1="layout.volBottom" :y2="layout.volBottom" class="stroke-border" />
      </g>

      <!-- candles, volume and time labels slide together -->
      <g :clip-path="`url(#${uid}-clip)`">
        <motion.g :style="{ x: slide }">
          <template v-if="props.volume">
            <rect
              v-for="c in candles"
              :key="`v-${c.key}`"
              :x="c.bodyX"
              :y="c.volY"
              :width="c.bodyW"
              :height="c.volH"
              rx="1"
              :class="c.up ? 'fill-chart-1/35' : 'fill-destructive/35'"
            />
          </template>
          <g v-for="c in candles" :key="c.key" :class="c.up ? 'fill-chart-1 stroke-chart-1' : 'fill-destructive stroke-destructive'" :opacity="c.opacity">
            <line :x1="c.cx" :x2="c.cx" :y1="c.wickTop" :y2="c.wickBottom" stroke-width="1" />
            <rect :x="c.bodyX" :y="c.bodyY" :width="c.bodyW" :height="c.bodyH" rx="1" stroke="none" />
          </g>
          <text
            v-for="t in mounted ? timeTicks : []"
            :key="`t-${t.key}`"
            :x="t.x"
            :y="layout.volBottom + 15"
            text-anchor="middle"
            class="fill-muted-foreground text-[11px] tabular-nums"
          >{{ t.label }}</text>
        </motion.g>
      </g>

      <!-- last price -->
      <g v-if="props.lastPrice && lastCandle && intro > 0.6" :class="lastUp ? 'stroke-chart-1' : 'stroke-destructive'">
        <line x1="0" :x2="layout.right" :y1="lastY" :y2="lastY" stroke-dasharray="3 3" stroke-width="1" opacity="0.8" />
        <rect :x="layout.right + 2.5" :y="lastY - 9" :width="AXIS_W - 5" height="18" rx="4" class="fill-background" />
        <rect :x="layout.right + 2.5" :y="lastY - 9" :width="AXIS_W - 5" height="18" rx="4" :class="lastUp ? 'fill-chart-1/20' : 'fill-destructive/20'" />
        <text :x="layout.right + 8" :y="lastY" dy="0.32em" stroke="none" class="fill-foreground text-[11px] font-semibold tabular-nums">
          {{ fmtPrice(lastCandle.close) }}
        </text>
      </g>

      <!-- crosshair -->
      <g v-if="hover" class="pointer-events-none">
        <line :x1="crosshairX" :x2="crosshairX" :y1="layout.priceTop - 8" :y2="layout.volBottom" class="stroke-muted-foreground" stroke-dasharray="3 3" />
        <template v-if="hover.y !== null">
          <line x1="0" :x2="layout.right" :y1="hover.y" :y2="hover.y" class="stroke-muted-foreground" stroke-dasharray="3 3" />
          <rect :x="layout.right + 2" :y="hover.y - 9" :width="AXIS_W - 4" height="18" rx="4" class="fill-foreground" />
          <text :x="layout.right + 8" :y="hover.y" dy="0.32em" class="fill-background text-[11px] font-medium tabular-nums">
            {{ fmtPrice(priceAt(hover.y)) }}
          </text>
        </template>
        <g v-if="mounted && active">
          <rect :x="clamp(crosshairX - 34, 0, layout.right - 68)" :y="layout.volBottom + 3" width="68" height="17" rx="4" class="fill-foreground" />
          <text :x="clamp(crosshairX, 34, layout.right - 34)" :y="layout.volBottom + 11.5" dy="0.32em" text-anchor="middle" class="fill-background text-[11px] font-medium tabular-nums">
            {{ fmtTime(active.time) }}
          </text>
        </g>
      </g>

      <rect
        x="0"
        :y="layout.priceTop - 8"
        :width="layout.right"
        :height="layout.volBottom - layout.priceTop + 8"
        fill="transparent"
        class="cursor-crosshair"
        @pointermove="onMove"
        @pointerleave="hover = null"
        @wheel="onWheel"
      />
    </svg>
  </div>
</template>
