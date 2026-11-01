<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useReducedMotion } from 'motion-v'
import { computed, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

export type LoaderVariant = 'dots' | 'orbit' | 'bars' | 'ring' | 'typing'

const props = withDefaults(defineProps<{
  /** Which loader to draw. */
  variant?: LoaderVariant
  size?: 'sm' | 'md' | 'lg'
  /** Screen-reader text announced by the status region. */
  label?: string
  /** Number of skeleton lines for the `typing` variant. */
  lines?: number
  class?: HTMLAttributes['class']
}>(), {
  variant: 'dots',
  size: 'md',
  label: 'Loading',
  lines: 3,
})

const prefersReduced = useReducedMotion()
// Trust the media query only after mount, so server and hydrated markup always match.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
const reduced = computed(() => mounted.value && prefersReduced.value)
// Reduced motion keeps a sign of life, but slower and without travel.
const slow = computed(() => (reduced.value ? 2.5 : 1))

const box = { sm: 'size-4', md: 'size-6', lg: 'size-9' }
const height = { sm: 'h-4', md: 'h-6', lg: 'h-9' }
const dot = { sm: 'size-1', md: 'size-1.5', lg: 'size-2.5' }
const gap = { sm: 'gap-0.5', md: 'gap-1', lg: 'gap-1.5' }
const typingWidth = { sm: 'w-36', md: 'w-52', lg: 'w-72' }
const lineHeight = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' }

// Skeleton line widths cycle so paragraphs look natural.
const widths = ['100%', '86%', '93%', '64%', '78%']
const lineWidths = computed(() => Array.from({ length: Math.max(1, props.lines) }, (_, i) =>
  i === props.lines - 1 ? '58%' : widths[i % widths.length]!))

function repeat(duration: number, delay = 0, extra: Record<string, unknown> = {}) {
  return { duration: duration * slow.value, delay: delay * slow.value, repeat: Infinity, ease: 'easeInOut', ...extra }
}
</script>

<template>
  <span
    role="status"
    aria-live="polite"
    :class="cn('inline-flex items-center justify-center text-foreground', props.class)"
  >
    <span class="sr-only">{{ props.label }}</span>

    <!-- Dots wave: three dots rising one after another -->
    <span v-if="props.variant === 'dots'" aria-hidden="true" :class="cn('inline-flex items-center', height[props.size], gap[props.size])">
      <motion.span
        v-for="i in 3"
        :key="i"
        :class="cn('rounded-full bg-current', dot[props.size])"
        :animate="reduced ? { opacity: [0.3, 1, 0.3] } : { y: ['0%', '-140%', '0%'], opacity: [0.45, 1, 0.45] }"
        :transition="repeat(0.9, (i - 1) * 0.14)"
      />
    </span>

    <!-- Orbit: three dots circling a faint track, surging and easing, each breathing in turn -->
    <span v-else-if="props.variant === 'orbit'" aria-hidden="true" :class="cn('relative inline-block', box[props.size])">
      <span class="absolute inset-[15%] rounded-full border border-current opacity-15" />
      <motion.span
        class="absolute inset-0"
        :animate="{ rotate: 360 }"
        :transition="repeat(1.4, 0, { ease: [0.6, 0.05, 0.3, 0.95] })"
      >
        <span
          v-for="i in 3"
          :key="i"
          class="absolute inset-0"
          :style="{ rotate: `${(i - 1) * 120}deg` }"
        >
          <motion.span
            :class="cn('absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-current', dot[props.size])"
            :animate="{ scale: [1, 0.45, 1], opacity: [1, 0.5, 1] }"
            :transition="repeat(1.4, (i - 1) * 0.47)"
          />
        </span>
      </motion.span>
    </span>

    <!-- Bars: four bars stretching and settling like an equaliser -->
    <span v-else-if="props.variant === 'bars'" aria-hidden="true" :class="cn('inline-flex items-center', height[props.size], gap[props.size])">
      <motion.span
        v-for="i in 4"
        :key="i"
        :class="cn('h-full rounded-full bg-current', props.size === 'lg' ? 'w-1.5' : props.size === 'md' ? 'w-1' : 'w-0.5')"
        :initial="{ scaleY: 0.35 }"
        :animate="reduced ? { opacity: [0.35, 1, 0.35] } : { scaleY: [0.35, 1, 0.35], opacity: [0.5, 1, 0.5] }"
        :transition="repeat(1, (i - 1) * 0.13)"
      />
    </span>

    <!-- Ring: an arc that grows, shrinks and spins -->
    <motion.svg
      v-else-if="props.variant === 'ring'"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      :class="box[props.size]"
      :animate="{ rotate: 360 }"
      :transition="repeat(1.1, 0, { ease: 'linear' })"
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-opacity="0.15" stroke-width="2.5" />
      <motion.circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        :initial="{ pathLength: 0.2 }"
        :animate="reduced ? { pathLength: 0.3 } : { pathLength: [0.12, 0.62, 0.12], rotate: [0, 120, 360] }"
        :transition="repeat(1.6)"
      />
    </motion.svg>

    <!-- Typing: skeleton lines with a shimmer that sweeps across them in turn -->
    <span v-else aria-hidden="true" :class="cn('flex flex-col gap-2', typingWidth[props.size])">
      <span
        v-for="(w, i) in lineWidths"
        :key="i"
        :class="cn('relative block overflow-hidden rounded-full bg-muted', lineHeight[props.size])"
        :style="{ width: w }"
      >
        <motion.span
          v-if="!reduced"
          class="absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent via-foreground/15 to-transparent"
          :initial="{ x: '-100%' }"
          :animate="{ x: '220%' }"
          :transition="{ duration: 1.1, delay: i * 0.18, repeat: Infinity, repeatDelay: 0.5 + lineWidths.length * 0.18, ease: 'easeInOut' }"
        />
        <motion.span
          v-else
          class="absolute inset-0 bg-foreground/10"
          :animate="{ opacity: [0, 1, 0] }"
          :transition="repeat(1.2, i * 0.2)"
        />
        <motion.span
          v-if="i === lineWidths.length - 1"
          class="absolute inset-y-0 right-0 w-0.5 rounded-full bg-foreground/50"
          :animate="{ opacity: [1, 1, 0, 0] }"
          :transition="{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: 'linear' }"
        />
      </span>
    </span>
  </span>
</template>
