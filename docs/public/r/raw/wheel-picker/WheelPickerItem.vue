<script setup lang="ts">
import type { MotionValue } from 'motion-v'
import { motion, useTransform } from 'motion-v'

// One face of the drum. Its 3D position is derived from the wheel's scroll
// offset with motion values, so dragging never re-renders Vue.
const props = defineProps<{
  id: string
  index: number
  label: string
  selected: boolean
  offset: MotionValue<number>
  itemHeight: number
  /** Angle between two neighbouring items, in degrees. */
  step: number
  /** Drum radius in px. */
  radius: number
}>()

const DEG = Math.PI / 180

/** Signed angle of this item from the front of the drum, in degrees. */
const angle = useTransform(props.offset, o => (props.index + o / props.itemHeight) * props.step)

const y = useTransform(angle, a => props.radius * Math.sin(Math.max(-90, Math.min(90, a)) * DEG))
const z = useTransform(angle, a => props.radius * (Math.cos(Math.max(-90, Math.min(90, a)) * DEG) - 1))
const rotateX = useTransform(angle, a => -a)
const opacity = useTransform(angle, (a) => {
  const items = Math.abs(a) / props.step
  return Math.abs(a) >= 90 ? 0 : Math.max(0.1, 1 - items * 0.3)
})
const scale = useTransform(angle, a => 1 - Math.min(1, Math.abs(a) / 90) * 0.08)
</script>

<template>
  <motion.div
    :id="props.id"
    role="option"
    :aria-selected="props.selected"
    class="absolute inset-x-0 top-1/2 flex items-center justify-center whitespace-nowrap [backface-visibility:hidden]"
    :style="{ height: `${props.itemHeight}px`, marginTop: `${-props.itemHeight / 2}px`, y, z, rotateX, opacity, scale }"
  >
    {{ props.label }}
  </motion.div>
</template>
