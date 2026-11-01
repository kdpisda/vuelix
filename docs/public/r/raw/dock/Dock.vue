<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useMotionValue } from 'motion-v'
import { provide } from 'vue'
import { cn } from '@/lib/utils'
import { DOCK_KEY } from './context'

const props = withDefaults(defineProps<{
  /** Resting icon size in px. */
  baseSize?: number
  /** Icon size directly under the pointer in px. */
  magnification?: number
  /** Pointer distance (px) over which neighbours grow. */
  distance?: number
  class?: HTMLAttributes['class']
}>(), {
  baseSize: 40,
  magnification: 64,
  distance: 140,
})

const mouseX = useMotionValue(Number.POSITIVE_INFINITY)

provide(DOCK_KEY, {
  mouseX,
  baseSize: props.baseSize,
  magnification: props.magnification,
  distance: props.distance,
})
</script>

<template>
  <motion.div
    role="toolbar"
    aria-orientation="horizontal"
    :class="cn(
      'mx-auto flex w-max items-end gap-2 rounded-2xl border bg-background/70 px-2.5 pb-2.5 shadow-lg backdrop-blur-md',
      props.class,
    )"
    :style="{ height: `${props.baseSize + 20}px` }"
    @pointermove="mouseX.set($event.pageX)"
    @pointerleave="mouseX.set(Number.POSITIVE_INFINITY)"
  >
    <slot />
  </motion.div>
</template>
