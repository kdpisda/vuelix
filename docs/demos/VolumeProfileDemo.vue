<script setup lang="ts">
import type { VolumeSample } from '@/components/ui/volume-profile'
import { VolumeProfile } from '@/components/ui/volume-profile'
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

// A trading session: a random walk that keeps drifting back to a "fair" price,
// so volume clusters there the way real sessions do.
function session(seed: number) {
  const rand = rng(seed)
  const fair = 62 + rand() * 6
  let price = fair + (rand() - 0.5) * 4
  const closes: number[] = []
  const samples: VolumeSample[] = []
  for (let i = 0; i < 160; i++) {
    price += (rand() - 0.5) * 0.9 + (fair - price) * 0.04
    closes.push(price)
    // Several prints per bar spread across its range.
    for (let k = 0; k < 6; k++) {
      samples.push({
        price: price + (rand() - 0.5) * 0.8,
        volume: Math.round(200 + rand() * 900 * (1 + 1 / (1 + Math.abs(price - fair)))),
      })
    }
  }
  return { closes, samples }
}

const seed = ref(11)
const bins = ref(24)
const showLine = ref(true)
const data = computed(() => session(seed.value))
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-semibold">
          VLX / USD · session profile
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          160 bars · hover a level for its volume
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <div class="inline-flex rounded-lg bg-muted p-0.5 text-xs">
          <button
            v-for="n in [16, 24, 36]"
            :key="n"
            type="button"
            class="rounded-md px-2 py-1 tabular-nums transition-colors"
            :class="bins === n ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            :aria-pressed="bins === n"
            @click="bins = n"
          >
            {{ n }} bins
          </button>
        </div>
        <button
          type="button"
          class="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
          :aria-pressed="showLine"
          @click="showLine = !showLine"
        >
          {{ showLine ? 'Hide' : 'Show' }} price
        </button>
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
    <VolumeProfile :data="data.samples" :line="showLine ? data.closes : undefined" :bins="bins" :height="320" />
  </div>
</template>
