---
title: Sortable List
description: "A drag-to-reorder list where rows lift off the page and the rest glide aside; keyboard friendly."
---

<script setup>
import Demo from '../demos/SortableListDemo.vue'
</script>

# Sortable List

A drag-to-reorder list where rows lift off the page and the rest glide aside; keyboard friendly.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SortableListDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="sortable-list" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/sortable-list/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/sortable-list/SortableList.vue [SortableList.vue]
<<< @/../registry/ui/sortable-list/index.ts [index.ts]
:::
::::

## Usage

```ts
import { SortableList } from '@/components/ui/sortable-list'
```

```vue
<SortableList v-model="tasks" item-key="id">
  <template #default="{ item, index }">
    {{ index + 1 }}. {{ item.title }}
  </template>
</SortableList>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `T[]` | — | The items, in order. Reordering replaces the array. |
| `itemKey` | `keyof T \| (item: T) => PropertyKey` | the item | Unique key per item. Required for object items you recreate. |
| `itemLabel` | `(item: T) => string` | `label` / `name` / `title` | Text announced to screen readers when an item moves. |
| `handle` | `boolean` | `true` | Drag only from the grip. `false` makes the whole row draggable. |
| `label` | `string` | `'Sortable list'` | Accessible name of the list. |
| `itemClass` | `string` | — | Classes for every row. |

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ item, index, dragging }` | Row content. |

| Event | Payload | Description |
| --- | --- | --- |
| `reorder` | `items, moved` | Fired after every move, with the item that moved. |

Built on motion's `Reorder` components. Every row is focusable: `Alt + ↑ / ↓` moves it, or press `Space` to pick it up, arrows to move and `Space` again to drop (`Escape` cancels). Each move is announced through a live region. With `prefers-reduced-motion` the lift scale is skipped.
