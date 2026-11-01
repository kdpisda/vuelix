---
title: Prompt Input
description: "An AI composer with an auto-growing textarea, pop-in attachment chips and a send button that morphs into stop."
---

<script setup>
import Demo from '../demos/PromptInputDemo.vue'
</script>

# Prompt Input

An AI composer with an auto-growing textarea, pop-in attachment chips and a send button that morphs into stop.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/PromptInputDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="prompt-input" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/prompt-input/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/prompt-input/PromptInput.vue [PromptInput.vue]
<<< @/../registry/ui/prompt-input/index.ts [index.ts]
:::
::::

## Usage

```ts
import { PromptInput } from '@/components/ui/prompt-input'
```

```vue
<PromptInput
  v-model="text"
  v-model:attachments="files"
  :loading="generating"
  :max-length="4000"
  @submit="send"
  @stop="abort"
>
  <template #model>
    <ModelPicker v-model="model" />
  </template>
</PromptInput>
```

**Enter** sends, **Shift + Enter** adds a line (IME composition is respected), **Esc** stops while
loading. Files can be picked, dropped onto the composer or pasted; images get a thumbnail.
The textarea grows up to `maxRows`, then scrolls.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string` | `''` | The prompt text. |
| `v-model:attachments` | `PromptAttachment[]` | `[]` | Attached files: `{ id, name, size?, type?, preview?, file? }`. |
| `loading` | `boolean` | `false` | Turns the send button into a stop button. |
| `disabled` | `boolean` | `false` | Disables the composer. |
| `placeholder` | `string` | `'Ask anything…'` | Textarea placeholder. |
| `maxLength` | `number` | — | Shows a counter and blocks sending above the limit. |
| `maxRows` | `number` | `8` | Rows to grow before scrolling. |
| `allowAttachments` | `boolean` | `true` | Attach button, drop and paste of files. |
| `accept` | `string` | — | `accept` for the file picker. |
| `clearOnSubmit` | `boolean` | `true` | Clear text and attachments after `submit`. |
| `hint` | `string \| false` | `'Enter to send · Shift + Enter for a new line'` | Helper text under the composer. |
| `label` | `string` | `'Message'` | Accessible name of the textarea. |

| Event | Payload | Description |
| --- | --- | --- |
| `submit` | `value: string, attachments: PromptAttachment[]` | Enter or the send button. |
| `stop` | — | Stop button or Esc while `loading`. |
| `attach` | `files: File[]` | Files were added (already in `attachments`). |

| Slot | Description |
| --- | --- |
| `model` | Next to the attach button — a model picker. |
| `tools` | More toolbar buttons (search, voice…). |

| Exposed | Description |
| --- | --- |
| `focus()` | Focus the textarea. |
