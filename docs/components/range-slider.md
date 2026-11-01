---
title: Range Slider
description: "Single or dual-thumb slider with growing thumbs, a value bubble that follows, and an animated fill."
---

<script setup>
import Demo from '../demos/RangeSliderDemo.vue'
</script>

# Range Slider

Single or dual-thumb slider with growing thumbs, a value bubble that follows, and an animated fill.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/RangeSliderDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="range-slider" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/range-slider/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/range-slider/RangeSlider.vue [RangeSlider.vue]
<<< @/../registry/ui/range-slider/index.ts [index.ts]
:::
::::

## Usage

```ts
import { RangeSlider } from '@/components/ui/range-slider'
```

```vue
<RangeSlider v-model="volume" aria-label="Volume" />

<!-- two thumbs: pass a tuple -->
<RangeSlider v-model="price" :min="0" :max="600" :step="10" :format="v => `$${v}`" show-value="always" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `number \| [number, number]` | `0` | A number for one thumb, a `[from, to]` tuple for two. |
| `min` / `max` | `number` | `0` / `100` | Bounds. |
| `step` | `number` | `1` | Values snap to this increment (decimals are fine). |
| `showValue` | `'active' \| 'always' \| 'never'` | `'active'` | When the value bubble is shown — `active` means while hovered, dragged or keyboard-focused. |
| `format` | `(value: number) => string` | — | Formats the bubble and `aria-valuetext`. |
| `ariaLabel` | `string` | — | Accessible name for a single thumb (range thumbs are "Minimum" / "Maximum"). |
| `name` | `string` | — | Adds hidden input(s) — one per thumb — for native form submission. |
| `disabled` | `boolean` | `false` | Disables the slider. |

| Event | Payload | Description |
| --- | --- | --- |
| `@commit` | `value` | Fired when a drag ends or after a keyboard step — handy for saving. |

**Keyboard:** ← ↓ / → ↑ move one step, PageDown / PageUp move a tenth of the range, Home / End jump to the ends. Range thumbs can't cross each other.
