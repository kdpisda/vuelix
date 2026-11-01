<script setup lang="ts">
import type { StackedSeries } from '@/components/ui/stacked-area'
import { AnimatedTabs } from '@/components/ui/animated-tabs'
import { StackedArea } from '@/components/ui/stacked-area'
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

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const labels = Array.from({ length: 24 }, (_, i) => `${months[i % 12]} ${i < 12 ? '25' : '26'}`)

// Monthly visits per channel: a base level, a growth trend, some seasonality and noise.
const channels = [
  { name: 'Organic', base: 42_000, growth: 0.025 },
  { name: 'Direct', base: 24_000, growth: 0.012 },
  { name: 'Referral', base: 9_000, growth: 0.03 },
  { name: 'Social', base: 14_000, growth: -0.01 },
  { name: 'Paid', base: 6_000, growth: 0.06 },
]

function generate(seed: number): StackedSeries[] {
  const rand = rng(seed)
  return channels.map(c => ({
    name: c.name,
    values: labels.map((_, i) => {
      const season = 1 + 0.12 * Math.sin(((i % 12) / 12) * Math.PI * 2 - 1)
      return Math.round(c.base * (1 + c.growth) ** i * season * (0.88 + rand() * 0.24))
    }),
  }))
}

const seed = ref(3)
const series = computed(() => generate(seed.value))
const mode = ref<'stacked' | 'percent'>('stacked')
const hidden = ref<string[]>([])
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-semibold">
          Visits by channel
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          Click a legend item to isolate it, shift-click to toggle
        </p>
      </div>
      <div class="flex items-center gap-2">
        <AnimatedTabs
          :model-value="mode"
          :items="[{ value: 'stacked', label: 'Stacked' }, { value: 'percent', label: '100%' }]"
          @update:model-value="mode = $event as 'stacked' | 'percent'"
        />
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
          @click="seed = Math.floor(Math.random() * 1e6)"
        >
          <Shuffle class="size-3.5" />
          Randomize
        </button>
      </div>
    </div>
    <StackedArea v-model:mode="mode" v-model:hidden="hidden" :labels="labels" :series="series" :height="280" />
  </div>
</template>
