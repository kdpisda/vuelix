---
title: Expanding Modal
description: "A modal that grows out of the exact button that opened it and collapses back into it."
---

<script setup>
import Demo from '../demos/ExpandingModalDemo.vue'
</script>

# Expanding Modal

A modal that grows out of the exact button that opened it and collapses back into it.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ExpandingModalDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="expanding-modal" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/expanding-modal/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/expanding-modal/ExpandingModal.vue [ExpandingModal.vue]
<<< @/../registry/ui/expanding-modal/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ExpandingModal } from '@/components/ui/expanding-modal'
```

```vue
<ExpandingModal label="New event">
  <template #trigger>New event</template>
  <template #default="{ close }">
    …dialog content…
  </template>
</ExpandingModal>
```

On open the dialog is measured where it will end up, then a single spring moves it from the
trigger's centre to the middle of the screen while a rounded `clip-path` opens from the trigger's
exact size and corner radius to the full dialog. It starts painted with the trigger's own
background and label, which fade out as the content fades in. Closing re-measures the trigger and
runs the same spring backwards. Unlike [Morphing Dialog](/components/morphing-dialog) there is no
shared layout — any button can become any dialog.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | `false` | Open state. |
| `label` | `string` | — | Accessible name of the dialog. |
| `closeOnOverlay` | `boolean` | `true` | Close when the overlay is clicked. |
| `class` | `string` | — | Classes for the trigger button. |
| `contentClass` | `string` | — | Classes for the dialog surface (size it here). |

| Slot | Props | Description |
| --- | --- | --- |
| `trigger` | — | Trigger button content. |
| `default` | `{ close }` | Dialog content. |

`Escape` and the close button collapse it back; focus is trapped inside while open and returns to
the trigger afterwards. With reduced motion it simply fades.
