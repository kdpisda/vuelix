<script setup lang="ts">
import { RadioCards } from '@/components/ui/radio-cards'
import { ref } from 'vue'

const plan = ref('pro')
const plans = [
  { value: 'hobby', label: 'Hobby', description: 'Free forever' },
  { value: 'pro', label: 'Pro', description: '$12 / month' },
  { value: 'team', label: 'Team', description: '$40 / month' },
]

const shipping = ref('standard')
const speeds = [
  { value: 'standard', label: 'Standard', description: '4–6 business days' },
  { value: 'express', label: 'Express', description: '1–2 business days' },
  { value: 'pickup', label: 'Store pickup', description: 'Out of stock nearby', disabled: true },
]
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-8">
    <RadioCards v-model="plan" :options="plans" aria-label="Plan" name="plan" />
    <RadioCards v-model="shipping" :options="speeds" variant="list" aria-label="Shipping speed" class="mx-auto w-full max-w-xs" />
  </div>
</template>
