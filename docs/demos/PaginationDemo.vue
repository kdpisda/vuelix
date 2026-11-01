<script setup lang="ts">
import { Pagination } from '@/components/ui/pagination'
import { computed, ref } from 'vue'

const page = ref(6)
const small = ref(2)
const perPage = 12
const totalItems = 240
const from = computed(() => (page.value - 1) * perPage + 1)
const to = computed(() => Math.min(page.value * perPage, totalItems))
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <div class="flex flex-col items-center gap-3">
      <Pagination v-model:page="page" :total="totalItems / perPage" />
      <p class="m-0 text-xs tabular-nums text-muted-foreground">
        Showing {{ from }}–{{ to }} of {{ totalItems }} results
      </p>
    </div>
    <Pagination v-model:page="small" :total="5" label="Steps" />
  </div>
</template>
