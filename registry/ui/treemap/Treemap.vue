<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TreemapItem } from './types'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { chartColor, ChartTooltip, formatCompact, useElementWidth } from '@/components/ui/chart-utils'
import { squarify } from './squarify'

const props = withDefaults(defineProps<{
  data: TreemapItem[]
  height?: number
  /** Gap between tiles in px. */
  gap?: number
  /** Tiles narrower or shorter than this (px) hide their label. */
  minLabelSize?: number
  /** Formats values on tiles and in the tooltip. */
  formatValue?: (value: number) => string
  class?: HTMLAttributes['class']
}>(), {
  height: 320,
  gap: 3,
  minLabelSize: 56,
})

const MOVE = { type: 'spring', stiffness: 260, damping: 32 } as const

const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const width = useElementWidth(root)
const fmt = (v: number) => (props.formatValue ?? formatCompact)(v)
const pct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })

const groups = computed(() => [...new Set(props.data.map(d => d.group).filter((g): g is string => !!g))])
const total = computed(() => props.data.reduce((s, d) => s + Math.max(0, d.value), 0))

const tiles = computed(() => {
  const rects = squarify(props.data.map(d => d.value), { x: 0, y: 0, w: width.value, h: props.height })
  const max = Math.max(...props.data.map(d => d.value), 1)
  const half = props.gap / 2
  return props.data
    .map((d, i) => {
      const r = rects[i]!
      const color = d.color ?? chartColor(d.group ? groups.value.indexOf(d.group) : i)
      const w = Math.max(0, r.w - props.gap)
      const h = Math.max(0, r.h - props.gap)
      return {
        key: d.label,
        label: d.label,
        group: d.group,
        value: d.value,
        share: total.value ? d.value / total.value : 0,
        color,
        // Bigger tiles get a stronger tint, so size reads twice.
        tint: Math.round(18 + 34 * Math.sqrt(Math.max(0, d.value) / max)),
        x: r.x + half,
        y: r.y + half,
        w,
        h,
        showLabel: w >= props.minLabelSize && h >= 34,
        showValue: w >= props.minLabelSize && h >= 52,
      }
    })
    .filter(t => t.w > 0 && t.h > 0)
    .sort((a, b) => b.value - a.value)
})

const active = ref<string | null>(null)
const current = computed(() => tiles.value.find(t => t.key === active.value) ?? null)

function onKey(event: KeyboardEvent) {
  const list = tiles.value
  const idx = list.findIndex(t => t.key === active.value)
  let next: number | undefined
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
    next = idx < 0 ? 0 : Math.min(list.length - 1, idx + 1)
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
    next = idx < 0 ? list.length - 1 : Math.max(0, idx - 1)
  else if (event.key === 'Home')
    next = 0
  else if (event.key === 'End')
    next = list.length - 1
  else if (event.key === 'Escape')
    active.value = null
  if (next !== undefined) {
    event.preventDefault()
    active.value = list[next]?.key ?? null
  }
}

const summary = computed(() => {
  const top = tiles.value.slice(0, 3).map(t => `${t.label} ${pct.format(t.share)}`).join(', ')
  return `Treemap of ${tiles.value.length} items, total ${fmt(total.value)}. Largest: ${top}. Use arrow keys to step through items.`
})
const announcement = computed(() => {
  const t = current.value
  return t ? `${t.label}: ${fmt(t.value)}, ${pct.format(t.share)} of total` : ''
})
</script>

<template>
  <div ref="root" :class="cn('relative w-full select-none', props.class)">
    <div
      role="img"
      :aria-label="summary"
      tabindex="0"
      class="relative overflow-hidden rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      :style="{ height: `${props.height}px` }"
      @keydown="onKey"
      @blur="active = null"
      @pointerleave="active = null"
    >
      <AnimatePresence>
        <motion.div
          v-for="(t, i) in tiles"
          :key="t.key"
          class="absolute left-0 top-0 overflow-hidden rounded-md border"
          :style="{
            borderColor: `color-mix(in oklab, ${t.color} ${active === t.key ? 80 : 40}%, transparent)`,
            background: `color-mix(in oklab, ${t.color} ${active === t.key ? t.tint + 16 : t.tint}%, transparent)`,
          }"
          :initial="reduced ? false : { opacity: 0, scale: 0.9, left: t.x, top: t.y, width: t.w, height: t.h }"
          :animate="{ opacity: active === null || active === t.key ? 1 : 0.55, scale: 1, left: t.x, top: t.y, width: t.w, height: t.h }"
          :exit="{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }"
          :transition="{
            default: MOVE,
            opacity: { duration: 0.25, delay: active === null ? Math.min(i, 20) * 0.03 : 0 },
            scale: { ...MOVE, delay: Math.min(i, 20) * 0.03 },
          }"
          @pointerenter="active = t.key"
        >
          <div
            class="pointer-events-none flex h-full flex-col p-2 transition-opacity duration-200"
            :class="t.showLabel ? 'opacity-100' : 'opacity-0'"
          >
            <span class="truncate text-xs font-medium text-foreground">{{ t.label }}</span>
            <span
              class="truncate text-xs tabular-nums text-muted-foreground transition-opacity duration-200"
              :class="t.showValue ? 'opacity-100' : 'opacity-0'"
            >{{ fmt(t.value) }}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>

    <ChartTooltip
      :open="current !== null"
      :x="current ? current.x + current.w / 2 : 0"
      :y="current ? current.y + Math.min(current.h / 2, 28) : 0"
      :bounds="{ width, height: props.height }"
    >
      <div class="mb-1 flex items-center gap-2">
        <span class="size-2 shrink-0 rounded-[3px]" :style="{ background: current?.color }" />
        <span class="font-medium">{{ current?.label }}</span>
      </div>
      <p v-if="current?.group" class="m-0 mb-1 text-muted-foreground">
        {{ current.group }}
      </p>
      <div class="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-muted-foreground">
        <span>Value</span>
        <span class="text-right font-medium tabular-nums text-foreground">{{ fmt(current?.value ?? 0) }}</span>
        <span>Share</span>
        <span class="text-right font-medium tabular-nums text-foreground">{{ pct.format(current?.share ?? 0) }}</span>
      </div>
    </ChartTooltip>

    <p class="sr-only" aria-live="polite">
      {{ announcement }}
    </p>
  </div>
</template>
