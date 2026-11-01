---
title: Suggestion Chips
description: "Prompt suggestions that stagger in, lift on hover, fly into your input on click and reshuffle."
---

<script setup>
import Demo from '../demos/SuggestionChipsDemo.vue'
</script>

# Suggestion Chips

Prompt suggestions that stagger in, lift on hover, fly into your input on click and reshuffle.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SuggestionChipsDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="suggestion-chips" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/suggestion-chips/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/suggestion-chips/SuggestionChips.vue [SuggestionChips.vue]
<<< @/../registry/ui/suggestion-chips/index.ts [index.ts]
:::
::::

## Usage

```ts
import { SuggestionChips } from '@/components/ui/suggestion-chips'
```

```vue
<script setup lang="ts">
const input = ref<HTMLElement>()
const prompt = ref('')
</script>

<template>
  <input ref="input" v-model="prompt">
  <SuggestionChips
    :suggestions="['Summarize this PDF', 'Write a SQL query', 'Plan a trip']"
    :target="input"
    shuffle
    @select="prompt = $event.prompt"
  />
</template>
```

Use `layout="grid"` with `description` for the two-line cards common on empty chat screens:

```vue
<SuggestionChips
  layout="grid"
  :suggestions="[
    { label: 'Explain quantum computing', description: 'in simple terms', icon: Atom },
    { label: 'Write a cover letter', description: 'for a design role', icon: PenLine },
  ]"
/>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `suggestions` | `(string \| SuggestionChipItem)[]` | — | The pool to pick from. |
| `limit` | `number` | `4` | How many are visible at once. |
| `layout` | `'row' \| 'grid'` | `'row'` | Wrapping pills, or two-column cards. |
| `shuffle` | `boolean` | `false` | Show an “Other ideas” button that swaps in a different set. |
| `target` | `string \| HTMLElement \| null` | `null` | Element or selector the chosen chip flies into. Without it, the chip floats up and fades. |
| `label` | `string` | `'Suggested prompts'` | Accessible name of the group. |

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `SuggestionChipItem & { prompt: string }` | A chip was chosen. `prompt` defaults to `label` (+ `description`). |

### SuggestionChipItem

| Field | Type | Description |
| --- | --- | --- |
| `label` | `string` | Chip text. |
| `description` | `string?` | Second line in the grid layout. |
| `prompt` | `string?` | Text to insert, if different from the label. |
| `icon` | `Component?` | Leading icon. |
| `id` | `string?` | Stable key, defaults to `label`. |
