<script setup lang="ts" generic="T">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { ref, useId } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Items to render — each one gets the `#item` slot. */
  items: T[]
  /** Property name (or function) that gives each item a stable key. Defaults to the index. */
  itemKey?: keyof T | ((item: T, index: number) => string | number)
  /** Element for the wrapper, e.g. `ul` or `nav`. */
  as?: string
  /** Element for each item, e.g. `li`. */
  itemAs?: string
  /** Classes for every item wrapper. */
  itemClass?: HTMLAttributes['class']
  /** Classes for the moving highlight (colour, radius, shadow…). */
  highlightClass?: HTMLAttributes['class']
  class?: HTMLAttributes['class']
}>(), {
  as: 'div',
  itemAs: 'div',
})

const emit = defineEmits<{ highlight: [item: T | null, index: number] }>()

// One shared layout id per instance, so several lists on a page never swap highlights.
const layoutId = `vx-hover-highlight-${useId()}`
const reduced = useReducedMotion()
const active = ref<number | null>(null)
// Fade in only when entering the group; between items the highlight is already visible and just travels.
const fromOutside = ref(true)

function keyOf(item: T, index: number) {
  if (typeof props.itemKey === 'function')
    return props.itemKey(item, index)
  if (props.itemKey !== undefined)
    return item[props.itemKey] as unknown as string | number
  return index
}

function set(index: number | null) {
  if (active.value === index)
    return
  fromOutside.value = active.value === null
  active.value = index
  emit('highlight', index === null ? null : props.items[index]!, index ?? -1)
}

function onFocusOut(e: FocusEvent) {
  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null))
    set(null)
}

const spring = { type: 'spring', stiffness: 480, damping: 38, mass: 0.8 } as const
</script>

<template>
  <component
    :is="props.as"
    :class="cn('relative', props.class)"
    @pointerleave="set(null)"
    @focusout="onFocusOut"
  >
    <component
      :is="props.itemAs"
      v-for="(item, index) in props.items"
      :key="keyOf(item, index)"
      :class="cn('relative isolate', props.itemClass)"
      :data-highlighted="active === index ? '' : undefined"
      @pointerenter="set(index)"
      @focusin="set(index)"
    >
      <AnimatePresence>
        <motion.span
          v-if="active === index"
          key="highlight"
          aria-hidden="true"
          :layout-id="reduced ? undefined : layoutId"
          :class="cn('pointer-events-none absolute inset-0 -z-10 rounded-lg bg-accent', props.highlightClass)"
          :initial="fromOutside ? { opacity: 0 } : false"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :transition="reduced ? { duration: 0.12 } : { ...spring, opacity: { duration: 0.15 } }"
        />
      </AnimatePresence>
      <slot name="item" :item="item" :index="index" :active="active === index" />
    </component>
  </component>
</template>
