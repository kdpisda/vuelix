---
title: Dial Picker
description: "A circular dial: drag the knob around a ticked arc, it snaps to steps while the readout rolls."
---

<script setup>
import Demo from '../demos/DialPickerDemo.vue'
</script>

# Dial Picker

A circular dial: drag the knob around a ticked arc, it snaps to steps while the readout rolls.

<ComponentPreview min-height="360px">
  <Demo />
  <template #code>

<<< @/demos/DialPickerDemo.vue

  </template>
</ComponentPreview>

Press anywhere on the dial and drag around it. The value snaps to `step` and the knob springs to
it; each digit of the readout rolls independently. Past either end of the arc the knob sticks to
the nearest limit instead of wrapping. The arc colour is `currentColor` — set it with a text class
(`class="text-chart-5"`).

## Installation

<InstallTabs name="dial-picker" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/dial-picker/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/dial-picker/DialPicker.vue [DialPicker.vue]
<<< @/../registry/ui/dial-picker/index.ts [index.ts]
:::
::::

## Usage

```ts
import { DialPicker } from '@/components/ui/dial-picker'
```

```vue
<DialPicker v-model="temperature" :min="10" :max="30" :step="0.5" unit="°C" label="Thermostat" />
```

The knob is a `role="slider"`: arrow keys move one step, `PageUp` / `PageDown` move `pageSteps`
steps, `Home` / `End` jump to the limits.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `number` | `0` | The value. |
| `min` / `max` | `number` | `0` / `100` | Range. |
| `step` | `number` | `1` | Snap increment (decimals set the readout's precision). |
| `pageSteps` | `number` | `10` | Steps per `PageUp` / `PageDown`. |
| `size` | `number` | `240` | Diameter in px. |
| `sweep` | `number` | `270` | Arc length in degrees; the gap sits at the bottom. |
| `ticks` | `number` | one per step (max 61) | Number of tick marks. |
| `label` | `string` | — | Accessible name, shown under the value. |
| `unit` | `string` | — | Suffix after the value (`°C`, `%`). |
| `locale` | `string` | user's | Number formatting locale. |
| `formatOptions` | `Intl.NumberFormatOptions` | — | Extra readout formatting. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `name` | `string` | — | Adds a hidden input for forms. |
