<script setup lang="ts">
import { AspectRatio } from '@/ui/aspect-ratio'
import { ref } from 'vue'

const presets = [
  { label: '16:9', value: 16 / 9, hint: 'Video' },
  { label: '1:1', value: 1, hint: 'Square' },
  { label: '4:5', value: 4 / 5, hint: 'Portrait' },
  { label: '21:9', value: 21 / 9, hint: 'Cinema' },
]
const active = ref(presets[0]!)
</script>

<template>
  <div class="flex w-full max-w-xs flex-col items-center gap-4">
    <div role="group" aria-label="Aspect ratio" class="inline-flex gap-1 rounded-lg bg-muted p-1">
      <button
        v-for="preset in presets"
        :key="preset.label"
        type="button"
        :aria-pressed="active.label === preset.label"
        class="rounded-md px-2.5 py-1 text-xs font-medium tabular-nums outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50"
        :class="active.label === preset.label ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        @click="active = preset"
      >
        {{ preset.label }}
      </button>
    </div>
    <AspectRatio
      :ratio="active.value"
      src="https://picsum.photos/seed/canyon/1200/1200"
      alt="Sunlit canyon walls"
      class="shadow-md"
    >
      <span class="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
        {{ active.hint }} · {{ active.label }}
      </span>
    </AspectRatio>
  </div>
</template>
