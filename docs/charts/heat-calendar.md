---
title: Heat Calendar
description: "A year of daily activity as a weeks × weekdays grid that ripples in; drag across days to select a range."
---

<script setup>
import Demo from '../demos/HeatCalendarDemo.vue'
</script>

# Heat Calendar

A year of daily activity as a weeks × weekdays grid that ripples in; drag across days to select a range.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/HeatCalendarDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="heat-calendar" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Copy the [Chart Utils](/charts/chart-utils) files into `components/ui/chart-utils/`, then copy these files into `components/ui/heat-calendar/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/heat-calendar/HeatCalendar.vue [HeatCalendar.vue]
<<< @/../registry/ui/heat-calendar/types.ts [types.ts]
<<< @/../registry/ui/heat-calendar/index.ts [index.ts]
:::
::::

## Usage

```ts
import { HeatCalendar } from '@/components/ui/heat-calendar'
```

```vue
<HeatCalendar
  :data="[{ date: '2026-10-01', value: 4 }, { date: '2026-10-02', value: 9 }]"
  unit="commits"
  @select="({ start, end, total }) => console.log(start, end, total)"
/>
```

Dates are plain `YYYY-MM-DD` strings handled in UTC, so the grid is the same on the server and in every time zone. Intensity is the chosen colour at increasing opacity. Drag across days to select a range — or focus the calendar, move with the arrow keys, extend with <kbd>Shift</kbd> + arrows and confirm with <kbd>Enter</kbd>; <kbd>Esc</kbd> clears.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `HeatCalendarDay[]` | — | `{ date: 'YYYY-MM-DD', value }`; missing days are 0. |
| `start` | `string` | 52 weeks before `end` | First day shown. |
| `end` | `string` | latest date in `data` | Last day shown. |
| `weekStart` | `0 \| 1` | `0` | Weeks start on Sunday (0) or Monday (1). |
| `levels` | `number` | `5` | Intensity steps, including empty. |
| `color` | `string` | `var(--chart-1)` | Cell colour. |
| `cellSize` | `number` | `14` | Largest cell size in px (cells shrink to fit). |
| `unit` | `string` | `'events'` | Noun for tooltips and the summary. |
| `selectable` | `boolean` | `true` | Enable range selection. |

### Events

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `{ start, end, days, total }` | A drag (or keyboard) selection was committed. |
