---
title: Text Reveal
description: Staggered word or character reveal with blur and lift.
---

<script setup>
import Demo from '../demos/TextRevealDemo.vue'
</script>

# Text Reveal

Staggered word or character reveal with blur and lift.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/TextRevealDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="text-reveal" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/text-reveal/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/text-reveal/TextReveal.vue [TextReveal.vue]
<<< @/../registry/ui/text-reveal/index.ts [index.ts]
:::
::::

## Usage

```ts
import { TextReveal } from '@/components/ui/text-reveal'
```

```vue
<TextReveal as="h2" text="Motion that feels physical." />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | — | Text to reveal. |
| `by` | `'word' \| 'char'` | `'word'` | Split granularity. |
| `as` | `string` | `'p'` | Rendered tag. |
| `stagger` | `number` | `0.06` | Seconds between pieces. |
| `delay` | `number` | `0` | Delay before the first piece. |
| `repeat` | `boolean` | `false` | Replay every time it re-enters the viewport. |
