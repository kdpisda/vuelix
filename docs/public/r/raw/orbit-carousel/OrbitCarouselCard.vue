<script setup lang="ts">
import type { MotionValue } from 'motion-v'
import { motion, useTransform } from 'motion-v'

// One card on the ring. Its placement is static (rotateY + translateZ); only
// its light level follows the ring's rotation, through motion values.
const props = defineProps<{
  rotation: MotionValue<number>
  /** This card's angle on the ring, in degrees. */
  angle: number
  radius: number
  width: number
  height: number
  active: boolean
  label: string
}>()

/** Angle between this card and the front of the ring, 0…180°. */
const offFront = useTransform(props.rotation, r => Math.abs(((((props.angle - r) % 360) + 540) % 360) - 180))
// Cards dim as they turn away and fade out before they'd show their backs.
const shade = useTransform(offFront, [0, 90], [0, 0.55], { clamp: true })
const opacity = useTransform(offFront, [0, 70, 105], [1, 1, 0], { clamp: true })
</script>

<template>
  <div
    role="group"
    aria-roledescription="slide"
    :aria-label="props.label"
    :inert="!props.active || undefined"
    class="absolute left-1/2 top-1/2 [backface-visibility:hidden]"
    :style="{
      width: `${props.width}px`,
      height: `${props.height}px`,
      margin: `${-props.height / 2}px 0 0 ${-props.width / 2}px`,
      transform: `rotateY(${props.angle}deg) translateZ(${props.radius}px)`,
    }"
  >
    <motion.div
      class="relative size-full overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xl"
      :style="{ opacity }"
    >
      <slot />
      <motion.div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-background"
        :style="{ opacity: shade }"
      />
    </motion.div>
  </div>
</template>
