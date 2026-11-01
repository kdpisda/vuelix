<script setup lang="ts">
import type { AnimationPlaybackControls } from 'motion-v'
import type { HTMLAttributes } from 'vue'
import type { WheelPickerOption } from './context'
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion-v'
import { computed, inject, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import { WHEEL_GROUP_KEY } from './context'
import WheelPickerItem from './WheelPickerItem.vue'

const props = withDefaults(defineProps<{
  options: WheelPickerOption[]
  /** Accessible name, e.g. "Hours". */
  label?: string
  /** Row height in px. Inherited from <WheelPickerGroup> when grouped. */
  itemHeight?: number
  /** Rows visible at once (odd). Inherited from <WheelPickerGroup> when grouped. */
  visibleCount?: number
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  itemHeight: 36,
  visibleCount: 5,
})

const model = defineModel<string | number>()

const group = inject(WHEEL_GROUP_KEY, null)
const itemHeight = computed(() => group?.itemHeight ?? props.itemHeight)
const visibleCount = computed(() => group?.visibleCount ?? props.visibleCount)

const items = computed(() =>
  props.options.map(o => (typeof o === 'object' ? o : { value: o, label: String(o) })),
)

// Drum geometry: neighbours are `step` degrees apart on a cylinder whose
// chord between two items equals the row height.
const step = computed(() => 90 / ((visibleCount.value - 1) / 2 + 1.5))
const radius = computed(() => itemHeight.value / (2 * Math.sin((step.value * Math.PI) / 360)))

const snapSpring = { type: 'spring', stiffness: 320, damping: 34 } as const
const RUBBER = 0.3

const uid = useId()
const reduced = useReducedMotion()

const indexOf = (value: unknown) => Math.max(0, items.value.findIndex(i => i.value === value))
const lastIndex = computed(() => Math.max(0, items.value.length - 1))
const minOffset = computed(() => -lastIndex.value * itemHeight.value)

// Scroll position in px: item i is centred when offset = -i * itemHeight.
const offset = useMotionValue(-indexOf(model.value) * itemHeight.value)
const active = ref(indexOf(model.value))

const clampIndex = (i: number) => Math.min(lastIndex.value, Math.max(0, i))
const nearest = (o: number) => clampIndex(Math.round(-o / itemHeight.value))

useMotionValueEvent(offset, 'change', (o) => {
  const i = nearest(o)
  if (i !== active.value)
    active.value = i
})

let anim: AnimationPlaybackControls | undefined
/** Row the wheel is heading to, so quick repeated key presses accumulate. */
let heading: number | null = null

function commit() {
  heading = null
  const i = nearest(offset.get())
  const value = items.value[i]?.value
  if (value !== undefined && value !== model.value)
    model.value = value
}

function snapTo(i: number) {
  anim?.stop()
  heading = clampIndex(i)
  const target = -heading * itemHeight.value
  if (reduced.value) {
    offset.set(target)
    commit()
    return
  }
  anim = animate(offset, target, { ...snapSpring, onComplete: commit })
}

watch(model, (v) => {
  const i = indexOf(v)
  if (i !== nearest(offset.get()))
    snapTo(i)
})
watch(itemHeight, h => offset.jump(-active.value * h))

// ── drag with momentum ──────────────────────────────────────────────────────
let drag: { y: number, offset: number, moved: boolean, samples: { t: number, y: number }[] } | null = null

function rubberBand(o: number) {
  if (o > 0)
    return o * RUBBER
  if (o < minOffset.value)
    return minOffset.value + (o - minOffset.value) * RUBBER
  return o
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0)
    return
  anim?.stop()
  heading = null
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  drag = { y: e.clientY, offset: offset.get(), moved: false, samples: [{ t: e.timeStamp, y: e.clientY }] }
}

function onPointerMove(e: PointerEvent) {
  if (!drag)
    return
  const dy = e.clientY - drag.y
  if (Math.abs(dy) > 3)
    drag.moved = true
  offset.set(rubberBand(drag.offset + dy))
  drag.samples.push({ t: e.timeStamp, y: e.clientY })
  if (drag.samples.length > 6)
    drag.samples.shift()
}

function onPointerUp(e: PointerEvent) {
  if (!drag)
    return
  const { moved, samples } = drag
  drag = null
  if (!moved) {
    // A tap: pick the row under the pointer by projecting back onto the drum.
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const dy = e.clientY - (rect.top + rect.height / 2)
    const a = Math.asin(Math.max(-1, Math.min(1, dy / radius.value))) * (180 / Math.PI)
    snapTo(active.value + Math.round(a / step.value))
    return
  }
  // Release velocity from the last ~100ms of movement.
  const recent = samples.filter(s => e.timeStamp - s.t < 100)
  const first = recent[0]
  const dt = first ? (e.timeStamp - first.t) / 1000 : 0 // paused before release → no fling
  const velocity = first && dt > 0 ? (e.clientY - first.y) / dt : 0
  const h = itemHeight.value
  const POWER = 0.35
  // Land exactly on a row.
  const snap = (t: number) => Math.max(minOffset.value, Math.min(0, Math.round(t / h) * h))
  const target = snap(offset.get() + POWER * velocity)
  if (target === offset.get())
    return commit()
  // Inertia ignores the target keyframe, but motion skips "animations" whose
  // keyframes don't change — so pass the landing spot we computed.
  anim = animate(offset, target, {
    type: 'inertia',
    velocity,
    power: POWER,
    timeConstant: 260,
    min: minOffset.value,
    max: 0,
    bounceStiffness: 380,
    bounceDamping: 36,
    restDelta: 0.5,
    modifyTarget: snap,
    onComplete: commit,
  })
}

// ── wheel / trackpad ────────────────────────────────────────────────────────
let wheelTimer: ReturnType<typeof setTimeout> | undefined

function onWheel(e: WheelEvent) {
  if (props.disabled)
    return
  const o = offset.get()
  const atEdge = (e.deltaY < 0 && o >= 0) || (e.deltaY > 0 && o <= minOffset.value)
  if (atEdge)
    return // let the page scroll
  e.preventDefault()
  // Mouse wheels send big discrete deltas: one notch = one row.
  if (e.deltaMode !== 0 || Math.abs(e.deltaY) >= 50) {
    snapTo((heading ?? nearest(o)) + Math.sign(e.deltaY))
    return
  }
  anim?.stop()
  heading = null
  offset.set(Math.max(minOffset.value, Math.min(0, o - e.deltaY)))
  clearTimeout(wheelTimer)
  wheelTimer = setTimeout(() => snapTo(nearest(offset.get())), 120)
}

onBeforeUnmount(() => {
  clearTimeout(wheelTimer)
  anim?.stop()
})

// ── keyboard ────────────────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  const from = heading ?? active.value
  const moves: Record<string, number> = {
    ArrowUp: from - 1,
    ArrowDown: from + 1,
    PageUp: from - 5,
    PageDown: from + 5,
    Home: 0,
    End: lastIndex.value,
  }
  const next = moves[e.key]
  if (next === undefined || props.disabled)
    return
  e.preventDefault()
  snapTo(next)
}
</script>

<template>
  <div
    role="listbox"
    :tabindex="props.disabled ? -1 : 0"
    :aria-label="props.label"
    :aria-disabled="props.disabled || undefined"
    :aria-activedescendant="`${uid}-${active}`"
    :class="cn(
      'relative w-16 shrink-0 cursor-grab touch-none select-none rounded-lg text-lg tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing',
      props.disabled && 'pointer-events-none opacity-50',
      props.class,
    )"
    :style="{ height: `${itemHeight * visibleCount}px` }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @wheel="onWheel"
    @keydown="onKeydown"
  >
    <div
      v-if="!group"
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-lg bg-muted"
      :style="{ height: `${itemHeight}px` }"
    />
    <div class="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)] [perspective:1000px]">
      <WheelPickerItem
        v-for="(item, i) in items"
        :id="`${uid}-${i}`"
        :key="item.value"
        :index="i"
        :label="item.label"
        :selected="i === active"
        :offset="offset"
        :item-height="itemHeight"
        :step="step"
        :radius="radius"
      />
    </div>
  </div>
</template>
