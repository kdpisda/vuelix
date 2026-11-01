---
title: Hover Highlight
description: "List, nav or grid where one shared background glides to the hovered item and fades out on leave."
---

<script setup>
import Demo from '../demos/HoverHighlightDemo.vue'
</script>

# Hover Highlight

List, nav or grid where one shared background glides to the hovered item and fades out on leave.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/HoverHighlightDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="hover-highlight" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/hover-highlight/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/hover-highlight/HoverHighlight.vue [HoverHighlight.vue]
<<< @/../registry/ui/hover-highlight/index.ts [index.ts]
:::
::::

## Usage

```ts
import { HoverHighlight } from '@/components/ui/hover-highlight'
```

```vue
<HoverHighlight :items="links" item-key="href" as="ul" item-as="li" class="flex gap-1">
  <template #item="{ item, active }">
    <a :href="item.href" class="block px-3 py-1.5" :class="active && 'text-foreground'">
      {{ item.label }}
    </a>
  </template>
</HoverHighlight>
```

A single highlight element moves between items with a shared-layout spring, so it works the same in rows, columns and grids. It follows keyboard focus too, and fades out when the pointer or focus leaves the group. Put the interactive element (link, button) inside the slot; the highlight sits behind it.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `T[]` | — | Items to render. |
| `itemKey` | `keyof T \| (item, index) => string \| number` | index | Stable key per item. |
| `as` | `string` | `'div'` | Wrapper element (`ul`, `nav`…). |
| `itemAs` | `string` | `'div'` | Element per item (`li`…). |
| `itemClass` | `string` | — | Classes for every item wrapper. |
| `highlightClass` | `string` | — | Classes for the moving highlight (default `rounded-lg bg-accent`). |

| Event | Payload | Description |
| --- | --- | --- |
| `highlight` | `(item: T \| null, index: number)` | Highlighted item changed (`null` / `-1` when it leaves). |

| Slot | Props | Description |
| --- | --- | --- |
| `item` | `{ item, index, active }` | Content of each item. |
