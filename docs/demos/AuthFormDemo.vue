<script setup lang="ts">
import type { AuthFormMode, AuthFormPayload } from '@/components/ui/auth-form'
import { AuthForm } from '@/components/ui/auth-form'
import { ref } from 'vue'

const mode = ref<AuthFormMode>('sign-up')

// Fake backend: one taken address, everything else succeeds after a short wait.
async function action(payload: AuthFormPayload) {
  await new Promise(resolve => setTimeout(resolve, 1100))
  if (payload.mode === 'sign-up' && payload.email === 'taken@acme.dev')
    throw new Error('An account with this email already exists.')
}
</script>

<template>
  <AuthForm v-model:mode="mode" :action="action" />
</template>
