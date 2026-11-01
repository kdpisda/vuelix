<script setup lang="ts">
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { SpringButton } from '@/components/ui/spring-button'
import { Coffee, MapPin, Star } from 'lucide-vue-next'
import { ref } from 'vue'

const open = ref(false)
const snap = ref(1)
const stops = ['Peek', 'Half', 'Full']

const places = [
  { name: 'Common Grounds', kind: 'Coffee · $$', distance: '120 m', rating: 4.8 },
  { name: 'Little Fern', kind: 'Bakery · $', distance: '240 m', rating: 4.6 },
  { name: 'Oro Roasters', kind: 'Coffee · $$', distance: '400 m', rating: 4.7 },
  { name: 'Northside Deli', kind: 'Sandwiches · $', distance: '550 m', rating: 4.4 },
  { name: 'Kettle & Co.', kind: 'Tea house · $$', distance: '700 m', rating: 4.5 },
  { name: 'Marrow', kind: 'Brunch · $$$', distance: '900 m', rating: 4.9 },
  { name: 'Blue Hour', kind: 'Coffee · $', distance: '1.1 km', rating: 4.3 },
  { name: 'Saffron Table', kind: 'Lunch · $$', distance: '1.3 km', rating: 4.6 },
]
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <SpringButton @click="open = true">
      <MapPin class="size-4" /> Find coffee nearby
    </SpringButton>
    <p class="m-0 text-xs text-muted-foreground">
      Drag the handle — flick to snap, pull down to dismiss.
    </p>

    <BottomSheet v-model:open="open" v-model:snap="snap" label="Nearby places" background="#app" class="vp-raw">
      <template #header>
        <div class="flex items-center justify-between gap-3 pb-2">
          <div>
            <p class="m-0 text-base font-semibold">
              Nearby
            </p>
            <p class="m-0 text-xs text-muted-foreground">
              {{ places.length }} places open now
            </p>
          </div>
          <div class="flex gap-1 rounded-full bg-muted p-1">
            <button
              v-for="(stop, i) in stops"
              :key="stop"
              type="button"
              :class="[
                'rounded-full px-2.5 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                snap === i ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="snap = i"
            >
              {{ stop }}
            </button>
          </div>
        </div>
      </template>
      <ul class="m-0 list-none space-y-1 p-0">
        <li v-for="place in places" :key="place.name">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-white">
              <Coffee class="size-5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">{{ place.name }}</span>
              <span class="block text-xs text-muted-foreground">{{ place.kind }} · {{ place.distance }}</span>
            </span>
            <span class="flex items-center gap-1 text-xs font-medium">
              <Star class="size-3.5 fill-amber-400 text-amber-400" /> {{ place.rating }}
            </span>
          </button>
        </li>
      </ul>
    </BottomSheet>
  </div>
</template>
