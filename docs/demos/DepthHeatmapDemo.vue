<script setup lang="ts">
import type { DepthColumn } from '@/components/ui/depth-heatmap'
import { DepthHeatmap } from '@/components/ui/depth-heatmap'
import { Pause, Play, Shuffle } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Seeded PRNG so the server render and the first client render agree.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const levels = Array.from({ length: 40 }, (_, i) => Math.round((98 + i * 0.1) * 100) / 100)
const START = Date.UTC(2026, 2, 16, 14, 0, 0)

// A tiny order-book simulator: liquidity thins out near the price, a few large "walls"
// rest at fixed levels and slowly decay, and the price drifts between them.
function simulator(seed: number) {
  const rand = rng(seed)
  let price = 100 + (rand() - 0.5)
  let walls = Array.from({ length: 5 }, () => ({ level: Math.floor(rand() * levels.length), size: 600 + rand() * 900 }))
  let t = START
  return (): DepthColumn => {
    price = Math.min(101.6, Math.max(98.4, price + (rand() - 0.5) * 0.12))
    walls = walls.map(w => (rand() < 0.03
      ? { level: Math.floor(rand() * levels.length), size: 500 + rand() * 1000 }
      : { ...w, size: w.size * (0.985 + rand() * 0.02) }))
    const depth = levels.map((level, i) => {
      const distance = Math.abs(level - price)
      const book = distance < 0.05 ? 0 : 140 * Math.min(1, distance * 1.4) + rand() * 90
      const wall = walls.reduce((s, w) => s + (Math.abs(w.level - i) <= 0 ? w.size : Math.abs(w.level - i) === 1 ? w.size * 0.25 : 0), 0)
      return Math.round(book + wall)
    })
    t += 1000
    return { time: t, depth, price: Math.round(price * 1000) / 1000 }
  }
}

let next = simulator(5)
const history = (n: number) => Array.from({ length: n }, () => next())
const columns = ref<DepthColumn[]>(history(64))
const live = ref(true)
const split = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

function randomize() {
  next = simulator(Math.floor(Math.random() * 1e6))
  columns.value = history(64)
}

const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' })
const formatTime = (t: DepthColumn['time']) => time.format(Number(t))

onMounted(() => {
  timer = setInterval(() => {
    if (live.value)
      columns.value = [...columns.value.slice(-63), next()]
  }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-semibold">
          VLX / USD · resting liquidity
        </p>
        <p class="m-0 flex items-center gap-1.5 text-xs text-muted-foreground">
          thin
          <span class="h-1.5 w-16 rounded-full bg-linear-to-r from-transparent to-chart-2 ring-1 ring-border" />
          deep
        </p>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          class="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
          :aria-pressed="split"
          @click="split = !split"
        >
          {{ split ? 'Single color' : 'Bids / asks' }}
        </button>
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
    <DepthHeatmap :levels="levels" :columns="columns" :visible="56" :height="320" :split="split" :format-time="formatTime" />
  </div>
</template>
