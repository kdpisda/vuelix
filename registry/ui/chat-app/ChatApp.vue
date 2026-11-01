<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ChatMessageFeedback } from '@/ui/chat-message'
import type { PromptAttachment } from '@/ui/prompt-input'
import { AnimatePresence, motion } from 'motion-v'
import { computed, nextTick, ref } from 'vue'
import { cn } from '@/lib/utils'
import { ChatMessage } from '@/ui/chat-message'
import { ChatScroller } from '@/ui/chat-scroller'
import { PromptInput } from '@/ui/prompt-input'

export interface ChatAppMessage {
  id: string
  from: 'user' | 'assistant'
  content: string
  /** The assistant is still writing this message. */
  streaming?: boolean
  timestamp?: string | Date
  feedback?: ChatMessageFeedback
}

const props = withDefaults(defineProps<{
  /** Conversation title shown in the header. */
  title?: string
  /** Small line under the title (model name, status…). */
  subtitle?: string
  /** A response is being generated (send turns into stop). */
  loading?: boolean
  /** Prompts offered on the empty state. */
  suggestions?: string[]
  /** Heading of the empty state. */
  greeting?: string
  placeholder?: string
  /** Assistant display name + avatar. */
  assistantName?: string
  assistantAvatar?: string
  allowAttachments?: boolean
  class?: HTMLAttributes['class']
}>(), {
  title: 'New chat',
  suggestions: () => [],
  greeting: 'How can I help you today?',
  placeholder: 'Send a message…',
  assistantName: 'Assistant',
  allowAttachments: true,
})

const messages = defineModel<ChatAppMessage[]>('messages', { default: () => [] })
const draft = defineModel<string>('draft', { default: '' })
const attachments = ref<PromptAttachment[]>([])

const emit = defineEmits<{
  /** The user sent a message. Append the assistant reply to `messages` yourself. */
  send: [text: string, attachments: PromptAttachment[]]
  stop: []
  /** Regenerate the given assistant message. */
  retry: [message: ChatAppMessage]
}>()

const scroller = ref<InstanceType<typeof ChatScroller>>()
const isEmpty = computed(() => messages.value.length === 0)

function send(text: string, files: PromptAttachment[] = []) {
  const value = text.trim()
  if (!value || props.loading)
    return
  emit('send', value, files)
  nextTick(() => scroller.value?.scrollToBottom())
}

function setFeedback(message: ChatAppMessage, value: ChatMessageFeedback) {
  messages.value = messages.value.map(m => (m.id === message.id ? { ...m, feedback: value } : m))
}

const spring = { type: 'spring', stiffness: 320, damping: 30 } as const
</script>

<template>
  <section
    :aria-label="props.title"
    :class="cn('flex h-[560px] w-full flex-col overflow-hidden rounded-2xl border bg-background text-foreground shadow-sm', props.class)"
  >
    <header class="flex shrink-0 items-center gap-3 border-b px-4 py-3">
      <slot name="header">
        <span class="grid size-8 place-items-center rounded-full bg-brand/15 text-brand" aria-hidden="true">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" /><path d="M19 15l.8 1.9 1.9.8-1.9.8L19 20.4l-.8-1.9-1.9-.8 1.9-.8z" /></svg>
        </span>
        <div class="min-w-0 flex-1">
          <AnimatePresence mode="popLayout" :initial="false">
            <motion.p
              :key="props.title"
              class="m-0 truncate text-sm font-semibold"
              :initial="{ opacity: 0, y: 6 }"
              :animate="{ opacity: 1, y: 0 }"
              :exit="{ opacity: 0, y: -6 }"
              :transition="spring"
            >
              {{ props.title }}
            </motion.p>
          </AnimatePresence>
          <p v-if="props.subtitle" class="m-0 truncate text-xs text-muted-foreground">
            {{ props.subtitle }}
          </p>
        </div>
        <slot name="header-actions" />
      </slot>
    </header>

    <div class="relative min-h-0 flex-1">
      <AnimatePresence mode="wait" :initial="false">
        <motion.div
          v-if="isEmpty"
          key="empty"
          class="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center"
          :initial="{ opacity: 0, scale: 0.98 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.98, filter: 'blur(4px)', transition: { duration: 0.18 } }"
        >
          <slot name="empty" :send="send">
            <p class="m-0 text-xl font-semibold tracking-tight">
              {{ props.greeting }}
            </p>
            <ul v-if="props.suggestions.length" class="m-0 grid w-full max-w-lg list-none gap-2 p-0 sm:grid-cols-2">
              <motion.li
                v-for="(s, i) in props.suggestions"
                :key="s"
                :initial="{ opacity: 0, y: 10 }"
                :animate="{ opacity: 1, y: 0, transition: { ...spring, delay: 0.05 * i } }"
              >
                <button
                  type="button"
                  class="w-full rounded-xl border bg-card px-3.5 py-2.5 text-left text-sm text-card-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  @click="send(s)"
                >
                  {{ s }}
                </button>
              </motion.li>
            </ul>
          </slot>
        </motion.div>

        <ChatScroller
          v-else
          key="log"
          ref="scroller"
          :label="`${props.title} messages`"
          class="absolute inset-0"
          content-class="mx-auto w-full max-w-2xl"
        >
          <ChatMessage
            v-for="m in messages"
            :key="m.id"
            :from="m.from"
            :author="m.from === 'assistant' ? props.assistantName : undefined"
            :avatar="m.from === 'assistant' ? props.assistantAvatar : undefined"
            :timestamp="m.timestamp"
            :content="m.content"
            :streaming="m.streaming"
            :feedback="m.feedback ?? null"
            @update:feedback="setFeedback(m, $event)"
            @retry="emit('retry', m)"
          />
        </ChatScroller>
      </AnimatePresence>
    </div>

    <div class="shrink-0 px-4 pb-4 pt-2">
      <PromptInput
        v-model="draft"
        v-model:attachments="attachments"
        class="mx-auto max-w-2xl"
        :placeholder="props.placeholder"
        :loading="props.loading"
        :allow-attachments="props.allowAttachments"
        clear-on-submit
        @submit="send"
        @stop="emit('stop')"
      />
    </div>
  </section>
</template>
