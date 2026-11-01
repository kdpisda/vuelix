---
title: Stepper
description: "Multi-step progress with spring-filled connectors, steps that morph into checks and a pulsing current step."
---

<script setup>
import Demo from '../demos/StepperDemo.vue'
</script>

# Stepper

Multi-step progress with spring-filled connectors, steps that morph into checks and a pulsing current step.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/StepperDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="stepper" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/stepper/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/stepper/Stepper.vue [Stepper.vue]
<<< @/../registry/ui/stepper/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Stepper } from '@/components/ui/stepper'
```

```vue
<script setup lang="ts">
const step = ref(0)
const steps = [
  { title: 'Account', description: 'Email & password' },
  { title: 'Workspace' },
  { title: 'Launch' },
]
</script>

<template>
  <Stepper v-model:step="step" :steps="steps" />
  <button @click="step++">Next</button>
</template>
```

`step` is zero-based; set it to `steps.length` to mark every step complete. Completed steps are buttons that jump back (set `:linear="false"` to also allow jumping ahead, or `:clickable="false"` for a read-only indicator).

The stepper is a container-query component: when a horizontal stepper is narrower than `32rem`, the label row turns into a single animated "Step 2 of 4 · Workspace" caption.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `steps` | `{ title: string, description?: string, disabled?: boolean }[]` | — | The steps. |
| `step` (`v-model:step`) | `number` | `0` | Index of the current step. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction. |
| `clickable` | `boolean` | `true` | Steps are buttons that navigate. |
| `linear` | `boolean` | `true` | Only allow going back to completed steps. |
| `label` | `string` | `'Progress'` | Accessible name of the `<nav>`. |
