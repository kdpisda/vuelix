---
title: Theme Toggle
description: A sun/moon toggle with a rotating swap animation.
---

<script setup>
import Demo from '../demos/ThemeToggleDemo.vue'
</script>

# Theme Toggle

A sun/moon toggle with a rotating swap animation.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ThemeToggleDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="theme-toggle" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v @vueuse/core
```

Then copy these files into `components/ui/theme-toggle/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/theme-toggle/ThemeToggle.vue [ThemeToggle.vue]
<<< @/../registry/ui/theme-toggle/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ThemeToggle } from '@/components/ui/theme-toggle'
```

```vue
<ThemeToggle />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `storageKey` | `string` | `'vuelix-color-scheme'` | localStorage key used by `useDark`. |

Toggles the `dark` class on `<html>` via `@vueuse/core`. Point `storageKey` at your framework's key (e.g. `nuxt-color-mode`) to stay in sync.
