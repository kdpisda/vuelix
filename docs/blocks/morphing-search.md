---
title: Morphing Search
description: "A search icon that springs open into a field, with recent searches and suggestions that stagger in."
---

<script setup>
import Demo from '../demos/MorphingSearchDemo.vue'
</script>

# Morphing Search

A search icon that springs open into a field, with recent searches and suggestions that stagger in.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/MorphingSearchDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="morphing-search" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/morphing-search/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/morphing-search/MorphingSearch.vue [MorphingSearch.vue]
<<< @/../registry/ui/morphing-search/index.ts [index.ts]
:::
::::

## Usage

```ts
import { MorphingSearch } from '@/components/ui/morphing-search'
```

```vue
<MorphingSearch
  v-model="query"
  class="max-w-md"
  :recent="['dark mode', 'tabs']"
  :suggestions="[{ value: 'theming', label: 'Theming', hint: 'Guide' }]"
  @submit="search"
  @select="open"
/>
```

The root's width is the expanded width: size it with `class` (`max-w-sm` by default). Set
`align="end"` to grow towards the left, e.g. in a header.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string` | `''` | The query. |
| `v-model:open` | `boolean` | `false` | Whether the field is expanded. |
| `recent` | `string[]` | `[]` | Recent searches, shown while the query is empty. |
| `suggestions` | `MorphingSearchSuggestion[]` | `[]` | `{ value, label, hint?, icon? }`, filtered by the query. |
| `placeholder` | `string` | `'Search…'` | Input placeholder. |
| `label` | `string` | `'Search'` | Accessible name of the button and the input. |
| `align` | `'start' \| 'end'` | `'start'` | Side the field grows from. |
| `panel-class` | `string` | — | Classes for the suggestions panel. |

| Event | Payload | Description |
| --- | --- | --- |
| `submit` | `query: string` | `Enter` on the query, or a recent search was picked. |
| `select` | `item: MorphingSearchSuggestion` | A suggestion was picked. |
| `clear-recent` | — | The recent list's **Clear** button was pressed. |

The input is a `combobox` with a `listbox` of options: `↑` / `↓` move, `Enter` picks, `Escape`
collapses back to the icon and returns focus to it. Clicking or tabbing outside also collapses.
