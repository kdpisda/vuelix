---
title: Dynamic Island
description: "A pill that springs its width, height and radius between live states while the content cross-fades."
---

<script setup>
import Demo from '../demos/DynamicIslandDemo.vue'
</script>

# Dynamic Island

A pill that springs its width, height and radius between live states while the content cross-fades.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/DynamicIslandDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="dynamic-island" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/dynamic-island/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/dynamic-island/DynamicIsland.vue [DynamicIsland.vue]
<<< @/../registry/ui/dynamic-island/index.ts [index.ts]
:::
::::

## Usage

```ts
import { DynamicIsland } from '@/components/ui/dynamic-island'
```

```vue
<DynamicIsland :state="state">
  <template #idle>
    <div class="h-9 w-32" />
  </template>
  <template #timer>
    <div class="flex h-9 w-56 items-center justify-between px-3">
      <TimerIcon class="size-4" /> 4:32
    </div>
  </template>
  <template #call>
    <div class="flex w-80 items-center gap-3 p-3">…</div>
  </template>
</DynamicIsland>
```

Each state is a named slot. The island measures whatever the active slot renders and springs its
width, height and corner radius to fit, so states only need to size their own content (`w-*`,
`h-*`, padding). The outgoing content blurs out while the incoming one blurs in on top.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `state` | `string` | `'idle'` | Active state; the slot with this name is rendered. |
| `radius` | `number` | `32` | Largest corner radius (px). Short states stay a full pill. |
| `label` | `string` | `'Live activity'` | Accessible name of the live region. |

| Slot | Description |
| --- | --- |
| `#<state>` | One slot per state name, e.g. `#idle`, `#call`, `#music`. |

The island is a polite live region (`role="status"`), so state changes are announced. With
reduced motion the size snaps and content only fades.
