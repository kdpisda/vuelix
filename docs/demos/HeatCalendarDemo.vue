<script setup lang="ts">
import type { HeatCalendarDay, HeatCalendarRange } from '@/ui/heat-calendar'
import { HeatCalendar } from '@/ui/heat-calendar'
import { SpringButton } from '@/ui/spring-button'
import { Shuffle } from 'lucide-vue-next'
import { ref } from 'vue'

// Deterministic pseudo-random data so the server and browser render the same calendar.
function generate(seed: number): HeatCalendarDay[] {
  let s = seed
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const end = Date.UTC(2026, 9, 31)
  return Array.from({ length: 210 }, (_, i) => {
    const ms = end - (209 - i) * 86_400_000
    const weekday = new Date(ms).getUTCDay()
    const busy = weekday === 0 || weekday === 6 ? 0.35 : 1
    const burst = Math.sin(i / 23) > 0.4 ? 2 : 1
    const value = rand() < 0.22 * busy ? 0 : Math.round(rand() ** 2 * 9 * busy * burst)
    return { date: new Date(ms).toISOString().slice(0, 10), value }
  })
}

const seed = ref(7)
const data = ref(generate(seed.value))
const picked = ref<HeatCalendarRange | null>(null)

function randomize() {
  seed.value = (seed.value * 31 + 11) % 997 || 3
  data.value = generate(seed.value)
}
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4 sm:p-5">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-medium">
          Contributions
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          {{ picked ? `Last selection: ${picked.start} → ${picked.end}` : 'Drag across days to select a range' }}
        </p>
      </div>
      <SpringButton size="sm" variant="outline" @click="randomize">
        <Shuffle class="size-3.5" /> Randomize
      </SpringButton>
    </div>
    <HeatCalendar :data="data" start="2026-04-05" unit="contributions" @select="picked = $event" />
  </div>
</template>
