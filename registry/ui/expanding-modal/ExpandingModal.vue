<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { animate, motion, useDomRef, useMotionValue, useReducedMotion } from 'motion-v'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Accessible name for the dialog. */
  label?: string
  /** Close when the overlay is clicked. */
  closeOnOverlay?: boolean
  /** Classes for the trigger button. */
  class?: HTMLAttributes['class']
  /** Classes for the dialog surface (size it here). */
  contentClass?: HTMLAttributes['class']
}>(), {
  closeOnOverlay: true,
})

const open = defineModel<boolean>('open', { default: false })

const trigger = ref<HTMLButtonElement | null>(null)
const surface = useDomRef()
const scroller = useDomRef()
const reduced = useReducedMotion()

const openSpring = { type: 'spring', stiffness: 230, damping: 25, mass: 0.9 } as const
const closeSpring = { type: 'spring', stiffness: 340, damping: 38, mass: 0.8 } as const
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const mounted = ref(false)
const fill = ref<Record<string, string>>({})

// One spring drives everything: 0 = sitting exactly on the trigger, 1 = centred dialog.
const progress = useMotionValue(0)
const x = useMotionValue(0)
const y = useMotionValue(0)
const clipPath = useMotionValue('none')
const fillOpacity = useMotionValue(1)
const contentOpacity = useMotionValue(0)
const overlayOpacity = useMotionValue(0)

let geo = { dx: 0, dy: 0, insetX: 0, insetY: 0, r0: 0, r1: 24 }

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const mix = (a: number, b: number, t: number) => a + (b - a) * t

function render(v: number) {
  const c = clamp01(v)
  // Translation may overshoot (that's the spring); the clip never does.
  x.set(geo.dx * (1 - v))
  y.set(geo.dy * (1 - v))
  clipPath.set(c >= 1
    ? 'none'
    : `inset(${geo.insetY * (1 - c)}px ${geo.insetX * (1 - c)}px round ${mix(geo.r0, geo.r1, c)}px)`)
  fillOpacity.set(1 - clamp01(v / 0.45))
  contentOpacity.set(clamp01((v - 0.4) / 0.45))
  overlayOpacity.set(c)
}
const stopRender = progress.on('change', render)

/** Measure the trigger and the (untransformed) dialog and derive the start shape. */
function measure() {
  const t = trigger.value?.getBoundingClientRect()
  const el = surface.value as HTMLElement | null
  if (!t || !el)
    return
  const d = el.getBoundingClientRect()
  const left = d.left - x.get()
  const top = d.top - y.get()
  const w = el.offsetWidth
  const h = el.offsetHeight
  const triggerStyle = getComputedStyle(trigger.value!)
  if (reduced.value) {
    geo = { dx: 0, dy: 0, insetX: 0, insetY: 0, r0: 0, r1: 0 }
  }
  else {
    geo = {
      dx: t.left + t.width / 2 - (left + w / 2),
      dy: t.top + t.height / 2 - (top + h / 2),
      insetX: Math.max(0, (w - t.width) / 2),
      insetY: Math.max(0, (h - t.height) / 2),
      r0: Math.min(Number.parseFloat(triggerStyle.borderTopLeftRadius) || 0, t.height / 2, t.width / 2),
      r1: Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
    }
  }
  // The dialog starts painted like the trigger, then fades to its own surface.
  fill.value = {
    backgroundColor: triggerStyle.backgroundColor,
    backgroundImage: triggerStyle.backgroundImage,
    color: triggerStyle.color,
    font: triggerStyle.font,
    gap: triggerStyle.gap,
  }
}

let controls: ReturnType<typeof animate> | undefined
function run(to: number) {
  controls?.stop()
  controls = animate(progress, to, reduced.value ? { duration: 0.18 } : to === 1 ? openSpring : closeSpring)
  return controls
}

// --- open / close -------------------------------------------------------------

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

watch(open, async (isOpen) => {
  if (typeof document === 'undefined')
    return
  if (isOpen) {
    if (!mounted.value) {
      lockScroll(true)
      progress.jump(0)
      mounted.value = true
      await nextTick()
      measure()
      render(0)
    }
    run(1)
    await nextTick()
    const target = (scroller.value as HTMLElement | null)?.querySelector<HTMLElement>(FOCUSABLE) ?? (surface.value as HTMLElement | null)
    target?.focus({ preventScroll: true })
  }
  else if (mounted.value) {
    measure() // the trigger may have moved (resize) — collapse into where it is now
    render(progress.get())
    const anim = run(0)
    await anim.finished
    if (open.value || controls !== anim)
      return // re-opened mid-way
    mounted.value = false
    lockScroll(false)
    await nextTick()
    trigger.value?.focus({ preventScroll: true })
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    close()
    return
  }
  if (e.key !== 'Tab')
    return
  const el = surface.value as HTMLElement | null
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
  stopRender()
  controls?.stop()
  if (typeof document !== 'undefined' && mounted.value)
    lockScroll(false)
})
</script>

<template>
  <button
    ref="trigger"
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :class="cn(
      'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground outline-none transition-[filter] hover:brightness-110 focus-visible:ring-[3px] focus-visible:ring-ring/50',
      props.class,
    )"
    :style="mounted && !reduced ? { visibility: 'hidden' } : undefined"
    @click="open = true"
  >
    <slot name="trigger" />
  </button>

  <Teleport to="body">
    <div v-if="mounted" class="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <motion.div
        aria-hidden="true"
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        :style="{ opacity: overlayOpacity }"
        @click="props.closeOnOverlay && close()"
      />
      <!-- drop-shadow (not box-shadow) so the shadow follows the clip-path -->
      <motion.div class="relative drop-shadow-2xl" :style="{ x, y }">
        <motion.div
          ref="surface"
          role="dialog"
          aria-modal="true"
          :aria-label="props.label"
          tabindex="-1"
          :class="cn(
            'relative flex max-h-[85vh] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border bg-card text-card-foreground outline-none',
            props.contentClass,
          )"
          :style="{ clipPath }"
          @keydown="onKeydown"
        >
          <motion.div ref="scroller" class="min-h-0 flex-1 overflow-y-auto" :style="{ opacity: contentOpacity }">
            <slot :close="close" />
          </motion.div>
          <motion.button
            type="button"
            aria-label="Close"
            class="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground outline-none backdrop-blur hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :style="{ opacity: contentOpacity }"
            @click="close"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </motion.button>
          <!-- Paint of the trigger, fading away as the dialog opens. -->
          <motion.div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 flex items-center justify-center"
            :style="{ ...fill, opacity: fillOpacity }"
          >
            <span class="inline-flex items-center" :style="{ gap: fill.gap }">
              <slot name="trigger" />
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  </Teleport>
</template>
