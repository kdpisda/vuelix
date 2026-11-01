<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Direction the content travels. `up` / `down` need a height on the marquee. */
  direction?: 'left' | 'right' | 'up' | 'down'
  /** Speed in pixels per second. */
  speed?: number
  /** Space between items and between the repeated copies (any CSS length). */
  gap?: string
  /** Ease to a stop while hovered or focused. */
  pauseOnHover?: boolean
  /** Stop the marquee (e.g. from your own pause button). */
  paused?: boolean
  /** Fade the leading and trailing edges with a mask. */
  fade?: boolean
  /** Accessible name for the scrolling region. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  direction: 'left',
  speed: 40,
  gap: '1rem',
  pauseOnHover: true,
  paused: false,
  fade: true,
})

const prefersReduced = useReducedMotion()
// Trust the media query only after mount, so server and hydrated markup always match.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
const reduced = computed(() => mounted.value && prefersReduced.value)
const vertical = computed(() => props.direction === 'up' || props.direction === 'down')
const sign = computed(() => (props.direction === 'left' || props.direction === 'up' ? 1 : -1))

const root = ref<HTMLElement>()
const firstCopy = ref<HTMLElement>()
const copyLength = ref(0)
const copies = ref(2)

// `offset` is the only thing that changes per frame — a motion value, so Vue never re-renders.
const offset = useMotionValue(0)
let travelled = 0
let factor = 1 // 0 … 1, eased so hover slows down instead of snapping to a halt
const hovering = ref(false)

function measure() {
  const el = firstCopy.value
  const box = root.value
  if (!el || !box)
    return
  copyLength.value = vertical.value ? el.offsetHeight : el.offsetWidth
  const viewport = vertical.value ? box.clientHeight : box.clientWidth
  // Enough copies to cover the viewport plus one for the wrap-around.
  copies.value = copyLength.value > 0 ? Math.max(2, Math.ceil(viewport / copyLength.value) + 1) : 2
}

let observer: ResizeObserver | undefined
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (root.value)
    observer.observe(root.value)
  if (firstCopy.value)
    observer.observe(firstCopy.value)
})
onBeforeUnmount(() => observer?.disconnect())

useAnimationFrame((_, delta) => {
  const length = copyLength.value
  if (!length)
    return
  if (reduced.value) {
    // No auto-scroll for reduced motion — the track becomes a normal scrollable row instead.
    travelled = factor = 0
    offset.set(0)
    return
  }
  const stopped = props.paused || (props.pauseOnHover && hovering.value)
  const target = stopped ? 0 : 1
  factor += (target - factor) * Math.min(1, delta / 140)
  if (Math.abs(target - factor) < 0.01)
    factor = target
  if (factor === 0)
    return
  travelled += sign.value * props.speed * factor * Math.min(delta, 64) / 1000
  // Wrap inside one copy length so the duplicated track loops seamlessly.
  travelled = ((travelled % length) + length) % length
  offset.set(-travelled)
})

function onFocusOut(e: FocusEvent) {
  if (!root.value?.contains(e.relatedTarget as Node | null))
    hovering.value = false
}

const mask = computed(() => {
  if (!props.fade)
    return undefined
  const dir = vertical.value ? 'to bottom' : 'to right'
  const m = `linear-gradient(${dir}, transparent, #000 12%, #000 88%, transparent)`
  return { maskImage: m, WebkitMaskImage: m }
})
</script>

<template>
  <div
    ref="root"
    role="region"
    :aria-label="props.label"
    :aria-roledescription="'marquee'"
    :class="cn('flex overflow-hidden', vertical ? 'flex-col' : 'flex-row', reduced && (vertical ? 'overflow-y-auto' : 'overflow-x-auto'), props.class)"
    :style="mask"
    @pointerenter="hovering = true"
    @pointerleave="hovering = false"
    @focusin="hovering = true"
    @focusout="onFocusOut"
  >
    <motion.div
      :class="cn('flex shrink-0', vertical ? 'flex-col' : 'flex-row')"
      :style="vertical ? { y: offset } : { x: offset }"
    >
      <div
        v-for="i in (reduced ? 1 : copies)"
        :key="i"
        :ref="i === 1 ? (el: any) => (firstCopy = el ?? undefined) : undefined"
        :class="cn('flex shrink-0', vertical ? 'flex-col' : 'flex-row')"
        :style="vertical ? { gap: props.gap, paddingBottom: props.gap } : { gap: props.gap, paddingRight: props.gap }"
        :aria-hidden="i > 1 ? 'true' : undefined"
        :inert="i > 1 ? true : undefined"
      >
        <slot />
      </div>
    </motion.div>
  </div>
</template>
