<script setup lang="ts">
import { RangeSlider } from '@/ui/range-slider'
import { Volume1, Volume2 } from 'lucide-vue-next'
import { ref } from 'vue'

const volume = ref(64)
const price = ref<[number, number]>([120, 480])
const usd = (v: number) => `$${v}`
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-12 pt-6">
    <div class="flex items-center gap-3">
      <Volume1 class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <RangeSlider v-model="volume" aria-label="Volume" />
      <Volume2 class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </div>
    <div class="flex flex-col gap-11">
      <div class="flex items-baseline justify-between text-sm">
        <span class="font-medium">Price range</span>
        <span class="tabular-nums text-muted-foreground">{{ usd(price[0]) }} – {{ usd(price[1]) }}</span>
      </div>
      <RangeSlider v-model="price" :min="0" :max="600" :step="10" :format="usd" show-value="always" name="price" />
    </div>
  </div>
</template>
