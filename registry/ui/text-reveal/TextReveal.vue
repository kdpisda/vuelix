<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion } from 'motion-v'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  text: string
  /** Split into words or individual characters. */
  by?: 'word' | 'char'
  as?: string
  /** Seconds between each piece. */
  stagger?: number
  delay?: number
  /** Replay every time it enters the viewport. */
  repeat?: boolean
  class?: HTMLAttributes['class']
}>(), {
  by: 'word',
  as: 'p',
  stagger: 0.06,
  delay: 0,
  repeat: false,
})

// Keep words together when splitting by character so lines never break mid-word.
const words = computed(() => props.text.split(/(\s+)/).filter(Boolean))

const container = computed(() => ({
  hidden: {},
  visible: { transition: { staggerChildren: props.stagger, delayChildren: props.delay } },
}))

const piece = {
  hidden: { opacity: 0, y: '0.4em', filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: '0em',
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
}
</script>

<template>
  <motion.div
    :as="props.as"
    :class="cn(props.class)"
    :aria-label="props.text"
    initial="hidden"
    while-in-view="visible"
    :in-view-options="{ once: !props.repeat, amount: 0.4 }"
    :variants="container"
  >
    <template v-for="(word, w) in words" :key="w">
      <span v-if="/^\s+$/.test(word)" aria-hidden="true">{{ word }}</span>
      <motion.span
        v-else-if="props.by === 'word'"
        aria-hidden="true"
        class="inline-block will-change-transform"
        :variants="piece"
      >
        {{ word }}
      </motion.span>
      <span v-else aria-hidden="true" class="inline-block whitespace-nowrap">
        <motion.span
          v-for="(char, c) in word"
          :key="c"
          class="inline-block will-change-transform"
          :variants="piece"
        >{{ char }}</motion.span>
      </span>
    </template>
  </motion.div>
</template>
