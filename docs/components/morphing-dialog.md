---
title: Morphing Dialog
description: "A card that morphs into a full dialog using a shared layout transition."
---

<script setup>
import Demo from '../demos/MorphingDialogDemo.vue'
</script>

# Morphing Dialog

A card that morphs into a full dialog using a shared layout transition.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/MorphingDialogDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="morphing-dialog" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/morphing-dialog/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/morphing-dialog/MorphingDialog.vue [MorphingDialog.vue]
<<< @/../registry/ui/morphing-dialog/index.ts [index.ts]
:::
::::

## Usage

```ts
import { MorphingDialog } from '@/components/ui/morphing-dialog'
```

```vue
<MorphingDialog label="Project details">
  <template #trigger>…card…</template>
  <template #content="{ close }">…dialog…</template>
</MorphingDialog>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | `false` | Open state. |
| `label` | `string` | — | Accessible dialog name. |
| `class` | `string` | — | Classes for the trigger surface. |
| `contentClass` | `string` | — | Classes for the dialog surface. |

Closes on `Escape` and overlay click, locks page scroll, and returns focus to the trigger.
