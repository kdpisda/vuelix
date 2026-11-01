---
title: Folder Stack
description: "A folder whose flap tips open as its cards fan out, plus a card pile that deals itself into a grid."
---

<script setup>
import Demo from '../demos/FolderStackDemo.vue'
</script>

# Folder Stack

A folder whose flap tips open as its cards fan out, plus a card pile that deals itself into a grid.

<ComponentPreview min-height="480px">
  <Demo />
  <template #code>

<<< @/demos/FolderStackDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="folder-stack" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/folder-stack/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/folder-stack/FolderStack.vue [FolderStack.vue]
<<< @/../registry/ui/folder-stack/index.ts [index.ts]
:::
::::

## Usage

```ts
import { FolderStack, type FolderStackItem } from '@/components/ui/folder-stack'
```

```vue
<!-- Fans up to five cards out of a folder on hover / click -->
<FolderStack :items="files" label="Brand assets" @select="openFile" />

<!-- A pile of cards that spreads into a grid -->
<FolderStack :items="projects" label="Projects" variant="stack" :columns="3" @select="openProject">
  <template #card="{ item }">
    <ProjectThumbnail :project="item" />
  </template>
</FolderStack>
```

The folder flap (or the pile) is a real toggle button with `aria-expanded`; cards only become
focusable once they're out. Escape closes and returns focus to the toggle, and moving focus out of
the block closes it too. Hover-to-open only reacts to a mouse, so touch users tap instead.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `FolderStackItem[]` | — | Cards. The folder shows the first five. |
| `label` | `string` | — | Name shown underneath and used for accessible labels. |
| `variant` | `'folder' \| 'stack'` | `'folder'` | Folder that fans out, or a pile that spreads into a grid. |
| `hover` | `boolean` | `true` for folder | Also open on mouse hover. |
| `columns` | `number` | `3` | Grid columns for `stack`. |
| `v-model:open` | `boolean` | `false` | Open state. |

`FolderStackItem`: `{ id: string \| number, title: string, subtitle?: string, image?: string }`.

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `(item)` | A card was clicked. |

| Slot | Props | Description |
| --- | --- | --- |
| `card` | `{ item, index }` | Custom card face. |
