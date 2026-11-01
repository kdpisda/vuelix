---
title: Date Range Picker
description: "A calendar popover with presets, a range band that stretches between dates and sliding months."
---

<script setup>
import Demo from '../demos/DateRangePickerDemo.vue'
</script>

# Date Range Picker

A calendar popover with presets, a range band that stretches between dates and sliding months.

<ComponentPreview min-height="460px" align="start">
  <Demo />
  <template #code>

<<< @/demos/DateRangePickerDemo.vue

  </template>
</ComponentPreview>

Click a start date, then hover — the band follows the pointer (or the keyboard focus) until you
pick the end. Months slide in the direction you travel. No date library: everything is native
`Date` + `Intl`, so month and weekday names follow `locale`.

## Installation

<InstallTabs name="date-range-picker" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/date-range-picker/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/date-range-picker/DateRangePicker.vue [DateRangePicker.vue]
<<< @/../registry/ui/date-range-picker/calendar.ts [calendar.ts]
<<< @/../registry/ui/date-range-picker/index.ts [index.ts]
:::
::::

## Usage

```ts
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker'
```

```vue
<script setup lang="ts">
const range = ref<DateRange>({ start: null, end: null })
</script>

<template>
  <DateRangePicker v-model="range" :months="2" :min="new Date()" />
</template>
```

Custom presets receive today's date (local midnight):

```ts
const presets: DateRangePreset[] = [
  { label: 'Next 7 days', range: t => ({ start: t, end: new Date(t.getFullYear(), t.getMonth(), t.getDate() + 6) }) },
  { label: 'This weekend', range: t => { /* … */ } },
]
```

## Keyboard

| Key | Action |
| --- | --- |
| `←` `→` `↑` `↓` | Move one day / one week |
| `Home` / `End` | Start / end of the week |
| `PageUp` / `PageDown` | Previous / next month (`Shift` for a year) |
| `Enter` / `Space` | Pick the focused day |
| `Escape` | Close and return focus to the trigger |

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `{ start: Date \| null, end: Date \| null }` | `{ start: null, end: null }` | The selected range. `end` is `null` while picking. |
| `v-model:open` | `boolean` | `false` | Popover visibility. |
| `months` | `1 \| 2` | `2` | Months shown side by side. |
| `presets` | `DateRangePreset[]` | Today, Yesterday, Last 7 / 30 days, This / Last month | Quick ranges. `[]` hides the column. |
| `locale` | `string` | user's | Locale for month, weekday and date formatting. |
| `weekStartsOn` | `number` | `0` | First day of the week (0 = Sunday). |
| `min` / `max` | `Date` | — | Selectable bounds. |
| `placeholder` | `string` | `'Pick a date range'` | Trigger text when empty. |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Popover alignment under the trigger. |
| `closeOnSelect` | `boolean` | `false` | Close as soon as both ends are picked. |
