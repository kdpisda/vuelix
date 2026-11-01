---
title: Spring Checkbox
description: "Checkbox that squishes on press and draws its check mark in, with an indeterminate state."
---

<script setup>
import Demo from '../demos/SpringCheckboxDemo.vue'
</script>

# Spring Checkbox

Checkbox that squishes on press and draws its check mark in, with an indeterminate state.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SpringCheckboxDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="spring-checkbox" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/spring-checkbox/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/spring-checkbox/SpringCheckbox.vue [SpringCheckbox.vue]
<<< @/../registry/ui/spring-checkbox/index.ts [index.ts]
:::
::::

## Usage

```ts
import { SpringCheckbox } from '@/components/ui/spring-checkbox'
```

```vue
<SpringCheckbox v-model="accepted">I agree to the terms</SpringCheckbox>

<!-- "select all" -->
<SpringCheckbox v-model="all" :indeterminate="some">Select all</SpringCheckbox>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `boolean` | `false` | Checked state. |
| `indeterminate` | `boolean` | `false` | Shows a dash and sets `aria-checked="mixed"`. Clicking checks the box and emits `update:indeterminate(false)`, so `v-model:indeterminate` works too. |
| `disabled` | `boolean` | `false` | Disables the checkbox and its label. |
| `name` | `string` | — | Adds a hidden input, submitted only while checked. |
| `value` | `string` | `'on'` | Value submitted with the form. |
| `id` | `string` | auto | Id of the checkbox button. |

| Slot | Description |
| --- | --- |
| default | Label text. The whole row is a `<label>`, so clicking the text toggles the box. |
