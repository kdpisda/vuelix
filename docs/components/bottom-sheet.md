---
title: Bottom Sheet
description: "A mobile-style sheet with snap points, velocity-aware dragging and a background that scales back."
---

<script setup>
import Demo from '../demos/BottomSheetDemo.vue'
</script>

# Bottom Sheet

A mobile-style sheet with snap points, velocity-aware dragging and a background that scales back.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/BottomSheetDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="bottom-sheet" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/bottom-sheet/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/bottom-sheet/BottomSheet.vue [BottomSheet.vue]
<<< @/../registry/ui/bottom-sheet/index.ts [index.ts]
:::
::::

## Usage

```ts
import { BottomSheet } from '@/components/ui/bottom-sheet'
```

```vue
<BottomSheet v-model:open="open" v-model:snap="snap" :snap-points="[0.3, 0.6, 0.92]" label="Filters">
  <template #header>Filters</template>
  …scrollable content…
</BottomSheet>
```

Drag the handle area: on release the sheet projects where your flick would carry it and settles on
the nearest snap point, keeping the flick's velocity in the spring. Pulling below the lowest snap
point closes it. Pressing the handle steps through the snap points; <kbd>↑</kbd>/<kbd>↓</kbd> on
the handle move one step.

While the sheet is open, the `background` element (`#app` by default) scales down slightly in
step with the sheet. Point it at your app's root wrapper — it should not contain `position: fixed`
elements, since a transform makes them scroll with it — or pass `null` to turn it off.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | `false` | Open state. |
| `v-model:snap` | `number` | `1` | Index of the current snap point. |
| `snapPoints` | `number[]` | `[0.25, 0.6, 0.9]` | Visible heights as fractions of the viewport. |
| `dismissible` | `boolean` | `true` | Allow closing by dragging below the lowest snap point. |
| `background` | `string \| HTMLElement \| null` | `'#app'` | Element scaled down behind the sheet. |
| `label` | `string` | — | Accessible name (otherwise the `header` slot labels it). |
| `class` | `string` | — | Classes for the sheet surface. |
| `overlayClass` | `string` | — | Classes for the overlay. |

| Slot | Props | Description |
| --- | --- | --- |
| `header` | `{ close }` | Sits under the handle and is part of the drag area. |
| `default` | `{ close, snap }` | Scrollable sheet content. |

`Escape` closes the sheet and focus returns to whatever opened it. Page scroll is locked while open.
