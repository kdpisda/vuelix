<script setup lang="ts">
import type { FixtureTeam } from './MatchFixtures.vue'
import { computed } from 'vue'

// Initials in a tinted circle. Color: the team's own, or a stable pick from the chart palette.
const props = defineProps<{ team: FixtureTeam }>()

const color = computed(() => {
  if (props.team.color)
    return props.team.color
  let h = 0
  for (const c of props.team.name) h = (h * 31 + c.charCodeAt(0)) | 0
  return `var(--chart-${(Math.abs(h) % 5) + 1})`
})
const initials = computed(() => props.team.short ?? props.team.name.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase())
</script>

<template>
  <span
    aria-hidden="true"
    class="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tracking-tight"
    :style="{
      backgroundColor: `color-mix(in oklab, ${color} 22%, transparent)`,
      boxShadow: `inset 0 0 0 1.5px color-mix(in oklab, ${color} 60%, transparent)`,
    }"
  >{{ initials }}</span>
</template>
