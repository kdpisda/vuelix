<script setup lang="ts">
import type { FileTreeNode, FileTreeSlots } from './context'
import { AnimatePresence, motion } from 'motion-v'
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils'
import { FILE_TREE_KEY, isFolder, nodeId } from './context'
import FileTreeIcon from './FileTreeIcon.vue'

const props = defineProps<{
  node: FileTreeNode
  parentId?: string
  level: number
  posinset: number
  setsize: number
}>()

const slots = defineSlots<FileTreeSlots>()
const ctx = inject(FILE_TREE_KEY)!

const id = computed(() => nodeId(props.node, props.parentId))
const folder = computed(() => isFolder(props.node))
const open = computed(() => folder.value && ctx.isExpanded(id.value))
const selected = computed(() => ctx.selected.value === id.value)

const spring = { type: 'spring', stiffness: 380, damping: 34 } as const
const transition = computed(() => (ctx.reduced.value ? { duration: 0 } : spring))
</script>

<template>
  <li
    role="treeitem"
    :data-tree-id="id"
    :aria-level="props.level"
    :aria-posinset="props.posinset"
    :aria-setsize="props.setsize"
    :aria-expanded="folder ? open : undefined"
    :aria-selected="selected"
    :aria-disabled="props.node.disabled || undefined"
    :tabindex="ctx.tabbable.value === id ? 0 : -1"
    class="outline-none [&:focus-visible>div]:ring-[3px] [&:focus-visible>div]:ring-inset [&:focus-visible>div]:ring-ring/50"
    @focus.self="ctx.setFocused(id)"
  >
    <div
      :class="cn(
        'relative isolate flex cursor-pointer select-none items-center gap-1.5 rounded-md py-1 pr-2 text-sm transition-colors',
        selected ? 'text-accent-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        props.node.disabled && 'cursor-default opacity-50',
      )"
      :style="{ paddingLeft: `${(props.level - 1) * ctx.indent + 6}px` }"
      @click="ctx.activate(id, props.node)"
    >
      <motion.span
        v-if="selected"
        :layout-id="ctx.highlightId"
        aria-hidden="true"
        class="absolute inset-0 -z-10 rounded-md bg-accent ring-1 ring-border/60"
        :transition="transition"
      />
      <motion.svg
        v-if="folder"
        class="size-3.5 shrink-0 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        :initial="false"
        :animate="{ rotate: open ? 90 : 0 }"
        :transition="transition"
      >
        <path d="m9 18 6-6-6-6" />
      </motion.svg>
      <span v-else class="size-3.5 shrink-0" aria-hidden="true" />
      <slot name="icon" :node="props.node" :folder="folder" :open="open">
        <FileTreeIcon :name="props.node.name" :folder="folder" :open="open" />
      </slot>
      <span class="truncate" :class="selected && 'font-medium'">
        <slot name="label" :node="props.node" :folder="folder">{{ props.node.name }}</slot>
      </span>
    </div>

    <AnimatePresence :initial="false">
      <motion.ul
        v-if="open && props.node.children?.length"
        key="group"
        role="group"
        class="relative m-0 list-none overflow-hidden p-0 before:pointer-events-none before:absolute before:inset-y-0.5 before:left-[var(--guide)] before:w-px before:bg-muted-foreground/25"
        :style="{ '--guide': `${(props.level - 1) * ctx.indent + 6 + 7}px` }"
        :initial="{ height: 0, opacity: 0 }"
        :animate="{ height: 'auto', opacity: 1 }"
        :exit="{ height: 0, opacity: 0 }"
        :transition="transition"
      >
        <FileTreeItem
          v-for="(child, i) in props.node.children"
          :key="nodeId(child, id)"
          :node="child"
          :parent-id="id"
          :level="props.level + 1"
          :posinset="i + 1"
          :setsize="props.node.children.length"
        >
          <template v-if="slots.icon" #icon="scope">
            <slot name="icon" v-bind="scope" />
          </template>
          <template v-if="slots.label" #label="scope">
            <slot name="label" v-bind="scope" />
          </template>
        </FileTreeItem>
      </motion.ul>
    </AnimatePresence>
  </li>
</template>
