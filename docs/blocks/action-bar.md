---
title: Action Bar
description: "A floating bulk-action bar that springs in on selection, rolls its count and confirms in place."
---

<script setup>
import Demo from '../demos/ActionBarDemo.vue'
</script>

# Action Bar

A floating bulk-action bar that springs in on selection, rolls its count and confirms in place.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ActionBarDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="action-bar" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/action-bar/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/action-bar/ActionBar.vue [ActionBar.vue]
<<< @/../registry/ui/action-bar/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ActionBar } from '@/components/ui/action-bar'
```

```vue
<ActionBar
  :count="selected.length"
  :actions="[
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'delete', label: 'Delete', icon: Trash2, destructive: true, confirm: true },
  ]"
  @action="run"
  @clear="selected = []"
/>
```

The bar lands compact with just the count, then springs wider to reveal its actions. Changing the
selection rolls only the digits that change. An action with `confirm` swaps the actions for a
question and a confirm button in place; the bar resizes to fit each step.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | — | Number of selected items. The bar shows while it's above `0`. |
| `actions` | `ActionBarAction[]` | — | Actions (see below). |
| `noun` | `string` | `'selected'` | Word after the count. |
| `strategy` | `'fixed' \| 'absolute'` | `'fixed'` | Float over the viewport, or over the nearest positioned parent. |
| `label` | `string` | `'Bulk actions'` | Accessible name of the toolbar. |

`ActionBarAction`: `{ id, label, icon?, destructive?, confirm?: boolean | string, confirmLabel?, disabled? }`.
A string `confirm` is the question shown, e.g. `'Delete 3 files?'`.

| Event | Payload | Description |
| --- | --- | --- |
| `action` | `id: string` | An action ran (after confirmation when it asks for one). |
| `clear` | — | The clear button or `Escape` was pressed. |

The bar is a `toolbar` with a roving tab stop: `←` / `→` / `Home` / `End` move between buttons,
`Escape` backs out of a confirmation or clears the selection, and the count is announced politely.
