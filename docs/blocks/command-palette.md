---
title: Command Palette
description: "A ⌘K palette with fuzzy search, a gliding selection, nested pages that slide in and shortcuts."
---

<script setup>
import Demo from '../demos/CommandPaletteDemo.vue'
</script>

# Command Palette

A ⌘K palette with fuzzy search, a gliding selection, nested pages that slide in and shortcuts.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/CommandPaletteDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="command-palette" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/command-palette/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/command-palette/CommandPalette.vue [CommandPalette.vue]
<<< @/../registry/ui/command-palette/match.ts [match.ts]
<<< @/../registry/ui/command-palette/index.ts [index.ts]
:::
::::

## Usage

```ts
import { CommandPalette, type CommandPaletteItem } from '@/components/ui/command-palette'
```

```vue
<script setup lang="ts">
const open = ref(false)
const items: CommandPaletteItem[] = [
  { id: 'home', label: 'Home', group: 'Pages', icon: House },
  { id: 'new', label: 'New file', group: 'Actions', shortcut: ['⌘', 'N'] },
  {
    id: 'theme',
    label: 'Change theme',
    group: 'Actions',
    children: [
      { id: 'light', label: 'Light' },
      { id: 'dark', label: 'Dark' },
    ],
  },
]
</script>

<template>
  <CommandPalette v-model:open="open" :items="items" @select="run" />
</template>
```

Items are grouped by `group` (in the order groups first appear). Typing filters with a forgiving
subsequence match — `chth` finds **Ch**ange **th**eme — and highlights the matched characters.
An item with `children` opens a nested list that slides in; `Backspace` on an empty query or
`Escape` slides back.

The global shortcut is registered on mount. This docs site's own search already owns ⌘K, so the
demo above passes `hotkey="j"` (⌘J / Ctrl+J).

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `CommandPaletteItem[]` | — | Items to search (see below). |
| `v-model:open` | `boolean` | `false` | Whether the palette is open. |
| `placeholder` | `string` | `'Type a command or search…'` | Root search placeholder. |
| `hotkey` | `string \| false` | `'k'` | Toggles the palette with ⌘ / Ctrl + key. `false` disables it. |
| `close-on-select` | `boolean` | `true` | Close after a leaf item is selected. |
| `label` | `string` | `'Command palette'` | Accessible name of the dialog. |
| `class` | `string` | — | Classes for the palette surface (teleported to `<body>`). |
| `overlay-class` | `string` | — | Classes for the backdrop. |

`CommandPaletteItem`:

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique id within its list. |
| `label` | `string` | Text that is searched and highlighted. |
| `group` | `string` | Group heading. |
| `hint` | `string` | Muted text after the label. |
| `icon` | `Component` | Icon component. |
| `shortcut` | `string[]` | Keys shown on the right, e.g. `['⌘', 'N']`. |
| `keywords` | `string[]` | Extra search terms. |
| `disabled` | `boolean` | Shown but not selectable. |
| `children` | `CommandPaletteItem[]` | Opens a nested list instead of selecting. |
| `placeholder` | `string` | Search placeholder inside the nested list. |

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `(item, path)` | A leaf item was chosen; `path` lists the nested pages above it. |

| Slot | Props | Description |
| --- | --- | --- |
| `empty` | `{ query }` | Replaces the empty state. |
| `footer` | — | Replaces the keyboard hints. |

The input is a `combobox` controlling a `listbox` (`aria-activedescendant` follows the selection).
`↑` / `↓` move, `Enter` selects, `Escape` goes back or closes, and focus returns to where it was.
