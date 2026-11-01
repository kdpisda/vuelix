---
title: Breadcrumbs
description: "A breadcrumb trail that staggers in, underlines the current page and springs open collapsed levels."
---

<script setup>
import Demo from '../demos/BreadcrumbsDemo.vue'
</script>

# Breadcrumbs

A breadcrumb trail that staggers in, underlines the current page and springs open collapsed levels.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/BreadcrumbsDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="breadcrumbs" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/breadcrumbs/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/breadcrumbs/Breadcrumbs.vue [Breadcrumbs.vue]
<<< @/../registry/ui/breadcrumbs/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
```

```vue
<Breadcrumbs
  :items="[
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'vuelix', href: '/projects/vuelix' },
    { label: 'Settings' },
  ]"
  :max-items="4"
/>
```

The last item is the current page. When the trail is longer than `maxItems`, the middle collapses
into a `…` button; pressing it springs the hidden levels open in place and moves focus to the first
of them. When the trail changes, the underline glides to the new current item.

For a router, use the `item` slot to render your own link (e.g. `RouterLink`), or listen to
`navigate`.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `BreadcrumbsItem[]` | — | `{ label, href?, icon? }` from root to current page. |
| `maxItems` | `number` | `4` | Collapse the middle when the trail is longer than this. |
| `label` | `string` | `'Breadcrumb'` | Accessible name of the `<nav>`. |
| `class` | `string` | — | Classes for the `<nav>`. |

| Event | Payload | Description |
| --- | --- | --- |
| `navigate` | `(item, index)` | A crumb (link or button) was clicked. |

| Slot | Props | Description |
| --- | --- | --- |
| `item` | `{ item, current }` | Custom content for a crumb. |
