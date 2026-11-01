<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ColorFormat } from './color'
import { AnimatePresence, motion, useDomRef } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import { clamp } from './color'
import ColorPicker from './ColorPicker.vue'

// The root renders a button plus a teleported panel, so forward attrs (id, data-*, …) to the button.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** Accessible name of the trigger and the popover. */
  label?: string
  /** Show the hex value next to the swatch in the trigger. */
  showValue?: boolean
  /** Horizontal alignment of the popover relative to the trigger. */
  align?: 'start' | 'center' | 'end'
  /** Forwarded to `ColorPicker`. */
  alpha?: boolean
  /** Forwarded to `ColorPicker`. */
  eyedropper?: boolean
  /** Forwarded to `ColorPicker`. */
  recentLimit?: number
  disabled?: boolean
  /** Classes for the trigger button. */
  class?: HTMLAttributes['class']
  /** Classes for the picker inside the popover. */
  contentClass?: HTMLAttributes['class']
}>(), {
  label: 'Pick a color',
  showValue: true,
  align: 'start',
  eyedropper: true,
  recentLimit: 7,
})

const emit = defineEmits<{ change: [value: string] }>()

const model = defineModel<string>({ default: '#6366f1' })
const open = defineModel<boolean>('open', { default: false })
// Kept here (not in the picker) so history and format survive the picker unmounting on close.
const recent = defineModel<string[]>('recent', { default: () => [] })
const format = defineModel<ColorFormat>('format', { default: 'hex' })

const panelId = `vx-color-popover-${useId()}`
const trigger = ref<HTMLButtonElement>()
const panel = useDomRef()

const spring = { type: 'spring', stiffness: 520, damping: 34 } as const
const GAP = 8

const pos = ref({ top: 0, left: 0, originX: 0, above: false })
const origin = computed(() => `${pos.value.originX}px ${pos.value.above ? '100%' : '0%'}`)

const CHECKER = {
  backgroundColor: 'var(--color-background)',
  backgroundImage: 'repeating-conic-gradient(var(--color-border) 0 25%, transparent 0 50%)',
  backgroundSize: '8px 8px',
}

/** Places the popover under the trigger (or above it when there's no room) and clamps it to the viewport. */
function place() {
  const t = trigger.value
  if (!t)
    return
  const el = panel.value as HTMLElement | null
  // offsetWidth/Height ignore the scale transform, so measuring mid-animation is fine.
  const w = el?.offsetWidth ?? 288
  const h = el?.offsetHeight ?? 380
  const r = t.getBoundingClientRect()
  const above = r.bottom + GAP + h > window.innerHeight && r.top - GAP - h > 0
  const ideal = props.align === 'start' ? r.left : props.align === 'end' ? r.right - w : r.left + r.width / 2 - w / 2
  const left = clamp(ideal, GAP, Math.max(GAP, window.innerWidth - w - GAP))
  pos.value = {
    top: above ? r.top - GAP - h : r.bottom + GAP,
    left,
    originX: clamp(r.left + r.width / 2 - left, 0, w),
    above,
  }
}

function close(refocus = false) {
  open.value = false
  if (refocus)
    trigger.value?.focus({ preventScroll: true })
}

function onDocPointerDown(e: PointerEvent) {
  const target = e.target as Node
  const el = panel.value as HTMLElement | null
  if (el?.contains(target) || trigger.value?.contains(target))
    return
  close()
}

function onDocKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close(true)
  }
}

function listen(on: boolean) {
  if (on) {
    document.addEventListener('pointerdown', onDocPointerDown, true)
    document.addEventListener('keydown', onDocKeydown)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
  }
  else {
    document.removeEventListener('pointerdown', onDocPointerDown, true)
    document.removeEventListener('keydown', onDocKeydown)
    window.removeEventListener('resize', place)
    window.removeEventListener('scroll', place, true)
  }
}

watch(open, async (isOpen) => {
  if (typeof document === 'undefined')
    return
  listen(isOpen)
  if (!isOpen)
    return
  place()
  await nextTick()
  place()
  ;((panel.value as HTMLElement | null)?.querySelector('[role="slider"]') as HTMLElement | null)?.focus({ preventScroll: true })
}, { immediate: true })

onBeforeUnmount(() => {
  if (typeof document !== 'undefined')
    listen(false)
})
</script>

<template>
  <button
    v-bind="$attrs"
    ref="trigger"
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :aria-controls="open ? panelId : undefined"
    :aria-label="`${props.label}: ${model}`"
    :disabled="props.disabled"
    :class="cn(
      'inline-flex h-9 items-center gap-2 rounded-lg border bg-background pl-1.5 text-sm shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
      props.showValue ? 'pr-3' : 'pr-1.5',
      props.class,
    )"
    @click="open = !open"
  >
    <span class="relative size-6 shrink-0 overflow-hidden rounded-md" :style="CHECKER">
      <span class="absolute inset-0" :style="{ backgroundColor: model }" />
      <span aria-hidden="true" class="absolute inset-0 rounded-md ring-1 ring-inset ring-foreground/10" />
    </span>
    <span v-if="props.showValue" class="font-mono text-xs uppercase tabular-nums">{{ model }}</span>
  </button>

  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="open"
        :id="panelId"
        key="panel"
        ref="panel"
        role="dialog"
        :aria-label="props.label"
        class="fixed z-50"
        :style="{ top: `${pos.top}px`, left: `${pos.left}px`, transformOrigin: origin }"
        :initial="{ opacity: 0, scale: 0.6, y: pos.above ? 8 : -8 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.85, y: pos.above ? 6 : -6, transition: { duration: 0.15 } }"
        :transition="spring"
      >
        <ColorPicker
          v-model="model"
          v-model:recent="recent"
          v-model:format="format"
          :alpha="props.alpha"
          :eyedropper="props.eyedropper"
          :recent-limit="props.recentLimit"
          :class="cn('bg-popover text-popover-foreground shadow-xl', props.contentClass)"
          @change="emit('change', $event)"
        />
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>
