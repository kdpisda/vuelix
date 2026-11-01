<script setup lang="ts">
import type { ContextMenuEntry } from './types'
import { motion } from 'motion-v'
import { cn } from '@/lib/utils'
import { isAction } from './types'

// Renders the rows of one menu level. All state lives in <ContextMenu>.
const props = defineProps<{
  entries: ContextMenuEntry[]
  /** Index of the highlighted row (-1 for none). */
  highlighted: number
  /** Index of the row whose submenu is open (-1 for none). */
  expanded: number
  /** Shared layout id for the gliding highlight of this level. */
  layoutId: string
  /** Prefix for row ids. */
  idPrefix: string
  reduced: boolean
}>()

const emit = defineEmits<{
  hover: [index: number]
  activate: [index: number]
}>()

const glide = { type: 'spring', stiffness: 700, damping: 45, mass: 0.6 } as const
</script>

<template>
  <template v-for="(entry, i) in props.entries" :key="i">
    <div
      v-if="entry.type === 'separator'"
      role="separator"
      class="-mx-1 my-1 h-px bg-border"
    />
    <div
      v-else-if="entry.type === 'label'"
      role="presentation"
      class="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground"
    >
      {{ entry.label }}
    </div>
    <div
      v-else-if="isAction(entry)"
      :id="`${props.idPrefix}-${i}`"
      role="menuitem"
      tabindex="-1"
      :data-index="i"
      :aria-disabled="entry.disabled || undefined"
      :aria-haspopup="entry.children?.length ? 'menu' : undefined"
      :aria-expanded="entry.children?.length ? props.expanded === i : undefined"
      :class="cn(
        'relative isolate flex h-8 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm outline-none',
        entry.destructive ? 'text-destructive' : 'text-popover-foreground',
        entry.disabled && 'opacity-50',
      )"
      @pointermove="emit('hover', i)"
      @click="emit('activate', i)"
    >
      <motion.span
        v-if="props.highlighted === i"
        aria-hidden="true"
        :layout-id="props.layoutId"
        :class="cn('absolute inset-0 -z-10 rounded-md', entry.destructive ? 'bg-destructive/10' : 'bg-accent')"
        :transition="props.reduced ? { duration: 0 } : glide"
      />
      <component
        :is="entry.icon"
        v-if="entry.icon"
        aria-hidden="true"
        :class="cn('size-4 shrink-0', entry.destructive ? 'text-destructive' : 'text-muted-foreground')"
      />
      <span class="flex-1 truncate">{{ entry.label }}</span>
      <span
        v-if="entry.shortcut"
        aria-hidden="true"
        class="ml-auto pl-6 text-xs tracking-widest text-muted-foreground"
      >{{ entry.shortcut }}</span>
      <svg
        v-if="entry.children?.length"
        class="ml-auto size-3.5 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      ><path d="m9 18 6-6-6-6" /></svg>
    </div>
  </template>
</template>
