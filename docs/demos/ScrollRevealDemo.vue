<script setup lang="ts">
import type { ScrollRevealPreset } from '@/ui/scroll-reveal'
import { AnimatedTabs } from '@/ui/animated-tabs'
import { ScrollProgress, ScrollReveal } from '@/ui/scroll-reveal'
import { Gauge, Layers, MousePointerClick, Palette, Sparkles, Zap } from 'lucide-vue-next'
import { ref } from 'vue'

const presets = [
  { value: 'fade-up', label: 'Fade up' },
  { value: 'blur-in', label: 'Blur in' },
  { value: 'scale', label: 'Scale' },
  { value: 'slide-left', label: 'Slide left' },
  { value: 'slide-right', label: 'Slide right' },
]
const preset = ref('fade-up')
const box = ref<HTMLElement | null>(null)

const features = [
  { icon: Zap, title: 'Instant', text: 'Copy the file, own the code.' },
  { icon: Sparkles, title: 'Springy', text: 'Physics instead of durations.' },
  { icon: Palette, title: 'Themeable', text: 'shadcn-vue tokens throughout.' },
  { icon: MousePointerClick, title: 'Accessible', text: 'Keyboard and reduced motion.' },
  { icon: Layers, title: 'Composable', text: 'Small pieces, no global state.' },
  { icon: Gauge, title: 'Fast', text: 'Motion values, no re-renders.' },
]
</script>

<template>
  <div class="flex w-full max-w-xl flex-col items-center gap-4">
    <AnimatedTabs v-model="preset" :items="presets" class="max-w-full overflow-x-auto" />

    <div class="relative w-full overflow-hidden rounded-xl border bg-card">
      <ScrollProgress :container="box" :fixed="false" />
      <div ref="box" class="h-80 overflow-y-auto overflow-x-hidden px-6 pb-10 pt-8">
        <p class="m-0 text-center text-sm text-muted-foreground">
          Scroll inside this box ↓
        </p>
        <div class="h-20" />
        <ScrollReveal :key="preset" :preset="preset as ScrollRevealPreset" :once="false" class="grid grid-cols-2 gap-3 sm:grid-cols-3" item-class="h-full">
          <div v-for="f in features" :key="f.title" class="h-full rounded-xl border bg-background p-4">
            <component :is="f.icon" class="size-5 text-brand" aria-hidden="true" />
            <p class="m-0 mt-3 text-sm font-medium">
              {{ f.title }}
            </p>
            <p class="m-0 mt-1 text-xs text-muted-foreground">
              {{ f.text }}
            </p>
          </div>
        </ScrollReveal>
        <div class="h-48" />
        <ScrollReveal :key="`${preset}-text`" :preset="preset as ScrollRevealPreset" :once="false" :stagger="0.12" class="mx-auto max-w-sm text-center">
          <h3 class="m-0 text-xl font-semibold tracking-tight">
            Motion that earns its place
          </h3>
          <p class="m-0 mt-2 text-sm text-muted-foreground">
            Each child enters on its own beat, then gets out of the way.
          </p>
        </ScrollReveal>
        <div class="h-40" />
      </div>
    </div>
  </div>
</template>
