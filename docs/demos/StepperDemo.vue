<script setup lang="ts">
import { Stepper } from '@/components/ui/stepper'
import { SpringButton } from '@/components/ui/spring-button'
import { ref } from 'vue'

const steps = [
  { title: 'Account', description: 'Email & password' },
  { title: 'Workspace', description: 'Name your team' },
  { title: 'Invite', description: 'Add teammates' },
  { title: 'Launch', description: 'Review & go' },
]
const step = ref(1)
const orientation = ref<'horizontal' | 'vertical'>('horizontal')
</script>

<template>
  <div class="flex w-full max-w-xl flex-col items-center gap-8">
    <div class="flex w-full justify-center" :class="orientation === 'vertical' && 'max-w-xs'">
      <Stepper v-model:step="step" :steps="steps" :orientation="orientation" />
    </div>

    <div class="flex flex-wrap items-center justify-center gap-2">
      <SpringButton variant="outline" size="sm" :disabled="step === 0" @click="step--">
        Back
      </SpringButton>
      <SpringButton size="sm" :disabled="step === steps.length" @click="step++">
        {{ step >= steps.length - 1 ? 'Finish' : 'Next' }}
      </SpringButton>
      <span class="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <SpringButton variant="ghost" size="sm" @click="orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal'">
        {{ orientation === 'horizontal' ? 'Vertical' : 'Horizontal' }}
      </SpringButton>
    </div>
  </div>
</template>
