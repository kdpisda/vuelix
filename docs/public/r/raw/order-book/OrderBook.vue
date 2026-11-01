<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { BookLevel, LadderRow } from './book'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { ladder, sweep } from './book'

const props = withDefaults(defineProps<{
  /** Buy orders — any order; the best (highest) prices are shown. */
  bids: BookLevel[]
  /** Sell orders — any order; the best (lowest) prices are shown. */
  asks: BookLevel[]
  /** Levels shown per side. */
  rows?: number
  /** Heading shown above the ladder. */
  title?: string
  /** Show the built-in level / cumulative switch. */
  toggle?: boolean
  /** Decimals for prices. */
  precision?: number
  /** Decimals for sizes. */
  sizePrecision?: number
  locale?: string
  class?: HTMLAttributes['class']
}>(), {
  rows: 8,
  title: 'Order book',
  toggle: true,
  precision: 2,
  sizePrecision: 3,
  locale: 'en-US',
})

/** Depth bars show each level's own size (`false`) or the running total from the spread (`true`). */
const cumulative = defineModel<boolean>('cumulative', { default: false })

const BAR = { type: 'spring', stiffness: 300, damping: 32 } as const
const TIP = { type: 'spring', stiffness: 520, damping: 40, mass: 0.6 } as const
const FLASH_S = 0.7

// Readable "up" / "down" ink: the token pulled toward the foreground, so it passes contrast in both themes.
const BID_INK = 'text-[color-mix(in_oklab,var(--chart-1)_65%,var(--foreground))]'
const ASK_INK = 'text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]'

const prefersReduced = useReducedMotion()
// useReducedMotion() only settles after mount, so also read the media query directly: animations
// that start on mount get skipped too. Only transitions use it — `initial` must match the server render.
const reduce = computed(() => prefersReduced.value
  || (typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
const orInstant = <T>(t: T) => (reduce.value ? { duration: 0 } : t)
const settled = ref(false)

const fmtPrice = computed(() => {
  const f = new Intl.NumberFormat(props.locale, { minimumFractionDigits: props.precision, maximumFractionDigits: props.precision })
  return (v: number) => f.format(v)
})
const fmtSize = computed(() => {
  const f = new Intl.NumberFormat(props.locale, { minimumFractionDigits: props.sizePrecision, maximumFractionDigits: props.sizePrecision })
  return (v: number) => f.format(v)
})

const bidRows = computed(() => ladder(props.bids, 'bid', props.rows))
const askRows = computed(() => ladder(props.asks, 'ask', props.rows))

// Bars share one scale across both sides so they're comparable.
const scale = computed(() => cumulative.value
  ? Math.max(bidRows.value.at(-1)?.total ?? 0, askRows.value.at(-1)?.total ?? 0) || 1
  : Math.max(...bidRows.value.map(r => r.size), ...askRows.value.map(r => r.size), 0) || 1)
const barOf = (r: LadderRow) => (cumulative.value ? r.total : r.size) / scale.value

const bestBid = computed(() => bidRows.value[0]?.price)
const bestAsk = computed(() => askRows.value[0]?.price)
const mid = computed(() => (bestBid.value !== undefined && bestAsk.value !== undefined ? (bestBid.value + bestAsk.value) / 2 : bestBid.value ?? bestAsk.value))
const spread = computed(() => (bestBid.value !== undefined && bestAsk.value !== undefined ? bestAsk.value - bestBid.value : undefined))

const midTrend = ref<'up' | 'down' | null>(null)
watch(mid, (now, before) => {
  if (now !== undefined && before !== undefined && now !== before)
    midTrend.value = now > before ? 'up' : 'down'
})

const bidTotal = computed(() => bidRows.value.at(-1)?.total ?? 0)
const askTotal = computed(() => askRows.value.at(-1)?.total ?? 0)
const bidShare = computed(() => bidTotal.value / ((bidTotal.value + askTotal.value) || 1))

// --- flashes -------------------------------------------------------------------------------
// Every time a level's size changes, its flash counter bumps; the counter is part of the
// overlay's key, so a fresh overlay mounts and fades out.
const flashes = ref<Record<string, { n: number, grew: boolean }>>({})
let previous = new Map<string, number>()
watch([bidRows, askRows], ([bids, asks]) => {
  const next = new Map<string, number>()
  const out: Record<string, { n: number, grew: boolean }> = {}
  for (const [side, rows] of [['bid', bids], ['ask', asks]] as const) {
    for (const r of rows) {
      const key = `${side}:${r.price}`
      next.set(key, r.size)
      const before = previous.get(key)
      const old = flashes.value[key]
      out[key] = old ?? { n: 0, grew: true }
      if (settled.value && before !== r.size)
        out[key] = { n: (old?.n ?? 0) + 1, grew: before === undefined || r.size > before }
    }
  }
  previous = next
  flashes.value = out
}, { immediate: true })

// Asks are listed worst-first so the best ask sits right above the spread; pad to keep the ladder still.
const askSlots = computed(() => {
  const rows: (LadderRow | null)[] = [...askRows.value]
  while (rows.length < props.rows) rows.push(null)
  return rows.map((row, i) => ({ row, i })).reverse()
})
const bidSlots = computed(() => {
  const rows: (LadderRow | null)[] = [...bidRows.value]
  while (rows.length < props.rows) rows.push(null)
  return rows.map((row, i) => ({ row, i }))
})

// --- hover: sweep from the spread to the hovered level -------------------------------------
const hover = ref<{ side: 'bid' | 'ask', index: number, y: number } | null>(null)
function onEnter(side: 'bid' | 'ask', index: number, e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  hover.value = { side, index, y: side === 'ask' ? el.offsetTop - 6 : el.offsetTop + el.offsetHeight + 6 }
}
const inSweep = (side: 'bid' | 'ask', index: number) => hover.value?.side === side && index <= hover.value.index
const readout = computed(() => {
  const h = hover.value
  if (!h)
    return null
  const rows = h.side === 'bid' ? bidRows.value : askRows.value
  if (!rows[h.index])
    return null
  const s = sweep(rows, h.index)
  return { ...s, side: h.side, levels: h.index + 1 }
})

const summary = computed(() => {
  const parts = [`${props.title}: ${bidRows.value.length} bid and ${askRows.value.length} ask levels.`]
  if (bestBid.value !== undefined)
    parts.push(`Best bid ${fmtPrice.value(bestBid.value)}.`)
  if (bestAsk.value !== undefined)
    parts.push(`Best ask ${fmtPrice.value(bestAsk.value)}.`)
  if (spread.value !== undefined)
    parts.push(`Spread ${fmtPrice.value(spread.value)}.`)
  parts.push(`Bids hold ${Math.round(bidShare.value * 100)}% of the displayed size.`)
  return parts.join(' ')
})

let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => (timer = setTimeout(() => (settled.value = true), 900)))
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div
    :class="cn('relative w-full select-none text-xs text-foreground tabular-nums', props.class)"
    @pointerleave="hover = null"
  >
    <!-- header -->
    <div class="mb-2 flex items-center justify-between gap-2">
      <span class="text-sm font-semibold">{{ props.title }}</span>
      <div v-if="props.toggle" class="inline-flex rounded-md bg-muted p-0.5" role="group" aria-label="Depth bars">
        <button
          v-for="opt in [{ v: false, label: 'Level' }, { v: true, label: 'Cumulative' }]"
          :key="opt.label"
          type="button"
          class="rounded px-2 py-0.5 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :class="cumulative === opt.v ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          :aria-pressed="cumulative === opt.v"
          @click="cumulative = opt.v"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- buy / sell balance -->
    <div class="mb-2" aria-hidden="true">
      <div class="mb-1 flex justify-between text-[11px] font-medium">
        <span :class="BID_INK">B {{ Math.round(bidShare * 100) }}%</span>
        <span :class="ASK_INK">{{ 100 - Math.round(bidShare * 100) }}% S</span>
      </div>
      <div class="flex h-1.5 overflow-hidden rounded-full bg-destructive/70">
        <motion.div
          class="h-full rounded-r-full bg-chart-1"
          :initial="{ width: '50%' }"
          :animate="{ width: `${bidShare * 100}%` }"
          :transition="orInstant(BAR)"
        />
      </div>
    </div>

    <div role="table" :aria-label="summary">
      <div role="row" class="grid grid-cols-3 px-2 pb-1 text-[11px] text-muted-foreground">
        <span role="columnheader">Price</span>
        <span role="columnheader" class="text-right">Size</span>
        <span role="columnheader" class="text-right">Total</span>
      </div>

      <!-- asks -->
      <div role="rowgroup">
        <div
          v-for="{ row, i } in askSlots"
          :key="`a${i}`"
          :role="row ? 'row' : undefined"
          class="relative grid h-6 grid-cols-3 items-center rounded-sm px-2 transition-colors"
          :class="row && inSweep('ask', i) && 'bg-muted'"
          @pointerenter="row ? onEnter('ask', i, $event) : (hover = null)"
        >
          <template v-if="row">
            <motion.div
              aria-hidden="true"
              class="absolute inset-y-0.5 right-0 w-full rounded-sm bg-destructive/15"
              :style="{ originX: 1 }"
              :initial="{ scaleX: 0 }"
              :animate="{ scaleX: barOf(row) }"
              :transition="orInstant(settled ? BAR : { ...BAR, delay: (props.rows - i) * 0.03 })"
            />
            <motion.div
              v-if="flashes[`ask:${row.price}`]?.n"
              :key="`f${row.price}-${flashes[`ask:${row.price}`]!.n}`"
              aria-hidden="true"
              class="absolute inset-0 rounded-sm"
              :class="flashes[`ask:${row.price}`]!.grew ? 'bg-destructive/30' : 'bg-foreground/10'"
              :initial="{ opacity: 1 }"
              :animate="{ opacity: 0 }"
              :transition="orInstant({ duration: FLASH_S, ease: 'easeOut' })"
            />
            <span role="cell" class="relative font-medium" :class="ASK_INK">{{ fmtPrice(row.price) }}</span>
            <span role="cell" class="relative text-right">{{ fmtSize(row.size) }}</span>
            <span role="cell" class="relative text-right text-muted-foreground">{{ fmtSize(row.total) }}</span>
          </template>
        </div>
      </div>

      <!-- spread -->
      <div role="row" class="my-1 flex items-center justify-between gap-2 border-y px-2 py-1.5" @pointerenter="hover = null">
        <span role="cell" class="flex items-center gap-1 text-base font-semibold" :class="midTrend === 'up' ? BID_INK : midTrend === 'down' ? ASK_INK : ''">
          {{ mid !== undefined ? fmtPrice(mid) : '—' }}
          <svg v-if="midTrend" viewBox="0 0 10 10" class="size-2.5 fill-current transition-transform" :class="midTrend === 'down' && 'rotate-180'" aria-hidden="true"><path d="M5 1.5 9 8H1z" /></svg>
        </span>
        <span role="cell" class="text-[11px] text-muted-foreground">
          Spread <span class="font-medium text-foreground">{{ spread !== undefined ? fmtPrice(spread) : '—' }}</span>
          <template v-if="spread !== undefined && mid">{{ ` (${((spread / mid) * 100).toFixed(3)}%)` }}</template>
        </span>
      </div>

      <!-- bids -->
      <div role="rowgroup">
        <div
          v-for="{ row, i } in bidSlots"
          :key="`b${i}`"
          :role="row ? 'row' : undefined"
          class="relative grid h-6 grid-cols-3 items-center rounded-sm px-2 transition-colors"
          :class="row && inSweep('bid', i) && 'bg-muted'"
          @pointerenter="row ? onEnter('bid', i, $event) : (hover = null)"
        >
          <template v-if="row">
            <motion.div
              aria-hidden="true"
              class="absolute inset-y-0.5 right-0 w-full rounded-sm bg-chart-1/15"
              :style="{ originX: 1 }"
              :initial="{ scaleX: 0 }"
              :animate="{ scaleX: barOf(row) }"
              :transition="orInstant(settled ? BAR : { ...BAR, delay: i * 0.03 })"
            />
            <motion.div
              v-if="flashes[`bid:${row.price}`]?.n"
              :key="`f${row.price}-${flashes[`bid:${row.price}`]!.n}`"
              aria-hidden="true"
              class="absolute inset-0 rounded-sm"
              :class="flashes[`bid:${row.price}`]!.grew ? 'bg-chart-1/30' : 'bg-foreground/10'"
              :initial="{ opacity: 1 }"
              :animate="{ opacity: 0 }"
              :transition="orInstant({ duration: FLASH_S, ease: 'easeOut' })"
            />
            <span role="cell" class="relative font-medium" :class="BID_INK">{{ fmtPrice(row.price) }}</span>
            <span role="cell" class="relative text-right">{{ fmtSize(row.size) }}</span>
            <span role="cell" class="relative text-right text-muted-foreground">{{ fmtSize(row.total) }}</span>
          </template>
        </div>
      </div>
    </div>

    <AnimatePresence>
      <motion.div
        v-if="hover && readout"
        key="tip"
        aria-hidden="true"
        class="pointer-events-none absolute left-0 top-0 z-10"
        :initial="{ opacity: 0, scale: 0.96, x: 8, y: hover.y }"
        :animate="{ opacity: 1, scale: 1, x: 8, y: hover.y }"
        :exit="{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }"
        :transition="reduce ? { duration: 0 } : TIP"
      >
        <div
          class="whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-popover-foreground shadow-md"
          :class="readout.side === 'ask' && '-translate-y-full'"
        >
          <div class="text-muted-foreground">
            {{ readout.side === 'ask' ? 'Buying through' : 'Selling through' }} {{ readout.levels }} level{{ readout.levels > 1 ? 's' : '' }}
          </div>
          <div class="mt-0.5 flex gap-3">
            <span><span class="text-muted-foreground">Avg</span> <span class="font-semibold">{{ fmtPrice(readout.average) }}</span></span>
            <span><span class="text-muted-foreground">Size</span> <span class="font-semibold">{{ fmtSize(readout.size) }}</span></span>
            <span><span class="text-muted-foreground">Value</span> <span class="font-semibold">{{ fmtPrice(readout.notional) }}</span></span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
