---
title: Avatar Group
description: "Overlapping avatars that spread apart on hover with springy name tags."
---

<script setup>
import Demo from '../demos/AvatarGroupDemo.vue'
</script>

# Avatar Group

Overlapping avatars that spread apart on hover with springy name tags.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/AvatarGroupDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="avatar-group" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/avatar-group/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/avatar-group/AvatarGroup.vue [AvatarGroup.vue]
<<< @/../registry/ui/avatar-group/index.ts [index.ts]
:::
::::

## Usage

```ts
import { AvatarGroup } from '@/components/ui/avatar-group'
```

```vue
<AvatarGroup :items="people" :max="5" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `AvatarGroupItem[]` | — | `{ name, src? }` — initials are used without `src`. |
| `max` | `number` | `5` | Avatars before a `+N` bubble. |
| `size` | `number` | `40` | Avatar size (px). |
