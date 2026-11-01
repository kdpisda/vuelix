<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MotionBadgeVariants } from '.'
import { animate, AnimatePresence, motion, useDomRef, useReducedMotion } from 'motion-v'
import { computed, onMounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { motionBadgeVariants } from '.'

const props = withDefaults(defineProps<{
  variant?: MotionBadgeVariants['variant']
  size?: MotionBadgeVariants['size']
  /** Show a number that rolls like an odometer whenever it changes. */
  count?: number
  /** Counts above this render as `max+`. */
  max?: number
  /** Locale used to format the count (thousands separators). */
  locale?: string
  /** Show a pulsing "live" dot before the content. */
  live?: boolean
  class?: HTMLAttributes['class']
}>(), {
  max: Infinity,
})

const prefersReduced = useReducedMotion()
// Trust the media query only after mount, so server and hydrated markup always match.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
const reduced = computed(() => mounted.value && prefersReduced.value)
const root = useDomRef()

const text = computed(() => {
  if (props.count === undefined)
    return ''
  const n = Math.max(0, Math.round(props.count))
  const fmt = new Intl.NumberFormat(props.locale)
  return n > props.max ? `${fmt.format(props.max)}+` : fmt.format(n)
})

// Characters keyed from the right, so the ones digit stays the ones digit when the length changes.
const chars = computed(() => [...text.value].map((ch, i, all) => ({ ch, key: all.length - i })))

// 1 = rolling up (count grew), -1 = rolling down.
const direction = ref(1)

watch(() => props.count, (next, prev) => {
  if (next === undefined || prev === undefined || next === prev)
    return
  direction.value = next > prev ? 1 : -1
  if (!reduced.value && root.value)
    animate(root.value, { scale: [1, 1.08, 1] }, { duration: 0.35, ease: 'easeOut' })
})

const roll = {
  enter: (d: number) => ({ y: `${d * 100}%`, opacity: 0, filter: 'blur(2px)' }),
  center: { y: '0%', opacity: 1, filter: 'blur(0px)' },
  exit: (d: number) => ({ y: `${d * -100}%`, opacity: 0, filter: 'blur(2px)' }),
}
const spring = { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 } as const
</script>

<template>
  <motion.span
    ref="root"
    :class="cn(motionBadgeVariants({ variant: props.variant, size: props.size }), props.class)"
  >
    <span v-if="props.live" class="relative inline-flex size-1.5 shrink-0" aria-hidden="true">
      <motion.span
        v-if="!reduced"
        class="absolute inset-0 rounded-full bg-[var(--vx-badge-dot,currentColor)]"
        :initial="{ scale: 1, opacity: 0.7 }"
        :animate="{ scale: 2.8, opacity: 0 }"
        :transition="{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }"
      />
      <span class="relative size-1.5 rounded-full bg-[var(--vx-badge-dot,currentColor)]" />
    </span>

    <slot />

    <template v-if="props.count !== undefined">
      <span class="sr-only">{{ text }}</span>
      <span class="inline-flex" aria-hidden="true">
        <AnimatePresence :initial="false">
          <motion.span
            v-for="c in chars"
            :key="c.key"
            class="relative inline-flex h-[1.2em] items-center justify-center overflow-hidden"
            :initial="reduced ? false : { width: 0, opacity: 0 }"
            :animate="{ width: 'auto', opacity: 1 }"
            :exit="{ width: 0, opacity: 0 }"
            :transition="spring"
          >
            <AnimatePresence :initial="mounted && !reduced" mode="popLayout" :custom="direction">
              <motion.span
                :key="c.ch"
                class="inline-block"
                :custom="direction"
                :variants="reduced ? undefined : roll"
                initial="enter"
                animate="center"
                exit="exit"
                :transition="{ ...spring, filter: { duration: 0.2 } }"
              >
                {{ c.ch }}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        </AnimatePresence>
      </span>
    </template>
  </motion.span>
</template>
