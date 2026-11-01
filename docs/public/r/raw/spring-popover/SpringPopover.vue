<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useDomRef, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch, watchEffect } from 'vue'
import { cn } from '@/lib/utils'

export type SpringPopoverSide = 'top' | 'bottom' | 'left' | 'right'
export type SpringPopoverAlign = 'start' | 'center' | 'end'

const props = withDefaults(defineProps<{
  /** Preferred side of the trigger. Flips when there isn't room. */
  side?: SpringPopoverSide
  /** Alignment along the trigger edge. */
  align?: SpringPopoverAlign
  /** Gap between trigger and panel in px. */
  offset?: number
  /** Render the little arrow pointing at the trigger. */
  arrow?: boolean
  /** Accessible name for the popover panel. */
  label?: string
  /** Classes for the inline wrapper around the trigger. */
  class?: HTMLAttributes['class']
  /** Classes for the floating panel. */
  contentClass?: HTMLAttributes['class']
}>(), {
  side: 'bottom',
  align: 'center',
  offset: 10,
  arrow: true,
})

const open = defineModel<boolean>('open', { default: false })

const panelId = `vx-popover-${useId()}`
const anchor = ref<HTMLElement | null>(null)
const panel = useDomRef()
const reduced = useReducedMotion()

const spring = { type: 'spring', stiffness: 520, damping: 30, mass: 0.8 } as const
const VIEWPORT_PADDING = 8
const ARROW_INSET = 14
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const OPPOSITE: Record<SpringPopoverSide, SpringPopoverSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

const pos = ref({ x: 0, y: 0, side: props.side as SpringPopoverSide, arrow: 0, width: 0, height: 0 })

function triggerEl() {
  return (anchor.value?.querySelector<HTMLElement>(FOCUSABLE) ?? anchor.value) || null
}

/** Measure trigger + panel and place the panel on screen. */
function place() {
  const el = panel.value as HTMLElement | null
  if (!anchor.value || !el)
    return
  const a = anchor.value.getBoundingClientRect()
  // offsetWidth ignores the scale transform of the opening spring.
  const w = el.offsetWidth
  const h = el.offsetHeight
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const gap = props.offset

  const space = { top: a.top, bottom: vh - a.bottom, left: a.left, right: vw - a.right }
  let side = props.side
  const needed = (side === 'top' || side === 'bottom' ? h : w) + gap + VIEWPORT_PADDING
  if (space[side] < needed && space[OPPOSITE[side]] > space[side])
    side = OPPOSITE[side]

  const vertical = side === 'top' || side === 'bottom'
  let x: number
  let y: number
  if (vertical) {
    y = side === 'bottom' ? a.bottom + gap : a.top - gap - h
    x = props.align === 'start' ? a.left : props.align === 'end' ? a.right - w : a.left + a.width / 2 - w / 2
  }
  else {
    x = side === 'right' ? a.right + gap : a.left - gap - w
    y = props.align === 'start' ? a.top : props.align === 'end' ? a.bottom - h : a.top + a.height / 2 - h / 2
  }
  x = Math.min(Math.max(x, VIEWPORT_PADDING), vw - w - VIEWPORT_PADDING)
  y = Math.min(Math.max(y, VIEWPORT_PADDING), vh - h - VIEWPORT_PADDING)

  // Where the arrow sits along the panel edge: aimed at the trigger's centre.
  const arrow = vertical
    ? Math.min(Math.max(a.left + a.width / 2 - x, ARROW_INSET), w - ARROW_INSET)
    : Math.min(Math.max(a.top + a.height / 2 - y, ARROW_INSET), h - ARROW_INSET)

  pos.value = { x, y, side, arrow, width: w, height: h }
}

// The spring grows out of the point the arrow touches.
const origin = computed(() => {
  const { side, arrow } = pos.value
  return {
    top: `${arrow}px 100%`,
    bottom: `${arrow}px 0%`,
    left: `100% ${arrow}px`,
    right: `0% ${arrow}px`,
  }[side]
})

const arrowClass = computed(() => ({
  top: 'bottom-0 translate-y-1/2 border-b border-r',
  bottom: 'top-0 -translate-y-1/2 border-l border-t',
  left: 'right-0 translate-x-1/2 border-r border-t',
  right: 'left-0 -translate-x-1/2 border-b border-l',
}[pos.value.side]))

const arrowStyle = computed(() => {
  const vertical = pos.value.side === 'top' || pos.value.side === 'bottom'
  return vertical ? { left: `${pos.value.arrow - 6}px` } : { top: `${pos.value.arrow - 6}px` }
})

// Small nudge away from the trigger, so the panel "lands" on its side.
const nudge = computed(() => ({
  top: { y: 6 },
  bottom: { y: -6 },
  left: { x: 6 },
  right: { x: -6 },
}[pos.value.side]))

function close(returnFocus = true) {
  open.value = false
  if (returnFocus)
    nextTick(() => triggerEl()?.focus({ preventScroll: true }))
}

function toggle() {
  open.value = !open.value
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    close()
  }
}

function onDocumentPointerdown(e: PointerEvent) {
  const target = e.target as Node
  const el = panel.value as HTMLElement | null
  if (el?.contains(target) || anchor.value?.contains(target))
    return
  close(false)
}

// Keep Tab inside the panel while it's open.
function onPanelKeydown(e: KeyboardEvent) {
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

let frame = 0
function schedulePlace() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(place)
}

function bind(on: boolean) {
  if (on) {
    document.addEventListener('keydown', onDocumentKeydown)
    document.addEventListener('pointerdown', onDocumentPointerdown, true)
    window.addEventListener('resize', schedulePlace)
    window.addEventListener('scroll', schedulePlace, true)
  }
  else {
    document.removeEventListener('keydown', onDocumentKeydown)
    document.removeEventListener('pointerdown', onDocumentPointerdown, true)
    window.removeEventListener('resize', schedulePlace)
    window.removeEventListener('scroll', schedulePlace, true)
  }
}

watch(open, async (isOpen) => {
  if (typeof document === 'undefined')
    return
  bind(isOpen)
  if (!isOpen)
    return
  await nextTick()
  place()
  const el = panel.value as HTMLElement | null
  ;(el?.querySelector<HTMLElement>(FOCUSABLE) ?? el)?.focus({ preventScroll: true })
}, { flush: 'post' })

// Wire ARIA onto whatever focusable element the trigger slot renders.
watchEffect(() => {
  const el = triggerEl()
  if (!el)
    return
  el.setAttribute('aria-haspopup', 'dialog')
  el.setAttribute('aria-expanded', String(open.value))
  if (open.value)
    el.setAttribute('aria-controls', panelId)
  else
    el.removeAttribute('aria-controls')
}, { flush: 'post' })

onBeforeUnmount(() => {
  if (typeof document === 'undefined')
    return
  cancelAnimationFrame(frame)
  bind(false)
})
</script>

<template>
  <span ref="anchor" :class="cn('inline-flex', props.class)" @click="toggle">
    <slot name="trigger" :open="open" />
  </span>

  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="open"
        :id="panelId"
        ref="panel"
        key="popover"
        role="dialog"
        :aria-label="props.label"
        tabindex="-1"
        :class="cn(
          'fixed z-[95] w-72 rounded-xl border bg-popover p-4 text-sm text-popover-foreground shadow-xl outline-none',
          props.contentClass,
        )"
        :style="{ left: `${pos.x}px`, top: `${pos.y}px`, transformOrigin: origin }"
        :initial="reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, ...nudge }"
        :animate="{ opacity: 1, scale: 1, x: 0, y: 0 }"
        :exit="reduced
          ? { opacity: 0, transition: { duration: 0.1 } }
          : { opacity: 0, scale: 0.85, transition: { duration: 0.14 } }"
        :transition="spring"
        @keydown="onPanelKeydown"
      >
        <span
          v-if="props.arrow"
          aria-hidden="true"
          :class="cn('absolute size-3 rotate-45 bg-popover', arrowClass)"
          :style="arrowStyle"
        />
        <div class="relative">
          <slot :close="close" />
        </div>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>
