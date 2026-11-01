<script setup lang="ts">
import { NumberTicker } from '@/components/ui/number-ticker'
import { Sparkline } from '@/components/ui/sparkline'

const stats = [
  { label: 'Visitors', value: 18420, data: [12, 18, 14, 22, 19, 28, 26, 34, 31, 40], class: 'text-emerald-500' },
  { label: 'Bounce rate', value: 42, data: [60, 58, 61, 55, 52, 54, 49, 47, 45, 42], class: 'text-sky-500' },
  { label: 'Errors', value: 7, data: [2, 3, 2, 5, 4, 9, 6, 8, 7, 7], class: 'text-rose-500' },
]
</script>

<template>
  <div class="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
    <div v-for="s in stats" :key="s.label" class="rounded-xl border bg-card p-4">
      <p class="m-0 text-xs text-muted-foreground">
        {{ s.label }}
      </p>
      <NumberTicker :value="s.value" class="text-2xl font-semibold" />
      <Sparkline :data="s.data" :width="180" :height="44" :class="s.class" class="mt-2 w-full" />
    </div>
  </div>
</template>
