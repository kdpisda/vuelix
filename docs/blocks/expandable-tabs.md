---
title: Expandable Tabs
description: "An icon-only tab bar where the active tab springs open to reveal its label with a blur-in."
---

<script setup>
import Demo from '../demos/ExpandableTabsDemo.vue'
</script>

# Expandable Tabs

An icon-only tab bar where the active tab springs open to reveal its label with a blur-in.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ExpandableTabsDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="expandable-tabs" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/expandable-tabs/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/expandable-tabs/ExpandableTabs.vue [ExpandableTabs.vue]
<<< @/../registry/ui/expandable-tabs/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ExpandableTabs } from '@/components/ui/expandable-tabs'
```

```vue
<ExpandableTabs
  v-model="section"
  label="Sections"
  :items="[
    { value: 'home', label: 'Home', icon: House },
    { value: 'inbox', label: 'Inbox', icon: Inbox },
    { separator: true },
    { value: 'settings', label: 'Settings', icon: Settings },
  ]"
/>
```

As site navigation, pass `as="nav"` and an `href` per item: items render as links inside a
`<nav>`, and the active one gets `aria-current="page"`.

```vue
<ExpandableTabs v-model="route" as="nav" label="Main" :items="[{ value: 'docs', label: 'Docs', icon: Book, href: '/docs' }]" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `(ExpandableTabItem \| { separator: true })[]` | — | `{ value, label, icon, href?, disabled? }` or a separator. |
| `v-model` | `string` | first enabled item | Active item value. |
| `as` | `'tabs' \| 'nav'` | `'tabs'` | Tablist semantics, or a `<nav>` with links. |
| `label` | `string` | — | Accessible name of the bar. |
| `active-class` | `string` | — | Classes for the expanded item. |

In `tabs` mode the bar has one tab stop and `←` / `→` / `Home` / `End` move the selection. Every
item keeps its label as its accessible name, so icon-only items are never anonymous.
