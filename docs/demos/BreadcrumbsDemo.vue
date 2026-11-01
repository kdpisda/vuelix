<script setup lang="ts">
import type { BreadcrumbsItem } from '@/components/ui/breadcrumbs'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Folder, Home } from 'lucide-vue-next'
import { computed, ref } from 'vue'

// A tiny folder tree to browse.
const tree: Record<string, string[]> = {
  'Home': ['Projects', 'Photos'],
  'Projects': ['vuelix', 'website'],
  'Photos': ['2025', '2026'],
  'vuelix': ['docs', 'registry'],
  'website': ['assets'],
  'docs': ['components', 'guides'],
  'registry': ['ui'],
  'components': ['overlays', 'navigation'],
}

const trail = ref(['Home', 'Projects', 'vuelix', 'docs', 'components', 'navigation'])

const items = computed<BreadcrumbsItem[]>(() =>
  trail.value.map((label, i) => ({ label, icon: i === 0 ? Home : undefined })),
)
const children = computed(() => tree[trail.value.at(-1)!] ?? [])

function navigate(_item: BreadcrumbsItem, index: number) {
  trail.value = trail.value.slice(0, index + 1)
}
function open(name: string) {
  trail.value = [...trail.value, name]
}
</script>

<template>
  <div class="flex w-full max-w-xl flex-col items-center gap-6">
    <Breadcrumbs :items="items" @navigate="navigate" />
    <div class="flex min-h-9 flex-wrap justify-center gap-2">
      <button
        v-for="name in children"
        :key="name"
        type="button"
        class="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="open(name)"
      >
        <Folder class="size-4 text-muted-foreground" /> {{ name }}
      </button>
      <span v-if="!children.length" class="self-center text-xs text-muted-foreground">
        Empty folder — click a crumb to go back.
      </span>
    </div>
  </div>
</template>
