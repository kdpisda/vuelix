<script setup lang="ts">
import { SpringButton } from '@/components/ui/spring-button'
import { ref } from 'vue'

const loading = ref(false)
function save() {
  loading.value = true
  setTimeout(() => (loading.value = false), 1800)
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <SpringButton :loading="loading" @click="save">
      Save changes
      <template #loading>
        Saving…
      </template>
    </SpringButton>
    <SpringButton variant="outline">
      Outline
    </SpringButton>
    <SpringButton variant="secondary">
      Secondary
    </SpringButton>
    <SpringButton variant="brand">
      Brand
    </SpringButton>
  </div>
</template>
