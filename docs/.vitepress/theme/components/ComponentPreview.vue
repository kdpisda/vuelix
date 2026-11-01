<script setup lang="ts">
import { AnimatedTabs } from '@/ui/animated-tabs'
import { ref, useSlots } from 'vue'

const props = withDefaults(defineProps<{
  /** Vertical alignment of the demo. */
  align?: 'center' | 'start'
  minHeight?: string
}>(), {
  align: 'center',
  minHeight: '320px',
})

const slots = useSlots()
const tab = ref('preview')
const replayKey = ref(0)
</script>

<template>
  <div class="vx-preview vp-raw not-prose my-6">
    <div class="mb-3 flex items-center justify-between gap-3">
      <AnimatedTabs
        v-if="slots.code"
        v-model="tab"
        variant="underline"
        :items="[{ value: 'preview', label: 'Preview' }, { value: 'code', label: 'Code' }]"
      />
      <span v-else />
      <button
        v-show="tab === 'preview'"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Replay animation"
        @click="replayKey++"
      >
        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
        Replay
      </button>
    </div>
    <div
      v-show="tab === 'preview'"
      class="vx-stage relative flex w-full justify-center overflow-hidden rounded-xl border bg-background p-6 text-foreground sm:p-10"
      :class="props.align === 'center' ? 'items-center' : 'items-start'"
      :style="{ minHeight: props.minHeight }"
    >
      <div :key="replayKey" class="relative z-10 flex w-full justify-center">
        <slot />
      </div>
    </div>
    <div v-show="tab === 'code'" class="vx-code">
      <slot name="code" />
    </div>
  </div>
</template>

<style>
.vx-stage {
  background-image: radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--foreground) 9%, transparent) 1px, transparent 0);
  background-size: 18px 18px;
}
.vx-code div[class*='language-'] {
  margin: 0 !important;
  border-radius: 12px !important;
}
</style>
