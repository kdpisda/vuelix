---
title: Agent Activity
description: "Live feed of an agent's steps: new steps slide in, the current one shimmers, sub-steps fold away."
---

<script setup>
import Demo from '../demos/AgentActivityDemo.vue'
</script>

# Agent Activity

Live feed of an agent's steps: new steps slide in, the current one shimmers, sub-steps fold away.

<ComponentPreview align="start" min-height="460px">
  <Demo />
  <template #code>

<<< @/demos/AgentActivityDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="agent-activity" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/agent-activity/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/agent-activity/AgentActivity.vue [AgentActivity.vue]
<<< @/../registry/ui/agent-activity/index.ts [index.ts]
:::
::::

## Usage

```ts
import { AgentActivity } from '@/components/ui/agent-activity'
```

```vue
<AgentActivity
  title="Fix the token refresh race"
  :steps="steps"
  :started-at="run.startedAt"
  :ended-at="run.endedAt"
/>
```

```ts
const steps: AgentActivityStep[] = [
  { id: '1', kind: 'search', label: 'Searching the codebase', detail: 'refreshToken(', status: 'done', duration: 1100 },
  {
    id: '2',
    kind: 'command',
    label: 'Running the auth tests',
    detail: 'pnpm vitest run src/auth',
    status: 'running',
    startedAt: Date.now(),
    children: [{ id: '2a', label: 'session.spec.ts', detail: '12 passed', status: 'done' }],
  },
]
```

Push steps as your agent reports them and update their `status`. Steps with `children` open while running and fold away when done, unless the user has toggled them.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `steps` | `AgentActivityStep[]` | — | The steps, in order. |
| `title` | `string` | `'Working'` | What the agent is working on. |
| `startedAt` | `number` | — | Epoch ms the run started; shows a live `m:ss` timer in the header. |
| `endedAt` | `number` | — | Epoch ms the run finished; the header then reads “Worked for …”. |
| `running` | `boolean` | any step pending or running | Overrides whether the run is in progress. |

### AgentActivityStep

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable key. |
| `kind` | `'search' \| 'read' \| 'command' \| 'edit' \| 'think' \| 'web' \| 'other'` | Picks the icon. |
| `label` | `string` | What happens in this step. Shimmers while running. |
| `detail` | `string?` | Mono secondary line: a path, query or command. On sub-steps it shows on the right. |
| `status` | `'pending' \| 'running' \| 'done' \| 'error'` | Drives the spinner, colours and timer. |
| `startedAt` | `number?` | Epoch ms; shows a live timer while running. |
| `duration` | `number?` | Milliseconds, shown once done. |
| `children` | `AgentActivityStep[]?` | Collapsible sub-steps (one level). |

The list is a `role="log"`, so new steps are announced as they arrive; ticking timers are hidden from screen readers. The label shimmer is disabled under `prefers-reduced-motion`.
