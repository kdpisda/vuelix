---
title: Bar Chart
description: "Grouped, stacked or horizontal bars that spring up in a stagger and glide between layouts."
---

<script setup>
import Demo from '../demos/BarChartDemo.vue'
</script>

# Bar Chart

Grouped, stacked or horizontal bars that spring up in a stagger and glide between layouts.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/BarChartDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="bar-chart" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Copy the [Chart Utils](/charts/chart-utils) files into `components/ui/chart-utils/`, then copy these files into `components/ui/bar-chart/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/bar-chart/BarChart.vue [BarChart.vue]
<<< @/../registry/ui/bar-chart/types.ts [types.ts]
<<< @/../registry/ui/bar-chart/index.ts [index.ts]
:::
::::

## Usage

```ts
import { BarChart } from '@/components/ui/bar-chart'
```

```vue
<BarChart
  :labels="['Jan', 'Feb', 'Mar']"
  :series="[
    { name: 'Desktop', data: [186, 305, 237] },
    { name: 'Mobile', data: [80, 200, 120] },
  ]"
  mode="stacked"
  show-values
/>
```

Bars grow from the baseline with a staggered spring on first render. Afterwards, changing `series`, `mode` or `orientation` animates every bar straight to its new geometry. Hovering a category dims the others; with focus on the chart, arrow keys step through categories.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `labels` | `string[]` | — | Categories. |
| `series` | `BarChartSeries[]` | — | `{ name, data: number[], color? }` per series. |
| `mode` | `'grouped' \| 'stacked'` | `'grouped'` | Side by side or stacked. |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Horizontal puts categories on the y-axis. |
| `height` | `number` | `280` | Height in px; width fills the container. |
| `showValues` | `boolean` | `false` | Value at the end of each bar (the total for stacks). |
| `showGrid` | `boolean` | `true` | Grid lines along the value axis. |
| `showLegend` | `boolean` | more than one series | Legend with toggle buttons. |
| `ticks` | `number` | `5` | Approximate number of value-axis ticks. |
| `radius` | `number` | `4` | Bar corner radius. |
| `formatValue` | `(v: number) => string` | `1,234.5` | Tooltip / value-label format. |
| `formatAxis` | `(v: number) => string` | `1.2K` | Axis tick format. |
