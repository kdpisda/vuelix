<script setup lang="ts">
import { TextReveal } from '@/components/ui/text-reveal'
</script>

<template>
  <div class="flex max-w-lg flex-col gap-6 text-center">
    <TextReveal
      as="h2"
      text="Motion that feels physical."
      class="m-0 text-4xl font-semibold tracking-tight"
    />
    <TextReveal
      by="char"
      :stagger="0.015"
      :delay="0.4"
      text="Every piece springs, blurs and settles into place."
      class="m-0 text-lg text-muted-foreground"
    />
  </div>
</template>
