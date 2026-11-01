---
title: Thinking Indicator
description: "AI loading states: wave dots, shimmering text, a pulsing orb, a scan bar and a collapsible reasoning panel."
---

<script setup>
import Demo from '../demos/ThinkingIndicatorDemo.vue'
</script>

# Thinking Indicator

AI loading states: wave dots, shimmering text, a pulsing orb, a scan bar and a collapsible reasoning panel.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ThinkingIndicatorDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="thinking-indicator" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/thinking-indicator/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/thinking-indicator/ThinkingIndicator.vue [ThinkingIndicator.vue]
<<< @/../registry/ui/thinking-indicator/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ThinkingIndicator } from '@/components/ui/thinking-indicator'
```

```vue
<ThinkingIndicator />
<ThinkingIndicator variant="shimmer" label="Searching the web…" />
<ThinkingIndicator variant="orb" label="Listening…" />
<ThinkingIndicator variant="scan" label="Reading files" />
```

The `reasoning` variant shows “Thinking” with a live timer while `thinking` is true, then turns into a “Thought for 12s” button that expands the reasoning:

```vue
<ThinkingIndicator
  v-model:open="showReasoning"
  variant="reasoning"
  :thinking="!reasoningDone"
  :reasoning="reasoningText"
/>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'dots' \| 'shimmer' \| 'orb' \| 'scan' \| 'reasoning'` | `'dots'` | Which indicator to show. |
| `label` | `string` | `'Thinking'` | Visible text (screen-reader only for `dots`). |
| `thinking` | `boolean` | `true` | `reasoning` only: still thinking? |
| `duration` | `number` | measured | `reasoning` only: seconds to show in “Thought for Ns”. |
| `reasoning` | `string` | — | `reasoning` only: panel text (or use the default slot). |
| `v-model:open` | `boolean` | `false` | `reasoning` only: whether the panel is expanded. |

Compact variants are a `role="status"` region. The reasoning variant announces “Thinking” and then “Thought for N seconds” once, not every tick. Loops stop under `prefers-reduced-motion`.
