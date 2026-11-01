---
title: Fluid Tabs
description: "Tabs whose indicator stretches like liquid between triggers while panels slide and resize."
---

<script setup>
import Demo from '../demos/FluidTabsDemo.vue'
</script>

# Fluid Tabs

Tabs whose indicator stretches like liquid between triggers while panels slide and resize.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/FluidTabsDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="fluid-tabs" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/fluid-tabs/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/fluid-tabs/FluidTabs.vue [FluidTabs.vue]
<<< @/../registry/ui/fluid-tabs/index.ts [index.ts]
:::
::::

## Usage

```ts
import { FluidTabs } from '@/components/ui/fluid-tabs'
```

```vue
<FluidTabs
  v-model="tab"
  :items="[
    { value: 'overview', label: 'Overview' },
    { value: 'billing', label: 'Billing' },
  ]"
>
  <template #overview>…</template>
  <template #billing>…</template>
</FluidTabs>
```

The indicator's two edges are separate motion values on separate springs: the edge facing the
direction of travel snaps ahead, the trailing edge catches up, and the blob thins slightly while
stretched. Panels slide in from the side you're heading to while the panel area springs to the new
height.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `FluidTabItem[]` | — | `{ value, label, icon?, disabled? }` for each tab. |
| `v-model` | `string` | first enabled item | Active tab value. |
| `label` | `string` | — | Accessible name of the tab list. |
| `list-class` | `string` | — | Classes for the tab list (e.g. `self-center`). |
| `panel-class` | `string` | — | Classes for the panel area. |

| Slot | Props | Description |
| --- | --- | --- |
| `#<value>` | — | Panel content for the tab with that value. |
| `trigger` | `{ item, active }` | Custom trigger content. |

Arrow keys, `Home` and `End` move between tabs (automatic activation). With reduced motion the
indicator jumps without stretching and panels only fade.
