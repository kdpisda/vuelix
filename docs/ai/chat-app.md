---
title: Chat App
description: "A complete AI chat: header, welcome screen with suggestions, streaming messages and a prompt composer."
---

<script setup>
import Demo from '../demos/ChatAppDemo.vue'
</script>

# Chat App

A complete AI chat interface composed from [Chat Message](/ai/chat-message), [Chat Scroller](/ai/chat-scroller) and [Prompt Input](/ai/prompt-input): a header, a welcome screen with suggestions, streaming messages that stay pinned to the bottom, and a composer whose send button turns into stop while generating.

<ComponentPreview min-height="620px">
  <Demo />
  <template #code>

<<< @/demos/ChatAppDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="chat-app" />

The CLI also installs `chat-message`, `chat-scroller` and `prompt-input`.

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Copy [Chat Message](/ai/chat-message), [Chat Scroller](/ai/chat-scroller) and [Prompt Input](/ai/prompt-input) first, then these files into `components/ui/chat-app/`:

::: code-group
<<< @/../registry/ui/chat-app/ChatApp.vue [ChatApp.vue]
<<< @/../registry/ui/chat-app/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ChatApp, type ChatAppMessage } from '@/components/ui/chat-app'
```

```vue
<script setup lang="ts">
const messages = ref<ChatAppMessage[]>([])
const loading = ref(false)

async function onSend(text: string) {
  messages.value.push({ id: crypto.randomUUID(), from: 'user', content: text })
  const reply = { id: crypto.randomUUID(), from: 'assistant' as const, content: '', streaming: true }
  messages.value.push(reply)
  loading.value = true
  for await (const chunk of streamFromYourApi(text)) // your backend
    reply.content += chunk
  reply.streaming = false
  loading.value = false
}
</script>

<template>
  <ChatApp
    v-model:messages="messages"
    :loading="loading"
    :suggestions="['Summarise this page', 'Write a haiku']"
    @send="onSend"
  />
</template>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:messages` | `ChatAppMessage[]` | `[]` | `{ id, from: 'user' \| 'assistant', content, streaming?, timestamp?, feedback? }` |
| `v-model:draft` | `string` | `''` | Composer text. |
| `loading` | `boolean` | `false` | A reply is being generated (send becomes stop). |
| `title` / `subtitle` | `string` | `'New chat'` | Header text (the title cross-fades when it changes). |
| `suggestions` | `string[]` | `[]` | Prompts shown on the empty state; clicking one sends it. |
| `greeting` | `string` | `'How can I help you today?'` | Empty-state heading. |
| `placeholder` | `string` | `'Send a message…'` | Composer placeholder. |
| `assistantName` / `assistantAvatar` | `string` | `'Assistant'` | Assistant identity on messages. |
| `allowAttachments` | `boolean` | `true` | Attach / drop / paste files in the composer. |

| Event | Payload | Description |
| --- | --- | --- |
| `send` | `(text, attachments)` | The user sent a message: append it and the assistant reply to `messages`. |
| `stop` | — | The stop button was pressed. |
| `retry` | `(message)` | Regenerate an assistant message. |

Slots: `header`, `header-actions`, `empty` (`{ send }`).
