---
title: CTA Button
description: "Call-to-action buttons with a shimmer sweep, spinning gradient border, magnetic pull or sliding arrow."
---

<script setup>
import Demo from '../demos/CtaButtonDemo.vue'
</script>

# CTA Button

Call-to-action buttons with a shimmer sweep, spinning gradient border, magnetic pull or sliding arrow.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/CtaButtonDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="cta-button" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v class-variance-authority
```

Then copy these files into `components/ui/cta-button/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/cta-button/CtaButton.vue [CtaButton.vue]
<<< @/../registry/ui/cta-button/index.ts [index.ts]
:::
::::

## Usage

```ts
import { CtaButton } from '@/components/ui/cta-button'
```

```vue
<CtaButton variant="arrow" size="lg" @click="start">Get started</CtaButton>

<!-- as a link -->
<CtaButton as="a" href="/pricing" variant="gradient-border">See pricing</CtaButton>
```

Hover effects also play on keyboard focus. With `prefers-reduced-motion` the shimmer and the spinning border stand still, the magnetic pull is off and the arrow stays put.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'shimmer' \| 'gradient-border' \| 'magnetic' \| 'arrow'` | `'shimmer'` | The attention effect. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size. |
| `as` | `string` | `'button'` | Element to render, e.g. `a`. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button type. |
| `disabled` | `boolean` | `false` | Disables the button (`aria-disabled` for links). |
| `strength` | `number` | `0.3` | How far `magnetic` follows the pointer (0 – 1). |
