<script setup lang="ts">
import { AuroraBackground } from '@/ui/aurora-background'
import { ArrowRight } from 'lucide-vue-next'
</script>

<template>
  <AuroraBackground class="flex h-80 w-full max-w-2xl items-center justify-center rounded-2xl border px-6">
    <div class="flex max-w-md flex-col items-center gap-4 text-center">
      <span class="rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
        Now in public beta
      </span>
      <h3 class="m-0 text-3xl font-semibold tracking-tight text-balance">
        Interfaces that feel alive
      </h3>
      <p class="m-0 text-sm text-muted-foreground text-balance">
        Copy-paste components with motion baked in. Drop them into any Vue app and ship.
      </p>
      <a
        href="#"
        class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground no-underline outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click.prevent
      >
        Get started
        <ArrowRight class="size-4" />
      </a>
    </div>
  </AuroraBackground>
</template>
