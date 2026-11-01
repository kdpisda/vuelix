---
title: Treemap
description: "Squarified treemap whose tiles glide to their new size and position whenever the data changes."
---

<script setup>
import Demo from '../demos/TreemapDemo.vue'
</script>

# Treemap

Squarified treemap whose tiles glide to their new size and position whenever the data changes.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/TreemapDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="treemap" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Copy the [Chart Utils](/charts/chart-utils) files into `components/ui/chart-utils/`, then copy these files into `components/ui/treemap/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/treemap/Treemap.vue [Treemap.vue]
<<< @/../registry/ui/treemap/squarify.ts [squarify.ts]
<<< @/../registry/ui/treemap/types.ts [types.ts]
<<< @/../registry/ui/treemap/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Treemap } from '@/components/ui/treemap'
```

```vue
<Treemap
  :data="[
    { label: 'Engineering', value: 48, group: 'Product' },
    { label: 'Design', value: 14, group: 'Product' },
    { label: 'Sales', value: 31, group: 'Revenue' },
    { label: 'Support', value: 12, group: 'Revenue' },
  ]"
/>
```

Tiles are laid out with the squarified algorithm, which keeps them as close to square as possible so labels have room. Tiles are matched by `label`, so when values change each tile glides to its new rectangle; items that appear or disappear fade in and out. Labels fade away on tiles smaller than `minLabelSize`, and every tile still has a tooltip with its value and share of the total.

The layout function is exported too: `squarify(values, { x, y, w, h })` returns one rectangle per value.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `TreemapItem[]` | — | `{ label, value, group?, color? }` per tile. |
| `height` | `number` | `320` | Height in px; width fills the container. |
| `gap` | `number` | `3` | Space between tiles in px. |
| `minLabelSize` | `number` | `56` | Tiles narrower than this hide their label. |
| `formatValue` | `(v: number) => string` | `1.2K` | Value format on tiles and in the tooltip. |

Tiles in the same `group` share a `--chart-*` colour; bigger tiles get a stronger tint.
