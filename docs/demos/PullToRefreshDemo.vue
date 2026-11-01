<script setup lang="ts">
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { RotateCw } from 'lucide-vue-next'
import { motion } from 'motion-v'
import { ref } from 'vue'

interface Message { id: number, from: string, subject: string, time: string, fresh?: boolean }

const pool: Omit<Message, 'id' | 'time'>[] = [
  { from: 'Ada Park', subject: 'Design review moved to Thursday' },
  { from: 'Linear', subject: '3 issues were assigned to you' },
  { from: 'Mateo Ruiz', subject: 'Re: launch checklist' },
  { from: 'Vercel', subject: 'Deployment ready for vuelix-docs' },
  { from: 'Noor Haddad', subject: 'Coffee next week?' },
]

const messages = ref<Message[]>([
  { id: 1, from: 'Lena Fischer', subject: 'Q3 roadmap draft', time: '9:41' },
  { id: 2, from: 'GitHub', subject: '[vuelix] New pull request #128', time: '9:12' },
  { id: 3, from: 'Sam Okafor', subject: 'Photos from the offsite', time: '8:55' },
  { id: 4, from: 'Stripe', subject: 'Your weekly summary', time: 'Yesterday' },
  { id: 5, from: 'Priya Natarajan', subject: 'Re: onboarding flow', time: 'Yesterday' },
  { id: 6, from: 'Figma', subject: 'Kai commented on “Mobile v2”', time: 'Mon' },
  { id: 7, from: 'Jonas Berg', subject: 'Invoice #2041', time: 'Mon' },
])
let next = 8
const ptr = ref<InstanceType<typeof PullToRefresh>>()

async function load() {
  await new Promise(r => setTimeout(r, 1400))
  const m = pool[next % pool.length]!
  messages.value.unshift({ ...m, id: next++, time: 'now', fresh: true })
}
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div class="w-80 overflow-hidden rounded-[28px] border bg-card shadow-lg">
      <div class="flex items-center justify-between border-b px-5 py-3">
        <span class="text-sm font-semibold">Inbox</span>
        <button
          type="button"
          aria-label="Refresh"
          class="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="ptr?.refresh()"
        >
          <RotateCw class="size-3.5" />
        </button>
      </div>
      <PullToRefresh ref="ptr" class="h-80 bg-muted/40" @refresh="load">
        <ul class="m-0 list-none divide-y bg-card p-0">
          <motion.li
            v-for="m in messages"
            :key="m.id"
            class="overflow-hidden"
            :initial="m.fresh ? { opacity: 0, height: 0 } : false"
            :animate="{ opacity: 1, height: 'auto' }"
            :transition="{ type: 'spring', stiffness: 300, damping: 30 }"
          >
            <div class="flex flex-col gap-0.5 px-5 py-3">
              <span class="flex items-center justify-between gap-2">
                <span class="flex min-w-0 items-center gap-1.5">
                  <span v-if="m.fresh" class="size-1.5 shrink-0 rounded-full bg-brand" />
                  <span class="truncate text-sm font-medium">{{ m.from }}</span>
                </span>
                <span class="shrink-0 text-[11px] text-muted-foreground">{{ m.time }}</span>
              </span>
              <span class="truncate text-xs text-muted-foreground">{{ m.subject }}</span>
            </div>
          </motion.li>
        </ul>
      </PullToRefresh>
    </div>
    <p class="m-0 text-xs text-muted-foreground">
      Drag the list down to refresh
    </p>
  </div>
</template>
