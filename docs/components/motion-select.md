---
title: Motion Select
description: "Single-select dropdown that scales out of its trigger, with a gliding highlight and drawn-in check."
---

<script setup>
import Demo from '../demos/MotionSelectDemo.vue'
</script>

# Motion Select

Single-select dropdown that scales out of its trigger, with a gliding highlight and drawn-in check.

<ComponentPreview align="start" min-height="420px">
  <Demo />
  <template #code>

<<< @/demos/MotionSelectDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="motion-select" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/motion-select/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/motion-select/MotionSelect.vue [MotionSelect.vue]
<<< @/../registry/ui/motion-select/index.ts [index.ts]
:::
::::

## Usage

```ts
import { MotionSelect } from '@/components/ui/motion-select'
```

```vue
<label for="region">Region</label>
<MotionSelect id="region" v-model="region" :options="regions" placeholder="Pick a region" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string` | — | Selected value. |
| `options` | `MotionSelectOption[]` | — | `{ value, label, disabled? }` |
| `placeholder` | `string` | `'Select an option'` | Trigger text while nothing is selected. |
| `ariaLabel` | `string` | — | Accessible name when there's no `<label for>`. |
| `name` | `string` | — | Adds a hidden input for native form submission. |
| `id` | `string` | auto | Id of the trigger, for `<label for>`. |
| `disabled` | `boolean` | `false` | Disables the trigger. |

| Slot | Props | Description |
| --- | --- | --- |
| `value` | `{ option }` | Custom trigger content. |
| `option` | `{ option, selected, active }` | Custom option content. |

| Event | Payload | Description |
| --- | --- | --- |
| `@change` | `value: string` | Fired when the user picks a different option. |

**Keyboard:** ↑ ↓ / Enter / Space open the list; ↑ ↓ PageUp PageDown Home End move; typing jumps to a matching label; Enter / Space select; Escape / Tab / click outside close. The trigger is a `combobox` that owns a `listbox` via `aria-activedescendant`, so focus never leaves it.
