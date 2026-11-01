---
title: File Tree
description: "A keyboard-navigable file tree whose folders spring open and whose selection glides between rows."
---

<script setup>
import Demo from '../demos/FileTreeDemo.vue'
</script>

# File Tree

A keyboard-navigable file tree whose folders spring open and whose selection glides between rows.

<ComponentPreview min-height="500px" align="start">
  <Demo />
  <template #code>

<<< @/demos/FileTreeDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="file-tree" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/file-tree/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/file-tree/FileTree.vue [FileTree.vue]
<<< @/../registry/ui/file-tree/FileTreeItem.vue [FileTreeItem.vue]
<<< @/../registry/ui/file-tree/FileTreeIcon.vue [FileTreeIcon.vue]
<<< @/../registry/ui/file-tree/context.ts [context.ts]
<<< @/../registry/ui/file-tree/index.ts [index.ts]
:::
::::

## Usage

```ts
import { FileTree, type FileTreeNode } from '@/components/ui/file-tree'
```

```vue
<FileTree
  v-model:expanded="expanded"
  v-model:selected="selected"
  :items="[
    { name: 'src', children: [{ name: 'main.ts' }, { name: 'App.vue' }] },
    { name: 'package.json' },
  ]"
/>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `FileTreeNode[]` | — | `{ name, id?, children?, disabled? }`. A node with `children` (even empty) is a folder. |
| `v-model:selected` | `string` | — | Id of the selected node. Ids default to the path, e.g. `'src/main.ts'`. |
| `v-model:expanded` | `string[]` | `[]` | Ids of the open folders. |
| `label` | `string` | `'Files'` | Accessible name of the tree. |
| `indent` | `number` | `16` | Indentation per level, in pixels. |

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `node, id` | A node was activated with a click, `Enter` or `Space`. |

| Slot | Props | Description |
| --- | --- | --- |
| `icon` | `{ node, folder, open }` | Replace the built-in icons, e.g. with lucide icons. |
| `label` | `{ node, folder }` | Replace the node's name. |

Implements the WAI-ARIA tree pattern: `role="tree"` / `treeitem` / `group` with `aria-level`, `aria-expanded` and `aria-selected`, and a roving tabindex. `↑` `↓` move, `→` opens a folder or steps into it, `←` closes it or jumps to the parent, `Home` / `End` jump to the ends, `Enter` / `Space` select, `*` expands all siblings, and typing a letter jumps to the next matching name.
