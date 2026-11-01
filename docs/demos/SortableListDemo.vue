<script setup lang="ts">
import { SortableList } from '@/components/ui/sortable-list'
import { ref } from 'vue'

interface Task { id: number, title: string, tag: string, tone: string }

const tasks = ref<Task[]>([
  { id: 1, title: 'Draft Q3 product roadmap', tag: 'Planning', tone: 'bg-sky-500/15 text-sky-600 dark:text-sky-300' },
  { id: 2, title: 'Review onboarding copy', tag: 'Content', tone: 'bg-violet-500/15 text-violet-600 dark:text-violet-300' },
  { id: 3, title: 'Fix checkout rounding bug', tag: 'Bug', tone: 'bg-rose-500/15 text-rose-600 dark:text-rose-300' },
  { id: 4, title: 'Ship dark mode for invoices', tag: 'Feature', tone: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' },
  { id: 5, title: 'Prepare investor update', tag: 'Ops', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
])
</script>

<template>
  <div class="w-full max-w-sm">
    <SortableList v-model="tasks" item-key="id" label="Priorities" :item-label="task => task.title">
      <template #default="{ item, index }">
        <div class="flex items-center gap-3">
          <span class="w-4 text-xs tabular-nums text-muted-foreground">{{ index + 1 }}</span>
          <span class="min-w-0 flex-1 truncate font-medium">{{ item.title }}</span>
          <span class="rounded-full px-2 py-0.5 text-[11px] font-medium" :class="item.tone">{{ item.tag }}</span>
        </div>
      </template>
    </SortableList>
  </div>
</template>
