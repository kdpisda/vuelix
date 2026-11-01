<script setup lang="ts">
import { MotionSelect } from '@/components/ui/motion-select'
import { ref } from 'vue'

const region = ref<string>()
const options = [
  { value: 'fra', label: 'Frankfurt · eu-central' },
  { value: 'ams', label: 'Amsterdam · eu-west' },
  { value: 'iad', label: 'Virginia · us-east' },
  { value: 'sfo', label: 'San Francisco · us-west' },
  { value: 'gru', label: 'São Paulo · sa-east', disabled: true },
  { value: 'sin', label: 'Singapore · ap-southeast' },
  { value: 'syd', label: 'Sydney · ap-southeast-2' },
]
</script>

<template>
  <div class="flex w-full max-w-xs flex-col gap-2">
    <label for="region-select" class="text-sm font-medium">Deploy region</label>
    <MotionSelect id="region-select" v-model="region" :options="options" placeholder="Pick a region" name="region" />
    <p class="m-0 text-xs text-muted-foreground">
      Try the arrow keys, Home / End, or type a city name.
    </p>
  </div>
</template>
