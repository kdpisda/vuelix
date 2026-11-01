<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, ref } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Name of the active state; the slot with the same name is rendered. */
  state?: string
  /** Largest corner radius (px) once the island grows taller than a pill. */
  radius?: number
  /** Accessible name of the live region. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  state: 'idle',
  radius: 32,
  label: 'Live activity',
})

defineSlots<Record<string, () => unknown>>()

const reduced = useReducedMotion()

// The shell's size follows whatever the active slot renders: we measure the
// content box and spring width / height / radius towards it.
const size = ref<{ width: number, height: number } | null>(null)
let observer: ResizeObserver | undefined
let observed: HTMLElement | null = null

function track(el: unknown, state: string) {
  const node = ((el as { $el?: unknown } | null)?.$el ?? el) as HTMLElement | null
  if (!(node instanceof HTMLElement) || state !== props.state || node === observed)
    return
  observed = node
  observer?.disconnect()
  const measure = () => (size.value = { width: node.offsetWidth, height: node.offsetHeight })
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(node)
  }
}

onBeforeUnmount(() => observer?.disconnect())

const shell = computed(() => {
  if (!size.value)
    return {}
  const { width, height } = size.value
  return { width, height, borderRadius: Math.min(height / 2, props.radius) }
})

const morph = { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 } as const
const content = computed(() => ({
  initial: reduced.value
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.86, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { delay: reduced.value ? 0 : 0.08, type: 'spring', stiffness: 320, damping: 30 },
  },
  exit: reduced.value
    ? { opacity: 0, transition: { duration: 0.12 } }
    : { opacity: 0, scale: 0.9, filter: 'blur(6px)', transition: { duration: 0.16 } },
}))
</script>

<template>
  <motion.div
    role="status"
    aria-live="polite"
    :aria-label="props.label"
    :data-state="props.state"
    :class="cn(
      'relative isolate mx-auto h-9 w-28 overflow-hidden bg-foreground text-background shadow-lg',
      props.class,
    )"
    :style="{ borderRadius: '18px' }"
    :initial="false"
    :animate="shell"
    :transition="reduced ? { duration: 0 } : morph"
  >
    <AnimatePresence :initial="false">
      <motion.div
        :key="props.state"
        :ref="(el: unknown) => track(el, props.state)"
        class="absolute inset-x-0 top-0 mx-auto w-max"
        :initial="content.initial"
        :animate="content.animate"
        :exit="content.exit"
      >
        <slot :name="props.state" />
      </motion.div>
    </AnimatePresence>
  </motion.div>
</template>
