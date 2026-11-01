<script setup lang="ts">
import type { BarChartSeries } from '@/components/ui/bar-chart'
import { AnimatedTabs } from '@/components/ui/animated-tabs'
import { BarChart } from '@/components/ui/bar-chart'
import { SpringButton } from '@/components/ui/spring-button'
import { Shuffle } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026']
const series = ref<BarChartSeries[]>([
  { name: 'Starter', data: [124, 138, 151, 149, 168, 182] },
  { name: 'Team', data: [86, 97, 118, 131, 142, 160] },
  { name: 'Enterprise', data: [32, 38, 41, 52, 61, 74] },
])

const layout = ref('grouped')
const mode = computed(() => (layout.value === 'grouped' ? 'grouped' : 'stacked'))
const orientation = computed(() => (layout.value === 'horizontal' ? 'horizontal' : 'vertical'))

function randomize() {
  series.value = series.value.map(s => ({
    ...s,
    data: s.data.map(v => Math.max(12, Math.round(v * (0.65 + Math.random() * 0.7)))),
  }))
}
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4 sm:p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-medium">
          New subscriptions by plan
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          Last six quarters
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AnimatedTabs
          v-model="layout"
          :items="[
            { value: 'grouped', label: 'Grouped' },
            { value: 'stacked', label: 'Stacked' },
            { value: 'horizontal', label: 'Horizontal' },
          ]"
        />
        <SpringButton size="sm" variant="outline" aria-label="Randomize data" @click="randomize">
          <Shuffle class="size-3.5" />
        </SpringButton>
      </div>
    </div>
    <BarChart
      :labels="quarters"
      :series="series"
      :mode="mode"
      :orientation="orientation"
      :height="orientation === 'horizontal' ? 300 : 260"
      show-values
    />
  </div>
</template>
