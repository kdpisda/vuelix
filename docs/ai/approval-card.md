---
title: Approval Card
description: "Asks the user to approve an agent action, then collapses into a compact resolved row with a stamp that slams in."
---

<script setup>
import Demo from '../demos/ApprovalCardDemo.vue'
</script>

# Approval Card

Asks the user to approve an agent action, then collapses into a compact resolved row with a stamp that slams in.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ApprovalCardDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="approval-card" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/approval-card/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/approval-card/ApprovalCard.vue [ApprovalCard.vue]
<<< @/../registry/ui/approval-card/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ApprovalCard } from '@/components/ui/approval-card'
```

```vue
<ApprovalCard
  v-model:status="status"
  title="Run a shell command"
  description="Clear the cache and rebuild."
  risk="medium"
  :details="{ Command: 'rm -rf .cache && pnpm build', Directory: '~/app' }"
  @approve="agent.resume()"
  @deny="agent.cancel()"
/>
```

After a decision the card fades its body, springs down to a one-line summary and stamps the verdict.
Focus moves to the summary so keyboard users don't lose their place. Set `status` back to
`'pending'` to ask again.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | What the agent wants to do. |
| `description` | `string` | — | Why, in a sentence. |
| `details` | `{ label, value }[] \| Record<string, string>` | — | Facts about the action, shown as a key/value list. |
| `risk` | `'low' \| 'medium' \| 'high'` | `'medium'` | Badge and icon colour. |
| `approveLabel` | `string` | `'Approve'` | Approve button text. |
| `denyLabel` | `string` | `'Deny'` | Deny button text. |
| `v-model:status` | `'pending' \| 'approved' \| 'denied'` | `'pending'` | Decision state. |

| Event | Description |
| --- | --- |
| `approve` | The user approved. |
| `deny` | The user denied. |

| Slot | Description |
| --- | --- |
| default | Extra content under the details (e.g. a code block or diff). |
| `icon` | Replaces the shield icon. |
| `resolved` | Text under the title once decided. Receives `{ status }`. |
