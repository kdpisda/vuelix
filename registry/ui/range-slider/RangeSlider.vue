<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { animate, AnimatePresence, motion, useMotionTemplate, useMotionValue, useTransform } from 'motion-v'
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

type SliderValue = number | [number, number]

const props = withDefaults(defineProps<{
  min?: number
  max?: number
  step?: number
  /** When to show the value bubble above a thumb. */
  showValue?: 'active' | 'always' | 'never'
  /** Formats values for the bubble and for screen readers. */
  format?: (value: number) => string
  /** Accessible name (single thumb). Range thumbs are labelled "Minimum" / "Maximum". */
  ariaLabel?: string
  /** Renders hidden input(s) so the value is submitted with a form. */
  name?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  min: 0,
  max: 100,
  step: 1,
  showValue: 'active',
})

/** Pass a number for one thumb or a `[from, to]` tuple for two. */
const model = defineModel<SliderValue>({ default: 0 })
const emit = defineEmits<{ commit: [value: SliderValue] }>()

const track = ref<HTMLElement>()
const thumbs: HTMLElement[] = []
const dragging = ref<number | null>(null)
const hovered = ref<number | null>(null)
const focused = ref<number | null>(null)

const settle = { type: 'spring', stiffness: 380, damping: 34 } as const
const follow = { type: 'spring', stiffness: 1200, damping: 70 } as const
const grow = { type: 'spring', stiffness: 520, damping: 24 } as const

const isRange = computed(() => Array.isArray(model.value))
const values = computed<number[]>(() => (Array.isArray(model.value) ? [...model.value] : [model.value]))
const decimals = computed(() => (String(props.step).split('.')[1] ?? '').length)

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi)
}
function snap(v: number) {
  const stepped = Math.round((v - props.min) / props.step) * props.step + props.min
  return Number(clamp(stepped, props.min, props.max).toFixed(decimals.value))
}
function pct(v: number) {
  return ((v - props.min) / (props.max - props.min || 1)) * 100
}
function label(v: number) {
  return props.format ? props.format(v) : String(v)
}

// Thumb positions live in motion values: the fill and thumbs follow without re-rendering.
const p0 = useMotionValue(pct(values.value[0]!))
const p1 = useMotionValue(pct(values.value[1] ?? values.value[0]!))
const positions = [p0, p1]
const left0 = useMotionTemplate`${p0}%`
const left1 = useMotionTemplate`${p1}%`
const right0 = useTransform(p0, v => `${100 - v}%`)
const right1 = useTransform(p1, v => `${100 - v}%`)

watch(values, (v) => {
  v.forEach((val, i) => animate(positions[i]!, pct(val), dragging.value === null ? settle : follow))
})

/** The range a thumb may move in — range thumbs can't cross each other. */
function bounds(i: number): [number, number] {
  if (!isRange.value)
    return [props.min, props.max]
  return i === 0 ? [props.min, values.value[1]!] : [values.value[0]!, props.max]
}

function setValue(i: number, raw: number) {
  const [lo, hi] = bounds(i)
  const v = clamp(snap(raw), lo, hi)
  if (v === values.value[i])
    return
  if (isRange.value) {
    const next = [...values.value] as [number, number]
    next[i] = v
    model.value = next
  }
  else {
    model.value = v
  }
}

function valueAt(clientX: number) {
  const rect = track.value!.getBoundingClientRect()
  const ratio = clamp((clientX - rect.left) / (rect.width || 1), 0, 1)
  return props.min + ratio * (props.max - props.min)
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0)
    return
  e.preventDefault()
  const v = valueAt(e.clientX)
  let i = 0
  if (isRange.value) {
    const [a, b] = values.value as [number, number]
    i = Math.abs(v - a) < Math.abs(v - b) ? 0 : Math.abs(v - a) > Math.abs(v - b) ? 1 : v < a ? 0 : 1
  }
  setValue(i, v) // springs to the clicked spot…
  dragging.value = i // …then follows the pointer tightly
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  // `focusVisible: false` keeps the keyboard ring (and bubble) off for pointer interaction.
  thumbs[i]?.focus({ preventScroll: true, focusVisible: false } as FocusOptions)
}

function onPointerMove(e: PointerEvent) {
  if (dragging.value !== null)
    setValue(dragging.value, valueAt(e.clientX))
}

function onPointerUp() {
  if (dragging.value === null)
    return
  dragging.value = null
  emit('commit', model.value)
}

function onKeydown(e: KeyboardEvent, i: number) {
  const big = Math.max(props.step, snap(props.min + (props.max - props.min) / 10) - props.min)
  const v = values.value[i]!
  const [lo, hi] = bounds(i)
  const next = {
    ArrowRight: v + props.step,
    ArrowUp: v + props.step,
    ArrowLeft: v - props.step,
    ArrowDown: v - props.step,
    PageUp: v + big,
    PageDown: v - big,
    Home: lo,
    End: hi,
  }[e.key]
  if (next === undefined)
    return
  e.preventDefault()
  setValue(i, next)
  emit('commit', model.value)
}

function onFocus(e: FocusEvent, i: number) {
  // Only keyboard focus opens the bubble; pointer focus is covered by `dragging`.
  if ((e.target as HTMLElement).matches(':focus-visible'))
    focused.value = i
}

function bubbleVisible(i: number) {
  if (props.showValue === 'always')
    return true
  if (props.showValue === 'never')
    return false
  return dragging.value === i || hovered.value === i || focused.value === i
}
</script>

<template>
  <div
    :class="cn(
      'relative flex h-5 w-full touch-none select-none items-center',
      props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      props.class,
    )"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <template v-if="props.name">
      <input v-for="(v, i) in values" :key="i" type="hidden" :name="props.name" :value="v">
    </template>
    <div ref="track" class="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        class="absolute inset-y-0 rounded-full bg-primary"
        :style="isRange ? { left: left0, right: right1 } : { left: '0%', right: right0 }"
      />
    </div>
    <motion.div
      v-for="(v, i) in values"
      :key="i"
      class="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2"
      :style="{ left: i === 0 ? left0 : left1, zIndex: dragging === i ? 2 : 1 }"
    >
      <AnimatePresence>
        <motion.div
          v-if="bubbleVisible(i)"
          key="bubble"
          aria-hidden="true"
          class="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2"
          :initial="{ opacity: 0, y: 6, scale: 0.7 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :exit="{ opacity: 0, y: 4, scale: 0.8, transition: { duration: 0.12 } }"
          :transition="grow"
        >
          <span class="relative block whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-xs font-medium tabular-nums text-primary-foreground shadow-md">
            {{ label(v) }}
            <span class="absolute left-1/2 top-full -mt-1 size-2 -translate-x-1/2 rotate-45 rounded-[1px] bg-primary" />
          </span>
        </motion.div>
      </AnimatePresence>
      <motion.div
        :ref="(el: any) => (thumbs[i] = el?.$el ?? el)"
        role="slider"
        :tabindex="props.disabled ? -1 : 0"
        :aria-label="isRange ? (i === 0 ? 'Minimum' : 'Maximum') : props.ariaLabel"
        :aria-valuemin="bounds(i)[0]"
        :aria-valuemax="bounds(i)[1]"
        :aria-valuenow="v"
        :aria-valuetext="label(v)"
        aria-orientation="horizontal"
        :aria-disabled="props.disabled || undefined"
        class="size-5 rounded-full border-2 border-primary bg-background shadow-md outline-none focus-visible:ring-[4px] focus-visible:ring-ring/50"
        :animate="{ scale: dragging === i ? 1.3 : hovered === i ? 1.12 : 1 }"
        :transition="grow"
        @keydown="onKeydown($event, i)"
        @focus="onFocus($event, i)"
        @blur="focused = null"
        @pointerenter="!props.disabled && (hovered = i)"
        @pointerleave="hovered = null"
      />
    </motion.div>
  </div>
</template>
