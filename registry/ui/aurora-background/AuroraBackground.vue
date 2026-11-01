<script setup lang="ts">
import type { AnimationPlaybackControls } from 'motion-v'
import type { HTMLAttributes } from 'vue'
import { animate, useInView, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Blob colours (any CSS colour). Defaults to the chart / brand tokens. */
  colors?: string[]
  /** Blur radius of each blob in px. */
  blur?: number
  /** Opacity of the whole aurora layer (0–1). */
  intensity?: number
  /** Speed multiplier; 1 = one slow drift every ~20s. */
  speed?: number
  /** Film-grain overlay (a static SVG noise filter). */
  grain?: boolean
  class?: HTMLAttributes['class']
}>(), {
  colors: () => ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'],
  blur: 40,
  intensity: 0.65,
  speed: 1,
  grain: true,
})

// Resting place + size of each blob (cycled when there are more colours).
const SLOTS = [
  { left: '-12%', top: '-30%', size: '62%' },
  { left: '48%', top: '-38%', size: '58%' },
  { left: '18%', top: '30%', size: '56%' },
  { left: '62%', top: '24%', size: '50%' },
  { left: '-8%', top: '42%', size: '46%' },
  { left: '34%', top: '-10%', size: '40%' },
]
// Drift paths (translate is relative to the blob's own size).
const PATHS = [
  { x: ['0%', '22%', '8%', '0%'], y: ['0%', '12%', '28%', '0%'], scale: [1, 1.12, 0.94, 1] },
  { x: ['0%', '-18%', '-6%', '0%'], y: ['0%', '22%', '6%', '0%'], scale: [1, 0.92, 1.1, 1] },
  { x: ['0%', '16%', '-14%', '0%'], y: ['0%', '-18%', '-6%', '0%'], scale: [1, 1.08, 1, 1] },
  { x: ['0%', '-22%', '-10%', '0%'], y: ['0%', '-10%', '14%', '0%'], scale: [1, 1.15, 0.96, 1] },
]

const blobs = computed(() => props.colors.map((color, i) => ({ color, ...SLOTS[i % SLOTS.length]! })))

const noiseId = `vx-aurora-noise-${useId()}`
const root = ref<HTMLElement>()
const blobEls = ref<HTMLElement[]>([])
const reduced = useReducedMotion()
const inView = useInView(root)

let controls: AnimationPlaybackControls[] = []

function stop() {
  controls.forEach(c => c.stop())
  controls = []
}

function start() {
  stop()
  if (reduced.value)
    return
  // Transform-only keyframes: the compositor moves each pre-blurred layer.
  controls = blobEls.value.map((el, i) =>
    animate(el, PATHS[i % PATHS.length]!, {
      duration: (18 + i * 5) / Math.max(0.05, props.speed),
      repeat: Infinity,
      ease: 'easeInOut',
    }),
  )
  if (!inView.value)
    controls.forEach(c => c.pause())
}

onMounted(start)
watch([reduced, () => props.speed, () => props.colors.length], start, { flush: 'post' })
watch(inView, v => controls.forEach(c => (v ? c.play() : c.pause())))
onBeforeUnmount(stop)
</script>

<template>
  <div ref="root" :class="cn('relative isolate overflow-hidden bg-background', props.class)">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10" :style="{ opacity: props.intensity }">
      <div
        v-for="(blob, i) in blobs"
        :key="i"
        ref="blobEls"
        class="absolute aspect-square rounded-full will-change-transform"
        :style="{
          left: blob.left,
          top: blob.top,
          width: blob.size,
          background: `radial-gradient(circle at center, ${blob.color} 0%, transparent 68%)`,
          filter: `blur(${props.blur}px)`,
        }"
      />
    </div>
    <svg v-if="props.grain" aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 size-full opacity-[0.18] mix-blend-overlay">
      <filter :id="noiseId">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" :filter="`url(#${noiseId})`" />
    </svg>
    <slot />
  </div>
</template>
