<script setup lang="ts">
import { TiltCard } from '@/ui/tilt-card'
</script>

<template>
  <TiltCard class="w-72">
    <div class="h-40 bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-500" />
    <div class="space-y-1 p-5">
      <p class="m-0 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Collection
      </p>
      <p class="m-0 text-lg font-semibold">
        Aurora Gradient
      </p>
      <p class="m-0 text-sm text-muted-foreground">
        Move your pointer across the card.
      </p>
    </div>
  </TiltCard>
</template>
