<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { animate, motion, useDomRef, useMotionValue, useReducedMotion, useTransform } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Snap heights as fractions of the viewport height, low to high. */
  snapPoints?: number[]
  /** Accessible name for the sheet. */
  label?: string
  /** Allow closing by dragging below the lowest snap point. */
  dismissible?: boolean
  /**
   * Element scaled down behind the sheet (CSS selector or element), like a
   * native iOS sheet. `null` disables the effect.
   */
  background?: string | HTMLElement | null
  /** Classes for the sheet surface. */
  class?: HTMLAttributes['class']
  /** Classes for the overlay. */
  overlayClass?: HTMLAttributes['class']
}>(), {
  snapPoints: () => [0.25, 0.6, 0.9],
  dismissible: true,
  background: '#app',
})

const open = defineModel<boolean>('open', { default: false })
/** Index into `snapPoints`. */
const snap = defineModel<number>('snap', { default: 1 })

const titleId = `vx-sheet-${useId()}`
const sheet = useDomRef()
const body = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

const spring = { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 } as const
const closeSpring = { type: 'spring', stiffness: 420, damping: 42 } as const
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const mounted = ref(false)
const viewport = ref(800)
const points = computed(() => [...props.snapPoints].sort((a, b) => a - b))
const top = computed(() => points.value.at(-1) ?? 0.9)
const sheetHeight = computed(() => top.value * viewport.value)
const closedY = computed(() => sheetHeight.value + 24)
const snapIndex = computed(() => Math.min(Math.max(snap.value, 0), points.value.length - 1))

/** translateY of the sheet when resting at snap `i`. */
function yFor(i: number) {
  return (top.value - points.value[i]!) * viewport.value
}

const y = useMotionValue(10_000)

// 0 when closed → 1 once the sheet reaches its lowest snap point.
const progress = useTransform(y, (v) => {
  const low = yFor(0)
  return Math.min(Math.max((closedY.value - v) / Math.max(1, closedY.value - low), 0), 1)
})

// Spacer so the bottom of the content stays reachable at lower snap points.
const hidden = ref(0)

let controls: ReturnType<typeof animate> | undefined
let target = Number.NaN
function moveTo(to: number, velocity = 0) {
  controls?.stop()
  target = to
  controls = animate(y, to, reduced.value
    ? { duration: 0.2, ease: 'easeOut' }
    : { ...(to === closedY.value ? closeSpring : spring), velocity })
  return controls
}

// --- background scale --------------------------------------------------------

let backdropEl: HTMLElement | null = null
let saved = { transform: '', transformOrigin: '', borderRadius: '', transition: '' }

function attachBackground() {
  const target = props.background
  backdropEl = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!backdropEl || reduced.value) {
    backdropEl = null
    return
  }
  const { style } = backdropEl
  saved = { transform: style.transform, transformOrigin: style.transformOrigin, borderRadius: style.borderRadius, transition: style.transition }
  // Scale around the middle of what's on screen, not the middle of the page.
  const r = backdropEl.getBoundingClientRect()
  style.transformOrigin = `${window.innerWidth / 2 - r.left}px ${window.innerHeight / 2 - r.top}px`
  style.transition = 'none'
}

function detachBackground() {
  if (!backdropEl)
    return
  Object.assign(backdropEl.style, saved)
  backdropEl = null
}

const stopProgress = progress.on('change', (p) => {
  if (!backdropEl)
    return
  backdropEl.style.transform = p > 0.001 ? `scale(${1 - 0.05 * p})` : saved.transform
  backdropEl.style.borderRadius = p > 0.001 ? `${14 * p}px` : saved.borderRadius
})

// --- open / close -------------------------------------------------------------

let restoreFocus: HTMLElement | null = null
let closing: Promise<unknown> | undefined

function close() {
  open.value = false
}

function lockScroll(lock: boolean) {
  const root = document.documentElement
  if (lock) {
    const gap = window.innerWidth - root.clientWidth
    root.style.overflow = 'hidden'
    if (gap > 0)
      root.style.paddingRight = `${gap}px`
  }
  else {
    root.style.overflow = ''
    root.style.paddingRight = ''
  }
}

function measure() {
  viewport.value = window.innerHeight
}

function onResize() {
  measure()
  if (open.value) {
    controls?.stop()
    y.set(yFor(snapIndex.value))
    hidden.value = yFor(snapIndex.value)
  }
}

watch(open, async (isOpen) => {
  if (typeof document === 'undefined')
    return
  if (isOpen) {
    restoreFocus = document.activeElement as HTMLElement | null
    measure()
    if (!mounted.value) {
      y.set(closedY.value)
      mounted.value = true
      lockScroll(true)
      attachBackground()
      window.addEventListener('resize', onResize)
    }
    hidden.value = yFor(snapIndex.value)
    moveTo(yFor(snapIndex.value))
    await nextTick()
    const target = body.value?.querySelector<HTMLElement>(FOCUSABLE) ?? (sheet.value as HTMLElement | null)
    target?.focus({ preventScroll: true })
  }
  else if (mounted.value) {
    const run = moveTo(closedY.value)
    closing = run.finished
    await run.finished
    if (closing !== run.finished || open.value)
      return // re-opened mid-way
    mounted.value = false
    window.removeEventListener('resize', onResize)
    lockScroll(false)
    detachBackground()
    restoreFocus?.focus({ preventScroll: true })
    restoreFocus = null
  }
}, { immediate: true })

watch(snapIndex, (i) => {
  if (!open.value || dragging || target === yFor(i))
    return
  hidden.value = yFor(i)
  moveTo(yFor(i))
})

// --- dragging -----------------------------------------------------------------

let dragging = false
let moved = false
let grab = 0
let samples: { t: number, y: number }[] = []

function onDown(e: PointerEvent) {
  if (e.button !== 0)
    return
  controls?.stop()
  dragging = true
  moved = false
  grab = e.clientY - y.get()
  samples = [{ t: e.timeStamp, y: e.clientY }]
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onMove(e: PointerEvent) {
  if (!dragging)
    return
  let next = e.clientY - grab
  if (Math.abs(e.clientY - samples[0]!.y) > 4)
    moved = true
  // Rubber-band above the highest snap point.
  if (next < 0)
    next = -Math.sqrt(-next) * 4
  y.set(next)
  samples.push({ t: e.timeStamp, y: e.clientY })
  if (samples.length > 6)
    samples.shift()
}

function onUp(e: PointerEvent) {
  if (!dragging)
    return
  dragging = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  if (!moved) {
    moveTo(yFor(snapIndex.value))
    return
  }
  const first = samples[0]!
  const last = samples.at(-1)!
  const velocity = ((last.y - first.y) / Math.max(1, last.t - first.t)) * 1000
  // Project where a flick would carry the sheet, then pick the closest rest.
  const projected = y.get() + velocity * 0.18
  const targets = points.value.map((_, i) => ({ i, y: yFor(i) }))
  if (props.dismissible)
    targets.push({ i: -1, y: closedY.value })
  const best = targets.reduce((a, b) => (Math.abs(b.y - projected) < Math.abs(a.y - projected) ? b : a))
  if (best.i === -1) {
    close()
    return
  }
  hidden.value = yFor(best.i)
  moveTo(yFor(best.i), velocity)
  snap.value = best.i
}

// Press the handle to step through snap points; arrows move up / down.
function onHandleClick() {
  if (moved)
    return
  snap.value = (snapIndex.value + 1) % points.value.length
}

function onHandleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    const dir = e.key === 'ArrowUp' ? 1 : -1
    snap.value = Math.min(Math.max(snapIndex.value + dir, 0), points.value.length - 1)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    close()
    return
  }
  if (e.key !== 'Tab')
    return
  const el = sheet.value as HTMLElement | null
  const items = el ? [...el.querySelectorAll<HTMLElement>(FOCUSABLE)] : []
  if (!items.length)
    return e.preventDefault()
  const first = items[0]!
  const last = items.at(-1)!
  if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) {
    e.preventDefault()
    last.focus()
  }
  else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

onBeforeUnmount(() => {
  stopProgress()
  controls?.stop()
  if (typeof document === 'undefined' || !mounted.value)
    return
  window.removeEventListener('resize', onResize)
  lockScroll(false)
  detachBackground()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="mounted" class="fixed inset-0 z-[90]">
      <motion.div
        aria-hidden="true"
        :class="cn('absolute inset-0 bg-black/40', props.overlayClass)"
        :style="{ opacity: progress }"
        @click="close"
      />
      <motion.div
        ref="sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="props.label"
        :aria-labelledby="!props.label && $slots.header ? titleId : undefined"
        tabindex="-1"
        :class="cn(
          'absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-xl flex-col rounded-t-[1.75rem] border border-b-0 bg-background text-foreground shadow-2xl outline-none',
          'after:absolute after:inset-x-0 after:top-full after:h-24 after:bg-background',
          props.class,
        )"
        :style="{ height: `${sheetHeight}px`, y }"
        @keydown="onKeydown"
      >
        <div
          class="shrink-0 cursor-grab touch-none select-none pb-2 pt-3 active:cursor-grabbing"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
        >
          <button
            type="button"
            class="mx-auto flex h-5 w-16 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :aria-label="`Resize sheet (${Math.round((points[snapIndex] ?? 0) * 100)}% open)`"
            @click="onHandleClick"
            @keydown="onHandleKeydown"
          >
            <span class="h-1.5 w-10 rounded-full bg-muted-foreground/35" />
          </button>
          <div v-if="$slots.header" :id="titleId" class="px-5 pt-1">
            <slot name="header" :close="close" />
          </div>
        </div>
        <div ref="body" class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          <slot :close="close" :snap="snapIndex" />
          <div aria-hidden="true" :style="{ height: `${hidden}px` }" />
        </div>
      </motion.div>
    </div>
  </Teleport>
</template>
