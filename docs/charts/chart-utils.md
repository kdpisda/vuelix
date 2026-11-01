---
title: Chart Utils
description: "Shared chart helpers: nice ticks, scales, monotone paths, tweened values and a clamped tooltip."
---

# Chart Utils

Shared chart helpers: nice ticks, scales, monotone paths, tweened values and a clamped tooltip.

The vuelix charts are plain SVG with a little maths. Everything they have in common lives here, so you can build your own chart with the same feel. `shadcn-vue add` installs it automatically with any chart that needs it.

## Installation

<InstallTabs name="chart-utils" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/chart-utils/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/chart-utils/utils.ts [utils.ts]
<<< @/../registry/ui/chart-utils/ChartTooltip.vue [ChartTooltip.vue]
<<< @/../registry/ui/chart-utils/index.ts [index.ts]
:::
::::

## Usage

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChartTooltip, linearScale, monotonePath, niceTicks, useElementWidth, useTween } from '@/components/ui/chart-utils'

const props = defineProps<{ data: number[] }>()
const root = ref<HTMLElement>()
const width = useElementWidth(root) // 640 on the server, then the real width
const values = useTween(() => props.data) // morphs whenever data changes

const axis = computed(() => niceTicks(0, Math.max(...props.data))) // { ticks, min, max, step }
const path = computed(() => {
  const y = linearScale([axis.value.min, axis.value.max], [200, 0])
  return monotonePath(values.value.map((v, i) => [(i / (values.value.length - 1)) * width.value, y(v)]))
})
</script>

<template>
  <div ref="root" class="relative">
    <svg :width="width" height="200">
      <path :d="path" fill="none" stroke="var(--chart-1)" />
    </svg>
  </div>
</template>
```

## API

| Export | Signature | Description |
| --- | --- | --- |
| `linearScale` | `(domain, range) => scale` | Maps numbers to pixels; `scale.invert(px)` goes back. |
| `niceTicks` | `(min, max, count = 5) => { ticks, min, max, step }` | Round tick values (steps of 1, 2, 5 × 10ⁿ) and a domain widened to land on them. |
| `monotonePath` | `(points) => string` | Smooth cubic path through `[x, y]` points that never overshoots the data. |
| `linearPath` | `(points) => string` | Straight segments. |
| `areaPath` | `(line, points, baseline) => string` | Closes a line path down to a baseline. |
| `chartColor` | `(i) => string` | `var(--chart-1…5)`, cycling. |
| `formatCompact` | `(n) => string` | `12345 → "12.3K"`, fixed `en-US` locale so SSR and client match. |
| `resample` | `(values, length) => number[]` | Stretches a series to a new length by interpolation. |
| `clamp` | `(v, min, max) => number` | Clamps a number. |
| `useElementWidth` | `(el, fallback = 640) => Ref<number>` | Container width via `ResizeObserver` (SSR-safe). |
| `useTween` | `(source, { duration?, reduced? }) => Ref<number[]>` | Interpolates a flat number array whenever `source()` changes; arrays of a new length are resampled first. |

### ChartTooltip

An absolutely positioned tooltip for a `relative` chart wrapper. It measures itself, stays inside `bounds`, flips when there's no room and glides between anchors.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Show / hide (animated). |
| `x / y` | `number` | — | Anchor in px, relative to the wrapper. |
| `bounds` | `{ width, height }` | — | Area the tooltip is clamped to. |
| `placement` | `'top' \| 'bottom' \| 'side'` | `'top'` | Preferred side of the anchor. |
| `offset` | `number` | `12` | Gap between anchor and tooltip. |
