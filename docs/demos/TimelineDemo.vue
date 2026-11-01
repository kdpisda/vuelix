<script setup lang="ts">
import type { TimelineItem } from '@/ui/timeline'
import { Timeline } from '@/ui/timeline'
import { CreditCard, PackageCheck, PackageOpen, Truck, Warehouse } from 'lucide-vue-next'

const items: TimelineItem[] = [
  { title: 'Order placed', description: 'Payment confirmed with Visa ending 4242.', time: 'Mar 3, 09:12', datetime: '2025-03-03T09:12', icon: CreditCard },
  { title: 'Packed', description: 'Two items packed at the Rotterdam warehouse.', time: 'Mar 3, 16:40', datetime: '2025-03-03T16:40', icon: PackageOpen },
  { title: 'Left the warehouse', description: 'Handed to the carrier, tracking DHL 7310 4482.', time: 'Mar 4, 07:05', datetime: '2025-03-04T07:05', icon: Warehouse },
  { title: 'Out for delivery', description: 'Your driver is about 6 stops away.', time: 'Today, 10:28', datetime: '2025-03-05T10:28', icon: Truck, current: true },
  { title: 'Delivered', description: 'Expected between 12:00 and 14:00.', time: 'Est. 13:00', icon: PackageCheck },
]
</script>

<template>
  <Timeline :items="items" class="max-w-md" />
</template>
