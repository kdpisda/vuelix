---
title: Odds Card
description: "A prediction-market card: rolling odds, a live sparkline and Yes/No buttons that morph into an order panel."
---

<script setup>
import Demo from '../demos/OddsCardDemo.vue'
</script>

# Odds Card

A prediction-market card: rolling odds, a live sparkline and Yes/No buttons that morph into an order panel.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/OddsCardDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="odds-card" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/odds-card/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/odds-card/OddsCard.vue [OddsCard.vue]
<<< @/../registry/ui/odds-card/RollingNumber.vue [RollingNumber.vue]
<<< @/../registry/ui/odds-card/index.ts [index.ts]
:::
::::

## Usage

```ts
import { OddsCard, type OddsOutcome } from '@/components/ui/odds-card'
```

```vue
<OddsCard
  v-model:selected="selected"
  question="Will it snow in London on Christmas Day?"
  meta="$410K vol · Closes Dec 25"
  :outcomes="[{ id: 'snow', label: 'Snow', probability: 18, history: [12, 14, 15, 21] }]"
  @trade="placeOrder"
/>
```

Feed new `probability` values (and append the old ones to `history`) as the market moves: the
percentages roll digit by digit, the bars and sparkline spring to the new odds and a ▲/▼ chip
shows the last move. Picking **Buy Yes** or **Buy No** morphs that button into an order panel
with an amount field, quick-add presets and a payout preview; **Escape** cancels.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `question` | `string` | — | The market question. |
| `outcomes` | `OddsOutcome[]` | — | `{ id, label, probability (0–100), history?, color? }`. `color` is any CSS color; defaults to `--chart-1…5`. |
| `meta` | `string` | — | Small print under the question (volume, closing date…). |
| `live` | `boolean` | `true` | Show the pulsing **Live** badge. |
| `presets` | `number[]` | `[10, 25, 100]` | Quick-add amounts in the order panel. |
| `currency` | `string` | `'USD'` | Currency used for the payout preview. |
| `locale` | `string` | — | Number formatting locale. |
| `historyLength` | `number` | `24` | Points drawn in the sparkline. |
| `v-model:selected` | `string` | first outcome | Outcome the chance, sparkline and buttons refer to. |

| Event | Payload | Description |
| --- | --- | --- |
| `trade` | `OddsTrade` | `{ outcome, side: 'yes' \| 'no', amount, price, shares, payout }` when an order is placed. |

| Slot | Description |
| --- | --- |
| `media` | Icon or image shown before the question. |
