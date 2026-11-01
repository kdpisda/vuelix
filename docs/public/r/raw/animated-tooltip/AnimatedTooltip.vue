<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import { cn } from '@/lib/utils'

type Side = 'top' | 'bottom' | 'left' | 'right'

const props = withDefaults(defineProps<{
  content?: string
  side?: Side
  delay?: number
  class?: HTMLAttributes['class']
}>(), {
  side: 'top',
  delay: 120,
})

const open = ref(false)
const tooltipId = `vx-tooltip-${useId()}`
let timer: ReturnType<typeof setTimeout> | undefined

function show() {
  clearTimeout(timer)
  timer = setTimeout(() => (open.value = true), props.delay)
}
function hide() {
  clearTimeout(timer)
  open.value = false
}
onBeforeUnmount(() => clearTimeout(timer))

const placement: Record<Side, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2 origin-top',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2 origin-right',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2 origin-left',
}

const offset = computed(() => {
  const d = 6
  return {
    top: { y: d },
    bottom: { y: -d },
    left: { x: d },
    right: { x: -d },
  }[props.side]
})
</script>

<template>
  <span
    class="relative inline-flex"
    :aria-describedby="open ? tooltipId : undefined"
    @pointerenter="show"
    @pointerleave="hide"
    @focusin="show"
    @focusout="hide"
    @keydown.esc="hide"
  >
    <slot />
    <AnimatePresence>
      <motion.span
        v-if="open"
        :id="tooltipId"
        role="tooltip"
        :class="cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow-lg',
          placement[props.side],
          props.class,
        )"
        :initial="{ opacity: 0, scale: 0.85, filter: 'blur(2px)', ...offset }"
        :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)', x: 0, y: 0 }"
        :exit="{ opacity: 0, scale: 0.9, filter: 'blur(2px)', ...offset }"
        :transition="{ type: 'spring', stiffness: 520, damping: 30 }"
      >
        <slot name="content">{{ props.content }}</slot>
      </motion.span>
    </AnimatePresence>
  </span>
</template>
