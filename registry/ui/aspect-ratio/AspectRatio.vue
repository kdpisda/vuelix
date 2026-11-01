<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useReducedMotion, useSpring, useTransform } from 'motion-v'
import { watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Width divided by height, e.g. `16 / 9`. Changing it animates the box. */
  ratio?: number
  /** Optional image rendered edge to edge inside the box. */
  src?: string
  alt?: string
  /** How the image fills the box (`object-fit`). */
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  /** Which part of the image stays visible when cropped (`object-position`). */
  position?: string
  class?: HTMLAttributes['class']
}>(), {
  ratio: 16 / 9,
  alt: '',
  fit: 'cover',
  position: 'center',
})

const reduced = useReducedMotion()

// The ratio itself is the animated value, so the box stays fluid in width
// and never needs to be measured.
const ratio = useSpring(props.ratio, { stiffness: 220, damping: 26, mass: 0.9 })
const aspectRatio = useTransform(ratio, r => `${Math.max(r, 0.01)}`)

watch(() => props.ratio, (next) => {
  if (reduced.value)
    ratio.jump(next)
  else
    ratio.set(next)
})
</script>

<template>
  <motion.div
    :class="cn('relative w-full overflow-hidden rounded-xl bg-muted', props.class)"
    :style="{ aspectRatio }"
  >
    <img
      v-if="props.src"
      :src="props.src"
      :alt="props.alt"
      class="absolute inset-0 size-full"
      :style="{ objectFit: props.fit, objectPosition: props.position }"
      draggable="false"
    >
    <div v-if="$slots.default" class="absolute inset-0">
      <slot />
    </div>
  </motion.div>
</template>
