<script setup lang="ts">
import type { BumpChartSeries } from '@/components/ui/bump-chart'
import { BumpChart } from '@/components/ui/bump-chart'
import { SpringButton } from '@/components/ui/spring-button'
import { Shuffle } from 'lucide-vue-next'
import { ref } from 'vue'

const seasons = ['2021', '2022', '2023', '2024', '2025', '2026']
const series = ref<BumpChartSeries[]>([
  { name: 'Lyon', ranks: [3, 2, 1, 1, 2, 1] },
  { name: 'Porto', ranks: [1, 1, 3, 2, 1, 3] },
  { name: 'Ajax', ranks: [2, 4, 2, 4, 3, 2] },
  { name: 'Celtic', ranks: [5, 3, 4, 3, 5, 4] },
  { name: 'Braga', ranks: [4, 5, 5, 5, 4, 5] },
])

function shuffle<T>(list: T[]) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

function randomize() {
  // A fresh ranking per season: shuffle positions 1…n for every column.
  const columns = seasons.map(() => shuffle(series.value.map((_, k) => k + 1)))
  series.value = series.value.map((s, k) => ({ ...s, ranks: columns.map(c => c[k]!) }))
}
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4 sm:p-5">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-medium">
          League standings
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          Final position per season
        </p>
      </div>
      <SpringButton size="sm" variant="outline" @click="randomize">
        <Shuffle class="size-3.5" /> Randomize
      </SpringButton>
    </div>
    <BumpChart :labels="seasons" :series="series" />
  </div>
</template>
