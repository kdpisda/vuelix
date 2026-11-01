<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TokenSwapToken } from './types'
import { cn } from '@/lib/utils'

const props = defineProps<{
  token?: TokenSwapToken
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span
    aria-hidden="true"
    :class="cn('inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-1 ring-border', props.class)"
    :style="props.token?.color && !props.token.icon ? { background: props.token.color, color: 'white' } : undefined"
  >
    <img v-if="props.token?.icon" :src="props.token.icon" alt="" class="size-full object-cover">
    <template v-else-if="props.token">{{ props.token.symbol.slice(0, 2) }}</template>
  </span>
</template>
