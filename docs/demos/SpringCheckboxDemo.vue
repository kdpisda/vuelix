<script setup lang="ts">
import { SpringCheckbox } from '@/ui/spring-checkbox'
import { computed, reactive } from 'vue'

const channels = reactive([
  { id: 'email', label: 'Email digests', checked: true },
  { id: 'push', label: 'Push notifications', checked: false },
  { id: 'sms', label: 'SMS alerts', checked: true },
])

const all = computed({
  get: () => channels.every(c => c.checked),
  set: (v: boolean) => channels.forEach(c => (c.checked = v)),
})
const some = computed(() => channels.some(c => c.checked) && !all.value)
</script>

<template>
  <div class="flex w-64 flex-col gap-3">
    <SpringCheckbox v-model="all" :indeterminate="some" class="font-medium">
      Notify me via…
    </SpringCheckbox>
    <div class="ml-2.5 flex flex-col gap-3 border-l pl-5">
      <SpringCheckbox v-for="c in channels" :key="c.id" v-model="c.checked">
        {{ c.label }}
      </SpringCheckbox>
      <SpringCheckbox disabled class="text-muted-foreground">
        Carrier pigeon
      </SpringCheckbox>
    </div>
  </div>
</template>
