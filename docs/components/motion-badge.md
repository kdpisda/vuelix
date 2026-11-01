---
title: Motion Badge
description: "Badge with odometer-style rolling counts and an optional pulsing live dot."
---

<script setup>
import Demo from '../demos/MotionBadgeDemo.vue'
</script>

# Motion Badge

Badge with odometer-style rolling counts and an optional pulsing live dot.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/MotionBadgeDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="motion-badge" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v class-variance-authority
```

Then copy these files into `components/ui/motion-badge/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/motion-badge/MotionBadge.vue [MotionBadge.vue]
<<< @/../registry/ui/motion-badge/index.ts [index.ts]
:::
::::

## Usage

```ts
import { MotionBadge } from '@/components/ui/motion-badge'
```

```vue
<MotionBadge variant="success" live>Operational</MotionBadge>

<!-- count mode: digits roll up when it grows, down when it shrinks -->
<MotionBadge :count="unread" :max="99" variant="destructive" size="sm" />
```

Only the digits that actually change roll; new digit columns slide open when the number gets longer. The badge gives a small bump on every change. Screen readers get the plain number.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'secondary' \| 'outline' \| 'success' \| 'warning' \| 'destructive' \| 'brand'` | `'default'` | Visual style. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size. |
| `count` | `number` | — | Number shown after the slot content, animated on change. |
| `max` | `number` | `Infinity` | Larger counts render as `max+`. |
| `locale` | `string` | — | Locale for thousands separators. |
| `live` | `boolean` | `false` | Adds a pulsing dot (static with reduced motion). |
