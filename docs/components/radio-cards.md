---
title: Radio Cards
description: "Radio group where the selection ring and dot spring between options, as cards or a compact list."
---

<script setup>
import Demo from '../demos/RadioCardsDemo.vue'
</script>

# Radio Cards

Radio group where the selection ring and dot spring between options, as cards or a compact list.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/RadioCardsDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="radio-cards" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/radio-cards/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/radio-cards/RadioCards.vue [RadioCards.vue]
<<< @/../registry/ui/radio-cards/index.ts [index.ts]
:::
::::

## Usage

```ts
import { RadioCards } from '@/components/ui/radio-cards'
```

```vue
<RadioCards v-model="plan" :options="plans" aria-label="Plan" />
<RadioCards v-model="speed" :options="speeds" variant="list" aria-label="Shipping" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string` | — | Selected value. |
| `options` | `RadioCardOption[]` | — | `{ value, label, description?, disabled? }` |
| `variant` | `'cards' \| 'list'` | `'cards'` | Bordered cards in a grid, or compact rows. |
| `columns` | `number` | `3` | Grid columns for `cards`. |
| `ariaLabel` | `string` | — | Accessible name for the radio group. |
| `name` | `string` | — | Adds a hidden input for native form submission. |
| `disabled` | `boolean` | `false` | Disables every option. |

| Slot | Props | Description |
| --- | --- | --- |
| `item` | `{ option, checked }` | Custom content for an option (the ring and dot stay). |

| Event | Payload | Description |
| --- | --- | --- |
| `@change` | `value: string` | Fired when the selection changes. |

**Keyboard:** one tab stop for the group (roving `tabindex`); arrow keys, Home and End move and select, skipping disabled options.
