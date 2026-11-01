---
title: Masonry Grid
description: "Shortest-column masonry that springs into place on resize, reveals items on scroll and loads more at the end."
---

<script setup>
import Demo from '../demos/MasonryGridDemo.vue'
</script>

# Masonry Grid

Shortest-column masonry that springs into place on resize, reveals items on scroll and loads more at the end.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/MasonryGridDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="masonry-grid" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/masonry-grid/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/masonry-grid/MasonryGrid.vue [MasonryGrid.vue]
<<< @/../registry/ui/masonry-grid/index.ts [index.ts]
:::
::::

## Usage

```ts
import { MasonryGrid } from '@/components/ui/masonry-grid'

async function loadMore() {
  loading.value = true
  const next = await fetchPage(page++)
  photos.value.push(...next)
  hasMore.value = next.length > 0
  loading.value = false
}
```

```vue
<MasonryGrid
  :items="photos"
  :min-column-width="220"
  :loading="loading"
  :has-more="hasMore"
  @load-more="loadMore"
>
  <template #default="{ item }">
    <img :src="item.url" :alt="item.alt" :style="{ aspectRatio: item.ratio }" class="w-full rounded-xl">
  </template>
</MasonryGrid>
```

Every item is measured with a `ResizeObserver` and placed into the currently shortest column, so
item heights can be anything. When the column count changes (container resize or the `columns`
prop) items spring to their new spots. Give images an `aspect-ratio` so they don't jump when they
load. `load-more` fires whenever the end of the grid is within `rootMargin` of the viewport and
you're not already `loading` — it also works inside a scrolling container.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `T[]` | — | Items to lay out. |
| `itemKey` | `string \| (item, index) => string \| number` | `'id'` | Stable key per item. |
| `minColumnWidth` | `number` | `220` | Columns are as many as fit at this width (px). |
| `columns` | `number` | — | Force a column count. |
| `gap` | `number` | `16` | Gap between items (px). |
| `loading` | `boolean` | `false` | Shows the loader and pauses `load-more`. |
| `hasMore` | `boolean` | `true` | Set to `false` when everything is loaded. |
| `rootMargin` | `string` | `'0px 0px 320px 0px'` | How early to ask for more. |
| `label` | `string` | — | Accessible name of the list. |

| Event | Payload | Description |
| --- | --- | --- |
| `load-more` | — | The end of the grid is near. |

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ item, index }` | Item content. |
| `loader` | — | Shown while `loading`. |
| `end` | — | Shown when `hasMore` is `false`. |
