<script setup lang="ts">
import type { ActionBarAction } from '@/components/ui/action-bar'
import { ActionBar } from '@/components/ui/action-bar'
import { Archive, FileArchive, FileImage, FileSpreadsheet, FileText, FolderInput, RotateCcw, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const initial = [
  { id: 'brief', name: 'Q4 product brief.pdf', size: '2.4 MB', icon: FileText },
  { id: 'hero', name: 'hero-shot@2x.png', size: '5.1 MB', icon: FileImage },
  { id: 'budget', name: 'Budget 2027.xlsx', size: '840 KB', icon: FileSpreadsheet },
  { id: 'notes', name: 'Interview notes.md', size: '12 KB', icon: FileText },
  { id: 'assets', name: 'brand-assets.zip', size: '48 MB', icon: FileArchive },
  { id: 'cover', name: 'cover-draft.jpg', size: '1.9 MB', icon: FileImage },
]

const files = ref([...initial])
const selected = ref<string[]>(['hero', 'cover'])
const status = ref('')

const allSelected = computed(() => files.value.length > 0 && selected.value.length === files.value.length)

const actions = computed<ActionBarAction[]>(() => [
  { id: 'move', label: 'Move', icon: FolderInput },
  { id: 'archive', label: 'Archive', icon: Archive },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    destructive: true,
    confirm: `Delete ${selected.value.length} ${selected.value.length === 1 ? 'file' : 'files'}?`,
  },
])

function toggle(id: string) {
  selected.value = selected.value.includes(id) ? selected.value.filter(s => s !== id) : [...selected.value, id]
}
function toggleAll() {
  selected.value = allSelected.value ? [] : files.value.map(f => f.id)
}
function onAction(id: string) {
  const n = selected.value.length
  if (id === 'move') {
    status.value = `Moved ${n} to “Shared”`
  }
  else {
    files.value = files.value.filter(f => !selected.value.includes(f.id))
    status.value = `${id === 'delete' ? 'Deleted' : 'Archived'} ${n} ${n === 1 ? 'file' : 'files'}`
  }
  selected.value = []
}
function reset() {
  files.value = [...initial]
  selected.value = []
  status.value = ''
}
</script>

<template>
  <div class="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-card pb-20 text-card-foreground shadow-sm">
    <div class="flex h-12 items-center gap-3 border-b px-4 text-sm">
      <input
        type="checkbox"
        class="size-4 cursor-pointer accent-foreground"
        aria-label="Select all files"
        :checked="allSelected"
        :indeterminate="selected.length > 0 && !allSelected"
        :disabled="!files.length"
        @change="toggleAll"
      >
      <span class="font-medium">Files</span>
      <span class="ml-auto truncate text-xs text-muted-foreground">{{ status || `${files.length} items` }}</span>
      <button
        v-if="files.length < initial.length"
        type="button"
        class="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="reset"
      >
        <RotateCcw class="size-3" /> Reset
      </button>
    </div>
    <ul class="m-0 list-none p-1.5">
      <li v-for="file in files" :key="file.id">
        <label
          :class="[
            'flex h-11 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-sm transition-colors',
            selected.includes(file.id) ? 'bg-accent' : 'hover:bg-muted/60',
          ]"
        >
          <input
            type="checkbox"
            class="size-4 cursor-pointer accent-foreground"
            :checked="selected.includes(file.id)"
            @change="toggle(file.id)"
          >
          <component :is="file.icon" class="size-4 text-muted-foreground" />
          <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
          <span class="text-xs tabular-nums text-muted-foreground">{{ file.size }}</span>
        </label>
      </li>
      <li v-if="!files.length" class="py-12 text-center text-sm text-muted-foreground">
        Nothing left here.
      </li>
    </ul>

    <ActionBar
      strategy="absolute"
      noun="selected"
      :count="selected.length"
      :actions="actions"
      @action="onAction"
      @clear="selected = []"
    />
  </div>
</template>
