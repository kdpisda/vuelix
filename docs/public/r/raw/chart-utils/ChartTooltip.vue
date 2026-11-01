<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, reactive, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { clamp } from './utils'

const props = withDefaults(defineProps<{
  open: boolean
  /** Anchor point in px, relative to the chart's positioned wrapper. */
  x: number
  y: number
  /** Size of the wrapper; the tooltip is clamped inside it. */
  bounds: { width: number, height: number }
  /**
   * `top` / `bottom`: centred above / below the anchor, flipping when there's no room.
   * `side`: to the right, flipping left at the edge.
   */
  placement?: 'top' | 'bottom' | 'side'
  /** Gap between anchor and tooltip in px. */
  offset?: number
  class?: HTMLAttributes['class']
}>(), {
  placement: 'top',
  offset: 12,
})

const POP = { type: 'spring', stiffness: 520, damping: 34 } as const

const el = ref<HTMLElement>()
const size = reactive({ w: 0, h: 0 })
// Glide between anchors only after the first placement, never on entry.
const settled = ref(false)

watch(el, (node, _, onCleanup) => {
  if (!node) {
    settled.value = false
    return
  }
  const measure = () => {
    size.w = node.offsetWidth
    size.h = node.offsetHeight
  }
  measure()
  const frame = requestAnimationFrame(() => (settled.value = true))
  const observer = new ResizeObserver(measure)
  observer.observe(node)
  onCleanup(() => {
    cancelAnimationFrame(frame)
    observer.disconnect()
  })
}, { flush: 'post' })

const position = computed(() => {
  const { width, height } = props.bounds
  const { w, h } = size
  const o = props.offset
  let left: number
  let top: number
  if (props.placement === 'side') {
    left = props.x + o + w > width ? props.x - o - w : props.x + o
    top = props.y - h / 2
  }
  else if (props.placement === 'bottom') {
    left = props.x - w / 2
    top = props.y + o + h > height ? props.y - o - h : props.y + o
  }
  else {
    left = props.x - w / 2
    top = props.y - o - h < 0 ? props.y + o : props.y - o - h
  }
  return {
    left: `${clamp(left, 0, Math.max(0, width - w))}px`,
    top: `${clamp(top, 0, Math.max(0, height - h))}px`,
  }
})
</script>

<template>
  <AnimatePresence>
    <motion.div
      v-if="props.open"
      key="vx-chart-tooltip"
      aria-hidden="true"
      class="pointer-events-none absolute z-20"
      :class="settled ? 'transition-[left,top] duration-200 ease-out' : ''"
      :style="position"
      :initial="{ opacity: 0, scale: 0.94 }"
      :animate="{ opacity: 1, scale: 1 }"
      :exit="{ opacity: 0, scale: 0.94, transition: { duration: 0.12 } }"
      :transition="POP"
    >
      <div
        ref="el"
        :class="cn(
          'min-w-28 whitespace-nowrap rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg',
          props.class,
        )"
      >
        <slot />
      </div>
    </motion.div>
  </AnimatePresence>
</template>
