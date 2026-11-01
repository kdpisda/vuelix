---
title: Spring Button
description: "A button with springy hover/press physics and a morphing loading state."
---

<script setup>
import Demo from '../demos/SpringButtonDemo.vue'
</script>

# Spring Button

A button with springy hover/press physics and a morphing loading state.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SpringButtonDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="spring-button" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v class-variance-authority
```

Then copy these files into `components/ui/spring-button/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/spring-button/SpringButton.vue [SpringButton.vue]
<<< @/../registry/ui/spring-button/index.ts [index.ts]
:::
::::

## Usage

```ts
import { SpringButton } from '@/components/ui/spring-button'
```

```vue
<SpringButton :loading="saving" @click="save">
  Save changes
  <template #loading>Saving…</template>
</SpringButton>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive' \| 'brand'` | `'default'` | Visual style. |
| `size` | `'sm' \| 'default' \| 'lg' \| 'icon'` | `'default'` | Button size. |
| `loading` | `boolean` | `false` | Swaps the label for a spinner + `#loading` slot and disables the button. |
| `disabled` | `boolean` | `false` | Disables interaction and press physics. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button type. |
