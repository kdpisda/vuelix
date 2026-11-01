<script setup lang="ts">
import type { FilmstripItem } from '@/components/ui/filmstrip'
import { Filmstrip } from '@/components/ui/filmstrip'
import { ref } from 'vue'

const shots: [string, string][] = [
  ['fjord', 'Morning light over a quiet fjord'],
  ['dunes', 'Wind-carved dunes at golden hour'],
  ['harbor', 'Fishing boats tucked into the harbor'],
  ['alpine', 'An alpine lake under low clouds'],
  ['market', 'Lanterns over a night market'],
  ['canyon', 'Red canyon walls after the rain'],
  ['forest', 'Fog drifting through a pine forest'],
  ['coast', 'Basalt columns on a wild coast'],
  ['tundra', 'First snow on the tundra'],
]

const items: FilmstripItem[] = shots.map(([seed, caption]) => ({
  src: `https://picsum.photos/seed/${seed}/960/600`,
  thumb: `https://picsum.photos/seed/${seed}/192/144`,
  alt: caption,
  caption,
}))
const index = ref(0)
</script>

<template>
  <Filmstrip v-model="index" :items="items" class="w-full max-w-xl" />
</template>
