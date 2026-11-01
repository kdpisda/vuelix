<script setup lang="ts">
import { StreamingText, useTextStream } from '@/ui/streaming-text'
import { RotateCcw, Sparkles, Square } from 'lucide-vue-next'

const answer = `Debounce the **watcher**, not the input, so typing stays instant and only the request waits.

1. Keep the raw value in a \`ref\` bound with \`v-model\`.
2. Watch it and wait for a pause, usually **250–400 ms**.
3. Abort the previous request before firing a new one.

With VueUse it is a one-liner: \`watchDebounced(query, search, { debounce: 300 })\`. Pair it with an \`AbortController\` so a slow response never overwrites a newer one.`

const { text, streaming, start, complete } = useTextStream(answer, { interval: 45, delay: 500, autoStart: true })
</script>

<template>
  <div class="flex w-full max-w-lg flex-col gap-4">
    <div class="self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
      How should I debounce a search input in Vue 3?
    </div>

    <div class="flex gap-3">
      <div class="flex size-7 shrink-0 items-center justify-center rounded-full border bg-card">
        <Sparkles class="size-3.5 text-brand" />
      </div>
      <div class="min-w-0 flex-1 pt-0.5">
        <StreamingText :text="text" :streaming="streaming" markdown />

        <div class="mt-3 flex h-8 items-center gap-1">
          <button
            v-if="streaming"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="complete"
          >
            <Square class="size-3 fill-current" />
            Skip
          </button>
          <button
            v-else
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="start"
          >
            <RotateCcw class="size-3" />
            Regenerate
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
