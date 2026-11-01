<script setup lang="ts">
import type { DonutChartDatum } from '@/ui/donut-chart'
import { DonutChart } from '@/ui/donut-chart'
import { SpringButton } from '@/ui/spring-button'
import { Shuffle } from 'lucide-vue-next'
import { ref } from 'vue'

const traffic = ref<DonutChartDatum[]>([
  { label: 'Direct', value: 4820 },
  { label: 'Search', value: 3610 },
  { label: 'Social', value: 2140 },
  { label: 'Email', value: 1290 },
  { label: 'Referral', value: 760 },
])

function randomize() {
  traffic.value = traffic.value.map(d => ({ ...d, value: Math.round(400 + Math.random() * 5200) }))
}
</script>

<template>
  <div class="w-full max-w-xl rounded-xl border bg-card p-5">
    <div class="mb-5 flex items-start justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-medium">
          Sessions by source
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          Last 30 days
        </p>
      </div>
      <SpringButton size="sm" variant="outline" @click="randomize">
        <Shuffle class="size-3.5" /> Randomize
      </SpringButton>
    </div>
    <DonutChart :data="traffic" center-label="Sessions" :size="220" />
  </div>
</template>
