<script setup lang="ts">
import type { RadialMenuItem } from '@/ui/radial-menu'
import { RadialMenu } from '@/ui/radial-menu'
import { Camera, FileText, Image, Link, Mic, PenLine } from 'lucide-vue-next'
import { ref } from 'vue'

const items: RadialMenuItem[] = [
  { id: 'note', label: 'New note', icon: PenLine },
  { id: 'photo', label: 'Take photo', icon: Camera },
  { id: 'image', label: 'Upload image', icon: Image },
  { id: 'voice', label: 'Voice memo', icon: Mic },
  { id: 'link', label: 'Save link', icon: Link },
  { id: 'doc', label: 'Import document', icon: FileText },
]

const open = ref(true)
const last = ref<RadialMenuItem | null>(null)
</script>

<template>
  <div class="flex min-h-80 w-full flex-col items-center justify-center gap-6">
    <div class="flex h-64 items-center justify-center">
      <RadialMenu v-model:open="open" :items="items" label="Create" @select="last = $event" />
    </div>
    <p class="m-0 h-4 text-xs text-muted-foreground" aria-live="polite">
      {{ last ? `Selected: ${last.label}` : 'Click the button, or focus it and press an arrow key' }}
    </p>
  </div>
</template>
