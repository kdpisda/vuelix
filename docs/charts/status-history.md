---
title: Status History
description: "Uptime bars per day that rise in a wave, coloured by status, with an overall uptime readout."
---

<script setup>
import Demo from '../demos/StatusHistoryDemo.vue'
</script>

# Status History

Uptime bars per day that rise in a wave, coloured by status, with an overall uptime readout.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/StatusHistoryDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="status-history" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Copy the [Chart Utils](/charts/chart-utils) and [Number Ticker](/components/number-ticker) files into `components/ui/chart-utils/` and `components/ui/number-ticker/`, then copy these files into `components/ui/status-history/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/status-history/StatusHistory.vue [StatusHistory.vue]
<<< @/../registry/ui/status-history/types.ts [types.ts]
<<< @/../registry/ui/status-history/index.ts [index.ts]
:::
::::

## Usage

```ts
import { StatusHistory } from '@/components/ui/status-history'
```

```vue
<StatusHistory
  title="API"
  :data="[
    { label: 'Oct 29', status: 'ok' },
    { label: 'Oct 30', status: 'degraded', uptime: 99.4, note: 'Elevated latency' },
    { label: 'Oct 31', status: 'ok' },
  ]"
/>
```

Statuses map to theme tokens: `ok` → `--chart-1`, `degraded` → `--chart-4`, `down` → `--destructive`, `unknown` → `--muted`. The header uptime is the mean of every period's `uptime` (inferred as 100, or 0 for `down`, when omitted; `unknown` periods are skipped) and counts up when it changes. A pulsing dot flags the latest period when it isn't `ok`.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `StatusHistoryEntry[]` | — | `{ label, status, uptime?, note? }`, oldest first. |
| `title` | `string` | — | Name shown in the header. |
| `barHeight` | `number` | `36` | Bar height in px. |
| `startLabel` | `string` | `'{n} days ago'` | Caption under the first bar. |
| `endLabel` | `string` | `'Today'` | Caption under the last bar. |
| `statusLabels` | `Partial<Record<StatusHistoryStatus, string>>` | Operational, Degraded, Outage, No data | Words used in the tooltip. |
