<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { DonutChartDatum } from './types'
import { motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'
import { chartColor, useElementWidth, useTween } from '@/ui/chart-utils'
import { NumberTicker } from '@/ui/number-ticker'

const props = withDefaults(defineProps<{
  data: DonutChartDatum[]
  /** Largest diameter in px; shrinks to fit narrow containers. */
  size?: number
  /** Ring thickness in px. */
  thickness?: number
  /** Gap between segments in degrees. */
  padAngle?: number
  /** Round segment ends. */
  rounded?: boolean
  /** Caption under the total when nothing is hovered. */
  centerLabel?: string
  showLegend?: boolean
  /** Seconds for the full sweep-in. */
  duration?: number
  /** Number format for the centre readout. */
  format?: Intl.NumberFormatOptions
  class?: HTMLAttributes['class']
}>(), {
  size: 240,
  thickness: 26,
  padAngle: 2.5,
  rounded: true,
  centerLabel: 'Total',
  showLegend: true,
  duration: 1.1,
})

const EXPAND = 8
const GROW = { type: 'spring', stiffness: 420, damping: 26 } as const

const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const available = useElementWidth(root, props.size)
const diameter = computed(() => Math.max(120, Math.min(props.size, available.value)))
const radius = computed(() => diameter.value / 2 - (props.thickness + EXPAND) / 2 - 1)

// Until the sweep finishes, each segment fades in exactly when its sweep starts
// (otherwise a round cap would show as a dot early).
const revealed = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => (timer = setTimeout(() => (revealed.value = true), props.duration * 1000 + 100)))
onBeforeUnmount(() => clearTimeout(timer))

const values = useTween(() => props.data.map(d => Math.max(0, d.value)), { reduced })
const total = computed(() => props.data.reduce((s, d) => s + Math.max(0, d.value), 0))
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })

function point(angle: number) {
  const c = diameter.value / 2
  return `${c + radius.value * Math.cos(angle)},${c + radius.value * Math.sin(angle)}`
}

const segments = computed(() => {
  const vals = values.value
  const sum = vals.reduce((s, v) => s + v, 0) || 1
  const r = radius.value
  const pad = (props.padAngle * Math.PI) / 180
  // Round caps poke out by half the stroke; pull the ends in so the gaps stay even.
  const cap = props.rounded ? props.thickness / 2 / r : 0
  let angle = -Math.PI / 2
  let elapsed = 0
  return props.data.map((d, i) => {
    const share = (vals[i] ?? 0) / sum
    const a0 = angle
    const a1 = angle + share * Math.PI * 2
    angle = a1
    let s = a0 + pad / 2 + cap
    let e = a1 - pad / 2 - cap
    if (props.data.length === 1) {
      s = a0 + 0.0001
      e = a1 - 0.0001
    }
    if (e < s)
      s = e = (a0 + a1) / 2
    const large = e - s > Math.PI ? 1 : 0
    const path = `M${point(s)}A${r},${r} 0 ${large} 1 ${point(e === s ? e + 0.0001 : e)}`
    const delay = elapsed * props.duration
    elapsed += share
    return {
      label: d.label,
      value: d.value,
      share: total.value ? Math.max(0, d.value) / total.value : 0,
      color: d.color ?? chartColor(i),
      path,
      delay,
      span: Math.max(0.08, share * props.duration),
    }
  })
})

const active = ref<number | null>(null)
const current = computed(() => (active.value === null ? null : segments.value[active.value] ?? null))
const summary = computed(() =>
  `Donut chart, total ${total.value}: ${segments.value.map(s => `${s.label} ${percent.format(s.share)}`).join(', ')}`)
</script>

<template>
  <div
    ref="root"
    :class="cn('flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10', props.class)"
  >
    <div class="relative shrink-0" :style="{ width: `${diameter}px`, height: `${diameter}px` }">
      <svg
        :width="diameter"
        :height="diameter"
        :viewBox="`0 0 ${diameter} ${diameter}`"
        role="img"
        :aria-label="summary"
        class="block overflow-visible"
        @pointerleave="active = null"
        @mousedown.prevent
      >
        <circle
          :cx="diameter / 2"
          :cy="diameter / 2"
          :r="radius"
          fill="none"
          class="stroke-muted"
          :stroke-width="props.thickness"
          opacity="0.5"
        />
        <motion.path
          v-for="(s, i) in segments"
          :key="i"
          :d="s.path"
          fill="none"
          :style="{ stroke: s.color }"
          :stroke-linecap="props.rounded ? 'round' : 'butt'"
          class="cursor-pointer"
          :initial="reduced ? false : { pathLength: 0, opacity: 0, strokeWidth: props.thickness }"
          :animate="{
            pathLength: 1,
            opacity: active === null || active === i ? 1 : 0.35,
            strokeWidth: active === i ? props.thickness + EXPAND : props.thickness,
          }"
          :transition="{
            pathLength: { duration: s.span, delay: s.delay, ease: 'linear' },
            opacity: { duration: revealed ? 0.2 : 0.05, delay: revealed ? 0 : s.delay },
            strokeWidth: GROW,
          }"
          @pointerenter="active = i"
        />
      </svg>

      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
        <span class="max-w-[60%] truncate text-xs text-muted-foreground">
          {{ current ? current.label : props.centerLabel }}
        </span>
        <NumberTicker
          :value="current ? current.value : total"
          :format="props.format"
          locale="en-US"
          :start-on-view="false"
          :stiffness="220"
          :damping="28"
          class="text-2xl font-semibold"
        />
        <span class="h-4 text-xs tabular-nums text-muted-foreground">
          {{ current ? percent.format(current.share) : '' }}
        </span>
      </div>
    </div>

    <ul v-if="props.showLegend" class="m-0 grid w-full max-w-60 list-none gap-0.5 p-0">
      <li v-for="(s, i) in segments" :key="i">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-[background-color,opacity] focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :class="[
            active === i ? 'bg-muted' : '',
            active !== null && active !== i ? 'opacity-50' : '',
          ]"
          @pointerenter="active = i"
          @pointerleave="active = null"
          @focus="active = i"
          @blur="active = null"
        >
          <span class="size-2.5 shrink-0 rounded-full" :style="{ background: s.color }" />
          <span class="truncate">{{ s.label }}</span>
          <span class="ml-auto pl-3 text-xs tabular-nums text-muted-foreground">{{ percent.format(s.share) }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
