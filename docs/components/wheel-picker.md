---
title: Wheel Picker
description: "An iOS-style 3D scroll wheel with flick momentum that snaps to items; combine wheels for time pickers."
---

<script setup>
import Demo from '../demos/WheelPickerDemo.vue'
</script>

# Wheel Picker

An iOS-style 3D scroll wheel with flick momentum that snaps to items; combine wheels for time pickers.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/WheelPickerDemo.vue

  </template>
</ComponentPreview>

Drag or flick a wheel, scroll it with a trackpad or mouse wheel, tap a row, or focus it and use the
arrow keys. Rows sit on a real cylinder (each one is placed with `translateY`, `translateZ` and
`rotateX` from a single motion value), so dragging never re-renders Vue.

## Installation

<InstallTabs name="wheel-picker" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/wheel-picker/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/wheel-picker/WheelPicker.vue [WheelPicker.vue]
<<< @/../registry/ui/wheel-picker/WheelPickerGroup.vue [WheelPickerGroup.vue]
<<< @/../registry/ui/wheel-picker/WheelPickerItem.vue [WheelPickerItem.vue]
<<< @/../registry/ui/wheel-picker/context.ts [context.ts]
<<< @/../registry/ui/wheel-picker/index.ts [index.ts]
:::
::::

## Usage

```ts
import { WheelPicker, WheelPickerGroup } from '@/components/ui/wheel-picker'
```

```vue
<!-- One wheel -->
<WheelPicker v-model="size" :options="['XS', 'S', 'M', 'L', 'XL']" label="Size" />

<!-- Several wheels sharing one selection band -->
<WheelPickerGroup label="Time">
  <WheelPicker v-model="hour" :options="hours" label="Hour" />
  <span aria-hidden="true">:</span>
  <WheelPicker v-model="minute" :options="minutes" label="Minute" />
</WheelPickerGroup>
```

Options can be plain strings / numbers or `{ value, label }` objects.

## API

### WheelPicker

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string \| number` | — | The selected option's value. Updates when the wheel settles. |
| `options` | `(string \| number \| { value, label })[]` | — | The rows. |
| `label` | `string` | — | Accessible name of the listbox. |
| `itemHeight` | `number` | `36` | Row height in px (inherited inside a group). |
| `visibleCount` | `number` | `5` | Rows visible at once, odd (inherited inside a group). |
| `disabled` | `boolean` | `false` | Disables interaction. |

Keyboard: `↑` / `↓` one row, `PageUp` / `PageDown` five rows, `Home` / `End`.

### WheelPickerGroup

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `itemHeight` | `number` | `36` | Row height shared by every wheel. |
| `visibleCount` | `number` | `5` | Visible rows shared by every wheel. |
| `label` | `string` | — | Accessible name of the group. |
