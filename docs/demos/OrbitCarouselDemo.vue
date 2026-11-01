<script setup lang="ts">
import { OrbitCarousel } from '@/ui/orbit-carousel'
import { ref } from 'vue'

const places = [
  { seed: 'kyoto', name: 'Kyoto', country: 'Japan' },
  { seed: 'lisbon', name: 'Lisbon', country: 'Portugal' },
  { seed: 'oaxaca', name: 'Oaxaca', country: 'Mexico' },
  { seed: 'tromso', name: 'Tromsø', country: 'Norway' },
  { seed: 'hoian', name: 'Hội An', country: 'Vietnam' },
  { seed: 'cusco', name: 'Cusco', country: 'Peru' },
  { seed: 'essaouira', name: 'Essaouira', country: 'Morocco' },
  { seed: 'queenstown', name: 'Queenstown', country: 'New Zealand' },
]
const active = ref(0)
</script>

<template>
  <OrbitCarousel v-model="active" :items="places" :card-width="180" :card-height="236" auto-rotate label="Destinations">
    <template #item="{ item }">
      <img
        :src="`https://picsum.photos/seed/${item.seed}/360/400`"
        :alt="`${item.name}, ${item.country}`"
        draggable="false"
        class="h-[176px] w-full object-cover"
      >
      <div class="px-3.5 py-2.5">
        <p class="m-0 text-sm font-semibold">
          {{ item.name }}
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          {{ item.country }}
        </p>
      </div>
    </template>
  </OrbitCarousel>
</template>
