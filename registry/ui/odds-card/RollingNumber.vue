<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useReducedMotion } from 'motion-v'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

// Odometer-style number: every digit is a 0–9 column that springs to its new place.
const props = defineProps<{
  value: number
  locale?: string
  format?: Intl.NumberFormatOptions
  class?: HTMLAttributes['class']
}>()

const reduced = useReducedMotion()
const roll = { type: 'spring', stiffness: 180, damping: 22, mass: 0.7 } as const

const text = computed(() => new Intl.NumberFormat(props.locale, props.format).format(props.value))
// Keyed from the right so units stay units when the number gains a digit.
const chars = computed(() => {
  const all = [...text.value]
  return all.map((char, i) => ({ char, key: all.length - i, digit: /\d/.test(char) ? Number(char) : null }))
})
</script>

<template>
  <span :class="cn('inline-flex', props.class)">
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true" class="inline-flex">
      <template v-for="c in chars" :key="c.key">
        <span v-if="c.digit === null" class="inline-block h-[1.15em] whitespace-pre leading-[1.15]">{{ c.char }}</span>
        <!-- The invisible copy sizes the slot to the current digit; the column rolls inside it. -->
        <span v-else class="relative inline-block h-[1.15em] overflow-hidden leading-[1.15]">
          <span class="invisible">{{ c.char }}</span>
          <motion.span
            class="absolute inset-x-0 top-0 flex flex-col items-center"
            :initial="false"
            :animate="{ y: `${-c.digit * 10}%` }"
            :transition="reduced ? { duration: 0 } : roll"
          >
            <span v-for="n in 10" :key="n" class="block h-[1.15em]">{{ n - 1 }}</span>
          </motion.span>
        </span>
      </template>
    </span>
  </span>
</template>
