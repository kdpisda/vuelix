---
title: Token Swap
description: "Swap card whose rows trade places on a spinning button, with token search, slippage and a review morph."
---

<script setup>
import Demo from '../demos/TokenSwapDemo.vue'
</script>

# Token Swap

Swap card whose rows trade places on a spinning button, with token search, slippage and a review morph.

<ComponentPreview min-height="520px">
  <Demo />
  <template #code>

<<< @/demos/TokenSwapDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="token-swap" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/token-swap/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/token-swap/TokenSwap.vue [TokenSwap.vue]
<<< @/../registry/ui/token-swap/TokenSwapPicker.vue [TokenSwapPicker.vue]
<<< @/../registry/ui/token-swap/TokenSwapIcon.vue [TokenSwapIcon.vue]
<<< @/../registry/ui/token-swap/types.ts [types.ts]
<<< @/../registry/ui/token-swap/index.ts [index.ts]
:::
::::

## Usage

```ts
import { TokenSwap, type TokenSwapQuote, type TokenSwapToken } from '@/components/ui/token-swap'

const tokens: TokenSwapToken[] = [
  { symbol: 'ETH', name: 'Ether', price: 3412.2, balance: 2.48, icon: '/tokens/eth.svg' },
  { symbol: 'USDC', name: 'USD Coin', price: 1, balance: 1250 },
]

async function action(quote: TokenSwapQuote) {
  await submitSwap(quote) // throw to show an error on the review screen
}
```

```vue
<TokenSwap
  v-model:from="from"
  v-model:to="to"
  v-model:amount="amount"
  v-model:slippage="slippage"
  :tokens="tokens"
  :action="action"
  @swap="track('swap', $event)"
/>
```

This is a UI block — quotes are computed locally from each token's `price`, a pool `fee` and a
fake `liquidity` depth that drives price impact. Replace the `quote` computed with your router's
response for real use. The direction button spins half a turn while the two rows trade places
with a layout animation; the token picker is a searchable listbox (arrow keys, Enter, Escape),
and the slippage popover uses a radio group plus a custom field.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tokens` | `TokenSwapToken[]` | — | Selectable tokens. |
| `v-model:from` | `string` | first token | Symbol you pay with. |
| `v-model:to` | `string` | second token | Symbol you receive. |
| `v-model:amount` | `string` | `''` | Amount you pay. |
| `v-model:slippage` | `number` | `0.5` | Max slippage in percent. |
| `fee` | `number` | `0.003` | Pool fee as a fraction. |
| `liquidity` | `number` | `4000000` | Mock pool depth (USD) for price impact. |
| `action` | `(quote) => Promise<unknown>` | — | Called on confirm. Pending → spinner, thrown `Error` → message. |

`TokenSwapToken`: `{ symbol, name, price, balance?, icon?, color? }`.

| Event | Payload | Description |
| --- | --- | --- |
| `swap` | `TokenSwapQuote` | The swap was confirmed: `{ from, to, amountIn, amountOut, rate, slippage, minReceived, fee, priceImpact }`. |
