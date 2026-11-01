<script setup lang="ts">
import type { DateRange } from '@/components/ui/date-range-picker'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { onMounted, ref } from 'vue'

const range = ref<DateRange>({ start: null, end: null })
const open = ref(true)

// Relative to today — set on the client so the static page never goes stale.
onMounted(() => {
  const t = new Date()
  range.value = {
    start: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 4),
    end: new Date(t.getFullYear(), t.getMonth(), t.getDate() + 3),
  }
})
</script>

<template>
  <DateRangePicker v-model="range" v-model:open="open" align="center" />
</template>
