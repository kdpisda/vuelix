---
title: Line Chart
description: "Multi-series line or area chart that draws in, morphs on new data and tracks a snapping crosshair."
---

<script setup>
import Demo from '../demos/LineChartDemo.vue'
</script>

# Line Chart

Multi-series line or area chart that draws in, morphs on new data and tracks a snapping crosshair.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/LineChartDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="line-chart" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Copy the [Chart Utils](/charts/chart-utils) files into `components/ui/chart-utils/`, then copy these files into `components/ui/line-chart/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/line-chart/LineChart.vue [LineChart.vue]
<<< @/../registry/ui/line-chart/types.ts [types.ts]
<<< @/../registry/ui/line-chart/index.ts [index.ts]
:::
::::

## Usage

```ts
import { LineChart } from '@/components/ui/line-chart'
```

```vue
<LineChart
  :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri']"
  :series="[
    { name: 'Visits', data: [120, 180, 150, 220, 260] },
    { name: 'Signups', data: [12, 30, 22, 41, 38] },
  ]"
  area
/>
```

Hover (or focus the chart and use <kbd>←</kbd> <kbd>→</kbd> <kbd>Home</kbd> <kbd>End</kbd>) to move the crosshair. Click a legend entry to hide a series — the y-axis rescales smoothly. Passing new `series` morphs every line from its old shape to the new one.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `labels` | `string[]` | — | X-axis categories, one per point. |
| `series` | `LineChartSeries[]` | — | `{ name, data: number[], color? }` per line. |
| `height` | `number` | `280` | Height in px; width fills the container. |
| `area` | `boolean` | `false` | Gradient fill under each line. |
| `curve` | `'monotone' \| 'linear'` | `'monotone'` | Smoothing (monotone never overshoots). |
| `yTicks` | `number` | `5` | Approximate number of y ticks (rounded to nice steps). |
| `showGrid` | `boolean` | `true` | Horizontal grid lines. |
| `showLegend` | `boolean` | more than one series | Legend with toggle buttons. |
| `showDots` | `boolean` | `false` | A dot on every data point. |
| `duration` | `number` | `1.2` | Draw-in seconds (skipped with reduced motion). |
| `formatValue` | `(v: number) => string` | `1,234.5` | Tooltip value format. |
| `formatAxis` | `(v: number) => string` | `1.2K` | Y-axis tick format. |

Series colours default to the `--chart-1` … `--chart-5` theme tokens.
