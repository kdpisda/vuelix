<script setup lang="ts">
import type { IconSwapState } from '@/components/ui/icon-swap'
import { IconSwap } from '@/components/ui/icon-swap'
import { Check, Copy, Heart, Moon, Pause, Play, Sun, Volume1, Volume2, VolumeX } from 'lucide-vue-next'
import { ref } from 'vue'

const copied = ref(false)
const playing = ref(false)
const liked = ref(false)
const volume = ref<'high' | 'low' | 'mute'>('high')
const theme = ref<'light' | 'dark'>('light')

const copyStates: IconSwapState<boolean>[] = [
  { value: false, label: 'Copy', icon: Copy },
  { value: true, label: 'Copied', icon: Check, class: 'text-emerald-600 dark:text-emerald-400' },
]
const playStates: IconSwapState<boolean>[] = [
  { value: false, label: 'Play', icon: Play },
  { value: true, label: 'Pause', icon: Pause },
]
const likeStates: IconSwapState<boolean>[] = [
  { value: false, label: 'Like', icon: Heart },
  { value: true, label: 'Unlike', icon: Heart, class: 'text-rose-500 [&_svg]:fill-current', burst: true },
]
const volumeStates: IconSwapState<'high' | 'low' | 'mute'>[] = [
  { value: 'high', label: 'Lower volume', icon: Volume2 },
  { value: 'low', label: 'Mute', icon: Volume1 },
  { value: 'mute', label: 'Unmute', icon: VolumeX, class: 'text-muted-foreground' },
]
const themeStates: IconSwapState<'light' | 'dark'>[] = [
  { value: 'light', label: 'Switch to dark', icon: Sun },
  { value: 'dark', label: 'Switch to light', icon: Moon },
]

function copy() {
  navigator.clipboard?.writeText('pnpm dlx shadcn-vue add https://vuelix.dev/r/icon-swap.json').catch(() => {})
}
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <div class="flex flex-wrap items-center justify-center gap-3">
      <IconSwap v-model="playing" :states="playStates" effect="rotate" variant="default" size="lg" class="rounded-full" />
      <IconSwap v-model="liked" :states="likeStates" effect="scale" variant="ghost" size="lg" class="rounded-full" />
      <IconSwap v-model="volume" :states="volumeStates" effect="blur" size="lg" />
      <IconSwap v-model="theme" :states="themeStates" effect="rotate" size="lg" />
    </div>

    <div class="flex items-center gap-2 rounded-lg border bg-card py-1 pl-3 pr-1 font-mono text-xs">
      <span class="text-muted-foreground">$</span>
      <span>pnpm dlx shadcn-vue add …/icon-swap.json</span>
      <IconSwap v-model="copied" :states="copyStates" variant="ghost" size="sm" show-label :reset-after="1600" @change="v => v && copy()" />
    </div>
  </div>
</template>
