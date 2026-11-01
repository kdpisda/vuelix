<script setup lang="ts">
import { MorphingDialog } from '@/components/ui/morphing-dialog'
</script>

<template>
  <MorphingDialog class="w-72" content-class="vp-raw max-w-md" label="Aurora Gradient">
    <template #trigger>
      <div class="h-36 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400" />
      <div class="p-4">
        <p class="m-0 font-semibold">
          Sunset Gradient
        </p>
        <p class="m-0 text-sm text-muted-foreground">
          Click to expand
        </p>
      </div>
    </template>
    <template #content>
      <div class="h-56 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400" />
      <div class="space-y-3 p-6">
        <p class="m-0 text-xl font-semibold">
          Sunset Gradient
        </p>
        <p class="m-0 text-sm leading-6 text-muted-foreground">
          The card and the dialog share a layout id, so motion measures both
          and animates position, size and corner radius in a single spring.
          Press Escape or click outside to morph back.
        </p>
      </div>
    </template>
  </MorphingDialog>
</template>
