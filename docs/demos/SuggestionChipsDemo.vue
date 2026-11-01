<script setup lang="ts">
import type { SuggestionChipItem } from '@/components/ui/suggestion-chips'
import { SuggestionChips } from '@/components/ui/suggestion-chips'
import { ArrowUp, BarChart3, Bug, Code2, Globe, Lightbulb, Mail, PenLine, Plane } from 'lucide-vue-next'
import { onBeforeUnmount, ref } from 'vue'

const suggestions: SuggestionChipItem[] = [
  { label: 'Summarize this PDF', icon: PenLine },
  { label: 'Write a SQL query', icon: Code2 },
  { label: 'Plan a weekend in Kyoto', icon: Plane },
  { label: 'Explain a stack trace', icon: Bug },
  { label: 'Draft a follow-up email', icon: Mail },
  { label: 'Chart my monthly spend', icon: BarChart3 },
  { label: 'Brainstorm product names', icon: Lightbulb },
  { label: 'Translate to Portuguese', icon: Globe },
]

const input = ref<HTMLElement>()
const prompt = ref('')
let timer: ReturnType<typeof setInterval> | undefined

function fill(text: string) {
  clearInterval(timer)
  prompt.value = ''
  let i = 0
  // Start typing as the chip lands in the box.
  setTimeout(() => {
    timer = setInterval(() => {
      prompt.value = text.slice(0, ++i)
      if (i >= text.length)
        clearInterval(timer)
    }, 18)
  }, 280)
}
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="flex w-full max-w-xl flex-col items-center gap-5">
    <h3 class="m-0 text-xl font-semibold tracking-tight">
      What can I help with?
    </h3>
    <div ref="input" class="flex w-full items-center gap-2 rounded-2xl border bg-card py-2 pl-4 pr-2 shadow-sm">
      <input
        v-model="prompt"
        aria-label="Message"
        placeholder="Ask anything…"
        class="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      >
      <button
        type="button"
        aria-label="Send"
        :disabled="!prompt"
        class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition-opacity focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-30"
      >
        <ArrowUp class="size-4" />
      </button>
    </div>
    <SuggestionChips :suggestions="suggestions" :target="input" shuffle @select="fill($event.prompt)" />
  </div>
</template>
