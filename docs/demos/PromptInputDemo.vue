<script setup lang="ts">
import type { PromptAttachment } from '@/ui/prompt-input'
import { PromptInput } from '@/ui/prompt-input'
import { ChevronDown, Globe } from 'lucide-vue-next'
import { AnimatePresence, motion } from 'motion-v'
import { onBeforeUnmount, ref } from 'vue'

const text = ref('')
const files = ref<PromptAttachment[]>([
  { id: 'q3', name: 'q3-revenue.pdf', size: 2_480_000, type: 'application/pdf' },
])
const model = ref('nova-2')
const web = ref(false)
const loading = ref(false)
const sent = ref<{ text: string, files: number } | null>(null)
const reply = ref('')

const answer = 'Revenue grew 18% quarter over quarter, driven mostly by the new annual plans. Churn ticked up slightly in the SMB segment — worth a closer look before the board meeting.'
let timer: ReturnType<typeof setInterval> | undefined

function onSubmit(value: string, attachments: PromptAttachment[]) {
  sent.value = { text: value || 'Summarize the attached file', files: attachments.length }
  reply.value = ''
  loading.value = true
  const words = answer.split(/(?<= )/)
  let i = 0
  setTimeout(() => {
    if (!loading.value)
      return
    timer = setInterval(() => {
      reply.value += words[i++] ?? ''
      if (i >= words.length)
        stop()
    }, 80)
  }, 900)
}

function stop() {
  clearInterval(timer)
  loading.value = false
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-4">
    <AnimatePresence>
      <motion.div
        v-if="sent"
        class="flex flex-col gap-2 rounded-xl border bg-card/60 p-3 text-sm"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0 }"
      >
        <p class="m-0 whitespace-pre-line font-medium">
          {{ sent.text }}
          <span v-if="sent.files" class="ml-1 text-xs font-normal text-muted-foreground">· {{ sent.files }} file{{ sent.files > 1 ? 's' : '' }}</span>
        </p>
        <p class="m-0 min-h-6 leading-6 text-muted-foreground" aria-live="polite">
          {{ reply || (loading ? 'Reading q3-revenue.pdf…' : 'Stopped.') }}
        </p>
      </motion.div>
    </AnimatePresence>

    <PromptInput
      v-model="text"
      v-model:attachments="files"
      :loading="loading"
      :max-length="2000"
      placeholder="Ask about your reports…"
      @submit="onSubmit"
      @stop="stop"
    >
      <template #model>
        <label class="relative inline-flex h-8 items-center rounded-lg text-xs font-medium text-muted-foreground transition-colors focus-within:ring-[3px] focus-within:ring-ring/50 hover:bg-muted hover:text-foreground">
          <span class="sr-only">Model</span>
          <select v-model="model" class="h-full cursor-pointer appearance-none bg-transparent pl-2.5 pr-7 outline-none [field-sizing:content]">
            <option value="nova-2">Nova 2</option>
            <option value="nova-2-mini">Nova 2 Mini</option>
            <option value="nova-reason">Nova Reason</option>
          </select>
          <ChevronDown class="pointer-events-none absolute right-2 size-3.5" aria-hidden="true" />
        </label>
      </template>
      <template #tools>
        <button
          type="button"
          :aria-pressed="web"
          class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-brand/15 aria-pressed:text-brand"
          @click="web = !web"
        >
          <Globe class="size-3.5" aria-hidden="true" />
          Search
        </button>
      </template>
    </PromptInput>
  </div>
</template>
