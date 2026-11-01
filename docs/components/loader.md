---
title: Loader
description: "Five loaders — wave, orbit, bars, ring and a typing skeleton — that calm down for reduced motion."
---

<script setup>
import Demo from '../demos/LoaderDemo.vue'
</script>

# Loader

Five loaders — wave, orbit, bars, ring and a typing skeleton — that calm down for reduced motion.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/LoaderDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="loader" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/loader/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/loader/Loader.vue [Loader.vue]
<<< @/../registry/ui/loader/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Loader } from '@/components/ui/loader'
```

```vue
<Loader />
<Loader variant="ring" size="lg" class="text-brand" />
<Loader variant="typing" :lines="4" label="Generating a reply" />
```

Loaders draw with `currentColor`, so colour them with any `text-*` class. Each one is a `role="status"` region with a screen-reader label. With `prefers-reduced-motion`, movement is replaced by slower opacity pulses.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'dots' \| 'orbit' \| 'bars' \| 'ring' \| 'typing'` | `'dots'` | Which loader to draw. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Loader size. |
| `label` | `string` | `'Loading'` | Screen-reader text. |
| `lines` | `number` | `3` | Skeleton lines for `typing`. |
