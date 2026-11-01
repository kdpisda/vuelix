---
title: Spring Popover
description: "A click-to-open popover that springs out of its trigger, with an arrow and smart flipping."
---

<script setup>
import Demo from '../demos/SpringPopoverDemo.vue'
</script>

# Spring Popover

A click-to-open popover that springs out of its trigger, with an arrow and smart flipping.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SpringPopoverDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="spring-popover" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/spring-popover/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/spring-popover/SpringPopover.vue [SpringPopover.vue]
<<< @/../registry/ui/spring-popover/index.ts [index.ts]
:::
::::

## Usage

```ts
import { SpringPopover } from '@/components/ui/spring-popover'
```

```vue
<SpringPopover v-model:open="open" side="bottom" align="start" label="Share">
  <template #trigger>
    <button>Share</button>
  </template>
  <template #default="{ close }">
    …panel content…
    <button @click="close()">Done</button>
  </template>
</SpringPopover>
```

The panel is teleported to `<body>` and positioned with `getBoundingClientRect` — no positioning
library. It flips to the opposite side when there isn't room, stays inside the viewport and follows
the trigger on scroll and resize. The spring grows out of the point the arrow touches.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | `false` | Open state. |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Preferred side; flips when there's no room. |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment along the trigger edge. |
| `offset` | `number` | `10` | Gap between trigger and panel (px). |
| `arrow` | `boolean` | `true` | Show the arrow. |
| `label` | `string` | — | Accessible name of the panel (`role="dialog"`). |
| `class` | `string` | — | Classes for the inline wrapper around the trigger. |
| `contentClass` | `string` | — | Classes for the floating panel (e.g. its width). |

| Slot | Props | Description |
| --- | --- | --- |
| `trigger` | `{ open }` | The element that toggles the popover. Its first focusable element gets `aria-haspopup`, `aria-expanded` and `aria-controls`. |
| `default` | `{ close }` | Panel content. `close()` returns focus to the trigger. |

Focus moves into the panel when it opens and Tab stays inside it. `Escape` closes and returns focus
to the trigger; clicking outside closes it too.
