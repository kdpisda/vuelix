<script setup lang="ts">
import { HoverHighlight } from '@/ui/hover-highlight'
import { BarChart3, Calendar, FileText, Inbox, Mail, Music, Settings, Users } from 'lucide-vue-next'

const nav = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, hint: '12' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, hint: '3' },
  { id: 'docs', label: 'Documents', icon: FileText, hint: '' },
  { id: 'team', label: 'Team', icon: Users, hint: '' },
  { id: 'settings', label: 'Settings', icon: Settings, hint: '⌘ ,' },
]

const apps = [
  { id: 'mail', name: 'Mail', icon: Mail, tint: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
  { id: 'music', name: 'Music', icon: Music, tint: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
  { id: 'stats', name: 'Analytics', icon: BarChart3, tint: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { id: 'cal', name: 'Calendar', icon: Calendar, tint: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { id: 'notes', name: 'Notes', icon: FileText, tint: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  { id: 'people', name: 'People', icon: Users, tint: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400' },
]
</script>

<template>
  <div class="flex w-full max-w-2xl flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center">
    <nav aria-label="Workspace" class="w-full max-w-60 rounded-xl border bg-card p-1.5">
      <HoverHighlight :items="nav" item-key="id" as="ul" item-as="li" class="m-0 flex list-none flex-col gap-0.5 p-0">
        <template #item="{ item, active }">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <component :is="item.icon" class="size-4 transition-colors" :class="active ? 'text-foreground' : 'text-muted-foreground'" aria-hidden="true" />
            <span class="flex-1">{{ item.label }}</span>
            <span v-if="item.hint" class="text-xs text-muted-foreground">{{ item.hint }}</span>
          </button>
        </template>
      </HoverHighlight>
    </nav>

    <HoverHighlight
      :items="apps"
      item-key="id"
      class="grid w-full max-w-72 grid-cols-3 gap-1 rounded-xl border bg-card p-1.5"
      highlight-class="rounded-xl bg-muted shadow-sm ring-1 ring-border"
    >
      <template #item="{ item }">
        <button
          type="button"
          class="flex w-full flex-col items-center gap-2 rounded-xl px-2 py-3 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span :class="['grid size-10 place-items-center rounded-xl', item.tint]">
            <component :is="item.icon" class="size-5" aria-hidden="true" />
          </span>
          {{ item.name }}
        </button>
      </template>
    </HoverHighlight>
  </div>
</template>
