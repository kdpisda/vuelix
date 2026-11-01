---
title: Volume Profile
description: "Volume-by-price histogram with a highlighted point of control and value area; bars ripple out from the POC."
---

<script setup>
import Demo from '../demos/VolumeProfileDemo.vue'
</script>

# Volume Profile

Volume-by-price histogram with a highlighted point of control and value area; bars ripple out from the POC.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/VolumeProfileDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="volume-profile" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/volume-profile/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/volume-profile/VolumeProfile.vue [VolumeProfile.vue]
<<< @/../registry/ui/volume-profile/profile.ts [profile.ts]
<<< @/../registry/ui/volume-profile/index.ts [index.ts]
:::
::::

## Usage

```ts
import { type VolumeSample, VolumeProfile } from '@/components/ui/volume-profile'
```

```vue
<VolumeProfile :data="trades" :line="closes" :bins="24" />
```

Pass raw samples — individual trades, or each candle's typical price `(high + low + close) / 3`
with its volume. The component buckets them into `bins` equal price ranges, then:

- the **point of control** (POC) is the bin with the most volume, drawn in `chart-4` with a dashed line and an axis tag,
- the **value area** grows outward from the POC, always taking the busier neighbouring bin, until it holds
  `valueArea` (70% by default) of the total. It's shaded, and its edges are labelled VAH / VAL.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `VolumeSample[]` | — | `{ price, volume }` samples. |
| `bins` | `number` | `24` | Number of price levels. |
| `valueArea` | `number` | `0.7` | Share of volume inside the value area. |
| `line` | `number[]` | — | Optional price series drawn across the profile, with a last-price tag. |
| `height` | `number` | `340` | Height in px; width follows the container. |
| `precision` | `number` | `2` | Decimals for prices. |
| `locale` | `string` | `'en-US'` | Number formatting. |
| `formatVolume` | `(v) => string` | compact number | Tooltip volume. |
