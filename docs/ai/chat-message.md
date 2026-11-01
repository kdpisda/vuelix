---
title: Chat Message
description: "A chat message with avatar, streaming caret and copy, retry and feedback actions that fade in on hover."
---

<script setup>
import Demo from '../demos/ChatMessageDemo.vue'
</script>

# Chat Message

A chat message with avatar, streaming caret and copy, retry and feedback actions that fade in on hover.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ChatMessageDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="chat-message" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/chat-message/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/chat-message/ChatMessage.vue [ChatMessage.vue]
<<< @/../registry/ui/chat-message/ChatBubble.vue [ChatBubble.vue]
<<< @/../registry/ui/chat-message/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ChatBubble, ChatMessage } from '@/components/ui/chat-message'
```

```vue
<ChatMessage from="user" author="Maya" timestamp="10:42 AM" content="How do I use defineModel?" />

<ChatMessage
  v-model:feedback="feedback"
  :streaming="streaming"
  timestamp="10:42 AM"
  @retry="regenerate"
>
  <div v-html="renderedMarkdown" />
</ChatMessage>
```

The default slot accepts rendered Markdown (paragraphs, lists, `code`, `pre`, links, quotes are styled).
While `streaming` is on, a caret blinks after the last element; with no content yet, typing dots show
instead. `ChatBubble` is the bare bubble if you want to build your own layout.

Actions stay hidden until the message is hovered or focused (always visible on touch screens).

## API

### ChatMessage

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `from` | `'user' \| 'assistant'` | `'assistant'` | Alignment and bubble style. |
| `author` | `string` | `'You'` / `'Assistant'` | Display name. |
| `avatar` | `string` | — | Avatar image URL. |
| `initials` | `string` | — | Shown when there's no avatar image. |
| `timestamp` | `string \| Date` | — | Strings show as-is; dates are formatted as a local time after mount. |
| `content` | `string` | — | Plain-text content (rendered when the slot is empty) and what Copy copies. |
| `streaming` | `boolean` | `false` | Caret / typing dots, hides the actions. |
| `actions` | `('copy' \| 'retry' \| 'like' \| 'dislike')[]` | all for assistant, `['copy']` for user | Which hover actions to show. Pass `[]` for none. |
| `hideAvatar` | `boolean` | `false` | Hide the avatar column for grouped messages. |
| `appear` | `boolean` | `true` | Play the entrance animation on mount. |
| `v-model:feedback` | `'like' \| 'dislike' \| null` | `null` | Thumbs state. |

| Event | Payload | Description |
| --- | --- | --- |
| `copy` | `text: string` | After copying to the clipboard. |
| `retry` | — | The regenerate button was pressed. |

| Slot | Description |
| --- | --- |
| default | Message content. |
| `avatar` | Custom avatar. |
| `meta` | Extra content after the timestamp (e.g. a model badge). |
| `actions` | Extra action buttons. |

### ChatBubble

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `from` | `'user' \| 'assistant'` | `'assistant'` | Bubble style. |
| `streaming` | `boolean` | `false` | Blinking caret after the last element. |
