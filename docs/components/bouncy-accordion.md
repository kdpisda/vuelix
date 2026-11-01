---
title: Bouncy Accordion
description: Accordion panels that open with a bouncy height spring and blur-in content.
---

<script setup>
import Demo from '../demos/BouncyAccordionDemo.vue'
</script>

# Bouncy Accordion

Accordion panels that open with a bouncy height spring and blur-in content.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/BouncyAccordionDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="bouncy-accordion" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/bouncy-accordion/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/bouncy-accordion/BouncyAccordion.vue [BouncyAccordion.vue]
<<< @/../registry/ui/bouncy-accordion/index.ts [index.ts]
:::
::::

## Usage

```ts
import { BouncyAccordion } from '@/components/ui/bouncy-accordion'
```

```vue
<BouncyAccordion v-model="open" :items="items" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `BouncyAccordionItem[]` | — | `{ value, title, content? }`. |
| `v-model` | `string[]` | `[]` | Open panel values. |
| `multiple` | `boolean` | `false` | Allow several panels open at once. |

Override rendering with the `#title` and `#content` slots (`{ item }`).
