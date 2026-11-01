---
title: Alert
description: "Inline alert whose icon pops and draws itself in, with a dismiss that smoothly collapses its height."
---

<script setup>
import Demo from '../demos/AlertDemo.vue'
</script>

# Alert

Inline alert whose icon pops and draws itself in, with a dismiss that smoothly collapses its height.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/AlertDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="alert" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v class-variance-authority
```

Then copy these files into `components/ui/alert/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/alert/Alert.vue [Alert.vue]
<<< @/../registry/ui/alert/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Alert } from '@/components/ui/alert'
```

```vue
<Alert variant="success" title="Deployment complete">
  Production is live at vuelix.dev.
</Alert>

<!-- dismissible, with two-way open state -->
<Alert v-model:open="showBanner" variant="warning" title="Storage almost full" dismissible>
  You've used 92% of your plan.
  <template #actions>
    <button>Upgrade</button>
  </template>
</Alert>
```

The shape of the icon pops in with a spring, then its glyph draws itself. Dismissing fades the content and collapses the height (and any margin you gave it via `class`), so the alerts below glide up instead of jumping. Setting `open` back to `true` expands it again.

Errors and warnings render with `role="alert"`; info and success use `role="status"` so screen readers announce them politely.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Tone, icon and ARIA role. |
| `title` | `string` | — | Bold first line (or use the `title` slot). |
| `dismissible` | `boolean` | `false` | Shows a close button. |
| `dismissLabel` | `string` | `'Dismiss'` | Accessible label of the close button. |
| `icon` | `boolean` | `true` | Renders the animated icon. |
| `open` (`v-model:open`) | `boolean` | `true` | Whether the alert is shown. |

| Event | Payload | Description |
| --- | --- | --- |
| `dismiss` | — | The close button was pressed. |

| Slot | Description |
| --- | --- |
| `default` | Description text. |
| `title` | Rich title content. |
| `icon` | Replace the built-in icon. |
| `actions` | Buttons rendered under the text. |
