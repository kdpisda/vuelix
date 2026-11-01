<script setup lang="ts">
import { Collapsible } from '@/ui/collapsible'
import { ShoppingBag } from 'lucide-vue-next'
import { ref } from 'vue'

const open = ref(false)
const panel = ref<InstanceType<typeof Collapsible>>()

const items = [
  { name: 'Merino crew sweater', detail: 'Oat · M', price: 128 },
  { name: 'Selvedge denim', detail: 'Indigo · 32', price: 165 },
  { name: 'Canvas tote', detail: 'Natural', price: 38 },
]
const total = items.reduce((sum, item) => sum + item.price, 0)
</script>

<template>
  <div class="w-full max-w-sm space-y-3">
    <Collapsible ref="panel" v-model:open="open">
      <template #trigger>
        <span class="flex items-center gap-3">
          <span class="flex size-8 items-center justify-center rounded-lg bg-muted">
            <ShoppingBag class="size-4" />
          </span>
          <span class="flex-1">
            <span class="block">Order summary</span>
            <span class="block text-xs font-normal text-muted-foreground">{{ items.length }} items · ships Thursday</span>
          </span>
          <span class="tabular-nums">${{ total }}</span>
        </span>
      </template>
      <ul class="m-0 list-none divide-y p-0">
        <li v-for="item in items" :key="item.name" class="flex items-center justify-between gap-3 py-2.5">
          <span>
            <span class="block text-foreground">{{ item.name }}</span>
            <span class="block text-xs">{{ item.detail }}</span>
          </span>
          <span class="tabular-nums text-foreground">${{ item.price }}</span>
        </li>
      </ul>
    </Collapsible>
    <p class="m-0 flex items-center justify-between text-xs text-muted-foreground">
      <span>State: <code>{{ open ? 'open' : 'closed' }}</code></span>
      <button
        type="button"
        class="rounded-md px-2 py-1 font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="panel?.toggle()"
      >
        Toggle from outside
      </button>
    </p>
  </div>
</template>
