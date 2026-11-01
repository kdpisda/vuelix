<script setup lang="ts">
import type { FeedbackWidgetPayload } from '@/components/ui/feedback-widget'
import { FeedbackWidget } from '@/components/ui/feedback-widget'
import { ref } from 'vue'

const last = ref<FeedbackWidgetPayload | null>(null)

// Pretend to talk to a server.
const send = () => new Promise(resolve => setTimeout(resolve, 900))
</script>

<template>
  <div class="relative h-[440px] w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-sm">
    <div class="flex items-center gap-1.5 border-b px-4 py-3">
      <span class="size-2.5 rounded-full bg-red-400" />
      <span class="size-2.5 rounded-full bg-amber-400" />
      <span class="size-2.5 rounded-full bg-emerald-400" />
      <span class="ml-3 text-xs text-muted-foreground">app.acme.dev/projects</span>
    </div>
    <div class="space-y-3 p-6">
      <div class="h-4 w-40 rounded bg-muted" />
      <div class="h-3 w-72 rounded bg-muted/70" />
      <div class="mt-6 grid grid-cols-3 gap-3">
        <div v-for="n in 3" :key="n" class="h-20 rounded-xl bg-muted/60" />
      </div>
      <p v-if="last" class="m-0 pt-3 text-xs text-muted-foreground">
        Last submission: {{ last.rating ?? '–' }}/5 · “{{ last.message || 'no message' }}”
      </p>
    </div>
    <FeedbackWidget class="absolute bottom-4 right-4" :send="send" @submit="last = $event" />
  </div>
</template>
