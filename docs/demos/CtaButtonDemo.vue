<script setup lang="ts">
import { CtaButton } from '@/ui/cta-button'
import { Sparkles } from 'lucide-vue-next'
</script>

<template>
  <div class="grid w-full max-w-lg grid-cols-1 place-items-center gap-6 sm:grid-cols-2">
    <div class="flex flex-col items-center gap-2">
      <CtaButton variant="shimmer" size="lg">
        <Sparkles aria-hidden="true" />
        Start free trial
      </CtaButton>
      <span class="text-xs text-muted-foreground">shimmer</span>
    </div>
    <div class="flex flex-col items-center gap-2">
      <CtaButton variant="gradient-border" size="lg">
        Join the waitlist
      </CtaButton>
      <span class="text-xs text-muted-foreground">gradient-border</span>
    </div>
    <div class="flex flex-col items-center gap-2">
      <CtaButton variant="magnetic" size="lg">
        Book a demo
      </CtaButton>
      <span class="text-xs text-muted-foreground">magnetic</span>
    </div>
    <div class="flex flex-col items-center gap-2">
      <CtaButton variant="arrow" size="lg">
        Get started
      </CtaButton>
      <span class="text-xs text-muted-foreground">arrow</span>
    </div>
  </div>
</template>
