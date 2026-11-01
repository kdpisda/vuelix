<script setup lang="ts">
import { SpringButton } from '@/ui/spring-button'
import { SpringPopover } from '@/ui/spring-popover'
import { Bell, Check, Copy, Share2 } from 'lucide-vue-next'
import { ref } from 'vue'

const link = 'https://vuelix.dev/s/aurora-q3'
const copied = ref(false)
function copy() {
  navigator.clipboard?.writeText(link).catch(() => {})
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}

const people = [
  { name: 'Ana Ruiz', role: 'Can edit', color: 'from-rose-400 to-orange-400' },
  { name: 'Tom Okafor', role: 'Can view', color: 'from-sky-400 to-indigo-500' },
]

const alerts = [
  { title: 'Deploy finished', time: '2m ago' },
  { title: 'Ana left a comment', time: '1h ago' },
]
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-4">
    <SpringPopover label="Share file" content-class="vp-raw w-80">
      <template #trigger>
        <SpringButton>
          <Share2 class="size-4" /> Share
        </SpringButton>
      </template>
      <template #default="{ close }">
        <p class="m-0 font-semibold">
          Share “Aurora Q3”
        </p>
        <p class="m-0 mt-1 text-xs text-muted-foreground">
          Anyone with the link can view.
        </p>
        <div class="mt-3 flex items-center gap-2">
          <input
            :value="link"
            readonly
            aria-label="Share link"
            class="h-9 min-w-0 flex-1 rounded-lg border bg-muted/50 px-3 text-xs text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
          <button
            type="button"
            class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :aria-label="copied ? 'Copied' : 'Copy link'"
            @click="copy"
          >
            <Check v-if="copied" class="size-4 text-emerald-500" />
            <Copy v-else class="size-4" />
          </button>
        </div>
        <ul class="m-0 mt-4 list-none space-y-2.5 p-0">
          <li v-for="p in people" :key="p.name" class="flex items-center gap-2.5">
            <span :class="['size-7 rounded-full bg-gradient-to-br', p.color]" />
            <span class="flex-1 text-sm">{{ p.name }}</span>
            <span class="text-xs text-muted-foreground">{{ p.role }}</span>
          </li>
        </ul>
        <button
          type="button"
          class="mt-4 h-8 w-full rounded-lg bg-primary text-xs font-medium text-primary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="close()"
        >
          Done
        </button>
      </template>
    </SpringPopover>

    <SpringPopover side="right" align="start" label="Notifications" content-class="vp-raw w-64 p-2">
      <template #trigger>
        <SpringButton variant="outline" size="icon" aria-label="Notifications">
          <Bell class="size-4" />
        </SpringButton>
      </template>
      <ul class="m-0 list-none p-0">
        <li v-for="a in alerts" :key="a.title">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {{ a.title }}
            <span class="text-xs text-muted-foreground">{{ a.time }}</span>
          </button>
        </li>
      </ul>
    </SpringPopover>
  </div>
</template>
