<script setup lang="ts">
import type { CitationSource } from '@/components/ui/citations'
import { Citations } from '@/components/ui/citations'
import { Globe } from 'lucide-vue-next'

const sources: CitationSource[] = [
  {
    title: 'Why Is the Sky Blue?',
    url: 'https://spaceplace.nasa.gov/blue-sky/en/',
    domain: 'spaceplace.nasa.gov',
    snippet: 'Sunlight reaches Earth’s atmosphere and is scattered in all directions by the gases and particles in the air. Blue light is scattered more than the other colors.',
  },
  {
    title: 'Rayleigh scattering',
    url: 'https://en.wikipedia.org/wiki/Rayleigh_scattering',
    snippet: 'The intensity of the scattered light is inversely proportional to the fourth power of the wavelength, so shorter wavelengths are scattered much more strongly.',
  },
  {
    title: 'Rayleigh scattering | Definition & Facts',
    url: 'https://www.britannica.com/science/Rayleigh-scattering',
    snippet: 'Dispersion of electromagnetic radiation by particles that have a radius less than about one-tenth the wavelength of the radiation.',
  },
  {
    title: 'Why is the sky blue? Optical effects explained',
    url: 'https://www.metoffice.gov.uk/weather/learn-about/weather/optical-effects/why-is-the-sky-blue',
    snippet: 'When the sun is low, its light passes through more of the atmosphere, so more blue is scattered away and the sky glows red and orange.',
  },
]

const answer = 'The sky looks blue because sunlight scatters off the molecules in the air, and short wavelengths scatter far more than long ones [1]. This Rayleigh scattering grows with the inverse fourth power of the wavelength, so blue light is scattered several times more strongly than red [2][3]. At sunrise and sunset the light crosses much more atmosphere, most of the blue is scattered out along the way, and the reds and oranges are what reach you [4].'
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-3">
    <div class="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <Globe class="size-3.5" />
      Searched the web · 4 sources
    </div>
    <Citations :sources="sources" :text="answer" />
  </div>
</template>
