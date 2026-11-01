<script setup lang="ts">
import type { FolderStackItem } from '@/ui/folder-stack'
import { FolderStack } from '@/ui/folder-stack'
import { ref } from 'vue'

const assets: FolderStackItem[] = [
  { id: 1, title: 'hero-dusk.jpg', subtitle: '2.4 MB', image: 'https://picsum.photos/seed/dusk/240/200' },
  { id: 2, title: 'team-offsite.jpg', subtitle: '1.8 MB', image: 'https://picsum.photos/seed/offsite/240/200' },
  { id: 3, title: 'product-flat.png', subtitle: '940 KB', image: 'https://picsum.photos/seed/flatlay/240/200' },
  { id: 4, title: 'studio-01.jpg', subtitle: '3.1 MB', image: 'https://picsum.photos/seed/studio/240/200' },
  { id: 5, title: 'coast-wide.jpg', subtitle: '2.2 MB', image: 'https://picsum.photos/seed/coast/240/200' },
]

const projects: FolderStackItem[] = [
  { id: 'a', title: 'Atlas CRM', subtitle: 'Updated 2h ago', image: 'https://picsum.photos/seed/atlas/320/220' },
  { id: 'b', title: 'Northwind', subtitle: 'Updated yesterday', image: 'https://picsum.photos/seed/northwind/320/220' },
  { id: 'c', title: 'Lumen Docs', subtitle: 'Updated 3d ago', image: 'https://picsum.photos/seed/lumen/320/220' },
  { id: 'd', title: 'Pebble App', subtitle: 'Updated last week', image: 'https://picsum.photos/seed/pebble/320/220' },
  { id: 'e', title: 'Orbit Status', subtitle: 'Updated Oct 2', image: 'https://picsum.photos/seed/orbit/320/220' },
  { id: 'f', title: 'Fernway', subtitle: 'Updated Sep 18', image: 'https://picsum.photos/seed/fernway/320/220' },
]

const variant = ref<'folder' | 'stack'>('folder')
const selected = ref<string>()
</script>

<template>
  <div class="flex w-full flex-col items-center gap-6">
    <div class="flex items-center gap-1 rounded-lg bg-muted p-1 text-xs" role="group" aria-label="Variant">
      <button
        v-for="v in (['folder', 'stack'] as const)"
        :key="v"
        type="button"
        :aria-pressed="variant === v"
        class="rounded-md px-3 py-1 font-medium capitalize outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50"
        :class="variant === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        @click="variant = v; selected = undefined"
      >
        {{ v }}
      </button>
    </div>

    <FolderStack
      v-if="variant === 'folder'"
      :items="assets"
      label="Brand assets"
      @select="selected = $event.title"
    />
    <FolderStack
      v-else
      :items="projects"
      label="Projects"
      variant="stack"
      @select="selected = $event.title"
    />

    <p class="m-0 h-4 text-xs text-muted-foreground">
      {{ selected ? `Opened ${selected}` : variant === 'folder' ? 'Hover or click the folder.' : 'Click the pile to spread it.' }}
    </p>
  </div>
</template>
