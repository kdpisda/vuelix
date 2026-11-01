<script setup lang="ts">
import { Loader } from '@/ui/loader'

const spinners = [
  { variant: 'dots', name: 'Dots' },
  { variant: 'orbit', name: 'Orbit' },
  { variant: 'bars', name: 'Bars' },
  { variant: 'ring', name: 'Ring' },
] as const
</script>

<template>
  <div class="flex w-full max-w-xl flex-col items-center gap-8">
    <div class="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="s in spinners"
        :key="s.variant"
        class="flex flex-col items-center gap-3 rounded-xl border bg-card px-4 py-5"
      >
        <div class="flex h-9 items-center">
          <Loader :variant="s.variant" size="lg" />
        </div>
        <span class="text-xs text-muted-foreground">{{ s.name }}</span>
      </div>
    </div>

    <div class="flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <div class="flex w-full max-w-xs items-start gap-3 rounded-xl border bg-card p-4">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-semibold text-brand">AI</span>
        <Loader variant="typing" :lines="3" label="Generating a reply" />
      </div>
      <div class="flex items-center gap-4">
        <Loader variant="dots" size="sm" class="text-muted-foreground" />
        <Loader variant="ring" size="md" class="text-brand" />
        <Loader variant="bars" size="md" class="text-chart-2" />
      </div>
    </div>
  </div>
</template>
