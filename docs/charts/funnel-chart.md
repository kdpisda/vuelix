---
title: Funnel Chart
description: "Conversion funnel whose stages spring open in sequence, joined by curved hand-offs with drop-off rates."
---

<script setup>
import Demo from '../demos/FunnelChartDemo.vue'
</script>

# Funnel Chart

Conversion funnel whose stages spring open in sequence, joined by curved hand-offs with drop-off rates.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/FunnelChartDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="funnel-chart" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Copy the [Chart Utils](/charts/chart-utils) and [Number Ticker](/components/number-ticker) files into `components/ui/chart-utils/` and `components/ui/number-ticker/`, then copy these files into `components/ui/funnel-chart/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/funnel-chart/FunnelChart.vue [FunnelChart.vue]
<<< @/../registry/ui/funnel-chart/types.ts [types.ts]
<<< @/../registry/ui/funnel-chart/index.ts [index.ts]
:::
::::

## Usage

```ts
import { FunnelChart } from '@/components/ui/funnel-chart'
```

```vue
<FunnelChart
  :data="[
    { label: 'Visited', value: 12000 },
    { label: 'Signed up', value: 3400 },
    { label: 'Paid', value: 610 },
  ]"
  orientation="vertical"
/>
```

Each stage is a flat bar sized by its value; a curved band carries the flow into the next stage and a pill shows how much dropped off. Hover a stage (or focus the chart and use the arrow keys) for a tooltip whose number counts to the new value as you move between stages.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `FunnelChartStage[]` | — | `{ label, value }` per stage, widest first. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Flow left → right or top → bottom. |
| `height` | `number` | `280` | Height in px; width fills the container. |
| `color` | `string` | `var(--chart-1)` | Stage colour; later stages fade slightly. |
| `showDropoff` | `boolean` | `true` | Drop-off pills between stages. |
| `formatValue` | `(v: number) => string` | `12.3K` | Format of the values printed on the chart. |
