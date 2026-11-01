---
title: Number Ticker
description: "Counts up to a value with spring physics when scrolled into view."
---

<script setup>
import Demo from '../demos/NumberTickerDemo.vue'
</script>

# Number Ticker

Counts up to a value with spring physics when scrolled into view.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/NumberTickerDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="number-ticker" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/number-ticker/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/number-ticker/NumberTicker.vue [NumberTicker.vue]
<<< @/../registry/ui/number-ticker/index.ts [index.ts]
:::
::::

## Usage

```ts
import { NumberTicker } from '@/components/ui/number-ticker'
```

```vue
<NumberTicker
  :value="48291"
  :format="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
/>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | — | Target value. Changing it springs to the new number. |
| `from` | `number` | `0` | Initial value. |
| `format` | `Intl.NumberFormatOptions` | — | Formatting options. |
| `locale` | `string` | — | Formatting locale. |
| `startOnView` | `boolean` | `true` | Wait until visible before counting. |
| `stiffness / damping` | `number` | `90 / 22` | Spring tuning. |
