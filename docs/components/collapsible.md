---
title: Collapsible
description: "A single disclosure whose content springs open to its natural height and blurs into focus."
---

<script setup>
import Demo from '../demos/CollapsibleDemo.vue'
</script>

# Collapsible

A single disclosure whose content springs open to its natural height and blurs into focus.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/CollapsibleDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="collapsible" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/collapsible/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/collapsible/Collapsible.vue [Collapsible.vue]
<<< @/../registry/ui/collapsible/index.ts [index.ts]
:::
::::

## Usage

```ts
import { Collapsible } from '@/components/ui/collapsible'
```

```vue
<Collapsible v-model:open="open" title="Show advanced settings">
  <p>Anything you like.</p>
</Collapsible>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | `false` | Open state. |
| `title` | `string` | — | Trigger text (or use the `#trigger` slot). |
| `disabled` | `boolean` | `false` | Prevents toggling. |
| `triggerClass` | `string` | — | Classes for the trigger button. |
| `contentClass` | `string` | — | Classes for the content wrapper. |

| Slot | Props | Description |
| --- | --- | --- |
| `trigger` | `{ open }` | Custom trigger content; the chevron is added for you. |
| `default` | `{ close }` | The collapsible content. |

| Event | Payload | Description |
| --- | --- | --- |
| `toggle` | `open: boolean` | Fired after the state changes from the trigger or an exposed method. |

Exposed via a template ref: `toggle(force?)`, `show()` and `hide()`.

The trigger is a real `<button>` with `aria-expanded` / `aria-controls`, and the content is a labelled `region`. With `prefers-reduced-motion` the panel opens instantly.
