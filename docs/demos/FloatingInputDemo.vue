<script setup lang="ts">
import { FloatingInput } from '@/components/ui/floating-input'
import { AtSign, KeyRound, User } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const name = ref('Ada Lovelace')
const email = ref('')
const password = ref('')
const touched = ref(false)

const emailError = computed(() =>
  touched.value && email.value && !/^\S+@\S+\.\S+$/.test(email.value) ? 'Enter a valid email address' : undefined,
)
const passwordError = computed(() =>
  password.value && password.value.length < 8 ? 'Use at least 8 characters' : undefined,
)
</script>

<template>
  <form class="flex w-full max-w-sm flex-col gap-4" @submit.prevent>
    <FloatingInput v-model="name" label="Full name" autocomplete="name" clearable>
      <template #icon>
        <User />
      </template>
    </FloatingInput>
    <FloatingInput
      v-model="email"
      label="Email"
      type="email"
      autocomplete="email"
      placeholder="you@example.com"
      hint="We'll never share it."
      :error="emailError"
      clearable
      @blur="touched = true"
    >
      <template #icon>
        <AtSign />
      </template>
    </FloatingInput>
    <FloatingInput
      v-model="password"
      label="Password"
      type="password"
      autocomplete="new-password"
      :error="passwordError"
    >
      <template #icon>
        <KeyRound />
      </template>
    </FloatingInput>
  </form>
</template>
