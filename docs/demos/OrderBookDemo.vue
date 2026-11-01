<script setup lang="ts">
import type { BookLevel } from '@/ui/order-book'
import { OrderBook } from '@/ui/order-book'
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

const TICK = 0.05
const DEPTH = 14

// Prices are kept as integer ticks so levels compare exactly.
function market(seed: number) {
  const rand = rng(seed)
  let mid = Math.round(184.2 / TICK)
  const sizes = new Map<number, number>()
  const fresh = (distance: number) => Number(((0.2 + rand() * 2.4) * (rand() < 0.08 ? 4 : 1) * (1 + distance * 0.08)).toFixed(3))

  return (): { bids: BookLevel[], asks: BookLevel[] } => {
    if (rand() < 0.35)
      mid += rand() < 0.5 ? -1 : 1
    const half = rand() < 0.7 ? 1 : 2
    const levels = new Set<number>()
    for (let i = 0; i < DEPTH; i++) {
      levels.add(mid - half - i)
      levels.add(mid + half + i)
    }
    for (const k of sizes.keys()) {
      if (!levels.has(k))
        sizes.delete(k)
    }
    for (const k of levels) {
      const distance = Math.abs(k - mid)
      const size = sizes.get(k)
      if (size === undefined)
        sizes.set(k, fresh(distance))
      else if (rand() < 0.3)
        sizes.set(k, Number(Math.max(0.05, size * (0.6 + rand() * 0.8)).toFixed(3)))
    }
    const level = (k: number) => ({ price: Math.round(k * TICK * 100) / 100, size: sizes.get(k)! })
    return {
      bids: [...levels].filter(k => k < mid).map(level),
      asks: [...levels].filter(k => k > mid).map(level),
    }
  }
}

let next = market(21)
const book = ref(next())
const live = ref(true)
const cumulative = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

function randomize() {
  next = market(Math.floor(Math.random() * 1e6))
  book.value = next()
}

onMounted(() => (timer = setInterval(() => live.value && (book.value = next()), 800)))
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="w-full max-w-sm rounded-xl border bg-card p-4">
    <OrderBook v-model:cumulative="cumulative" :bids="book.bids" :asks="book.asks" :rows="7" title="VLX / USD" />
    <div class="mt-3 flex justify-end gap-1.5">
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
</template>
