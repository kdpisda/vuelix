<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { SpringButtonVariants } from '.'
import { AnimatePresence, motion } from 'motion-v'
import { cn } from '@/lib/utils'
import { springButtonVariants } from '.'

const props = withDefaults(defineProps<{
  variant?: SpringButtonVariants['variant']
  size?: SpringButtonVariants['size']
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: HTMLAttributes['class']
}>(), {
  type: 'button',
})

const spring = { type: 'spring', stiffness: 500, damping: 30, mass: 0.6 } as const
</script>

<template>
  <motion.button
    layout
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading || undefined"
    :while-hover="props.disabled || props.loading ? undefined : { scale: 1.03 }"
    :while-press="props.disabled || props.loading ? undefined : { scale: 0.94 }"
    :transition="spring"
    :class="cn(springButtonVariants({ variant: props.variant, size: props.size }), props.class)"
  >
    <AnimatePresence mode="popLayout" :initial="false">
      <motion.span
        v-if="props.loading"
        key="loading"
        class="inline-flex items-center gap-2"
        :initial="{ opacity: 0, y: 12, filter: 'blur(4px)' }"
        :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :exit="{ opacity: 0, y: -12, filter: 'blur(4px)' }"
        :transition="spring"
      >
        <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <slot name="loading" />
      </motion.span>
      <motion.span
        v-else
        key="idle"
        class="inline-flex items-center gap-2"
        :initial="{ opacity: 0, y: 12, filter: 'blur(4px)' }"
        :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :exit="{ opacity: 0, y: -12, filter: 'blur(4px)' }"
        :transition="spring"
      >
        <slot />
      </motion.span>
    </AnimatePresence>
  </motion.button>
</template>
