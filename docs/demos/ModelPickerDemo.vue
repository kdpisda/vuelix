<script setup lang="ts">
import type { ModelPickerOption } from '@/ui/model-picker'
import { ModelPicker } from '@/ui/model-picker'
import { ArrowUp, Brain, Feather, Paperclip, Sparkles, Telescope } from 'lucide-vue-next'
import { ref } from 'vue'

const models: ModelPickerOption[] = [
  { value: 'swift-3', name: 'Swift 3', description: 'Quick answers for everyday questions', badges: ['fast'], icon: Feather },
  { value: 'sage-3', name: 'Sage 3', description: 'Balanced quality and speed', badges: ['vision'], icon: Sparkles },
  { value: 'sage-3-thinking', name: 'Sage 3 Thinking', description: 'Thinks step by step on hard problems', badges: ['reasoning', 'vision'], icon: Brain },
  { value: 'atlas-2', name: 'Atlas 2 Pro', description: 'Deep research with a 1M-token context', badges: ['reasoning', 'Beta'], icon: Telescope },
  { value: 'swift-2', name: 'Swift 2', description: 'Retired on June 30', disabled: true },
]

const model = ref('sage-3')
</script>

<template>
  <div class="w-full max-w-md rounded-2xl border bg-card p-3 shadow-sm">
    <div class="flex items-center justify-between gap-2">
      <ModelPicker v-model="model" :models="models" />
      <span class="font-mono text-[11px] text-muted-foreground">{{ model }}</span>
    </div>
    <div class="min-h-16 px-1 py-3 text-sm text-muted-foreground">
      Ask anything…
    </div>
    <div class="flex items-center justify-between">
      <button type="button" aria-label="Attach a file" class="flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <Paperclip class="size-4" />
      </button>
      <button type="button" aria-label="Send" class="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <ArrowUp class="size-4" />
      </button>
    </div>
  </div>
</template>
