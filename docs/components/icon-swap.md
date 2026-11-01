---
title: Icon Swap
description: "Button that morphs between icon states — copy to check, play to pause — with an optional particle burst."
---

<script setup>
import Demo from '../demos/IconSwapDemo.vue'
</script>

# Icon Swap

Button that morphs between icon states — copy to check, play to pause — with an optional particle burst.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/IconSwapDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="icon-swap" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v class-variance-authority
```

Then copy these files into `components/ui/icon-swap/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/icon-swap/IconSwap.vue [IconSwap.vue]
<<< @/../registry/ui/icon-swap/index.ts [index.ts]
:::
::::

## Usage

```ts
import { IconSwap } from '@/components/ui/icon-swap'
import { Heart } from 'lucide-vue-next'
```

```vue
<script setup lang="ts">
const liked = ref(false)
const states = [
  { value: false, label: 'Like', icon: Heart },
  { value: true, label: 'Unlike', icon: Heart, class: 'text-rose-500 [&_svg]:fill-current', burst: true },
]
</script>

<template>
  <IconSwap v-model="liked" :states="states" effect="scale" variant="ghost" />
</template>
```

Each click moves to the next state (wrapping around), so two states make a toggle and more make a cycle. `label` is the button's accessible name in that state — describe what the button shows or does, e.g. *Copy* → *Copied*. For copy buttons, `reset-after` returns to the first state automatically.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `states` | `IconSwapState[]` | — | States to cycle through: `{ value, label, icon?, class?, burst? }`. |
| `v-model` | `V` | first state | Value of the current state. |
| `effect` | `'rotate' \| 'blur' \| 'scale'` | `'blur'` | How icons swap. |
| `variant` | `'ghost' \| 'outline' \| 'secondary' \| 'default'` | `'outline'` | Visual style. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size. |
| `showLabel` | `boolean` | `false` | Show the label as text next to the icon. |
| `resetAfter` | `number` | — | Return to the first state after this many ms. |
| `disabled` | `boolean` | `false` | Disables the button. |

| Event | Payload | Description |
| --- | --- | --- |
| `change` | `value: V` | Fired when the state changes (click or reset). |

| Slot | Props | Description |
| --- | --- | --- |
| `icon` | `{ state, index }` | Custom icon per state instead of `state.icon`. |
