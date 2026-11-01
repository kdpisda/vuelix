<script setup lang="ts">
import type { OverflowToolbarItem } from '@/ui/overflow-toolbar'
import { OverflowToolbar } from '@/ui/overflow-toolbar'
import {
  AtSign,
  Bold,
  Code,
  Heading2,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Paperclip,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Underline,
  Undo2,
} from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'

const width = ref(440)
const marks = reactive<Record<string, boolean>>({ bold: true, italic: false, underline: false, strike: false })
const last = ref('')

const items = computed<OverflowToolbarItem[]>(() => [
  { id: 'undo', label: 'Undo', icon: Undo2, group: 'history' },
  { id: 'redo', label: 'Redo', icon: Redo2, group: 'history', disabled: true },
  { id: 'heading', label: 'Heading', icon: Heading2, group: 'block', showLabel: true },
  { id: 'bold', label: 'Bold', icon: Bold, group: 'marks', pressed: marks.bold },
  { id: 'italic', label: 'Italic', icon: Italic, group: 'marks', pressed: marks.italic },
  { id: 'underline', label: 'Underline', icon: Underline, group: 'marks', pressed: marks.underline },
  { id: 'strike', label: 'Strikethrough', icon: Strikethrough, group: 'marks', pressed: marks.strike },
  { id: 'link', label: 'Link', icon: Link, group: 'insert' },
  { id: 'code', label: 'Code', icon: Code, group: 'insert' },
  { id: 'quote', label: 'Quote', icon: Quote, group: 'insert' },
  { id: 'bullets', label: 'Bulleted list', icon: List, group: 'lists' },
  { id: 'numbers', label: 'Numbered list', icon: ListOrdered, group: 'lists' },
  { id: 'image', label: 'Image', icon: Image, group: 'media' },
  { id: 'table', label: 'Table', icon: Table, group: 'media' },
  { id: 'mention', label: 'Mention', icon: AtSign, group: 'media' },
  { id: 'attach', label: 'Attach file', icon: Paperclip, group: 'media' },
])

function onAction(id: string) {
  if (id in marks)
    marks[id] = !marks[id]
  last.value = items.value.find(i => i.id === id)?.label ?? id
}
</script>

<template>
  <div class="flex min-h-[25rem] w-full flex-col items-center gap-5">
    <div class="w-full rounded-2xl border bg-card p-2 text-card-foreground shadow-sm" :style="{ maxWidth: `${width}px` }">
      <OverflowToolbar :items="items" label="Formatting" @action="onAction" />
      <div class="space-y-2 px-2 pb-2 pt-4 text-sm leading-6">
        <p class="m-0">
          <span :class="{ 'font-semibold': marks.bold, 'italic': marks.italic, 'underline': marks.underline, 'line-through': marks.strike }">Release notes</span>
          — drag the slider to squeeze the editor. Actions that don't fit spring into the
          <span class="font-medium">⋯</span> menu.
        </p>
        <p class="m-0 h-5 text-xs text-muted-foreground">
          {{ last ? `Last action: ${last}` : 'Tip: focus the toolbar and use ← → Home End.' }}
        </p>
      </div>
    </div>
    <label class="flex w-full max-w-xs items-center gap-3 text-xs text-muted-foreground">
      Width
      <input v-model.number="width" type="range" min="200" max="560" step="1" class="flex-1 accent-foreground">
      <span class="w-12 text-right tabular-nums">{{ width }}px</span>
    </label>
  </div>
</template>
