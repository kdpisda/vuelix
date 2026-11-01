<script setup lang="ts">
import { NumberTicker } from '@/ui/number-ticker'
import { SpringButton } from '@/ui/spring-button'
import { ref } from 'vue'

const revenue = ref(48291)
function bump() {
  revenue.value += Math.round(Math.random() * 9000 - 2500)
}
</script>

<template>
  <div class="flex flex-col items-center gap-6 text-center">
    <div>
      <p class="m-0 text-sm text-muted-foreground">
        Monthly revenue
      </p>
      <NumberTicker
        :value="revenue"
        :format="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        locale="en-US"
        class="text-5xl font-semibold"
      />
    </div>
    <div class="flex gap-10">
      <div>
        <NumberTicker :value="12840" class="text-2xl font-semibold" />
        <p class="m-0 text-xs text-muted-foreground">
          Users
        </p>
      </div>
      <div>
        <NumberTicker :value="99.98" :format="{ maximumFractionDigits: 2, minimumFractionDigits: 2 }" class="text-2xl font-semibold" />
        <p class="m-0 text-xs text-muted-foreground">
          Uptime %
        </p>
      </div>
    </div>
    <SpringButton variant="outline" size="sm" @click="bump">
      Randomize
    </SpringButton>
  </div>
</template>
