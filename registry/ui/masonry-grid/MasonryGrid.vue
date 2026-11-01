<script setup lang="ts" generic="T">
import type { HTMLAttributes } from 'vue'
import { motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  items: T[]
  /** Property name or function returning a stable key per item. */
  itemKey?: string | ((item: T, index: number) => string | number)
  /** Columns are as many as fit at this minimum width (px). */
  minColumnWidth?: number
  /** Force a column count instead of deriving it from the width. */
  columns?: number
  /** Gap between items (px). */
  gap?: number
  /** True while you're fetching the next page — shows the loader and pauses `load-more`. */
  loading?: boolean
  /** Set to false when there's nothing left to load. */
  hasMore?: boolean
  /** How early (before the end is visible) to ask for more. */
  rootMargin?: string
  /** Accessible name of the grid. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  itemKey: 'id',
  minColumnWidth: 220,
  gap: 16,
  loading: false,
  hasMore: true,
  rootMargin: '0px 0px 320px 0px',
})

const emit = defineEmits<{ 'load-more': [] }>()

defineSlots<{
  default?: (props: { item: T, index: number }) => any
  loader?: () => any
  end?: () => any
}>()

const MOVE = { type: 'spring', stiffness: 260, damping: 30 } as const
const reduced = useReducedMotion()

const keyOf = (item: T, index: number) => String(typeof props.itemKey === 'function'
  ? props.itemKey(item, index)
  : (item as Record<string, unknown>)[props.itemKey])

// ---------------------------------------------------------------------------
// Measuring
// ---------------------------------------------------------------------------
const root = ref<HTMLElement>()
const sentinel = ref<HTMLElement>()
const width = ref(0)
const heights = ref<Record<string, number>>({})
/** Keys whose first measurement has been painted; only these animate when they move. */
const settled = ref<Record<string, boolean>>({})

let rootObserver: ResizeObserver | undefined
let itemObserver: ResizeObserver | undefined
let viewObserver: IntersectionObserver | undefined
const elKeys = new WeakMap<Element, string>()

onMounted(() => {
  if (!root.value || typeof ResizeObserver === 'undefined')
    return
  rootObserver = new ResizeObserver(([entry]) => (width.value = entry!.contentRect.width))
  rootObserver.observe(root.value)
  width.value = root.value.clientWidth

  itemObserver = new ResizeObserver((entries) => {
    const next = { ...heights.value }
    const fresh: string[] = []
    for (const entry of entries) {
      const key = elKeys.get(entry.target)
      if (key === undefined)
        continue
      const h = entry.borderBoxSize?.[0]?.blockSize ?? (entry.target as HTMLElement).offsetHeight
      if (next[key] !== h) {
        if (next[key] === undefined)
          fresh.push(key)
        next[key] = h
      }
    }
    heights.value = next
    if (fresh.length)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        settled.value = { ...settled.value, ...Object.fromEntries(fresh.map(k => [k, true])) }
      }))
  })

  if (sentinel.value && typeof IntersectionObserver !== 'undefined') {
    viewObserver = new IntersectionObserver(([entry]) => (sentinelVisible.value = entry!.isIntersecting), { rootMargin: props.rootMargin })
    viewObserver.observe(sentinel.value)
  }
})

onBeforeUnmount(() => {
  rootObserver?.disconnect()
  itemObserver?.disconnect()
  viewObserver?.disconnect()
})

const elByKey = new Map<string, Element>()
function track(key: string, el: unknown) {
  const node = (el as { $el?: Element } | null)?.$el ?? el
  const prev = elByKey.get(key)
  if (prev && prev !== node) {
    itemObserver?.unobserve(prev)
    elByKey.delete(key)
  }
  if (node instanceof Element && prev !== node) {
    elKeys.set(node, key)
    elByKey.set(key, node)
    itemObserver?.observe(node)
  }
}

// ---------------------------------------------------------------------------
// Layout: each item goes into the currently shortest column
// ---------------------------------------------------------------------------
const columnCount = computed(() => Math.max(1, props.columns
  ?? Math.floor((width.value + props.gap) / (props.minColumnWidth + props.gap))))
const columnWidth = computed(() => (width.value - props.gap * (columnCount.value - 1)) / columnCount.value)

const layout = computed(() => {
  const cols = Array.from<number>({ length: columnCount.value }).fill(0)
  const placed = props.items.map((item, index) => {
    const key = keyOf(item, index)
    const h = heights.value[key] ?? columnWidth.value
    let col = 0
    for (let c = 1; c < cols.length; c++) {
      if (cols[c]! < cols[col]!)
        col = c
    }
    const pos = { key, item, index, col, x: col * (columnWidth.value + props.gap), y: cols[col]! }
    cols[col]! += h + props.gap
    return pos
  })
  return { placed, height: Math.max(0, Math.max(...cols) - props.gap) }
})

// ---------------------------------------------------------------------------
// Infinite loading
// ---------------------------------------------------------------------------
const sentinelVisible = ref(false)
watch(
  () => [sentinelVisible.value, props.loading, props.hasMore, props.items.length, width.value] as const,
  ([visible, loading, more, , w]) => {
    if (visible && !loading && more && w > 0)
      emit('load-more')
  },
)
</script>

<template>
  <div :class="cn('w-full', props.class)">
    <div
      ref="root"
      role="list"
      :aria-label="props.label"
      :aria-busy="props.loading || undefined"
      class="relative w-full"
      :style="{ height: `${layout.height}px` }"
    >
      <template v-if="width > 0">
        <motion.div
          v-for="cell in layout.placed"
          :key="cell.key"
          :ref="(el: unknown) => track(cell.key, el)"
          role="listitem"
          class="absolute left-0 top-0"
          :style="{ width: `${columnWidth}px` }"
          :initial="false"
          :animate="{ x: cell.x, y: cell.y }"
          :transition="settled[cell.key] && !reduced ? MOVE : { duration: 0 }"
        >
          <motion.div
            :initial="reduced ? false : { opacity: 0, y: 28, scale: 0.97 }"
            :while-in-view="{ opacity: 1, y: 0, scale: 1 }"
            :in-view-options="{ once: true, amount: 0.1 }"
            :transition="{ type: 'spring', stiffness: 200, damping: 26, delay: (cell.col % 4) * 0.05 }"
          >
            <slot :item="cell.item" :index="cell.index" />
          </motion.div>
        </motion.div>
      </template>
    </div>

    <div ref="sentinel" aria-hidden="true" class="h-px w-full" />

    <div v-if="props.loading" class="flex justify-center py-6" role="status">
      <slot name="loader">
        <span class="sr-only">Loading more</span>
        <span class="flex items-center gap-1.5" aria-hidden="true">
          <motion.span
            v-for="i in 3"
            :key="i"
            class="size-2 rounded-full bg-muted-foreground/60"
            :animate="reduced ? { opacity: 0.6 } : { y: [0, -6, 0], opacity: [0.4, 1, 0.4] }"
            :transition="{ duration: 0.8, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }"
          />
        </span>
      </slot>
    </div>
    <div v-else-if="!props.hasMore && props.items.length" class="py-6 text-center text-xs text-muted-foreground">
      <slot name="end">
        You've reached the end.
      </slot>
    </div>
  </div>
</template>
