---
title: Donut Chart
description: "Rounded ring segments that sweep in; hovering one swells it and counts its value up in the centre."
---

<script setup>
import Demo from '../demos/DonutChartDemo.vue'
</script>

# Donut Chart

Rounded ring segments that sweep in; hovering one swells it and counts its value up in the centre.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/DonutChartDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="donut-chart" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Copy the [Chart Utils](/charts/chart-utils) and [Number Ticker](/components/number-ticker) files into `components/ui/chart-utils/` and `components/ui/number-ticker/`, then copy these files into `components/ui/donut-chart/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/donut-chart/DonutChart.vue [DonutChart.vue]
<<< @/../registry/ui/donut-chart/types.ts [types.ts]
<<< @/../registry/ui/donut-chart/index.ts [index.ts]
:::
::::

## Usage

```ts
import { DonutChart } from '@/components/ui/donut-chart'
```

```vue
<DonutChart
  :data="[
    { label: 'Chrome', value: 6120 },
    { label: 'Safari', value: 2830 },
    { label: 'Firefox', value: 940 },
  ]"
  center-label="Visitors"
/>
```

The segments sweep around the ring one after another, like a single stroke. Hover a segment or a legend row (or tab through the legend) to swell it and show its value and share in the centre. New `data` re-sizes the segments in place.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `DonutChartDatum[]` | — | `{ label, value, color? }` per segment. |
| `size` | `number` | `240` | Largest diameter in px (shrinks to fit). |
| `thickness` | `number` | `26` | Ring thickness in px. |
| `padAngle` | `number` | `2.5` | Gap between segments, in degrees. |
| `rounded` | `boolean` | `true` | Round segment ends. |
| `centerLabel` | `string` | `'Total'` | Caption above the total. |
| `showLegend` | `boolean` | `true` | Legend with percentages. |
| `duration` | `number` | `1.1` | Seconds for the full sweep (skipped with reduced motion). |
| `format` | `Intl.NumberFormatOptions` | — | Number format for the centre value. |
