---
title: Floating Input
description: "Text field whose label springs up on focus, with an animated focus ring, clear button and sliding error."
---

<script setup>
import Demo from '../demos/FloatingInputDemo.vue'
</script>

# Floating Input

Text field whose label springs up on focus, with an animated focus ring, clear button and sliding error.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/FloatingInputDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="floating-input" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/floating-input/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/floating-input/FloatingInput.vue [FloatingInput.vue]
<<< @/../registry/ui/floating-input/index.ts [index.ts]
:::
::::

## Usage

```ts
import { FloatingInput } from '@/components/ui/floating-input'
```

```vue
<FloatingInput v-model="email" label="Email" type="email" clearable :error="emailError">
  <template #icon><AtSign /></template>
</FloatingInput>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string` | `''` | Field value. |
| `label` | `string` | — | Floating label (required). |
| `type` | `'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url' \| 'number'` | `'text'` | Native input type. |
| `hint` | `string` | — | Helper text under the field, replaced by `error` when set. |
| `error` | `string` | — | Error message: slides in, turns the field red, shakes once and sets `aria-invalid`. |
| `clearable` | `boolean` | `false` | Show a clear button while the field has a value. |
| `placeholder` | `string` | — | Only shown once the label has floated. |
| `disabled` / `readonly` / `required` | `boolean` | `false` | Native states. `required` adds an asterisk to the label. |
| `name` / `id` / `autocomplete` | `string` | — | Passed to the native input. |

| Slot | Description |
| --- | --- |
| `icon` | Leading icon inside the field. |

| Event / Expose | Description |
| --- | --- |
| `@clear` | Fired after the clear button empties the field. |
| `focus()` | Focuses the input. |

Any other attribute (`inputmode`, `maxlength`, `@blur`…) is forwarded to the native `<input>`.
