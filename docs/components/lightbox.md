---
title: Lightbox
description: "An image grid whose thumbnails morph into a full-screen viewer you can swipe through or drag away."
---

<script setup>
import Demo from '../demos/LightboxDemo.vue'
</script>

# Lightbox

An image grid whose thumbnails morph into a full-screen viewer you can swipe through or drag away.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/LightboxDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="lightbox" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/lightbox/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/lightbox/Lightbox.vue [Lightbox.vue]
<<< @/../registry/ui/lightbox/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox'
```

```vue
<Lightbox
  v-model:index="openIndex"
  :images="[
    { src: '/photos/harbor.jpg', thumb: '/photos/harbor-sm.jpg', width: 1500, height: 1000, alt: 'Harbor', caption: 'Lofoten at dawn' },
  ]"
/>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `images` | `LightboxImage[]` | — | `{ src, alt, thumb?, caption?, width?, height? }`. |
| `v-model:index` | `number \| null` | `null` | Index of the open image; `null` when closed. |
| `loop` | `boolean` | `true` | Wrap from the last image to the first. |
| `label` | `string` | `'Image viewer'` | Accessible name of the viewer dialog. |
| `class` | `string` | — | Classes for the grid. |
| `thumbClass` | `string` | — | Classes for each thumbnail button. |
| `viewerClass` | `string` | — | Classes for the teleported viewer. |

Pass `width` and `height` so the viewer can size the image before it loads; `thumb` is shown as a placeholder while the full image arrives.

The clicked thumbnail shares a layout id with the viewer image, so it morphs open, and morphs back if you close on the same image. Use `←` / `→`, the buttons, or swipe to change image; `Escape`, a click on the backdrop, or dragging the image down closes it. The viewer is a modal `dialog` that traps focus, locks page scroll and returns focus to the thumbnail. With `prefers-reduced-motion` images change without sliding or morphing.
