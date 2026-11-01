<script setup lang="ts">
import type { YearReturns } from '@/ui/returns-calendar'
import { ReturnsCalendar } from '@/ui/returns-calendar'
import { Shuffle } from 'lucide-vue-next'
import { computed, ref } from 'vue'

// Seeded PRNG so the server render and the first client render agree.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Monthly returns with a small positive drift, a calmer and a rougher regime,
// and the current year still in progress (Nov / Dec have no data yet).
function history(seed: number): YearReturns[] {
  const rand = rng(seed)
  const normal = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand())
  return Array.from({ length: 8 }, (_, i) => {
    const year = 2019 + i
    const volatility = i === 1 || i === 3 ? 6.5 : 3.6
    return {
      year,
      months: Array.from({ length: 12 }, (_, m) =>
        year === 2026 && m > 9 ? null : Math.round((0.9 + normal() * volatility) * 100) / 100),
    }
  })
}

const seed = ref(8)
const data = computed(() => history(seed.value))
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-semibold">
          Monthly returns · Global Equity Fund
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          Net of fees, in % · hover or use the arrow keys
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
        @click="seed = Math.floor(Math.random() * 1e6)"
      >
        <Shuffle class="size-3.5" />
        Randomize
      </button>
    </div>
    <ReturnsCalendar :data="data" />
  </div>
</template>
