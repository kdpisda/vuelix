<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion } from 'motion-v'
import { computed, useId } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  /** Smooth the line with a monotone curve. */
  smooth?: boolean
  /** Fill the area under the line with a fading gradient. */
  area?: boolean
  /** Show a pulsing dot on the last value. */
  showEnd?: boolean
  /** Seconds for the draw-in animation. */
  duration?: number
  class?: HTMLAttributes['class']
}>(), {
  width: 160,
  height: 48,
  strokeWidth: 2,
  smooth: true,
  area: true,
  showEnd: true,
  duration: 1.2,
})

const gradientId = `vx-spark-${useId()}`
const pad = computed(() => props.strokeWidth + 3)

const points = computed(() => {
  const d = props.data
  if (d.length < 2)
    return [] as [number, number][]
  const min = Math.min(...d)
  const max = Math.max(...d)
  const range = max - min || 1
  const w = props.width - pad.value * 2
  const h = props.height - pad.value * 2
  return d.map((v, i) => [
    pad.value + (i / (d.length - 1)) * w,
    pad.value + h - ((v - min) / range) * h,
  ] as [number, number])
})

// Monotone cubic interpolation (Fritsch–Carlson) — never overshoots the data.
function monotonePath(p: [number, number][]) {
  const n = p.length
  const dx: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1]![0] - p[i]![0]
    m[i] = (p[i + 1]![1] - p[i]![1]) / dx[i]!
  }
  const t: number[] = [m[0]!]
  for (let i = 1; i < n - 1; i++)
    t[i] = m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2
  t[n - 1] = m[n - 2]!
  let path = `M${p[0]![0]},${p[0]![1]}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i]! / 3
    path += ` C${p[i]![0] + h},${p[i]![1] + t[i]! * h} ${p[i + 1]![0] - h},${p[i + 1]![1] - t[i + 1]! * h} ${p[i + 1]![0]},${p[i + 1]![1]}`
  }
  return path
}

const line = computed(() => {
  const p = points.value
  if (!p.length)
    return ''
  return props.smooth ? monotonePath(p) : `M${p.map(([x, y]) => `${x},${y}`).join(' L')}`
})

const fill = computed(() => {
  const p = points.value
  if (!p.length)
    return ''
  const bottom = props.height
  return `${line.value} L${p.at(-1)![0]},${bottom} L${p[0]![0]},${bottom} Z`
})

const last = computed(() => points.value.at(-1))
const trend = computed(() => {
  const d = props.data
  return d.length > 1 && d.at(-1)! < d[0]! ? 'down' : 'up'
})
</script>

<template>
  <svg
    :width="props.width"
    :height="props.height"
    :viewBox="`0 0 ${props.width} ${props.height}`"
    role="img"
    :aria-label="`Trend ${trend}, latest value ${props.data.at(-1)}`"
    :class="cn('overflow-visible text-brand', props.class)"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.3" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
    <motion.path
      v-if="props.area && fill"
      :key="`a-${fill}`"
      :d="fill"
      :fill="`url(#${gradientId})`"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ duration: props.duration * 0.6, delay: props.duration * 0.5 }"
    />
    <motion.path
      v-if="line"
      :key="`l-${line}`"
      :d="line"
      fill="none"
      stroke="currentColor"
      :stroke-width="props.strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      :initial="{ pathLength: 0 }"
      :animate="{ pathLength: 1 }"
      :transition="{ duration: props.duration, ease: [0.65, 0, 0.35, 1] }"
    />
    <g v-if="props.showEnd && last">
      <motion.circle
        :cx="last[0]"
        :cy="last[1]"
        r="6"
        fill="currentColor"
        :initial="{ opacity: 0, scale: 0.6 }"
        :animate="{ opacity: [0.35, 0], scale: [0.6, 1.6] }"
        :transition="{ duration: 1.6, repeat: Infinity, delay: props.duration }"
      />
      <motion.circle
        :cx="last[0]"
        :cy="last[1]"
        :r="props.strokeWidth + 1"
        fill="currentColor"
        :initial="{ scale: 0 }"
        :animate="{ scale: 1 }"
        :transition="{ type: 'spring', stiffness: 500, damping: 20, delay: props.duration * 0.9 }"
      />
    </g>
  </svg>
</template>
