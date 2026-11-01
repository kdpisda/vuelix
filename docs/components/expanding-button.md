---
title: Expanding Button
description: "A compact button that springs open into an inline panel of actions or a small form, then folds back."
---

<script setup>
import Demo from '../demos/ExpandingButtonDemo.vue'
</script>

# Expanding Button

A compact button that springs open into an inline panel of actions or a small form, then folds back.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ExpandingButtonDemo.vue

  </template>
</ComponentPreview>

The shell springs its real width and height (no scaling, so text never stretches) while the label
and the panel cross-fade. Focus moves into the panel on open; `Escape`, the close button or a click
outside folds it back and returns focus to the button.

## Installation

<InstallTabs name="expanding-button" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/expanding-button/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/expanding-button/ExpandingButton.vue [ExpandingButton.vue]
<<< @/../registry/ui/expanding-button/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ExpandingButton } from '@/components/ui/expanding-button'
```

```vue
<ExpandingButton v-model:open="open" label="Add item">
  <template #trigger><Plus /> Add item</template>
  <template #default="{ close }">
    <form @submit.prevent="add(); close()">
      <input v-model="name" aria-label="Item name">
      <button type="submit">Add</button>
    </form>
  </template>
</ExpandingButton>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | `false` | Expanded state. |
| `label` | `string` | — | Trigger text / accessible name. |
| `panelLabel` | `string` | `label` | Accessible name of the panel. |
| `variant` | `'default' \| 'outline'` | `'default'` | Solid button that opens into a card, or card surface throughout. |
| `hideClose` | `boolean` | `false` | Hide the built-in close button. |
| `panelClass` | `string` | — | Classes for the panel row. |

| Slot | Props | Description |
| --- | --- | --- |
| `trigger` | — | Collapsed content (defaults to `label`). |
| `default` | `{ close }` | Panel content. |
