---
title: Data Table
description: "A sortable, selectable table whose rows glide into their new order and whose selection bar slides up."
---

<script setup>
import Demo from '../demos/DataTableDemo.vue'
</script>

# Data Table

A sortable, selectable table whose rows glide into their new order and whose selection bar slides up.

<ComponentPreview min-height="460px">
  <Demo />
  <template #code>

<<< @/demos/DataTableDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="data-table" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/data-table/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/data-table/DataTable.vue [DataTable.vue]
<<< @/../registry/ui/data-table/DataTableCheckbox.vue [DataTableCheckbox.vue]
<<< @/../registry/ui/data-table/types.ts [types.ts]
<<< @/../registry/ui/data-table/index.ts [index.ts]
:::
::::

## Usage

```ts
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
```

```vue
<DataTable
  v-model:selected="selected"
  :columns="[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
  ]"
  :rows="invoices"
  selectable
>
  <template #cell-amount="{ value }">{{ money.format(value) }}</template>
  <template #actions="{ selected, clear }">
    <button @click="archive(selected); clear()">Archive</button>
  </template>
</DataTable>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `DataTableColumn[]` | — | `{ key, label, sortable?, align?, sortValue?, class? }`. |
| `rows` | `Row[]` | — | Row objects. |
| `rowKey` | `keyof Row \| (row) => string \| number` | `'id'` | Unique key per row; used for selection and animation. |
| `selectable` | `boolean` | `false` | Adds the checkbox column and the selection bar. |
| `v-model:selected` | `(string \| number)[]` | `[]` | Keys of the selected rows. |
| `v-model:sort` | `{ key, direction } \| null` | `null` | Current sort. Clicking a header cycles ascending → descending → original order. |
| `caption` | `string` | — | Visually hidden table caption. |
| `emptyText` | `string` | `'No results.'` | Shown when `rows` is empty. |

| Slot | Props | Description |
| --- | --- | --- |
| `cell-<key>` | `{ row, value }` | Custom cell for the column with that `key`. |
| `header-<key>` | `{ column }` | Custom header label. |
| `actions` | `{ selected, clear }` | Buttons in the selection bar. |
| `empty` | — | Empty state. |

Sorting uses a numeric, locale-aware compare (numbers, dates and strings). Sortable headers are buttons inside `<th aria-sort>`, and checkboxes are `role="checkbox"` buttons with a `mixed` state on the header. Rows animate with `layout="position"`; with `prefers-reduced-motion` they move instantly.
