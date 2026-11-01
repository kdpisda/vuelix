<script setup lang="ts">
import type { TokenSwapQuote, TokenSwapToken } from '@/ui/token-swap'
import { TokenSwap } from '@/ui/token-swap'
import { ref } from 'vue'

// Mock data — prices in USD.
const tokens: TokenSwapToken[] = [
  { symbol: 'ETH', name: 'Ether', price: 3412.2, balance: 2.4815, color: '#627eea' },
  { symbol: 'USDC', name: 'USD Coin', price: 1, balance: 1250.32, color: '#2775ca' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', price: 67150.5, balance: 0.0821, color: '#f09242' },
  { symbol: 'SOL', name: 'Solana', price: 172.84, balance: 31.2, color: '#9945ff' },
  { symbol: 'DAI', name: 'Dai Stablecoin', price: 0.9998, balance: 0, color: '#f5ac37' },
  { symbol: 'ARB', name: 'Arbitrum', price: 0.81, balance: 940, color: '#28a0f0' },
]

const amount = ref('1.25')

async function action(quote: TokenSwapQuote) {
  await new Promise(resolve => setTimeout(resolve, 1400))
  if (quote.priceImpact > 20)
    throw new Error('Price moved too much — try a smaller amount.')
}
</script>

<template>
  <TokenSwap v-model:amount="amount" :tokens="tokens" :action="action" />
</template>
