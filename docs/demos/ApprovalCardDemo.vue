<script setup lang="ts">
import type { ApprovalCardStatus } from '@/components/ui/approval-card'
import { ApprovalCard } from '@/components/ui/approval-card'
import { Mail, RotateCcw, Terminal } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const shell = ref<ApprovalCardStatus>('pending')
const email = ref<ApprovalCardStatus>('pending')
const log = ref<string[]>([])

const anyResolved = computed(() => shell.value !== 'pending' || email.value !== 'pending')

function reset() {
  shell.value = 'pending'
  email.value = 'pending'
  log.value = []
}
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-3">
    <ApprovalCard
      v-model:status="shell"
      title="Run a shell command"
      description="The agent wants to clear the build cache and rebuild the docs."
      risk="medium"
      :details="{ Command: 'rm -rf .vitepress/cache && pnpm build', Directory: '~/code/vuelix/docs', Timeout: '120 s' }"
      approve-label="Run command"
      @approve="log.push('shell: approved')"
      @deny="log.push('shell: denied')"
    >
      <template #icon>
        <Terminal class="size-4" />
      </template>
    </ApprovalCard>

    <ApprovalCard
      v-model:status="email"
      title="Send an email campaign"
      description="Announce the v2 launch to everyone on the newsletter list."
      risk="high"
      :details="[
        { label: 'Recipients', value: '12,408 subscribers' },
        { label: 'Subject', value: 'vuelix 2.0 is here' },
        { label: 'Send at', value: 'Immediately' },
      ]"
      approve-label="Send"
      deny-label="Not now"
      @approve="log.push('email: approved')"
      @deny="log.push('email: denied')"
    >
      <template #icon>
        <Mail class="size-4" />
      </template>
    </ApprovalCard>

    <div class="flex h-8 items-center justify-between text-xs text-muted-foreground">
      <span class="font-mono">{{ log.length ? log.join(' · ') : 'Waiting for your decision…' }}</span>
      <button
        v-if="anyResolved"
        type="button"
        class="inline-flex items-center gap-1 rounded-md px-2 py-1 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="reset"
      >
        <RotateCcw class="size-3" aria-hidden="true" />
        Reset
      </button>
    </div>
  </div>
</template>
