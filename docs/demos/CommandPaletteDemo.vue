<script setup lang="ts">
import type { CommandPaletteItem } from '@/components/ui/command-palette'
import { CommandPalette } from '@/components/ui/command-palette'
import {
  BookOpen,
  Boxes,
  Clock,
  Copy,
  ExternalLink,
  FilePlus,
  Languages,
  LayoutGrid,
  Monitor,
  Moon,
  PanelLeft,
  Rocket,
  Search,
  Sun,
  SunMoon,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'

const open = ref(false)
const last = ref<string>()
const recent = ref<CommandPaletteItem[]>([])

const pages: CommandPaletteItem[] = [
  { id: 'intro', label: 'Introduction', group: 'Pages', icon: BookOpen, keywords: ['docs', 'start'] },
  { id: 'install', label: 'Installation', group: 'Pages', icon: Rocket, keywords: ['setup', 'npm'] },
  { id: 'components', label: 'Components', group: 'Pages', icon: Boxes },
  { id: 'blocks', label: 'Blocks', group: 'Pages', icon: LayoutGrid },
]

const actions: CommandPaletteItem[] = [
  { id: 'new', label: 'New file', group: 'Actions', icon: FilePlus, shortcut: ['⌘', 'N'] },
  { id: 'copy', label: 'Copy page link', group: 'Actions', icon: Copy, shortcut: ['⌘', '⇧', 'C'] },
  { id: 'sidebar', label: 'Toggle sidebar', group: 'Actions', icon: PanelLeft, shortcut: ['⌘', 'B'] },
  {
    id: 'theme',
    label: 'Change theme',
    group: 'Actions',
    icon: SunMoon,
    placeholder: 'Choose a theme…',
    children: [
      { id: 'light', label: 'Light', icon: Sun },
      { id: 'dark', label: 'Dark', icon: Moon },
      { id: 'system', label: 'System', icon: Monitor, hint: 'follows your OS' },
    ],
  },
  {
    id: 'language',
    label: 'Change language',
    group: 'Actions',
    icon: Languages,
    placeholder: 'Search languages…',
    children: [
      { id: 'en', label: 'English', group: 'Suggested' },
      { id: 'es', label: 'Español', group: 'Suggested' },
      { id: 'de', label: 'Deutsch', group: 'All languages' },
      { id: 'fr', label: 'Français', group: 'All languages' },
      { id: 'ja', label: '日本語', group: 'All languages', keywords: ['japanese'] },
      { id: 'pt', label: 'Português', group: 'All languages' },
    ],
  },
  { id: 'github', label: 'Open GitHub repository', group: 'Actions', icon: ExternalLink, disabled: true, hint: 'offline' },
]

const items = computed(() => [...recent.value, ...pages, ...actions])

function onSelect(item: CommandPaletteItem, path: CommandPaletteItem[]) {
  last.value = [...path.map(p => p.label), item.label].join(' → ')
  if (path.length)
    return
  const base = [...pages, ...actions].find(i => i.id === item.id.replace(/^recent-/, ''))
  if (!base)
    return
  recent.value = [
    { ...base, id: `recent-${base.id}`, group: 'Recent', icon: Clock, shortcut: undefined },
    ...recent.value.filter(r => r.id !== `recent-${base.id}`),
  ].slice(0, 2)
}
</script>

<template>
  <div class="flex w-full max-w-sm flex-col items-center gap-4">
    <button
      type="button"
      class="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl border bg-background px-3.5 text-sm text-muted-foreground shadow-sm outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @click="open = true"
    >
      <Search class="size-4" />
      <span class="flex-1 text-left">Search documentation…</span>
      <kbd class="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-sans text-[11px]">⌘J</kbd>
    </button>
    <p class="m-0 h-5 text-xs text-muted-foreground">
      <template v-if="last">
        Selected: <span class="font-medium text-foreground">{{ last }}</span>
      </template>
      <template v-else>
        Press ⌘J / Ctrl+J anywhere on this page.
      </template>
    </p>
    <!-- The docs site already uses ⌘K for its own search, so this demo listens for ⌘J. -->
    <CommandPalette v-model:open="open" class="vp-raw" hotkey="j" :items="items" @select="onSelect" />
  </div>
</template>
