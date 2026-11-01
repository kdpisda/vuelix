---
title: Scroll Reveal
description: "Reveals children with staggered presets as they scroll into view, plus a springy reading progress bar."
---

<script setup>
import Demo from '../demos/ScrollRevealDemo.vue'
</script>

# Scroll Reveal

Reveals children with staggered presets as they scroll into view, plus a springy reading progress bar.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ScrollRevealDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="scroll-reveal" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/scroll-reveal/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/scroll-reveal/ScrollReveal.vue [ScrollReveal.vue]
<<< @/../registry/ui/scroll-reveal/ScrollProgress.vue [ScrollProgress.vue]
<<< @/../registry/ui/scroll-reveal/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ScrollProgress, ScrollReveal } from '@/components/ui/scroll-reveal'
```

```vue
<!-- once, anywhere on the page: a reading progress bar fixed to the top -->
<ScrollProgress />

<ScrollReveal preset="blur-in" :stagger="0.1" class="grid grid-cols-3 gap-4" item-class="h-full">
  <FeatureCard v-for="f in features" :key="f.id" v-bind="f" />
</ScrollReveal>
```

Every top-level child of `ScrollReveal` (including each item of a `v-for`) is wrapped in its own motion element and revealed in sequence. Style those wrappers with `item-class`. With `prefers-reduced-motion`, children only fade.

`ScrollProgress` tracks the page by default. Pass `container` to follow a scrollable element instead, and `:fixed="false"` to position the bar inside it (see the demo).

## API

### ScrollReveal

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `preset` | `'fade-up' \| 'blur-in' \| 'scale' \| 'slide-left' \| 'slide-right'` | `'fade-up'` | How each child enters. `slide-left` comes in from the left. |
| `stagger` | `number` | `0.08` | Seconds between children. |
| `delay` | `number` | `0` | Seconds before the first child. |
| `distance` | `number` | `24` | Travel in px for `fade-up` and the slides. |
| `once` | `boolean` | `true` | Reveal only the first time. |
| `amount` | `number` | `0.25` | Fraction visible before revealing. |
| `as` | `string` | `'div'` | Wrapper element. |
| `itemClass` | `string` | — | Classes for each child's wrapper. |

### ScrollProgress

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `container` | `HTMLElement \| null` | `null` | Scrollable element to track (page when empty). |
| `position` | `'top' \| 'bottom'` | `'top'` | Edge the bar sticks to. |
| `fixed` | `boolean` | `true` | `fixed` to the viewport, or `absolute` in its parent. |
