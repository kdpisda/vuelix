---
title: Combobox
description: "Searchable select whose options glide in and out as you type, with the matched text highlighted."
---

<script setup>
import Demo from '../demos/ComboboxDemo.vue'
</script>

# Combobox

Searchable select whose options glide in and out as you type, with the matched text highlighted.

<ComponentPreview align="start" min-height="440px">
  <Demo />
  <template #code>

<<< @/demos/ComboboxDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="combobox" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/combobox/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/combobox/Combobox.vue [Combobox.vue]
<<< @/../registry/ui/combobox/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Combobox } from '@/components/ui/combobox'
```

```vue
<Combobox v-model="timezone" :options="zones" aria-label="Time zone" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string` | — | Selected value. |
| `options` | `ComboboxOption[]` | — | `{ value, label, hint?, disabled? }` — `hint` is shown on the right. |
| `placeholder` | `string` | `'Search…'` | Input placeholder. |
| `emptyText` | `string` | `'No results'` | Shown (with the query) when nothing matches. |
| `filter` | `(option, query) => boolean` | substring match | Custom matcher. |
| `ariaLabel` | `string` | — | Accessible name when there's no `<label for>`. |
| `name` | `string` | — | Adds a hidden input for native form submission. |
| `id` | `string` | auto | Id of the input, for `<label for>`. |
| `disabled` | `boolean` | `false` | Disables the input. |

| Slot | Props | Description |
| --- | --- | --- |
| `option` | `{ option, query }` | Custom option content (replaces the highlighted label). |
| `empty` | `{ query }` | Custom "no results" content. |

| Event | Payload | Description |
| --- | --- | --- |
| `@change` | `value: string` | Fired when the user picks a different option. |

**Keyboard:** typing filters and highlights the first match; ↑ ↓ Home End move; Enter selects; Escape closes (or clears the query when already closed). Leaving the field restores the selected label.
