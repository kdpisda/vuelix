<script setup lang="ts">
import { ColorSwatches } from '@/ui/color-swatches'
import { computed, ref } from 'vue'

const colors = [
  { value: '#10b981', label: 'Emerald' },
  { value: '#0ea5e9', label: 'Sky' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#d946ef', label: 'Fuchsia' },
  { value: '#f43f5e', label: 'Rose' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#fde047', label: 'Lemon' },
  { value: '#18181b', label: 'Ink' },
]
const accent = ref('#6366f1')
const name = computed(() => colors.find(c => c.value === accent.value)?.label ?? accent.value)
</script>

<template>
  <div class="flex w-full max-w-md flex-col items-center gap-6">
    <div class="flex w-full items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div class="size-11 shrink-0 rounded-lg ring-1 ring-inset ring-foreground/10 transition-colors duration-300" :style="{ backgroundColor: accent }" />
      <div class="min-w-0 flex-1">
        <p class="m-0 text-sm font-medium">
          Accent color
        </p>
        <p class="m-0 text-sm text-muted-foreground">
          {{ name }}
        </p>
      </div>
      <code class="rounded-md bg-muted px-2 py-1 text-xs uppercase text-muted-foreground">{{ accent }}</code>
    </div>
    <ColorSwatches v-model="accent" :colors="colors" custom aria-label="Accent color" name="accent" />
  </div>
</template>
