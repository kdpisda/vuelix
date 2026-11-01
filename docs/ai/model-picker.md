---
title: Model Picker
description: "Compact AI model dropdown with capability badges, typeahead and a check mark that glides to your pick."
---

<script setup>
import Demo from '../demos/ModelPickerDemo.vue'
</script>

# Model Picker

Compact AI model dropdown with capability badges, typeahead and a check mark that glides to your pick.

<ComponentPreview align="start" min-height="500px">
  <Demo />
  <template #code>

<<< @/demos/ModelPickerDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="model-picker" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/model-picker/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/model-picker/ModelPicker.vue [ModelPicker.vue]
<<< @/../registry/ui/model-picker/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ModelPicker } from '@/components/ui/model-picker'
```

```vue
<ModelPicker v-model="model" :models="models" side="top" />
```

```ts
const models: ModelPickerOption[] = [
  { value: 'swift-3', name: 'Swift 3', description: 'Quick answers', badges: ['fast'] },
  { value: 'sage-3-thinking', name: 'Sage 3 Thinking', description: 'Works step by step', badges: ['reasoning', 'vision'] },
  { value: 'swift-2', name: 'Swift 2', description: 'Retired', disabled: true },
]
```

**Keyboard:** <kbd>↓</kbd> / <kbd>↑</kbd> on the trigger opens the list. Inside it, <kbd>↑</kbd> / <kbd>↓</kbd> / <kbd>Home</kbd> / <kbd>End</kbd> move, typing jumps to a model by name, <kbd>Enter</kbd> or <kbd>Space</kbd> selects, <kbd>Esc</kbd> closes and returns focus to the trigger.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `models` | `ModelPickerOption[]` | — | The options. |
| `v-model` | `string` | — | `value` of the selected model. |
| `placeholder` | `string` | `'Select a model'` | Trigger text when nothing is selected. |
| `label` | `string` | `'Model'` | Accessible name of the list. |
| `side` | `'bottom' \| 'top'` | `'bottom'` | Open below or above the trigger. |
| `align` | `'start' \| 'end'` | `'start'` | Align the menu to the trigger's left or right edge. |
| `disabled` | `boolean` | `false` | Disable the trigger. |

### ModelPickerOption

| Field | Type | Description |
| --- | --- | --- |
| `value` | `string` | Stored in `v-model`. |
| `name` | `string` | Shown in the trigger and the list. |
| `description` | `string?` | Second line in the list. |
| `badges` | `string[]?` | `fast`, `reasoning` and `vision` get icons; other strings render as plain badges. |
| `icon` | `Component?` | Icon next to the name (a sparkle by default). |
| `disabled` | `boolean?` | Shown but not selectable. |
