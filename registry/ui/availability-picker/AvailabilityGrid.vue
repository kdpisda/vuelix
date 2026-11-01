<script setup lang="ts">
import type { AvailabilityWeek } from './time'
import { AnimatePresence, motion } from 'motion-v'
import { computed, nextTick, ref } from 'vue'
import { cn } from '@/lib/utils'
import { formatTime, rangesToSlots, slotsToRanges, toMinutes } from './time'

const props = defineProps<{
  days: string[]
  startHour: number
  endHour: number
  step: number
  hour12: boolean
}>()

const week = defineModel<AvailabilityWeek>({ required: true })

const HOUR_HEIGHT = 26
const LABEL_W = 48
const BLOCK = { type: 'spring', stiffness: 500, damping: 40 } as const

const origin = computed(() => props.startHour * 60)
const count = computed(() => Math.round(((props.endHour - props.startHour) * 60) / props.step))
const rowH = computed(() => (HOUR_HEIGHT * props.step) / 60)
const slots = computed(() => week.value.map(d => rangesToSlots(d, origin.value, props.step, count.value)))

function commit(next: boolean[][]) {
  week.value = week.value.map((day, i) => {
    const ranges = slotsToRanges(next[i]!, origin.value, props.step)
    return { enabled: ranges.length > 0, ranges }
  })
}

// ---------------------------------------------------------------------------
// Pointer painting: drag paints (or erases) a rectangle of slots
// ---------------------------------------------------------------------------
const area = ref<HTMLElement>()
let drag: { day: number, slot: number, value: boolean, snapshot: boolean[][] } | null = null

function cellAt(e: PointerEvent) {
  const rect = area.value!.getBoundingClientRect()
  const colW = (rect.width - LABEL_W) / props.days.length
  const day = Math.floor((e.clientX - rect.left - LABEL_W) / colW)
  const slot = Math.floor((e.clientY - rect.top) / rowH.value)
  return {
    day: Math.min(props.days.length - 1, Math.max(0, day)),
    slot: Math.min(count.value - 1, Math.max(0, slot)),
    inside: day >= 0 && day < props.days.length,
  }
}

function paint(to: { day: number, slot: number }) {
  if (!drag)
    return
  const next = drag.snapshot.map(col => [...col])
  const [d0, d1] = [Math.min(drag.day, to.day), Math.max(drag.day, to.day)]
  const [s0, s1] = [Math.min(drag.slot, to.slot), Math.max(drag.slot, to.slot)]
  for (let d = d0; d <= d1; d++) {
    for (let s = s0; s <= s1; s++) next[d]![s] = drag.value
  }
  commit(next)
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0)
    return
  const cell = cellAt(e)
  if (!cell.inside)
    return
  e.preventDefault()
  area.value!.setPointerCapture(e.pointerId)
  const snapshot = slots.value.map(col => [...col])
  drag = { day: cell.day, slot: cell.slot, value: !snapshot[cell.day]![cell.slot], snapshot }
  active.value = { day: cell.day, slot: cell.slot }
  paint(cell)
}
function onPointerMove(e: PointerEvent) {
  if (drag)
    paint(cellAt(e))
}
function onPointerUp() {
  drag = null
}

// ---------------------------------------------------------------------------
// Keyboard: roving focus over cells, Space / Enter toggles
// ---------------------------------------------------------------------------
const active = ref({ day: 0, slot: Math.max(0, Math.round(((9 - props.startHour) * 60) / props.step)) })

function focusCell() {
  nextTick(() => area.value?.querySelector<HTMLElement>(`[data-cell="${active.value.day}-${active.value.slot}"]`)?.focus())
}

function onKeydown(e: KeyboardEvent) {
  const { day, slot } = active.value
  const moves: Record<string, [number, number]> = {
    ArrowUp: [day, slot - 1],
    ArrowDown: [day, slot + 1],
    ArrowLeft: [day - 1, slot],
    ArrowRight: [day + 1, slot],
    Home: [day, 0],
    End: [day, count.value - 1],
  }
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    const next = slots.value.map(col => [...col])
    next[day]![slot] = !next[day]![slot]
    commit(next)
    return
  }
  const move = moves[e.key]
  if (!move)
    return
  e.preventDefault()
  // Shift + arrows paints the slot you move onto with the current slot's value.
  if (e.shiftKey) {
    const value = slots.value[day]![slot]!
    drag = { day, slot, value, snapshot: slots.value.map(col => [...col]) }
  }
  active.value = {
    day: Math.min(props.days.length - 1, Math.max(0, move[0])),
    slot: Math.min(count.value - 1, Math.max(0, move[1])),
  }
  if (drag) {
    paint(active.value)
    drag = null
  }
  focusCell()
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------
const rows = computed(() => Array.from({ length: count.value }, (_, i) => origin.value + i * props.step))
const blocks = computed(() => week.value.map(day => (day.enabled
  ? day.ranges
      .map(r => ({ start: toMinutes(r.start), end: toMinutes(r.end) }))
      .filter(r => r.end > r.start)
      .map(r => ({
        key: r.start,
        top: ((Math.max(r.start, origin.value) - origin.value) / props.step) * rowH.value,
        height: ((Math.min(r.end, props.endHour * 60) - Math.max(r.start, origin.value)) / props.step) * rowH.value,
        from: formatTime(r.start, props.hour12),
        to: formatTime(r.end, props.hour12),
      }))
      .filter(b => b.height > 0)
  : [])))
const columns = computed(() => `${LABEL_W}px repeat(${props.days.length}, minmax(0, 1fr))`)
</script>

<template>
  <div role="grid" aria-label="Weekly availability" aria-multiselectable="true" class="select-none">
    <div role="row" class="grid h-8 items-center" :style="{ gridTemplateColumns: columns }">
      <span role="columnheader" aria-label="Time" />
      <span
        v-for="(d, i) in props.days"
        :key="d"
        role="columnheader"
        :class="cn('text-center text-xs font-medium', week[i]?.enabled ? 'text-foreground' : 'text-muted-foreground')"
      >
        {{ d }}
      </span>
    </div>

    <div
      ref="area"
      class="relative touch-none"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeydown"
    >
      <!-- Hour lines + column separators -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 right-0 grid rounded-lg border bg-muted/30"
        :style="{
          left: `${LABEL_W}px`,
          gridTemplateColumns: `repeat(${props.days.length}, minmax(0, 1fr))`,
          backgroundImage: `linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: `100% ${HOUR_HEIGHT}px`,
        }"
      >
        <div v-for="(d, i) in props.days" :key="d" :class="cn('relative', i > 0 && 'border-l')">
          <AnimatePresence :initial="false">
            <motion.div
              v-for="b in blocks[i]"
              :key="b.key"
              class="absolute inset-x-1 overflow-hidden rounded-md bg-brand/85 px-1 text-[10px] font-medium leading-tight text-background shadow-xs"
              :initial="{ opacity: 0, scaleX: 0.6, top: b.top, height: b.height }"
              :animate="{ opacity: 1, scaleX: 1, top: b.top, height: b.height }"
              :exit="{ opacity: 0, scaleX: 0.6, transition: { duration: 0.12 } }"
              :transition="BLOCK"
            >
              <template v-if="b.height >= HOUR_HEIGHT * 1.5">
                <span class="mt-0.5 block truncate tabular-nums">{{ b.from }}</span>
                <span class="block truncate tabular-nums opacity-75">{{ b.to }}</span>
              </template>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <!-- Cells (transparent, on top for hit-testing and focus rings) -->
      <div
        v-for="(minutes, s) in rows"
        :key="minutes"
        role="row"
        class="relative z-10 grid"
        :style="{ gridTemplateColumns: columns, height: `${rowH}px` }"
      >
        <span role="rowheader" class="relative text-[10px] text-muted-foreground">
          <span v-if="minutes % 60 === 0" class="absolute -top-1.5 right-2 tabular-nums">{{ formatTime(minutes, props.hour12) }}</span>
          <span v-else class="sr-only">{{ formatTime(minutes, props.hour12) }}</span>
        </span>
        <span
          v-for="(d, i) in props.days"
          :key="d"
          role="gridcell"
          :data-cell="`${i}-${s}`"
          :aria-selected="!!slots[i]?.[s]"
          :aria-label="`${d} ${formatTime(minutes, props.hour12)}`"
          :tabindex="active.day === i && active.slot === s ? 0 : -1"
          class="cursor-cell rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          @focus="active = { day: i, slot: s }"
        />
      </div>
    </div>
  </div>
</template>
