---
title: Sparkline
description: A tiny trend line that draws itself in, with a smooth monotone curve.
---

<script setup>
import Demo from '../demos/SparklineDemo.vue'
</script>

# Sparkline

A tiny trend line that draws itself in, with a smooth monotone curve.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SparklineDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="sparkline" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/sparkline/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/sparkline/Sparkline.vue [Sparkline.vue]
<<< @/../registry/ui/sparkline/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Sparkline } from '@/components/ui/sparkline'
```

```vue
<Sparkline :data="[12, 18, 14, 22, 19, 28]" class="text-emerald-500" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `number[]` | — | Values to plot. |
| `width / height` | `number` | `160 / 48` | SVG size. |
| `smooth` | `boolean` | `true` | Monotone curve (never overshoots). |
| `area` | `boolean` | `true` | Gradient fill. |
| `showEnd` | `boolean` | `true` | Pulsing end dot. |
| `duration` | `number` | `1.2` | Draw-in seconds. |

Color comes from `currentColor` — set it with any `text-*` class.
