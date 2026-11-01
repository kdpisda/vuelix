<script setup lang="ts">
import type { ForecastTargets } from '@/ui/forecast-fan'
import { ForecastFan } from '@/ui/forecast-fan'
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

const DAY = 86_400_000
const START = Date.UTC(2026, 0, 2)
const HISTORY = 150
const HORIZON = 60
const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const labels = Array.from({ length: HISTORY }, (_, i) => date.format(START + i * DAY))
const futureLabels = Array.from({ length: HORIZON }, (_, i) => date.format(START + (HISTORY + i) * DAY))

// Six months of closes, then analyst-style targets three months out.
function scenario(seed: number) {
  const rand = rng(seed)
  const drift = (rand() - 0.4) * 0.004
  let price = 120 + rand() * 60
  const history = Array.from({ length: HISTORY }, () => (price *= 1 + drift + (rand() - 0.5) * 0.034))
  const median = price * (1 + (rand() - 0.35) * 0.18)
  const forecast: ForecastTargets = {
    median,
    high: median * (1.1 + rand() * 0.1),
    low: median * (0.84 + rand() * 0.06),
  }
  return { history, forecast }
}

const seed = ref(4)
const data = computed(() => scenario(seed.value))
const last = computed(() => data.value.history.at(-1)!)
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-semibold">
          VLX · 3-month price targets
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          Last close {{ last.toFixed(2) }} · scrub the chart to read the past or the forecast
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
    <ForecastFan
      :history="data.history"
      :forecast="data.forecast"
      :horizon="HORIZON"
      :labels="labels"
      :future-labels="futureLabels"
      now-label="Today"
      :height="300"
    />
  </div>
</template>
