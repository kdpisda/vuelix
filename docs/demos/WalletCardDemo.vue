<script setup lang="ts">
import type { WalletCardItem } from '@/ui/wallet-card'
import { WalletCard } from '@/ui/wallet-card'
import { ref } from 'vue'

const cards: WalletCardItem[] = [
  {
    id: 'everyday',
    label: 'Everyday',
    brand: 'VISA',
    number: '4929 1840 3302 7741',
    holder: 'Mara Lindqvist',
    expiry: '09/29',
    cvv: '381',
    balance: 4821.36,
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)',
    foreground: '#f8fafc',
    transactions: [
      { id: 't1', merchant: 'Blue Bottle Coffee', amount: -6.5, date: 'Today, 08:12' },
      { id: 't2', merchant: 'Salary — Northwind', amount: 3200, date: 'Yesterday' },
      { id: 't3', merchant: 'Rail Pass', amount: -42, date: 'Oct 29' },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    brand: 'Mastercard',
    number: '5412 7534 9921 0458',
    holder: 'Mara Lindqvist',
    expiry: '02/28',
    cvv: '704',
    balance: 12940.08,
    background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0e7490 100%)',
    foreground: '#ecfdf5',
    transactions: [
      { id: 't4', merchant: 'Lisbon Airbnb', amount: -612.4, date: 'Oct 30' },
      { id: 't5', merchant: 'TAP Air Portugal', amount: -389, date: 'Oct 22' },
      { id: 't6', merchant: 'Refund — Hotel Duo', amount: 74.2, date: 'Oct 18' },
    ],
  },
  {
    id: 'savings',
    label: 'Savings',
    brand: 'AMEX',
    number: '3714 496353 98431',
    holder: 'Mara Lindqvist',
    expiry: '11/30',
    cvv: '5521',
    balance: 28310.5,
    background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 55%, #e11d48 100%)',
    foreground: '#fff7ed',
    transactions: [
      { id: 't7', merchant: 'Monthly transfer', amount: 800, date: 'Nov 1' },
      { id: 't8', merchant: 'Interest', amount: 41.18, date: 'Oct 31' },
    ],
  },
]

const active = ref('everyday')
</script>

<template>
  <WalletCard v-model:active="active" :cards="cards" locale="en-US" />
</template>
