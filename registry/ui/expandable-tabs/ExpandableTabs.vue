<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'

export interface ExpandableTabItem {
  value: string
  label: string
  icon: Component
  /** Renders a link (only in `as="nav"`). */
  href?: string
  disabled?: boolean
}

export interface ExpandableTabSeparator {
  separator: true
}

const props = withDefaults(defineProps<{
  items: (ExpandableTabItem | ExpandableTabSeparator)[]
  /** `tabs` → tablist semantics; `nav` → a navigation landmark with `aria-current`. */
  as?: 'tabs' | 'nav'
  /** Accessible name of the bar. */
  label?: string
  class?: HTMLAttributes['class']
  /** Classes for the active (expanded) item. */
  activeClass?: HTMLAttributes['class']
}>(), {
  as: 'tabs',
})

const model = defineModel<string>()

const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const isSeparator = (item: ExpandableTabItem | ExpandableTabSeparator): item is ExpandableTabSeparator => 'separator' in item
const tabs = computed(() => props.items.filter((i): i is ExpandableTabItem => !isSeparator(i)))
const nav = computed(() => props.as === 'nav')

if (model.value === undefined)
  model.value = tabs.value.find(t => !t.disabled)?.value

const grow = { type: 'spring', stiffness: 420, damping: 34 } as const
const label = computed(() => ({
  initial: { width: 0, opacity: 0, filter: reduced.value ? 'blur(0px)' : 'blur(6px)' },
  animate: {
    width: 'auto',
    opacity: 1,
    filter: 'blur(0px)',
    transition: { width: grow, opacity: { duration: 0.25, delay: 0.05 }, filter: { duration: 0.3, delay: 0.05 } },
  },
  exit: {
    width: 0,
    opacity: 0,
    filter: reduced.value ? 'blur(0px)' : 'blur(6px)',
    transition: { width: grow, opacity: { duration: 0.12 }, filter: { duration: 0.12 } },
  },
}))

function onKeydown(e: KeyboardEvent, item: ExpandableTabItem) {
  if (nav.value)
    return
  const enabled = tabs.value.filter(t => !t.disabled)
  const at = enabled.indexOf(item)
  let next: ExpandableTabItem | undefined
  if (e.key === 'ArrowRight')
    next = enabled[(at + 1) % enabled.length]
  else if (e.key === 'ArrowLeft')
    next = enabled[(at - 1 + enabled.length) % enabled.length]
  else if (e.key === 'Home')
    next = enabled[0]
  else if (e.key === 'End')
    next = enabled.at(-1)
  if (!next)
    return
  e.preventDefault()
  model.value = next.value
  root.value?.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus()
}
</script>

<template>
  <component
    :is="nav ? 'nav' : 'div'"
    ref="root"
    :role="nav ? undefined : 'tablist'"
    :aria-label="props.label"
    :class="cn('inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border bg-background p-1 text-foreground shadow-sm [scrollbar-width:none]', props.class)"
  >
    <template v-for="(item, index) in props.items" :key="isSeparator(item) ? `sep-${index}` : item.value">
      <span v-if="isSeparator(item)" aria-hidden="true" class="mx-1 h-6 w-px shrink-0 bg-border" />
      <component
        :is="nav && item.href ? 'a' : 'button'"
        v-else
        :type="nav && item.href ? undefined : 'button'"
        :href="nav && !item.disabled ? item.href : undefined"
        :data-value="item.value"
        :role="nav ? undefined : 'tab'"
        :aria-selected="nav ? undefined : model === item.value"
        :aria-current="nav && model === item.value ? 'page' : undefined"
        :aria-label="item.label"
        :title="model === item.value ? undefined : item.label"
        :tabindex="nav ? undefined : model === item.value ? 0 : -1"
        :disabled="nav && item.href ? undefined : item.disabled"
        :aria-disabled="item.disabled || undefined"
        :class="cn(
          'inline-flex h-10 shrink-0 cursor-pointer items-center rounded-xl px-3 text-sm font-medium no-underline outline-none transition-colors duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-40 [&_svg]:size-[18px] [&_svg]:shrink-0',
          model === item.value
            ? cn('bg-accent text-accent-foreground', props.activeClass)
            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
        )"
        @click="!item.disabled && (model = item.value)"
        @keydown="onKeydown($event, item)"
      >
        <component :is="item.icon" aria-hidden="true" />
        <AnimatePresence :initial="false">
          <motion.span
            v-if="model === item.value"
            key="label"
            aria-hidden="true"
            class="overflow-hidden whitespace-nowrap"
            :initial="label.initial"
            :animate="label.animate"
            :exit="label.exit"
          >
            <span class="block pl-2">{{ item.label }}</span>
          </motion.span>
        </AnimatePresence>
      </component>
    </template>
  </component>
</template>
