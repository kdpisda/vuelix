---
title: Task List
description: "An agent's plan with a live progress bar, spinning active step, drawn checkmarks and a strike that sweeps across."
---

<script setup>
import Demo from '../demos/TaskListDemo.vue'
</script>

# Task List

An agent's plan with a live progress bar, spinning active step, drawn checkmarks and a strike that sweeps across.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/TaskListDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="task-list" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/task-list/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/task-list/TaskList.vue [TaskList.vue]
<<< @/../registry/ui/task-list/index.ts [index.ts]
:::
::::

## Usage

```ts
import { TaskList } from '@/components/ui/task-list'
import type { TaskListItem } from '@/components/ui/task-list'
```

```vue
<TaskList :items="plan" title="Migrate to Vue 3.5" />
```

```ts
const plan = ref<TaskListItem[]>([
  { id: 'scan', title: 'Scan for deprecated APIs', status: 'done' },
  { id: 'fix', title: 'Rewrite filters as methods', status: 'in-progress', description: '12 files' },
  { id: 'test', title: 'Run the test suite', status: 'pending' },
])
```

Mutate `status` as the agent works and push new items as the plan grows — new items animate in, the
first batch staggers on mount. The active step gets `aria-current="step"` and the done count is a
polite live region.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `TaskListItem[]` | — | `{ id, title, description?, status }` where status is `'pending' \| 'in-progress' \| 'done' \| 'failed'`. |
| `title` | `string \| false` | `'Plan'` | Heading. `false` hides the header and progress bar. |
