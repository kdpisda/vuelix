---
title: Bump Chart
description: "Rankings over time as curved lanes that draw in; hover one to bring it forward and dim the rest."
---

<script setup>
import Demo from '../demos/BumpChartDemo.vue'
</script>

# Bump Chart

Rankings over time as curved lanes that draw in; hover one to bring it forward and dim the rest.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/BumpChartDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="bump-chart" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Copy the [Chart Utils](/charts/chart-utils) files into `components/ui/chart-utils/`, then copy these files into `components/ui/bump-chart/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/bump-chart/BumpChart.vue [BumpChart.vue]
<<< @/../registry/ui/bump-chart/types.ts [types.ts]
<<< @/../registry/ui/bump-chart/index.ts [index.ts]
:::
::::

## Usage

```ts
import { BumpChart } from '@/components/ui/bump-chart'
```

```vue
<BumpChart
  :labels="['Q1', 'Q2', 'Q3']"
  :series="[
    { name: 'Alpha', ranks: [1, 2, 1] },
    { name: 'Beta', ranks: [2, 1, 3] },
    { name: 'Gamma', ranks: [3, 3, 2] },
  ]"
/>
```

Each lane is an S-curve between rank positions, drawn in from left to right with its rank dots popping in as the line passes them. Hover a lane, a dot or a name to highlight it; dots show a tooltip with the change since the previous period. With the chart focused, <kbd>↑</kbd> <kbd>↓</kbd> walk the ranking and <kbd>←</kbd> <kbd>→</kbd> move through periods. New `ranks` slide every lane to its new position.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `labels` | `string[]` | — | Periods along the x-axis. |
| `series` | `BumpChartSeries[]` | — | `{ name, ranks: number[], color? }`; rank 1 is the top row. |
| `rowHeight` | `number` | `40` | Height of one rank row in px (sets the chart height). |
| `duration` | `number` | `1.2` | Draw-in seconds (skipped with reduced motion). |
