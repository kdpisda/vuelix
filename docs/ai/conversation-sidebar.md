---
title: Conversation Sidebar
description: "Chat history grouped by date, with search, a gliding active marker, inline rename and an icon rail."
---

<script setup>
import Demo from '../demos/ConversationSidebarDemo.vue'
</script>

# Conversation Sidebar

Chat history grouped by date, with search, a gliding active marker, inline rename and an icon rail.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ConversationSidebarDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="conversation-sidebar" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/conversation-sidebar/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/conversation-sidebar/ConversationSidebar.vue [ConversationSidebar.vue]
<<< @/../registry/ui/conversation-sidebar/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ConversationSidebar } from '@/components/ui/conversation-sidebar'
```

```vue
<ConversationSidebar
  v-model:active="chatId"
  v-model:collapsed="railOnly"
  :conversations="chats"
  @new="startChat"
  @rename="(id, title) => renameChat(id, title)"
  @delete="deleteChat"
>
  <template #footer="{ collapsed }">
    <UserMenu :compact="collapsed" />
  </template>
</ConversationSidebar>
```

The sidebar fills the height of its parent. It never mutates `conversations`: renames and deletes are emitted for you to apply.

**Keyboard:** <kbd>↑</kbd> / <kbd>↓</kbd> / <kbd>Home</kbd> / <kbd>End</kbd> move between chats, <kbd>F2</kbd> renames the focused chat, <kbd>Enter</kbd> saves and <kbd>Esc</kbd> cancels.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `conversations` | `ConversationSidebarItem[]` | — | `{ id, title, updatedAt }`, where `updatedAt` is a `Date`, timestamp or date string. |
| `v-model:active` | `string` | — | Id of the open conversation. |
| `v-model:collapsed` | `boolean` | `false` | Collapse to a 56px icon rail. |
| `title` | `string` | `'Chats'` | Heading and accessible name. |
| `now` | `Date \| number` | now | Reference time for grouping into Today, Yesterday, Previous 7 days, Previous 30 days and Older. |
| `searchPlaceholder` | `string` | `'Search chats'` | Placeholder of the filter input. |

| Event | Payload | Description |
| --- | --- | --- |
| `new` | — | “New chat” was pressed. |
| `rename` | `id: string, title: string` | A chat was renamed inline (only fired when the title changed). |
| `delete` | `id: string` | The delete action was pressed. |

| Slot | Props | Description |
| --- | --- | --- |
| `footer` | `{ collapsed }` | Pinned to the bottom, e.g. the user menu. |
