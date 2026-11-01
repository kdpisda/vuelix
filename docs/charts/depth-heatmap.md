---
title: Depth Heatmap
description: "Price × time heatmap of resting liquidity with a price trace; new snapshots slide in live."
---

<script setup>
import Demo from '../demos/DepthHeatmapDemo.vue'
</script>

# Depth Heatmap

Price × time heatmap of resting liquidity with a price trace; new snapshots slide in live.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/DepthHeatmapDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="depth-heatmap" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/depth-heatmap/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/depth-heatmap/DepthHeatmap.vue [DepthHeatmap.vue]
<<< @/../registry/ui/depth-heatmap/scale.ts [scale.ts]
<<< @/../registry/ui/depth-heatmap/index.ts [index.ts]
:::
::::

## Usage

```ts
import { type DepthColumn, DepthHeatmap } from '@/components/ui/depth-heatmap'
```

```vue
<DepthHeatmap :levels="levels" :columns="snapshots" :visible="60" />
```

Each column is one order-book snapshot: `depth[i]` is the resting size at `levels[i]`, and `price`
(optional) is where the market traded at that moment. Intensity is the size relative to the
largest value in view, raised to `gamma`, and mapped to the cell's opacity.

To stream, append a snapshot — the grid and trace slide left by one column. Keep one more
snapshot than `visible` so the oldest column can slide out. Replacing the series replays the reveal.

```ts
columns.value = [...columns.value.slice(-60), { time: Date.now(), depth, price }]
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `levels` | `number[]` | — | Row prices, ascending and evenly spaced. |
| `columns` | `DepthColumn[]` | — | `{ time, depth, price? }`, oldest first. `time` (ms or a label) is the column's identity. |
| `visible` | `number` | `48` | Columns in the viewport. |
| `height` | `number` | `320` | Height in px; width follows the container. |
| `color` | `string` | `'var(--chart-2)'` | Cell color; intensity becomes opacity. |
| `split` | `boolean` | `false` | Bids (below the price) in `chart-1`, asks in `destructive`. |
| `gamma` | `number` | `0.75` | Intensity curve. Lower lifts faint liquidity. |
| `precision` | `number` | `2` | Decimals for prices. |
| `locale` | `string` | `'en-US'` | Number and time formatting. |
| `formatTime` | `(time) => string` | `HH:MM:SS` | Axis and tooltip time. |
| `formatDepth` | `(size) => string` | compact number | Tooltip size. |
