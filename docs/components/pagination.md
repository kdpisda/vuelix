---
title: Pagination
description: "Page buttons with a sliding active pill, smart ellipses and numbers that roll with the direction."
---

<script setup>
import Demo from '../demos/PaginationDemo.vue'
</script>

# Pagination

Page buttons with a sliding active pill, smart ellipses and numbers that roll with the direction.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/PaginationDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="pagination" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/pagination/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/pagination/Pagination.vue [Pagination.vue]
<<< @/../registry/ui/pagination/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Pagination } from '@/components/ui/pagination'
```

```vue
<Pagination v-model:page="page" :total="20" :siblings="1" />
```

With many pages the bar keeps a fixed number of slots (`2 × siblings + 5`). Each slot keeps its
button, so when the window shifts the active pill stays put and the numbers inside roll — up when
moving forward, down when going back. Near the ends the pill slides instead. The `…` slots are
buttons that jump `2 × siblings + 1` pages.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:page` | `number` | `1` | Current page (1-based). |
| `total` | `number` | — | Total number of pages. |
| `siblings` | `number` | `1` | Pages shown on each side of the current one. |
| `label` | `string` | `'Pagination'` | Accessible name of the `<nav>`. |
| `class` | `string` | — | Classes for the `<nav>`. |

**Keyboard:** all buttons are in the Tab order. With focus inside the bar,
<kbd>←</kbd>/<kbd>→</kbd> go to the previous / next page and <kbd>Home</kbd>/<kbd>End</kbd> to the
first / last; focus follows the current page (`aria-current="page"`).
