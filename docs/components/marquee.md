---
title: Marquee
description: "Seamless infinite scroller in any direction that eases to a stop on hover, with faded edges."
---

<script setup>
import Demo from '../demos/MarqueeDemo.vue'
</script>

# Marquee

Seamless infinite scroller in any direction that eases to a stop on hover, with faded edges.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/MarqueeDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="marquee" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/marquee/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/marquee/Marquee.vue [Marquee.vue]
<<< @/../registry/ui/marquee/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Marquee } from '@/components/ui/marquee'
```

```vue
<Marquee :speed="40" gap="2rem" label="Customers">
  <img v-for="logo in logos" :key="logo.name" :src="logo.src" :alt="logo.name">
</Marquee>

<!-- vertical marquees need a height -->
<Marquee direction="up" class="h-80">
  <TestimonialCard v-for="t in testimonials" :key="t.id" v-bind="t" />
</Marquee>
```

The slot is rendered once, measured, and repeated just enough times to fill the viewport plus one extra copy, so the loop never shows a seam. Position is a motion value advanced every animation frame — no CSS keyframes and no re-renders. Hovering or focusing eases the speed down to zero and back up.

Repeated copies are `aria-hidden` and `inert`, so screen readers and keyboard users only meet the content once. With `prefers-reduced-motion` the marquee doesn't move and becomes a regular scrollable row.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `direction` | `'left' \| 'right' \| 'up' \| 'down'` | `'left'` | Direction of travel. |
| `speed` | `number` | `40` | Pixels per second. |
| `gap` | `string` | `'1rem'` | Space between items and between copies. |
| `pauseOnHover` | `boolean` | `true` | Ease to a stop while hovered or focused. |
| `paused` | `boolean` | `false` | Stop it yourself, e.g. from a pause button. |
| `fade` | `boolean` | `true` | Mask the leading and trailing edges. |
| `label` | `string` | — | Accessible name of the region. |
