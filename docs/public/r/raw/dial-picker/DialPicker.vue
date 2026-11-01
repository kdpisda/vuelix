<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion-v'
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  min?: number
  max?: number
  step?: number
  /** Arrow keys move one step; PageUp / PageDown move this many steps. */
  pageSteps?: number
  /** Diameter in px. */
  size?: number
  /** Angle covered by the arc in degrees (the gap sits at the bottom). */
  sweep?: number
  /** Number of tick marks. Defaults to one per step (max 61). */
  ticks?: number
  /** Accessible name; also shown as a caption under the value. */
  label?: string
  /** Suffix shown after the value, e.g. "°C" or "%". */
  unit?: string
  locale?: string
  /** Extra Intl.NumberFormat options for the readout. */
  formatOptions?: Intl.NumberFormatOptions
  disabled?: boolean
  /** Adds a hidden input so the value is submitted with forms. */
  name?: string
  class?: HTMLAttributes['class']
}>(), {
  min: 0,
  max: 100,
  step: 1,
  pageSteps: 10,
  size: 240,
  sweep: 270,
})

const value = defineModel<number>({ default: 0 })

const knobSpring = { stiffness: 420, damping: 34, mass: 0.6 }
const digitSpring = { type: 'spring', stiffness: 260, damping: 26 } as const

const reduced = useReducedMotion()
const dragging = ref(false)

// ── geometry ────────────────────────────────────────────────────────────────
const KNOB = 26
const center = computed(() => props.size / 2)
const radius = computed(() => props.size / 2 - 30)
const half = computed(() => props.sweep / 2)
const DEG = Math.PI / 180

/** Point on a circle of radius `r` at angle `a` (degrees, clockwise from 12 o'clock). */
function point(a: number, r: number) {
  return { x: center.value + r * Math.sin(a * DEG), y: center.value - r * Math.cos(a * DEG) }
}

const arcPath = computed(() => {
  const s = point(-half.value, radius.value)
  const e = point(half.value, radius.value)
  const large = props.sweep > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${radius.value} ${radius.value} 0 ${large} 1 ${e.x} ${e.y}`
})

const decimals = computed(() => (String(props.step).split('.')[1] ?? '').length)
const span = computed(() => props.max - props.min)

function normalize(v: number) {
  return span.value === 0 ? 0 : (v - props.min) / span.value
}
function quantize(t: number) {
  const steps = Math.round((t * span.value) / props.step)
  const v = Math.min(props.max, Math.max(props.min, props.min + steps * props.step))
  return Number(v.toFixed(decimals.value))
}

const tickList = computed(() => {
  const count = props.ticks ?? Math.min(61, Math.round(span.value / props.step) + 1)
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1)
    const a = -half.value + t * props.sweep
    const major = i === 0 || i === count - 1 || i % 5 === 0
    const outer = point(a, props.size / 2 - 4)
    const inner = point(a, props.size / 2 - (major ? 14 : 10))
    return { t, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, major }
  })
})

// ── motion: the knob springs between snapped values ─────────────────────────
const target = useMotionValue(normalize(value.value))
const t = useSpring(target, knobSpring)
watch(value, (v) => {
  target.set(normalize(v))
  if (reduced.value)
    t.jump(normalize(v))
})

const knobX = useTransform(t, v => point(-half.value + v * props.sweep, radius.value).x - KNOB / 2)
const knobY = useTransform(t, v => point(-half.value + v * props.sweep, radius.value).y - KNOB / 2)

// ── rolling readout ─────────────────────────────────────────────────────────
const formatter = computed(() => new Intl.NumberFormat(props.locale, {
  minimumFractionDigits: decimals.value,
  maximumFractionDigits: decimals.value,
  ...props.formatOptions,
}))
const text = computed(() => formatter.value.format(value.value))
// Keyed from the right so digits keep their column when the length changes.
const chars = computed(() => [...text.value].map((ch, i, all) => ({
  ch,
  key: all.length - i,
  digit: /\d/.test(ch) ? Number(ch) : null,
})))
const valueText = computed(() => `${text.value}${props.unit ?? ''}`)

// ── input ───────────────────────────────────────────────────────────────────
function set(v: number) {
  const next = quantize(normalize(v))
  if (next !== value.value)
    value.value = next
}

function fromPointer(e: PointerEvent, el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const dx = e.clientX - (rect.left + rect.width / 2)
  const dy = e.clientY - (rect.top + rect.height / 2)
  const a = Math.atan2(dx, -dy) / DEG // clockwise from 12 o'clock
  let tt: number
  if (Math.abs(a) <= half.value)
    tt = (a + half.value) / props.sweep
  else // in the gap at the bottom: stick to the nearer end instead of wrapping
    tt = normalize(value.value) > 0.5 ? 1 : 0
  set(quantize(tt))
}

let knobEl: HTMLElement | null = null

function onPointerDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0)
    return
  const el = e.currentTarget as HTMLElement
  e.preventDefault()
  el.setPointerCapture(e.pointerId)
  dragging.value = true
  fromPointer(e, el)
  knobEl = el.querySelector('[role="slider"]')
}
function onPointerMove(e: PointerEvent) {
  if (dragging.value)
    fromPointer(e, e.currentTarget as HTMLElement)
}
function onPointerUp() {
  if (!dragging.value)
    return
  dragging.value = false
  knobEl?.focus({ preventScroll: true })
}

function onKeydown(e: KeyboardEvent) {
  const s = props.step
  const page = s * props.pageSteps
  const moves: Record<string, number> = {
    ArrowRight: value.value + s,
    ArrowUp: value.value + s,
    ArrowLeft: value.value - s,
    ArrowDown: value.value - s,
    PageUp: value.value + page,
    PageDown: value.value - page,
    Home: props.min,
    End: props.max,
  }
  const next = moves[e.key]
  if (next === undefined || props.disabled)
    return
  e.preventDefault()
  set(next)
}

const ends = computed(() => {
  const r = radius.value + 2
  return { min: point(-half.value - 14, r), max: point(half.value + 14, r) }
})
</script>

<template>
  <div
    :class="cn(
      'relative shrink-0 touch-none select-none text-brand',
      props.disabled && 'pointer-events-none opacity-50',
      props.class,
    )"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <svg
      :width="props.size"
      :height="props.size"
      :viewBox="`0 0 ${props.size} ${props.size}`"
      class="absolute inset-0 overflow-visible"
      aria-hidden="true"
    >
      <line
        v-for="(tick, i) in tickList"
        :key="i"
        :x1="tick.x1" :y1="tick.y1" :x2="tick.x2" :y2="tick.y2"
        stroke-linecap="round"
        :stroke-width="tick.major ? 2 : 1.5"
        :class="cn('transition-colors duration-200', tick.t <= normalize(value) + 1e-9 ? 'stroke-current' : 'stroke-muted-foreground/25')"
      />
      <path :d="arcPath" fill="none" stroke-width="10" stroke-linecap="round" class="stroke-muted" />
      <motion.path
        :d="arcPath"
        fill="none"
        stroke="currentColor"
        stroke-width="10"
        stroke-linecap="round"
        :style="{ pathLength: t }"
      />
    </svg>

    <span
      v-if="ends.min.y < props.size"
      class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
      :style="{ left: `${ends.min.x}px`, top: `${ends.min.y}px` }"
      aria-hidden="true"
    >{{ formatter.format(props.min) }}</span>
    <span
      v-if="ends.max.y < props.size"
      class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
      :style="{ left: `${ends.max.x}px`, top: `${ends.max.y}px` }"
      aria-hidden="true"
    >{{ formatter.format(props.max) }}</span>

    <!-- Readout: every digit rolls to its new value -->
    <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-foreground" aria-hidden="true">
      <div class="flex items-start font-semibold tabular-nums leading-none tracking-tight" :style="{ fontSize: `${Math.round(props.size / 5.5)}px` }">
        <span v-for="c in chars" :key="c.key" class="relative inline-block h-[1em] overflow-hidden">
          <template v-if="c.digit !== null">
            <span class="invisible">0</span>
            <motion.span
              class="absolute inset-x-0 top-0 flex flex-col items-center"
              :initial="false"
              :animate="{ y: `${-c.digit}em` }"
              :transition="reduced ? { duration: 0 } : digitSpring"
            >
              <span v-for="d in 10" :key="d" class="block h-[1em]">{{ d - 1 }}</span>
            </motion.span>
          </template>
          <template v-else>{{ c.ch }}</template>
        </span>
        <span v-if="props.unit" class="ml-0.5 text-[0.45em] font-medium leading-[1.4] text-muted-foreground">{{ props.unit }}</span>
      </div>
      <span v-if="props.label" class="mt-2 text-xs text-muted-foreground">{{ props.label }}</span>
    </div>

    <motion.div
      role="slider"
      :tabindex="props.disabled ? -1 : 0"
      :aria-label="props.label"
      :aria-valuemin="props.min"
      :aria-valuemax="props.max"
      :aria-valuenow="value"
      :aria-valuetext="valueText"
      :aria-disabled="props.disabled || undefined"
      aria-orientation="horizontal"
      class="absolute left-0 top-0 cursor-grab rounded-full border-[3px] border-current bg-background shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
      :style="{ width: `${KNOB}px`, height: `${KNOB}px`, x: knobX, y: knobY }"
      :animate="{ scale: dragging ? 1.18 : 1 }"
      :transition="{ type: 'spring', stiffness: 500, damping: 28 }"
      @keydown="onKeydown"
    />
    <input v-if="props.name" type="hidden" :name="props.name" :value="value">
  </div>
</template>
