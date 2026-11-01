---
title: Stacked Area
description: "Composition over time, stacked or 100%; bands morph between modes and an interactive legend isolates series."
---

<script setup>
import Demo from '../demos/StackedAreaDemo.vue'
</script>

# Stacked Area

Composition over time, stacked or 100%; bands morph between modes and an interactive legend isolates series.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/StackedAreaDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="stacked-area" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/stacked-area/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/stacked-area/StackedArea.vue [StackedArea.vue]
<<< @/../registry/ui/stacked-area/stack.ts [stack.ts]
<<< @/../registry/ui/stacked-area/index.ts [index.ts]
:::
::::

## Usage

```ts
import { StackedArea, type StackedSeries } from '@/components/ui/stacked-area'
```

```vue
<StackedArea
  v-model:mode="mode"
  :labels="['Q1', 'Q2', 'Q3', 'Q4']"
  :series="[
    { name: 'Hardware', values: [120, 132, 128, 150] },
    { name: 'Software', values: [80, 96, 118, 140] },
    { name: 'Services', values: [40, 42, 47, 51] },
  ]"
/>
```

Everything that changes the stack — switching `mode`, hiding a series, new `series` data — morphs
the bands from where they are to where they need to be, axis included. Hidden series collapse to
zero thickness instead of disappearing.

The legend isolates on click (click the isolated series again to bring everything back) and
toggles a single series on <kbd>Shift</kbd>-click. Hovering a legend item highlights its band. With the
chart focused, <kbd>←</kbd> / <kbd>→</kbd> move the crosshair.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `labels` | `string[]` | — | One label per period. |
| `series` | `StackedSeries[]` | — | `{ name, values, color? }`, stacked bottom-up. `color` is any CSS color; defaults cycle `--chart-1…5`. |
| `v-model:mode` | `'stacked' \| 'percent'` | `'stacked'` | Absolute values or 100% stacked. |
| `v-model:hidden` | `string[]` | `[]` | Names of hidden series. |
| `height` | `number` | `300` | Chart height in px (legend excluded). |
| `smooth` | `boolean` | `true` | Monotone curves. |
| `legend` | `boolean` | `true` | Interactive legend under the chart. |
| `locale` | `string` | `'en-US'` | Used by the default formatter. |
| `formatValue` | `(v) => string` | compact number | Axis and tooltip values. |
