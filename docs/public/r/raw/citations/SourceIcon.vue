<script setup lang="ts">
import type { CitationSource } from './context'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { sourceDomain } from './context'

const props = defineProps<{
  source: CitationSource
  /** 1-based index, picks the fallback colour. */
  n: number
}>()

const broken = ref(false)
const letter = computed(() => (sourceDomain(props.source) || props.source.title).charAt(0).toUpperCase())
const tones = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']
</script>

<template>
  <img
    v-if="props.source.favicon && !broken"
    :src="props.source.favicon"
    alt=""
    class="size-4 shrink-0 rounded-sm"
    @error="broken = true"
  >
  <span
    v-else
    aria-hidden="true"
    :class="cn('flex size-4 shrink-0 items-center justify-center rounded-sm text-[9px] font-bold leading-none text-background', tones[(props.n - 1) % tones.length])"
  >{{ letter }}</span>
</template>
