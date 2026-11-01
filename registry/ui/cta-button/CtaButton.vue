<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { CtaButtonVariants } from '.'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion-v'
import { computed, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'
import { ctaButtonVariants } from '.'

const props = withDefaults(defineProps<{
  /** The attention effect. */
  variant?: NonNullable<CtaButtonVariants['variant']>
  size?: NonNullable<CtaButtonVariants['size']>
  /** Render as another element, e.g. `a` (pass `href` as usual). */
  as?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  /** How far the `magnetic` variant follows the pointer (0 … 1). */
  strength?: number
  class?: HTMLAttributes['class']
}>(), {
  variant: 'shimmer',
  size: 'md',
  as: 'button',
  type: 'button',
  disabled: false,
  strength: 0.3,
})

const prefersReduced = useReducedMotion()
// Trust the media query only after mount, so server and hydrated markup always match.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
const reduced = computed(() => mounted.value && prefersReduced.value)
const isButton = computed(() => props.as === 'button')

const pad = { sm: 'px-3.5 gap-1.5', md: 'px-5 gap-2', lg: 'px-7 gap-2.5' }

// Magnetic: raw pointer offset → spring → the button, with the label drifting a little further.
const mx = useMotionValue(0)
const my = useMotionValue(0)
const springCfg = { stiffness: 220, damping: 16, mass: 0.5 }
const x = useSpring(mx, springCfg)
const y = useSpring(my, springCfg)
const labelX = useTransform(x, v => v * 0.35)
const labelY = useTransform(y, v => v * 0.35)

function onMove(e: PointerEvent) {
  if (props.variant !== 'magnetic' || reduced.value || e.pointerType === 'touch')
    return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  mx.set((e.clientX - rect.left - rect.width / 2) * props.strength)
  my.set((e.clientY - rect.top - rect.height / 2) * props.strength)
}
function onLeave() {
  mx.set(0)
  my.set(0)
}

const label = { rest: { x: 0 }, hover: { x: -2 } }
const arrowOut = { rest: { x: '0%', opacity: 1 }, hover: { x: '140%', opacity: 0 } }
const arrowIn = { rest: { x: '-140%', opacity: 0 }, hover: { x: '0%', opacity: 1 } }
const slide = { type: 'spring', stiffness: 420, damping: 30 } as const
</script>

<template>
  <motion.div
    :as="props.as"
    :type="isButton ? props.type : undefined"
    :disabled="isButton ? props.disabled : undefined"
    :aria-disabled="!isButton && props.disabled ? 'true' : undefined"
    :class="cn(ctaButtonVariants({ variant: props.variant, size: props.size }), props.class)"
    :style="props.variant === 'magnetic' ? { x, y } : undefined"
    initial="rest"
    animate="rest"
    while-hover="hover"
    while-focus="hover"
    :while-press="{ scale: 0.96 }"
    :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <!-- shimmer: a soft band of light sweeping across every few seconds -->
    <motion.span
      v-if="props.variant === 'shimmer' && !reduced"
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 -left-3/4 w-3/4 bg-linear-110 from-transparent from-25% via-primary-foreground/30 via-50% to-transparent to-75%"
      :initial="{ x: '0%' }"
      :animate="{ x: '270%' }"
      :transition="{ duration: 1.3, ease: [0.4, 0, 0.2, 1], repeat: Infinity, repeatDelay: 1.6 }"
    />

    <!-- gradient-border: a conic gradient spinning behind a 1.5px gap -->
    <motion.span
      v-if="props.variant === 'gradient-border'"
      aria-hidden="true"
      class="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[max(250%,12rem)] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,var(--color-chart-1),var(--color-chart-2),var(--color-chart-3),var(--color-chart-5),var(--color-chart-4),var(--color-chart-1))]"
      :animate="reduced ? undefined : { rotate: 360 }"
      :transition="{ duration: 4, ease: 'linear', repeat: Infinity }"
    />

    <motion.span
      :class="cn(
        'relative inline-flex h-full items-center justify-center rounded-[inherit]',
        pad[props.size],
        props.variant === 'gradient-border' && 'w-full bg-background transition-colors duration-300 group-hover:bg-background/85',
      )"
      :style="props.variant === 'magnetic' ? { x: labelX, y: labelY } : undefined"
    >
      <motion.span
        class="inline-flex items-center gap-[inherit]"
        :variants="props.variant === 'arrow' && !reduced ? label : undefined"
        :transition="slide"
      >
        <slot />
      </motion.span>

      <!-- arrow: one arrow slides out to the right while its twin slides in from the left -->
      <span v-if="props.variant === 'arrow'" aria-hidden="true" class="relative inline-grid overflow-hidden [&>*]:col-start-1 [&>*]:row-start-1">
        <motion.svg :variants="reduced ? undefined : arrowOut" :transition="slide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </motion.svg>
        <motion.svg :variants="reduced ? undefined : arrowIn" :transition="slide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </motion.svg>
      </span>
    </motion.span>
  </motion.div>
</template>
