---
title: Candlestick Chart
description: "Live OHLC candles with volume, a last-price tag and crosshair readout; new candles slide in."
---

<script setup>
import Demo from '../demos/CandlestickChartDemo.vue'
</script>

# Candlestick Chart

Live OHLC candles with volume, a last-price tag and crosshair readout; new candles slide in.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/CandlestickChartDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="candlestick-chart" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/candlestick-chart/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/candlestick-chart/CandlestickChart.vue [CandlestickChart.vue]
<<< @/../registry/ui/candlestick-chart/scale.ts [scale.ts]
<<< @/../registry/ui/candlestick-chart/index.ts [index.ts]
:::
::::

## Usage

```ts
import { CandlestickChart, type Candle } from '@/components/ui/candlestick-chart'
```

```vue
<CandlestickChart :data="candles" :visible="60" zoomable />
```

The chart is driven entirely by `data`. To stream, **replace the last candle** while it is forming and
**append** a new one when the period closes — the series slides left by one slot and the price scale
re-fits smoothly. Replacing the whole series replays the intro.

```ts
// forming candle
candles.value[candles.value.length - 1] = { ...last, close, high: Math.max(last.high, close) }
// new period
candles.value = [...candles.value.slice(-200), { time, open, high: open, low: open, close: open, volume: 0 }]
```

Keep a few more candles in `data` than `visible`, so the one leaving on the left can slide out.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `Candle[]` | — | `{ time, open, high, low, close, volume? }`, oldest first. `time` (ms or a label) is the candle's identity. |
| `height` | `number` | `360` | Height in px; width follows the container. |
| `visible` | `number` | `60` | Candles in the viewport (the newest are shown). |
| `volume` | `boolean` | `true` | Volume pane under the candles. |
| `lastPrice` | `boolean` | `true` | Dashed line and axis tag at the latest close. |
| `zoomable` | `boolean` | `false` | Wheel / trackpad zoom, anchored at the newest candle. |
| `precision` | `number` | `2` | Decimals for prices. |
| `locale` | `string` | `'en-US'` | Number and date formatting. |
| `formatTime` | `(time) => string` | `HH:MM` / `Jan 5` | Time label for the axis, crosshair and readout. |

Up candles use `chart-1`, down candles use `destructive`. With the chart focused, <kbd>←</kbd> / <kbd>→</kbd>
move the crosshair and <kbd>Esc</kbd> clears it.
