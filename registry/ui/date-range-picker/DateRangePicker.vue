<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { DateRange, DateRangePreset } from './calendar'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import {
  addMonthsClamped,
  defaultPresets,
  fromDay,
  monthGrid,
  monthStart,
  startOfToday,
  toDay,
  toMonth,
} from './calendar'

const props = withDefaults(defineProps<{
  /** How many months are shown side by side. */
  months?: 1 | 2
  /** Quick ranges in a side column. Pass `[]` to hide the column. */
  presets?: DateRangePreset[]
  /** BCP 47 locale for month / weekday / date formatting. Defaults to the user's. */
  locale?: string
  /** First day of the week: 0 = Sunday, 1 = Monday … */
  weekStartsOn?: number
  /** Earliest selectable date. */
  min?: Date
  /** Latest selectable date. */
  max?: Date
  /** Trigger text when nothing is selected. */
  placeholder?: string
  /** Horizontal alignment of the popover relative to the trigger. */
  align?: 'start' | 'center' | 'end'
  /** Close the popover as soon as both ends are picked. */
  closeOnSelect?: boolean
  class?: HTMLAttributes['class']
}>(), {
  months: 2,
  presets: () => defaultPresets,
  weekStartsOn: 0,
  placeholder: 'Pick a date range',
  align: 'start',
  closeOnSelect: false,
})

const range = defineModel<DateRange>({ default: () => ({ start: null, end: null }) })
const open = defineModel<boolean>('open', { default: false })

const CELL = 32 // px — one day cell
const MONTH_GAP = 16
const spring = { type: 'spring', stiffness: 520, damping: 40 } as const
const slide = { type: 'spring', stiffness: 380, damping: 36 } as const

const uid = useId()
const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const views = ref<HTMLElement>()

const today = ref(toDay(startOfToday()))
const viewMonth = ref(toMonth(startOfToday()))
const direction = ref(1)
const focusDay = ref(today.value)
const hoverDay = ref<number | null>(null)

const startDay = computed(() => (range.value?.start ? toDay(range.value.start) : null))
const endDay = computed(() => (range.value?.end ? toDay(range.value.end) : null))
const minDay = computed(() => (props.min ? toDay(props.min) : -Infinity))
const maxDay = computed(() => (props.max ? toDay(props.max) : Infinity))
const selecting = computed(() => startDay.value !== null && endDay.value === null)

/** The span currently drawn: the committed range, or start → hovered day while picking. */
const band = computed<[number, number] | null>(() => {
  const s = startDay.value
  if (s === null)
    return null
  const e = endDay.value ?? hoverDay.value ?? s
  return s <= e ? [s, e] : [e, s]
})

// ── formatting ──────────────────────────────────────────────────────────────
const fmtMonth = computed(() => new Intl.DateTimeFormat(props.locale, { month: 'long', year: 'numeric' }))
const fmtFull = computed(() => new Intl.DateTimeFormat(props.locale, { dateStyle: 'full' }))
const fmtShort = computed(() => new Intl.DateTimeFormat(props.locale, { month: 'short', day: 'numeric', year: 'numeric' }))
const weekdays = computed(() => {
  const f = new Intl.DateTimeFormat(props.locale, { weekday: 'short' })
  const long = new Intl.DateTimeFormat(props.locale, { weekday: 'long' })
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, 1 + ((props.weekStartsOn + i) % 7))
    return { short: f.format(d).slice(0, 2), long: long.format(d) }
  })
})

const label = computed(() => {
  const { start, end } = range.value ?? {}
  if (start && end)
    return fmtShort.value.formatRange(start, end)
  if (start)
    return `${fmtShort.value.format(start)} – …`
  return ''
})

const summary = computed(() => {
  const s = startDay.value
  const e = endDay.value
  if (s !== null && e !== null) {
    const n = e - s + 1
    return `${n} ${n === 1 ? 'day' : 'days'} selected`
  }
  return s !== null ? 'Pick an end date' : 'Pick a start date'
})

// ── grid model ──────────────────────────────────────────────────────────────
const visible = computed(() =>
  Array.from({ length: props.months }, (_, i) => {
    const month = viewMonth.value + i
    const rows = monthGrid(month, props.weekStartsOn).map((days) => {
      // Horizontal extent of the band within this week row (if any).
      let from = -1
      let to = -1
      if (band.value) {
        days.forEach((d, c) => {
          if (d !== null && d >= band.value![0] && d <= band.value![1]) {
            if (from === -1)
              from = c
            to = c
          }
        })
      }
      const segment = from === -1
        ? null
        : {
            x: from * CELL,
            width: (to - from + 1) * CELL,
            roundStart: days[from] === band.value![0],
            roundEnd: days[to] === band.value![1],
          }
      return { days, segment }
    })
    return { month, title: fmtMonth.value.format(monthStart(month)), rows }
  }),
)

const liveTitle = computed(() => visible.value.map(m => m.title).join(' – '))
const viewsWidth = computed(() => props.months * CELL * 7 + (props.months - 1) * MONTH_GAP)

function dayNumber(day: number) {
  return fromDay(day).getDate()
}
function isDisabled(day: number) {
  return day < minDay.value || day > maxDay.value
}
function isEndpoint(day: number) {
  return startDay.value !== null && (day === band.value?.[0] || day === band.value?.[1])
}
function inBand(day: number) {
  return !!band.value && day >= band.value[0] && day <= band.value[1]
}

// ── navigation ──────────────────────────────────────────────────────────────
function showMonth(month: number) {
  if (month === viewMonth.value)
    return
  direction.value = month > viewMonth.value ? 1 : -1
  viewMonth.value = month
  // Keep the grid's one tab stop on a visible day.
  const fm = toMonth(fromDay(focusDay.value))
  if (fm < month || fm > month + props.months - 1)
    focusDay.value = addMonthsClamped(focusDay.value, month - fm)
}

/** Shift the view only as far as needed to reveal `day`. */
function reveal(day: number) {
  const m = toMonth(fromDay(day))
  if (m < viewMonth.value)
    showMonth(m)
  else if (m > viewMonth.value + props.months - 1)
    showMonth(m - props.months + 1)
}

async function focusCell(day: number) {
  focusDay.value = day
  reveal(day)
  await nextTick()
  views.value
    ?.querySelector<HTMLButtonElement>(`[data-view="${viewMonth.value}"] [data-day="${day}"]`)
    ?.focus()
}

function onGridKeydown(e: KeyboardEvent) {
  const d = focusDay.value
  const col = (fromDay(d).getDay() - props.weekStartsOn + 7) % 7
  const moves: Record<string, number> = {
    ArrowLeft: d - 1,
    ArrowRight: d + 1,
    ArrowUp: d - 7,
    ArrowDown: d + 7,
    Home: d - col,
    End: d + (6 - col),
    PageUp: addMonthsClamped(d, e.shiftKey ? -12 : -1),
    PageDown: addMonthsClamped(d, e.shiftKey ? 12 : 1),
  }
  const next = moves[e.key]
  if (next === undefined)
    return
  e.preventDefault()
  if (selecting.value)
    hoverDay.value = next
  focusCell(next)
}

// ── selection ───────────────────────────────────────────────────────────────
function select(day: number) {
  focusDay.value = day
  const s = startDay.value
  if (s === null || endDay.value !== null) {
    range.value = { start: fromDay(day), end: null }
    return
  }
  const [a, b] = day < s ? [day, s] : [s, day]
  range.value = { start: fromDay(a), end: fromDay(b) }
  hoverDay.value = null
  if (props.closeOnSelect)
    close()
}

function applyPreset(preset: DateRangePreset) {
  const r = preset.range(fromDay(today.value))
  range.value = { start: r.start, end: r.end }
  hoverDay.value = null
  focusDay.value = toDay(r.end)
  // Keep the end visible, and the start too when both fit.
  const endMonth = toMonth(r.end)
  showMonth(Math.max(toMonth(r.start), endMonth - props.months + 1))
}

function isActivePreset(preset: DateRangePreset) {
  if (startDay.value === null || endDay.value === null)
    return false
  const r = preset.range(fromDay(today.value))
  return toDay(r.start) === startDay.value && toDay(r.end) === endDay.value
}

function clear() {
  range.value = { start: null, end: null }
  hoverDay.value = null
}

// ── popover ─────────────────────────────────────────────────────────────────
function close(returnFocus = true) {
  open.value = false
  hoverDay.value = null
  if (returnFocus)
    nextTick(() => trigger.value?.focus())
}

function onDocPointerDown(e: PointerEvent) {
  if (root.value && !root.value.contains(e.target as Node))
    close(false)
}

function onFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (open.value && next && root.value && !root.value.contains(next))
    close(false)
}

/** Point the calendar at the current selection (or today). */
function prepare() {
  today.value = toDay(startOfToday())
  const anchor = startDay.value ?? today.value
  direction.value = 1
  focusDay.value = anchor
  viewMonth.value = toMonth(fromDay(anchor))
  if (endDay.value !== null)
    viewMonth.value = Math.max(viewMonth.value, toMonth(fromDay(endDay.value)) - props.months + 1)
  return anchor
}

watch(open, (isOpen) => {
  if (isOpen) {
    const anchor = prepare()
    document.addEventListener('pointerdown', onDocPointerDown)
    // Let the popover mount, then put focus on the active day.
    nextTick(() => focusCell(anchor))
  }
  else {
    document.removeEventListener('pointerdown', onDocPointerDown)
  }
})

// When the range changes while open (async load, a click past the edge), keep it in view.
watch([startDay, endDay], ([s, e]) => {
  if (!open.value || s === null || selecting.value)
    return
  const last = viewMonth.value + props.months - 1
  const sm = toMonth(fromDay(s))
  const em = toMonth(fromDay(e ?? s))
  if (sm < viewMonth.value || em > last)
    showMonth(Math.max(sm, em - props.months + 1))
})

// The calendar depends on "today", so it only renders on the client (no SSR
// hydration mismatch). If it starts open, show the right months without
// stealing focus.
const mounted = ref(false)
onMounted(() => {
  prepare()
  mounted.value = true
  if (open.value)
    document.addEventListener('pointerdown', onDocPointerDown)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined')
    document.removeEventListener('pointerdown', onDocPointerDown)
})

const slideVariants = {
  enter: (dir: number) => ({ x: `${dir * 45}%`, opacity: 0 }),
  center: { x: '0%', opacity: 1 },
  exit: (dir: number) => ({ x: `${dir * -45}%`, opacity: 0 }),
}
</script>

<template>
  <div
    ref="root"
    :class="cn('relative inline-block', props.class)"
    @focusout="onFocusOut"
  >
    <button
      ref="trigger"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-controls="`${uid}-popover`"
      class="inline-flex h-10 min-w-64 items-center gap-2.5 rounded-lg border bg-background px-3 text-left text-sm shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @click="open ? close() : (open = true)"
    >
      <svg class="size-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
      <span class="flex-1 truncate" :class="label ? 'text-foreground' : 'text-muted-foreground'">
        {{ label || props.placeholder }}
      </span>
      <motion.svg
        class="size-4 shrink-0 text-muted-foreground"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        :animate="{ rotate: open ? 180 : 0 }"
        :transition="spring"
      >
        <path d="m6 9 6 6 6-6" />
      </motion.svg>
    </button>

    <AnimatePresence>
      <motion.div
        v-if="open && mounted"
        :id="`${uid}-popover`"
        key="popover"
        role="dialog"
        aria-label="Choose a date range"
        :class="cn(
          'absolute top-full z-50 mt-2 flex origin-top overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl',
          props.align === 'start' && 'left-0',
          props.align === 'center' && 'left-1/2 -translate-x-1/2',
          props.align === 'end' && 'right-0',
        )"
        :initial="{ opacity: 0, y: -6, scale: 0.97 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :exit="{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }"
        :transition="{ type: 'spring', stiffness: 460, damping: 34 }"
        @keydown.escape.stop.prevent="close()"
      >
        <!-- Presets -->
        <div
          v-if="props.presets.length"
          role="group"
          aria-label="Presets"
          class="flex w-[7.25rem] shrink-0 flex-col gap-0.5 border-r bg-muted/40 p-2"
        >
          <button
            v-for="preset in props.presets"
            :key="preset.label"
            type="button"
            :aria-pressed="isActivePreset(preset)"
            class="relative rounded-md px-2.5 py-1.5 text-left text-[13px] outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :class="isActivePreset(preset) ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="applyPreset(preset)"
          >
            <motion.span
              v-if="isActivePreset(preset)"
              :layout-id="`${uid}-preset`"
              aria-hidden="true"
              class="absolute inset-0 -z-0 rounded-md bg-background shadow-sm ring-1 ring-border/70"
              :transition="spring"
            />
            <span class="relative">{{ preset.label }}</span>
          </button>
        </div>

        <div class="p-3">
          <!-- Months -->
          <div
            ref="views"
            class="relative overflow-hidden"
            :style="{ width: `${viewsWidth}px`, height: `${32 + 8 + 24 + CELL * 6}px` }"
          >
            <span class="sr-only" aria-live="polite">{{ liveTitle }}</span>
            <button
              type="button"
              aria-label="Previous month"
              class="absolute left-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @click="showMonth(viewMonth - 1)"
            >
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button
              type="button"
              aria-label="Next month"
              class="absolute right-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @click="showMonth(viewMonth + 1)"
            >
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>

            <AnimatePresence :initial="false" :custom="direction">
              <motion.div
                :key="viewMonth"
                :data-view="viewMonth"
                class="absolute inset-0 flex"
                :style="{ gap: `${MONTH_GAP}px` }"
                :custom="direction"
                :variants="slideVariants"
                initial="enter"
                animate="center"
                exit="exit"
                :transition="reduced ? { duration: 0 } : slide"
              >
                <div v-for="m in visible" :key="m.month" class="shrink-0" :style="{ width: `${CELL * 7}px` }">
                  <div :id="`${uid}-m${m.month}`" class="flex h-8 items-center justify-center text-sm font-medium">
                    {{ m.title }}
                  </div>
                  <div
                    role="grid"
                    :aria-labelledby="`${uid}-m${m.month}`"
                    class="mt-2"
                    @keydown="onGridKeydown"
                    @pointerleave="selecting && (hoverDay = null)"
                  >
                    <div role="row" class="grid h-6 grid-cols-7">
                      <abbr
                        v-for="w in weekdays"
                        :key="w.long"
                        role="columnheader"
                        :title="w.long"
                        class="flex items-center justify-center text-[11px] font-medium text-muted-foreground no-underline"
                      >{{ w.short }}</abbr>
                    </div>
                    <div v-for="(row, r) in m.rows" :key="r" role="row" class="relative grid grid-cols-7" :style="{ height: `${CELL}px` }">
                      <!-- The range band for this week: slides / stretches as the range changes -->
                      <AnimatePresence>
                        <motion.div
                          v-if="row.segment"
                          key="band"
                          aria-hidden="true"
                          :class="cn(
                            'absolute inset-y-0.5 left-0 rounded-md',
                            selecting ? 'bg-primary/[0.07] ring-1 ring-inset ring-primary/15' : 'bg-primary/10',
                            row.segment.roundStart && 'rounded-l-full',
                            row.segment.roundEnd && 'rounded-r-full',
                          )"
                          :initial="{ opacity: 0, x: row.segment.x, width: CELL / 2 }"
                          :animate="{ opacity: 1, x: row.segment.x, width: row.segment.width }"
                          :exit="{ opacity: 0, transition: { duration: 0.12 } }"
                          :transition="reduced ? { duration: 0 } : spring"
                        />
                      </AnimatePresence>
                      <div
                        v-for="(day, c) in row.days"
                        :key="c"
                        role="gridcell"
                        :aria-selected="day !== null && inBand(day) && !selecting"
                        class="relative flex items-center justify-center"
                      >
                        <button
                          v-if="day !== null"
                          type="button"
                          :data-day="day"
                          :tabindex="day === focusDay ? 0 : -1"
                          :disabled="isDisabled(day)"
                          :aria-label="fmtFull.format(fromDay(day))"
                          :aria-current="day === today ? 'date' : undefined"
                          :class="cn(
                            'relative inline-flex size-8 items-center justify-center rounded-full text-[13px] tabular-nums outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:text-muted-foreground/40',
                            isEndpoint(day)
                              ? 'font-medium text-primary-foreground'
                              : inBand(day) ? 'text-foreground hover:bg-primary/10' : 'text-foreground hover:bg-muted',
                          )"
                          @click="select(day)"
                          @pointerenter="selecting && (hoverDay = day)"
                          @focus="focusDay = day"
                        >
                          <AnimatePresence>
                            <motion.span
                              v-if="isEndpoint(day)"
                              key="cap"
                              aria-hidden="true"
                              class="absolute inset-0 rounded-full bg-primary shadow-sm"
                              :initial="{ scale: 0.4, opacity: 0 }"
                              :animate="{ scale: 1, opacity: 1 }"
                              :exit="{ scale: 0.6, opacity: 0, transition: { duration: 0.1 } }"
                              :transition="{ type: 'spring', stiffness: 600, damping: 30 }"
                            />
                          </AnimatePresence>
                          <span class="relative">{{ dayNumber(day) }}</span>
                          <span
                            v-if="day === today && !isEndpoint(day)"
                            aria-hidden="true"
                            class="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <!-- Footer -->
          <div class="mt-3 flex items-center justify-between gap-3 border-t pt-3">
            <p class="m-0 text-xs text-muted-foreground" aria-live="polite">
              {{ summary }}
            </p>
            <div class="flex gap-1.5">
              <button
                type="button"
                class="h-8 rounded-md px-3 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                @click="clear"
              >
                Clear
              </button>
              <button
                type="button"
                class="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                @click="close()"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
