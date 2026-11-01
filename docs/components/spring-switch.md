---
title: Spring Switch
description: A toggle whose thumb springs across and stretches while pressed.
---

<script setup>
import Demo from '../demos/SpringSwitchDemo.vue'
</script>

# Spring Switch

A toggle whose thumb springs across and stretches while pressed.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SpringSwitchDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="spring-switch" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/spring-switch/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/spring-switch/SpringSwitch.vue [SpringSwitch.vue]
<<< @/../registry/ui/spring-switch/index.ts [index.ts]
:::
::::

## Usage

```ts
import { SpringSwitch } from '@/components/ui/spring-switch'
```

```vue
<SpringSwitch v-model="enabled" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `boolean` | `false` | Checked state. |
| `disabled` | `boolean` | `false` | Disable the switch. |
| `name` | `string` | — | Adds a hidden input for native forms. |
