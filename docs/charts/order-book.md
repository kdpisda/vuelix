---
title: Order Book
description: "Live bid/ask ladder with springy depth bars, a spread row, size-change flashes and a buy/sell balance bar."
---

<script setup>
import Demo from '../demos/OrderBookDemo.vue'
</script>

# Order Book

Live bid/ask ladder with springy depth bars, a spread row, size-change flashes and a buy/sell balance bar.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/OrderBookDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="order-book" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/order-book/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/order-book/OrderBook.vue [OrderBook.vue]
<<< @/../registry/ui/order-book/book.ts [book.ts]
<<< @/../registry/ui/order-book/index.ts [index.ts]
:::
::::

## Usage

```ts
import { type BookLevel, OrderBook } from '@/components/ui/order-book'
```

```vue
<OrderBook v-model:cumulative="cumulative" :bids="bids" :asks="asks" :rows="10" />
```

Pass the raw sides in any order — the component sorts them, keeps the best `rows` levels of each
and computes running totals. Just replace `bids` / `asks` on every update:

- depth bars spring to their new length (one shared scale for both sides),
- a level whose size changed flashes — in the side's color when it grew, neutral when it shrank,
- the mid price shows the direction of its last move, and the balance bar compares the displayed size on each side.

Hovering a level highlights the sweep from the spread to it and shows the size-weighted average
price, total size and value of filling through those levels.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `bids` | `BookLevel[]` | — | `{ price, size }` buy orders. |
| `asks` | `BookLevel[]` | — | `{ price, size }` sell orders. |
| `v-model:cumulative` | `boolean` | `false` | Bars show each level's size or the running total. |
| `rows` | `number` | `8` | Levels per side. |
| `title` | `string` | `'Order book'` | Heading. |
| `toggle` | `boolean` | `true` | Built-in level / cumulative switch. |
| `precision` | `number` | `2` | Decimals for prices. |
| `sizePrecision` | `number` | `3` | Decimals for sizes. |
| `locale` | `string` | `'en-US'` | Number formatting. |

The ladder is exposed to assistive tech as a table (price, size, total per level) with a summary label.
