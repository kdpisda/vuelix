<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FileTreeNode, FileTreeSlots } from './context'
import { useReducedMotion } from 'motion-v'
import { computed, nextTick, provide, ref, useId } from 'vue'
import { cn } from '@/lib/utils'
import { FILE_TREE_KEY, isFolder, nodeId } from './context'
import FileTreeItem from './FileTreeItem.vue'

const props = withDefaults(defineProps<{
  items: FileTreeNode[]
  /** Accessible name for the tree. */
  label?: string
  /** Indentation per level, in pixels. */
  indent?: number
  class?: HTMLAttributes['class']
}>(), {
  label: 'Files',
  indent: 16,
})

/** Id (path) of the selected node. */
const selected = defineModel<string | undefined>('selected', { default: undefined })
/** Ids of the expanded folders. */
const expanded = defineModel<string[]>('expanded', { default: () => [] })
const emit = defineEmits<{ select: [node: FileTreeNode, id: string] }>()

const slots = defineSlots<FileTreeSlots>()

const root = ref<HTMLElement | null>(null)
const focused = ref<string | undefined>()
const reduced = useReducedMotion()

interface Row { id: string, node: FileTreeNode, parentId?: string }

// Every node currently visible, in reading order — drives keyboard navigation.
const rows = computed(() => {
  const out: Row[] = []
  const walk = (nodes: FileTreeNode[], parentId?: string) => {
    for (const node of nodes) {
      const id = nodeId(node, parentId)
      out.push({ id, node, parentId })
      if (isFolder(node) && expanded.value.includes(id))
        walk(node.children!, id)
    }
  }
  walk(props.items)
  return out
})

// Roving tabindex: exactly one item is tabbable.
const tabbable = computed(() => {
  const ids = rows.value.map(r => r.id)
  if (focused.value && ids.includes(focused.value))
    return focused.value
  if (selected.value && ids.includes(selected.value))
    return selected.value
  return ids[0]
})

function setExpanded(id: string, value: boolean) {
  const has = expanded.value.includes(id)
  if (value && !has)
    expanded.value = [...expanded.value, id]
  else if (!value && has)
    expanded.value = expanded.value.filter(e => e !== id)
}

function activate(id: string, node: FileTreeNode) {
  focus(id)
  if (isFolder(node))
    setExpanded(id, !expanded.value.includes(id))
  if (!node.disabled) {
    selected.value = id
    emit('select', node, id)
  }
}

async function focus(id: string | undefined) {
  if (!id)
    return
  focused.value = id
  await nextTick()
  const el = root.value?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(id)}"]`)
  el?.focus()
}

function onKeydown(e: KeyboardEvent) {
  const list = rows.value
  const index = list.findIndex(r => r.id === tabbable.value)
  const row = list[index]
  if (!row)
    return
  const folder = isFolder(row.node)
  const open = folder && expanded.value.includes(row.id)

  switch (e.key) {
    case 'ArrowDown':
      focus(list[index + 1]?.id)
      break
    case 'ArrowUp':
      focus(list[index - 1]?.id)
      break
    case 'Home':
      focus(list[0]?.id)
      break
    case 'End':
      focus(list.at(-1)?.id)
      break
    case 'ArrowRight':
      if (folder && !open)
        setExpanded(row.id, true)
      else if (open)
        focus(list[index + 1]?.id)
      break
    case 'ArrowLeft':
      if (open)
        setExpanded(row.id, false)
      else
        focus(row.parentId)
      break
    case 'Enter':
    case ' ':
      activate(row.id, row.node)
      break
    case '*': {
      // Expand every sibling folder, per the WAI-ARIA tree pattern.
      const siblings = list.filter(r => r.parentId === row.parentId && isFolder(r.node))
      expanded.value = [...new Set([...expanded.value, ...siblings.map(r => r.id)])]
      break
    }
    default: {
      // Type-ahead: jump to the next visible item starting with the typed character.
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey)
        return
      const char = e.key.toLowerCase()
      const ordered = [...list.slice(index + 1), ...list.slice(0, index + 1)]
      const match = ordered.find(r => r.node.name.toLowerCase().startsWith(char))
      if (!match)
        return
      focus(match.id)
    }
  }
  e.preventDefault()
}

provide(FILE_TREE_KEY, {
  selected,
  tabbable,
  setFocused: (id) => { focused.value = id },
  isExpanded: id => expanded.value.includes(id),
  activate,
  highlightId: `vx-file-tree-${useId()}`,
  reduced,
  indent: props.indent,
})
</script>

<template>
  <ul
    ref="root"
    role="tree"
    :aria-label="props.label"
    :class="cn('m-0 w-full list-none p-1 font-mono text-sm', props.class)"
    @keydown="onKeydown"
  >
    <FileTreeItem
      v-for="(node, i) in props.items"
      :key="nodeId(node)"
      :node="node"
      :level="1"
      :posinset="i + 1"
      :setsize="props.items.length"
    >
      <template v-if="slots.icon" #icon="scope">
        <slot name="icon" v-bind="scope" />
      </template>
      <template v-if="slots.label" #label="scope">
        <slot name="label" v-bind="scope" />
      </template>
    </FileTreeItem>
  </ul>
</template>
