<script setup lang="ts">
import { AnimatedTabs } from '@/ui/animated-tabs'
import { ref } from 'vue'

const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'reports', label: 'Reports' },
  { value: 'settings', label: 'Settings' },
]
const pill = ref('overview')
const line = ref('analytics')
</script>

<template>
  <div class="flex flex-col items-center gap-10">
    <AnimatedTabs v-model="pill" :items="items" />
    <AnimatedTabs v-model="line" :items="items" variant="underline" />
  </div>
</template>
