<script setup lang="ts" generic="V">
import type { HTMLAttributes } from 'vue'
import type { IconSwapState, IconSwapVariants } from '.'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, ref } from 'vue'
import { cn } from '@/lib/utils'
import { iconSwapVariants } from '.'

const props = withDefaults(defineProps<{
  /** The states to cycle through, in order. Clicking moves to the next one. */
  states: IconSwapState<V>[]
  /** How the icons swap. */
  effect?: 'rotate' | 'blur' | 'scale'
  variant?: IconSwapVariants['variant']
  size?: IconSwapVariants['size']
  /** Render the state label as visible text next to the icon. */
  showLabel?: boolean
  /** Return to the first state after this many ms (e.g. copy → check → copy). */
  resetAfter?: number
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  effect: 'blur',
  showLabel: false,
  disabled: false,
})

const model = defineModel<V>()
const emit = defineEmits<{ change: [value: V] }>()

const reduced = useReducedMotion()

const index = computed(() => Math.max(0, props.states.findIndex(s => Object.is(s.value, model.value))))
const current = computed(() => props.states[index.value])

let resetTimer: ReturnType<typeof setTimeout> | undefined
let burstTimer: ReturnType<typeof setTimeout> | undefined
const burstId = ref(0)
const bursting = ref(false)

function go(next: number) {
  const state = props.states[next]
  if (!state)
    return
  model.value = state.value
  emit('change', state.value)
  if (state.burst && !reduced.value) {
    burstId.value++
    bursting.value = true
    clearTimeout(burstTimer)
    burstTimer = setTimeout(() => (bursting.value = false), 800)
  }
}

function onClick() {
  // A bound v-model only updates after the parent re-renders, so work from the computed next index.
  const next = (index.value + 1) % props.states.length
  go(next)
  clearTimeout(resetTimer)
  if (props.resetAfter && next !== 0)
    resetTimer = setTimeout(() => go(0), props.resetAfter)
}

onBeforeUnmount(() => {
  clearTimeout(resetTimer)
  clearTimeout(burstTimer)
})

const effects = {
  rotate: { initial: { opacity: 0, rotate: -120, scale: 0.4 }, exit: { opacity: 0, rotate: 120, scale: 0.4 } },
  blur: { initial: { opacity: 0, scale: 0.5, filter: 'blur(4px)' }, exit: { opacity: 0, scale: 0.5, filter: 'blur(4px)' } },
  scale: { initial: { opacity: 0, scale: 0 }, exit: { opacity: 0, scale: 0 } },
}
const swap = computed(() => (reduced.value
  ? { initial: { opacity: 0 }, exit: { opacity: 0 } }
  : effects[props.effect]))
const spring = computed(() => ({
  type: 'spring' as const,
  stiffness: props.effect === 'scale' ? 520 : 420,
  damping: props.effect === 'scale' ? 17 : 28,
  // springs overshoot — keep blur on a tween so it never goes negative
  filter: { duration: 0.2 },
}))

// Eight particles flung outward, alternating near and far.
const particles = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
  const r = i % 2 ? 17 : 25
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, size: i % 2 ? 'size-1' : 'size-1.5' }
})
</script>

<template>
  <motion.button
    type="button"
    :layout="props.showLabel"
    :disabled="props.disabled"
    :aria-label="props.showLabel ? undefined : current?.label"
    :while-press="props.disabled ? undefined : { scale: 0.9 }"
    :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
    :class="cn(iconSwapVariants({ variant: props.variant, size: props.size }), current?.class, props.class)"
    @click="onClick"
  >
    <span class="relative inline-grid place-items-center" aria-hidden="true">
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.span
          :key="index"
          class="inline-grid place-items-center"
          :initial="swap.initial"
          :animate="{ opacity: 1, rotate: 0, scale: 1, filter: 'blur(0px)' }"
          :exit="swap.exit"
          :transition="spring"
        >
          <slot name="icon" :state="current" :index="index">
            <component :is="current.icon" v-if="current?.icon" />
          </slot>
        </motion.span>
      </AnimatePresence>

      <!-- Burst: a ring and a ring of particles, re-keyed so every switch replays it -->
      <span v-if="bursting" class="pointer-events-none absolute inset-0 grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
        <motion.span
          :key="`ring-${burstId}`"
          class="size-6 rounded-full border-2 border-current"
          :initial="{ scale: 0.3, opacity: 0.7 }"
          :animate="{ scale: 1.7, opacity: 0 }"
          :transition="{ duration: 0.5, ease: 'easeOut' }"
        />
        <motion.span
          v-for="(p, i) in particles"
          :key="`p-${burstId}-${i}`"
          :class="cn('rounded-full bg-current', p.size)"
          :initial="{ x: 0, y: 0, scale: 1, opacity: 1 }"
          :animate="{ x: p.x, y: p.y, scale: [1, 1, 0], opacity: [1, 1, 0] }"
          :transition="{ duration: 0.6, ease: [0.2, 0.8, 0.3, 1], delay: 0.04, scale: { duration: 0.7, times: [0, 0.55, 1], delay: 0.04 }, opacity: { duration: 0.7, times: [0, 0.55, 1], delay: 0.04 } }"
        />
      </span>
    </span>

    <span v-if="props.showLabel" class="relative inline-grid overflow-hidden">
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.span
          :key="index"
          class="inline-block"
          :initial="reduced ? { opacity: 0 } : { opacity: 0, y: 10, filter: 'blur(3px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :exit="reduced ? { opacity: 0 } : { opacity: 0, y: -10, filter: 'blur(3px)' }"
          :transition="{ type: 'spring', stiffness: 420, damping: 32, filter: { duration: 0.2 } }"
        >
          {{ current?.label }}
        </motion.span>
      </AnimatePresence>
    </span>
  </motion.button>
</template>
