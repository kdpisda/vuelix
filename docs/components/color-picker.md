---
title: Color Picker
description: "HSV color picker with springy thumbs, hex/RGB/HSL fields, eyedropper, recents and a popover variant."
---

<script setup>
import Demo from '../demos/ColorPickerDemo.vue'
</script>

# Color Picker

HSV color picker with springy thumbs, hex/RGB/HSL fields, eyedropper, recents and a popover variant.

<ComponentPreview min-height="460px">
  <Demo />
  <template #code>

<<< @/demos/ColorPickerDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="color-picker" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/color-picker/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/color-picker/ColorPicker.vue [ColorPicker.vue]
<<< @/../registry/ui/color-picker/ColorPickerPopover.vue [ColorPickerPopover.vue]
<<< @/../registry/ui/color-picker/color.ts [color.ts]
<<< @/../registry/ui/color-picker/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ColorPicker, ColorPickerPopover } from '@/components/ui/color-picker'
```

```vue
<!-- inline -->
<ColorPicker v-model="color" v-model:recent="recent" alpha />

<!-- compact: a swatch button that opens the same picker in a popover -->
<ColorPickerPopover v-model="color" label="Brand color" />
```

The model is always a lowercase hex string: `#rrggbb`, or `#rrggbbaa` when `alpha` is on and the
opacity is below 100%. Incoming values may be any hex form, `rgb()` or `hsl()`. The hex field also
accepts pasted `rgb()` / `hsl()` strings.

Both components live in the same folder and share `color.ts`, a small set of hand-written
conversions (`parseColor`, `toHex`, `rgbToHsv`, `hsvToRgb`, `rgbToHsl`, `hslToRgb`, …) you can import
directly from `./color` if you need them elsewhere.

## API

### ColorPicker

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string` | `'#6366f1'` | Current color as hex. |
| `v-model:recent` | `string[]` | `[]` | Recent colors, newest first. A color is added when a drag ends, a field is committed, the eyedropper picks, or a slider loses focus after keyboard nudges. |
| `v-model:format` | `'hex' \| 'rgb' \| 'hsl'` | `'hex'` | Which fields are shown. |
| `alpha` | `boolean` | `false` | Adds the opacity slider and an `A` field. |
| `eyedropper` | `boolean` | `true` | Shows the eyedropper button where `window.EyeDropper` exists (Chromium). |
| `recentLimit` | `number` | `7` | Max recent colors; `0` hides the row. |
| `disabled` | `boolean` | `false` | Disables all controls. |

| Event | Payload | Description |
| --- | --- | --- |
| `@change` | `(value: string)` | Fires once per finished interaction (pointer up, key up, field commit, eyedropper, revert), unlike `update:modelValue` which fires on every move. |

### ColorPickerPopover

Accepts `v-model`, `v-model:recent`, `v-model:format`, `alpha`, `eyedropper`, `recentLimit`, `disabled` and `@change` (forwarded to the picker), plus:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | `false` | Whether the popover is open. |
| `label` | `string` | `'Pick a color'` | Accessible name for the trigger and the dialog. |
| `showValue` | `boolean` | `true` | Show the hex value next to the swatch. |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Horizontal alignment to the trigger. Flips above when there's no room below. |
| `contentClass` | `string` | — | Classes for the picker inside the popover. |

### Keyboard

| Key | Saturation / brightness area | Hue & opacity sliders |
| --- | --- | --- |
| <kbd>←</kbd> <kbd>→</kbd> | Saturation ±1 | Value ±1 |
| <kbd>↑</kbd> <kbd>↓</kbd> | Brightness ±1 | Value ±1 |
| <kbd>Shift</kbd> + arrows, <kbd>PageUp</kbd> / <kbd>PageDown</kbd> | Steps of 10 | Steps of 10 |
| <kbd>Home</kbd> / <kbd>End</kbd> | Saturation 0 / 100 | Min / max |

Number fields step with <kbd>↑</kbd> / <kbd>↓</kbd> (<kbd>Shift</kbd> for 10) and commit on <kbd>Enter</kbd> or blur. In the popover, <kbd>Escape</kbd> or a click outside closes it and focus returns to the trigger on <kbd>Escape</kbd>.

Each control is a `role="slider"` with an `aria-valuetext` (e.g. "Saturation 72%, brightness 40%"), the format switch is a radio group, and the preview chip's left half ("old" color) reverts on click.
