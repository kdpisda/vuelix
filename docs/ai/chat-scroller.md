---
title: Chat Scroller
description: "A conversation viewport that sticks to the latest message, springs in a jump pill and keeps its place on prepend."
---

<script setup>
import Demo from '../demos/ChatScrollerDemo.vue'
</script>

# Chat Scroller

A conversation viewport that sticks to the latest message, springs in a jump pill and keeps its place on prepend.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ChatScrollerDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="chat-scroller" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/chat-scroller/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/chat-scroller/ChatScroller.vue [ChatScroller.vue]
<<< @/../registry/ui/chat-scroller/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ChatScroller } from '@/components/ui/chat-scroller'
```

```vue
<ChatScroller class="h-[600px]" @reach-top="loadOlder">
  <template #top>
    <p v-if="loading">Loading earlier messages…</p>
  </template>
  <ChatMessage v-for="m in messages" :key="m.id" v-bind="m" />
</ChatScroller>
```

How it behaves:

- **Sticks to the bottom.** While the reader is at the latest message, any growth (new messages,
  streamed tokens, images loading) keeps the view pinned.
- **Lets go when you scroll up.** Only an upward scroll releases the pin. A pill springs in;
  a dot appears on it when new content arrived meanwhile. Clicking it (or scrolling back down)
  re-pins.
- **Keeps its place on prepend.** When older messages are inserted at the top, the message you were
  reading stays exactly where it was — no jump.

Give it a height (or put it in a flex column with `min-h-0`). The log is focusable so keyboard users
can scroll it with the arrow keys.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | `'Conversation'` | Accessible name of the `role="log"` region. |
| `threshold` | `number` | `48` | Distance from the bottom (px) that still counts as "at the latest". |
| `topThreshold` | `number` | `80` | Distance from the top (px) that fires `reach-top`. |
| `jumpLabel` | `string` | `'Jump to latest'` | Text of the pill. |
| `contentClass` | `string` | — | Classes for the inner column (default `flex flex-col gap-4 p-4`). |

| Event | Description |
| --- | --- |
| `reach-top` | The reader scrolled near the top. Fires once per approach — load and prepend older messages. |

| Slot | Description |
| --- | --- |
| default | The messages. |
| `top` | Rendered above the messages (loader, "beginning of conversation"). |
| `jump` | Custom pill label. Receives `{ unseen }`. |

| Exposed | Type | Description |
| --- | --- | --- |
| `scrollToBottom` | `(behavior?: ScrollBehavior) => void` | Scroll to the latest message and re-pin. |
| `isAtBottom` | `Ref<boolean>` | Whether the view is pinned to the bottom. |
