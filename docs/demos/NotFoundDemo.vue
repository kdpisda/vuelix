<script setup lang="ts">
import { NotFound } from '@/ui/not-found'
import { ref } from 'vue'

const searched = ref('')
</script>

<template>
  <div class="flex w-full flex-col items-center">
    <NotFound
      :heading-level="2"
      :links="[
        { label: 'Back to home', href: '/' },
        { label: 'Browse blocks', href: '/blocks/' },
        { label: 'Read the docs', href: '/docs/' },
      ]"
      @search="searched = $event"
    />
    <p class="m-0 h-4 text-xs text-muted-foreground" aria-live="polite">
      <template v-if="searched">
        You searched for “{{ searched }}”
      </template>
    </p>
  </div>
</template>
