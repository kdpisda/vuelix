<script setup lang="ts">
import type { FunnelChartStage } from '@/ui/funnel-chart'
import { AnimatedTabs } from '@/ui/animated-tabs'
import { FunnelChart } from '@/ui/funnel-chart'
import { SpringButton } from '@/ui/spring-button'
import { Shuffle } from 'lucide-vue-next'
import { ref } from 'vue'

const stages = ref<FunnelChartStage[]>([
  { label: 'Visited site', value: 48200 },
  { label: 'Viewed pricing', value: 21900 },
  { label: 'Started trial', value: 8400 },
  { label: 'Activated', value: 5100 },
  { label: 'Subscribed', value: 1870 },
])
const orientation = ref<'horizontal' | 'vertical'>('horizontal')

function randomize() {
  let v = 30000 + Math.random() * 30000
  stages.value = stages.value.map((s, i) => ({
    ...s,
    value: Math.round(i === 0 ? v : (v *= 0.3 + Math.random() * 0.5)),
  }))
}
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4 sm:p-5">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-medium">
          Trial conversion
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          October 2026 cohort
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AnimatedTabs
          v-model="orientation"
          :items="[{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }]"
        />
        <SpringButton size="sm" variant="outline" aria-label="Randomize data" @click="randomize">
          <Shuffle class="size-3.5" />
        </SpringButton>
      </div>
    </div>
    <FunnelChart :key="orientation" :data="stages" :orientation="orientation" :height="orientation === 'vertical' ? 320 : 240" />
  </div>
</template>
