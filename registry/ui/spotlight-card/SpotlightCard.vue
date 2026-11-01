<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion-v'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Spotlight colour — any CSS colour, theme tokens included. */
  color?: string
  /** Diameter of the spotlight in pixels. */
  size?: number
  /** How far the card lifts on hover, in pixels. `0` disables the lift. */
  lift?: number
  class?: HTMLAttributes['class']
}>(), {
  color: 'var(--brand)',
  size: 380,
  lift: 4,
})

const reduced = useReducedMotion()

// Pointer position in px relative to the card. Springs smooth out jittery input
// without a Vue re-render per frame.
const mx = useMotionValue(-1000)
const my = useMotionValue(-1000)
const smooth = { stiffness: 500, damping: 40, mass: 0.4 }
const sx = useSpring(mx, smooth)
const sy = useSpring(my, smooth)

const spotlight = useTransform([sx, sy], ([x, y]) =>
  `radial-gradient(${props.size / 2}px circle at ${x}px ${y}px, color-mix(in oklab, ${props.color} 16%, transparent), transparent 70%)`)
const rim = useTransform([sx, sy], ([x, y]) =>
  `radial-gradient(${props.size / 2.5}px circle at ${x}px ${y}px, ${props.color}, transparent 75%)`)

// Two layers — padding box minus content box — leave only the 1px padding visible.
const ringMask = {
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
}

function place(x: number, y: number, instant = false) {
  if (instant || reduced.value) {
    mx.jump(x)
    my.jump(y)
    sx.jump(x)
    sy.jump(y)
  }
  else {
    mx.set(x)
    my.set(y)
  }
}

function onEnter(e: PointerEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  // Start the light where the pointer entered instead of sweeping in from afar.
  place(e.clientX - rect.left, e.clientY - rect.top, true)
}

function onMove(e: PointerEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  place(e.clientX - rect.left, e.clientY - rect.top)
}

// Keyboard users get the light centred on the card when focus moves inside it.
function onFocusIn(e: FocusEvent) {
  const el = e.currentTarget as HTMLElement
  if (!el.matches(':hover'))
    place(el.offsetWidth / 2, el.offsetHeight / 3, true)
}
</script>

<template>
  <motion.div
    :class="cn(
      'group/spotlight relative isolate flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-shadow duration-300 hover:shadow-lg',
      props.class,
    )"
    :while-hover="reduced || !props.lift ? undefined : { y: -props.lift }"
    :transition="{ type: 'spring', stiffness: 320, damping: 26 }"
    @pointerenter="onEnter"
    @pointermove="onMove"
    @focusin="onFocusIn"
  >
    <!-- Soft wash of light inside the card -->
    <motion.div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-focus-within/spotlight:opacity-100 group-hover/spotlight:opacity-100"
      :style="{ background: spotlight }"
    />
    <!-- Border glow: the same light, masked down to a 1px ring -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 z-10 rounded-[inherit] p-px opacity-0 transition-opacity duration-500 group-focus-within/spotlight:opacity-100 group-hover/spotlight:opacity-100"
      :style="ringMask"
    >
      <motion.div class="absolute inset-0 rounded-[inherit]" :style="{ background: rim }" />
    </div>
    <div v-if="$slots.header" class="px-6 pt-6">
      <slot name="header" />
    </div>
    <div class="flex-1 px-6 py-5">
      <slot />
    </div>
    <div v-if="$slots.footer" class="flex items-center gap-3 border-t px-6 py-4">
      <slot name="footer" />
    </div>
  </motion.div>
</template>
