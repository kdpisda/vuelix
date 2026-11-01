<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { provide } from 'vue'
import { cn } from '@/lib/utils'
import { WHEEL_GROUP_KEY } from './context'

const props = withDefaults(defineProps<{
  /** Row height in px, shared by every wheel inside. */
  itemHeight?: number
  /** Rows visible at once (odd), shared by every wheel inside. */
  visibleCount?: number
  /** Accessible name for the whole picker, e.g. "Alarm time". */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  itemHeight: 36,
  visibleCount: 5,
})

provide(WHEEL_GROUP_KEY, { itemHeight: props.itemHeight, visibleCount: props.visibleCount })
</script>

<template>
  <div
    role="group"
    :aria-label="props.label"
    :class="cn('relative inline-flex items-center gap-1 px-2', props.class)"
  >
    <!-- One selection band behind all wheels -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl bg-muted"
      :style="{ height: `${props.itemHeight}px` }"
    />
    <slot />
  </div>
</template>
