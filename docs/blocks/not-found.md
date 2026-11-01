---
title: Not Found
description: "A 404 section whose giant digits float, dodge the pointer on springs and can be flung around, with search and links home."
---

<script setup>
import Demo from '../demos/NotFoundDemo.vue'
</script>

# Not Found

A 404 section whose giant digits float, dodge the pointer on springs and can be flung around, with search and links home.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/NotFoundDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="not-found" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/not-found/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/not-found/NotFound.vue [NotFound.vue]
<<< @/../registry/ui/not-found/NotFoundDigit.vue [NotFoundDigit.vue]
<<< @/../registry/ui/not-found/index.ts [index.ts]
:::
::::

## Usage

```ts
import { NotFound } from '@/components/ui/not-found'
```

```vue
<!-- e.g. pages/[...all].vue or your router's catch-all -->
<NotFound
  :links="[{ label: 'Back to home', href: '/' }, { label: 'Contact support', href: '/support' }]"
  @search="q => router.push({ path: '/search', query: { q } })"
/>
```

Each character of `code` is its own glyph: it bobs on an idle loop, springs away from the pointer
and can be dragged and flung — it always snaps home. With reduced motion the digits stay still
(dragging still works) and the content appears without the entrance stagger.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `code` | `string` | `'404'` | The big code; the middle character gets the brand gradient. |
| `title` | `string` | `'This page wandered off'` | Heading text. |
| `description` | `string` | — | Supporting copy under the heading. |
| `links` | `{ label, href }[]` | `[{ label: 'Back to home', href: '/' }]` | Links back into the site; the first is the primary action. |
| `search` | `boolean` | `true` | Show the search field. |
| `searchPlaceholder` | `string` | `'Search the site…'` | Search placeholder. |
| `back` | `boolean` | `true` | Show a **Go back** button (`history.back()`). |
| `headingLevel` | `1 \| 2 \| 3` | `1` | Heading level of the title. |

| Event | Payload | Description |
| --- | --- | --- |
| `search` | `string` | Submitted (trimmed, non-empty) search query. |

| Slot | Description |
| --- | --- |
| `actions` | Extra buttons after the links. |
