<script setup lang="ts">
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'
import { SpringButton } from '@/components/ui/spring-button'
</script>

<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
    <AnimatedTooltip v-for="side in (['top', 'right', 'bottom', 'left'] as const)" :key="side" :side="side" :content="`Tooltip on ${side}`">
      <SpringButton variant="outline" class="capitalize">
        {{ side }}
      </SpringButton>
    </AnimatedTooltip>
  </div>
</template>
