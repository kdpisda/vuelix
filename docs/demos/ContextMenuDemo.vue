<script setup lang="ts">
import type { ContextMenuAction, ContextMenuEntry } from '@/ui/context-menu'
import { ContextMenu } from '@/ui/context-menu'
import { Copy, FolderOpen, History, Link, Mail, MessageSquare, MousePointerClick, Pencil, Share2, Star, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'

const items: ContextMenuEntry[] = [
  { type: 'label', label: 'aurora-q3.fig' },
  { label: 'Open', icon: FolderOpen, shortcut: '↵' },
  { label: 'Rename', icon: Pencil, shortcut: 'F2' },
  { label: 'Duplicate', icon: Copy, shortcut: '⌘D' },
  { label: 'Add to favorites', icon: Star },
  {
    label: 'Share',
    icon: Share2,
    children: [
      { label: 'Copy link', icon: Link, shortcut: '⌘L' },
      { label: 'Send by email', icon: Mail },
      { label: 'Post to channel', icon: MessageSquare },
    ],
  },
  { label: 'Version history', icon: History, disabled: true },
  { type: 'separator' },
  { label: 'Move to trash', icon: Trash2, shortcut: '⌫', destructive: true },
]

const last = ref<string>()
function onSelect(item: ContextMenuAction) {
  last.value = item.label
}
</script>

<template>
  <div class="flex w-full max-w-md flex-col items-center gap-3">
    <ContextMenu
      :items="items"
      label="File actions"
      content-class="vp-raw"
      class="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-muted/40 text-sm text-muted-foreground"
      @select="onSelect"
    >
      <MousePointerClick class="size-6" />
      <span>Right-click or long-press here</span>
    </ContextMenu>
    <p class="m-0 h-5 text-xs text-muted-foreground">
      <template v-if="last">
        Selected: <span class="font-medium text-foreground">{{ last }}</span>
      </template>
    </p>
  </div>
</template>
