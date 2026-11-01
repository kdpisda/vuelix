<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AvailabilityRange, AvailabilityWeek } from './time'
import { AnimatePresence, motion } from 'motion-v'
import { computed, toRaw, useId } from 'vue'
import { cn } from '@/lib/utils'
import AvailabilityGrid from './AvailabilityGrid.vue'
import { dayMinutes, formatTime, toMinutes, toTime } from './time'

const props = withDefaults(defineProps<{
  /** Day labels; the model has one entry per label. */
  days?: string[]
  /** First selectable hour (0–23). */
  startHour?: number
  /** Last selectable hour (1–24). */
  endHour?: number
  /** Minutes between selectable times (15, 30 or 60). */
  step?: number
  /** Show times as 9:00am instead of 09:00. */
  hour12?: boolean
  /** Range added when a day is switched on. */
  defaultRange?: AvailabilityRange
  class?: HTMLAttributes['class']
}>(), {
  days: () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  startHour: 7,
  endHour: 21,
  step: 30,
  hour12: false,
  defaultRange: () => ({ start: '09:00', end: '17:00' }),
})

const week = defineModel<AvailabilityWeek>({ default: () => [] })
const view = defineModel<'list' | 'grid'>('view', { default: 'list' })

const SPRING = { type: 'spring', stiffness: 420, damping: 36 } as const
const uid = useId()

// Make sure there is one entry per day.
const days = computed<AvailabilityWeek>(() => props.days.map((_, i) => week.value[i] ?? { enabled: false, ranges: [] }))

function setDay(i: number, day: AvailabilityWeek[number]) {
  week.value = days.value.map((d, j) => (j === i ? day : d))
}

const options = computed(() => {
  const list: { value: string, label: string }[] = []
  for (let m = props.startHour * 60; m <= props.endHour * 60; m += props.step)
    list.push({ value: toTime(m), label: formatTime(m, props.hour12) })
  return list
})

function toggle(i: number) {
  const day = days.value[i]!
  setDay(i, { enabled: !day.enabled, ranges: day.ranges.length || day.enabled ? day.ranges : [{ ...props.defaultRange }] })
}

function nextRange(i: number): AvailabilityRange | null {
  const day = days.value[i]!
  const limit = props.endHour * 60
  const last = day.ranges.reduce((max, r) => Math.max(max, toMinutes(r.end)), 0)
  if (!day.ranges.length)
    return { ...props.defaultRange }
  const start = last + 60
  if (start + props.step > limit)
    return null
  return { start: toTime(start), end: toTime(Math.min(limit, start + 60)) }
}

function addRange(i: number) {
  const range = nextRange(i)
  if (range)
    setDay(i, { enabled: true, ranges: [...days.value[i]!.ranges, range] })
}

function removeRange(i: number, r: number) {
  const ranges = days.value[i]!.ranges.filter((_, j) => j !== r)
  setDay(i, { enabled: ranges.length > 0, ranges })
}

function updateRange(i: number, r: number, patch: Partial<AvailabilityRange>) {
  setDay(i, {
    ...days.value[i]!,
    ranges: days.value[i]!.ranges.map((range, j) => {
      if (j !== r)
        return range
      const updated = { ...range, ...patch }
      keys.set(updated, keyOf(range)) // keep the row's identity while editing
      return updated
    }),
  })
}

function rangeError(i: number, r: number) {
  const ranges = days.value[i]!.ranges
  const a = ranges[r]!
  if (toMinutes(a.end) <= toMinutes(a.start))
    return 'End must be after start'
  const overlaps = ranges.some((b, j) => j !== r && toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end))
  return overlaps ? 'Overlaps another range' : ''
}

// Stable keys for ranges so add/remove animates the right row.
const keys = new WeakMap<AvailabilityRange, number>()
let seq = 0
function keyOf(range: AvailabilityRange) {
  const raw = toRaw(range)
  if (!keys.has(raw))
    keys.set(raw, ++seq)
  return keys.get(raw)!
}

const totalMinutes = computed(() => days.value.reduce((sum, d) => sum + dayMinutes(d), 0))
const totalHours = computed(() => Math.round((totalMinutes.value / 60) * 10) / 10)
const activeDays = computed(() => days.value.filter(d => dayMinutes(d) > 0).length)
const perDay = computed(() => days.value.map(d => dayMinutes(d)))
const maxDay = computed(() => Math.max(60, ...perDay.value))

function onViewKey(e: KeyboardEvent) {
  if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
    view.value = view.value === 'list' ? 'grid' : 'list'
    ;(e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-view="${view.value}"]`)?.focus()
  }
}
</script>

<template>
  <div :class="cn('@container w-full rounded-2xl border bg-card p-4 text-card-foreground shadow-sm sm:p-5', props.class)">
    <!-- Summary + view switch -->
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="m-0 text-xs font-medium text-muted-foreground">
          Weekly availability
        </p>
        <p class="m-0 mt-0.5 flex items-baseline gap-1.5" aria-live="polite">
          <span class="relative inline-flex overflow-hidden text-2xl font-semibold tabular-nums tracking-tight">
            <AnimatePresence mode="popLayout" :initial="false">
              <motion.span
                :key="totalHours"
                :initial="{ y: 16, opacity: 0 }"
                :animate="{ y: 0, opacity: 1 }"
                :exit="{ y: -16, opacity: 0 }"
                :transition="SPRING"
              >
                {{ totalHours }}
              </motion.span>
            </AnimatePresence>
          </span>
          <span class="text-sm text-muted-foreground">h / week across {{ activeDays }} {{ activeDays === 1 ? 'day' : 'days' }}</span>
        </p>
      </div>
      <div class="flex items-end gap-3">
        <div class="hidden h-8 items-end gap-1 sm:flex" aria-hidden="true">
          <motion.span
            v-for="(m, i) in perDay"
            :key="i"
            class="w-1.5 rounded-full bg-brand"
            :animate="{ height: `${Math.max(3, (m / maxDay) * 32)}px`, opacity: m ? 1 : 0.25 }"
            :transition="SPRING"
          />
        </div>
        <div role="tablist" aria-label="View" class="flex gap-1 rounded-lg bg-muted p-1" @keydown="onViewKey">
          <button
            v-for="v in (['list', 'grid'] as const)"
            :key="v"
            type="button"
            role="tab"
            :data-view="v"
            :aria-selected="view === v"
            :tabindex="view === v ? 0 : -1"
            :class="cn('relative rounded-md px-2.5 py-1 text-xs font-medium capitalize outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50', view === v ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')"
            @click="view = v"
          >
            <motion.span
              v-if="view === v"
              :layout-id="`vx-avail-view-${uid}`"
              class="absolute inset-0 rounded-md bg-background shadow-sm"
              :transition="SPRING"
            />
            <span class="relative">{{ v }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="mt-4">
      <AnimatePresence mode="wait" :initial="false">
        <!-- List view -->
        <motion.ul
          v-if="view === 'list'"
          key="list"
          class="m-0 list-none divide-y p-0"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.18 }"
        >
          <li v-for="(day, i) in days" :key="props.days[i]" class="flex flex-wrap items-start gap-x-3 py-2.5 @md:flex-nowrap">
            <button
              type="button"
              role="switch"
              :aria-checked="day.enabled"
              :aria-label="`Available on ${props.days[i]}`"
              :class="cn(
                'relative mt-1.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                day.enabled ? 'bg-brand' : 'bg-input',
              )"
              @click="toggle(i)"
            >
              <motion.span
                class="block size-4 rounded-full bg-background shadow-sm"
                :animate="{ x: day.enabled ? 16 : 0 }"
                :transition="{ type: 'spring', stiffness: 700, damping: 30 }"
              />
            </button>
            <span :class="cn('mt-1.5 w-10 shrink-0 text-sm font-medium', !day.enabled && 'text-muted-foreground')">{{ props.days[i] }}</span>

            <p v-if="!day.enabled" class="m-0 mt-1.5 text-sm text-muted-foreground @md:hidden">
              Unavailable
            </p>
            <!-- Narrow containers: ranges wrap onto their own line under the day -->
            <div class="order-last mt-1 w-full min-w-0 @md:order-none @md:mt-0 @md:w-auto @md:flex-1">
              <p v-if="!day.enabled" class="m-0 mt-1.5 hidden text-sm text-muted-foreground @md:block">
                Unavailable
              </p>
              <AnimatePresence :initial="false">
                <motion.div
                  v-for="(range, r) in (day.enabled ? day.ranges : [])"
                  :key="keyOf(range)"
                  class="overflow-hidden"
                  :initial="{ opacity: 0, height: 0 }"
                  :animate="{ opacity: 1, height: 'auto' }"
                  :exit="{ opacity: 0, height: 0 }"
                  :transition="SPRING"
                >
                  <div class="flex items-center gap-2 py-0.5">
                    <label class="relative">
                      <span class="sr-only">{{ props.days[i] }} range {{ r + 1 }} start</span>
                      <select
                        :value="range.start"
                        :aria-invalid="!!rangeError(i, r) || undefined"
                        class="h-8 appearance-none rounded-lg border bg-background py-0 pl-2.5 pr-7 text-sm tabular-nums text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
                        @change="updateRange(i, r, { start: ($event.target as HTMLSelectElement).value })"
                      >
                        <option v-for="o in options.slice(0, -1)" :key="o.value" :value="o.value">{{ o.label }}</option>
                      </select>
                      <svg class="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                    </label>
                    <span class="text-muted-foreground" aria-hidden="true">–</span>
                    <label class="relative">
                      <span class="sr-only">{{ props.days[i] }} range {{ r + 1 }} end</span>
                      <select
                        :value="range.end"
                        :aria-invalid="!!rangeError(i, r) || undefined"
                        class="h-8 appearance-none rounded-lg border bg-background py-0 pl-2.5 pr-7 text-sm tabular-nums text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
                        @change="updateRange(i, r, { end: ($event.target as HTMLSelectElement).value })"
                      >
                        <option v-for="o in options.slice(1)" :key="o.value" :value="o.value">{{ o.label }}</option>
                      </select>
                      <svg class="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                    </label>
                    <button
                      type="button"
                      :aria-label="`Remove ${props.days[i]} ${formatTime(toMinutes(range.start), props.hour12)} to ${formatTime(toMinutes(range.end), props.hour12)}`"
                      class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      @click="removeRange(i, r)"
                    >
                      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <p v-if="rangeError(i, r)" class="m-0 pb-1 text-xs text-destructive">
                    {{ rangeError(i, r) }}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              type="button"
              :aria-label="`Add a time range on ${props.days[i]}`"
              :disabled="!!day.ranges.length && day.enabled && !nextRange(i)"
              class="ml-auto mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
              @click="day.enabled ? addRange(i) : toggle(i)"
            >
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </li>
        </motion.ul>

        <!-- Grid view -->
        <motion.div
          v-else
          key="grid"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.18 }"
        >
          <AvailabilityGrid
            :model-value="days"
            :days="props.days"
            :start-hour="props.startHour"
            :end-hour="props.endHour"
            :step="props.step"
            :hour12="props.hour12"
            @update:model-value="week = $event"
          />
          <p class="m-0 mt-3 text-xs text-muted-foreground">
            Drag to paint availability, drag over painted time to erase. Arrow keys move, Space toggles, Shift + arrows paints.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
</template>
