<script setup lang="ts">
import type { FileTreeNode } from '@/components/ui/file-tree'
import { FileTree } from '@/components/ui/file-tree'
import { ref } from 'vue'

const files: FileTreeNode[] = [
  {
    name: 'src',
    children: [
      {
        name: 'components',
        children: [
          { name: 'AppHeader.vue' },
          { name: 'PricingTable.vue' },
          { name: 'UserMenu.vue' },
        ],
      },
      {
        name: 'composables',
        children: [
          { name: 'useAuth.ts' },
          { name: 'useCart.ts' },
        ],
      },
      { name: 'assets', children: [{ name: 'hero.png' }, { name: 'logo.svg' }] },
      { name: 'App.vue' },
      { name: 'main.ts' },
      { name: 'style.css' },
    ],
  },
  { name: 'public', children: [{ name: 'favicon.svg' }] },
  { name: 'package.json' },
  { name: 'README.md' },
  { name: 'vite.config.ts' },
]

const expanded = ref(['src', 'src/components'])
const selected = ref('src/components/PricingTable.vue')
</script>

<template>
  <div class="w-full max-w-xs overflow-hidden rounded-xl border bg-card">
    <div class="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
      <span class="font-medium text-foreground">storefront</span>
      <span class="truncate pl-3 font-mono">{{ selected }}</span>
    </div>
    <FileTree
      v-model:expanded="expanded"
      v-model:selected="selected"
      :items="files"
      label="Project files"
    />
  </div>
</template>
