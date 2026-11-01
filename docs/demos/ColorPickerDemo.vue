<script setup lang="ts">
import { ColorPicker, ColorPickerPopover } from '@/components/ui/color-picker'
import { Sparkles } from 'lucide-vue-next'
import { ref } from 'vue'

const accent = ref('#6366f1')
const recent = ref(['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9'])

const brand = ref('#0ea5e9')
const surface = ref('#f43f5e33')
// Shared, so both popovers offer the same history.
const themeRecent = ref<string[]>([])
</script>

<template>
  <div class="flex w-full max-w-2xl flex-wrap items-center justify-center gap-6">
    <ColorPicker v-model="accent" v-model:recent="recent" alpha />

    <div class="flex w-56 flex-col gap-4 rounded-2xl border bg-card p-4 text-card-foreground shadow-sm">
      <div class="flex flex-col gap-0.5">
        <p class="m-0 text-sm font-semibold">
          Theme
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          Popover variant: click a swatch.
        </p>
      </div>
      <div class="flex items-center justify-between gap-3 text-sm">
        Brand
        <ColorPickerPopover v-model="brand" v-model:recent="themeRecent" label="Brand color" align="end" />
      </div>
      <div class="flex items-center justify-between gap-3 text-sm">
        Highlight
        <ColorPickerPopover v-model="surface" v-model:recent="themeRecent" label="Highlight color" align="end" alpha />
      </div>
      <div class="flex items-center gap-3 rounded-xl p-3" :style="{ backgroundColor: surface }">
        <span class="flex size-9 items-center justify-center rounded-lg text-white shadow-sm" :style="{ backgroundColor: brand }">
          <Sparkles class="size-4" />
        </span>
        <div class="flex flex-col">
          <span class="text-sm font-medium">Live preview</span>
          <span class="font-mono text-xs uppercase text-muted-foreground">{{ brand }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
