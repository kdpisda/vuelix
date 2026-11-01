---
title: Aspect Ratio
description: "A fluid box that holds a ratio and springs smoothly to a new shape when the ratio changes."
---

<script setup>
import Demo from '../demos/AspectRatioDemo.vue'
</script>

# Aspect Ratio

A fluid box that holds a ratio and springs smoothly to a new shape when the ratio changes.

<ComponentPreview min-height="520px" align="start">
  <Demo />
  <template #code>

<<< @/demos/AspectRatioDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="aspect-ratio" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/aspect-ratio/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/aspect-ratio/AspectRatio.vue [AspectRatio.vue]
<<< @/../registry/ui/aspect-ratio/index.ts [index.ts]
:::
::::

## Usage

```ts
import { AspectRatio } from '@/components/ui/aspect-ratio'
```

```vue
<AspectRatio :ratio="16 / 9" src="/cover.jpg" alt="Cover" position="top" />

<!-- or any content -->
<AspectRatio :ratio="1">
  <video src="/clip.mp4" class="size-full object-cover" autoplay muted loop />
</AspectRatio>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `ratio` | `number` | `16 / 9` | Width divided by height. Changing it springs the box to the new shape. |
| `src` | `string` | — | Optional image rendered edge to edge. |
| `alt` | `string` | `''` | Alt text for `src`. |
| `fit` | `'cover' \| 'contain' \| 'fill' \| 'none' \| 'scale-down'` | `'cover'` | `object-fit` for the image. |
| `position` | `string` | `'center'` | `object-position` for the image, e.g. `'top'` or `'30% 70%'`. |

The default slot fills the box (absolutely positioned) and is layered over the image, so it doubles as an overlay. The ratio itself is the animated value, so the box stays fluid in width and is never measured; with `prefers-reduced-motion` it snaps.
