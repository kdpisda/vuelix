---
title: Timeline
description: "A vertical timeline whose line draws in as you scroll while each event pops and slides into place."
---

<script setup>
import Demo from '../demos/TimelineDemo.vue'
</script>

# Timeline

A vertical timeline whose line draws in as you scroll while each event pops and slides into place.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/TimelineDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="timeline" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/timeline/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/timeline/Timeline.vue [Timeline.vue]
<<< @/../registry/ui/timeline/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Timeline, type TimelineItem } from '@/components/ui/timeline'
import { Rocket } from 'lucide-vue-next'
```

```vue
<Timeline :items="[
  { title: 'Kick-off', time: 'Jan 8', datetime: '2025-01-08' },
  { title: 'Beta launch', time: 'Mar 2', icon: Rocket, current: true },
  { title: 'General availability', time: 'Q2' },
]" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `TimelineItem[]` | — | Events, top to bottom. |
| `offset` | `[string, string]` | `['start 60%', 'end 45%']` | Scroll range over which the line draws (motion `useScroll` offsets). |

`TimelineItem`: `{ title, description?, time?, datetime?, icon?, current? }`. `icon` is any component (e.g. a lucide icon). Mark one item `current` and it pulses; earlier items are tinted as done and later ones are dimmed.

| Slot | Props | Description |
| --- | --- | --- |
| `icon` | `{ item, index }` | Content of the dot. |
| `item` | `{ item, index }` | Replace the title / time / description block. |

The list is an `<ol>`, timestamps use `<time datetime>`, and the current step gets `aria-current="step"`. With `prefers-reduced-motion` the line is fully drawn, nothing pops in and the pulse is removed.
