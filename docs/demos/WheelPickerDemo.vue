<script setup lang="ts">
import { WheelPicker, WheelPickerGroup } from '@/ui/wheel-picker'
import { AlarmClock } from 'lucide-vue-next'
import { ref } from 'vue'

const hours = Array.from({ length: 12 }, (_, i) => i + 1)
const minutes = Array.from({ length: 60 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }))
const periods = ['AM', 'PM']
const snoozeOptions = [5, 10, 15, 20, 30].map(m => ({ value: m, label: `${m} min` }))

const hour = ref(7)
const minute = ref(30)
const period = ref('AM')
const snooze = ref(10)
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-6">
    <div class="w-72 rounded-2xl border bg-card p-5 shadow-sm">
      <div class="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <AlarmClock class="size-4" />
        Wake up at
        <span class="ml-auto font-medium tabular-nums text-foreground">
          {{ hour }}:{{ String(minute).padStart(2, '0') }} {{ period }}
        </span>
      </div>
      <WheelPickerGroup label="Alarm time" class="w-full justify-center">
        <WheelPicker v-model="hour" :options="hours" label="Hour" class="w-14" />
        <span class="relative pb-0.5 text-lg font-semibold" aria-hidden="true">:</span>
        <WheelPicker v-model="minute" :options="minutes" label="Minute" class="w-14" />
        <WheelPicker v-model="period" :options="periods" label="AM or PM" class="w-14 text-base" />
      </WheelPickerGroup>
    </div>

    <div class="flex flex-col items-center gap-2">
      <span class="text-xs font-medium uppercase tracking-widest text-muted-foreground">Snooze</span>
      <WheelPicker v-model="snooze" :options="snoozeOptions" label="Snooze" class="w-28 text-base" />
    </div>
  </div>
</template>
