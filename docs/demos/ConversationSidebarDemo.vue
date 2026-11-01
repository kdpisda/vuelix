<script setup lang="ts">
import type { ConversationSidebarItem } from '@/ui/conversation-sidebar'
import { ConversationSidebar } from '@/ui/conversation-sidebar'
import { MessageSquare } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const HOUR = 3_600_000
const ago = (h: number) => Date.now() - h * HOUR

const conversations = ref<ConversationSidebarItem[]>([
  { id: 'c1', title: 'Debounce a search input in Vue', updatedAt: ago(0.2) },
  { id: 'c2', title: 'Postgres cost review for Q3', updatedAt: ago(2) },
  { id: 'c3', title: 'Draft launch tweet for v2', updatedAt: ago(26) },
  { id: 'c4', title: 'Why is the sky blue?', updatedAt: ago(30) },
  { id: 'c5', title: 'Regex for ISO 8601 durations', updatedAt: ago(70) },
  { id: 'c6', title: 'Trip plan: Lisbon in 4 days', updatedAt: ago(120) },
  { id: 'c7', title: 'Explain CRDTs like I’m five', updatedAt: ago(150) },
  { id: 'c8', title: 'Refactor the billing webhook', updatedAt: ago(400) },
  { id: 'c9', title: 'Sourdough starter schedule', updatedAt: ago(700) },
])

const active = ref('c1')
const collapsed = ref(false)
const current = computed(() => conversations.value.find(c => c.id === active.value))
let n = 0

function create() {
  const id = `new-${++n}`
  conversations.value.unshift({ id, title: 'New chat', updatedAt: Date.now() })
  active.value = id
}
function rename(id: string, title: string) {
  const c = conversations.value.find(c => c.id === id)
  if (c)
    c.title = title
}
function remove(id: string) {
  conversations.value = conversations.value.filter(c => c.id !== id)
  if (active.value === id)
    active.value = conversations.value[0]?.id ?? ''
}
</script>

<template>
  <div class="flex h-[440px] w-full max-w-2xl gap-3">
    <ConversationSidebar
      v-model:active="active"
      v-model:collapsed="collapsed"
      :conversations="conversations"
      class="shrink-0"
      @new="create"
      @rename="rename"
      @delete="remove"
    >
      <template #footer="{ collapsed: rail }">
        <div class="flex items-center gap-2.5 px-1.5">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-[10px] font-semibold text-white">
            AL
          </span>
          <span v-if="!rail" class="truncate whitespace-nowrap text-sm">Ada Lovelace</span>
        </div>
      </template>
    </ConversationSidebar>

    <div class="hidden min-w-0 flex-1 flex-col rounded-2xl border bg-card sm:flex">
      <div class="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium">
        <MessageSquare class="size-4 text-muted-foreground" />
        <span class="truncate">{{ current?.title ?? 'No chat selected' }}</span>
      </div>
      <div class="flex flex-1 flex-col gap-3 p-4">
        <div class="h-3 w-3/5 self-end rounded-full bg-muted" />
        <div class="h-3 w-4/5 rounded-full bg-muted/70" />
        <div class="h-3 w-2/3 rounded-full bg-muted/70" />
        <div class="h-3 w-1/2 rounded-full bg-muted/70" />
      </div>
    </div>
  </div>
</template>
