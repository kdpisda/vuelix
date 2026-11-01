<script setup lang="ts">
import { ThinkingIndicator } from '@/components/ui/thinking-indicator'
import { RotateCcw } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const variants = [
  { variant: 'dots', label: 'Thinking' },
  { variant: 'shimmer', label: 'Thinking…' },
  { variant: 'orb', label: 'Listening…' },
  { variant: 'scan', label: 'Searching' },
] as const

const reasoning = `The user wants to cut their Postgres bill without hurting latency.
Usage peaks on weekdays at 9am and 2pm; nights sit around 10% CPU, so a smaller instance with a scheduled scale-up during peaks covers it.
The largest table is events (412 GB) and 80% of it is older than 90 days, which can move to cold storage.
Plan: downsize, schedule scaling, archive old partitions, then verify p95 latency.`

const thinking = ref(true)
const open = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function ask() {
  clearTimeout(timer)
  open.value = false
  thinking.value = true
  timer = setTimeout(() => (thinking.value = false), 4200)
}
onMounted(ask)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-4">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div
        v-for="v in variants"
        :key="v.variant"
        class="flex h-20 flex-col items-center justify-center gap-2 rounded-xl border bg-card"
      >
        <ThinkingIndicator :variant="v.variant" :label="v.label" />
        <span class="font-mono text-[10px] text-muted-foreground">{{ v.variant }}</span>
      </div>
    </div>

    <div class="rounded-xl border bg-card p-4">
      <div class="mb-2 flex items-center justify-between">
        <span class="font-mono text-[10px] text-muted-foreground">reasoning</span>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="ask"
        >
          <RotateCcw class="size-3" />
          Ask again
        </button>
      </div>
      <ThinkingIndicator v-model:open="open" variant="reasoning" :thinking="thinking" :reasoning="reasoning" />
      <p v-if="!thinking" class="m-0 mt-2 text-sm leading-6">
        Downsize to a 4 vCPU instance with scheduled scale-ups at peak hours, and archive event partitions older than 90 days.
      </p>
    </div>
  </div>
</template>
