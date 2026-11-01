<script setup lang="ts">
import type { SpringSidebarItem } from '@/components/ui/spring-sidebar'
import { SpringSidebar } from '@/components/ui/spring-sidebar'
import { BarChart3, FolderKanban, Inbox, LayoutDashboard, Settings } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const items: SpringSidebarItem[] = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'inbox', label: 'Inbox', icon: Inbox, badge: 4 },
  {
    value: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    children: [
      { value: 'projects/website', label: 'Website redesign' },
      { value: 'projects/mobile', label: 'Mobile app' },
      { value: 'projects/brand', label: 'Brand refresh' },
    ],
  },
  { value: 'analytics', label: 'Analytics', icon: BarChart3 },
  { value: 'settings', label: 'Settings', icon: Settings },
]

const collapsed = ref(false)
const active = ref('projects/mobile')

const title = computed(() => {
  for (const item of items) {
    if (item.value === active.value)
      return item.label
    const child = item.children?.find(c => c.value === active.value)
    if (child)
      return `${item.label} / ${child.label}`
  }
  return ''
})
</script>

<template>
  <div class="flex h-[480px] w-full max-w-2xl overflow-hidden rounded-2xl border bg-background shadow-sm">
    <SpringSidebar v-model:collapsed="collapsed" v-model:active="active" :items="items">
      <template #header="{ collapsed: rail }">
        <div class="flex items-center gap-3 pl-[3px]">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 text-sm font-bold text-white">
            A
          </span>
          <span
            class="whitespace-nowrap text-sm font-semibold transition-[opacity,filter] duration-200"
            :class="rail ? 'opacity-0 blur-sm' : 'opacity-100'"
          >Acme Studio</span>
        </div>
      </template>
    </SpringSidebar>
    <div class="flex min-w-0 flex-1 flex-col gap-4 p-6">
      <p class="m-0 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Workspace
      </p>
      <p class="m-0 truncate text-lg font-semibold">
        {{ title }}
      </p>
      <div class="grid flex-1 grid-cols-2 grid-rows-2 gap-3">
        <div v-for="n in 4" :key="n" class="rounded-xl border border-dashed bg-muted/40" />
      </div>
    </div>
  </div>
</template>
