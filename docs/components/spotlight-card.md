---
title: Spotlight Card
description: "A card lit by a soft spotlight and glowing rim that follow the pointer, with a gentle hover lift."
---

<script setup>
import Demo from '../demos/SpotlightCardDemo.vue'
</script>

# Spotlight Card

A card lit by a soft spotlight and glowing rim that follow the pointer, with a gentle hover lift.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SpotlightCardDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="spotlight-card" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/spotlight-card/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/spotlight-card/SpotlightCard.vue [SpotlightCard.vue]
<<< @/../registry/ui/spotlight-card/index.ts [index.ts]
:::
::::

## Usage

```ts
import { SpotlightCard } from '@/components/ui/spotlight-card'
```

```vue
<SpotlightCard color="var(--chart-2)">
  <template #header>Edge Network</template>
  Serve every request from the closest region.
  <template #footer><a href="/regions">Explore regions</a></template>
</SpotlightCard>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `'var(--brand)'` | Spotlight and rim colour — any CSS colour or theme variable. |
| `size` | `number` | `380` | Diameter of the spotlight in pixels. |
| `lift` | `number` | `4` | How far the card rises on hover, in pixels. `0` disables it. |

| Slot | Description |
| --- | --- |
| `header` | Top section (padded, no divider). |
| `default` | Main content. |
| `footer` | Bottom row, separated by a border. |

The pointer position lives in motion values, so moving across the card never re-renders Vue. When focus moves inside the card with the keyboard, the light settles at its centre. With `prefers-reduced-motion` the lift is disabled and the light jumps instead of easing.
