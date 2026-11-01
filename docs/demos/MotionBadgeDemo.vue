<script setup lang="ts">
import { MotionBadge } from '@/components/ui/motion-badge'
import { SpringButton } from '@/components/ui/spring-button'
import { Bell, Minus, Plus } from 'lucide-vue-next'
import { ref } from 'vue'

const unread = ref(7)
const viewers = ref(1284)

function shuffleViewers() {
  viewers.value = Math.max(0, viewers.value + Math.round(Math.random() * 400 - 160))
}
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <div class="flex flex-wrap items-center justify-center gap-2">
      <MotionBadge>Default</MotionBadge>
      <MotionBadge variant="secondary">
        Secondary
      </MotionBadge>
      <MotionBadge variant="outline">
        Outline
      </MotionBadge>
      <MotionBadge variant="success" live>
        Operational
      </MotionBadge>
      <MotionBadge variant="warning">
        Degraded
      </MotionBadge>
      <MotionBadge variant="destructive">
        Failed
      </MotionBadge>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-6">
      <div class="flex items-center gap-3">
        <span class="relative inline-flex">
          <span class="grid size-10 place-items-center rounded-xl border bg-card">
            <Bell class="size-4.5" aria-hidden="true" />
          </span>
          <MotionBadge :count="unread" :max="99" variant="destructive" size="sm" class="absolute -right-2 -top-2">
            <span class="sr-only">Unread notifications:</span>
          </MotionBadge>
        </span>
        <div class="flex gap-1">
          <SpringButton variant="outline" size="icon" class="size-8" aria-label="Fewer" @click="unread = Math.max(0, unread - 1)">
            <Minus class="size-3.5" />
          </SpringButton>
          <SpringButton variant="outline" size="icon" class="size-8" aria-label="More" @click="unread += unread < 90 ? 7 : 1">
            <Plus class="size-3.5" />
          </SpringButton>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <MotionBadge variant="outline" size="lg" live :count="viewers">
          <span class="text-muted-foreground">Watching</span>
        </MotionBadge>
        <SpringButton variant="outline" size="sm" @click="shuffleViewers">
          Shuffle
        </SpringButton>
      </div>
    </div>
  </div>
</template>
