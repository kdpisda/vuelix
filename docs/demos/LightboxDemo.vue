<script setup lang="ts">
import type { LightboxImage } from '@/components/ui/lightbox'
import { Lightbox } from '@/components/ui/lightbox'

const photos = [
  { seed: 'harbor', alt: 'Golden Gate Bridge at sunset', caption: 'Golden hour over the Golden Gate, San Francisco.' },
  { seed: 'dunes', alt: 'Succulents in a glass terrarium', caption: 'A tiny desert under glass.' },
  { seed: 'alpine', alt: 'Wooden pier stretching out to sea', caption: 'The long walk out over the shallows.' },
  { seed: 'market', alt: 'Snowy peaks above a sea of clouds', caption: 'Peaks breaking through a sea of clouds.' },
  { seed: 'forest', alt: 'Weathered building above parked cars', caption: 'Faded facades and pastel cars.' },
  { seed: 'coast', alt: 'Gravel road through open fields', caption: 'A gravel road curving into open country.' },
]

const images: LightboxImage[] = photos.map(p => ({
  src: `https://picsum.photos/seed/${p.seed}/1500/1000`,
  thumb: `https://picsum.photos/seed/${p.seed}/600/400`,
  width: 1500,
  height: 1000,
  alt: p.alt,
  caption: p.caption,
}))
</script>

<template>
  <Lightbox :images="images" label="Travel photos" viewer-class="vp-raw" class="max-w-lg" />
</template>
