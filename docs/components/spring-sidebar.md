---
title: Spring Sidebar
description: "An app sidebar that springs between full width and an icon rail, with a gliding active indicator."
---

<script setup>
import Demo from '../demos/SpringSidebarDemo.vue'
</script>

# Spring Sidebar

An app sidebar that springs between full width and an icon rail, with a gliding active indicator.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/SpringSidebarDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="spring-sidebar" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/spring-sidebar/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/spring-sidebar/SpringSidebar.vue [SpringSidebar.vue]
<<< @/../registry/ui/spring-sidebar/index.ts [index.ts]
:::
::::

## Usage

```ts
import type { SpringSidebarItem } from '@/components/ui/spring-sidebar'
import { SpringSidebar } from '@/components/ui/spring-sidebar'
import { Inbox, LayoutDashboard, Settings } from 'lucide-vue-next'

const items: SpringSidebarItem[] = [
  { value: 'home', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { value: 'inbox', label: 'Inbox', icon: Inbox, badge: 4 },
  { value: 'settings', label: 'Settings', icon: Settings, children: [
    { value: 'settings/profile', label: 'Profile' },
    { value: 'settings/billing', label: 'Billing' },
  ] },
]
```

```vue
<SpringSidebar v-model:collapsed="collapsed" v-model:active="active" :items="items">
  <template #header="{ collapsed }">…logo…</template>
  <template #footer="{ collapsed }">…account…</template>
</SpringSidebar>
```

Collapsing springs the width down to an icon rail while the labels fade and blur out; badges turn
into dots and hovering or focusing an icon shows a tooltip. In the rail, nested groups fold into
their parent — the active indicator rests on the parent and clicking it expands the sidebar with
the group open.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `SpringSidebarItem[]` | — | `{ value, label, icon?, href?, badge?, children? }`. |
| `v-model:collapsed` | `boolean` | `false` | Rail mode. |
| `v-model:active` | `string` | — | `value` of the current item (`aria-current="page"`). |
| `width` | `number` | `248` | Expanded width (px). |
| `railWidth` | `number` | `64` | Collapsed width (px). |
| `label` | `string` | `'Main'` | Accessible name of the `<nav>`. |
| `class` | `string` | — | Classes for the `<aside>`. |

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `SpringSidebarItem` | A leaf item was chosen. |

| Slot | Props | Description |
| --- | --- | --- |
| `header` | `{ collapsed }` | Top row (logo / workspace). |
| `footer` | `{ collapsed }` | Above the collapse toggle (account, etc.). |

**Keyboard:** <kbd>↑</kbd>/<kbd>↓</kbd>, <kbd>Home</kbd>/<kbd>End</kbd> move between items,
<kbd>→</kbd>/<kbd>←</kbd> open and close groups (and <kbd>←</kbd> jumps from a child to its parent).
