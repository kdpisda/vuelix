<script setup lang="ts">
import { Alert } from '@/components/ui/alert'
import { SpringButton } from '@/components/ui/spring-button'
import { computed, reactive } from 'vue'

const open = reactive({ info: true, success: true, warning: true, error: true })
const anyClosed = computed(() => Object.values(open).includes(false))

function reset() {
  open.info = open.success = open.warning = open.error = true
}
</script>

<template>
  <div class="flex w-full max-w-md flex-col">
    <Alert v-model:open="open.info" variant="info" title="New version available" dismissible class="mb-3">
      vuelix 1.2 ships nine new components. Refresh to update.
    </Alert>
    <Alert v-model:open="open.success" variant="success" title="Deployment complete" dismissible class="mb-3">
      Production is live at vuelix.dev.
    </Alert>
    <Alert v-model:open="open.warning" variant="warning" title="Storage almost full" dismissible class="mb-3">
      You've used 92% of your 10 GB plan.
    </Alert>
    <Alert v-model:open="open.error" variant="error" title="Payment failed" dismissible class="mb-3">
      Your card was declined. Update your billing details to keep your workspace.
    </Alert>
    <div class="flex h-8 justify-center">
      <SpringButton v-if="anyClosed" variant="outline" size="sm" @click="reset">
        Bring them back
      </SpringButton>
    </div>
  </div>
</template>
