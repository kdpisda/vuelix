<script setup lang="ts">
import type { HTMLAttributes, VNode } from 'vue'
import type { ChatMessageFrom } from './ChatBubble.vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { Comment, computed, Fragment, onBeforeUnmount, onMounted, ref, Text, useId, useSlots } from 'vue'
import { cn } from '@/lib/utils'
import ChatBubble from './ChatBubble.vue'

export type ChatMessageAction = 'copy' | 'retry' | 'like' | 'dislike'
export type ChatMessageFeedback = 'like' | 'dislike' | null

const props = withDefaults(defineProps<{
  from?: ChatMessageFrom
  /** Display name. Defaults to "You" / "Assistant". */
  author?: string
  /** Avatar image URL. Without it the `avatar` slot, `initials` or a default glyph is shown. */
  avatar?: string
  initials?: string
  /** A string is shown as-is; a `Date` is formatted as a local time after mount. */
  timestamp?: string | Date
  /** Plain-text content. Also what the copy action copies (falls back to the bubble's text). */
  content?: string
  /** Text is still arriving: shows a caret (or typing dots when empty) and hides the actions. */
  streaming?: boolean
  /** Hover actions. Defaults to copy/retry/like/dislike for the assistant and copy for the user. */
  actions?: ChatMessageAction[]
  /** Hide the avatar column (e.g. for consecutive messages from the same author). */
  hideAvatar?: boolean
  /** Play the entrance animation on mount. Turn off for history loaded in bulk. */
  appear?: boolean
  class?: HTMLAttributes['class']
}>(), {
  from: 'assistant',
  streaming: false,
  hideAvatar: false,
  appear: true,
})

const feedback = defineModel<ChatMessageFeedback>('feedback', { default: null })
const emit = defineEmits<{
  copy: [text: string]
  retry: []
}>()

const slots = useSlots()
const reduced = useReducedMotion()
const uid = useId()
const isUser = computed(() => props.from === 'user')
const name = computed(() => props.author ?? (isUser.value ? 'You' : 'Assistant'))
const actionList = computed(() => props.actions ?? (isUser.value ? ['copy'] : ['copy', 'retry', 'like', 'dislike']))

/** True when nothing renders yet — an absent slot, or one that only produces comments / whitespace. */
function hasContent(nodes: VNode[] | undefined): boolean {
  return !!nodes?.some((n) => {
    if (n.type === Comment)
      return false
    if (n.type === Text)
      return String(n.children).trim() !== ''
    if (n.type === Fragment)
      return hasContent(n.children as VNode[])
    return true
  })
}
const isEmpty = () => !props.content && !hasContent(slots.default?.())

// Format Date timestamps only on the client, so SSR and hydration never disagree on time zones.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
const time = computed(() => {
  const ts = props.timestamp
  if (!ts || typeof ts === 'string')
    return ts
  return mounted.value ? ts.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
})
const iso = computed(() => (props.timestamp instanceof Date ? props.timestamp.toISOString() : undefined))

const bubble = ref<{ $el: HTMLElement }>()
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
async function copy() {
  const text = props.content ?? bubble.value?.$el.textContent?.trim() ?? ''
  try {
    await navigator.clipboard?.writeText(text)
  }
  catch {}
  emit('copy', text)
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 1600)
}
onBeforeUnmount(() => clearTimeout(copiedTimer))

function vote(v: 'like' | 'dislike') {
  feedback.value = feedback.value === v ? null : v
}

const spring = { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 } as const
const enter = computed(() => {
  if (!props.appear)
    return false
  return reduced.value
    ? { opacity: 0 }
    : { opacity: 0, y: 12, x: isUser.value ? 10 : -10, scale: 0.97, filter: 'blur(4px)' }
})

const iconBtn = 'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:text-foreground'
</script>

<template>
  <motion.article
    :aria-labelledby="`${uid}-author`"
    :class="cn('group/message flex w-full gap-3', isUser && 'flex-row-reverse', props.class)"
    :initial="enter"
    :animate="{ opacity: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)' }"
    :transition="spring"
    :style="{ transformOrigin: isUser ? '100% 100%' : '0% 100%' }"
  >
    <div v-if="!props.hideAvatar" class="mt-0.5 shrink-0" aria-hidden="true">
      <slot name="avatar">
        <img v-if="props.avatar" :src="props.avatar" alt="" class="size-8 rounded-full bg-muted object-cover">
        <span
          v-else
          :class="cn(
            'grid size-8 place-items-center rounded-full text-xs font-semibold',
            isUser ? 'bg-muted text-foreground' : 'bg-brand/15 text-brand',
          )"
        >
          <template v-if="props.initials">{{ props.initials }}</template>
          <svg v-else-if="isUser" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
          <svg v-else class="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5c.4 4.6 2.9 7.1 7.5 7.5-4.6.4-7.1 2.9-7.5 7.5-.4-4.6-2.9-7.1-7.5-7.5 4.6-.4 7.1-2.9 7.5-7.5Z" /><path d="M19 15.5c.2 2 1.3 3.1 3.3 3.3-2 .2-3.1 1.3-3.3 3.3-.2-2-1.3-3.1-3.3-3.3 2-.2 3.1-1.3 3.3-3.3Z" opacity=".6" /></svg>
        </span>
      </slot>
    </div>

    <div :class="cn('flex min-w-0 max-w-[85%] flex-col gap-1', isUser ? 'items-end' : 'items-start')">
      <div :class="cn('flex items-baseline gap-2 px-1 text-xs', isUser && 'flex-row-reverse')">
        <span :id="`${uid}-author`" class="font-medium text-foreground">{{ name }}</span>
        <time v-if="time" :datetime="iso" class="text-muted-foreground tabular-nums">{{ time }}</time>
        <slot name="meta" />
      </div>

      <ChatBubble ref="bubble" :from="props.from" :streaming="props.streaming && !isEmpty()">
        <span v-if="props.streaming && isEmpty()" class="flex h-6 items-center gap-1" role="status">
          <span class="sr-only">{{ name }} is typing</span>
          <motion.span
            v-for="i in 3"
            :key="i"
            aria-hidden="true"
            class="size-1.5 rounded-full bg-current opacity-60"
            :animate="reduced ? { opacity: 0.6 } : { y: [0, -4, 0], opacity: [0.35, 0.9, 0.35] }"
            :transition="{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: (i - 1) * 0.15 }"
          />
        </span>
        <slot v-else>
          <p class="whitespace-pre-wrap">
            {{ props.content }}
          </p>
        </slot>
      </ChatBubble>

      <div
        v-if="!props.streaming && actionList.length"
        role="toolbar"
        :aria-label="`Actions for ${name}'s message`"
        :class="cn(
          'flex h-7 items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover/message:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100',
          isUser && 'flex-row-reverse',
          feedback && 'opacity-100',
        )"
      >
        <button
          v-if="actionList.includes('copy')"
          type="button"
          :class="iconBtn"
          :aria-label="copied ? 'Copied' : 'Copy message'"
          @click="copy"
        >
          <AnimatePresence mode="popLayout" :initial="false">
            <motion.svg
              v-if="copied"
              key="check"
              class="size-3.5 text-brand"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              :initial="{ scale: 0.4, opacity: 0, rotate: -30 }"
              :animate="{ scale: 1, opacity: 1, rotate: 0 }"
              :exit="{ scale: 0.4, opacity: 0 }"
              :transition="spring"
            >
              <path d="M5 12.5 10 17 19 7" />
            </motion.svg>
            <motion.svg
              v-else
              key="copy"
              class="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              :initial="{ scale: 0.4, opacity: 0 }"
              :animate="{ scale: 1, opacity: 1 }"
              :exit="{ scale: 0.4, opacity: 0 }"
              :transition="spring"
            >
              <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
            </motion.svg>
          </AnimatePresence>
        </button>
        <button
          v-if="actionList.includes('retry')"
          type="button"
          :class="iconBtn"
          aria-label="Regenerate response"
          @click="emit('retry')"
        >
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></svg>
        </button>
        <template v-for="v in (['like', 'dislike'] as const)" :key="v">
          <motion.button
            v-if="actionList.includes(v)"
            type="button"
            :class="iconBtn"
            :aria-label="v === 'like' ? 'Good response' : 'Bad response'"
            :aria-pressed="feedback === v"
            :while-press="{ scale: 0.82 }"
            :transition="spring"
            @click="vote(v)"
          >
            <motion.svg
              class="size-3.5"
              :class="v === 'dislike' && '-scale-y-100'"
              viewBox="0 0 24 24"
              :fill="feedback === v ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              :animate="{ scale: feedback === v && !reduced ? [1, 1.35, 1] : 1 }"
              :transition="{ duration: 0.35 }"
            >
              <path d="M7 10v11" /><path d="M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7A2 2 0 0 1 17.5 21H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h2.8a2 2 0 0 0 1.8-1.1L12 3a3.1 3.1 0 0 1 3 2.9Z" />
            </motion.svg>
          </motion.button>
        </template>
        <slot name="actions" />
      </div>
    </div>
  </motion.article>
</template>
