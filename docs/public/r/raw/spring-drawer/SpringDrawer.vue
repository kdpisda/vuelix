<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { animate, AnimatePresence, motion, useDomRef, useMotionValue, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

export type SpringDrawerSide = 'left' | 'right' | 'top' | 'bottom'

const props = withDefaults(defineProps<{
  /** Edge the drawer slides in from. */
  side?: SpringDrawerSide
  /** Accessible name for the dialog. */
  label?: string
  /** Show the drag handle (drag it, or press it, to dismiss). */
  handle?: boolean
  /** Close when the overlay is clicked. */
  closeOnOverlay?: boolean
  /** Classes for the drawer surface (size it here, e.g. `w-96` or `max-h-[70vh]`). */
  class?: HTMLAttributes['class']
  /** Classes for the overlay. */
  overlayClass?: HTMLAttributes['class']
}>(), {
  side: 'right',
  handle: true,
  closeOnOverlay: true,
})

const open = defineModel<boolean>('open', { default: false })

const panel = useDomRef()
const content = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

const spring = { type: 'spring', stiffness: 340, damping: 32, mass: 0.9 } as const
const snapBack = { type: 'spring', stiffness: 500, damping: 36 } as const
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const horizontal = computed(() => props.side === 'left' || props.side === 'right')
// +1 when dismissing means moving towards +x / +y.
const dismissSign = computed(() => (props.side === 'right' || props.side === 'bottom' ? 1 : -1))

const offscreen = computed(() => {
  const value = `${dismissSign.value * 100}%`
  return horizontal.value ? { x: value } : { y: value }
})

const shell = computed(() => ({
  right: 'inset-y-0 right-0',
  left: 'inset-y-0 left-0',
  bottom: 'inset-x-0 bottom-0 flex-col',
  top: 'inset-x-0 top-0 flex-col',
}[props.side]))

// The `after:` strip extends the surface past the screen edge so the spring's
// overshoot never reveals a gap.
const surface = computed(() => ({
  right: 'h-full w-[min(24rem,calc(100vw-2.5rem))] rounded-l-2xl border-l after:left-full after:inset-y-0 after:w-12',
  left: 'h-full w-[min(24rem,calc(100vw-2.5rem))] rounded-r-2xl border-r after:right-full after:inset-y-0 after:w-12',
  bottom: 'max-h-[85vh] w-full rounded-t-2xl border-t after:top-full after:inset-x-0 after:h-12',
  top: 'max-h-[85vh] w-full rounded-b-2xl border-b after:bottom-full after:inset-x-0 after:h-12',
}[props.side]))

const handleClass = computed(() => ({
  right: 'left-0 top-1/2 h-20 w-5 -translate-y-1/2 cursor-ew-resize',
  left: 'right-0 top-1/2 h-20 w-5 -translate-y-1/2 cursor-ew-resize',
  bottom: 'left-1/2 top-0 h-5 w-20 -translate-x-1/2 cursor-ns-resize',
  top: 'bottom-0 left-1/2 h-5 w-20 -translate-x-1/2 cursor-ns-resize',
}[props.side]))

const contentPadding = computed(() => (props.handle
  ? { right: 'pl-3', left: 'pr-3', bottom: 'pt-4', top: 'pb-4' }[props.side]
  : ''))

// --- drag to dismiss -------------------------------------------------------

const dragOffset = useMotionValue(0)
let dragging = false
let moved = false
let start = 0
let samples: { t: number, v: number }[] = []

function axis(e: PointerEvent) {
  return horizontal.value ? e.clientX : e.clientY
}

function onHandleDown(e: PointerEvent) {
  if (e.button !== 0)
    return
  dragging = true
  moved = false
  start = axis(e) - dragOffset.get()
  samples = [{ t: e.timeStamp, v: axis(e) }]
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onHandleMove(e: PointerEvent) {
  if (!dragging)
    return
  const raw = axis(e) - start
  if (Math.abs(raw) > 3)
    moved = true
  // Towards the edge it follows the finger 1:1, the other way it resists.
  const toward = raw * dismissSign.value
  const eased = toward >= 0 ? toward : -Math.min(28, Math.sqrt(-toward) * 3)
  dragOffset.set(eased * dismissSign.value)
  samples.push({ t: e.timeStamp, v: axis(e) })
  if (samples.length > 6)
    samples.shift()
}

function onHandleUp(e: PointerEvent) {
  if (!dragging)
    return
  dragging = false
  if (!moved) {
    dragOffset.set(0)
    return // a plain press is handled by @click
  }
  const first = samples[0]!
  const last = samples.at(-1)!
  const velocity = ((last.v - first.v) / Math.max(1, last.t - first.t)) * 1000 * dismissSign.value
  const distance = dragOffset.get() * dismissSign.value
  const el = panel.value as HTMLElement | null
  const size = (horizontal.value ? el?.offsetWidth : el?.offsetHeight) ?? 300
  if (distance > size * 0.35 || velocity > 600)
    close()
  else
    animate(dragOffset, 0, snapBack)
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
}

function onHandleClick() {
  if (!moved)
    close()
}

// --- open / close, focus, scroll lock ---------------------------------------

let restoreFocus: HTMLElement | null = null

function close() {
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    close()
    return
  }
  if (e.key !== 'Tab')
    return
  const el = panel.value as HTMLElement | null
  const items = el ? [...el.querySelectorAll<HTMLElement>(FOCUSABLE)] : []
  if (!items.length) {
    e.preventDefault()
    return
  }
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

watch(open, async (isOpen) => {
  if (typeof document === 'undefined')
    return
  lockScroll(isOpen)
  if (isOpen) {
    restoreFocus = document.activeElement as HTMLElement | null
    dragOffset.set(0)
    await nextTick()
    const target = content.value?.querySelector<HTMLElement>(FOCUSABLE) ?? (panel.value as HTMLElement | null)
    target?.focus({ preventScroll: true })
  }
  else {
    restoreFocus?.focus({ preventScroll: true })
    restoreFocus = null
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined' && open.value)
    lockScroll(false)
})
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="open"
        key="overlay"
        aria-hidden="true"
        :class="cn('fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]', props.overlayClass)"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.25 }"
        @click="props.closeOnOverlay && close()"
      />
    </AnimatePresence>
    <AnimatePresence>
      <motion.div
        v-if="open"
        ref="panel"
        key="drawer"
        role="dialog"
        aria-modal="true"
        :aria-label="props.label"
        tabindex="-1"
        :class="cn('fixed z-[91] flex outline-none', shell)"
        :initial="reduced ? { opacity: 0 } : offscreen"
        :animate="reduced ? { opacity: 1 } : { x: 0, y: 0 }"
        :exit="reduced ? { opacity: 0 } : offscreen"
        :transition="reduced ? { duration: 0.15 } : spring"
        @keydown="onKeydown"
      >
        <motion.div
          :class="cn(
            'relative flex flex-col bg-background text-foreground shadow-2xl after:absolute after:bg-background',
            surface,
            props.class,
          )"
          :style="horizontal ? { x: dragOffset } : { y: dragOffset }"
        >
          <div ref="content" :class="cn('flex min-h-0 flex-1 flex-col overflow-y-auto', contentPadding)">
            <slot :close="close" />
          </div>
          <button
            v-if="props.handle"
            type="button"
            aria-label="Close drawer"
            :class="cn(
              'group absolute z-10 flex touch-none items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              handleClass,
            )"
            @pointerdown="onHandleDown"
            @pointermove="onHandleMove"
            @pointerup="onHandleUp"
            @pointercancel="onHandleUp"
            @click="onHandleClick"
          >
            <span
              :class="cn(
                'rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-muted-foreground/60',
                horizontal ? 'h-10 w-1.5' : 'h-1.5 w-10',
              )"
            />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>
