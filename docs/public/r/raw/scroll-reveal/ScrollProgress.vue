<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useReducedMotion, useScroll, useSpring } from 'motion-v'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Scrollable element to track. Defaults to the page. */
  container?: HTMLElement | null
  /** Edge the bar sticks to. */
  position?: 'top' | 'bottom'
  /** `fixed` to the viewport, or `absolute` inside the nearest positioned parent. */
  fixed?: boolean
  class?: HTMLAttributes['class']
}>(), {
  container: null,
  position: 'top',
  fixed: true,
})

const reduced = useReducedMotion()
const { scrollYProgress } = useScroll(() => ({ container: props.container ?? undefined }))
// A light spring smooths out wheel steps; reduced motion follows the scroll exactly.
const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 32, restDelta: 0.001 })
</script>

<template>
  <motion.div
    aria-hidden="true"
    :class="cn(
      'inset-x-0 z-50 h-1 origin-left bg-brand',
      props.fixed ? 'fixed' : 'absolute',
      props.position === 'top' ? 'top-0' : 'bottom-0',
      props.class,
    )"
    :style="{ scaleX: reduced ? scrollYProgress : smooth }"
  />
</template>
