<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { StatusHistoryEntry, StatusHistoryStatus } from './types'
import { motion, useReducedMotion } from 'motion-v'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { ChartTooltip, useElementWidth } from '@/ui/chart-utils'
import { NumberTicker } from '@/ui/number-ticker'

const props = withDefaults(defineProps<{
  /** Oldest first, one entry per period (day, hour…). */
  data: StatusHistoryEntry[]
  /** Name shown in the header, e.g. the service. */
  title?: string
  /** Bar height in px. */
  barHeight?: number
  /** Caption under the first bar. Defaults to "{n} days ago". */
  startLabel?: string
  /** Caption under the last bar. */
  endLabel?: string
  /** Override the words used for each status. */
  statusLabels?: Partial<Record<StatusHistoryStatus, string>>
  class?: HTMLAttributes['class']
}>(), {
  barHeight: 36,
  endLabel: 'Today',
})

const POP = { type: 'spring', stiffness: 380, damping: 22 } as const

const STATUS_CLASS: Record<StatusHistoryStatus, string> = {
  ok: 'bg-chart-1',
  degraded: 'bg-chart-4',
  down: 'bg-destructive',
  unknown: 'bg-muted',
}
const DEFAULT_LABELS: Record<StatusHistoryStatus, string> = {
  ok: 'Operational',
  degraded: 'Degraded',
  down: 'Outage',
  unknown: 'No data',
}

const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const width = useElementWidth(root)
const bars = ref<HTMLElement>()
// Re-read on resize: the header can wrap and push the bars down.
const barsTop = computed(() => (width.value, bars.value?.offsetTop ?? 32))
const words = computed(() => ({ ...DEFAULT_LABELS, ...props.statusLabels }))
const pct = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

/** Uptime of one period: the explicit value, or 100 / 0 inferred from its status. */
const uptimeOf = (e: StatusHistoryEntry) =>
  e.uptime ?? (e.status === 'down' ? 0 : e.status === 'unknown' ? null : 100)

const overall = computed(() => {
  const known = props.data.map(uptimeOf).filter((u): u is number => u !== null)
  return known.length ? known.reduce((s, u) => s + u, 0) / known.length : 0
})
const incidents = computed(() => props.data.filter(e => e.status === 'down' || e.status === 'degraded').length)
const latest = computed<StatusHistoryStatus>(() => props.data.at(-1)?.status ?? 'unknown')

const active = ref<number | null>(null)
const current = computed(() => (active.value === null ? null : props.data[active.value] ?? null))
const gap = computed(() => (width.value / Math.max(1, props.data.length) > 7 ? 3 : 2))
const barX = (i: number) => {
  const n = Math.max(1, props.data.length)
  const w = (width.value - gap.value * (n - 1)) / n
  return i * (w + gap.value) + w / 2
}

// Hit-test by x so the gaps between bars still count as hovering the nearest bar.
function onPointer(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const n = props.data.length
  if (!n || !rect.width)
    return
  active.value = Math.min(n - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * n)))
}

function onKey(event: KeyboardEvent) {
  const last = props.data.length - 1
  const cur = active.value
  const next = {
    ArrowRight: cur === null ? last : Math.min(last, cur + 1),
    ArrowLeft: cur === null ? last : Math.max(0, cur - 1),
    Home: 0,
    End: last,
  }[event.key]
  if (next !== undefined) {
    event.preventDefault()
    active.value = next
  }
  else if (event.key === 'Escape') {
    active.value = null
  }
}

const summary = computed(() =>
  `${props.title ? `${props.title}: ` : ''}${pct.format(overall.value)}% uptime over ${props.data.length} periods, ${incidents.value} with incidents. Use arrow keys to inspect periods.`)
const announcement = computed(() => {
  const e = current.value
  if (!e)
    return ''
  const u = uptimeOf(e)
  return `${e.label}: ${words.value[e.status]}${u === null ? '' : `, ${pct.format(u)}% uptime`}${e.note ? `. ${e.note}` : ''}`
})
</script>

<template>
  <div ref="root" :class="cn('relative w-full select-none', props.class)">
    <div class="mb-3 flex items-baseline justify-between gap-4">
      <div class="flex min-w-0 items-center gap-2">
        <span class="relative flex size-2.5 shrink-0">
          <span
            v-if="latest !== 'ok'"
            class="absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping"
            :class="STATUS_CLASS[latest]"
          />
          <span class="relative size-2.5 rounded-full" :class="STATUS_CLASS[latest]" />
        </span>
        <span class="truncate text-sm font-medium">{{ props.title }}</span>
      </div>
      <div class="flex shrink-0 items-baseline gap-1.5 text-sm">
        <NumberTicker
          :value="overall"
          :format="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
          locale="en-US"
          class="font-semibold"
        />
        <span class="text-muted-foreground">% uptime</span>
      </div>
    </div>

    <div
      ref="bars"
      role="img"
      :aria-label="summary"
      tabindex="0"
      class="flex touch-pan-y items-end rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      :style="{ height: `${props.barHeight}px`, gap: `${gap}px` }"
      @keydown="onKey"
      @blur="active = null"
      @pointermove="onPointer"
      @pointerdown="onPointer"
      @pointerleave="active = null"
    >
      <motion.div
        v-for="(e, i) in props.data"
        :key="i"
        class="h-full min-w-0 flex-1 rounded-full transition-colors duration-300"
        :class="STATUS_CLASS[e.status]"
        :style="{ transformOrigin: '50% 100%' }"
        :initial="reduced ? false : { scaleY: 0, opacity: 0 }"
        :animate="{
          scaleY: active === i ? 1 : active === null ? 1 : 0.86,
          opacity: active === null || active === i ? 1 : 0.45,
        }"
        :transition="{
          scaleY: { ...POP, delay: active === null ? i * 0.008 : 0 },
          opacity: { duration: 0.2, delay: active === null ? i * 0.008 : 0 },
        }"
      />
    </div>

    <div class="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
      <span>{{ props.startLabel ?? `${props.data.length} days ago` }}</span>
      <span class="h-px flex-1 bg-border" />
      <span>{{ incidents === 0 ? 'No incidents' : `${incidents} incident${incidents === 1 ? '' : 's'}` }}</span>
      <span class="h-px flex-1 bg-border" />
      <span>{{ props.endLabel }}</span>
    </div>

    <ChartTooltip
      :open="current !== null"
      :x="active === null ? 0 : barX(active)"
      :y="barsTop + props.barHeight"
      :bounds="{ width, height: barsTop + props.barHeight + 160 }"
      :offset="8"
      placement="bottom"
    >
      <p class="mb-1 font-medium">
        {{ current?.label }}
      </p>
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full" :class="current ? STATUS_CLASS[current.status] : ''" />
        <span>{{ current ? words[current.status] : '' }}</span>
        <span v-if="current && uptimeOf(current) !== null" class="ml-auto pl-4 tabular-nums text-muted-foreground">
          {{ pct.format(uptimeOf(current) ?? 0) }}%
        </span>
      </div>
      <p v-if="current?.note" class="mt-1 max-w-56 whitespace-normal text-muted-foreground">
        {{ current.note }}
      </p>
    </ChartTooltip>

    <p class="sr-only" aria-live="polite">
      {{ announcement }}
    </p>
  </div>
</template>
