<script setup lang="ts">
import { SpringSwitch } from '@/ui/spring-switch'
import { ref } from 'vue'

const wifi = ref(true)
const airplane = ref(false)
</script>

<template>
  <div class="flex w-64 flex-col gap-4">
    <label class="flex items-center justify-between gap-4 text-sm font-medium">
      Wi‑Fi
      <SpringSwitch v-model="wifi" />
    </label>
    <label class="flex items-center justify-between gap-4 text-sm font-medium">
      Airplane mode
      <SpringSwitch v-model="airplane" />
    </label>
    <label class="flex items-center justify-between gap-4 text-sm font-medium text-muted-foreground">
      Disabled
      <SpringSwitch disabled />
    </label>
  </div>
</template>
