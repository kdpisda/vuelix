<script setup lang="ts">
import { OtpInput } from '@/ui/otp-input'
import { ref } from 'vue'

const code = ref('')
const invalid = ref(false)
const ok = ref(false)

function check(value: string) {
  ok.value = value === '424242'
  invalid.value = !ok.value
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <OtpInput
      v-model="code"
      :group-size="3"
      :invalid="invalid"
      @update:model-value="invalid = false; ok = false"
      @complete="check"
    />
    <p class="m-0 h-5 text-sm" :class="ok ? 'text-emerald-500' : invalid ? 'text-destructive' : 'text-muted-foreground'">
      {{ ok ? 'Verified!' : invalid ? 'That code is not right — try 424242' : 'Enter 424242' }}
    </p>
  </div>
</template>
