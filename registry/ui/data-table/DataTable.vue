<script setup lang="ts" generic="Row extends Record<string, any>">
import type { HTMLAttributes } from 'vue'
import type { DataTableColumn, DataTableSort } from './types'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import DataTableCheckbox from './DataTableCheckbox.vue'

type RowKey = string | number

const props = withDefaults(defineProps<{
  columns: DataTableColumn<Row>[]
  rows: Row[]
  /** Property (or function) that uniquely identifies a row. */
  rowKey?: keyof Row | ((row: Row) => RowKey)
  /** Adds a checkbox column and the selection bar. */
  selectable?: boolean
  /** Accessible caption (visually hidden). */
  caption?: string
  /** Shown when there are no rows; override with the `#empty` slot. */
  emptyText?: string
  class?: HTMLAttributes['class']
}>(), {
  rowKey: 'id',
  selectable: false,
  emptyText: 'No results.',
})

/** Keys of the selected rows. */
const selected = defineModel<RowKey[]>('selected', { default: () => [] })
/** Current sort, or `null` for the original order. */
const sort = defineModel<DataTableSort | null>('sort', { default: null })

const reduced = useReducedMotion()
const spring = { type: 'spring', stiffness: 420, damping: 36 } as const
const transition = computed(() => (reduced.value ? { duration: 0 } : spring))

function keyOf(row: Row): RowKey {
  return typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey]
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

const sortedRows = computed(() => {
  const s = sort.value
  const column = s && props.columns.find(c => c.key === s.key)
  if (!s || !column)
    return props.rows
  const value = (row: Row) => (column.sortValue ? column.sortValue(row) : row[column.key])
  const dir = s.direction === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    if (va == null || vb == null)
      return va == null ? (vb == null ? 0 : 1) : -1
    if (typeof va === 'number' && typeof vb === 'number')
      return (va - vb) * dir
    if (va instanceof Date && vb instanceof Date)
      return (va.getTime() - vb.getTime()) * dir
    return collator.compare(String(va), String(vb)) * dir
  })
})

// asc → desc → original order
function toggleSort(key: string) {
  if (sort.value?.key !== key)
    sort.value = { key, direction: 'asc' }
  else if (sort.value.direction === 'asc')
    sort.value = { key, direction: 'desc' }
  else
    sort.value = null
}

function ariaSort(column: DataTableColumn<Row>) {
  if (!column.sortable)
    return undefined
  if (sort.value?.key !== column.key)
    return 'none'
  return sort.value.direction === 'asc' ? 'ascending' : 'descending'
}

const selectedSet = computed(() => new Set(selected.value))
const visibleKeys = computed(() => props.rows.map(keyOf))
const selectedCount = computed(() => visibleKeys.value.filter(k => selectedSet.value.has(k)).length)
const allState = computed<boolean | 'mixed'>(() => {
  if (!selectedCount.value)
    return false
  return selectedCount.value === visibleKeys.value.length ? true : 'mixed'
})

function toggleRow(row: Row) {
  const key = keyOf(row)
  selected.value = selectedSet.value.has(key)
    ? selected.value.filter(k => k !== key)
    : [...selected.value, key]
}

function toggleAll() {
  selected.value = allState.value === true ? [] : [...visibleKeys.value]
}

function clear() {
  selected.value = []
}

const colspan = computed(() => props.columns.length + (props.selectable ? 1 : 0))
const alignClass = { left: 'text-left!', center: 'text-center!', right: 'text-right!' } as const
const justifyClass = { left: 'justify-start', center: 'justify-center', right: 'justify-end' } as const
</script>

<template>
  <div :class="cn('relative w-full overflow-hidden rounded-xl border bg-card text-card-foreground', props.class)">
    <div class="w-full overflow-x-auto">
      <!-- The `!` utilities keep global table styles (docs themes, typography
           plugins) from leaking into the table. -->
      <table class="m-0! table! w-full border-collapse text-sm">
        <caption v-if="props.caption" class="sr-only">
          {{ props.caption }}
        </caption>
        <thead class="border-b bg-muted/40">
          <tr class="border-t-0! bg-transparent!">
            <th v-if="props.selectable" scope="col" class="w-10 border-0! bg-transparent! py-2! pl-3! pr-0!">
              <DataTableCheckbox
                :checked="allState"
                :label="allState === true ? 'Deselect all rows' : 'Select all rows'"
                :reduced="reduced"
                :disabled="!visibleKeys.length"
                @toggle="toggleAll"
              />
            </th>
            <th
              v-for="column in props.columns"
              :key="column.key"
              scope="col"
              :aria-sort="ariaSort(column)"
              :class="cn('h-10 whitespace-nowrap border-0! bg-transparent! px-3! py-0! text-sm! font-medium! text-muted-foreground!', alignClass[column.align ?? 'left'], column.class)"
            >
              <button
                v-if="column.sortable"
                type="button"
                :class="cn(
                  '-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  sort?.key === column.key && 'text-foreground',
                  justifyClass[column.align ?? 'left'],
                )"
                @click="toggleSort(column.key)"
              >
                <slot :name="`header-${column.key}`" :column="column">
                  {{ column.label }}
                </slot>
                <motion.svg
                  class="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  :initial="false"
                  :animate="{
                    rotate: sort?.key === column.key && sort.direction === 'desc' ? 180 : 0,
                    opacity: sort?.key === column.key ? 1 : 0.35,
                  }"
                  :transition="transition"
                >
                  <path d="M12 19V5M6 11l6-6 6 6" />
                </motion.svg>
              </button>
              <slot v-else :name="`header-${column.key}`" :column="column">
                {{ column.label }}
              </slot>
            </th>
          </tr>
        </thead>
        <AnimatePresence as="tbody" :initial="false">
          <motion.tr
            v-for="row in sortedRows"
            :key="keyOf(row)"
            layout="position"
            :data-state="selectedSet.has(keyOf(row)) ? 'selected' : undefined"
            :class="cn(
              'border-b border-t-0! bg-transparent! transition-colors! duration-150! last:border-b-0 hover:bg-muted/50!',
              selectedSet.has(keyOf(row)) && 'bg-muted/70! hover:bg-muted!',
            )"
            :exit="{ opacity: 0 }"
            :transition="transition"
          >
            <td v-if="props.selectable" class="w-10 border-0! py-2! pl-3! pr-0!">
              <DataTableCheckbox
                :checked="selectedSet.has(keyOf(row))"
                :label="`Select row ${keyOf(row)}`"
                :reduced="reduced"
                @toggle="toggleRow(row)"
              />
            </td>
            <td
              v-for="column in props.columns"
              :key="column.key"
              :class="cn('border-0! px-3! py-2.5!', alignClass[column.align ?? 'left'], column.class)"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ row[column.key] }}
              </slot>
            </td>
          </motion.tr>
          <motion.tr
            v-if="!sortedRows.length"
            key="vx-empty"
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :transition="{ delay: 0.15 }"
          >
            <td :colspan="colspan" class="border-0! px-3! py-12! text-center text-sm text-muted-foreground">
              <slot name="empty">
                {{ props.emptyText }}
              </slot>
            </td>
          </motion.tr>
        </AnimatePresence>
      </table>
    </div>

    <AnimatePresence :initial="false">
      <motion.div
        v-if="props.selectable && selectedCount > 0"
        key="bar"
        class="overflow-hidden"
        :initial="{ height: 0 }"
        :animate="{ height: 'auto' }"
        :exit="{ height: 0 }"
        :transition="transition"
      >
        <motion.div
          role="status"
          class="flex items-center gap-3 border-t bg-muted/40 px-3 py-2"
          :initial="{ y: '100%', opacity: 0 }"
          :animate="{ y: 0, opacity: 1 }"
          :exit="{ y: '100%', opacity: 0 }"
          :transition="transition"
        >
          <span class="text-sm font-medium tabular-nums">
            {{ selectedCount }} selected
          </span>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="clear"
          >
            Clear
          </button>
          <div class="ml-auto flex items-center gap-2">
            <slot name="actions" :selected="selected" :clear="clear" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
