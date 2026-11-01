---
title: Filmstrip
description: "A gallery preview with a draggable thumbnail rail; a frame glides to the active shot as images slide in."
---

<script setup>
import Demo from '../demos/FilmstripDemo.vue'
</script>

# Filmstrip

A gallery preview with a draggable thumbnail rail; a frame glides to the active shot as images slide in.

<ComponentPreview min-height="480px">
  <Demo />
  <template #code>

<<< @/demos/FilmstripDemo.vue

  </template>
</ComponentPreview>

The main image slides and cross-fades in the direction of travel, the frame on the rail moves with a
shared-layout spring, and the rail glides to keep the active thumbnail in view. Drag the rail when it
overflows, swipe the preview, or use the arrow keys on either.

## Installation

<InstallTabs name="filmstrip" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/filmstrip/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/filmstrip/Filmstrip.vue [Filmstrip.vue]
<<< @/../registry/ui/filmstrip/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Filmstrip, type FilmstripItem } from '@/components/ui/filmstrip'
```

```vue
<Filmstrip
  v-model="index"
  :items="[
    { src: '/photos/1.jpg', thumb: '/photos/1-sm.jpg', alt: 'Harbor at dawn', caption: 'Harbor at dawn' },
    // …
  ]"
  class="max-w-xl"
/>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `number` | `0` | Active index. |
| `items` | `{ src, alt, thumb?, caption? }[]` | — | Images. `thumb` defaults to `src`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Rail below or beside the preview. |
| `loop` | `boolean` | `true` | Wrap around at the ends. |
| `thumbSize` | `number` | `72` | Thumbnail size in px. |
| `label` | `string` | `'Gallery'` | Accessible name. |
