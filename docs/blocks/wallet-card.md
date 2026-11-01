---
title: Wallet Card
description: "A stack of payment cards that springs a card to the front, flips it for details and rolls in its balance."
---

<script setup>
import Demo from '../demos/WalletCardDemo.vue'
</script>

# Wallet Card

A stack of payment cards that springs a card to the front, flips it for details and rolls in its balance.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/WalletCardDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="wallet-card" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/wallet-card/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/wallet-card/WalletCard.vue [WalletCard.vue]
<<< @/../registry/ui/wallet-card/RollingNumber.vue [RollingNumber.vue]
<<< @/../registry/ui/wallet-card/index.ts [index.ts]
:::
::::

## Usage

```ts
import { WalletCard, type WalletCardItem } from '@/components/ui/wallet-card'
```

```vue
<WalletCard
  v-model:active="active"
  :cards="[{
    id: 'everyday',
    label: 'Everyday',
    brand: 'VISA',
    number: '4929 1840 3302 7741',
    holder: 'Mara Lindqvist',
    expiry: '09/29',
    cvv: '381',
    balance: 4821.36,
    background: 'linear-gradient(135deg, #0f172a, #334155)',
    foreground: '#f8fafc',
    transactions: [{ id: 't1', merchant: 'Blue Bottle Coffee', amount: -6.5, date: 'Today' }],
  }]"
/>
```

Click a card peeking out of the stack (or press the arrow keys) to pull it out and drop it in
front; click the front card to flip it and reveal the full number and CVV (**Escape** flips it
back). The balance rolls to the new card's value and its transactions slide in from under the card.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `cards` | `WalletCardItem[]` | — | See below. |
| `v-model:active` | `string` | first card | Id of the card in front. |
| `currency` | `string` | `'USD'` | Currency for the balance and transactions. |
| `locale` | `string` | — | Number formatting locale. |
| `peek` | `number` | `16` | Pixels each card behind the front one peeks out. |

`WalletCardItem`: `{ id, label, brand, number, holder, expiry, cvv, balance, background?, foreground?, transactions? }`.
`background` is any CSS background (color or gradient) and `foreground` its text color; without them
the card uses the `primary` token. Transactions are `{ id, merchant, amount, date }` — negative amounts are spending.

| Slot | Props | Description |
| --- | --- | --- |
| `transaction` | `{ transaction }` | Custom content for a transaction row. |
