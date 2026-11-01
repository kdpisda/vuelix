<script setup lang="ts">
import type { TreemapItem } from '@/components/ui/treemap'
import { SpringButton } from '@/components/ui/spring-button'
import { Treemap } from '@/components/ui/treemap'
import { Shuffle } from 'lucide-vue-next'
import { ref } from 'vue'

const bundle = ref<TreemapItem[]>([
  { label: 'vue', value: 98, group: 'Framework' },
  { label: 'vue-router', value: 26, group: 'Framework' },
  { label: 'pinia', value: 9, group: 'Framework' },
  { label: 'motion-v', value: 54, group: 'UI' },
  { label: 'lucide-vue-next', value: 31, group: 'UI' },
  { label: 'tailwind-merge', value: 12, group: 'UI' },
  { label: 'clsx', value: 2, group: 'UI' },
  { label: 'zod', value: 44, group: 'Data' },
  { label: '@vueuse/core', value: 38, group: 'Data' },
  { label: 'ofetch', value: 7, group: 'Data' },
  { label: 'app/pages', value: 63, group: 'App' },
  { label: 'app/components', value: 47, group: 'App' },
  { label: 'app/stores', value: 14, group: 'App' },
  { label: 'app/utils', value: 6, group: 'App' },
])

function randomize() {
  bundle.value = bundle.value.map(d => ({ ...d, value: Math.max(2, Math.round(d.value * (0.4 + Math.random() * 1.3))) }))
}

const kb = (v: number) => `${v} kB`
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4 sm:p-5">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-medium">
          Bundle composition
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          Gzipped size by module
        </p>
      </div>
      <SpringButton size="sm" variant="outline" @click="randomize">
        <Shuffle class="size-3.5" /> Randomize
      </SpringButton>
    </div>
    <Treemap :data="bundle" :height="300" :format-value="kb" />
  </div>
</template>
