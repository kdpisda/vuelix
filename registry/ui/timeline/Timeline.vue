<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { motion, useReducedMotion, useScroll, useSpring } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

export interface TimelineItem {
  title: string
  description?: string
  /** Display text for the timestamp, e.g. "Mar 4, 2025" or "09:41". */
  time?: string
  /** Machine-readable timestamp for the `<time datetime>` attribute. */
  datetime?: string
  /** Icon component rendered inside the dot (e.g. a lucide icon). */
  icon?: Component
  /** Marks the current step: it pulses, earlier steps read as done. */
  current?: boolean
}

const props = withDefaults(defineProps<{
  items: TimelineItem[]
  /**
   * Scroll range over which the line draws, as `[start, end]` intersections of the
   * list and the viewport (motion `useScroll` offsets).
   */
  offset?: [string, string]
  class?: HTMLAttributes['class']
}>(), {
  offset: () => ['start 60%', 'end 45%'],
})

const reduced = useReducedMotion()
const list = ref<HTMLElement | null>(null)

// The line runs from the first dot to the last one, so it is measured once
// mounted (and whenever the list resizes). Before that it spans the list.
const lineHeight = ref<number | null>(null)
let observer: ResizeObserver | undefined
function measure() {
  const items = list.value?.children
  const first = items?.[0] as HTMLElement | undefined
  const last = items?.[items.length - 1] as HTMLElement | undefined
  lineHeight.value = first && last ? last.offsetTop - first.offsetTop : null
}
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (list.value)
    observer.observe(list.value)
})
onBeforeUnmount(() => observer?.disconnect())
const lineStyle = computed(() => (lineHeight.value === null ? { bottom: '16px' } : { height: `${lineHeight.value}px` }))

const { scrollYProgress } = useScroll(() => ({
  target: list.value ?? undefined,
  offset: props.offset as any,
}))
const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.6 })

const currentIndex = computed(() => props.items.findIndex(item => item.current))
function state(index: number) {
  if (currentIndex.value === -1)
    return 'default'
  if (index < currentIndex.value)
    return 'done'
  return index === currentIndex.value ? 'current' : 'upcoming'
}

const pop = { type: 'spring', stiffness: 520, damping: 18 } as const
const slide = { type: 'spring', stiffness: 260, damping: 26 } as const

const itemVariants = {
  hidden: {},
  visible: {},
}
// The hidden states stay the same with reduced motion (so server and client
// render identical markup); only the transitions collapse to zero.
const instant = { duration: 0 }
const dotVariants = computed(() => ({
  hidden: { scale: 0 },
  visible: { scale: 1, transition: reduced.value ? instant : pop },
}))
const bodyVariants = computed(() => ({
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: reduced.value ? instant : { ...slide, delay: 0.06 } },
}))
</script>

<template>
  <div :class="cn('relative w-full', props.class)">
    <!-- Track + the part of it that draws in with scroll -->
    <div aria-hidden="true" class="absolute left-4 top-4 w-px -translate-x-1/2 bg-border" :style="lineStyle" />
    <motion.div
      aria-hidden="true"
      class="absolute left-4 top-4 w-0.5 -translate-x-1/2 rounded-full bg-brand motion-reduce:hidden"
      :style="{ ...lineStyle, scaleY: progress, originY: 0 }"
    />
    <!-- Reduced motion: the line is simply there. -->
    <div
      aria-hidden="true"
      class="absolute left-4 top-4 hidden w-0.5 -translate-x-1/2 rounded-full bg-brand motion-reduce:block"
      :style="lineStyle"
    />

    <ol ref="list" class="relative m-0 flex list-none flex-col gap-7 p-0">
      <motion.li
        v-for="(item, index) in props.items"
        :key="`${index}-${item.title}`"
        class="relative flex gap-4"
        :aria-current="item.current ? 'step' : undefined"
        :variants="itemVariants"
        initial="hidden"
        while-in-view="visible"
        :in-view-options="{ once: true, margin: '0px 0px -12% 0px' }"
      >
        <div class="relative flex size-8 shrink-0 items-center justify-center">
          <span
            v-if="state(index) === 'current'"
            aria-hidden="true"
            class="absolute inset-0 motion-reduce:hidden"
          >
            <motion.span
              class="absolute inset-0 rounded-full bg-brand"
              :initial="{ scale: 1, opacity: 0.45 }"
              :animate="{ scale: 1.9, opacity: 0 }"
              :transition="{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }"
            />
          </span>
          <motion.span
            :variants="dotVariants"
            :class="cn(
              'relative flex size-8 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-xs',
              state(index) === 'done' && 'border-brand/60 text-brand',
              state(index) === 'current' && 'border-brand bg-brand text-background',
            )"
          >
            <slot name="icon" :item="item" :index="index">
              <component :is="item.icon" v-if="item.icon" class="size-4" aria-hidden="true" />
              <span v-else class="size-2 rounded-full bg-current" />
            </slot>
          </motion.span>
        </div>

        <motion.div
          :variants="bodyVariants"
          class="min-w-0 flex-1 pt-1"
        >
          <div :class="state(index) === 'upcoming' && 'opacity-60'">
            <slot name="item" :item="item" :index="index">
              <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p class="m-0 text-sm font-semibold text-foreground">
                  {{ item.title }}
                </p>
                <time
                  v-if="item.time"
                  :datetime="item.datetime"
                  class="text-xs tabular-nums text-muted-foreground"
                >{{ item.time }}</time>
              </div>
              <p v-if="item.description" class="m-0 mt-1 text-sm leading-6 text-muted-foreground">
                {{ item.description }}
              </p>
            </slot>
          </div>
        </motion.div>
      </motion.li>
    </ol>
  </div>
</template>
