---
title: Availability Picker
description: "Weekly scheduler with day switches, animated time ranges and a drag-to-paint week grid."
---

<script setup>
import Demo from '../demos/AvailabilityPickerDemo.vue'
</script>

# Availability Picker

Weekly scheduler with day switches, animated time ranges and a drag-to-paint week grid.

<ComponentPreview align="start" min-height="560px">
  <Demo />
  <template #code>

<<< @/demos/AvailabilityPickerDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="availability-picker" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/availability-picker/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/availability-picker/AvailabilityPicker.vue [AvailabilityPicker.vue]
<<< @/../registry/ui/availability-picker/AvailabilityGrid.vue [AvailabilityGrid.vue]
<<< @/../registry/ui/availability-picker/time.ts [time.ts]
<<< @/../registry/ui/availability-picker/index.ts [index.ts]
:::
::::

## Usage

```ts
import { AvailabilityPicker, type AvailabilityWeek } from '@/components/ui/availability-picker'

// One entry per day label (Mon → Sun by default); times are "HH:MM", 24-hour.
const week = ref<AvailabilityWeek>([
  { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
  // …
])
```

```vue
<AvailabilityPicker v-model="week" v-model:view="view" :start-hour="8" :end-hour="20" :step="30" hour12 />
```

**List** view: switch days on and off, and add, edit or remove time ranges per day (invalid or
overlapping ranges are flagged inline). **Grid** view: drag across the week to paint a block of
time, or start on painted time to erase. The grid is an ARIA grid with one tab stop — arrow keys
move, Space / Enter toggles a slot, Shift + arrows paints as you move. The total updates live; the
`dayMinutes()` helper used for it is exported too.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `AvailabilityWeek` | `[]` | One `{ enabled, ranges }` per day. |
| `v-model:view` | `'list' \| 'grid'` | `'list'` | Which editor is shown. |
| `days` | `string[]` | `['Mon', …, 'Sun']` | Day labels. |
| `startHour` | `number` | `7` | First selectable hour. |
| `endHour` | `number` | `21` | Last selectable hour. |
| `step` | `number` | `30` | Minutes between selectable times. |
| `hour12` | `boolean` | `false` | Show `9:00am` instead of `09:00`. |
| `defaultRange` | `{ start, end }` | `09:00–17:00` | Range added when a day is switched on. |

`AvailabilityWeek`: `Array<{ enabled: boolean, ranges: Array<{ start: string, end: string }> }>`.
