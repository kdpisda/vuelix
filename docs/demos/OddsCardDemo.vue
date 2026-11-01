<script setup lang="ts">
import type { OddsOutcome, OddsTrade } from '@/components/ui/odds-card'
import { OddsCard } from '@/components/ui/odds-card'
import { Sailboat } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'

function walk(start: number, n: number) {
  const out = [start]
  for (let i = 1; i < n; i++)
    out.push(Math.max(2, Math.min(95, out[i - 1]! + (Math.random() - 0.5) * 6)))
  return out
}

const outcomes = ref<OddsOutcome[]>([
  { id: 'southern-cross', label: 'Southern Cross', probability: 46, history: walk(38, 20) },
  { id: 'bluewater', label: 'Bluewater', probability: 31, history: walk(36, 20) },
  { id: 'tradewind', label: 'Tradewind', probability: 17, history: walk(18, 20) },
  { id: 'field', label: 'Any other team', probability: 6, history: walk(8, 20) },
])
const selected = ref('southern-cross')
const lastTrade = ref<OddsTrade | null>(null)

// Mock market: nudge the odds, keep them summing to 100, append to history.
let timer: ReturnType<typeof setInterval> | undefined
function tick() {
  const raw = outcomes.value.map(o => Math.max(2, o.probability + (Math.random() - 0.5) * 7))
  const total = raw.reduce((a, b) => a + b, 0)
  outcomes.value = outcomes.value.map((o, i) => ({
    ...o,
    history: [...(o.history ?? []), o.probability].slice(-30),
    probability: Math.round((raw[i]! / total) * 1000) / 10,
  }))
}
onMounted(() => (timer = setInterval(tick, 2400)))
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="flex w-full flex-col items-center gap-3">
    <OddsCard
      v-model:selected="selected"
      question="Who wins the 2027 Pacific Sailing Cup?"
      meta="$2.4M vol · Closes Mar 31, 2027"
      :outcomes="outcomes"
      @trade="lastTrade = $event"
    >
      <template #media>
        <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white">
          <Sailboat class="size-5" />
        </div>
      </template>
    </OddsCard>
    <p class="m-0 h-4 text-xs text-muted-foreground" aria-live="polite">
      <template v-if="lastTrade">
        Bought {{ lastTrade.shares.toFixed(1) }} {{ lastTrade.side === 'yes' ? 'Yes' : 'No' }} shares of {{ lastTrade.outcome.label }}
      </template>
    </p>
  </div>
</template>
