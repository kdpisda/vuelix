<script setup lang="ts" generic="T">
import type { AnimationPlaybackControls } from 'motion-v'
import type { HTMLAttributes } from 'vue'
import { animate, motion, useAnimationFrame, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion-v'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import OrbitCarouselCard from './OrbitCarouselCard.vue'

const props = withDefaults(defineProps<{
  items: T[]
  /** Card width in px. */
  cardWidth?: number
  /** Card height in px. */
  cardHeight?: number
  /** Space between neighbouring cards along the ring, in px. */
  gap?: number
  /** CSS perspective of the stage, in px. Smaller = more dramatic. */
  perspective?: number
  /** Tilt of the ring in degrees; positive looks down onto it. */
  tilt?: number
  /** Slowly spin on its own (pauses on hover / focus, off with reduced motion). */
  autoRotate?: boolean
  /** Auto-rotate speed in degrees per second. */
  autoRotateSpeed?: number
  /** Accessible name for the carousel. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  cardWidth: 200,
  cardHeight: 260,
  gap: 28,
  perspective: 1200,
  tilt: 6,
  autoRotate: false,
  autoRotateSpeed: 12,
  label: 'Carousel',
})

defineSlots<{
  item?: (props: { item: T, index: number, active: boolean }) => any
}>()

const index = defineModel<number>({ default: 0 })

const snapSpring = { type: 'spring', stiffness: 170, damping: 26 } as const

const reduced = useReducedMotion()
const count = computed(() => props.items.length)
const step = computed(() => 360 / Math.max(1, count.value))
const radius = computed(() => {
  if (count.value < 2)
    return 0
  return Math.round((props.cardWidth + props.gap) / (2 * Math.tan(Math.PI / count.value)))
})
/** Degrees of rotation per px of drag, so the front card tracks the pointer. */
const degPerPx = computed(() => (radius.value ? 180 / (Math.PI * radius.value) : 0.5))

const wrap = (i: number) => ((i % count.value) + count.value) % count.value

// Unbounded rotation in degrees; card i faces the viewer at rotation = i * step.
const rotation = useMotionValue(index.value * step.value)
const ringRotate = useTransform(rotation, r => -r)
const nearestTurn = (r: number) => Math.round(r / step.value)

useMotionValueEvent(rotation, 'change', (r) => {
  const i = wrap(nearestTurn(r))
  if (i !== index.value)
    index.value = i
})

let anim: AnimationPlaybackControls | undefined
/** Turn the ring is spinning to, so quick repeated presses add up. */
let heading: number | null = null

function settled() {
  anim = undefined
  heading = null
}

function spinTo(turn: number) {
  anim?.stop()
  heading = turn
  const target = turn * step.value
  anim = animate(rotation, target, reduced.value
    ? { duration: 0.2, ease: 'easeOut', onComplete: settled }
    : { ...snapSpring, onComplete: settled })
}

/** Rotate to an item the short way round. */
function goTo(i: number) {
  const current = heading ?? nearestTurn(rotation.get())
  const delta = ((((i - wrap(current)) % count.value) + count.value * 1.5) % count.value) - count.value / 2
  spinTo(current + Math.round(delta))
}
const next = () => spinTo((heading ?? nearestTurn(rotation.get())) + 1)
const prev = () => spinTo((heading ?? nearestTurn(rotation.get())) - 1)

watch(index, (i) => {
  if (wrap(nearestTurn(rotation.get())) !== i)
    goTo(i)
})

// ── auto-rotate ─────────────────────────────────────────────────────────────
const hovered = ref(false)
const focused = ref(false)
let drag: { x: number, rotation: number, moved: boolean, samples: { t: number, x: number }[] } | null = null

useAnimationFrame((_, delta) => {
  if (!props.autoRotate || reduced.value || hovered.value || focused.value || drag || anim)
    return
  rotation.set(rotation.get() + (props.autoRotateSpeed * Math.min(delta, 64)) / 1000)
})

function onEnter() {
  hovered.value = true
  // Settle the front card when the spin pauses.
  if (props.autoRotate && !drag)
    spinTo(nearestTurn(rotation.get()))
}

// ── drag with inertia ───────────────────────────────────────────────────────
function onPointerDown(e: PointerEvent) {
  if (e.button !== 0 || count.value < 2)
    return
  anim?.stop()
  settled()
  drag = { x: e.clientX, rotation: rotation.get(), moved: false, samples: [{ t: e.timeStamp, x: e.clientX }] }
}

function onPointerMove(e: PointerEvent) {
  if (!drag)
    return
  const dx = e.clientX - drag.x
  if (!drag.moved && Math.abs(dx) > 4) {
    drag.moved = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  if (!drag.moved)
    return
  rotation.set(drag.rotation - dx * degPerPx.value)
  drag.samples.push({ t: e.timeStamp, x: e.clientX })
  if (drag.samples.length > 6)
    drag.samples.shift()
}

function swallowClick(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
}

function onPointerUp(e: PointerEvent) {
  if (!drag)
    return
  const { moved, samples } = drag
  drag = null
  if (!moved) {
    // A tap on a side card brings it to the front (cards off-centre are inert,
    // so find it from the tap position on the ring).
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    if (Math.abs(dx) > props.cardWidth / 2 && radius.value) {
      const a = Math.asin(Math.max(-1, Math.min(1, dx / radius.value))) * (180 / Math.PI)
      spinTo(nearestTurn(rotation.get()) + Math.sign(a) * Math.max(1, Math.round(Math.abs(a) / step.value)))
    }
    return
  }
  window.addEventListener('click', swallowClick, { capture: true, once: true })
  setTimeout(() => window.removeEventListener('click', swallowClick, { capture: true }), 0)

  const recent = samples.filter(s => e.timeStamp - s.t < 100)
  const first = recent[0]
  const dt = first ? (e.timeStamp - first.t) / 1000 : 0 // paused before release → no fling
  const velocity = first && dt > 0 ? (-(e.clientX - first.x) / dt) * degPerPx.value : 0
  const s = step.value
  const POWER = 0.45
  const snap = (t: number) => Math.round(t / s) * s
  const target = snap(rotation.get() + POWER * velocity)
  // Inertia ignores the target keyframe, but motion skips "animations" whose
  // keyframes don't change — so pass the landing spot we computed.
  anim = animate(rotation, target, {
    type: 'inertia',
    velocity,
    power: POWER,
    timeConstant: 320,
    restDelta: 0.05,
    modifyTarget: snap,
    onComplete: settled,
  })
}

function onKeydown(e: KeyboardEvent) {
  const actions: Record<string, () => void> = {
    ArrowLeft: prev,
    ArrowRight: next,
    Home: () => goTo(0),
    End: () => goTo(count.value - 1),
  }
  const action = actions[e.key]
  if (!action)
    return
  e.preventDefault()
  action()
}

function onFocusOut(e: FocusEvent) {
  const root = e.currentTarget as HTMLElement
  if (!root.contains(e.relatedTarget as Node | null))
    focused.value = false
}

onBeforeUnmount(() => anim?.stop())
</script>

<template>
  <div
    role="region"
    aria-roledescription="carousel"
    :aria-label="props.label"
    :class="cn('flex w-full flex-col items-center gap-5', props.class)"
    @focusin="focused = true"
    @focusout="onFocusOut"
  >
    <div
      tabindex="0"
      :aria-label="`${props.label}: item ${index + 1} of ${count}. Use the arrow keys to rotate.`"
      class="relative w-full cursor-grab touch-pan-y select-none rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
      :style="{ height: `${props.cardHeight + 64}px`, perspective: `${props.perspective}px` }"
      @pointerenter="onEnter"
      @pointerleave="hovered = false"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeydown"
    >
      <motion.div
        class="absolute left-1/2 top-1/2 size-0 [transform-style:preserve-3d]"
        :style="{ z: -radius, rotateX: -props.tilt, rotateY: ringRotate }"
      >
        <OrbitCarouselCard
          v-for="(item, i) in props.items"
          :key="i"
          :rotation="rotation"
          :angle="i * step"
          :radius="radius"
          :width="props.cardWidth"
          :height="props.cardHeight"
          :active="i === index"
          :label="`${i + 1} of ${count}`"
        >
          <slot name="item" :item="item" :index="i" :active="i === index" />
        </OrbitCarouselCard>
      </motion.div>
    </div>

    <div class="flex items-center gap-3">
      <button
        type="button"
        aria-label="Previous"
        class="inline-flex size-9 items-center justify-center rounded-full border bg-background text-foreground shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="prev"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <div class="flex items-center gap-1.5">
        <button
          v-for="(_, i) in props.items"
          :key="i"
          type="button"
          :aria-label="`Go to item ${i + 1}`"
          :aria-current="i === index || undefined"
          :class="cn(
            'h-1.5 rounded-full outline-none transition-all duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50',
            i === index ? 'w-5 bg-foreground' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60',
          )"
          @click="goTo(i)"
        />
      </div>
      <button
        type="button"
        aria-label="Next"
        class="inline-flex size-9 items-center justify-center rounded-full border bg-background text-foreground shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="next"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>
  </div>
</template>
