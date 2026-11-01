<script setup lang="ts">
import { Marquee } from '@/ui/marquee'

const logos = ['Northwind', 'Acme', 'Globex', 'Umbrella', 'Initech', 'Hooli', 'Stark', 'Wayne']
const quotes = [
  { name: 'Ana Ruiz', handle: '@anaruiz', text: 'Dropped the stepper in and shipped onboarding the same afternoon.' },
  { name: 'Leo Park', handle: '@leop', text: 'The motion feels expensive. Our users noticed immediately.' },
  { name: 'Mia Chen', handle: '@miachen', text: 'Copy, paste, tweak a spring. That is the whole workflow.' },
  { name: 'Sam Odu', handle: '@samodu', text: 'Finally, animated components that respect reduced motion.' },
]
</script>

<template>
  <div class="flex w-full max-w-2xl flex-col gap-6">
    <Marquee :speed="45" gap="2.5rem" label="Customers">
      <span
        v-for="logo in logos"
        :key="logo"
        class="text-lg font-semibold tracking-tight text-muted-foreground"
      >{{ logo }}</span>
    </Marquee>

    <Marquee direction="right" :speed="30" label="Testimonials">
      <figure
        v-for="q in quotes"
        :key="q.handle"
        class="m-0 w-64 rounded-xl border bg-card p-4"
      >
        <p class="m-0 text-sm leading-5">
          “{{ q.text }}”
        </p>
        <figcaption class="mt-3 flex items-center gap-2 text-xs">
          <span class="grid size-6 place-items-center rounded-full bg-muted font-semibold">{{ q.name[0] }}</span>
          <span class="font-medium">{{ q.name }}</span>
          <span class="text-muted-foreground">{{ q.handle }}</span>
        </figcaption>
      </figure>
    </Marquee>
  </div>
</template>
