<script setup lang="ts">
import type { SwipeAction } from '@/ui/swipe-actions'
import { SwipeActions } from '@/ui/swipe-actions'
import { Archive, Pin, PinOff, RotateCcw, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'

interface Mail {
  id: number
  from: string
  title: string
  preview: string
  time: string
  avatar: string
  pinned?: boolean
}

const seed: Mail[] = [
  { id: 1, from: 'Lena Ortiz', title: 'Q3 roadmap review', preview: 'Moved the review to Thursday — can you bring the latency numbers?', time: '9:41', avatar: 'https://i.pravatar.cc/96?img=45' },
  { id: 2, from: 'Figma', title: 'Kai commented on “Checkout v4”', preview: '“Should the promo field collapse by default on mobile?”', time: '9:12', avatar: 'https://i.pravatar.cc/96?img=15' },
  { id: 3, from: 'Marcus Lee', title: 'Lunch on Friday?', preview: 'The new ramen place opened two blocks from the office.', time: 'Tue', avatar: 'https://i.pravatar.cc/96?img=53' },
  { id: 4, from: 'Billing', title: 'Your invoice is ready', preview: 'Invoice #4821 for October is available to download.', time: 'Mon', avatar: 'https://i.pravatar.cc/96?img=60' },
]

const mails = ref<Mail[]>(seed.map(m => ({ ...m })))
const sorted = computed(() => [...mails.value].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)))

// Actions can depend on the row.
function leading(mail: Mail): SwipeAction[] {
  return [mail.pinned
    ? { id: 'pin', label: 'Unpin', icon: PinOff, tone: 'muted' }
    : { id: 'pin', label: 'Pin', icon: Pin, tone: 'brand' }]
}
const trailing: SwipeAction[] = [
  { id: 'delete', label: 'Delete', icon: Trash2, tone: 'destructive' },
  { id: 'archive', label: 'Archive', icon: Archive, class: 'bg-sky-500 text-white' },
]

function onAction(action: SwipeAction, mail: Mail) {
  if (action.id === 'pin')
    mail.pinned = !mail.pinned
  else
    mails.value = mails.value.filter(m => m.id !== mail.id)
}

function reset() {
  mails.value = seed.map(m => ({ ...m }))
}
</script>

<template>
  <div class="w-full max-w-md">
    <div class="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div class="flex items-center justify-between border-b px-4 py-3">
        <p class="m-0 text-sm font-semibold">
          Inbox
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="reset"
        >
          <RotateCcw class="size-3" /> Reset
        </button>
      </div>
      <SwipeActions
        :items="sorted"
        :leading="leading"
        :trailing="trailing"
        label="Inbox"
        @action="onAction"
      >
        <template #default="{ item }">
          <div class="flex items-center gap-3 py-3 pl-4">
            <img :src="item.avatar" alt="" class="size-10 shrink-0 rounded-full object-cover" draggable="false">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="m-0 truncate text-sm font-semibold">
                  {{ item.from }}
                </p>
                <Pin v-if="item.pinned" class="size-3.5 shrink-0 text-brand" aria-label="Pinned" />
                <span class="ml-auto shrink-0 text-xs text-muted-foreground">{{ item.time }}</span>
              </div>
              <p class="m-0 truncate text-sm">
                {{ item.title }}
              </p>
              <p class="m-0 truncate text-xs text-muted-foreground">
                {{ item.preview }}
              </p>
            </div>
          </div>
        </template>
      </SwipeActions>
      <p v-if="!mails.length" class="m-0 px-4 py-10 text-center text-sm text-muted-foreground">
        Inbox zero. Nicely done.
      </p>
    </div>
    <p class="m-0 mt-3 text-center text-xs text-muted-foreground">
      Swipe a row left or right. Swipe all the way to delete, or use the ⋯ menu.
    </p>
  </div>
</template>
