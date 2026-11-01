<script setup lang="ts">
import { Combobox } from '@/ui/combobox'
import { ref } from 'vue'

const tz = ref('Europe/Lisbon')
const options = [
  { value: 'America/Los_Angeles', label: 'Los Angeles', hint: 'UTC−8' },
  { value: 'America/Mexico_City', label: 'Mexico City', hint: 'UTC−6' },
  { value: 'America/New_York', label: 'New York', hint: 'UTC−5' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', hint: 'UTC−3' },
  { value: 'Europe/Lisbon', label: 'Lisbon', hint: 'UTC+0' },
  { value: 'Europe/London', label: 'London', hint: 'UTC+0' },
  { value: 'Europe/Berlin', label: 'Berlin', hint: 'UTC+1' },
  { value: 'Africa/Lagos', label: 'Lagos', hint: 'UTC+1' },
  { value: 'Africa/Nairobi', label: 'Nairobi', hint: 'UTC+3' },
  { value: 'Asia/Dubai', label: 'Dubai', hint: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'Kolkata', hint: 'UTC+5:30' },
  { value: 'Asia/Singapore', label: 'Singapore', hint: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo', hint: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Sydney', hint: 'UTC+10' },
]
</script>

<template>
  <div class="flex w-full max-w-xs flex-col gap-2">
    <label for="tz-combobox" class="text-sm font-medium">Time zone</label>
    <Combobox id="tz-combobox" v-model="tz" :options="options" placeholder="Search a city…" name="timezone" />
    <p class="m-0 text-xs text-muted-foreground">
      Selected: <code class="text-foreground">{{ tz ?? '—' }}</code>
    </p>
  </div>
</template>
