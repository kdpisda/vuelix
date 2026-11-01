---
title: Aurora Background
description: "A section backdrop of soft, slowly drifting gradient blobs with optional film grain; transform-only and light on CPU."
---

<script setup>
import Demo from '../demos/AuroraBackgroundDemo.vue'
</script>

# Aurora Background

A section backdrop of soft, slowly drifting gradient blobs with optional film grain; transform-only and light on CPU.

<ComponentPreview min-height="400px">
  <Demo />
  <template #code>

<<< @/demos/AuroraBackgroundDemo.vue

  </template>
</ComponentPreview>

Each blob is a radial gradient blurred once and then only translated and scaled, so the browser can
move pre-rendered layers on the compositor. Animations pause while the section is off-screen, and
under reduced motion the blobs simply stay put. The grain is a static SVG `feTurbulence` filter.

## Installation

<InstallTabs name="aurora-background" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/aurora-background/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/aurora-background/AuroraBackground.vue [AuroraBackground.vue]
<<< @/../registry/ui/aurora-background/index.ts [index.ts]
:::
::::

## Usage

```ts
import { AuroraBackground } from '@/components/ui/aurora-background'
```

```vue
<AuroraBackground class="flex min-h-[60vh] items-center justify-center">
  <h1>Your headline</h1>
</AuroraBackground>

<!-- Custom palette -->
<AuroraBackground :colors="['#f472b6', '#818cf8', '#22d3ee']" :intensity="0.5" :grain="false" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `colors` | `string[]` | `var(--chart-1…4)` | One blob per colour (any CSS colour). |
| `blur` | `number` | `40` | Blur per blob in px. |
| `intensity` | `number` | `0.65` | Opacity of the aurora layer. |
| `speed` | `number` | `1` | Speed multiplier. |
| `grain` | `boolean` | `true` | Film-grain overlay. |

| Slot | Description |
| --- | --- |
| `default` | Content rendered on top of the aurora. |
