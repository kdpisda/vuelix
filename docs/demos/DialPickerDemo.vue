<script setup lang="ts">
import { DialPicker } from '@/ui/dial-picker'
import { Volume1, Volume2, VolumeX } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const temperature = ref(21.5)
const volume = ref(40)
const VolumeIcon = computed(() => (volume.value === 0 ? VolumeX : volume.value < 50 ? Volume1 : Volume2))
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-10">
    <DialPicker
      v-model="temperature"
      :min="10"
      :max="30"
      :step="0.5"
      :ticks="41"
      unit="°C"
      label="Living room"
      class="text-chart-5"
    />
    <div class="flex flex-col items-center gap-3">
      <DialPicker
        v-model="volume"
        :size="160"
        :step="5"
        unit="%"
        label="Volume"
        class="text-chart-2"
      />
      <component :is="VolumeIcon" class="size-4 text-muted-foreground" aria-hidden="true" />
    </div>
  </div>
</template>
