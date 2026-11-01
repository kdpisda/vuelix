---
title: Spring Drawer
description: "A side drawer that springs in from any edge, with a drag-to-dismiss handle and focus trap."
---

<script setup>
import Demo from '../demos/SpringDrawerDemo.vue'
</script>

# Spring Drawer

A side drawer that springs in from any edge, with a drag-to-dismiss handle and focus trap.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SpringDrawerDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="spring-drawer" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/spring-drawer/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/spring-drawer/SpringDrawer.vue [SpringDrawer.vue]
<<< @/../registry/ui/spring-drawer/index.ts [index.ts]
:::
::::

## Usage

```ts
import { SpringDrawer } from '@/components/ui/spring-drawer'
```

```vue
<button @click="open = true">Settings</button>

<SpringDrawer v-model:open="open" side="right" label="Settings" class="w-96">
  <template #default="{ close }">
    …drawer content…
    <button @click="close()">Done</button>
  </template>
</SpringDrawer>
```

The handle follows the pointer 1:1 towards the edge and resists the other way. Release past ~35% of
the drawer, or flick it, to dismiss; otherwise it springs back. Pressing the handle (or
<kbd>Enter</kbd> on it) also closes the drawer.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | `false` | Open state. |
| `side` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | Edge the drawer slides in from. |
| `label` | `string` | — | Accessible name of the dialog. |
| `handle` | `boolean` | `true` | Show the drag handle. |
| `closeOnOverlay` | `boolean` | `true` | Close when the overlay is clicked. |
| `class` | `string` | — | Classes for the drawer surface (size it here). |
| `overlayClass` | `string` | — | Classes for the overlay. |

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ close }` | Drawer content. |

The drawer is teleported to `<body>`, locks page scroll, moves focus inside and keeps Tab there,
closes on `Escape` and returns focus to whatever opened it.
