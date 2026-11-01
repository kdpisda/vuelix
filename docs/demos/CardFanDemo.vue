<script setup lang="ts">
import type { CardFanItem } from '@/ui/card-fan'
import { CardFan } from '@/ui/card-fan'
import { Hand, Shuffle } from 'lucide-vue-next'

const suits = [
  { symbol: '♠', name: 'spades', color: undefined },
  { symbol: '♥', name: 'hearts', color: '#e11d48' },
  { symbol: '♦', name: 'diamonds', color: '#f97316' },
  { symbol: '♣', name: 'clubs', color: undefined },
]
const ranks = [
  { rank: 'A', name: 'Ace' },
  { rank: 'K', name: 'King' },
  { rank: 'Q', name: 'Queen' },
  { rank: '7', name: 'Seven' },
]

const cards: CardFanItem[] = suits.flatMap(s => ranks.map(r => ({
  id: `${r.rank}${s.symbol}`,
  rank: r.rank,
  symbol: s.symbol,
  title: r.name,
  color: s.color,
  label: `${r.name} of ${s.name}`,
})))
</script>

<template>
  <CardFan :cards="cards" :hand-size="5" class="max-w-2xl">
    <template #controls="{ shuffle, draw, busy, deckCount, played }">
      <div class="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
          :disabled="busy"
          @click="shuffle"
        >
          <Shuffle class="size-4" /> Shuffle &amp; deal
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3.5 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
          :disabled="busy || !deckCount"
          @click="draw"
        >
          <Hand class="size-4" /> Draw ({{ deckCount }})
        </button>
        <span class="w-full text-center text-xs text-muted-foreground">
          {{ played.length ? `Last played: ${played.at(-1)!.label}` : 'Click a card to play it' }}
        </span>
      </div>
    </template>
  </CardFan>
</template>
