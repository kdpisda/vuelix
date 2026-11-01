---
title: Notification Center
description: "A bell with a live badge and a panel of per-app stacks that fan open, swipe away and clear in a cascade."
---

<script setup>
import Demo from '../demos/NotificationCenterDemo.vue'
</script>

# Notification Center

A bell with a live badge and a panel of per-app stacks that fan open, swipe away and clear in a cascade.

<ComponentPreview align="start" min-height="600px">
  <Demo />
  <template #code>

<<< @/demos/NotificationCenterDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="notification-center" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/notification-center/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/notification-center/NotificationCenter.vue [NotificationCenter.vue]
<<< @/../registry/ui/notification-center/index.ts [index.ts]
:::
::::

## Usage

```ts
import { NotificationCenter, type NotificationCenterItem } from '@/components/ui/notification-center'

const notifications = ref<NotificationCenterItem[]>([
  { id: 1, app: 'Messages', title: 'Lena Ortiz', body: 'Running 5 min late', time: '2m' },
  { id: 2, app: 'Deploys', title: 'Production deploy succeeded', time: '6m' },
])
```

```vue
<NotificationCenter v-model:notifications="notifications">
  <template #icon="{ app }">
    <component :is="appIcons[app]" class="size-4" />
  </template>
</NotificationCenter>
```

Put the newest notification first. Notifications are grouped by `app`; a group with more than one
item collapses into a stack — click (or press Enter on) it to fan the cards out. Expanded cards can
be dragged sideways or closed with their × button. Escape or a click outside closes the panel, and
everything is marked as read when it closes.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:notifications` | `NotificationCenterItem[]` | `[]` | The notifications, newest first. |
| `v-model:open` | `boolean` | `false` | Whether the panel is open. |
| `label` | `string` | `'Notifications'` | Accessible name of the bell and panel title. |
| `stack` | `number` | `3` | Cards visible in a collapsed stack. |
| `align` | `'start' \| 'end'` | `'end'` | Which edge of the bell the panel lines up with. |
| `markReadOnClose` | `boolean` | `true` | Set `read: true` on every item when the panel closes. |
| `panelClass` | `string` | — | Extra classes for the panel. |

`NotificationCenterItem`: `{ id: string \| number, app: string, title: string, body?: string, time?: string, read?: boolean, avatar?: string }`.

| Event | Payload | Description |
| --- | --- | --- |
| `dismiss` | `(item)` | A single notification was swiped or closed. |
| `clear` | — | "Clear all" was pressed. |

| Slot | Props | Description |
| --- | --- | --- |
| `icon` | `{ app, item? }` | App icon shown when an item has no `avatar`. |
| `empty` | — | Content of the empty state. |
