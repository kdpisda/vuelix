<script setup lang="ts">
import { SpringButton } from '@/components/ui/spring-button'
import { toast, ToastStack } from '@/components/ui/toast-stack'

const samples = [
  () => toast.success('Deployment complete', { description: 'vuelix-docs is live on production.' }),
  () => toast('Invite sent', { description: 'We emailed ana@example.com.' }),
  () => toast.info('New version available', { description: 'Refresh to update to v1.2.0.' }),
  () => toast.error('Payment failed', { description: 'Your card was declined.' }),
]
let i = 0
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <SpringButton @click="samples[i++ % samples.length]!()">
      Show a toast
    </SpringButton>
    <p class="m-0 text-xs text-muted-foreground">
      Fire a few, then hover the stack.
    </p>
    <ToastStack />
  </div>
</template>
