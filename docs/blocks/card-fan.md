---
title: Card Fan
description: "A hand of cards dealt from a deck into a springy fan; hover to lift, click to play, shuffle to re-deal."
---

<script setup>
import Demo from '../demos/CardFanDemo.vue'
</script>

# Card Fan

A hand of cards dealt from a deck into a springy fan; hover to lift, click to play, shuffle to re-deal.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/CardFanDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="card-fan" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/card-fan/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/card-fan/CardFan.vue [CardFan.vue]
<<< @/../registry/ui/card-fan/index.ts [index.ts]
:::
::::

## Usage

```ts
import { CardFan, type CardFanItem } from '@/components/ui/card-fan'
```

```vue
<CardFan :cards="cards" :hand-size="5" @play="onPlay">
  <template #controls="{ shuffle, busy }">
    <button :disabled="busy" @click="shuffle">Shuffle & deal</button>
  </template>
</CardFan>
```

Every card is one element that springs between three piles — the deck (face down, top left),
the fanned hand and the table in the middle — so dealing, playing and gathering are all the same
motion. The hand is a roving-tabindex group: arrow keys move between cards, **Enter** plays the
focused one. Click the deck to draw a card. Replace the default face or back with the `face` and
`back` slots.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `cards` | `CardFanItem[]` | — | `{ id, rank, symbol?, title?, color?, label? }`. `color` is any CSS color; `label` is the accessible name. |
| `handSize` | `number` | `5` | Cards dealt into the hand. |
| `spread` | `number` | `9` | Degrees between neighbouring cards (squeezed on narrow stages). |
| `autoDeal` | `boolean` | `true` | Deal a hand on mount. |
| `cardWidth` | `number` | `96` | Card width in px (height is 1.4×). |
| `height` | `number` | `380` | Height of the table in px. |

| Event | Payload | Description |
| --- | --- | --- |
| `play` | `CardFanItem` | A card was played to the table. |
| `deal` | `CardFanItem[]` | Cards were dealt into the hand. |
| `shuffle` | — | A shuffle started. |

| Slot | Props | Description |
| --- | --- | --- |
| `face` | `{ card }` | Card face content. |
| `back` | — | Card back content. |
| `controls` | `{ deal, shuffle, draw, busy, deckCount, handCount, played }` | Rendered under the table. |

`deal(count?)`, `shuffle()` and `draw()` are also exposed on the component ref.
