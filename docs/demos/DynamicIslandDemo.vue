<script setup lang="ts">
import { DynamicIsland } from '@/ui/dynamic-island'
import { CalendarClock, Pause, Phone, PhoneOff, Play, SkipBack, SkipForward, Timer } from 'lucide-vue-next'
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'motion-v'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const states = [
  { value: 'idle', label: 'Idle' },
  { value: 'call', label: 'Call' },
  { value: 'timer', label: 'Timer' },
  { value: 'music', label: 'Music' },
  { value: 'notification', label: 'Notify' },
]
const state = ref('idle')

// Timer: a 5-minute countdown that keeps running in the background.
const total = 300
const remaining = ref(272)
const circumference = 2 * Math.PI * 8
let tick: ReturnType<typeof setInterval> | undefined
onMounted(() => (tick = setInterval(() => (remaining.value = remaining.value > 0 ? remaining.value - 1 : total), 1000)))
onBeforeUnmount(() => clearInterval(tick))
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// Music: waveform bars driven by motion values (no re-render per frame).
const playing = ref(true)
const reduced = useReducedMotion()
const bars = Array.from({ length: 5 }, () => useMotionValue(0.4))
useAnimationFrame((t) => {
  if (state.value !== 'music')
    return
  bars.forEach((bar, i) => {
    const live = playing.value && !reduced.value
    bar.set(live ? 0.3 + 0.7 * Math.abs(Math.sin(t / (220 + i * 55) + i * 1.3)) : 0.3)
  })
})

// Notifications dismiss themselves.
let dismiss: ReturnType<typeof setTimeout> | undefined
watch(state, (s) => {
  clearTimeout(dismiss)
  if (s === 'notification')
    dismiss = setTimeout(() => (state.value = 'idle'), 4000)
})
onBeforeUnmount(() => clearTimeout(dismiss))

const iconButton = 'inline-flex cursor-pointer items-center justify-center rounded-full outline-none transition-transform active:scale-90 focus-visible:ring-[3px] focus-visible:ring-white/60'
</script>

<template>
  <div class="flex w-full flex-col items-center gap-5">
    <div class="relative h-[300px] w-full max-w-[400px] overflow-hidden rounded-[2.75rem] border-[7px] border-zinc-900 bg-gradient-to-br from-indigo-500 via-fuchsia-400 to-amber-300 shadow-xl ring-1 ring-black/10">
      <div class="absolute inset-x-0 top-0 flex h-12 items-center justify-between px-7 text-[13px] font-semibold text-white">
        <span>9:41</span>
        <span class="flex items-center gap-1" aria-hidden="true">
          <span class="h-2.5 w-[3px] rounded-sm bg-white" /><span class="h-3 w-[3px] rounded-sm bg-white" /><span class="h-3.5 w-[3px] rounded-sm bg-white/60" />
          <span class="ml-1 h-3 w-6 rounded-[4px] border border-white/80 p-[1.5px]"><span class="block h-full w-3/4 rounded-[2px] bg-white" /></span>
        </span>
      </div>

      <div class="absolute inset-x-0 top-2.5 z-10 flex justify-center px-3">
        <DynamicIsland :state="state" class="bg-black text-white ring-1 ring-white/10">
          <template #idle>
            <div class="flex h-9 w-32 items-center justify-end px-3">
              <span class="size-2.5 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
            </div>
          </template>

          <template #call>
            <div class="flex w-[340px] max-w-[calc(100vw-8.5rem)] items-center gap-3 p-3 pl-3.5">
              <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-semibold">MP</span>
              <span class="min-w-0 flex-1">
                <span class="block text-xs text-white/55">Incoming call</span>
                <span class="block truncate text-[15px] font-semibold">Maya Patel</span>
              </span>
              <button type="button" aria-label="Decline call" :class="[iconButton, 'size-11 bg-red-500']" @click="state = 'idle'">
                <PhoneOff class="size-5" />
              </button>
              <button type="button" aria-label="Accept call" :class="[iconButton, 'size-11 bg-emerald-500']" @click="state = 'idle'">
                <Phone class="size-5" />
              </button>
            </div>
          </template>

          <template #timer>
            <div class="flex h-9 w-56 items-center justify-between px-2">
              <span class="flex items-center gap-1.5 text-orange-400">
                <svg class="size-6 -rotate-90" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-width="2.5" />
                  <circle
                    cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                    class="transition-[stroke-dashoffset] duration-1000 ease-linear"
                    :stroke-dasharray="circumference"
                    :stroke-dashoffset="circumference * (1 - remaining / total)"
                  />
                </svg>
                <Timer class="size-4" />
              </span>
              <span class="pr-1.5 text-[15px] font-semibold tabular-nums text-orange-400" :aria-label="`${clock(remaining)} left`">{{ clock(remaining) }}</span>
            </div>
          </template>

          <template #music>
            <div class="w-[340px] max-w-[calc(100vw-8.5rem)] p-4 pb-3">
              <div class="flex items-center gap-3">
                <span class="size-12 shrink-0 rounded-xl bg-gradient-to-br from-rose-400 via-orange-300 to-amber-200 shadow-inner" />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold">Midnight Drive</span>
                  <span class="block truncate text-xs text-white/55">Neon Harbor</span>
                </span>
                <span class="flex h-6 items-center gap-[3px]" aria-hidden="true">
                  <motion.span v-for="(bar, i) in bars" :key="i" class="h-6 w-[3px] rounded-full bg-rose-400" :style="{ scaleY: bar }" />
                </span>
              </div>
              <div class="mt-3 flex items-center gap-2 text-[10px] tabular-nums text-white/50">
                <span>1:24</span>
                <span class="h-1 flex-1 overflow-hidden rounded-full bg-white/20"><span class="block h-full w-2/5 rounded-full bg-white" /></span>
                <span>-2:07</span>
              </div>
              <div class="mt-1.5 flex items-center justify-center gap-5">
                <button type="button" aria-label="Previous track" :class="[iconButton, 'size-9']">
                  <SkipBack class="size-5 fill-current" />
                </button>
                <button type="button" :aria-label="playing ? 'Pause' : 'Play'" :class="[iconButton, 'size-10']" @click="playing = !playing">
                  <Pause v-if="playing" class="size-6 fill-current" />
                  <Play v-else class="size-6 fill-current" />
                </button>
                <button type="button" aria-label="Next track" :class="[iconButton, 'size-9']">
                  <SkipForward class="size-5 fill-current" />
                </button>
              </div>
            </div>
          </template>

          <template #notification>
            <div class="flex w-[300px] max-w-[calc(100vw-8.5rem)] items-center gap-3 p-2.5 pr-4">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500">
                <CalendarClock class="size-5" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold">Design review</span>
                <span class="block truncate text-xs text-white/55">Starts in 5 min · Room 4B</span>
              </span>
              <span class="text-xs text-white/45">now</span>
            </div>
          </template>
        </DynamicIsland>
      </div>

      <div class="absolute inset-x-0 bottom-10 text-center text-white">
        <p class="m-0 text-sm font-medium opacity-80">
          Saturday, November 1
        </p>
        <p class="m-0 text-6xl font-semibold tracking-tight">
          9:41
        </p>
      </div>
    </div>

    <div class="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Island state">
      <button
        v-for="s in states"
        :key="s.value"
        type="button"
        :aria-pressed="state === s.value"
        :class="[
          'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
          state === s.value ? 'border-transparent bg-foreground text-background' : 'bg-background text-muted-foreground hover:text-foreground',
        ]"
        @click="state = s.value"
      >
        {{ s.label }}
      </button>
    </div>
  </div>
</template>
