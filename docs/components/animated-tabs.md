---
title: Animated Tabs
description: "Tabs with a shared-layout indicator that glides between triggers."
---

<script setup>
import Demo from '../demos/AnimatedTabsDemo.vue'
</script>

# Animated Tabs

Tabs with a shared-layout indicator that glides between triggers.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/AnimatedTabsDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="animated-tabs" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/animated-tabs/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/animated-tabs/AnimatedTabs.vue [AnimatedTabs.vue]
<<< @/../registry/ui/animated-tabs/index.ts [index.ts]
:::
::::

## Usage

```ts
import { AnimatedTabs } from '@/components/ui/animated-tabs'
```

```vue
<AnimatedTabs v-model="tab" :items="[
  { value: 'overview', label: 'Overview' },
  { value: 'analytics', label: 'Analytics' },
]" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `AnimatedTabItem[]` | — | `{ value, label, disabled? }` for each tab. |
| `v-model` | `string` | `first item` | Active tab value. |
| `variant` | `'pill' \| 'underline'` | `'pill'` | Indicator style. |

Supports arrow keys, `Home` and `End`. Use the `#item` slot (`{ item, active }`) to render icons or badges.
