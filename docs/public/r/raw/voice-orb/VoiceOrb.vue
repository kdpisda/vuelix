<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

const props = withDefaults(defineProps<{
  /** What the assistant is doing — changes colour, speed and how much the orb reacts to `level`. */
  state?: VoiceOrbState
  /** Live audio level, 0–1. Feed it from an AnalyserNode (mic while listening, TTS while speaking). */
  level?: number
  /** Diameter in px. */
  size?: number
  /** Screen-reader text announced when the state changes. Defaults to a label per state. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  state: 'idle',
  level: 0,
  size: 176,
})

interface Preset {
  /** Base deformation of the blobs. */
  amp: number
  /** How strongly `level` adds deformation and scale. */
  react: number
  /** Time multiplier for the wobble. */
  speed: number
  /** Overall scale. */
  scale: number
  /** Idle breathing strength. */
  breath: number
  /** Baseline halo energy. */
  glow: number
}

// Tune the personality of each state here.
const PRESETS: Record<VoiceOrbState, Preset> = {
  idle: { amp: 0.05, react: 0, speed: 0.45, scale: 0.96, breath: 1, glow: 0.15 },
  listening: { amp: 0.06, react: 0.3, speed: 0.9, scale: 1, breath: 0.4, glow: 0.35 },
  thinking: { amp: 0.09, react: 0, speed: 2.4, scale: 0.9, breath: 0, glow: 0.3 },
  speaking: { amp: 0.07, react: 0.38, speed: 1.5, scale: 1.02, breath: 0.2, glow: 0.45 },
}

// Gradient stops use `stop-color: currentColor`, so plain text-* token classes colour them.
// [back blob from → to, front blob from → to, core]
const PALETTES: Record<VoiceOrbState, [string, string, string, string, string]> = {
  idle: ['text-chart-2', 'text-chart-3', 'text-chart-1', 'text-chart-2', 'text-chart-1'],
  listening: ['text-chart-2', 'text-chart-1', 'text-chart-2', 'text-chart-3', 'text-chart-2'],
  thinking: ['text-chart-3', 'text-chart-5', 'text-chart-3', 'text-chart-2', 'text-chart-3'],
  speaking: ['text-chart-1', 'text-chart-4', 'text-chart-1', 'text-chart-2', 'text-chart-1'],
}
const HALO: Record<VoiceOrbState, string> = {
  idle: 'bg-chart-2/50',
  listening: 'bg-chart-2/70',
  thinking: 'bg-chart-3/70',
  speaking: 'bg-chart-1/70',
}
const LABELS: Record<VoiceOrbState, string> = {
  idle: 'Voice assistant idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
}

const LEVEL_SPRING = { stiffness: 260, damping: 24, mass: 0.5 }

const uid = useId()
const ids = { back: `${uid}-back`, front: `${uid}-front`, core: `${uid}-core`, blur: `${uid}-blur` }
const reduced = useReducedMotion()
const palette = computed(() => PALETTES[props.state])

const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0))

// Audio level → spring so jittery analyser data turns into smooth, organic motion.
const rawLevel = useMotionValue(clamp01(props.level))
const level = useSpring(rawLevel, LEVEL_SPRING)
watch(() => props.level, v => rawLevel.set(clamp01(v)))

// 0–1 "energy" drives the halo; written every frame (or on change with reduced motion).
const energy = useMotionValue(PRESETS[props.state].glow)
const haloScale = useTransform(energy, [0, 1], [0.82, 1.28])
const haloOpacity = useTransform(energy, [0, 1], [0.35, 0.95])

/** Smooth closed blob through `n` wobbling points (Catmull-Rom → cubic Bézier). */
function blob(r: number, amp: number, t: number, seed: number, n = 12) {
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const wobble
      = Math.sin(a * 2 + t * 1.3 + seed) * 0.5
        + Math.sin(a * 3 - t * 0.9 + seed * 2) * 0.32
        + Math.sin(a * 5 + t * 2.1 + seed * 3) * 0.18
    const rr = r * (1 + amp * wobble)
    pts.push([100 + Math.cos(a) * rr, 100 + Math.sin(a) * rr])
  }
  const p = (i: number) => pts[(i + n) % n]!
  let d = `M${p(0)[0].toFixed(2)} ${p(0)[1].toFixed(2)}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return `${d}Z`
}

// Static shapes for SSR and the first paint; the frame loop takes over after mount.
const initial = { back: blob(66, 0.03, 0, 0), front: blob(58, 0.03, 0, 2.1), core: blob(32, 0.03, 0, 4.2) }

const backEl = ref<SVGPathElement>()
const frontEl = ref<SVGPathElement>()
const coreEl = ref<SVGPathElement>()
const groupEl = ref<SVGGElement>()
const arcEl = ref<SVGCircleElement>()
const backGrad = ref<SVGLinearGradientElement>()
const frontGrad = ref<SVGLinearGradientElement>()

const cur: Preset = { ...PRESETS[props.state] }
let t = 0
let last = 0
let raf = 0

function draw(now: number, lv: number) {
  const amp = cur.amp + cur.react * lv
  backEl.value?.setAttribute('d', blob(66, amp * 1.15, t, 0))
  frontEl.value?.setAttribute('d', blob(58, amp, t * 1.25, 2.1))
  coreEl.value?.setAttribute('d', blob(32, amp * 1.5, t * 1.6, 4.2))
  const breathe = 1 + 0.03 * Math.sin((now / 1000) * 1.4) * cur.breath
  const s = cur.scale * breathe + lv * cur.react * 0.45
  groupEl.value?.setAttribute('transform', `translate(100 100) scale(${s.toFixed(4)}) translate(-100 -100)`)
  backGrad.value?.setAttribute('gradientTransform', `rotate(${(t * 38) % 360} .5 .5)`)
  frontGrad.value?.setAttribute('gradientTransform', `rotate(${(-t * 52) % 360} .5 .5)`)
  arcEl.value?.setAttribute('transform', `rotate(${((now / 1000) * 240) % 360} 100 100)`)
  energy.set(Math.min(1, cur.glow + lv * cur.react * 2.4))
}

function tick(now: number) {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
  last = now
  // Ease every parameter toward the current state so state changes morph instead of snapping.
  const target = PRESETS[props.state]
  const k = 1 - Math.exp(-dt * 3.5)
  for (const key of Object.keys(target) as (keyof Preset)[])
    cur[key] += (target[key] - cur[key]) * k
  t += dt * cur.speed
  draw(now, level.get())
  raf = requestAnimationFrame(tick)
}

function start() {
  cancelAnimationFrame(raf)
  last = 0
  raf = requestAnimationFrame(tick)
}

/** Reduced motion: no loop — a calm, near-circular orb that only updates when inputs change. */
function drawStill() {
  cancelAnimationFrame(raf)
  Object.assign(cur, PRESETS[props.state], { amp: 0, breath: 0, react: 0 })
  draw(0, 0)
  energy.set(Math.min(1, PRESETS[props.state].glow + clamp01(props.level) * PRESETS[props.state].react * 2))
}

onMounted(() => (reduced.value ? drawStill() : start()))
watch(reduced, r => (r ? drawStill() : start()))
watch(() => [props.state, props.level], () => reduced.value && drawStill())
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div
    :class="cn('relative inline-grid shrink-0 place-items-center', props.class)"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    :data-state="props.state"
  >
    <motion.div
      aria-hidden="true"
      :class="cn('pointer-events-none absolute inset-[8%] rounded-full blur-2xl transition-colors duration-700', HALO[props.state])"
      :style="{ scale: haloScale, opacity: haloOpacity }"
    />
    <template v-if="props.state === 'listening' && !reduced">
      <motion.div
        v-for="i in 2"
        :key="i"
        aria-hidden="true"
        class="pointer-events-none absolute inset-[16%] rounded-full border-2 border-chart-2/60"
        :initial="{ scale: 1, opacity: 0 }"
        :animate="{ scale: [1, 1.5], opacity: [0.6, 0] }"
        :transition="{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: (i - 1) * 1.1 }"
      />
    </template>

    <svg viewBox="0 0 200 200" class="relative size-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient :id="ids.back" ref="backGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="currentColor" :class="cn('transition-colors duration-700', palette[0])" />
          <stop offset="1" stop-color="currentColor" :class="cn('transition-colors duration-700', palette[1])" />
        </linearGradient>
        <linearGradient :id="ids.front" ref="frontGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="currentColor" :class="cn('transition-colors duration-700', palette[2])" />
          <stop offset="1" stop-color="currentColor" :class="cn('transition-colors duration-700', palette[3])" />
        </linearGradient>
        <radialGradient :id="ids.core" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stop-color="currentColor" stop-opacity="0.95" :class="cn('transition-colors duration-700', palette[4])" />
          <stop offset="1" stop-color="currentColor" stop-opacity="0" :class="cn('transition-colors duration-700', palette[4])" />
        </radialGradient>
        <filter :id="ids.blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <!-- Thinking: an orbiting arc -->
      <circle
        ref="arcEl"
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-dasharray="70 495"
        :class="cn('stroke-chart-3 transition-opacity duration-500', props.state === 'thinking' ? 'opacity-90' : 'opacity-0')"
      />

      <g ref="groupEl" transform="translate(100 100) scale(0.96) translate(-100 -100)">
        <path ref="backEl" :d="initial.back" :fill="`url(#${ids.back})`" :filter="`url(#${ids.blur})`" opacity="0.9" />
        <path ref="frontEl" :d="initial.front" :fill="`url(#${ids.front})`" opacity="0.88" />
        <path ref="coreEl" :d="initial.core" :fill="`url(#${ids.core})`" />
      </g>
    </svg>

    <span class="sr-only" role="status">{{ props.label ?? LABELS[props.state] }}</span>
  </div>
</template>
