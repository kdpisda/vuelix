---
title: Feedback Widget
description: "A floating Feedback pill that morphs into an emoji-rating form, then into a check, then back."
---

<script setup>
import Demo from '../demos/FeedbackWidgetDemo.vue'
</script>

# Feedback Widget

A floating Feedback pill that morphs into an emoji-rating form, then into a check, then back.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/FeedbackWidgetDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="feedback-widget" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/feedback-widget/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/feedback-widget/FeedbackWidget.vue [FeedbackWidget.vue]
<<< @/../registry/ui/feedback-widget/index.ts [index.ts]
:::
::::

## Usage

```ts
import { FeedbackWidget, type FeedbackWidgetPayload } from '@/components/ui/feedback-widget'

async function send(payload: FeedbackWidgetPayload) {
  await fetch('/api/feedback', { method: 'POST', body: JSON.stringify(payload) })
}
```

```vue
<!-- Fixed to the bottom-right corner by default -->
<FeedbackWidget :send="send" @submit="track('feedback', $event)" />

<!-- Or position it yourself -->
<FeedbackWidget class="absolute bottom-4 left-4 items-start" />
```

The pill and the card share a layout id, so motion morphs one into the other. The rating row is a
radio group (arrow keys, Home/End), Escape closes the card, ⌘/Ctrl + Enter sends from the
textarea, and focus returns to the pill when the card collapses.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | `false` | Whether the form is open. |
| `label` | `string` | `'Feedback'` | Text of the collapsed pill. |
| `title` | `string` | `'How was your experience?'` | Question above the rating row. |
| `placeholder` | `string` | `'Tell us what worked…'` | Textarea placeholder. |
| `send` | `(payload) => Promise<unknown>` | — | Optional async sender. Shows a spinner while pending; throw to show an error. |
| `resetDelay` | `number` | `2200` | How long the success state stays (ms). |
| `maxLength` | `number` | `500` | Max message length. |

| Event | Payload | Description |
| --- | --- | --- |
| `submit` | `{ rating: number \| null, message: string }` | Fired when the form is sent. |
