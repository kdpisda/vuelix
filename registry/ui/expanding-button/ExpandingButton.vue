<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useDomRef, useReducedMotion } from 'motion-v'
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Trigger text (and accessible name when the trigger slot is icon-only). */
  label: string
  /** Accessible name of the expanded panel. Defaults to `label`. */
  panelLabel?: string
  /** `default`: a solid button that opens into a card. `outline`: card surface in both states. */
  variant?: 'default' | 'outline'
  /** Hide the built-in close button in the panel. */
  hideClose?: boolean
  class?: HTMLAttributes['class']
  /** Classes for the panel's content row. */
  panelClass?: HTMLAttributes['class']
}>(), {
  variant: 'default',
  hideClose: false,
})

const open = defineModel<boolean>('open', { default: false })

const sizeSpring = { type: 'spring', stiffness: 420, damping: 36, mass: 0.9 } as const

const uid = useId()
const reduced = useReducedMotion()
const root = useDomRef()
const triggerEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const triggerButton = ref<HTMLButtonElement>()

// The shell animates its real width / height (no scale), so content never
// stretches — it is revealed as the shell grows.
const size = ref<{ width: number, height: number } | null>(null)
let observer: ResizeObserver | undefined

function measure() {
  const el = open.value ? panelEl.value : triggerEl.value
  if (el)
    size.value = { width: el.offsetWidth, height: el.offsetHeight }
}

function track() {
  observer?.disconnect()
  const el = open.value ? panelEl.value : triggerEl.value
  if (el && observer) {
    observer.observe(el)
    measure()
  }
}

function close(returnFocus = true) {
  if (!open.value)
    return
  const hadFocus = !!(root.value as HTMLElement | null)?.contains(document.activeElement)
  open.value = false
  if (returnFocus && hadFocus)
    nextTick(() => triggerButton.value?.focus())
}

function onDocPointerDown(e: PointerEvent) {
  if (root.value && !(root.value as HTMLElement).contains(e.target as Node))
    close(false)
}

watch(open, async (isOpen) => {
  await nextTick()
  track()
  if (isOpen) {
    document.addEventListener('pointerdown', onDocPointerDown)
    panelEl.value?.querySelector<HTMLElement>('input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])')?.focus()
  }
  else {
    document.removeEventListener('pointerdown', onDocPointerDown)
  }
}, { flush: 'post' })

onMounted(() => {
  observer = new ResizeObserver(measure)
  track()
  if (open.value)
    document.addEventListener('pointerdown', onDocPointerDown)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('pointerdown', onDocPointerDown)
})

const fade = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.22, delay: 0.06 } },
  exit: { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.12 } },
}
</script>

<template>
  <motion.div
    ref="root"
    :class="cn(
      'relative inline-block overflow-hidden rounded-[20px] align-top shadow-sm ring-1 transition-colors duration-300',
      props.variant === 'default' && !open
        ? 'bg-primary text-primary-foreground ring-primary'
        : 'bg-popover text-popover-foreground ring-border',
      props.class,
    )"
    :initial="false"
    :animate="size ?? undefined"
    :transition="reduced ? { duration: 0 } : sizeSpring"
    @keydown.escape="close()"
  >
    <AnimatePresence :initial="false" mode="popLayout" anchor-x="left">
      <motion.div v-if="!open" key="trigger" v-bind="fade" class="w-max">
        <div :ref="el => (triggerEl = el as HTMLElement | null)">
          <button
            ref="triggerButton"
            type="button"
            :aria-expanded="false"
            :aria-controls="`${uid}-panel`"
            class="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-[20px] px-4 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 [&_svg]:size-4"
            @click="open = true"
          >
            <slot name="trigger">
              {{ props.label }}
            </slot>
          </button>
        </div>
      </motion.div>
      <motion.div v-else key="panel" v-bind="fade" class="w-max">
        <div
          :id="`${uid}-panel`"
          :ref="el => (panelEl = el as HTMLElement | null)"
          role="group"
          :aria-label="props.panelLabel ?? props.label"
          :class="cn('flex items-center gap-1.5 p-1.5', props.panelClass)"
        >
          <slot :close="close" />
          <button
            v-if="!props.hideClose"
            type="button"
            aria-label="Close"
            class="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="close()"
          >
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  </motion.div>
</template>
