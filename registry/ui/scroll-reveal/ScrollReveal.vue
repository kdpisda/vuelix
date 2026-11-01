<script setup lang="ts">
import type { HTMLAttributes, VNode } from 'vue'
import { motion, useReducedMotion } from 'motion-v'
import { Comment, computed, Fragment, Text, useSlots } from 'vue'
import { cn } from '@/lib/utils'

export type ScrollRevealPreset = 'fade-up' | 'blur-in' | 'scale' | 'slide-left' | 'slide-right'

const props = withDefaults(defineProps<{
  /** How each child enters. `slide-left` comes in from the left, `slide-right` from the right. */
  preset?: ScrollRevealPreset
  /** Seconds between consecutive children. */
  stagger?: number
  /** Seconds before the first child starts. */
  delay?: number
  /** Travel distance in px for `fade-up` and the slides. */
  distance?: number
  /** Reveal only the first time; otherwise hide again when scrolled out. */
  once?: boolean
  /** Fraction of the wrapper that must be visible before it reveals (0 … 1). */
  amount?: number
  /** Element rendered for the wrapper. */
  as?: string
  /** Classes for the element wrapped around each child (e.g. `h-full` in a grid). */
  itemClass?: HTMLAttributes['class']
  class?: HTMLAttributes['class']
}>(), {
  preset: 'fade-up',
  stagger: 0.08,
  delay: 0,
  distance: 24,
  once: true,
  amount: 0.25,
  as: 'div',
})

const slots = useSlots()
const reduced = useReducedMotion()

// Every top-level child gets its own motion wrapper so it can be staggered.
// v-for output arrives as a Fragment, so unwrap those and drop comments / whitespace.
function flatten(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) => {
    if (node.type === Fragment)
      return flatten(node.children as VNode[])
    if (node.type === Comment || (node.type === Text && !String(node.children).trim()))
      return []
    return [node]
  })
}
const children = () => flatten(slots.default?.() ?? [])

const container = computed(() => ({
  hidden: {},
  visible: { transition: { staggerChildren: props.stagger, delayChildren: props.delay } },
}))

const item = computed(() => {
  const d = props.distance
  const hidden = reduced.value
    ? { opacity: 0 }
    : {
        'fade-up': { opacity: 0, y: d },
        'blur-in': { opacity: 0, scale: 0.98, filter: 'blur(10px)' },
        'scale': { opacity: 0, scale: 0.88 },
        'slide-left': { opacity: 0, x: -d * 1.6 },
        'slide-right': { opacity: 0, x: d * 1.6 },
      }[props.preset]
  return {
    hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: reduced.value
        ? { duration: 0.4 }
        : { type: 'spring', stiffness: 170, damping: 24, mass: 0.9, filter: { duration: 0.5 } },
    },
  }
})
</script>

<template>
  <motion.div
    :as="props.as"
    :class="cn(props.class)"
    initial="hidden"
    while-in-view="visible"
    :in-view-options="{ once: props.once, amount: props.amount }"
    :variants="container"
  >
    <motion.div
      v-for="(child, i) in children()"
      :key="child.key ?? i"
      :class="cn(props.itemClass)"
      :variants="item"
    >
      <component :is="child" />
    </motion.div>
  </motion.div>
</template>
