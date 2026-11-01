<script setup lang="ts">
import type { VoiceOrbState } from '@/ui/voice-orb'
import { VoiceOrb } from '@/ui/voice-orb'
import { Pause, Play } from 'lucide-vue-next'
import { AnimatePresence, motion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const states: VoiceOrbState[] = ['idle', 'listening', 'thinking', 'speaking']
const script: { state: VoiceOrbState, ms: number, text: string }[] = [
  { state: 'idle', ms: 1600, text: 'Tap to talk' },
  { state: 'listening', ms: 3600, text: 'What should I pack for Lisbon this weekend?' },
  { state: 'thinking', ms: 1800, text: 'Checking the forecast…' },
  { state: 'speaking', ms: 4600, text: 'Sunny and 24° on Saturday, a light breeze Sunday — bring a linen shirt and a light jacket.' },
]

const state = ref<VoiceOrbState>('idle')
const caption = ref(script[0]!.text)
const level = ref(0)
const auto = ref(true)

let step = 0
let stepTimer: ReturnType<typeof setTimeout> | undefined
let levelTimer: ReturnType<typeof setInterval> | undefined
let t = 0

function runScript() {
  const s = script[step % script.length]!
  state.value = s.state
  caption.value = s.text
  step++
  stepTimer = setTimeout(runScript, s.ms)
}

function pick(s: VoiceOrbState) {
  auto.value = false
  state.value = s
  caption.value = script.find(x => x.state === s)!.text
}

function toggleAuto() {
  auto.value = !auto.value
}

watch(auto, (on) => {
  clearTimeout(stepTimer)
  if (on) {
    step = states.indexOf(state.value) + 1
    stepTimer = setTimeout(runScript, 1200)
  }
})

onMounted(() => {
  stepTimer = setTimeout(runScript, 600)
  // Fake microphone / TTS envelope: syllable-ish bursts with a little noise.
  levelTimer = setInterval(() => {
    t += 0.05
    const talking = state.value === 'listening' || state.value === 'speaking'
    const syllables = Math.max(0, Math.sin(t * 7.3) * Math.sin(t * 2.1 + 1) + 0.15)
    const breath = Math.max(0, Math.sin(t * 0.9))
    level.value = talking ? Math.min(1, syllables * (0.55 + 0.45 * breath) + Math.random() * 0.12) : 0
  }, 50)
})

onBeforeUnmount(() => {
  clearTimeout(stepTimer)
  clearInterval(levelTimer)
})

const meter = computed(() => Math.round(level.value * 100))
</script>

<template>
  <div class="flex w-full max-w-md flex-col items-center gap-6">
    <VoiceOrb :state="state" :level="level" :size="168" />

    <div class="flex h-12 w-full items-start justify-center text-center">
      <AnimatePresence mode="wait" :initial="false">
        <motion.p
          :key="caption"
          class="m-0 max-w-sm text-sm leading-6 text-balance"
          :class="state === 'idle' || state === 'thinking' ? 'text-muted-foreground' : 'text-foreground'"
          :initial="{ opacity: 0, y: 6, filter: 'blur(4px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, y: -6, filter: 'blur(4px)' }"
          :transition="{ duration: 0.25 }"
        >
          {{ caption }}
        </motion.p>
      </AnimatePresence>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-2">
      <div role="group" aria-label="Orb state" class="inline-flex rounded-lg border bg-card p-0.5 text-xs font-medium shadow-xs">
        <button
          v-for="s in states"
          :key="s"
          type="button"
          :aria-pressed="state === s"
          class="rounded-md px-2.5 py-1.5 capitalize text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-muted aria-pressed:text-foreground"
          @click="pick(s)"
        >
          {{ s }}
        </button>
      </div>
      <button
        type="button"
        :aria-pressed="auto"
        class="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="toggleAuto"
      >
        <component :is="auto ? Pause : Play" class="size-3.5" aria-hidden="true" />
        {{ auto ? 'Pause demo' : 'Auto demo' }}
      </button>
      <span class="w-14 font-mono text-[11px] tabular-nums text-muted-foreground" aria-hidden="true">lvl {{ meter }}</span>
    </div>
  </div>
</template>
