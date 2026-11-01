---
title: Pull to Refresh
description: "Pull a scroll area down with rubber-band resistance; a spinning indicator holds while your refresh runs."
---

<script setup>
import Demo from '../demos/PullToRefreshDemo.vue'
</script>

# Pull to Refresh

Pull a scroll area down with rubber-band resistance; a spinning indicator holds while your refresh runs.

<ComponentPreview min-height="480px">
  <Demo />
  <template #code>

<<< @/demos/PullToRefreshDemo.vue

  </template>
</ComponentPreview>

Drag the list down (touch, or press and drag with a mouse). The indicator's ring fills and its
arrow turns as you pull; past the threshold it pops, and on release it spins until the promise
returned by `@refresh` settles, then everything springs back.

## Installation

<InstallTabs name="pull-to-refresh" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/pull-to-refresh/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/pull-to-refresh/PullToRefresh.vue [PullToRefresh.vue]
<<< @/../registry/ui/pull-to-refresh/index.ts [index.ts]
:::
::::

## Usage

```ts
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
```

```vue
<PullToRefresh class="h-96" @refresh="reload">
  <ul>…</ul>
</PullToRefresh>
```

The component is the scroll container: give it a height. `@refresh` (or `:on-refresh`) may return a
promise. A pull is a gesture only — also offer a visible refresh button for keyboard users; it can
call the exposed `refresh()` so the same indicator plays.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `@refresh` / `onRefresh` | `() => unknown \| Promise<unknown>` | — | Runs on release past the threshold. |
| `threshold` | `number` | `72` | Pull distance (px, after resistance) that triggers a refresh. |
| `maxPull` | `number` | `140` | Asymptotic limit of the pull (px). |
| `disabled` | `boolean` | `false` | Turns the gesture off. |
| `labels` | `{ ready?, refreshing?, done? }` | English | Screen-reader announcements. |

| Exposed | Type | Description |
| --- | --- | --- |
| `refresh()` | `() => Promise<void>` | Run a refresh with the indicator, e.g. from a button. |
| `state` | `Ref<'idle' \| 'pulling' \| 'ready' \| 'refreshing' \| 'done'>` | Current phase (also passed to the default slot). |
