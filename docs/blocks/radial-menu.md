---
title: Radial Menu
description: "A floating button that blooms into a ring of actions with staggered springs, hover labels and arrow-key navigation."
---

<script setup>
import Demo from '../demos/RadialMenuDemo.vue'
</script>

# Radial Menu

A floating button that blooms into a ring of actions with staggered springs, hover labels and arrow-key navigation.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/RadialMenuDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="radial-menu" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/radial-menu/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/radial-menu/RadialMenu.vue [RadialMenu.vue]
<<< @/../registry/ui/radial-menu/index.ts [index.ts]
:::
::::

## Usage

```ts
import { RadialMenu, type RadialMenuItem } from '@/components/ui/radial-menu'
```

```vue
<RadialMenu
  :items="[
    { id: 'note', label: 'New note', icon: PenLine },
    { id: 'photo', label: 'Take photo', icon: Camera },
    { id: 'link', label: 'Save link', icon: Link },
  ]"
  label="Create"
  :sweep="180"
  :start-angle="180"
  @select="create"
/>
```

Items spring out from the button one after another, spinning into place, and fold back in reverse
order. Arrow keys walk around the ring (**Home** / **End** jump to the ends); pressing an arrow key
on the closed button opens the menu with focus on the first item. **Escape**, **Tab**, a selection
or a click outside closes it. Use `sweep` and `startAngle` for a half or quarter ring when the
button sits against an edge.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `RadialMenuItem[]` | — | `{ id, label, icon?, disabled? }`. |
| `radius` | `number` | `92` | Distance from the button centre to each item (px). |
| `startAngle` | `number` | `-90` | Angle of the first item in degrees (0 = right, -90 = top). |
| `sweep` | `number` | `360` | Degrees the items spread over. |
| `label` | `string` | `'Open menu'` | Accessible name of the button and menu. |
| `v-model:open` | `boolean` | `false` | Open state. |

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `RadialMenuItem` | An item was chosen (the menu closes). |

| Slot | Props | Description |
| --- | --- | --- |
| `icon` | — | Trigger icon (rotates when open). Defaults to a plus. |
| `item` | `{ item }` | Custom item content. Defaults to the item's icon. |
