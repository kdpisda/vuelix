---
title: Tool Call
description: "A collapsible card for a tool invocation with a live status indicator, timer and pretty-printed arguments and result."
---

<script setup>
import Demo from '../demos/ToolCallDemo.vue'
</script>

# Tool Call

A collapsible card for a tool invocation with a live status indicator, timer and pretty-printed arguments and result.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ToolCallDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="tool-call" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/tool-call/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/tool-call/ToolCall.vue [ToolCall.vue]
<<< @/../registry/ui/tool-call/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ToolCall } from '@/components/ui/tool-call'
```

```vue
<ToolCall
  name="search_docs"
  description="3 results"
  :status="call.status"
  :args="call.input"
  :result="call.output"
/>
```

Objects (and JSON strings) are pretty-printed with light syntax colouring. Without a `duration`, a
timer runs while the call is `running` and freezes when it finishes. While running, a thin sweep
travels under the header; status changes are announced to screen readers.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | Tool / function name. |
| `description` | `string` | — | One-line summary under the name. |
| `status` | `'pending' \| 'running' \| 'success' \| 'error'` | `'running'` | Drives the indicator. |
| `args` | `unknown` | — | Arguments, pretty-printed. |
| `result` | `unknown` | — | Return value, pretty-printed. A skeleton shows until it arrives. |
| `error` | `string` | — | Message shown when `status` is `'error'`. |
| `duration` | `number` | — | Duration in ms. Overrides the live timer. |
| `v-model:open` | `boolean` | `false` | Whether the details are expanded. |

| Slot | Description |
| --- | --- |
| `icon` | Replaces the wrench icon. |
