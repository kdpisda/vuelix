<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'motion-v'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'

export type PullToRefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'done'

const props = withDefaults(defineProps<{
  /** Called on release past the threshold; the spinner shows until it settles. Also bindable as `@refresh`. */
  onRefresh?: () => unknown
  /** Pull distance (px, after resistance) that triggers a refresh. */
  threshold?: number
  /** Asymptotic maximum pull distance (px). */
  maxPull?: number
  disabled?: boolean
  /** Screen-reader messages. */
  labels?: { ready?: string, refreshing?: string, done?: string }
  class?: HTMLAttributes['class']
}>(), {
  threshold: 72,
  maxPull: 140,
})

const springBack = { type: 'spring', stiffness: 380, damping: 34 } as const
const HOLD = 0.8 // fraction of the threshold the content rests at while refreshing
const SIZE = 36 // indicator diameter

const reduced = useReducedMotion()
const state = ref<PullToRefreshState>('idle')
const scroller = ref<HTMLElement>()

const pull = useMotionValue(0)
const progress = useTransform(pull, p => Math.min(1, p / props.threshold))
const indicatorY = useTransform(pull, p => Math.max(-SIZE - 8, p / 2 - SIZE / 2))
const indicatorOpacity = useTransform(pull, [0, 28], [0, 1])
const arrowRotate = useTransform(progress, p => p * 180)

const announcement = computed(() => ({
  idle: '',
  pulling: '',
  ready: props.labels?.ready ?? 'Release to refresh',
  refreshing: props.labels?.refreshing ?? 'Refreshing…',
  done: props.labels?.done ?? 'Updated',
}[state.value]))

/** Rubber band: the further you pull, the less it moves. */
function resist(dy: number) {
  return props.maxPull * (1 - Math.exp(-dy / props.maxPull))
}

function settle(to: number) {
  return reduced.value
    ? (pull.set(to), Promise.resolve())
    : animate(pull, to, springBack).then(() => {})
}

async function refresh() {
  if (state.value === 'refreshing')
    return
  state.value = 'refreshing'
  settle(props.threshold * HOLD)
  try {
    await props.onRefresh?.()
  }
  finally {
    state.value = 'done'
    await new Promise(r => setTimeout(r, 450))
    await settle(0)
    state.value = 'idle'
  }
}

// ── gesture (touch + mouse share the same logic) ────────────────────────────
let start: { y: number, pulling: boolean } | null = null

function begin(y: number) {
  if (props.disabled || state.value === 'refreshing' || state.value === 'done')
    return
  if ((scroller.value?.scrollTop ?? 0) > 0)
    return
  start = { y, pulling: false }
}

/** Returns true while the gesture is a pull (so the caller can block native scrolling). */
function move(y: number) {
  if (!start)
    return false
  const dy = y - start.y
  if (!start.pulling) {
    if (dy < -4 || (scroller.value?.scrollTop ?? 0) > 0) {
      start = null // scrolling up into the content: not ours
      return false
    }
    if (dy < 6)
      return false
    start.pulling = true
    start.y += 6 // don't jump by the slop distance
  }
  const p = resist(Math.max(0, y - start.y))
  pull.set(p)
  state.value = p >= props.threshold ? 'ready' : 'pulling'
  return true
}

function end() {
  if (!start)
    return
  const wasPulling = start.pulling
  start = null
  if (!wasPulling)
    return
  if (state.value === 'ready')
    refresh()
  else {
    state.value = 'idle'
    settle(0)
  }
}

function onTouchStart(e: TouchEvent) {
  begin(e.touches[0]!.clientY)
}
function onTouchMove(e: TouchEvent) {
  if (move(e.touches[0]!.clientY) && e.cancelable)
    e.preventDefault()
}

function swallowClick(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
}
function onPointerDown(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || e.button !== 0)
    return
  begin(e.clientY)
}
function onPointerMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || !start)
    return
  const wasPulling = start.pulling
  if (move(e.clientY) && !wasPulling)
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onPointerUp(e: PointerEvent) {
  if (e.pointerType !== 'mouse')
    return
  const dragged = start?.pulling
  end()
  if (dragged) {
    // A drag isn't a click on whatever is under the pointer.
    window.addEventListener('click', swallowClick, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', swallowClick, { capture: true }), 0)
  }
}

defineExpose({ refresh, state })
</script>

<template>
  <div
    :class="cn('relative overflow-hidden', props.class)"
    :aria-busy="state === 'refreshing'"
  >
    <!-- Indicator: rides down with the pull, fills its ring, then spins -->
    <motion.div
      aria-hidden="true"
      class="pointer-events-none absolute left-1/2 top-0 z-10 flex -translate-x-1/2 items-center justify-center rounded-full border bg-background text-foreground shadow-md"
      :style="{ width: `${SIZE}px`, height: `${SIZE}px`, y: indicatorY, opacity: indicatorOpacity }"
      :animate="{ scale: state === 'ready' ? 1.12 : 1 }"
      :transition="{ type: 'spring', stiffness: 520, damping: 22 }"
    >
      <svg class="absolute inset-0 size-full -rotate-90" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="15" stroke-width="2.5" class="stroke-muted" />
      </svg>
      <motion.svg
        v-if="state === 'refreshing'"
        class="absolute inset-0 size-full"
        viewBox="0 0 36 36"
        fill="none"
        :animate="reduced ? { opacity: [1, 0.4, 1] } : { rotate: 360 }"
        :transition="reduced
          ? { duration: 1.2, repeat: Infinity }
          : { duration: 0.8, repeat: Infinity, ease: 'linear' }"
      >
        <circle cx="18" cy="18" r="15" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="24 100" class="stroke-brand" />
      </motion.svg>
      <svg v-else class="absolute inset-0 size-full -rotate-90" viewBox="0 0 36 36" fill="none">
        <motion.circle cx="18" cy="18" r="15" stroke-width="2.5" stroke-linecap="round" class="stroke-brand" :style="{ pathLength: progress }" />
      </svg>

      <AnimatePresence :initial="false" mode="wait">
        <motion.svg
          v-if="state === 'done'"
          key="done"
          class="relative size-4 text-brand"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
          :initial="{ scale: 0.4, opacity: 0 }"
          :animate="{ scale: 1, opacity: 1 }"
          :exit="{ scale: 0.4, opacity: 0 }"
          :transition="{ type: 'spring', stiffness: 600, damping: 26 }"
        >
          <path d="M20 6 9 17l-5-5" />
        </motion.svg>
        <motion.svg
          v-else-if="state !== 'refreshing'"
          key="arrow"
          class="relative size-4"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          :style="{ rotate: arrowRotate }"
          :exit="{ scale: 0.4, opacity: 0, transition: { duration: 0.1 } }"
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </motion.svg>
      </AnimatePresence>
    </motion.div>

    <motion.div class="h-full" :style="{ y: pull }">
      <div
        ref="scroller"
        class="h-full overflow-y-auto overscroll-y-contain"
        :class="state === 'pulling' || state === 'ready' ? 'cursor-grabbing select-none' : ''"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="end"
        @touchcancel="end"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <slot :state="state" />
      </div>
    </motion.div>

    <span class="sr-only" role="status" aria-live="polite">{{ announcement }}</span>
  </div>
</template>
