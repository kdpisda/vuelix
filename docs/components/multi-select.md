---
title: Multi Select
description: "Pick many options: choices pop into the field as chips and reflow with layout animation."
---

<script setup>
import Demo from '../demos/MultiSelectDemo.vue'
</script>

# Multi Select

Pick many options: choices pop into the field as chips and reflow with layout animation.

<ComponentPreview align="start" min-height="460px">
  <Demo />
  <template #code>

<<< @/demos/MultiSelectDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="multi-select" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/multi-select/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/multi-select/MultiSelect.vue [MultiSelect.vue]
<<< @/../registry/ui/multi-select/index.ts [index.ts]
:::
::::

## Usage

```ts
import { MultiSelect } from '@/components/ui/multi-select'
```

```vue
<MultiSelect v-model="labels" :options="options" placeholder="Add labels…" :max="5" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string[]` | `[]` | Selected values, in the order they were picked. |
| `options` | `MultiSelectOption[]` | — | `{ value, label, disabled? }` |
| `placeholder` | `string` | `'Select…'` | Shown while nothing is selected. |
| `max` | `number` | — | Maximum number of selections; other options disable once reached. |
| `ariaLabel` | `string` | — | Accessible name when there's no `<label for>`. |
| `name` | `string` | — | Adds one hidden input per value (read them with `formData.getAll(name)`). |
| `id` | `string` | auto | Id of the search input, for `<label for>`. |
| `disabled` | `boolean` | `false` | Disables the field. |

| Slot | Props | Description |
| --- | --- | --- |
| `option` | `{ option, selected }` | Custom option content. |

**Keyboard:** typing filters; ↑ ↓ Home End move; Enter toggles the highlighted option and keeps the list open; Backspace in an empty field removes the last chip; Escape / Tab / click outside close.
