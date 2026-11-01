<script setup lang="ts" generic="T extends Record<string, any>">
import type { HTMLAttributes } from 'vue'
import type { SwipeAction } from './types'
import { AnimatePresence, motion } from 'motion-v'
import { ref } from 'vue'
import { cn } from '@/lib/utils'
import SwipeActionsRow from './SwipeActionsRow.vue'

const props = withDefaults(defineProps<{
  items: T[]
  /** Revealed by swiping right (or a function of the row). The first one is the primary, full-swipe action. */
  leading?: SwipeAction[] | ((item: T) => SwipeAction[])
  /** Revealed by swiping left (or a function of the row). The first one is the primary, full-swipe action. */
  trailing?: SwipeAction[] | ((item: T) => SwipeAction[])
  /** Property used as the row key. */
  itemKey?: keyof T & string
  /** Property used as the row's accessible name (for its actions menu). */
  itemLabel?: keyof T & string
  /** Release past `threshold` to trigger the primary action. */
  fullSwipe?: boolean
  /** Fraction of the row width that arms a full swipe. */
  threshold?: number
  /** Accessible name of the list. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  leading: () => [],
  trailing: () => [],
  itemKey: 'id' as any,
  itemLabel: 'title' as any,
  fullSwipe: true,
  threshold: 0.55,
})

const emit = defineEmits<{
  /** Remove the item from `items` in your handler and its row collapses away. */
  action: [action: SwipeAction, item: T]
}>()

defineSlots<{
  default?: (props: { item: T, index: number }) => any
}>()

const menuFor = ref<unknown>(null)
// Only one row stays open at a time.
const openKey = ref<unknown>(null)
const resolve = (actions: SwipeAction[] | ((item: T) => SwipeAction[]), item: T) =>
  typeof actions === 'function' ? actions(item) : actions
const COLLAPSE = { type: 'spring', stiffness: 420, damping: 40 } as const
</script>

<template>
  <ul
    role="list"
    :aria-label="props.label"
    :class="cn('m-0 list-none divide-y p-0', props.class)"
  >
    <AnimatePresence :initial="false">
      <motion.li
        v-for="(item, index) in props.items"
        :key="item[props.itemKey]"
        layout="position"
        :class="cn('relative', menuFor === item[props.itemKey] ? 'z-10' : 'overflow-hidden')"
        :exit="{ height: 0, opacity: 0, transition: { height: COLLAPSE, opacity: { duration: 0.2 } } }"
      >
        <SwipeActionsRow
          :leading="resolve(props.leading, item)"
          :trailing="resolve(props.trailing, item)"
          :label="String(item[props.itemLabel] ?? `Item ${index + 1}`)"
          :full-swipe="props.fullSwipe"
          :threshold="props.threshold"
          :active="openKey === item[props.itemKey]"
          @open="openKey = $event ? item[props.itemKey] : (openKey === item[props.itemKey] ? null : openKey)"
          @action="emit('action', $event, item)"
          @menu="menuFor = $event ? item[props.itemKey] : (menuFor === item[props.itemKey] ? null : menuFor)"
        >
          <slot :item="item" :index="index" />
        </SwipeActionsRow>
      </motion.li>
    </AnimatePresence>
  </ul>
</template>
