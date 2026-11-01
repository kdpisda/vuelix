<script setup lang="ts" generic="T">
import type { HTMLAttributes } from 'vue'
import { ReorderGroup, ReorderItem, useDragControls, useReducedMotion } from 'motion-v'
import { nextTick, ref, useId } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Unique key per item: a property name or a function. Defaults to the item itself. */
  itemKey?: keyof T | ((item: T) => PropertyKey)
  /** Text announced to screen readers for an item. Defaults to `label`, `name`, `title` or the item itself. */
  itemLabel?: (item: T) => string
  /** Only start dragging from the grip handle (otherwise the whole row drags). */
  handle?: boolean
  /** Accessible name for the list. */
  label?: string
  class?: HTMLAttributes['class']
  /** Classes for every row. */
  itemClass?: HTMLAttributes['class']
}>(), {
  handle: true,
  label: 'Sortable list',
})

const items = defineModel<T[]>({ required: true })
const emit = defineEmits<{ reorder: [items: T[], moved: T] }>()

const uid = useId()
const reduced = useReducedMotion()
const root = ref<HTMLElement | null>(null)
const announcement = ref('')

const lift = { type: 'spring', stiffness: 500, damping: 32 } as const

function keyOf(item: T): PropertyKey {
  if (typeof props.itemKey === 'function')
    return props.itemKey(item)
  if (props.itemKey !== undefined)
    return (item as Record<PropertyKey, unknown>)[props.itemKey as PropertyKey] as PropertyKey
  return item as unknown as PropertyKey
}

function labelOf(item: T): string {
  if (props.itemLabel)
    return props.itemLabel(item)
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>
    return String(o.label ?? o.name ?? o.title ?? '')
  }
  return String(item)
}

// One DragControls per row so a grip only drags its own row.
const controls = new Map<PropertyKey, ReturnType<typeof useDragControls>>()
function controlsFor(item: T) {
  const key = keyOf(item)
  if (!controls.has(key))
    controls.set(key, useDragControls())
  return controls.get(key)!
}

function announce(item: T, list: T[]) {
  announcement.value = `${labelOf(item)}, position ${list.indexOf(item) + 1} of ${list.length}`
}

function onReorder(next: T[], moved: T) {
  items.value = next
  emit('reorder', next, moved)
  announce(moved, next)
}

// Alt + Arrow moves the focused row. (Space then arrows is also supported by
// motion's Reorder: Space picks the row up, Escape cancels.)
async function onKeydown(e: KeyboardEvent, item: T) {
  if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown'))
    return
  e.preventDefault()
  const list = [...items.value]
  const from = list.indexOf(item)
  const to = from + (e.key === 'ArrowUp' ? -1 : 1)
  if (to < 0 || to >= list.length)
    return
  list.splice(to, 0, ...list.splice(from, 1))
  onReorder(list, item)
  await nextTick()
  const key = String(keyOf(item))
  root.value?.querySelector<HTMLElement>(`[data-sortable-key="${CSS.escape(key)}"]`)?.focus()
}
</script>

<template>
  <div ref="root" :class="cn('w-full', props.class)">
    <ReorderGroup
      as="ul"
      axis="y"
      :values="items"
      :aria-label="props.label"
      :aria-describedby="`${uid}-hint`"
      class="m-0 flex list-none flex-col gap-2 p-0"
      @update:values="onReorder"
    >
      <ReorderItem
        v-for="(item, index) in items"
        :key="keyOf(item)"
        v-slot="{ isDragging }"
        :value="item"
        as="li"
        :data-sortable-key="String(keyOf(item))"
        :drag-listener="!props.handle"
        :drag-controls="props.handle ? controlsFor(item) : undefined"
        :while-drag="reduced ? undefined : { scale: 1.03 }"
        :transition="lift"
        :class="cn(
          'relative flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-sm text-card-foreground shadow-xs outline-none transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/50',
          !props.handle && 'cursor-grab touch-none active:cursor-grabbing',
          props.itemClass,
        )"
        @keydown="onKeydown($event, item)"
      >
        <span
          v-if="props.handle"
          aria-hidden="true"
          :class="cn(
            'flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing',
            isDragging && 'bg-muted text-foreground',
          )"
          @pointerdown="controlsFor(item).start($event)"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
            <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
            <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
          </svg>
        </span>
        <div class="min-w-0 flex-1">
          <slot :item="item" :index="index" :dragging="isDragging">
            {{ labelOf(item) }}
          </slot>
        </div>
        <span
          aria-hidden="true"
          :class="cn(
            'pointer-events-none absolute inset-0 rounded-[inherit] shadow-xl ring-1 ring-ring/25 transition-opacity duration-200',
            isDragging ? 'opacity-100' : 'opacity-0',
          )"
        />
      </ReorderItem>
    </ReorderGroup>
    <p :id="`${uid}-hint`" class="sr-only">
      Press Alt with the up or down arrow to move the focused item. Or press Space to pick it
      up, use the arrows to move it, and Space again to drop it (Escape cancels).
    </p>
    <p class="sr-only" aria-live="assertive">
      {{ announcement }}
    </p>
  </div>
</template>
