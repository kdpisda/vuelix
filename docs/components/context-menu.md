---
title: Context Menu
description: "A right-click / long-press menu with a gliding highlight, shortcuts and a submenu that slides out."
---

<script setup>
import Demo from '../demos/ContextMenuDemo.vue'
</script>

# Context Menu

A right-click / long-press menu with a gliding highlight, shortcuts and a submenu that slides out.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ContextMenuDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="context-menu" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/context-menu/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/context-menu/ContextMenu.vue [ContextMenu.vue]
<<< @/../registry/ui/context-menu/ContextMenuList.vue [ContextMenuList.vue]
<<< @/../registry/ui/context-menu/types.ts [types.ts]
<<< @/../registry/ui/context-menu/index.ts [index.ts]
:::
::::

## Usage

```ts
import type { ContextMenuEntry } from '@/components/ui/context-menu'
import { ContextMenu } from '@/components/ui/context-menu'
import { Copy, Share2, Trash2 } from 'lucide-vue-next'

const items: ContextMenuEntry[] = [
  { label: 'Duplicate', icon: Copy, shortcut: '⌘D', onSelect: duplicate },
  { label: 'Share', icon: Share2, children: [{ label: 'Copy link' }, { label: 'Email' }] },
  { type: 'separator' },
  { label: 'Delete', icon: Trash2, destructive: true },
]
```

```vue
<ContextMenu :items="items" @select="item => console.log(item.label)">
  <div class="h-40 rounded-xl border">Right-click me</div>
</ContextMenu>
```

The menu opens at the pointer (or after a long-press on touch), flips away from the screen edges and
is clamped to the viewport. Hovering a row with `children` slides its submenu out to the side.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `ContextMenuEntry[]` | — | Actions, `{ type: 'separator' }` and `{ type: 'label', label }` headings. |
| `longPress` | `number` | `500` | Hold time (ms) that opens the menu on touch / pen. |
| `disabled` | `boolean` | `false` | Turn the custom menu off. |
| `label` | `string` | `'Actions'` | Accessible name of the menu. |
| `class` | `string` | — | Classes for the right-clickable area. |
| `contentClass` | `string` | — | Classes for the floating menu surfaces. |

| Action field | Type | Description |
| --- | --- | --- |
| `label` | `string` | Row text (also used for typeahead). |
| `value` | `string` | Optional id. |
| `icon` | `Component` | Leading icon. |
| `shortcut` | `string` | Display-only shortcut hint. |
| `disabled` | `boolean` | Skip in keyboard navigation and ignore clicks. |
| `destructive` | `boolean` | Paint the row in the destructive color. |
| `children` | `ContextMenuEntry[]` | Entries of a submenu. |
| `onSelect` | `() => void` | Called when the row is chosen. |

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `ContextMenuAction` | A row (without children) was chosen. |
| `update:open` | `boolean` | The menu opened or closed. |

| Exposed | Description |
| --- | --- |
| `openAt(x, y)` | Open the menu at viewport coordinates. |
| `close()` | Close the menu. |

**Keyboard:** focus the area and press <kbd>Shift</kbd>+<kbd>F10</kbd> or the menu key to open.
<kbd>↑</kbd>/<kbd>↓</kbd>, <kbd>Home</kbd>/<kbd>End</kbd> and typeahead move the highlight,
<kbd>→</kbd> opens a submenu, <kbd>←</kbd> closes it, <kbd>Enter</kbd> selects and <kbd>Esc</kbd>
closes and returns focus.
