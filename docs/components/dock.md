---
title: Dock
description: "A magnifying dock where icons grow as the pointer approaches."
---

<script setup>
import Demo from '../demos/DockDemo.vue'
</script>

# Dock

A magnifying dock where icons grow as the pointer approaches.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/DockDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="dock" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/dock/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/dock/Dock.vue [Dock.vue]
<<< @/../registry/ui/dock/DockItem.vue [DockItem.vue]
<<< @/../registry/ui/dock/context.ts [context.ts]
<<< @/../registry/ui/dock/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Dock, DockItem } from '@/components/ui/dock'
```

```vue
<Dock :magnification="64">
  <DockItem label="Home"><Home /></DockItem>
  <DockItem label="Mail" href="/mail"><Mail /></DockItem>
</Dock>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `Dock · baseSize` | `number` | `40` | Resting icon size (px). |
| `Dock · magnification` | `number` | `64` | Size under the pointer (px). |
| `Dock · distance` | `number` | `140` | Range of influence (px). |
| `DockItem · label` | `string` | — | Accessible label + hover tag. |
| `DockItem · href` | `string` | — | Render as a link. |
| `DockItem · active` | `boolean` | `false` | Show the running indicator. |
