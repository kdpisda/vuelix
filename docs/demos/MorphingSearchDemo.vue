<script setup lang="ts">
import type { MorphingSearchSuggestion } from '@/ui/morphing-search'
import { MorphingSearch } from '@/ui/morphing-search'
import { Boxes, Command, Download, Palette, Smartphone } from 'lucide-vue-next'
import { ref } from 'vue'

const query = ref('')
const open = ref(false)
const last = ref('')
const recent = ref(['spring button', 'dark mode', 'tabs'])

const suggestions: MorphingSearchSuggestion[] = [
  { value: 'command-palette', label: 'Command palette', hint: 'Block', icon: Command },
  { value: 'dynamic-island', label: 'Dynamic island', hint: 'Block', icon: Smartphone },
  { value: 'components', label: 'All components', hint: 'Docs', icon: Boxes },
  { value: 'theming', label: 'Theming', hint: 'Guide', icon: Palette },
  { value: 'installation', label: 'Installation', hint: 'Guide', icon: Download },
]

function onSubmit(term: string) {
  last.value = `Searched for “${term}”`
  recent.value = [term, ...recent.value.filter(r => r !== term)].slice(0, 3)
}
function onSelect(item: MorphingSearchSuggestion) {
  last.value = `Opened ${item.label}`
}
</script>

<template>
  <div class="w-full max-w-xl rounded-2xl border bg-card text-card-foreground shadow-sm">
    <header class="relative flex h-14 items-center gap-6 border-b px-4">
      <span class="flex items-center gap-2 text-sm font-semibold">
        <span class="size-6 rounded-md bg-gradient-to-br from-emerald-400 to-sky-500" />
        Acme
      </span>
      <nav :class="['flex gap-4 text-sm text-muted-foreground transition-opacity duration-200', open && 'pointer-events-none opacity-0']">
        <a href="#" class="hover:text-foreground" @click.prevent>Docs</a>
        <a href="#" class="hover:text-foreground" @click.prevent>Blocks</a>
        <a href="#" class="hover:text-foreground" @click.prevent>Pricing</a>
      </nav>
      <MorphingSearch
        v-model="query"
        v-model:open="open"
        align="end"
        placeholder="Search docs…"
        class="pointer-events-none absolute inset-y-0 left-28 right-16 w-auto max-sm:left-3 max-w-none items-center *:pointer-events-auto"
        :recent="recent"
        :suggestions="suggestions"
        @submit="onSubmit"
        @select="onSelect"
        @clear-recent="recent = []"
      />
      <span class="ml-auto flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">AK</span>
    </header>
    <div class="h-[22rem] space-y-3 p-5">
      <p class="m-0 h-5 text-sm text-muted-foreground">
        {{ last || 'Click the search icon, or press Tab to it and hit Enter.' }}
      </p>
      <div class="h-28 rounded-xl bg-muted/70" />
      <div class="h-3 w-3/4 rounded-full bg-muted/70" />
      <div class="h-3 w-1/2 rounded-full bg-muted/70" />
      <div class="h-3 w-2/3 rounded-full bg-muted/70" />
    </div>
  </div>
</template>
