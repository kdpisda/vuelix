<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion-v'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Maximum tilt in degrees. */
  maxTilt?: number
  /** Show a moving light reflection. */
  glare?: boolean
  scale?: number
  class?: HTMLAttributes['class']
}>(), {
  maxTilt: 12,
  glare: true,
  scale: 1.02,
})

const reduced = useReducedMotion()

// Pointer position normalised to -0.5 … 0.5
const px = useMotionValue(0)
const py = useMotionValue(0)
const springCfg = { stiffness: 260, damping: 22, mass: 0.6 }
const sx = useSpring(px, springCfg)
const sy = useSpring(py, springCfg)

const rotateX = useTransform(sy, v => (reduced.value ? 0 : -v * props.maxTilt * 2))
const rotateY = useTransform(sx, v => (reduced.value ? 0 : v * props.maxTilt * 2))
const glareX = useTransform(sx, v => `${(v + 0.5) * 100}%`)
const glareY = useTransform(sy, v => `${(v + 0.5) * 100}%`)
const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.35), transparent 55%)`

function onMove(e: PointerEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  px.set((e.clientX - rect.left) / rect.width - 0.5)
  py.set((e.clientY - rect.top) / rect.height - 0.5)
}
function onLeave() {
  px.set(0)
  py.set(0)
}
</script>

<template>
  <motion.div
    :class="cn('group relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm [transform-style:preserve-3d]', props.class)"
    :style="{ rotateX, rotateY, transformPerspective: 900 }"
    :while-hover="{ scale: props.scale }"
    :transition="{ type: 'spring', stiffness: 300, damping: 24 }"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <slot />
    <motion.div
      v-if="props.glare"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-100"
      :style="{ background: glareBg }"
    />
  </motion.div>
</template>
