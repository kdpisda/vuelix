---
title: Animated Tooltip
description: A lightweight tooltip that springs out from any side with a blur-in.
---

<script setup>
import Demo from '../demos/AnimatedTooltipDemo.vue'
</script>

# Animated Tooltip

A lightweight tooltip that springs out from any side with a blur-in.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/AnimatedTooltipDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="animated-tooltip" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/animated-tooltip/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/animated-tooltip/AnimatedTooltip.vue [AnimatedTooltip.vue]
<<< @/../registry/ui/animated-tooltip/index.ts [index.ts]
:::
::::

## Usage

```ts
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'
```

```vue
<AnimatedTooltip content="Copy to clipboard" side="top">
  <button>Copy</button>
</AnimatedTooltip>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | `string` | — | Tooltip text (or use the `#content` slot). |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Placement. |
| `delay` | `number` | `120` | Open delay in ms. |
