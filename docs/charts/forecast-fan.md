---
title: Forecast Fan
description: "Price history that opens into a fan of low / median / high targets, with a scrubber that reads into the future."
---

<script setup>
import Demo from '../demos/ForecastFanDemo.vue'
</script>

# Forecast Fan

Price history that opens into a fan of low / median / high targets, with a scrubber that reads into the future.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ForecastFanDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="forecast-fan" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/forecast-fan/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/forecast-fan/ForecastFan.vue [ForecastFan.vue]
<<< @/../registry/ui/forecast-fan/fan.ts [fan.ts]
<<< @/../registry/ui/forecast-fan/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ForecastFan, type ForecastTargets } from '@/components/ui/forecast-fan'
```

```vue
<ForecastFan
  :history="closes"
  :forecast="{ low: 148, median: 171, high: 196 }"
  :horizon="60"
  :labels="dates"
  :future-labels="futureDates"
/>
```

The history draws itself first; then the fan opens out of the last close: an outer cone from the
low to the high target and a denser inner cone around the median, fading as it reaches the
horizon. Each target end gets a label with its value and the implied move, nudged apart when
targets are close.

Scrubbing (pointer, or <kbd>←</kbd> / <kbd>→</kbd> with the chart focused) reads the history — value
and the move since then — and continues into the forecast, where the low / median / high paths are
interpolated linearly from today to the horizon.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `history` | `number[]` | — | Prices, oldest first. The last one is "now". |
| `forecast` | `ForecastTargets` | — | `{ low, median, high }` at the horizon. |
| `horizon` | `number` | 40% of the history | Future steps, same spacing as the history. |
| `labels` | `string[]` | — | History labels (dates) for the axis and readout. |
| `futureLabels` | `string[]` | — | Labels for the future steps; the last one marks the horizon. |
| `targetNames` | `{ low?, median?, high? }` | `Low / Median / High` | Names at the target ends. |
| `nowLabel` | `string` | `'Now'` | Label on the history / forecast divider. |
| `height` | `number` | `320` | Height in px; width follows the container. |
| `precision` | `number` | `2` | Decimals for prices. |
| `locale` | `string` | `'en-US'` | Number formatting. |

The high target uses `chart-1`, the low target `destructive`, and the fan `chart-2`.
