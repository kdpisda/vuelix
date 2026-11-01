<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface BreadcrumbsItem {
  label: string
  /** Render as a link. Without it the crumb is a button that emits `navigate`. */
  href?: string
  /** Optional leading icon component. */
  icon?: Component
}

const props = withDefaults(defineProps<{
  items: BreadcrumbsItem[]
  /** Collapse the middle of the trail when there are more items than this. */
  maxItems?: number
  /** Accessible name of the navigation landmark. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  maxItems: 4,
  label: 'Breadcrumb',
})

const emit = defineEmits<{ navigate: [item: BreadcrumbsItem, index: number] }>()

const underlineId = `vx-crumbs-${useId()}`
const list = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

const spring = { type: 'spring', stiffness: 420, damping: 30 } as const
const STAGGER = 0.06

const expanded = ref(false)
const revealed = ref(false) // true right after the ellipsis was opened
const ready = ref(false) // after the first paint, only new crumbs animate
onMounted(() => (ready.value = true))
watch(() => props.items.length, () => {
  expanded.value = false
  revealed.value = false
})

type Entry =
  | { kind: 'item', key: string, item: BreadcrumbsItem, index: number }
  | { kind: 'ellipsis', key: string, count: number }

// How many trailing crumbs stay visible when the middle is collapsed.
const tail = computed(() => Math.max(1, props.maxItems - 2))

const entries = computed<Entry[]>(() => {
  const all: Entry[] = props.items.map((item, index) => ({ kind: 'item', key: `${index}:${item.label}`, item, index }))
  const keep = tail.value
  if (expanded.value || props.items.length <= props.maxItems)
    return all
  return [all[0]!, { kind: 'ellipsis', key: '…', count: props.items.length - 1 - keep }, ...all.slice(-keep)]
})

const lastIndex = computed(() => props.items.length - 1)

function delayFor(entry: Entry, position: number) {
  if (!ready.value)
    return position * STAGGER
  // Revealed middle crumbs wait a beat so the row can make room first.
  if (revealed.value && entry.kind === 'item' && entry.index > 0 && entry.index < props.items.length - tail.value)
    return 0.08 + (entry.index - 1) * 0.045
  return 0
}

async function expand() {
  expanded.value = true
  revealed.value = true
  await nextTick()
  list.value?.querySelector<HTMLElement>('[data-crumb="1"]')?.focus()
}

const enter = computed(() => (reduced.value
  ? { opacity: 0 }
  : { opacity: 0, x: -6, scale: 0.92, filter: 'blur(4px)' }))
</script>

<template>
  <nav :aria-label="props.label" :class="cn('text-sm', props.class)">
    <div ref="list">
      <AnimatePresence as="ol" mode="popLayout" class="relative m-0 flex list-none flex-wrap items-center gap-x-1.5 gap-y-1 p-0">
        <motion.li
          v-for="(entry, position) in entries"
          :key="entry.key"
          :layout="!reduced"
          :data-expanded="expanded"
          class="inline-flex items-center gap-1.5"
          :initial="enter"
          :animate="{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, scale: 0.8, transition: { duration: 0.12 } }"
          :transition="{ ...spring, delay: delayFor(entry, position), layout: spring }"
        >
          <svg
            v-if="position > 0"
            class="size-3.5 shrink-0 text-muted-foreground/60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          ><path d="m9 18 6-6-6-6" /></svg>

          <button
            v-if="entry.kind === 'ellipsis'"
            type="button"
            :aria-label="`Show ${entry.count} hidden ${entry.count === 1 ? 'level' : 'levels'}`"
            aria-expanded="false"
            class="inline-flex h-6 items-center rounded-md px-1.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="expand"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
          </button>

          <span
            v-else-if="entry.index === lastIndex"
            aria-current="page"
            class="relative inline-flex items-center gap-1.5 py-0.5 font-medium text-foreground"
          >
            <slot name="item" :item="entry.item" :current="true">
              <component :is="entry.item.icon" v-if="entry.item.icon" class="size-4" aria-hidden="true" />
              {{ entry.item.label }}
            </slot>
            <motion.span
              aria-hidden="true"
              :layout-id="underlineId"
              class="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-brand"
              :initial="{ scaleX: 0 }"
              :animate="{ scaleX: 1 }"
              :transition="{ ...spring, delay: reduced ? 0 : (ready ? 0.1 : position * STAGGER + 0.15) }"
            />
          </span>

          <component
            :is="entry.item.href ? 'a' : 'button'"
            v-else
            :href="entry.item.href"
            :type="entry.item.href ? undefined : 'button'"
            :data-crumb="entry.index"
            class="inline-flex items-center gap-1.5 rounded-md py-0.5 text-muted-foreground no-underline outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="emit('navigate', entry.item, entry.index)"
          >
            <slot name="item" :item="entry.item" :current="false">
              <component :is="entry.item.icon" v-if="entry.item.icon" class="size-4" aria-hidden="true" />
              {{ entry.item.label }}
            </slot>
          </component>
        </motion.li>
      </AnimatePresence>
    </div>
  </nav>
</template>
