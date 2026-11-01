<script setup lang="ts">
import type { StatusHistoryEntry } from '@/ui/status-history'
import { SpringButton } from '@/ui/spring-button'
import { StatusHistory } from '@/ui/status-history'
import { Shuffle } from 'lucide-vue-next'
import { ref } from 'vue'

const NOTES = {
  degraded: ['Elevated API latency in eu-west', 'Slow webhook delivery', 'Partial dashboard outage'],
  down: ['Database failover', 'Upstream DNS provider outage', 'Bad deploy rolled back'],
}

// Seeded so the server and the browser render the same history.
function history(seed: number, incidentRate: number): StatusHistoryEntry[] {
  let s = seed
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })
  const today = Date.UTC(2026, 9, 31)
  return Array.from({ length: 90 }, (_, i) => {
    const label = fmt.format(today - (89 - i) * 86_400_000)
    const r = rand()
    if (r < incidentRate * 0.3)
      return { label, status: 'down', uptime: Math.round(900 + rand() * 90) / 10, note: NOTES.down[Math.floor(rand() * 3)] }
    if (r < incidentRate)
      return { label, status: 'degraded', uptime: Math.round(990 + rand() * 9) / 10, note: NOTES.degraded[Math.floor(rand() * 3)] }
    return { label, status: 'ok', uptime: 100 }
  })
}

const seed = ref(42)
const api = ref(history(seed.value, 0.08))
const web = ref(history(seed.value + 7, 0.03))

function randomize() {
  seed.value = (seed.value * 13 + 5) % 991
  api.value = history(seed.value, 0.04 + (seed.value % 7) / 50)
  web.value = history(seed.value + 7, 0.02 + (seed.value % 3) / 50)
}
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4 sm:p-5">
    <div class="mb-5 flex items-start justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-medium">
          System status
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          Last 90 days
        </p>
      </div>
      <SpringButton size="sm" variant="outline" @click="randomize">
        <Shuffle class="size-3.5" /> Randomize
      </SpringButton>
    </div>
    <div class="grid gap-6">
      <StatusHistory title="API" :data="api" />
      <StatusHistory title="Dashboard" :data="web" :bar-height="28" />
    </div>
  </div>
</template>
