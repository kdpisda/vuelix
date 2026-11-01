---
title: Color Swatches
description: "Color picker where a springy ring hops between swatches, with an optional custom color."
---

<script setup>
import Demo from '../demos/ColorSwatchesDemo.vue'
</script>

# Color Swatches

Color picker where a springy ring hops between swatches, with an optional custom color.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ColorSwatchesDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="color-swatches" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/color-swatches/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/color-swatches/ColorSwatches.vue [ColorSwatches.vue]
<<< @/../registry/ui/color-swatches/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ColorSwatches } from '@/components/ui/color-swatches'
```

```vue
<ColorSwatches
  v-model="accent"
  :colors="['#10b981', '#0ea5e9', { value: '#6366f1', label: 'Indigo' }]"
  custom
  aria-label="Accent color"
/>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string` | — | Selected color. |
| `colors` | `(string \| ColorSwatch)[]` | — | CSS colors, or `{ value, label? }` to give each one a name. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Swatch size. |
| `custom` | `boolean` | `false` | Adds a swatch that opens the native color picker; it holds any value that isn't a preset. |
| `ariaLabel` | `string` | `'Color'` | Accessible name for the radio group. |
| `name` | `string` | — | Adds a hidden input for native form submission. |
| `disabled` | `boolean` | `false` | Disables every swatch. |

| Event | Payload | Description |
| --- | --- | --- |
| `@change` | `value: string` | Fired when the selection changes. |

Hex colors get a dark or light check mark depending on their luminance. Arrow keys move and select (roving `tabindex`); arrowing onto the custom swatch only focuses it — Enter / Space opens the picker.
