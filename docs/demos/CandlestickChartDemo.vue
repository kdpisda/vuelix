<script setup lang="ts">
import type { Candle } from '@/ui/candlestick-chart'
import { CandlestickChart } from '@/ui/candlestick-chart'
import { Pause, Play, Shuffle } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// Small seeded PRNG so the server render and the first client render agree.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MINUTE = 60_000
const START = Date.UTC(2026, 2, 16, 13, 30)
let rand = rng(7)

function nextCandle(time: number, open: number): Candle {
  const close = open * (1 + (rand() - 0.49) * 0.012)
  return {
    time,
    open,
    close,
    high: Math.max(open, close) * (1 + rand() * 0.004),
    low: Math.min(open, close) * (1 - rand() * 0.004),
    volume: Math.round(800 + rand() * 2400 + Math.abs(close - open) * 900),
  }
}

function series(seed: number) {
  rand = rng(seed)
  const out: Candle[] = []
  let price = 184.2
  for (let i = 0; i < 90; i++) {
    const c = nextCandle(START + i * MINUTE, price)
    out.push(c)
    price = c.close
  }
  return out
}

const candles = ref<Candle[]>(series(7))
const live = ref(true)
let ticks = 0
let timer: ReturnType<typeof setInterval> | undefined

// Every second the forming candle moves; every fifth second a new one opens.
function tick() {
  const list = candles.value
  const last = list.at(-1)!
  if (++ticks % 5 === 0) {
    const fresh = nextCandle(Number(last.time) + MINUTE, last.close)
    fresh.close = fresh.open
    fresh.high = fresh.open
    fresh.low = fresh.open
    fresh.volume = 0
    candles.value = [...list.slice(-119), fresh]
    return
  }
  const close = last.close * (1 + (rand() - 0.49) * 0.004)
  list[list.length - 1] = {
    ...last,
    close,
    high: Math.max(last.high, close),
    low: Math.min(last.low, close),
    volume: (last.volume ?? 0) + Math.round(rand() * 600),
  }
}

function randomize() {
  ticks = 0
  candles.value = series(Math.floor(Math.random() * 1e6))
}

const last = computed(() => candles.value.at(-1)!)
const open = computed(() => candles.value[0]!.open)
const change = computed(() => (last.value.close - open.value) / open.value)
const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
const formatTime = (t: Candle['time']) => time.format(Number(t))

onMounted(() => (timer = setInterval(() => live.value && tick(), 1000)))
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-baseline gap-2">
        <span class="text-sm font-semibold">VLX / USD</span>
        <span class="text-xs text-muted-foreground">1m</span>
        <span class="text-lg font-semibold tabular-nums">{{ last.close.toFixed(2) }}</span>
        <span class="text-xs font-medium tabular-nums" :class="change >= 0 ? 'text-chart-1' : 'text-destructive'">
          {{ change >= 0 ? '+' : '' }}{{ (change * 100).toFixed(2) }}%
        </span>
      </div>
      <div class="flex gap-1.5">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
          :aria-pressed="live"
          @click="live = !live"
        >
          <component :is="live ? Pause : Play" class="size-3.5" />
          {{ live ? 'Live' : 'Paused' }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
          @click="randomize"
        >
          <Shuffle class="size-3.5" />
          Randomize
        </button>
      </div>
    </div>
    <CandlestickChart :data="candles" :visible="60" :height="340" :format-time="formatTime" zoomable />
    <p class="m-0 mt-2 text-xs text-muted-foreground">
      Hover for the crosshair, scroll over the chart to zoom.
    </p>
  </div>
</template>
