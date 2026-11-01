---
title: Tilt Card
description: "A 3D card that tilts toward the pointer with a moving glare."
---

<script setup>
import Demo from '../demos/TiltCardDemo.vue'
</script>

# Tilt Card

A 3D card that tilts toward the pointer with a moving glare.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/TiltCardDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="tilt-card" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/tilt-card/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/tilt-card/TiltCard.vue [TiltCard.vue]
<<< @/../registry/ui/tilt-card/index.ts [index.ts]
:::
::::

## Usage

```ts
import { TiltCard } from '@/components/ui/tilt-card'
```

```vue
<TiltCard :max-tilt="12">
  <!-- any content -->
</TiltCard>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `maxTilt` | `number` | `12` | Maximum tilt in degrees. |
| `glare` | `boolean` | `true` | Moving light reflection. |
| `scale` | `number` | `1.02` | Hover scale. |

Respects `prefers-reduced-motion` — tilt is disabled for users who ask for less motion.
