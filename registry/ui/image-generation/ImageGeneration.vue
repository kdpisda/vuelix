<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useMotionTemplate, useReducedMotion, useSpring, useTransform } from 'motion-v'
import { computed, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Generation progress from 0 to 1. */
  progress?: number
  /** The finished image. It preloads hidden and fades in once `progress` reaches 1. */
  src?: string
  alt?: string
  /** Optional intermediate preview that sharpens from a blur as progress grows. */
  preview?: string
  /** Puts the tile in its error state; a string is shown as the message. */
  error?: boolean | string
  /** Caption shown while generating. */
  label?: string
  /** CSS aspect-ratio of the tile. */
  aspectRatio?: string
  /** Hide the status caption. */
  hideCaption?: boolean
  class?: HTMLAttributes['class']
}>(), {
  progress: 0,
  alt: '',
  label: 'Generating',
  aspectRatio: '1 / 1',
  hideCaption: false,
})

const emit = defineEmits<{
  retry: []
  /** The final image finished loading. */
  load: []
}>()

const reduced = useReducedMotion()
const noiseId = `vx-imggen-noise-${useId()}`

const clamp = (v: number) => Math.min(1, Math.max(0, v || 0))
const percent = computed(() => Math.round(clamp(props.progress) * 100))
const failed = computed(() => !!props.error)
const errorMessage = computed(() => (typeof props.error === 'string' ? props.error : 'Generation failed'))

// A soft spring between progress updates keeps the reveal fluid even when the backend
// reports progress in coarse jumps.
const p = useSpring(clamp(props.progress), { stiffness: 70, damping: 20 })
watch(() => props.progress, (v) => {
  // Moving backwards means a new run: restart from there instead of animating back.
  if (clamp(v) < p.get())
    p.jump(clamp(v))
  else
    p.set(clamp(v))
})

const latentBlur = useTransform(p, [0, 1], [34, 12])
const latentFilter = useMotionTemplate`blur(${latentBlur}px) saturate(1.25)`
const sharpBlur = useTransform(p, [0, 1], [14, 0])
const sharpLatentFilter = useMotionTemplate`blur(${useTransform(sharpBlur, v => v + 6)}px) saturate(1.4)`
const previewBlur = useTransform(p, [0, 1], [26, 6])
const previewFilter = useMotionTemplate`blur(${previewBlur}px)`
const sharpPreviewFilter = useMotionTemplate`blur(${sharpBlur}px)`
const previewOpacity = useTransform(p, [0, 0.2, 0.85], [0, 0.6, 1])
const noiseOpacity = useTransform(p, [0, 1], [0.5, 0.08])
// Everything above the scan line is "resolved" (less blur); the line walks down with progress.
const revealClip = useMotionTemplate`inset(0 0 ${useTransform(p, v => (1 - v) * 100)}% 0)`
const scanTop = useMotionTemplate`${useTransform(p, v => v * 100)}%`
const scanOpacity = useTransform(p, [0, 0.03, 0.96, 1], [0, 1, 1, 0])

// --- final image ------------------------------------------------------------
const img = ref<HTMLImageElement>()
const loaded = ref(false)
watch(() => props.src, () => (loaded.value = false))
onMounted(() => {
  // A cached image can finish loading before hydration attaches @load.
  if (img.value?.complete && img.value.naturalWidth)
    loaded.value = true
})
function onLoad() {
  loaded.value = true
  emit('load')
}
const done = computed(() => !failed.value && clamp(props.progress) >= 1 && !!props.src && loaded.value)
const generating = computed(() => !done.value && !failed.value)

const blobs = [
  { class: 'left-[-5%] top-[-10%] size-[70%] bg-chart-1', x: ['0%', '18%', '-6%', '0%'], y: ['0%', '14%', '24%', '0%'], duration: 11 },
  { class: 'right-[-10%] top-[5%] size-[60%] bg-chart-2', x: ['0%', '-20%', '-8%', '0%'], y: ['0%', '22%', '-6%', '0%'], duration: 13 },
  { class: 'bottom-[-15%] left-[5%] size-[70%] bg-chart-3', x: ['0%', '16%', '28%', '0%'], y: ['0%', '-18%', '-4%', '0%'], duration: 12 },
  { class: 'bottom-[-5%] right-[-5%] size-[50%] bg-chart-4', x: ['0%', '-24%', '-10%', '0%'], y: ['0%', '-10%', '-26%', '0%'], duration: 10 },
]
const drift = (b: typeof blobs[number]) =>
  reduced.value || failed.value ? { x: '0%', y: '0%' } : { x: b.x, y: b.y }
const driftTransition = (b: typeof blobs[number]) =>
  reduced.value || failed.value ? { duration: 0.6 } : { duration: b.duration, repeat: Infinity, ease: 'easeInOut' as const }
</script>

<template>
  <div
    :class="cn('relative isolate w-full overflow-hidden rounded-2xl border bg-muted', props.class)"
    :style="{ aspectRatio: props.aspectRatio }"
    :role="generating ? 'progressbar' : undefined"
    :aria-label="generating ? props.label : undefined"
    :aria-valuemin="generating ? 0 : undefined"
    :aria-valuemax="generating ? 100 : undefined"
    :aria-valuenow="generating ? percent : undefined"
  >
    <!-- Latent canvas: drifting colour fields, blurred, sharpening as progress grows -->
    <div :class="cn('absolute inset-0 overflow-hidden rounded-[inherit] transition-[filter] duration-500', failed && 'grayscale')" aria-hidden="true">
      <motion.div class="absolute inset-[-20%]" :style="{ filter: latentFilter }">
        <motion.div
          v-for="(b, i) in blobs"
          :key="i"
          :class="cn('absolute rounded-full opacity-90', b.class)"
          :animate="drift(b)"
          :transition="driftTransition(b)"
        />
      </motion.div>
      <motion.img
        v-if="props.preview"
        :src="props.preview"
        alt=""
        class="absolute inset-0 size-full scale-110 object-cover"
        :style="{ opacity: previewOpacity, filter: previewFilter }"
      />

      <!-- Resolved band above the scan line -->
      <motion.div class="absolute inset-0 overflow-hidden" :style="{ clipPath: revealClip }">
        <motion.div v-if="!props.preview" class="absolute inset-[-20%]" :style="{ filter: sharpLatentFilter }">
          <motion.div
            v-for="(b, i) in blobs"
            :key="i"
            :class="cn('absolute rounded-full', b.class)"
            :animate="drift(b)"
            :transition="driftTransition(b)"
          />
        </motion.div>
        <motion.img
          v-else
          :src="props.preview"
          alt=""
          class="absolute inset-0 size-full object-cover"
          :style="{ opacity: previewOpacity, filter: sharpPreviewFilter }"
        />
      </motion.div>

      <!-- Film grain -->
      <motion.div class="absolute inset-0 mix-blend-overlay" :style="{ opacity: noiseOpacity }">
        <svg class="size-full">
          <filter :id="noiseId">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" :filter="`url(#${noiseId})`" />
        </svg>
      </motion.div>

      <!-- Scan line -->
      <motion.div
        v-if="!failed"
        class="absolute inset-x-0 h-14 -translate-y-full"
        :style="{ top: scanTop, opacity: scanOpacity }"
      >
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-brand/25" />
        <div class="absolute inset-x-0 bottom-0 h-px bg-brand shadow-[0_0_10px_1px_var(--color-brand)]" />
      </motion.div>
    </div>

    <!-- Final image -->
    <motion.div
      v-if="props.src"
      class="absolute inset-0 overflow-hidden rounded-[inherit]"
      :initial="false"
      :animate="done
        ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
        : { opacity: 0, scale: reduced ? 1 : 1.04, filter: reduced ? 'blur(0px)' : 'blur(12px)' }"
      :transition="{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }"
    >
      <img
        ref="img"
        :src="props.src"
        :alt="props.alt"
        :aria-hidden="!done"
        class="size-full object-cover"
        @load="onLoad"
      >
    </motion.div>

    <!-- Status caption -->
    <AnimatePresence>
      <motion.div
        v-if="!props.hideCaption && !done && !failed"
        key="caption"
        aria-hidden="true"
        class="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border bg-background/80 py-1 pl-2 pr-2.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md"
        :initial="{ opacity: 0, y: 6 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: 6, filter: 'blur(4px)' }"
        :transition="{ type: 'spring', stiffness: 400, damping: 30 }"
      >
        <svg class="size-3.5 animate-spin text-brand" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        {{ props.label }}
        <span class="tabular-nums text-muted-foreground">{{ percent }}%</span>
      </motion.div>
    </AnimatePresence>

    <!-- Error -->
    <AnimatePresence>
      <motion.div
        v-if="failed"
        key="error"
        role="alert"
        class="absolute inset-0 flex flex-col rounded-[inherit] items-center justify-center gap-3 bg-background/70 p-6 text-center backdrop-blur-sm"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
      >
        <motion.div
          class="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive"
          :initial="{ scale: 0.6 }"
          :animate="{ scale: 1 }"
          :transition="{ type: 'spring', stiffness: 500, damping: 18 }"
        >
          <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 8v5M12 16.5v.01" />
            <path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </motion.div>
        <p class="m-0 text-sm font-medium text-foreground">
          {{ errorMessage }}
        </p>
        <button
          type="button"
          class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="emit('retry')"
        >
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Try again
        </button>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
