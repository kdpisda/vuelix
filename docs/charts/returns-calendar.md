---
title: Returns Calendar
description: "Years × months grid of returns tinted by sign and size, with compounded yearly totals; cells pop in diagonally."
---

<script setup>
import Demo from '../demos/ReturnsCalendarDemo.vue'
</script>

# Returns Calendar

Years × months grid of returns tinted by sign and size, with compounded yearly totals; cells pop in diagonally.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ReturnsCalendarDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="returns-calendar" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/returns-calendar/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/returns-calendar/ReturnsCalendar.vue [ReturnsCalendar.vue]
<<< @/../registry/ui/returns-calendar/returns.ts [returns.ts]
<<< @/../registry/ui/returns-calendar/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ReturnsCalendar, type YearReturns } from '@/components/ui/returns-calendar'
```

```vue
<ReturnsCalendar
  :data="[
    { year: 2025, months: [1.2, -0.8, 2.4, 0.3, -3.1, 1.9, 2.2, -0.4, 0.8, 1.6, -1.1, 2.7] },
    { year: 2026, months: [0.9, 1.4, -2.2, 3.1, 0.2, -0.6, 1.8, 0.4, -1.3, 2.0, null, null] },
  ]"
/>
```

Returns are **percentages** (`2.4` = +2.4%); use `null` for months without data. Positive months
are tinted with `--chart-1`, negative ones with `--destructive`, and the tint gets stronger with
the size of the move, reaching full strength at `scale` (by default the largest month shown). The
**Year** column compounds the months — `(1 + r₁) × (1 + r₂) × … − 1` — and gets its own scale.

The grid is keyboard navigable (one tab stop, arrow keys, <kbd>Home</kbd> / <kbd>End</kbd>) and every
cell has an accessible label. Hover or focus a cell for the year-to-date return, best / worst
month and up / down counts.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `YearReturns[]` | — | `{ year, months }` with 12 returns in %, January first. Shown newest year first. |
| `scale` | `number` | largest month | \|return\| in % at which a month reaches full colour. |
| `average` | `boolean` | `true` | Extra row with each month's average across years. |
| `precision` | `number` | `1` | Decimals in the cells (the tooltip shows one more). |
| `monthLabels` | `string[]` | `Jan … Dec` | Column headings. |
