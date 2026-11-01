---
title: Orbit Carousel
description: "Cards on a 3D ring: drag to spin with inertia that snaps to the nearest card, or let it orbit slowly."
---

<script setup>
import Demo from '../demos/OrbitCarouselDemo.vue'
</script>

# Orbit Carousel

Cards on a 3D ring: drag to spin with inertia that snaps to the nearest card, or let it orbit slowly.

<ComponentPreview min-height="420px">
  <Demo />
  <template #code>

<<< @/demos/OrbitCarouselDemo.vue

  </template>
</ComponentPreview>

Each card is placed once with `rotateY` + `translateZ`; only the ring's rotation is animated. Flick
it and it coasts, then lands exactly on a card. Tap a side card to bring it forward. With
`auto-rotate` it drifts on its own, settles the front card when you hover or focus it, and stays
still under reduced motion.

## Installation

<InstallTabs name="orbit-carousel" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/orbit-carousel/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/orbit-carousel/OrbitCarousel.vue [OrbitCarousel.vue]
<<< @/../registry/ui/orbit-carousel/OrbitCarouselCard.vue [OrbitCarouselCard.vue]
<<< @/../registry/ui/orbit-carousel/index.ts [index.ts]
:::
::::

## Usage

```ts
import { OrbitCarousel } from '@/components/ui/orbit-carousel'
```

```vue
<OrbitCarousel v-model="active" :items="products" auto-rotate>
  <template #item="{ item, active }">
    <img :src="item.image" :alt="item.name" class="h-44 w-full object-cover">
    <p>{{ item.name }}</p>
  </template>
</OrbitCarousel>
```

Only the front card is interactive (the others are `inert`), so links inside cards are safe.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `number` | `0` | Index of the front card. |
| `items` | `T[]` | — | Data for each card, passed to the `item` slot. |
| `cardWidth` / `cardHeight` | `number` | `200` / `260` | Card size in px. |
| `gap` | `number` | `28` | Space between cards along the ring (px); sets the radius. |
| `perspective` | `number` | `1200` | Stage perspective in px. |
| `autoRotate` | `boolean` | `false` | Drift slowly; pauses on hover / focus / drag. |
| `autoRotateSpeed` | `number` | `12` | Degrees per second. |
| `label` | `string` | `'Carousel'` | Accessible name. |

| Slot | Props | Description |
| --- | --- | --- |
| `item` | `{ item, index, active }` | Card content (the card surface is provided). |

Keyboard: focus the ring and use `←` / `→`, `Home` / `End`.
