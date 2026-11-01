---
title: Swipe Actions
description: "List rows that swipe to reveal actions, rubber-band, full-swipe to commit and collapse away."
---

<script setup>
import Demo from '../demos/SwipeActionsDemo.vue'
</script>

# Swipe Actions

List rows that swipe to reveal actions, rubber-band, full-swipe to commit and collapse away.

<ComponentPreview min-height="460px">
  <Demo />
  <template #code>

<<< @/demos/SwipeActionsDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="swipe-actions" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/swipe-actions/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/swipe-actions/SwipeActions.vue [SwipeActions.vue]
<<< @/../registry/ui/swipe-actions/SwipeActionsRow.vue [SwipeActionsRow.vue]
<<< @/../registry/ui/swipe-actions/types.ts [types.ts]
<<< @/../registry/ui/swipe-actions/index.ts [index.ts]
:::
::::

## Usage

```ts
import { SwipeActions, type SwipeAction } from '@/components/ui/swipe-actions'
import { Archive, Pin, Trash2 } from 'lucide-vue-next'

const trailing: SwipeAction[] = [
  { id: 'delete', label: 'Delete', icon: Trash2, tone: 'destructive' }, // primary: full swipe
  { id: 'archive', label: 'Archive', icon: Archive },
]

function onAction(action: SwipeAction, mail: Mail) {
  // Removing the item collapses its row with a height animation.
  if (action.id === 'delete')
    mails.value = mails.value.filter(m => m.id !== mail.id)
}
```

```vue
<SwipeActions
  :items="mails"
  :leading="[{ id: 'pin', label: 'Pin', icon: Pin, tone: 'brand' }]"
  :trailing="trailing"
  @action="onAction"
>
  <template #default="{ item }">
    <div class="px-4 py-3">{{ item.title }}</div>
  </template>
</SwipeActions>
```

Drag a row sideways to reveal its actions; release past half the tray to keep it open, or past
`threshold` to slide the row out and fire the primary (first) action. Each row also has a ⋯ menu
button listing every action, so keyboard and screen-reader users get the same options
(arrow keys, Home/End, Escape).

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `T[]` | — | Rows to render. |
| `leading` | `SwipeAction[] \| (item: T) => SwipeAction[]` | `[]` | Revealed by swiping right. The first is the primary action. |
| `trailing` | `SwipeAction[] \| (item: T) => SwipeAction[]` | `[]` | Revealed by swiping left. The first is the primary action. |
| `itemKey` | `string` | `'id'` | Property used as the row key. |
| `itemLabel` | `string` | `'title'` | Property used to name each row's actions menu. |
| `fullSwipe` | `boolean` | `true` | Release past `threshold` to trigger the primary action. |
| `threshold` | `number` | `0.55` | Fraction of the row width that arms a full swipe. |
| `label` | `string` | — | Accessible name of the list. |

`SwipeAction`: `{ id: string, label: string, icon?: Component, tone?: 'default' \| 'brand' \| 'muted' \| 'destructive', class?: string }`.

| Event | Payload | Description |
| --- | --- | --- |
| `action` | `(action: SwipeAction, item: T)` | An action was tapped, picked from the menu or full-swiped. |

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ item, index }` | Row content. |
