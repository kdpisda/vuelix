---
title: Toast Stack
description: "Stacked notifications that fan out on hover, with a tiny imperative API."
---

<script setup>
import Demo from '../demos/ToastStackDemo.vue'
</script>

# Toast Stack

Stacked notifications that fan out on hover, with a tiny imperative API.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ToastStackDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="toast-stack" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/toast-stack/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/toast-stack/ToastStack.vue [ToastStack.vue]
<<< @/../registry/ui/toast-stack/use-toast.ts [use-toast.ts]
<<< @/../registry/ui/toast-stack/index.ts [index.ts]
:::
::::

## Usage

```ts
import { toast, ToastStack } from '@/components/ui/toast-stack'
```

```vue
<!-- once, near your app root -->
<ToastStack position="bottom-right" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `'bottom-right' \| 'bottom-left' \| 'bottom-center' \| 'top-*'` | `'bottom-right'` | Screen corner. |
| `visible` | `number` | `3` | Toasts visible while collapsed. |
| `gap` | `number` | `12` | Spacing when expanded (px). |

Fire toasts from anywhere:

```ts
toast('Invite sent')
toast.success('Saved', { description: 'All changes stored.' })
toast.error('Payment failed', { duration: 0 }) // stays until dismissed
toast.dismiss(id)
```

Hovering or focusing the stack expands it and pauses auto-dismiss.
