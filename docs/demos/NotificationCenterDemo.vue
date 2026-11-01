<script setup lang="ts">
import type { NotificationCenterItem } from '@/ui/notification-center'
import { NotificationCenter } from '@/ui/notification-center'
import { CalendarDays, MessageSquare, Plus, Rocket } from 'lucide-vue-next'
import { ref } from 'vue'

const icons = { Messages: MessageSquare, Calendar: CalendarDays, Deploys: Rocket } as const

const notifications = ref<NotificationCenterItem[]>([
  { id: 1, app: 'Messages', title: 'Lena Ortiz', body: 'Can you bring the latency numbers to the review?', time: '2m', avatar: 'https://i.pravatar.cc/96?img=45' },
  { id: 2, app: 'Deploys', title: 'Production deploy succeeded', body: 'web@4f2a91c is live in 3 regions.', time: '6m' },
  { id: 3, app: 'Messages', title: 'Marcus Lee', body: 'Ramen on Friday? 🍜', time: '18m', avatar: 'https://i.pravatar.cc/96?img=53' },
  { id: 4, app: 'Calendar', title: 'Design crit in 15 minutes', body: 'Room 4B · Checkout v4', time: '25m' },
  { id: 5, app: 'Messages', title: 'Priya Nair', body: 'Shared “Q3 metrics.pdf” with you.', time: '1h', avatar: 'https://i.pravatar.cc/96?img=32' },
  { id: 6, app: 'Deploys', title: 'Preview ready', body: 'feat/notification-center → preview-218', time: '2h' },
])

const samples = [
  { app: 'Messages', title: 'Kenji Tanaka', body: 'Pushed the fix, mind taking a look?', avatar: 'https://i.pravatar.cc/96?img=12' },
  { app: 'Calendar', title: 'Standup moved to 10:30', body: 'Updated by Lena Ortiz' },
  { app: 'Deploys', title: 'Build failed on main', body: 'Type error in checkout/Summary.vue' },
]
const open = ref(true)
let next = 100
function push() {
  const s = samples[next % samples.length]!
  notifications.value = [{ id: next++, time: 'now', ...s }, ...notifications.value]
}
</script>

<template>
  <div class="w-full max-w-xl">
    <div class="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 shadow-sm">
      <div class="flex items-center gap-2">
        <span class="size-6 rounded-md bg-gradient-to-br from-emerald-400 to-sky-500" />
        <p class="m-0 text-sm font-semibold">
          Acme Console
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="push"
        >
          <Plus class="size-3.5" /> Simulate
        </button>
        <NotificationCenter v-model:notifications="notifications" v-model:open="open">
          <template #icon="{ app }">
            <component :is="icons[app as keyof typeof icons]" class="size-4" />
          </template>
        </NotificationCenter>
      </div>
    </div>
    <p class="m-0 mt-3 text-center text-xs text-muted-foreground">
      Open the bell, tap a stack to fan it out, drag a card sideways to dismiss.
    </p>
  </div>
</template>
