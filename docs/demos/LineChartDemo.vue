<script setup lang="ts">
import type { LineChartSeries } from '@/ui/line-chart'
import { LineChart } from '@/ui/line-chart'
import { SpringButton } from '@/ui/spring-button'
import { Shuffle } from 'lucide-vue-next'
import { ref } from 'vue'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const series = ref<LineChartSeries[]>([
  { name: 'Organic', data: [4200, 4800, 5100, 4900, 6200, 7100, 6900, 7800, 8600, 8200, 9400, 10800] },
  { name: 'Paid', data: [2400, 2900, 3600, 4100, 3800, 4400, 5200, 4800, 5100, 6000, 5600, 6400] },
  { name: 'Referral', data: [900, 1100, 1300, 1250, 1700, 1600, 2100, 2500, 2300, 2900, 3300, 3100] },
])
const area = ref(true)

function randomize() {
  series.value = series.value.map((s) => {
    let v = 1000 + Math.random() * 5000
    return {
      ...s,
      data: months.map(() => (v = Math.max(300, Math.round(v * (0.82 + Math.random() * 0.4))))),
    }
  })
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4 sm:p-5">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-medium">
          Revenue by channel
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          January – December 2026
        </p>
      </div>
      <div class="flex gap-2">
        <SpringButton size="sm" variant="ghost" @click="area = !area">
          {{ area ? 'Lines' : 'Areas' }}
        </SpringButton>
        <SpringButton size="sm" variant="outline" @click="randomize">
          <Shuffle class="size-3.5" /> Randomize
        </SpringButton>
      </div>
    </div>
    <LineChart :labels="months" :series="series" :area="area" :format-value="usd.format" :height="260" />
  </div>
</template>
