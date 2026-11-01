---
title: Overflow Toolbar
description: "A toolbar that measures its width and springs the actions that don't fit into a “more” menu."
---

<script setup>
import Demo from '../demos/OverflowToolbarDemo.vue'
</script>

# Overflow Toolbar

A toolbar that measures its width and springs the actions that don't fit into a “more” menu.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/OverflowToolbarDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="overflow-toolbar" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/overflow-toolbar/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/overflow-toolbar/OverflowToolbar.vue [OverflowToolbar.vue]
<<< @/../registry/ui/overflow-toolbar/index.ts [index.ts]
:::
::::

## Usage

```ts
import { OverflowToolbar } from '@/components/ui/overflow-toolbar'
```

```vue
<OverflowToolbar
  label="Formatting"
  :items="[
    { id: 'bold', label: 'Bold', icon: Bold, group: 'marks', pressed: isBold },
    { id: 'italic', label: 'Italic', icon: Italic, group: 'marks' },
    { id: 'link', label: 'Link', icon: Link, group: 'insert' },
  ]"
  @action="run"
/>
```

Every item is measured once in an invisible row; a `ResizeObserver` then decides how many fit,
keeping room for the **⋯** button. Items leaving the bar shrink towards it, the rest reflow with a
layout spring, and while the menu is open items fly between the bar and the menu.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `OverflowToolbarItem[]` | — | Actions, in priority order (the last ones overflow first). |
| `label` | `string` | `'Toolbar'` | Accessible name of the toolbar. |
| `more-label` | `string` | `'More actions'` | Accessible name of the overflow button. |
| `menu-class` | `string` | — | Classes for the overflow menu. |

`OverflowToolbarItem`:

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Emitted with `action`. |
| `label` | `string` | Tooltip / accessible name, and the menu label. |
| `icon` | `Component` | Icon. Items without one show their label. |
| `pressed` | `boolean` | Toggle state → `aria-pressed` in the bar, `menuitemcheckbox` in the menu. |
| `disabled` | `boolean` | Skipped by keyboard navigation. |
| `group` | `string` | A separator is drawn between groups. |
| `showLabel` | `boolean` | Show the label next to the icon in the bar. |

| Event | Payload | Description |
| --- | --- | --- |
| `action` | `id: string` | An item was clicked, in the bar or the menu. |

The bar has a single tab stop: `←` / `→` / `Home` / `End` move focus, `↓` on **⋯** opens the
menu, and inside the menu `↑` / `↓` move, `Escape` closes it and returns focus.
