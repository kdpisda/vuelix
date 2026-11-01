<script setup lang="ts">
import type { AvailabilityWeek } from '@/components/ui/availability-picker'
import { AvailabilityPicker } from '@/components/ui/availability-picker'
import { ref } from 'vue'

const nineToFive = () => ({ enabled: true, ranges: [{ start: '09:00', end: '12:30' }, { start: '13:30', end: '17:00' }] })

const week = ref<AvailabilityWeek>([
  nineToFive(),
  nineToFive(),
  { enabled: true, ranges: [{ start: '10:00', end: '16:00' }] },
  nineToFive(),
  { enabled: true, ranges: [{ start: '09:00', end: '13:00' }] },
  { enabled: false, ranges: [] },
  { enabled: false, ranges: [] },
])
</script>

<template>
  <AvailabilityPicker v-model="week" class="max-w-xl" />
</template>
