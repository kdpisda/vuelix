---
title: Sankey Chart
description: "Weighted flows between columns of nodes; ribbons draw in and hovering traces a node's whole path."
---

<script setup>
import Demo from '../demos/SankeyChartDemo.vue'
</script>

# Sankey Chart

Weighted flows between columns of nodes; ribbons draw in and hovering traces a node's whole path.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SankeyChartDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="sankey-chart" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/sankey-chart/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/sankey-chart/SankeyChart.vue [SankeyChart.vue]
<<< @/../registry/ui/sankey-chart/layout.ts [layout.ts]
<<< @/../registry/ui/sankey-chart/index.ts [index.ts]
:::
::::

## Usage

```ts
import { SankeyChart, type SankeyLink, type SankeyNode } from '@/components/ui/sankey-chart'
```

```vue
<SankeyChart
  :nodes="[
    { id: 'web', label: 'Web' },
    { id: 'app', label: 'App' },
    { id: 'orders', label: 'Orders' },
    { id: 'refunds', label: 'Refunds', color: 'var(--chart-5)' },
    { id: 'kept', label: 'Kept' },
  ]"
  :links="[
    { source: 'web', target: 'orders', value: 620 },
    { source: 'app', target: 'orders', value: 380 },
    { source: 'orders', target: 'refunds', value: 70 },
    { source: 'orders', target: 'kept', value: 930 },
  ]"
/>
```

### Layout

Columns come from the longest path to each node; nodes without outgoing links are pushed to the
last column. Nodes start stacked in the order you pass them, then a few relaxation passes pull
each one toward the weighted centre of its neighbours, and ribbons are ordered at every node by
the position of the node at their other end. The input must be acyclic.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `nodes` | `SankeyNode[]` | — | `{ id, label?, color? }`. `color` is any CSS color; nodes cycle through `--chart-1…5` by default. |
| `links` | `SankeyLink[]` | — | `{ source, target, value }` by node id. |
| `height` | `number` | `360` | Height in px; width follows the container. |
| `nodeWidth` | `number` | `12` | Width of the node bars. |
| `nodePadding` | `number` | `18` | Vertical gap between nodes in a column. |
| `iterations` | `number` | `8` | Relaxation passes. |
| `locale` | `string` | `'en-US'` | Used by the default value formatter. |
| `formatValue` | `(v) => string` | compact number | Labels and tooltip values. |

Ribbons are tinted with a gradient from the source to the target color. Hovering a node highlights
everything that flows into and out of it; hovering a ribbon highlights that flow and its two nodes.
